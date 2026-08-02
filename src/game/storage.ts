import { advanceGame, createInitialState } from './engine'
import type { GameState } from './types'

const SAVE_KEY = 'vault-run-save-v1'

function migrateGame(value: unknown): GameState | null {
  if (!value || typeof value !== 'object') return null
  const parsed = value as Record<string, unknown>
  if (parsed.schemaVersion === 2) return parsed as unknown as GameState
  if (parsed.schemaVersion !== 1) return null

  const startedAt = typeof parsed.transportStartedAt === 'number' ? parsed.transportStartedAt : null
  const endsAt = typeof parsed.transportEndsAt === 'number' ? parsed.transportEndsAt : null
  return {
    ...(parsed as unknown as Omit<GameState, 'schemaVersion' | 'transportDeliveredAt' | 'expressGold' | 'expressStartedAt' | 'expressDeliveredAt' | 'expressEndsAt'>),
    schemaVersion: 2,
    transportDeliveredAt: startedAt !== null && endsAt !== null ? startedAt + (endsAt - startedAt) / 2 : null,
    expressGold: 0,
    expressStartedAt: null,
    expressDeliveredAt: null,
    expressEndsAt: null,
  }
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
