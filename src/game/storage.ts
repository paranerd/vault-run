import { advanceGame, createInitialState, emptyBeats, emptyTrips } from './engine'
import type { GameState, SlotBeats, SlotLevels, SlotTrips, Trip } from './types'

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

/** Schema 6 kennt keine gemeinsame Fuhre mehr, sondern eine je Einheit. Gold, das beim Wechsel
    noch auf der Straße lag, wandert zurück in den Beutel: Es dort abzulegen ist die einzige
    Variante, bei der weder etwas verschwindet noch ungeprüft in der Truhe auftaucht. */
function withUnitCycles(base: Record<string, unknown>, parsed: Record<string, unknown>): GameState {
  const {
    inTransitGold: _inTransit, transportStartedAt: _started, transportDeliveredAt: _delivered,
    transportEndsAt: _ends, expressGold: _express, expressStartedAt: _expressStarted,
    expressDeliveredAt: _expressDelivered, expressEndsAt: _expressEnds, ...withoutConvoy
  } = base
  const stranded = (Number(parsed.inTransitGold) || 0) + (Number(parsed.expressGold) || 0)
  return {
    ...withoutConvoy,
    schemaVersion: 7,
    chestGold: (Number(parsed.chestGold) || 0) + stranded,
    minerLevels: normalizeLevels(parsed.minerLevels),
    transporterLevels: normalizeLevels(parsed.transporterLevels),
    guardLevels: normalizeLevels(parsed.guardLevels),
    secureStartedAt: timestamp(parsed.secureStartedAt),
    secureEndsAt: timestamp(parsed.secureEndsAt),
    minerBeats: emptyBeats(),
    guardBeats: emptyBeats(),
    minerCarry: [0, 0, 0, 0],
    transporterTrips: emptyTrips(),
    playerTrip: null,
    exhaustion: 0,
    exhaustedUntil: null,
  } as unknown as GameState
}

/** Der angebrochene Fund je Bergmann. Ältere Spielstände kennen ihn nicht — dort steht jeder
    Bergmann am Anfang seines nächsten Goldstücks, was genau der Null entspricht. */
function normalizeCarry(value: unknown): SlotLevels {
  if (!Array.isArray(value)) return [0, 0, 0, 0]
  return [0, 1, 2, 3].map((index) => {
    const carry = Number(value[index])
    return Number.isFinite(carry) && carry > 0 ? carry % 1 : 0
  }) as SlotLevels
}

function normalizeBeats(value: unknown): SlotBeats {
  if (!Array.isArray(value)) return emptyBeats()
  return [0, 1, 2, 3].map((index) => timestamp(value[index])) as SlotBeats
}

function normalizeTrip(value: unknown): Trip | null {
  if (!value || typeof value !== 'object') return null
  const trip = value as Record<string, unknown>
  const startedAt = timestamp(trip.startedAt)
  const deliveredAt = timestamp(trip.deliveredAt)
  const endsAt = timestamp(trip.endsAt)
  if (startedAt === null || deliveredAt === null || endsAt === null) return null
  return { gold: Math.max(0, Number(trip.gold) || 0), startedAt, deliveredAt, endsAt }
}

function normalizeTrips(value: unknown): SlotTrips {
  if (!Array.isArray(value)) return emptyTrips()
  return [0, 1, 2, 3].map((index) => normalizeTrip(value[index])) as SlotTrips
}

export function migrateGame(value: unknown): GameState | null {
  if (!value || typeof value !== 'object') return null
  const parsed = value as Record<string, unknown>
  const { tapReadyAt: _legacyTapReadyAt, ...withoutCooldown } = parsed
  const version = Number(parsed.schemaVersion)
  // Schema 6 kennt die eigenen Takte bereits; Schema 7 ergänzt die Erschöpfung.
  if (version === 6 || version === 7) {
    return {
      ...withoutCooldown,
      schemaVersion: 7,
      minerLevels: normalizeLevels(parsed.minerLevels),
      transporterLevels: normalizeLevels(parsed.transporterLevels),
      guardLevels: normalizeLevels(parsed.guardLevels),
      secureStartedAt: timestamp(parsed.secureStartedAt),
      secureEndsAt: timestamp(parsed.secureEndsAt),
      minerBeats: normalizeBeats(parsed.minerBeats),
      guardBeats: normalizeBeats(parsed.guardBeats),
      minerCarry: normalizeCarry(parsed.minerCarry),
      transporterTrips: normalizeTrips(parsed.transporterTrips),
      playerTrip: normalizeTrip(parsed.playerTrip),
      exhaustion: version === 7 ? Math.max(0, Math.min(100, Number(parsed.exhaustion) || 0)) : 0,
      exhaustedUntil: version === 7 ? timestamp(parsed.exhaustedUntil) : null,
    } as unknown as GameState
  }
  // Schema 4 und 5 kennen die Slot-Reihen bereits; ihnen fehlt nur der eigene Takt je Einheit.
  if (version === 4 || version === 5) {
    return withUnitCycles(withoutCooldown, parsed)
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

  // Die alten Sammelstufen werden gleichmäßig auf die vier Slots verteilt; anschließend läuft der
  // Spielstand durch dieselbe Umstellung auf eigene Takte wie Schema 4 und 5.
  return withUnitCycles(
    {
      ...withoutCooldown,
      secureStartedAt: null,
      secureEndsAt: null,
    },
    {
      ...parsed,
      minerLevels: distributeLevels(staffLevel),
      transporterLevels: distributeLevels(transportProgress),
      guardLevels: distributeLevels(securityLevel),
    },
  )
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
