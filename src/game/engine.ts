import {
  GOLD_FLIGHT_DURATION_MS,
  MANUAL_CARGO,
  MANUAL_SECURE_AMOUNT,
  MANUAL_TRIP_SECONDS,
  MAX_OFFLINE_SECONDS,
  OFFLINE_THEFT_SHARE,
  SECURE_COOLDOWN_MS,
  chestCapacity,
  equipmentUpgradeCost,
  guardInterval,
  guardPower,
  hasAutomaticSecurity,
  hasAutomaticTransport,
  minerInterval,
  minerYield,
  passiveRate,
  riskGrowth,
  securityLoss,
  slotUpgradeCost,
  tapValue,
  transporterCapacity,
  transporterTripSeconds,
  vaultCapacity,
} from './config'
import type { EquipmentUpgradeId, GameEvent, GameState, OfflineReport, SlotBeats, SlotGroup, SlotIndex, SlotTrips, Trip } from './types'

const STEP_MS = 500
const SLOTS = [0, 1, 2, 3] as const

export const emptyBeats = (): SlotBeats => [null, null, null, null]
export const emptyTrips = (): SlotTrips => [null, null, null, null]

export function createInitialState(now = Date.now()): GameState {
  return {
    schemaVersion: 6,
    savedAt: now,
    lastTick: now,
    chestGold: 0,
    vaultGold: 0,
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
    minerBeats: emptyBeats(),
    guardBeats: emptyBeats(),
    transporterTrips: emptyTrips(),
    playerTrip: null,
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

/** Was noch in den Beutel passt. Ist hier nichts mehr frei, ruht die Mine — der Beutel ist die
    Grenze der Förderung, nicht bloß ein Trichter, durch den Gold ins Leere läuft. */
function bagSpace(state: GameState): number {
  return Math.max(0, chestCapacity(state) - state.chestGold)
}

function storeGold(state: GameState, amount: number, report?: OfflineReport): number {
  if (amount <= 0) return 0
  const free = bagSpace(state)
  const stored = Math.min(free, amount)
  state.chestGold += stored
  state.lifetimeGold += stored
  state.lostGold += amount - stored
  if (report) report.earned += stored
  return stored
}

/** Eine laufende manuelle Sicherung legt das **Reich** still — die Mine hört auf zu fördern. Mit
    Wachen entfällt diese Sperre: Sie sichern nebenher, während die Mine weiterläuft. Vom Spieler
    selbst sagt das nichts; ob **er** gerade beschäftigt ist, beantwortet `isPlayerBusy`. */
export function isSecuringManually(state: GameState): boolean {
  return state.secureEndsAt !== null && !hasAutomaticSecurity(state)
}

/** Der Spieler ist eine Person mit zwei Händen. Jede seiner Aktionen belegt ihn für ihre Dauer,
    und solange sie läuft, sind die beiden anderen gesperrt: Wer die Fuhre zur Truhe trägt, steht
    nicht gleichzeitig Wache und schlägt nicht nebenbei Gold aus dem Fels.
 *
 *  Der Schlag mit der Pickhacke sperrt darum nichts — er dauert keine Zeit. Gesperrt wird immer
 *  von der Aktion, die läuft: der eigenen Fuhre und der Sicherung von Hand. Beide behalten dabei
 *  ihre eigene Wirkung auf das Reich: Ob die Mine dabei mitruht, hängt an Fuhrknechten und Wachen,
 *  nicht daran, dass der Spieler gerade die Hände voll hat. */
export function isPlayerBusy(state: GameState): boolean {
  return state.playerTrip !== null || state.secureEndsAt !== null
}

/** Gold, das bereits unterwegs ist und die Truhe darum schon beansprucht — die eigene Fuhre und
    alle Fuhrknechte zusammen. Ohne diese Reservierung packten mehrere gleichzeitig fahrende
    Fuhren zusammen mehr ein, als am Ziel noch hineinpasst. */
export function goldInTransit(state: GameState): number {
  const carried = state.transporterTrips.reduce((total, trip) => total + (trip?.gold ?? 0), 0)
  return carried + (state.playerTrip?.gold ?? 0)
}

/** Der Spieler ist selbst unterwegs und kann deshalb nicht schürfen. Seine Bergleute arbeiten
    weiter, sobald ihm ein Fuhrknecht die Strecke abnimmt — vorher ruht mit ihm das ganze Reich. */
export const isPlayerTravelling = (state: GameState): boolean => state.playerTrip !== null

export function tap(state: GameState): GameState {
  if (isPlayerBusy(state)) return state
  if (state.chestGold >= chestCapacity(state)) return state
  const next = structuredClone(state)
  storeGold(next, tapValue(next))
  return next
}

function availableVaultSpace(state: GameState): number {
  return Math.max(0, vaultCapacity(state) - state.vaultGold - goldInTransit(state))
}

function loadTrip(state: GameState, capacity: number, seconds: number, now: number): Trip | null {
  const gold = Math.min(state.chestGold, capacity, availableVaultSpace(state))
  if (gold <= 0) return null
  state.chestGold -= gold
  return { gold, startedAt: now, deliveredAt: now + GOLD_FLIGHT_DURATION_MS, endsAt: now + seconds * 1000 }
}

/** Die eigene Fuhre. Sie trägt die eigene Tragkraft und braucht die eigene Zeit — beides
    unabhängig davon, wie viele Fuhrknechte gerade unterwegs sind. */
export function startTransport(state: GameState, now = Date.now()): GameState {
  if (isPlayerBusy(state) || state.chestGold <= 0) return state
  const next = structuredClone(state)
  const trip = loadTrip(next, MANUAL_CARGO, MANUAL_TRIP_SECONDS, now)
  if (!trip) {
    const blocked = structuredClone(state)
    addEvent(blocked, 'warning', 'Die Schatztruhe ist voll.')
    return blocked
  }
  next.playerTrip = trip
  return next
}

/** Historischer Name der eigenen Fuhre, solange schon Fuhrknechte fahren. Sie ist dieselbe Fuhre —
    die Automatik nimmt dem Spieler die Strecke ab, ersetzt seine eigene Ladung aber nicht. */
export const startExpressTransport = startTransport

/** Schickt jeden Fuhrknecht los, der gerade nicht unterwegs ist und etwas zu laden findet. */
function dispatchTransporters(state: GameState, now: number): void {
  for (const index of SLOTS) {
    const level = state.transporterLevels[index]
    if (level === 0 || state.transporterTrips[index] !== null) continue
    if (state.chestGold <= 0) return
    const trip = loadTrip(state, transporterCapacity(level), transporterTripSeconds(level), now)
    if (!trip) return
    state.transporterTrips[index] = trip
  }
}

function deliver(state: GameState, gold: number, report?: OfflineReport): void {
  state.vaultGold = Math.min(vaultCapacity(state), state.vaultGold + gold)
  if (report) report.delivered += gold
  if (gold > 0) addEvent(state, 'success', `${Math.floor(gold)} Gold sicher in der Schatztruhe.`)
}

/** Legt an `cursor` fällige Ladungen in der Truhe ab und meldet zurückgekehrte Träger frei. */
function settleTrips(state: GameState, cursor: number, report?: OfflineReport): void {
  const arrive = (trip: Trip): Trip => {
    if (trip.gold > 0 && cursor >= trip.deliveredAt) {
      deliver(state, trip.gold, report)
      return { ...trip, gold: 0 }
    }
    return trip
  }
  if (state.playerTrip) {
    state.playerTrip = arrive(state.playerTrip)
    if (cursor >= state.playerTrip.endsAt) {
      state.playerTrip = null
      state.tripCount += 1
    }
  }
  for (const index of SLOTS) {
    const trip = state.transporterTrips[index]
    if (!trip) continue
    const arrived = arrive(trip)
    if (cursor >= arrived.endsAt) {
      state.transporterTrips[index] = null
      state.tripCount += 1
    } else {
      state.transporterTrips[index] = arrived
    }
  }
}

/** Ein ruhender Bergmann hat keinen Takt. Das ist mehr als Buchführung: Ein stehengelassener Takt
    liefe während der Ruhe weiter, und jede stillgelegte Sekunde stünde danach als fällige Förderung
    an — die Ruhe ergäbe am Ende dieselbe Menge wie durchgehende Arbeit, nur in einem Schwall.
    Zugleich ist ein fälliger, aber nie abgearbeiteter Takt der einzige Weg, auf dem `nextBeat` einen
    Zeitpunkt hinter dem Cursor melden könnte — die Schleife in `advanceGame` käme dann nicht mehr
    von der Stelle. Wer weitermacht, beginnt seinen Takt darum von vorn. */
function restMiner(state: GameState, index: SlotIndex): void {
  state.minerBeats[index] = null
}

function restMiners(state: GameState): void {
  for (const index of SLOTS) restMiner(state, index)
}

/** Jeder Bergmann fördert in seinem eigenen Takt. Nachgeholt wird in ganzen Takten, damit eine
    lange Abwesenheit exakt dieselbe Menge ergibt wie durchgehendes Zusehen.
 *
 *  Ist der Beutel voll, ruht die Mine bis zur nächsten Fuhre: Ein Bergmann, der weiterschlüge,
 *  förderte ausschließlich in den Verlust — über eine Nacht hinweg ein Vielfaches des Beutels an
 *  Gold, das nie irgendwo ankommt. Die letzte Förderung füllt den Beutel noch bis zum Rand auf;
 *  was in dieser einen Portion darüber hinausgeht, geht wie gehabt verloren. */
function runMiners(state: GameState, cursor: number, report?: OfflineReport): void {
  for (const index of SLOTS) {
    const level = state.minerLevels[index]
    if (level === 0) continue
    if (bagSpace(state) <= 0) {
      restMiner(state, index)
      continue
    }
    const interval = minerInterval(level) * 1_000
    if (state.minerBeats[index] === null) state.minerBeats[index] = cursor
    while (cursor >= (state.minerBeats[index] as number) + interval) {
      // Füllt eine frühere Förderung dieses Durchlaufs den Beutel, ruht auch der Rest der Takte —
      // und der fällige Takt verfällt mit ihnen, statt als Rückstand liegen zu bleiben.
      if (bagSpace(state) <= 0) {
        restMiner(state, index)
        break
      }
      state.minerBeats[index] = (state.minerBeats[index] as number) + interval
      storeGold(state, minerYield(level), report)
    }
  }
}

/** Dasselbe für die Wachen — jede trägt ihre eigenen Punkte in ihrem eigenen Takt ab. */
function runGuards(state: GameState, cursor: number): void {
  for (const index of SLOTS) {
    const level = state.guardLevels[index]
    if (level === 0) continue
    const interval = guardInterval(level) * 1_000
    if (state.guardBeats[index] === null) state.guardBeats[index] = cursor
    while (cursor >= (state.guardBeats[index] as number) + interval) {
      state.guardBeats[index] = (state.guardBeats[index] as number) + interval
      state.threat = Math.max(0, state.threat - guardPower(level))
    }
  }
}

/** Frühester Zeitpunkt, an dem als Nächstes irgendetwas passiert. Ohne ihn liefen Förderungen,
    Sicherungen und Ankünfte nur im 500-ms-Raster — die Mengen stimmten, die Ankünfte flackerten
    aber sichtbar gegen ihren eigenen Takt. */
function nextBeat(state: GameState): number {
  let earliest = Number.POSITIVE_INFINITY
  const consider = (at: number) => { if (at < earliest) earliest = at }
  for (const index of SLOTS) {
    const minerLevel = state.minerLevels[index]
    const minerBeat = state.minerBeats[index]
    if (minerLevel > 0 && minerBeat !== null) consider(minerBeat + minerInterval(minerLevel) * 1_000)
    const guardLevel = state.guardLevels[index]
    const guardBeat = state.guardBeats[index]
    if (guardLevel > 0 && guardBeat !== null) consider(guardBeat + guardInterval(guardLevel) * 1_000)
    const trip = state.transporterTrips[index]
    if (trip) {
      if (trip.gold > 0) consider(trip.deliveredAt)
      consider(trip.endsAt)
    }
  }
  if (state.playerTrip) {
    if (state.playerTrip.gold > 0) consider(state.playerTrip.deliveredAt)
    consider(state.playerTrip.endsAt)
  }
  if (state.secureEndsAt !== null) consider(state.secureEndsAt)
  return earliest
}

/** Diebeszug auf die Schatztruhe. `budget` deckelt die Beute (Offline-Strecke); ist es
    aufgebraucht, fällt das Risiko trotzdem zurück, damit der Zug nicht endlos nachfeuert. */
function runTheft(state: GameState, budget: number, report?: OfflineReport): number {
  const stolen = Math.min(state.vaultGold * securityLoss(state), budget)
  state.threat = 8
  if (stolen <= 0) return 0
  state.vaultGold -= stolen
  state.stolenGold += stolen
  state.theftCount += 1
  if (report) report.stolen += stolen
  addEvent(state, 'warning', `Diebeszug: ${Math.ceil(stolen)} Gold aus der Schatztruhe verloren.`)
  return stolen
}

/** Die Sicherung von Hand. Sie ist die dritte Aktion des Spielers und darum genauso gesperrt,
    solange er selbst unterwegs ist — Wache geht nur, wer da ist. */
export function lowerThreat(state: GameState, now = Date.now()): GameState {
  if (state.threat <= 0 || isPlayerBusy(state)) return state
  const next = structuredClone(state)
  next.threat = Math.max(0, next.threat - MANUAL_SECURE_AMOUNT)
  next.secureStartedAt = now
  next.secureEndsAt = now + SECURE_COOLDOWN_MS
  return next
}

/** Die Mine bringt in diesem Tick nichts hervor: Entweder ist kein Bergmann angestellt, oder der
    volle Beutel hat alle zur Ruhe gebracht. Die zweite Form zählt erst, wenn die Takte tatsächlich
    abgelegt sind — solange noch einer steht, muss der Tick laufen und ihn ablegen. */
function mineIsIdle(state: GameState): boolean {
  if (passiveRate(state) === 0) return true
  return bagSpace(state) <= 0 && state.minerBeats.every((beat) => beat === null)
}

/** Ruhezustand: In diesem Tick kann sich am sichtbaren Zustand nichts ändern — keine fördernde
    Mine, keine Fuhre unterwegs oder startbereit, keine laufende Sicherung, kein Risiko und kein
    Gold in der Truhe, das Risiko erzeugen könnte. Das ist das frühe Spiel zwischen zwei Klicks —
    und der volle Beutel, der auf die erste Fuhre wartet. */
function isDormant(state: GameState): boolean {
  return mineIsIdle(state)
    && state.playerTrip === null
    && state.transporterTrips.every((trip) => trip === null)
    && state.secureEndsAt === null
    && state.threat <= 0
    && state.vaultGold <= 0
    && !(hasAutomaticTransport(state) && state.chestGold > 0)
}

export function advanceGame(input: GameState, now = Date.now(), offline = false): GameState {
  if (now <= input.lastTick) return input
  // Im Ruhezustand wird nur die Uhr weitergestellt und **dieselbe Referenz** zurückgegeben, damit
  // React den Re-Render überspringt. `lastTick`/`savedAt` werden dafür in place gesetzt: Beide
  // werden nirgends gerendert, und ohne das Weiterstellen bekäme der Spieler die verstrichene
  // Ruhezeit beim nächsten Bergmann rückwirkend gutgeschrieben. Die Offline-Strecke bleibt außen
  // vor, damit der Rückkehr-Bericht unverändert entsteht.
  if (!offline && isDormant(input)) {
    input.lastTick = now
    input.savedAt = now
    return input
  }
  const state = structuredClone(input)
  const elapsedMs = Math.min(now - state.lastTick, MAX_OFFLINE_SECONDS * 1000)
  const target = state.lastTick + elapsedMs
  const report: OfflineReport | undefined = offline
    ? { seconds: elapsedMs / 1000, earned: 0, delivered: 0, stolen: 0 }
    : undefined

  // Offline darf ein Diebeszug nach dem anderen die Truhe nicht restlos ausräumen. Bezugsgröße
  // ist alles, was auf der Strecke Truhengold war — sonst wäre eine bei Abschied leere Truhe
  // die ganze Nacht über unantastbar, egal wie viel die Fuhren noch anliefern.
  const vaultAtDeparture = state.vaultGold
  let stolenOffline = 0
  const remainingTheftBudget = () => offline
    ? Math.max(0, OFFLINE_THEFT_SHARE * (vaultAtDeparture + (report?.delivered ?? 0)) - stolenOffline)
    : Number.POSITIVE_INFINITY

  let cursor = state.lastTick
  while (cursor < target) {
    // Solange der Spieler selbst und ohne Fuhrknecht unterwegs ist, ruht das ganze Reich —
    // dann steht auch die Mine still. Sobald einer die Strecke übernimmt, fördert sie weiter.
    const paused = isSecuringManually(state) || (isPlayerTravelling(state) && !hasAutomaticTransport(state))
    if (paused) {
      restMiners(state)
    } else {
      runMiners(state, cursor, report)
      dispatchTransporters(state, cursor)
    }
    runGuards(state, cursor)

    const nextCursor = Math.min(target, cursor + STEP_MS, nextBeat(state))
    const dt = Math.max(0, nextCursor - cursor) / 1000

    state.threat += dt * riskGrowth(state)
    if (state.vaultGold > 0 && state.threat >= 100) stolenOffline += runTheft(state, remainingTheftBudget(), report)

    cursor = nextCursor
    if (state.secureEndsAt !== null && cursor >= state.secureEndsAt) {
      state.secureStartedAt = null
      state.secureEndsAt = null
    }
    settleTrips(state, cursor, report)
  }
  // Ein letzter Durchlauf auf dem Zielzeitpunkt: Was genau jetzt fällig ist, soll auch jetzt
  // gutgeschrieben werden und nicht erst beim nächsten Tick.
  if (isSecuringManually(state) || (isPlayerTravelling(state) && !hasAutomaticTransport(state))) {
    restMiners(state)
  } else {
    runMiners(state, target, report)
    dispatchTransporters(state, target)
  }
  runGuards(state, target)

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
