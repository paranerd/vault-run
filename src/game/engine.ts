import {
  MAX_OFFLINE_SECONDS,
  SECURITY,
  TAP_COOLDOWN_MS,
  cargoCapacity,
  chestCapacity,
  expressDuration,
  passiveRate,
  tapValue,
  transportDuration,
  upgradeCost,
  vaultCapacity,
} from './config'
import type { GameEvent, GameState, OfflineReport, UpgradeId } from './types'

const STEP_MS = 500

export function createInitialState(now = Date.now()): GameState {
  return {
    schemaVersion: 3,
    savedAt: now,
    lastTick: now,
    chestGold: 0,
    vaultGold: 0,
    inTransitGold: 0,
    lifetimeGold: 0,
    lostGold: 0,
    stolenGold: 0,
    tapReadyAt: 0,
    tapLevel: 0,
    staffLevel: 0,
    chestLevel: 0,
    transportLevel: 0,
    courierUnlocked: false,
    cargoLevel: 0,
    convoyLevel: 0,
    vaultLevel: 0,
    securityLevel: 0,
    threat: 0,
    transportStartedAt: null,
    transportDeliveredAt: null,
    transportEndsAt: null,
    expressGold: 0,
    expressStartedAt: null,
    expressDeliveredAt: null,
    expressEndsAt: null,
    tripCount: 0,
    theftCount: 0,
    eventSequence: 0,
    events: [],
  }
}

function addEvent(state: GameState, kind: GameEvent['kind'], message: string): void {
  state.eventSequence += 1
  state.events = [{ id: state.eventSequence, kind, message }, ...state.events].slice(0, 5)
}

function storeGold(state: GameState, amount: number, report?: OfflineReport): number {
  if (amount <= 0) return 0
  const free = Math.max(0, chestCapacity(state) - state.chestGold)
  const stored = Math.min(free, amount)
  state.chestGold += stored
  state.lifetimeGold += stored
  state.lostGold += amount - stored
  if (report) report.earned += stored
  return stored
}

export function tap(state: GameState, now = Date.now()): GameState {
  if (state.transportEndsAt !== null && !state.courierUnlocked) return state
  if (state.chestGold >= chestCapacity(state)) return state
  if (now < state.tapReadyAt) return state
  const next = structuredClone(state)
  storeGold(next, tapValue(next))
  next.tapReadyAt = now + TAP_COOLDOWN_MS
  return next
}

function availableVaultSpace(state: GameState): number {
  return Math.max(0, vaultCapacity(state) - state.vaultGold - state.inTransitGold - state.expressGold)
}

export function startTransport(state: GameState, now = Date.now()): GameState {
  if (state.transportEndsAt !== null || state.chestGold <= 0) return state
  const payload = Math.min(state.chestGold, cargoCapacity(state), availableVaultSpace(state))
  if (payload <= 0) {
    const blocked = structuredClone(state)
    addEvent(blocked, 'warning', 'Der Tresor ist voll.')
    return blocked
  }
  const next = structuredClone(state)
  next.chestGold -= payload
  next.inTransitGold = payload
  next.transportStartedAt = now
  const duration = transportDuration(next) * 1000
  next.transportDeliveredAt = now + duration / 2
  next.transportEndsAt = now + duration
  return next
}

export function startExpressTransport(state: GameState, now = Date.now()): GameState {
  if (!state.courierUnlocked || state.expressEndsAt !== null || state.chestGold <= 0) return state
  const payload = Math.min(state.chestGold, cargoCapacity(state), availableVaultSpace(state))
  if (payload <= 0) return state
  const next = structuredClone(state)
  next.chestGold -= payload
  next.expressGold = payload
  next.expressStartedAt = now
  const duration = expressDuration(next) * 1000
  next.expressDeliveredAt = now + duration / 2
  next.expressEndsAt = now + duration
  return next
}

function deliverTransport(state: GameState, express: boolean, report?: OfflineReport): void {
  const delivered = express ? state.expressGold : state.inTransitGold
  state.vaultGold = Math.min(vaultCapacity(state), state.vaultGold + delivered)
  if (express) state.expressGold = 0
  else state.inTransitGold = 0
  if (report) report.delivered += delivered
  if (delivered > 0) addEvent(state, 'success', `${Math.floor(delivered)} Gold sicher im Tresor.`)
}

