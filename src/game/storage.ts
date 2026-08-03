import { advanceGame, createInitialState } from './engine'
import type { GameState, SlotLevels } from './types'

const SAVE_KEY = 'vault-run-save-v1'

function distributeLevels(total: number): SlotLevels {
  const levels: SlotLevels = [0, 0, 0, 0]
  for (let index = 0; index < Math.max(0, Math.floor(total)); index += 1) levels[index % 4] += 1
  return levels
}

function normalizeLevels(value: unknown): SlotLevels {
  if (!Array.isArray(value)) return [0, 0, 0, 0]
  return [0, 1, 2, 3].map((index) => Math.max(0, Math.floor(Number(value[index]) || 0))) as SlotLevels
}

function timestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function migrateGame(value: unknown): GameState | null {
  if (!value || typeof value !== 'object') return null
  const parsed = value as Record<string, unknown>
  const { tapReadyAt: _legacyTapReadyAt, ...withoutCooldown } = parsed
  const version = Number(parsed.schemaVersion)
  // Schema 4 kennt die Slot-Reihen bereits und braucht nur die Felder der Wach-Automatik.
  if (version === 4 || version === 5) {
    return {
      ...withoutCooldown,
      schemaVersion: 5,
      minerLevels: normalizeLevels(parsed.minerLevels),
      transporterLevels: normalizeLevels(parsed.transporterLevels),
      guardLevels: normalizeLevels(parsed.guardLevels),
      secureStartedAt: timestamp(parsed.secureStartedAt),
      secureEndsAt: timestamp(parsed.secureEndsAt),
      lastAutoSecureAt: timestamp(parsed.lastAutoSecureAt),
    } as unknown as GameState
  }

  if (![1, 2, 3].includes(version)) return null

  const startedAt = typeof parsed.transportStartedAt === 'number' ? parsed.transportStartedAt : null
  const endsAt = typeof parsed.transportEndsAt === 'number' ? parsed.transportEndsAt : null
  const staffLevel = Number(parsed.staffLevel) || 0
  const transportProgress = (parsed.courierUnlocked ? 1 : 0)
    + (Number(parsed.transportLevel) || 0)
    + (Number(parsed.cargoLevel) || 0)
    + (Number(parsed.convoyLevel) || 0)
  const securityLevel = Number(parsed.securityLevel) || 0

  return {
    ...withoutCooldown,
    schemaVersion: 5,
    secureStartedAt: null,
    secureEndsAt: null,
    lastAutoSecureAt: null,
    minerLevels: distributeLevels(staffLevel),
    transporterLevels: distributeLevels(transportProgress),
    guardLevels: distributeLevels(securityLevel),
    transportDeliveredAt: typeof parsed.transportDeliveredAt === 'number'
      ? parsed.transportDeliveredAt
      : startedAt !== null && endsAt !== null ? startedAt + (endsAt - startedAt) / 2 : null,
    expressGold: Number(parsed.expressGold) || 0,
    expressStartedAt: typeof parsed.expressStartedAt === 'number' ? parsed.expressStartedAt : null,
    expressDeliveredAt: typeof parsed.expressDeliveredAt === 'number' ? parsed.expressDeliveredAt : null,
    expressEndsAt: typeof parsed.expressEndsAt === 'number' ? parsed.expressEndsAt : null,
  } as unknown as GameState
}

export function loadGame(now = Date.now()): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return createInitialState(now)
    const parsed = migrateGame(JSON.parse(raw))
    if (!parsed) return createInitialState(now)
    return advanceGame(parsed, now, true)
  } catch {
    return createInitialState(now)
  }
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastOfflineReport: undefined }))
  } catch {
    // The running game remains usable when storage is unavailable.
  }
}

export function resetGame(): GameState {
  localStorage.removeItem(SAVE_KEY)
  return createInitialState()
}
