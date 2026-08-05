import {
  GOLD_FLIGHT_DURATION_MS,
  EXHAUSTION_BREAK_MS,
  MAX_OFFLINE_SECONDS,
  OFFLINE_THEFT_SHARE,
  equipmentUpgradeCost,
  exhaustionPerTap,
  exhaustionRecoveryRate,
  guardInterval,
  guardSight,
  hasAutomaticSecurity,
  hasAutomaticTransport,
  lampSight,
  manualSecureSeconds,
  manualTripSeconds,
  minerInterval,
  minerYield,
  packCargo,
  passiveRate,
  riskGrowth,
  securityLoss,
  slotUpgradeCost,
  stockCapacity,
  tapValue,
  transporterCapacity,
  transporterTripSeconds,
  vaultCapacity,
  withEquipmentLevel,
} from './config'
import type { EquipmentUpgradeId, GameEvent, GameState, OfflineReport, SlotBeats, SlotGroup, SlotIndex, SlotTrips, Trip } from './types'

const STEP_MS = 100
const SLOTS = [0, 1, 2, 3] as const

export const emptyBeats = (): SlotBeats => [null, null, null, null]
export const emptyTrips = (): SlotTrips => [null, null, null, null]

export function createInitialState(now = Date.now()): GameState {
  return {
    schemaVersion: 9,
    savedAt: now,
    lastTick: now,
    stockGold: 0,
    stockArrivals: [],
    vaultGold: 0,
    lifetimeGold: 0,
    lostGold: 0,
    stolenGold: 0,
    tapLevel: 0,
    packLevel: 0,
    bootsLevel: 0,
    lampLevel: 0,
    stockLevel: 0,
    vaultLevel: 0,
    minerLevels: [0, 0, 0, 0],
    transporterLevels: [0, 0, 0, 0],
    guardLevels: [0, 0, 0, 0],
    exhaustion: 0,
    exhaustedUntil: null,
    threat: 0,
    secureStartedAt: null,
    secureEndsAt: null,
    minerBeats: emptyBeats(),
    guardBeats: emptyBeats(),
    minerCarry: [0, 0, 0, 0],
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

/** Gold, das bereits zum Lager unterwegs ist und dort schon Platz beansprucht. Das Gegenstück zu
    `goldInTransit` auf der zweiten Strecke. */
export function goldToStock(state: GameState): number {
  return state.stockArrivals.reduce((total, arrival) => total + arrival.gold, 0)
}

/** Was noch ins Lager passt. Ist hier nichts mehr frei, ruht die Mine — das Lager ist die Grenze
    der Förderung, nicht bloß ein Trichter, durch den Gold ins Leere läuft.
 *
 *  Was schon fliegt, zählt mit. Ohne diese Reservierung förderten die Bergleute weiter gegen ein
 *  Lager, das in einer halben Sekunde voll ist, und jeder Schlag, dessen Gold bei der Ankunft
 *  keinen Platz mehr fände, kostete den Spieler trotzdem Erschöpfung. */
export function stockSpace(state: GameState): number {
  return Math.max(0, stockCapacity(state) - state.stockGold - goldToStock(state))
}

/** Schickt frisch geschlagenes Gold auf den Weg ins Lager. Es kommt `GOLD_FLIGHT_DURATION_MS`
    später an — genau dann, wenn die Münze auf der Kachel landet.
 *
 *  Gezählt wird zum Zeitpunkt des Schlages, nicht der Ankunft: `lifetimeGold` ist, was **gefördert**
 *  wurde, und der Überlauf entsteht am Fels, wo er nicht mehr ins Lager passt. Beides ist in
 *  diesem Moment entschieden — weil der Platz hier reserviert wird, kommt jedes losgeschickte
 *  Goldstück auch an. */
function storeGold(state: GameState, amount: number, at: number, report?: OfflineReport): number {
  if (amount <= 0) return 0
  const free = stockSpace(state)
  const stored = Math.min(free, amount)
  state.lifetimeGold += stored
  state.lostGold += amount - stored
  if (report) report.earned += stored
  if (stored > 0) state.stockArrivals = [...state.stockArrivals, { gold: stored, at: at + GOLD_FLIGHT_DURATION_MS }]
  return stored
}

/** Legt an `cursor` fällige Förderungen im Lager ab. Der Deckel greift nur gegen die Unschärfe der
    Fließkommaarithmetik — der Platz war beim Losschicken reserviert. */
function settleArrivals(state: GameState, cursor: number): void {
  if (state.stockArrivals.length === 0) return
  const due = state.stockArrivals.filter((arrival) => cursor >= arrival.at)
  if (due.length === 0) return
  const arrived = due.reduce((total, arrival) => total + arrival.gold, 0)
  state.stockGold = Math.min(stockCapacity(state), state.stockGold + arrived)
  state.stockArrivals = state.stockArrivals.filter((arrival) => cursor < arrival.at)
}

/** Die nächste fällige Ankunft, damit der Tick genau auf ihr landet statt bis zu 100 ms daneben. */
function nextArrival(state: GameState): number {
  return state.stockArrivals.reduce((earliest, arrival) => Math.min(earliest, arrival.at), Number.POSITIVE_INFINITY)
}

/** Der Spieler sichert gerade selbst, ohne dass eine Wache die Arbeit ohnehin täte. Das ist eine
    Aussage über **ihn** und hält nichts im Reich an — Bergleute und Fuhrknechte arbeiten währenddessen
    weiter. Ob **er** beschäftigt ist, beantwortet `isPlayerBusy`. */
export function isSecuringManually(state: GameState): boolean {
  return state.secureEndsAt !== null && !hasAutomaticSecurity(state)
}

/** Der Spieler ist eine Person mit zwei Händen. Jede seiner Aktionen belegt ihn für ihre Dauer,
    und solange sie läuft, sind die beiden anderen gesperrt: Wer die Fuhre zur Truhe trägt, steht
    nicht gleichzeitig Wache und schlägt nicht nebenbei Gold aus dem Fels.
 *
 *  Der Schlag mit der Pickhacke sperrt darum nichts — er dauert keine Zeit. Gesperrt wird immer
 *  von der Aktion, die läuft: der eigenen Fuhre und der Sicherung von Hand. Das sagt ausschließlich
 *  etwas über **ihn**: Seine Bergleute fördern weiter, während er unterwegs ist. Nur die Sicherung
 *  von Hand legt zusätzlich das Reich still, und auch das nur, solange keine Wache sie übernimmt. */
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

export function tap(state: GameState, now = Date.now()): GameState {
  if (isPlayerBusy(state)) return state
  // Gemessen am freien Platz, nicht am Inhalt: Ein Schlag, dessen Gold bei der Ankunft nichts mehr
  // vorfände, kostete sonst Erschöpfung für nichts.
  if (stockSpace(state) <= 0) return state
  if (state.exhaustion >= 100 || (state.exhaustedUntil !== null && now < state.exhaustedUntil)) return state
  const next = structuredClone(state)
  storeGold(next, tapValue(next), now)
  next.exhaustion = Math.min(100, next.exhaustion + exhaustionPerTap(next))
  if (next.exhaustion >= 100) next.exhaustedUntil = now + EXHAUSTION_BREAK_MS
  return next
}

function availableVaultSpace(state: GameState): number {
  return Math.max(0, vaultCapacity(state) - state.vaultGold - goldInTransit(state))
}

function loadTrip(state: GameState, capacity: number, seconds: number, now: number): Trip | null {
  const gold = Math.min(state.stockGold, capacity, availableVaultSpace(state))
  if (gold <= 0) return null
  state.stockGold -= gold
  return { gold, startedAt: now, deliveredAt: now + GOLD_FLIGHT_DURATION_MS, endsAt: now + seconds * 1000 }
}

/** Die eigene Fuhre. Sie trägt, was in den Beutel des Spielers passt, und braucht die Zeit, die
    seine Stiefel brauchen — beides unabhängig davon, wie viele Fuhrknechte gerade unterwegs sind. */
export function startTransport(state: GameState, now = Date.now()): GameState {
  if (isPlayerBusy(state) || state.stockGold <= 0) return state
  const next = structuredClone(state)
  const trip = loadTrip(next, packCargo(next), manualTripSeconds(next), now)
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
    if (state.stockGold <= 0) return
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

/** Jeder Bergmann fördert in seinem eigenen Takt. Nachgeholt wird in ganzen Takten, damit eine
    lange Abwesenheit exakt dieselbe Menge ergibt wie durchgehendes Zusehen.
 *
 *  Ist das Lager voll, ruht die Mine bis zur nächsten Fuhre: Ein Bergmann, der weiterschlüge,
 *  förderte ausschließlich in den Verlust — über eine Nacht hinweg ein Vielfaches des Lagers an
 *  Gold, das nie irgendwo ankommt. Die letzte Förderung füllt das Lager noch bis zum Rand auf;
 *  was in dieser einen Portion darüber hinausgeht, geht wie gehabt verloren. */
function runMiners(state: GameState, cursor: number, report?: OfflineReport): void {
  for (const index of SLOTS) {
    const level = state.minerLevels[index]
    if (level === 0) continue
    if (stockSpace(state) <= 0) {
      restMiner(state, index)
      continue
    }
    const interval = minerInterval(level) * 1_000
    // Wer neu anfängt — frisch angestellt oder nach der Ruhe am vollen Lager —, hängt sich in den
    // laufenden Takt der Uhr ein, statt seinen eigenen bei der Sekunde des Wiederanlaufs zu
    // beginnen. Sonst hinge die Phase daran, wann der Tick das freie Lager bemerkt: Zusehen
    // schaut alle 100 ms nach, die Offline-Strecke in Schritten von bis zu 500 ms, und über zehn
    // Minuten Ruhe-und-weiter passte in den einen Lauf ein Takt mehr als in den anderen.
    if (state.minerBeats[index] === null) state.minerBeats[index] = Math.floor(cursor / interval) * interval
    while (cursor >= (state.minerBeats[index] as number) + interval) {
      // Füllt eine frühere Förderung dieses Durchlaufs das Lager, ruht auch der Rest der Takte —
      // und der fällige Takt verfällt mit ihnen, statt als Rückstand liegen zu bleiben.
      if (stockSpace(state) <= 0) {
        restMiner(state, index)
        break
      }
      state.minerBeats[index] = (state.minerBeats[index] as number) + interval
      // Losgeschickt wird zum Takt selbst, nicht zum Cursor: Sonst hinge die Ankunftszeit daran,
      // wie fein der Tick gerade schaut — und Zusehen ergäbe andere Zeiten als die Offline-Strecke.
      mineWholeGold(state, index, level, state.minerBeats[index] as number, report)
    }
  }
}

/** Ein Bergmann schickt nur ganze Goldstücke ins Lager. Fördert er 0,7 je Takt, kommt im
    ersten Takt nichts an, im zweiten eines (0,4 bleiben liegen), im dritten wieder eines (0,1
    bleiben liegen) — die Rate stimmt über die Takte hinweg auf den Bruchteil genau, nur ist der
    Lager keine Kommazahl mehr. Der Rest steht im Zustand und übersteht damit Pause und
    Spielstand: Ohne ihn wäre der angebrochene Fund bei jedem Neuladen verloren. */
function mineWholeGold(state: GameState, index: SlotIndex, level: number, at: number, report?: OfflineReport): number {
  const carried = state.minerCarry[index] + minerYield(level)
  const whole = Math.floor(carried)
  // Der Rest wird auf sechs Stellen gerundet: Ohne das sammeln sich die Ungenauigkeiten der
  // Fließkommaarithmetik über tausende Takte zu einem sichtbaren Versatz gegenüber der Rate.
  state.minerCarry[index] = Math.round((carried - whole) * 1e6) / 1e6
  if (whole <= 0) return 0
  return storeGold(state, whole, at, report)
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
      state.threat = Math.max(0, state.threat - guardSight(level))
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
  if (state.exhaustedUntil !== null) consider(state.exhaustedUntil)
  consider(nextArrival(state))
  return earliest
}

/** Erholung läuft unabhängig davon, womit Spieler oder Reich gerade beschäftigt sind. Wird die
    Leiste voll, bleibt sie für die kurze Zwangspause fest bei 100 und fällt erst danach wieder. */
function recoverExhaustion(state: GameState, from: number, to: number): void {
  if (state.exhaustion <= 0 || to <= from) return
  const recoveryStarts = state.exhaustedUntil === null ? from : Math.max(from, state.exhaustedUntil)
  const seconds = Math.max(0, to - recoveryStarts) / 1_000
  if (seconds > 0) state.exhaustion = Math.max(0, state.exhaustion - seconds * exhaustionRecoveryRate(state))
  if (state.exhaustedUntil !== null && to >= state.exhaustedUntil) state.exhaustedUntil = null
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

/** Der Wachgang. Er ist die dritte Aktion des Spielers und darum genauso gesperrt, solange er
    selbst unterwegs ist — Wache geht nur, wer da ist. Wie viel er abträgt, hängt an seiner
    Grubenlampe; wie lange er dafür gebunden ist, an seinen Stiefeln. */
export function lowerThreat(state: GameState, now = Date.now()): GameState {
  if (state.threat <= 0 || isPlayerBusy(state)) return state
  const next = structuredClone(state)
  next.threat = Math.max(0, next.threat - lampSight(next))
  next.secureStartedAt = now
  next.secureEndsAt = now + manualSecureSeconds(next) * 1_000
  return next
}

/** Die Mine bringt in diesem Tick nichts hervor: Entweder ist kein Bergmann angestellt, oder der
    volle Lager hat alle zur Ruhe gebracht. Die zweite Form zählt erst, wenn die Takte tatsächlich
    abgelegt sind — solange noch einer steht, muss der Tick laufen und ihn ablegen. */
function mineIsIdle(state: GameState): boolean {
  if (passiveRate(state) === 0) return true
  return stockSpace(state) <= 0 && state.minerBeats.every((beat) => beat === null)
}

/** Ruhezustand: In diesem Tick kann sich am sichtbaren Zustand nichts ändern — keine fördernde
    Mine, keine Fuhre unterwegs oder startbereit, keine laufende Sicherung, kein Risiko und kein
    Gold in der Truhe, das Risiko erzeugen könnte. Das ist das frühe Spiel zwischen zwei Klicks —
    und das volle Lager, das auf die erste Fuhre wartet. */
function isDormant(state: GameState): boolean {
  return mineIsIdle(state)
    && state.stockArrivals.length === 0
    && state.playerTrip === null
    && state.transporterTrips.every((trip) => trip === null)
    && state.secureEndsAt === null
    && state.threat <= 0
    && state.exhaustion <= 0
    && state.vaultGold <= 0
    && !(hasAutomaticTransport(state) && state.stockGold > 0)
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
    // Was der Spieler von Hand tut, hält keine Automatik an: Bergleute fördern und Fuhrknechte
    // fahren, während er selbst eine Fuhre trägt oder Wache steht. Angestellte legen die Arbeit
    // nicht nieder, weil ihr Dienstherr mit anpackt. Gesperrt sind allein seine eigenen drei
    // Aktionen — gegenseitig, und das regeln `tap`, `startTransport` und `lowerThreat` für sich.
    runMiners(state, cursor, report)
    dispatchTransporters(state, cursor)
    runGuards(state, cursor)

    const nextCursor = Math.min(target, cursor + STEP_MS, nextBeat(state))
    const dt = Math.max(0, nextCursor - cursor) / 1000

    state.threat += dt * riskGrowth(state)
    recoverExhaustion(state, cursor, nextCursor)
    if (state.vaultGold > 0 && state.threat >= 100) stolenOffline += runTheft(state, remainingTheftBudget(), report)

    cursor = nextCursor
    if (state.secureEndsAt !== null && cursor >= state.secureEndsAt) {
      state.secureStartedAt = null
      state.secureEndsAt = null
    }
    settleTrips(state, cursor, report)
    settleArrivals(state, cursor)
  }
  // Ein letzter Durchlauf auf dem Zielzeitpunkt: Was genau jetzt fällig ist, soll auch jetzt
  // gutgeschrieben werden und nicht erst beim nächsten Tick.
  settleArrivals(state, target)
  runMiners(state, target, report)
  dispatchTransporters(state, target)
  runGuards(state, target)

  state.lastTick = now
  state.savedAt = now
  if (report && report.seconds >= 5) state.lastOfflineReport = report
  return state
}

export function buyEquipmentUpgrade(state: GameState, id: EquipmentUpgradeId): GameState {
  const price = equipmentUpgradeCost(state, id)
  if (state.vaultGold < price) return state
  const next = withEquipmentLevel(structuredClone(state), id)
  next.vaultGold -= price
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