function completeTransport(state: GameState): void {
  state.inTransitGold = 0
  state.transportStartedAt = null
  state.transportDeliveredAt = null
  state.transportEndsAt = null
  state.tripCount += 1
}

function completeExpressTransport(state: GameState): void {
  state.expressGold = 0
  state.expressStartedAt = null
  state.expressDeliveredAt = null
  state.expressEndsAt = null
  state.tripCount += 1
}

function runTheft(state: GameState, report?: OfflineReport): void {
  const security = SECURITY[state.securityLevel]
  const stolen = state.chestGold * security.loss
  state.chestGold -= stolen
  state.stolenGold += stolen
  state.theftCount += 1
  state.threat = 8
  if (report) report.stolen += stolen
  addEvent(state, 'warning', `Einbruch: ${Math.ceil(stolen)} ungesichertes Gold verloren.`)
}

export function advanceGame(input: GameState, now = Date.now(), offline = false): GameState {
  if (now <= input.lastTick) return input
  const state = structuredClone(input)
  const elapsedMs = Math.min(now - state.lastTick, MAX_OFFLINE_SECONDS * 1000)
  const target = state.lastTick + elapsedMs
  const report: OfflineReport | undefined = offline
    ? { seconds: elapsedMs / 1000, earned: 0, delivered: 0, stolen: 0 }
    : undefined

  let cursor = state.lastTick
  while (cursor < target) {
    if (state.courierUnlocked && state.transportEndsAt === null && state.chestGold > 0 && state.vaultGold < vaultCapacity(state)) {
      const started = startTransport(state, cursor)
      Object.assign(state, started)
    }

    const nextEvent = Math.min(
      state.inTransitGold > 0 ? state.transportDeliveredAt ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY,
      state.transportEndsAt ?? Number.POSITIVE_INFINITY,
      state.expressGold > 0 ? state.expressDeliveredAt ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY,
      state.expressEndsAt ?? Number.POSITIVE_INFINITY,
    )
    const nextCursor = Math.min(target, cursor + STEP_MS, nextEvent)
    const dt = Math.max(0, nextCursor - cursor) / 1000
    const businessPaused = state.transportEndsAt !== null && !state.courierUnlocked
    if (!businessPaused) storeGold(state, passiveRate(state) * dt, report)

    if (state.chestGold > 0) {
      const fill = state.chestGold / chestCapacity(state)
      state.threat += dt * (0.045 + 0.075 * fill) / SECURITY[state.securityLevel].factor
      if (state.threat >= 100) runTheft(state, report)
    }

    cursor = nextCursor
    if (state.inTransitGold > 0 && state.transportDeliveredAt !== null && cursor >= state.transportDeliveredAt) {
      deliverTransport(state, false, report)
    }
    if (state.expressGold > 0 && state.expressDeliveredAt !== null && cursor >= state.expressDeliveredAt) {
      deliverTransport(state, true, report)
    }
    if (state.transportEndsAt !== null && cursor >= state.transportEndsAt) completeTransport(state)
    if (state.expressEndsAt !== null && cursor >= state.expressEndsAt) completeExpressTransport(state)
  }

  state.lastTick = now
  state.savedAt = now
  if (report && report.seconds >= 5) state.lastOfflineReport = report
  return state
}

export function buyUpgrade(state: GameState, id: UpgradeId): GameState {
  const price = upgradeCost(state, id)
  if (!Number.isFinite(price) || state.vaultGold < price) return state
  if (id === 'cargo' || id === 'convoy') {
    if (!state.courierUnlocked) return state
  }

  const next = structuredClone(state)
  next.vaultGold -= price
  switch (id) {
    case 'tap': next.tapLevel += 1; break
    case 'staff': next.staffLevel += 1; break
    case 'chest': next.chestLevel += 1; break
    case 'transport':
      if (next.transportLevel >= 3) return state
      next.transportLevel += 1
      break
    case 'courier':
      if (next.courierUnlocked) return state
      next.courierUnlocked = true
      break
    case 'cargo': next.cargoLevel += 1; break
    case 'convoy': next.convoyLevel += 1; break
    case 'vault': next.vaultLevel += 1; break
    case 'security':
      if (next.securityLevel >= SECURITY.length - 1) return state
      next.securityLevel += 1
      break
  }
  addEvent(next, 'info', 'Investition abgeschlossen.')
  return next
}

export function dismissOfflineReport(state: GameState): GameState {
  const next = structuredClone(state)
  delete next.lastOfflineReport
  return next
}
