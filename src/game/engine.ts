import {
  GOLD_FLIGHT_DURATION_MS,
  MAX_OFFLINE_SECONDS,
  cargoCapacity,
  chestCapacity,
  equipmentUpgradeCost,
  MANUAL_SECURE_AMOUNT,
  SECURE_COOLDOWN_MS,
  expressDuration,
  hasAutomaticSecurity,
  hasAutomaticTransport,
  passiveRate,
  riskGrowth,
  securingInterval,
  securingPower,
  securityLoss,
  slotUpgradeCost,
  tapValue,
  transportDuration,
  vaultCapacity,
} from './config'
import type { EquipmentUpgradeId, GameEvent, GameState, OfflineReport, SlotGroup, SlotIndex } from './types'

const STEP_MS = 500

export function createInitialState(now = Date.now()): GameState {
  return {
    schemaVersion: 5,
    savedAt: now,
    lastTick: now,
    chestGold: 0,
    vaultGold: 0,
    inTransitGold: 0,
    lifetimeGold: 0,
    lostGold: 0,
    stolenGold: 0,
    tapLevel: 0,
    chestLevel: 0,
    vaultLevel: 0,
    minerLevels: [0, 0, 0, 0],
    transporterLevels: [0, 0, 0, 0],
    guardLevels: [0, 0, 0, 0],
    threat: 0,
    secureStartedAt: null,
    secureEndsAt: null,
    lastAutoSecureAt: null,
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

/** Eine laufende manuelle Sicherung legt das ganze Reich still; mit Wachen entfällt die Sperre. */
export function isSecuringManually(state: GameState): boolean {
  return state.secureEndsAt !== null && !hasAutomaticSecurity(state)
}

export function tap(state: GameState): GameState {
  if (isSecuringManually(state)) return state
  if (state.transportEndsAt !== null && !hasAutomaticTransport(state)) return state
  if (state.expressEndsAt !== null) return state
  if (state.chestGold >= chestCapacity(state)) return state
  const next = structuredClone(state)
  storeGold(next, tapValue(next))
  return next
}

function availableVaultSpace(state: GameState): number {
  return Math.max(0, vaultCapacity(state) - state.vaultGold - state.inTransitGold - state.expressGold)
}

export function startTransport(state: GameState, now = Date.now()): GameState {
  if (isSecuringManually(state) || state.transportEndsAt !== null || state.chestGold <= 0) return state
  const payload = Math.min(state.chestGold, cargoCapacity(state), availableVaultSpace(state))
  if (payload <= 0) {
    const blocked = structuredClone(state)
    addEvent(blocked, 'warning', 'Die Schatztruhe ist voll.')
    return blocked
  }
  const next = structuredClone(state)
  next.chestGold -= payload
  next.inTransitGold = payload
  next.transportStartedAt = now
  const duration = transportDuration(next) * 1000
  next.transportDeliveredAt = now + GOLD_FLIGHT_DURATION_MS
  next.transportEndsAt = now + duration
  return next
}

export function startExpressTransport(state: GameState, now = Date.now()): GameState {
  if (isSecuringManually(state) || !hasAutomaticTransport(state) || state.expressEndsAt !== null || state.chestGold <= 0) return state
  const payload = Math.min(state.chestGold, cargoCapacity(state), availableVaultSpace(state))
  if (payload <= 0) return state
  const next = structuredClone(state)
  next.chestGold -= payload
  next.expressGold = payload
  next.expressStartedAt = now
  const duration = expressDuration(next) * 1000
  next.expressDeliveredAt = now + GOLD_FLIGHT_DURATION_MS
  next.expressEndsAt = now + duration
  return next
}

function deliverTransport(state: GameState, express: boolean, report?: OfflineReport): void {
  const delivered = express ? state.expressGold : state.inTransitGold
  state.vaultGold = Math.min(vaultCapacity(state), state.vaultGold + delivered)
  if (express) state.expressGold = 0
  else state.inTransitGold = 0
  if (report) report.delivered += delivered
  if (delivered > 0) addEvent(state, 'success', `${Math.floor(delivered)} Gold sicher in der Schatztruhe.`)
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
  const stolen = state.chestGold * securityLoss(state)
  state.chestGold -= stolen
  state.stolenGold += stolen
  state.theftCount += 1
  state.threat = 8
  if (report) report.stolen += stolen
  addEvent(state, 'warning', `Diebeszug: ${Math.ceil(stolen)} ungesichertes Gold verloren.`)
}

export function lowerThreat(state: GameState, now = Date.now()): GameState {
  if (state.threat <= 0 || state.secureEndsAt !== null) return state
  const next = structuredClone(state)
  next.threat = Math.max(0, next.threat - MANUAL_SECURE_AMOUNT)
  next.secureStartedAt = now
  next.secureEndsAt = now + SECURE_COOLDOWN_MS
  return next
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
    if (hasAutomaticTransport(state) && state.transportEndsAt === null && state.chestGold > 0 && state.vaultGold < vaultCapacity(state)) {
      Object.assign(state, startTransport(state, cursor))
    }

    const nextEvent = Math.min(
      state.inTransitGold > 0 ? state.transportDeliveredAt ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY,
      state.transportEndsAt ?? Number.POSITIVE_INFINITY,
      state.expressGold > 0 ? state.expressDeliveredAt ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY,
      state.expressEndsAt ?? Number.POSITIVE_INFINITY,
      state.secureEndsAt ?? Number.POSITIVE_INFINITY,
    )
    const nextCursor = Math.min(target, cursor + STEP_MS, nextEvent)
    const dt = Math.max(0, nextCursor - cursor) / 1000
    const miningPaused = isSecuringManually(state) || (state.transportEndsAt !== null && !hasAutomaticTransport(state))
    if (!miningPaused) storeGold(state, passiveRate(state) * dt, report)

    // Wachen sichern im festen Takt — auch offline, sonst wäre jede Nacht ein garantierter Diebstahl.
    if (hasAutomaticSecurity(state)) {
      const interval = securingInterval(state) * 1_000
      if (state.lastAutoSecureAt === null) state.lastAutoSecureAt = cursor
      while (nextCursor >= state.lastAutoSecureAt + interval) {
        state.lastAutoSecureAt += interval
        state.threat = Math.max(0, state.threat - securingPower(state))
      }
    }

    state.threat += dt * riskGrowth(state)
    if (state.chestGold > 0 && state.threat >= 100) runTheft(state, report)

    cursor = nextCursor
    if (state.secureEndsAt !== null && cursor >= state.secureEndsAt) {
      state.secureStartedAt = null
      state.secureEndsAt = null
    }
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

export function buyEquipmentUpgrade(state: GameState, id: EquipmentUpgradeId): GameState {
  const price = equipmentUpgradeCost(state, id)
  if (state.vaultGold < price) return state
  const next = structuredClone(state)
  next.vaultGold -= price
  if (id === 'tap') next.tapLevel += 1
  else if (id === 'chest') next.chestLevel += 1
  else next.vaultLevel += 1
  addEvent(next, 'info', 'Ausrüstung verbessert.')
  return next
}

export function buySlotUpgrade(state: GameState, group: SlotGroup, index: SlotIndex): GameState {
  const price = slotUpgradeCost(state, group, index)
  if (state.vaultGold < price) return state
  const next = structuredClone(state)
  next.vaultGold -= price
  const levels = group === 'miners' ? next.minerLevels : group === 'transporters' ? next.transporterLevels : next.guardLevels
  levels[index] += 1
  addEvent(next, 'info', `${group === 'miners' ? 'Bergmann' : group === 'transporters' ? 'Fuhrknecht' : 'Wache'} ${index + 1} verbessert.`)
  return next
}

export function dismissOfflineReport(state: GameState): GameState {
  const next = structuredClone(state)
  delete next.lastOfflineReport
  return next
}
