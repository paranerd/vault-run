import { describe, expect, it } from 'vitest'
import {
  EXHAUSTION_BREAK_MS,
  GOLD_FLIGHT_DURATION_MS,
  OFFLINE_THEFT_SHARE,
  automaticTransportRate,
  bootsPace,
  bootsSpeed,
  getCategoryUpgrades,
  lampSight,
  LOSS_PER_MIGHT,
  MANUAL_SECURE_FLOOR_SECONDS,
  MIN_CYCLE_SECONDS,
  manualSecureSeconds,
  manualTripSeconds,
  packCargo,
  stockCapacity,
  exhaustionPerTap,
  exhaustionRecoveryRate,
  getAllUpgrades,
  guardInterval,
  guardMight,
  guardMightTotal,
  getEquipmentUpgrade,
  getSlotUpgrades,
  getUpgradeGroups,
  minerInterval,
  passiveRate,
  transporterTripSeconds,
  riskGrowth,
  guardSight,
  guardRate,
  minerRate,
  minerYield,
  securingRate,
  securityLoss,
  slotStageName,
  slotVisualLevel,
  slotUpgradeCost,
  tapValue,
  transporterCapacity,
  transporterRate,
  UPGRADE_FILTERS,
  vaultCapacity,
  withSlotLevel,
} from './config'
import { formatDecimal, formatGold } from './format'
import {
  advanceGame,
  buyEquipmentUpgrade,
  buySlotUpgrade,
  createInitialState,
  goldToStock,
  stockSpace,
  isPlayerBusy,
  isSecuringManually,
  lowerThreat,
  startTransport,
  tap,
} from './engine'
import { migrateGame } from './storage'
import type { GameState } from './types'

// Die vier Ausrüstungsstücke des Spielers stehen auf ihrer ersten Stufe, solange ein Test nichts
// anderes kauft. Ihre Werte sind dann Konstanten und lesen sich in den Erwartungen wie die
// früheren `MANUAL_*`, hängen aber nachprüfbar an der Ausrüstung statt an einer festen Zahl.
const START = createInitialState(0)
const MANUAL_CARGO = packCargo(START)
const MANUAL_TRIP_SECONDS = manualTripSeconds(START)
const SECURE_COOLDOWN_MS = manualSecureSeconds(START) * 1_000
const MANUAL_SECURE_AMOUNT = lampSight(START)

/** Was `ticks` Takte eines Bergmanns im Beutel ergeben. In den Beutel gehen nur ganze Goldstücke;
    der Bruchteil bleibt am Fels liegen und geht in den nächsten Takt ein. Über die Takte hinweg
    ist die Summe darum immer der abgerundete Ertrag der Rate. */
const mined = (level: number, ticks: number) => Math.floor(ticks * minerYield(level))

/** Seit Schema 9 liegt gefördertes Gold erst im Lager, wenn seine Münze angekommen ist — genau wie
    eine Fuhre erst in der Truhe liegt, wenn ihr Goldhaufen angekommen ist. Wer den Bestand des
    Lagers messen will, muss also bis zur Ankunft des letzten Takts weiterlaufen. */
const afterArrival = (at: number) => at + GOLD_FLIGHT_DURATION_MS

describe('Vault Run engine', () => {
  // Jede Fördermenge ist eine ganze Zahl — und bleibt es über alle Stufen hinweg, damit jeder Takt
  // ein sichtbares Goldstück liefert statt eines Bruchteils.
  it('mines whole gold on every level', () => {
    const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    const rates = levels.map((level) => minerRate(level))

    expect(rates.every(Number.isInteger)).toBe(true)
    expect(rates.slice(0, 6)).toEqual([1, 2, 3, 4, 6, 8])
    // Jede Stufe bringt echten Zuwachs: Ein Aufstieg, der dieselbe Zahl liefert, ist keiner.
    expect(rates.every((rate, index) => index === 0 || rate > rates[index - 1])).toBe(true)
  })

  // Im Beutel landen ausschließlich ganze Goldstücke. Der angebrochene Fund bliebe am Fels liegen
  // und ginge in den nächsten Takt ein — bei ganzzahligen Mengen bleibt dafür nie etwas übrig.
  it('sends only whole gold from the mine into the bag', () => {
    const state = { ...createInitialState(0), minerLevels: [1, 0, 0, 0] as [number, number, number, number] }
    const beat = minerInterval(1) * 1_000
    const banked = [1, 2, 3, 4, 5, 6].map((ticks) => advanceGame(state, afterArrival(ticks * beat)).stockGold)

    expect(banked).toEqual([1, 2, 3, 4, 5, 6])
    expect(banked.every(Number.isInteger)).toBe(true)
    expect(advanceGame(state, beat).minerCarry).toEqual([0, 0, 0, 0])

    // Am Takt selbst ist das Goldstück noch unterwegs: gefördert und für das Lager reserviert,
    // aber noch nicht darin.
    const justMined = advanceGame(state, beat)
    expect(justMined.stockGold).toBe(0)
    expect(justMined.stockArrivals).toEqual([{ gold: 1, at: afterArrival(beat) }])
    expect(justMined.lifetimeGold).toBe(1)

    // Über viele Takte hinweg ist die Summe exakt die Rate.
    const long = advanceGame(state, 40 * beat)
    expect(long.lifetimeGold).toBe(mined(1, 40))
  })

  // Beide Strecken laufen nach derselben Regel: Gold gehört dem Behälter, wenn es angekommen ist.
  // Erst fliegen zehn Münzen zum Lager, dann fliegt der Haufen daraus zur Truhe.
  it('moves gold from the bag into the treasure chest in a timed trip', () => {
    let state = createInitialState(0)
    for (let index = 0; index < 10; index += 1) state = tap(state, 0)

    expect(state.stockGold).toBe(0)
    state = advanceGame(state, afterArrival(0))
    expect(state.stockGold).toBe(10)

    const departure = afterArrival(0)
    state = startTransport(state, departure)
    expect(state.stockGold).toBe(0)
    expect(state.playerTrip?.gold).toBe(10)
    expect(state.vaultGold).toBe(0)

    state = advanceGame(state, afterArrival(departure) - 1)
    expect(state.playerTrip?.gold).toBe(10)
    expect(state.vaultGold).toBe(0)

    state = advanceGame(state, afterArrival(departure))
    expect(state.playerTrip?.gold).toBe(0)
    expect(state.vaultGold).toBe(10)
    expect(state.playerTrip?.endsAt).toBe(departure + MANUAL_TRIP_SECONDS * 1_000)

    state = advanceGame(state, departure + MANUAL_TRIP_SECONDS * 1_000)
    expect(state.tripCount).toBe(1)
    expect(state.playerTrip).toBeNull()
  })

  // Beide Strecken folgen derselben Regel: Gold gehört einem Behälter, wenn es dort **angekommen**
  // ist. Vorher buchte der Schlag sein Gold sofort ins Lager, während die Fuhre ihres erst nach der
  // Ankunftsanimation in der Truhe ablegte — dieselbe fliegende Ladung bedeutete an den beiden
  // Enden der Kette Verschiedenes.
  it('credits both containers on arrival, never on departure', () => {
    const swung = tap(createInitialState(0), 0)
    expect(swung.stockGold).toBe(0)
    expect(goldToStock(swung)).toBe(tapValue(swung))
    expect(advanceGame(swung, afterArrival(0) - 1).stockGold).toBe(0)
    expect(advanceGame(swung, afterArrival(0)).stockGold).toBe(tapValue(swung))

    const departed = startTransport({ ...createInitialState(0), stockGold: MANUAL_CARGO }, 0)
    expect(departed.vaultGold).toBe(0)
    expect(advanceGame(departed, afterArrival(0) - 1).vaultGold).toBe(0)
    expect(advanceGame(departed, afterArrival(0)).vaultGold).toBe(MANUAL_CARGO)
  })

  // Der Platz im Lager ist ab dem Losfliegen belegt. Ohne diese Reservierung schlüge der Spieler
  // weiter gegen ein Lager, das gleich voll ist, und bezahlte jeden dieser Schläge mit Erschöpfung
  // für Gold, das bei der Ankunft keinen Platz mehr fände.
  it('reserves the stock space while the gold is still on its way', () => {
    const state = createInitialState(0)
    const brim = { ...state, stockGold: stockCapacity(state) - tapValue(state) }
    const swung = tap(brim, 0)

    expect(goldToStock(swung)).toBe(tapValue(state))
    expect(stockSpace(swung)).toBe(0)
    // Der nächste Schlag wird abgelehnt, obwohl im Lager rechnerisch noch Platz ist.
    expect(swung.stockGold).toBeLessThan(stockCapacity(state))
    expect(tap(swung, 0)).toBe(swung)
  })

  // Angestellte legen die Hacke nicht weg, weil ihr Dienstherr einen Sack trägt: Die eigene Fuhre
  // bindet ihn, nicht seine Bergleute — auch dann nicht, wenn noch kein Fuhrknecht angestellt ist.
  it('keeps the miners working while the player carries a load himself', () => {
    let state = createInitialState(0)
    state.minerLevels = [1, 0, 0, 0]
    state.stockGold = 20
    state = startTransport(state, 0)
    expect(state.stockGold).toBe(0)

    state = advanceGame(state, afterArrival(5_000))
    expect(state.stockGold).toBe(mined(1, 5))
  })

  // Der Beutel ist die Grenze der Förderung. Ein Bergmann, der in den vollen Beutel weiterschlägt,
  // fördert ausschließlich in den Verlust — über eine Nacht ein Vielfaches des Beutels an Gold,
  // das nie irgendwo ankommt.
  it('rests the mine while the bag is full', () => {
    const state = { ...createInitialState(0), minerLevels: [2, 1, 0, 0] as [number, number, number, number] }
    const filled = advanceGame(state, 60_000)
    expect(filled.stockGold).toBeCloseTo(stockCapacity(state), 5)

    const later = advanceGame(filled, 60 * 60_000)
    expect(later.stockGold).toBeCloseTo(stockCapacity(state), 5)
    expect(later.lifetimeGold).toBeCloseTo(filled.lifetimeGold, 5)
    expect(later.lostGold).toBeCloseTo(filled.lostGold, 5)
    // Ohne Takt keine Animation: Die ruhende Mine meldet keine Förderung mehr.
    expect(later.minerBeats).toEqual([null, null, null, null])
  })

  // Ruht die ganze Mine am vollen Beutel und ist sonst nichts in Bewegung, ist der Tick leer wie
  // vor der ersten Anstellung — dann darf er auch dieselbe Referenz zurückgeben.
  it('lies dormant while a full bag rests the whole mine', () => {
    const state = { ...createInitialState(0), minerLevels: [1, 0, 0, 0] as [number, number, number, number] }
    const filled = advanceGame(state, 5 * 60_000)
    expect(filled.stockGold).toBeCloseTo(stockCapacity(state), 5)
    expect(filled.minerBeats).toEqual([null, null, null, null])

    const ticked = advanceGame(filled, 5 * 60_000 + 10_000)
    expect(ticked).toBe(filled)
    expect(ticked.lastTick).toBe(5 * 60_000 + 10_000)

    // Und die Ruhe endet, sobald eine Fuhre Platz schafft — ohne die Ruhezeit nachzuholen.
    const room = { ...ticked, stockGold: ticked.stockGold - MANUAL_CARGO }
    const resumed = advanceGame(room, afterArrival(5 * 60_000 + 10_000 + minerInterval(1) * 1_000))
    // Angerechnet wird der Takt mitsamt dem Fund, der seit der Ruhe am Fels liegt — ins Beutel
    // wandert davon nur, was zusammen ein ganzes Goldstück ergibt.
    const portion = Math.floor(room.minerCarry[0] + minerYield(1))
    expect(resumed.stockGold).toBeCloseTo(stockCapacity(state) - MANUAL_CARGO + portion, 5)
  })

  // „Ruht“ heißt nicht „holt später nach“: Nach der Ruhe beginnt ein Bergmann seinen Takt neu,
  // statt jede stillgelegte Sekunde in einem Schwall zu liefern.
  it('starts a fresh cycle after the bag makes room again instead of catching up', () => {
    const state = { ...createInitialState(0), minerLevels: [1, 0, 0, 0] as [number, number, number, number] }
    const capacity = stockCapacity(state)
    const idle = advanceGame({ ...state, stockGold: capacity }, 10 * 60_000)
    expect(idle.stockGold).toBeCloseTo(capacity, 5)

    // Eine Fuhre schafft Platz. Danach steht genau eine Portion an — nach einem vollen Takt, nicht
    // zehn Minuten Ruhe auf einen Schlag.
    const room = { ...idle, stockGold: capacity - MANUAL_CARGO }
    const beat = minerInterval(1) * 1_000
    expect(advanceGame(room, afterArrival(10 * 60_000 + beat) - 1).stockGold).toBeCloseTo(capacity - MANUAL_CARGO, 5)
    // Zwei Takte ergeben zusammen das erste ganze Goldstück — und nur dieses eine, nicht die zehn
    // Minuten Ruhe davor.
    expect(advanceGame(room, afterArrival(10 * 60_000 + 2 * beat)).stockGold).toBeCloseTo(capacity - MANUAL_CARGO + mined(1, 2), 5)
  })

  // Die eigene Fuhre nimmt den Beutel mit und lässt die Mine laufen: Bei der Rückkehr liegt darin
  // genau das, was die Bergleute währenddessen gefördert haben — nicht mehr und nicht weniger.
  it('fills the bag with what the miners dig while the player is on the road', () => {
    let state = { ...createInitialState(0), minerLevels: [1, 0, 0, 0] as [number, number, number, number] }
    state = advanceGame(state, afterArrival(5_000))
    expect(state.stockGold).toBeCloseTo(mined(1, 5), 5)

    const departure = afterArrival(5_000)
    const travelling = startTransport(state, departure)
    expect(travelling.stockGold).toBe(0)
    expect(travelling.minerBeats[0]).not.toBeNull()

    // Die Fuhre nimmt nur mit, was schon im Lager liegt. Zurück ist er nach seiner Reisezeit; im
    // Lager liegt dann, was die Bergleute in dieser Zeit gefördert **und geliefert** haben.
    const returned = advanceGame(travelling, departure + MANUAL_TRIP_SECONDS * 1_000)
    expect(returned.playerTrip).toBeNull()
    expect(returned.stockGold).toBe(mined(1, MANUAL_TRIP_SECONDS))
  })

  // Dasselbe für die Sicherung von Hand: Sie bindet den Spieler, nicht seine Bergleute. Auch ohne
  // eine einzige Wache läuft die Mine durch — was er selbst tut, hält keine Automatik an.
  it('keeps the miners working through a manual securing', () => {
    const mining = advanceGame({ ...createInitialState(0), minerLevels: [1, 0, 0, 0] as [number, number, number, number], threat: 50 }, afterArrival(5_000))
    const securing = lowerThreat(mining, afterArrival(5_000))
    expect(isSecuringManually(securing)).toBe(true)
    expect(isPlayerBusy(securing)).toBe(true)

    const held = advanceGame(securing, afterArrival(6_000))
    expect(held.stockGold).toBe(mining.stockGold + mined(1, 1))
    expect(held.minerBeats[0]).not.toBeNull()

    // Und über die Sicherung hinaus läuft der Takt einfach weiter, ohne Bruch.
    const released = advanceGame(held, afterArrival(8_000))
    expect(released.secureEndsAt).toBeNull()
    expect(released.stockGold).toBe(mined(1, 8))
  })

  // Eine durchschlafene Nacht ohne Transport füllt den Beutel und lässt es dabei bewenden: Was
  // darüber hinaus verloren geht, ist die eine Portion, die den Beutel bis zum Rand aufgefüllt hat.
  it('loses no more than the topping-up portion across a night without transport', () => {
    const state = { ...createInitialState(0), minerLevels: [3, 3, 3, 3] as [number, number, number, number] }
    const returned = advanceGame(state, 8 * 60 * 60 * 1_000, true)

    expect(returned.stockGold).toBeCloseTo(stockCapacity(state), 5)
    expect(returned.lostGold).toBeLessThanOrEqual(minerYield(3))
    expect(returned.lastOfflineReport?.earned).toBeCloseTo(stockCapacity(state), 5)
  })

  it('does not produce or count losses when tapping a full bag', () => {
    const state = createInitialState(0)
    state.stockGold = stockCapacity(state)
    const tapped = tap(state)
    expect(tapped).toBe(state)
    expect(tapped.lifetimeGold).toBe(0)
    expect(tapped.lostGold).toBe(0)
  })

  it('accepts consecutive mining taps without a cooldown', () => {
    let state = createInitialState(0)
    state = tap(state, 0)
    state = tap(state, 0)
    // Beide Schläge sind angenommen; ihr Gold fliegt und liegt eine Flugzeit später im Lager.
    expect(state.lifetimeGold).toBe(2)
    expect(goldToStock(state)).toBe(2)
    expect(advanceGame(state, afterArrival(0)).stockGold).toBe(2)
  })

  it('forces a break only after exhaustion reaches 100 percent', () => {
    let state = createInitialState(0)
    // Die Pause muss länger dauern als die Reaktion, die sie erzwingen soll — sonst tippt man
    // durch sie hindurch, und der einzige Preis des Dauerschürfens kostet nichts. Nach oben
    // begrenzt sie die Erholung selbst: Stehenbleiben darf nie länger dauern als Abkühlen.
    expect(EXHAUSTION_BREAK_MS).toBeGreaterThanOrEqual(2_000)
    expect(EXHAUSTION_BREAK_MS).toBeLessThanOrEqual((100 / exhaustionRecoveryRate(state)) * 1_000)

    const safeTaps = Math.floor(99 / exhaustionPerTap(state))
    for (let index = 0; index < safeTaps; index += 1) state = tap(state, 0)

    expect(state.exhaustion).toBeLessThan(100)
    expect(state.exhaustedUntil).toBeNull()

    state = tap(state, 0)
    expect(state.exhaustion).toBe(100)
    expect(state.exhaustedUntil).toBe(EXHAUSTION_BREAK_MS)
    expect(tap(state, EXHAUSTION_BREAK_MS - 1)).toBe(state)

    const breakOver = advanceGame(state, EXHAUSTION_BREAK_MS)
    expect(breakOver.exhaustion).toBe(100)
    expect(breakOver.exhaustedUntil).toBeNull()

    const recovering = advanceGame(breakOver, EXHAUSTION_BREAK_MS + 500)
    expect(recovering.exhaustion).toBeCloseTo(100 - exhaustionRecoveryRate(state) * 0.5, 5)
    expect(tap(recovering, EXHAUSTION_BREAK_MS + 500)).not.toBe(recovering)
  })

  it('starts recovering immediately when the player stops before 100 percent', () => {
    let state = createInitialState(0)
    for (let index = 0; index < 16; index += 1) state = tap(state, 0)
    expect(state.exhaustion).toBe(96)
    expect(advanceGame(state, 500).exhaustion).toBe(86)
  })

  it('makes each pickaxe level less exhausting and recovers while offline', () => {
    const base = createInitialState(0)
    const improved = { ...base, tapLevel: 1 }
    expect(exhaustionPerTap(improved)).toBeLessThan(exhaustionPerTap(base))
    expect(getEquipmentUpgrade(base, 'tap').facts[2]).toEqual({
      from: formatDecimal(exhaustionPerTap(base)),
      to: formatDecimal(exhaustionPerTap(improved)),
      label: 'Erschöpfung',
    })

    const tired = { ...base, exhaustion: 60 }
    expect(advanceGame(tired, 10_000, true).exhaustion).toBe(0)
  })

  // Jeder Fuhrknecht lädt seine eigene Ladung, die eigene Fuhre kommt daneben obendrauf.
  it('sends every transporter on its own trip beside the player', () => {
    let state = createInitialState(0)
    state.transporterLevels = [1, 2, 0, 0]
    state.stockGold = 200
    state = startTransport(state, 0)
    expect(state.playerTrip?.gold).toBe(MANUAL_CARGO)

    state = advanceGame(state, 1)
    expect(state.transporterTrips[0]?.gold).toBeCloseTo(transporterCapacity(1), 6)
    expect(state.transporterTrips[1]?.gold).toBeCloseTo(transporterCapacity(2), 6)
    expect(state.transporterTrips[2]).toBeNull()
    // Jede Fuhre hat ihre eigene Dauer — die stärkere ist schneller zurück.
    expect(state.transporterTrips[1]!.endsAt).toBeLessThan(state.transporterTrips[0]!.endsAt)
  })

  it('credits a load on animation arrival without ending its trip', () => {
    let state = createInitialState(0)
    state.stockGold = MANUAL_CARGO
    state = startTransport(state, 0)
    const endsAt = state.playerTrip?.endsAt

    state = advanceGame(state, GOLD_FLIGHT_DURATION_MS - 1)
    expect(state.vaultGold).toBe(0)

    state = advanceGame(state, GOLD_FLIGHT_DURATION_MS)
    expect(state.vaultGold).toBe(MANUAL_CARGO)
    expect(state.playerTrip?.endsAt).toBe(endsAt)
  })

  it('blocks manual mining while the player is on the road', () => {
    let state = createInitialState(0)
    state.transporterLevels = [1, 0, 0, 0]
    state.stockGold = 20
    state = startTransport(state, 0)

    const tapped = tap(state)
    expect(tapped).toBe(state)
  })

  it('lets transporters keep mining active and start follow-up trips automatically', () => {
    let state = createInitialState(0)
    state.minerLevels = [1, 0, 0, 0]
    state.transporterLevels = [1, 0, 0, 0]
    state.stockGold = 20
    state = advanceGame(state, 30_000)
    expect(state.tripCount).toBeGreaterThan(1)
    expect(state.vaultGold).toBeGreaterThan(20)
  })

  it('caps offline simulation at eight hours', () => {
    let state = createInitialState(0)
    state.minerLevels = [1, 0, 0, 0]
    state.transporterLevels = [1, 0, 0, 0]
    state = advanceGame(state, 24 * 60 * 60 * 1000, true)
    expect(state.lastOfflineReport?.seconds).toBe(8 * 60 * 60)
  })

  it('levels each of the four equal slots independently', () => {
    let state = createInitialState(0)
    state.vaultGold = slotUpgradeCost(state, 'miners', 2)
    state = buySlotUpgrade(state, 'miners', 2)
    expect(state.minerLevels).toEqual([0, 0, 1, 0])
    expect(passiveRate(state)).toBeGreaterThan(0)
  })

  it('shows the first sprite for every right-side upgrade at level one', () => {
    expect(slotVisualLevel('miners', 0)).toBe(0)
    expect(slotVisualLevel('miners', 1)).toBe(0)
    expect(slotVisualLevel('miners', 2)).toBe(1)
    expect(slotVisualLevel('transporters', 0)).toBe(0)
    expect(slotVisualLevel('transporters', 1)).toBe(0)
    expect(slotVisualLevel('transporters', 2)).toBe(1)
  })

  it('spends only secured treasure-chest gold on equipment', () => {
    let state = createInitialState(0)
    state.stockGold = 10_000
    expect(buyEquipmentUpgrade(state, 'tap')).toBe(state)

    state.vaultGold = getEquipmentUpgrade(state, 'tap').cost
    const upgraded = buyEquipmentUpgrade(state, 'tap')
    expect(upgraded.tapLevel).toBe(1)
    expect(upgraded.vaultGold).toBe(0)
  })

  it('scales bag, chest and automatic transport capacity', () => {
    const state = createInitialState(0)
    expect(stockCapacity({ ...state, stockLevel: 1 })).toBeGreaterThan(stockCapacity(state))
    expect(vaultCapacity({ ...state, vaultLevel: 1 })).toBeGreaterThan(vaultCapacity(state))
    expect(transporterCapacity(2)).toBeGreaterThan(transporterCapacity(1))
  })

  // Kein Takt im Spiel läuft schneller als eine Sekunde. Das deckelt zugleich die Animationen:
  // Bei vollem Ausbau liefern höchstens zwölf Einheiten je Sekunde je einmal.
  it('never lets a unit cycle faster than once a second', () => {
    for (let level = 1; level <= 40; level += 1) {
      expect(minerInterval(level)).toBeGreaterThanOrEqual(1)
      expect(transporterTripSeconds(level)).toBeGreaterThanOrEqual(1)
      expect(guardInterval(level)).toBeGreaterThanOrEqual(1)
    }
  })

  // Jede Stufe verbessert die Einheit. Bergleute takten fest im Sekundentakt, dort trägt allein
  // die Menge das Wachstum; Fuhrknechte und Wachen legen bei Menge und Takt zu.
  it('improves every unit with every level', () => {
    for (let level = 1; level <= 8; level += 1) {
      expect(minerInterval(level + 1)).toBe(minerInterval(level))
      expect(minerRate(level + 1)).toBeGreaterThan(minerRate(level))
      expect(minerYield(level + 1)).toBeGreaterThan(minerYield(level))
      expect(transporterTripSeconds(level + 1)).toBeLessThan(transporterTripSeconds(level))
      expect(transporterCapacity(level + 1)).toBeGreaterThan(transporterCapacity(level))
      expect(guardInterval(level + 1)).toBeLessThan(guardInterval(level))
      expect(guardSight(level + 1)).toBeGreaterThan(guardSight(level))
      expect(guardMight(level + 1)).toBeGreaterThan(guardMight(level))
    }
  })

  // Eine Gruppe ist nichts als die Summe ihrer Einheiten — kein Trupp-Bonus, kein Sammel-Teiler.
  it('adds up a group from its units and nothing else', () => {
    const state = { ...createInitialState(0), transporterLevels: [3, 1, 0, 0] as [number, number, number, number], guardLevels: [2, 1, 0, 0] as [number, number, number, number] }
    expect(automaticTransportRate(state)).toBeCloseTo(transporterRate(3) + transporterRate(1), 6)
    expect(securingRate(state)).toBeCloseTo(guardRate(2) + guardRate(1), 6)
    expect(passiveRate({ ...state, minerLevels: [2, 1, 0, 0] })).toBeCloseTo(minerRate(2) + minerRate(1), 6)
  })

  // Jede Karte führt ihre Attribute als Tabelle: Stufe zuerst, dann jeder Wert vorher und nachher.
  it('lists every attribute of a card before and after the purchase', () => {
    const state = createInitialState(0)
    const upgrades = [getEquipmentUpgrade(state, 'tap'), ...getSlotUpgrades(state, 'mine')]
    expect(upgrades).toHaveLength(5)
    expect(upgrades.every((upgrade) => upgrade.facts.every((entry) => entry.from && entry.to))).toBe(true)

    expect(upgrades[0].facts).toEqual([
      { from: 'Stufe 1', to: 'Stufe 2', label: '' },
      { from: '1', to: '2', label: 'Fördermenge' },
      { from: '6', to: '5,4', label: 'Erschöpfung' },
    ])
    // Ein unbesetzter Slot hat keinen Vorher-Wert — dort steht ein Strich statt einer erfundenen Null.
    // Bergleute takten immer im Sekundentakt — ihre Karte braucht deshalb keine Taktzeile.
    expect(upgrades[1].facts).toEqual([
      { from: 'Stufe 0', to: 'Stufe 1', label: '' },
      { from: '–', to: `${minerRate(1)}`, label: 'Fördermenge' },
    ])
  })

  // Eine Stufe, die rechnerisch nichts bringt, muss das zeigen — die Karte fordert zum Kauf auf.
  // `tapValue` rundet auf, weshalb Stufe 3 → 4 denselben Wert liefert wie Stufe 2 → 3.
  it('admits it when a level adds nothing at all', () => {
    const [, hit] = getEquipmentUpgrade({ ...createInitialState(0), tapLevel: 2 }, 'tap').facts
    expect(hit.to).toBe(hit.from)
  })

  // Die Karte nennt den Rang, auf dem die Einheit **steht** — nicht den nach dem Kauf. Oberhalb
  // der letzten benannten Stufe bleibt der Name stehen, während die Stufennummer weiterzählt.
  it('names the rank an upgrade stands on and keeps it above the last named stage', () => {
    const state = createInitialState(0)
    expect(getSlotUpgrades(state, 'mine')[0].name).toBe('Leerer Stollen')
    expect(getSlotUpgrades({ ...state, minerLevels: [1, 0, 0, 0] }, 'mine')[0].name).toBe('Tagelöhner')
    expect(slotStageName('miners', 10)).toBe('Steingolem')
    expect(slotStageName('miners', 11)).toBe(slotStageName('miners', 10))
    expect(getEquipmentUpgrade(state, 'tap').name).toBe('Rostige Pickhacke')
    expect(getEquipmentUpgrade({ ...state, tapLevel: 10 }, 'tap').name)
      .toBe(getEquipmentUpgrade({ ...state, tapLevel: 9 }, 'tap').name)
  })

  // Die Stufenzeile vergleicht als einzige keinen Wert; ihr Namensfeld stand deshalb quer zur
  // Spalte, in der überall sonst das Attribut steht. Sie besteht jetzt nur noch aus zwei Nummern.
  it('reduces the stage row to its two numbers', () => {
    for (const card of getAllUpgrades(createInitialState(0))) {
      expect(card.facts[0]).toEqual({ from: `Stufe ${card.stage}`, to: `Stufe ${card.stage + 1}`, label: '' })
    }
  })

  it('uses the promised integer pickaxe value in gameplay and upgrade stats', () => {
    const state = { ...createInitialState(0), tapLevel: 4 }
    const upgraded = getEquipmentUpgrade(state, 'tap')
    expect(tapValue(state)).toBe(5)
    expect(upgraded.facts[1]).toEqual({ from: '5', to: '6', label: 'Fördermenge' })
    expect(advanceGame(tap(state, 0), afterArrival(0)).stockGold).toBe(5)
  })

  it('reduces attention by clicking the treasure chest action', () => {
    const state = { ...createInitialState(0), threat: 50 }
    const secured = lowerThreat(state, 0)
    expect(secured.threat).toBe(50 - MANUAL_SECURE_AMOUNT)
    expect(state.threat).toBe(50)
  })

  it('blocks every action while an unguarded player secures by hand', () => {
    const state = { ...createInitialState(0), threat: 50, stockGold: 40 }
    const securing = lowerThreat(state, 0)
    expect(isSecuringManually(securing)).toBe(true)
    expect(tap(securing).stockGold).toBe(40)
    expect(startTransport(securing, 10).playerTrip).toBeNull()
    expect(lowerThreat(securing, 10).threat).toBe(securing.threat)

    const released = advanceGame(securing, SECURE_COOLDOWN_MS + 1)
    expect(released.secureEndsAt).toBeNull()
    expect(isSecuringManually(released)).toBe(false)
  })

  it('lets guards secure on their own without stopping the realm', () => {
    const guarded = { ...createInitialState(0), threat: 60, guardLevels: [1, 1, 0, 0] as [number, number, number, number] }
    const securing = lowerThreat(guarded, 0)
    expect(securing.secureEndsAt).not.toBeNull()
    expect(isSecuringManually(securing)).toBe(false)

    // Beide Wachen takten für sich; nach dem Takt der ersten ist genau deren Beitrag abgetragen.
    const interval = guardInterval(1) * 1_000
    const ticked = advanceGame(guarded, interval + 10)
    expect(ticked.threat).toBeCloseTo(60 - 2 * guardSight(1), 5)

    // Und die Mine fördert während der Sicherung durch — stillgelegt wird sie nur ohne Wachen.
    // Der Bergmann steht auf Stufe 3, damit schon sein erster Takt ein ganzes Goldstück ergibt und
    // dieser Takt noch in die laufende Sicherung fällt; im Lager liegt seine Förderung eine
    // Flugzeit später.
    const mining = { ...guarded, minerLevels: [3, 0, 0, 0] as [number, number, number, number] }
    const beat = minerInterval(3) * 1_000
    expect(beat).toBeLessThan(SECURE_COOLDOWN_MS)
    expect(advanceGame(lowerThreat(mining, 0), afterArrival(beat)).stockGold).toBeCloseTo(mined(3, 1), 5)
  })

  // Der Spieler ist eine Person: Was er tut, tut er mit beiden Händen. Jede laufende Aktion sperrt
  // deshalb die beiden anderen — auch die Sicherung, die mit Wachen das Reich nicht mehr anhält.
  it('lets one manual action block the other two', () => {
    const busy = { ...createInitialState(0), threat: 50, stockGold: 40, guardLevels: [1, 0, 0, 0] as [number, number, number, number] }

    const securing = lowerThreat(busy, 0)
    expect(isPlayerBusy(securing)).toBe(true)
    // Die Mine läuft mit Wachen weiter — die Hände des Spielers sind trotzdem gebunden.
    expect(isSecuringManually(securing)).toBe(false)
    expect(tap(securing)).toBe(securing)
    expect(startTransport(securing, 10)).toBe(securing)

    const travelling = startTransport(busy, 0)
    expect(isPlayerBusy(travelling)).toBe(true)
    expect(tap(travelling)).toBe(travelling)
    expect(startTransport(travelling, 10)).toBe(travelling)
    // Wache geht nur, wer da ist: Unterwegs lässt sich das Risiko nicht von Hand senken.
    expect(lowerThreat(travelling, 10)).toBe(travelling)
  })

  // Und sobald die laufende Aktion vorbei ist, hat der Spieler wieder beide Hände frei.
  it('frees every manual action again once the player is done', () => {
    const busy = { ...createInitialState(0), threat: 50, stockGold: 40, guardLevels: [1, 0, 0, 0] as [number, number, number, number] }

    const released = advanceGame(lowerThreat(busy, 0), SECURE_COOLDOWN_MS)
    expect(isPlayerBusy(released)).toBe(false)
    expect(goldToStock(tap(released, SECURE_COOLDOWN_MS))).toBeGreaterThan(0)
    expect(startTransport(released, SECURE_COOLDOWN_MS).playerTrip).not.toBeNull()

    const returned = advanceGame(startTransport(busy, 0), MANUAL_TRIP_SECONDS * 1_000)
    expect(isPlayerBusy(returned)).toBe(false)
    expect(lowerThreat(returned, MANUAL_TRIP_SECONDS * 1_000).threat).toBe(returned.threat - MANUAL_SECURE_AMOUNT)
  })

  it('keeps a guarded treasury safe across a long offline stretch', () => {
    const levels = [3, 3, 3, 3] as [number, number, number, number]
    const state = { ...createInitialState(0), vaultGold: 400, stockGold: 40, stockLevel: 2, guardLevels: levels, minerLevels: levels }
    const returned = advanceGame(state, 6 * 60 * 60 * 1_000, true)
    expect(returned.theftCount).toBe(0)
    expect(returned.vaultGold).toBe(400)
    expect(returned.threat).toBeLessThan(100)
  })

  it('robs the treasury once the risk runs full', () => {
    const state = { ...createInitialState(0), vaultGold: 400, threat: 95 }
    const robbed = advanceGame(state, 30_000)
    expect(robbed.theftCount).toBe(1)
    expect(robbed.vaultGold).toBeCloseTo(400 * (1 - securityLoss(state)), 5)
    expect(robbed.threat).toBeLessThan(100)
  })

  it('leaves the bag and the shipment on the road untouched by a raid', () => {
    let state = { ...createInitialState(0), vaultGold: 400, stockGold: 65, threat: 95 }
    state = startTransport(state, 0)
    const carried = state.playerTrip?.gold ?? 0
    expect(carried).toBe(MANUAL_CARGO)

    const robbed = advanceGame(state, 30_000)
    expect(robbed.theftCount).toBe(1)
    expect(robbed.stockGold).toBe(65 - MANUAL_CARGO)
  })

  it('builds no risk at all before the first delivery reaches the treasury', () => {
    const state = { ...createInitialState(0), stockGold: 40, minerLevels: [2, 2, 0, 0] as [number, number, number, number] }
    expect(riskGrowth(state)).toBe(0)
    const returned = advanceGame(state, 10 * 60 * 1_000)
    expect(returned.threat).toBe(0)
    expect(returned.theftCount).toBe(0)
  })

  // Der Kern des Risikos: Es darf nicht dauerhaft abzuschalten sein. Ein fester Deckel gegen
  // Wachen, die unbegrenzt weiterwachsen, hatte genau das erlaubt — drei billigste Wachen für
  // 450 Gold stellten es auf null und nahmen dem Spiel seinen ganzen Diebstahl-Teil.
  it('keeps outgrowing a troop that stops being upgraded', () => {
    const cheapTroop = [1, 1, 1, 0] as [number, number, number, number]
    const early = { ...createInitialState(0), guardLevels: cheapTroop }
    const late = { ...early, vaultLevel: 8 }

    expect(securingRate(early)).toBeGreaterThan(riskGrowth({ ...early, vaultGold: vaultCapacity(early) }))
    expect(securingRate(late)).toBeLessThan(riskGrowth({ ...late, vaultGold: vaultCapacity(late) }))

    const robbed = advanceGame({ ...late, vaultGold: vaultCapacity(late), threat: 50 }, 2 * 60 * 60 * 1_000)
    expect(robbed.theftCount).toBeGreaterThan(0)
  })

  // Der Gegenzug bleibt trotzdem der Truhenausbau: Er verdreifacht die Kapazität, der Füllstand
  // fällt auf gut 40 % — mehr, als der Stufenfaktor dagegenhält.
  it('still relieves the pressure the moment the treasury is enlarged', () => {
    for (let vaultLevel = 0; vaultLevel <= 8; vaultLevel += 1) {
      const before = { ...createInitialState(0), vaultLevel }
      const full = { ...before, vaultGold: vaultCapacity(before) }
      expect(riskGrowth({ ...full, vaultLevel: vaultLevel + 1 })).toBeLessThan(riskGrowth(full))
    }
  })

  it('grows the risk faster the fuller the treasury sits', () => {
    const base = createInitialState(0)
    const light = { ...base, vaultGold: vaultCapacity(base) * 0.1 }
    const full = { ...base, vaultGold: vaultCapacity(base) }
    expect(riskGrowth(full)).toBeGreaterThan(riskGrowth(light))
  })

  it('caps how much a single offline stretch can steal from the treasury', () => {
    const state = { ...createInitialState(0), vaultGold: 400, threat: 95 }
    const returned = advanceGame(state, 8 * 60 * 60 * 1_000, true)
    expect(returned.theftCount).toBeGreaterThan(1)
    expect(returned.vaultGold).toBeCloseTo(400 * (1 - OFFLINE_THEFT_SHARE), 5)
    expect(returned.lastOfflineReport?.stolen).toBeCloseTo(400 * OFFLINE_THEFT_SHARE, 5)
  })

  it('still robs a treasury that only fills up while the player is away', () => {
    const levels = [3, 3, 3, 3] as [number, number, number, number]
    const state = { ...createInitialState(0), vaultGold: 0, stockLevel: 4, vaultLevel: 4, minerLevels: levels, transporterLevels: levels }
    const returned = advanceGame(state, 8 * 60 * 60 * 1_000, true)
    const delivered = returned.lastOfflineReport?.delivered ?? 0

    expect(delivered).toBeGreaterThan(0)
    expect(returned.theftCount).toBeGreaterThan(0)
    expect(returned.lastOfflineReport?.stolen ?? 0).toBeLessThanOrEqual(delivered * OFFLINE_THEFT_SHARE + 0.001)
  })

  // Der Schadensdeckel hängt seit der dritten Wachen-Zeile an der **Kraft** des Trupps, nicht mehr
  // an der Summe der Stufen: dieselbe Kurve, aber eine Zahl, die auf der Karte steht.
  it('shrinks the raid loss through the might of the guards', () => {
    const state = createInitialState(0)
    const guarded = { ...state, guardLevels: [1, 1, 0, 0] as [number, number, number, number] }
    expect(securityLoss(guarded)).toBeLessThan(securityLoss(state))
    expect(guardMightTotal(guarded)).toBe(guardMight(1) * 2)
    expect(securityLoss(guarded)).toBeCloseTo(0.08 * LOSS_PER_MIGHT ** guardMightTotal(guarded), 9)

    // Zwei Wachen auf Stufe 1 sind für den Deckel dasselbe wie eine auf Stufe 2: Kraft ist additiv
    // und kennt keinen Trupp-Bonus, wie jede andere Größe einer Gruppe auch.
    const levelled = { ...state, guardLevels: [2, 0, 0, 0] as [number, number, number, number] }
    expect(securityLoss(levelled)).toBeCloseTo(securityLoss(guarded), 9)
  })

  // Die Wachen-Karte nennt die Punkte, die der Trupp je Sicherung zusätzlich abträgt — dieselbe
  // Einheit, in der die Risikokachel steigt. Der Takt gehört ebenfalls der einzelnen Wache; nur
  // die Kraft wirkt erst als Summe und trägt ihre Erklärung darum im Gruppenhinweis.
  it('measures a guard in the risk it takes off per second by itself', () => {
    const state = createInitialState(0)
    // Sichtweite, Dauer und Kraft — was eine Sicherung abträgt, wie lange die Wache bis zur
    // nächsten braucht und was sie beiträgt, wenn die Diebe doch durchkommen.
    expect(getSlotUpgrades(state, 'vault')[0].facts).toEqual([
      { from: 'Stufe 0', to: 'Stufe 1', label: '' },
      { from: '–', to: `${guardSight(1)}`, label: 'Sichtweite' },
      { from: '–', to: `${formatDecimal(guardInterval(1))}`, label: 'Dauer' },
      { from: '–', to: `${guardMight(1)}`, label: 'Kraft' },
    ])

    // Eine zweite Wache daneben ändert nichts an diesen Zeilen — jede sichert für sich.
    const guarded = { ...state, guardLevels: [0, 3, 0, 0] as [number, number, number, number] }
    expect(getSlotUpgrades(guarded, 'vault')[0].facts).toEqual(getSlotUpgrades(state, 'vault')[0].facts)
  })

  // Ein Fuhrknecht nennt, was er trägt und wie lange er dafür braucht — nicht den Quotienten.
  it('describes a transporter by its load and its travel time', () => {
    const state = createInitialState(0)
    const [, load, travel] = getSlotUpgrades(state, 'stock')[0].facts
    expect(load).toEqual({ from: '–', to: formatGold(transporterCapacity(1)), label: 'Ladung' })
    expect(travel).toEqual({ from: '–', to: formatDecimal(transporterTripSeconds(1)), label: 'Dauer' })

    const staffed = { ...state, transporterLevels: [3, 0, 0, 0] as [number, number, number, number] }
    expect(getSlotUpgrades(staffed, 'stock')[0].facts[1]).toEqual({
      from: formatGold(transporterCapacity(3)),
      to: formatGold(transporterCapacity(4)),
      label: 'Ladung',
    })
  })

  // Der Kern der Karte: Ihre Zahl steht still, wenn nebenan gekauft wird. Bei den Bergleuten gilt
  // das immer, bei Fuhrknechten und Wachen, sobald das Gespann einmal steht — sie sind additiv.
  it('holds every card number steady when a neighbouring slot is bought', () => {
    const state = {
      ...createInitialState(0),
      minerLevels: [2, 1, 0, 0] as [number, number, number, number],
      transporterLevels: [3, 1, 0, 0] as [number, number, number, number],
      guardLevels: [2, 1, 0, 0] as [number, number, number, number],
    }
    const sections = [['mine', 'miners'], ['stock', 'transporters'], ['vault', 'guards']] as const
    for (const [section, group] of sections) {
      const before = getSlotUpgrades(state, section)[0].facts
      const neighbourBought = getSlotUpgrades(withSlotLevel(state, group, 2), section)[0].facts
      expect(neighbourBought).toEqual(before)
    }
  })

  // Der Gruppenhinweis gilt für alle vier Karten und steht deshalb genau einmal über ihnen; die
  // Ausrüstungskarten erklären sich einzeln und tragen ihren Hinweis selbst.
  it('carries shared wording on the group and per-card wording only on equipment', () => {
    const state = createInitialState(0)
    const [equipment] = getUpgradeGroups(state, 'equipment')
    const [miners] = getUpgradeGroups(state, 'miners')
    expect(equipment.hint).toBeUndefined()
    expect(equipment.upgrades.every((upgrade) => Boolean(upgrade.hint))).toBe(true)
    expect(miners.hint).toBeTruthy()
    expect(miners.upgrades.every((upgrade) => upgrade.hint === undefined)).toBe(true)
  })

  // Der Hinweis über den Angestellten darf nicht über dem Behälter stehen: „Jeder Fuhrknecht fährt
  // für sich“ erklärt keine Lagererweiterung. Behälter und Angestellte sind deshalb zwei Blöcke
  // unter demselben Reiter — der Behälter zuerst, wie in der Szene links der Ort steht.
  it('splits a section tab into its container and its staff', () => {
    const state = createInitialState(0)
    for (const [filter, equipmentId] of [['transporters', 'stock'], ['guards', 'vault']] as const) {
      const [container, staff] = getUpgradeGroups(state, filter)
      expect(container.upgrades.map((card) => card.equipmentId)).toEqual([equipmentId])
      expect(container.hint).toBeUndefined()
      expect(staff.hint).toBeTruthy()
      expect(staff.upgrades).toHaveLength(4)
      expect(container.key).not.toBe(staff.key)
    }
    // Die Mine hat keinen Behälter und darum auch nur einen Block.
    expect(getUpgradeGroups(state, 'miners')).toHaveLength(1)
  })

  // Jede Karte gehört genau einem Reiter. Sonst zählte der rote Punkt eines Reiters Angebote mit,
  // die dort gar nicht liegen — oder ein bezahlbares Upgrade meldete sich nirgends.
  it('files every upgrade under exactly one tab', () => {
    const state = createInitialState(0)
    const all = getAllUpgrades(state)
    const filed = UPGRADE_FILTERS.flatMap((filter) => getCategoryUpgrades(state, filter))
    expect(filed.map((card) => card.key).sort()).toEqual(all.map((card) => card.key).sort())
    expect(new Set(all.map((card) => card.key)).size).toBe(all.length)
    expect(all.every((card) => getCategoryUpgrades(state, card.category).some((sibling) => sibling.key === card.key))).toBe(true)
    // Und die Reiter eines Abschnitts zeigen dieselben Karten wie seine Gruppen.
    for (const filter of UPGRADE_FILTERS) {
      const grouped = getUpgradeGroups(state, filter).flatMap((group) => group.upgrades)
      expect(grouped.map((card) => card.key)).toEqual(getCategoryUpgrades(state, filter).map((card) => card.key))
    }
  })

  it('reports a securing rate that can be read against the risk growth', () => {
    const base = createInitialState(0)
    const full = { ...base, vaultGold: vaultCapacity(base) }
    const oneGuard = { ...full, guardLevels: [1, 0, 0, 0] as [number, number, number, number] }
    const threeGuards = { ...full, guardLevels: [1, 1, 1, 0] as [number, number, number, number] }

    expect(securingRate(base)).toBe(0)
    expect(securingRate(oneGuard)).toBeLessThan(riskGrowth(full))
    expect(securingRate(threeGuards)).toBeGreaterThan(riskGrowth(full))
  })

  // App.tsx memoisiert die Upgrade-Views allein über die Stufen (`upgradeLevelKey`). Sobald eine
  // Beschreibung, ein Effekt oder ein Preis zusätzlich an Gold, Risiko oder Transport hinge, würde
  // die Karte veraltete Werte zeigen, ohne dass es auffiele. Dieser Test hält die Annahme fest.
  it('derives every upgrade view from the levels alone', () => {
    const base = createInitialState(0)
    const levelled = {
      ...base,
      tapLevel: 3,
      stockLevel: 2,
      vaultLevel: 2,
      minerLevels: [2, 1, 0, 0] as [number, number, number, number],
      transporterLevels: [2, 1, 0, 0] as [number, number, number, number],
      guardLevels: [2, 1, 0, 0] as [number, number, number, number],
    }
    const busy = {
      ...levelled,
      vaultGold: 98_765,
      stockGold: 421,
      inTransitGold: 77,
      expressGold: 33,
      threat: 84,
      tripCount: 219,
      theftCount: 7,
      lastTick: 5_000_000,
      transportStartedAt: 1_000,
      transportEndsAt: 9_000,
      secureStartedAt: 1_000,
      secureEndsAt: 4_000,
    }
    expect(getAllUpgrades(busy)).toEqual(getAllUpgrades(levelled))
  })

  // Diskrete Takte müssen dasselbe ergeben, egal ob man zusieht oder acht Stunden wegbleibt.
  // Nachgeholt wird in ganzen Takten, deshalb darf hier kein Korn Unterschied entstehen.
  it('credits the same gold whether the player watches or stays away', () => {
    const base = {
      ...createInitialState(0),
      minerLevels: [3, 2, 0, 0] as [number, number, number, number],
      transporterLevels: [2, 1, 0, 0] as [number, number, number, number],
      stockLevel: 6,
      vaultLevel: 6,
    }
    const inOneGo = advanceGame(base, 600_000)
    let stepwise = base
    for (let at = 100; at <= 600_000; at += 100) stepwise = advanceGame(stepwise, at)

    expect(stepwise.lifetimeGold).toBeCloseTo(inOneGo.lifetimeGold, 4)
    expect(stepwise.vaultGold).toBeCloseTo(inOneGo.vaultGold, 4)
  })

  // Zwölf eigenständige Takte dürfen die Rückkehr nicht ausbremsen: Der Nachlauf über acht Stunden
  // läuft beim Laden und blockiert dabei den ersten Frame.
  it('catches up on a full eight-hour absence without stalling the load', () => {
    const full = {
      ...createInitialState(0),
      minerLevels: [8, 8, 8, 8] as [number, number, number, number],
      transporterLevels: [8, 8, 8, 8] as [number, number, number, number],
      guardLevels: [8, 8, 8, 8] as [number, number, number, number],
      stockLevel: 12,
      vaultLevel: 14,
    }
    const start = performance.now()
    const returned = advanceGame(full, 8 * 60 * 60 * 1_000, true)
    expect(performance.now() - start).toBeLessThan(2_000)
    expect(returned.lastOfflineReport?.delivered ?? 0).toBeGreaterThan(0)
  })

  it('skips work and keeps its identity while the game lies dormant', () => {
    const dormant = createInitialState(0)
    const ticked = advanceGame(dormant, 10_000)

    expect(ticked).toBe(dormant)
    // Die Uhr muss trotzdem laufen, sonst würde die Ruhezeit beim ersten Bergmann rückwirkend
    // als Förderung gutgeschrieben.
    expect(ticked.lastTick).toBe(10_000)

    // Der frisch angestellte Bergmann beginnt seinen Takt jetzt, nicht rückwirkend: Vor dem ersten
    // vollen Takt hat er nichts gefördert, und danach steht genau seine eigene Förderung an — nicht
    // die zehn ruhenden Sekunden davor.
    const hired = { ...ticked, minerLevels: [1, 0, 0, 0] as [number, number, number, number] }
    const beat = minerInterval(1) * 1_000
    expect(advanceGame(hired, 10_000 + beat - 1).minerCarry[0]).toBe(0)
    expect(advanceGame(hired, afterArrival(10_000 + 2 * beat)).stockGold).toBeCloseTo(mined(1, 2), 5)
  })

  it('keeps advancing once anything is actually in motion', () => {
    const mining = { ...createInitialState(0), minerLevels: [1, 0, 0, 0] as [number, number, number, number] }
    expect(advanceGame(mining, 1_000)).not.toBe(mining)

    const banked = { ...createInitialState(0), vaultGold: 100 }
    expect(advanceGame(banked, 1_000).threat).toBeGreaterThan(0)

    const carrying = { ...createInitialState(0), transporterLevels: [1, 0, 0, 0] as [number, number, number, number], stockGold: 20 }
    expect(advanceGame(carrying, 1_000).transporterTrips[0]).not.toBeNull()
  })

  it('migrates schema-3 progress into the new four-slot model', () => {
    const legacy = {
      ...createInitialState(0),
      schemaVersion: 3,
      staffLevel: 5,
      courierUnlocked: true,
      transportLevel: 2,
      cargoLevel: 1,
      convoyLevel: 0,
      securityLevel: 3,
      minerLevels: undefined,
      transporterLevels: undefined,
      guardLevels: undefined,
    }
    const migrated = migrateGame(legacy)
    expect(migrated?.schemaVersion).toBe(9)
    expect(migrated?.minerLevels).toEqual([2, 1, 1, 1])
    expect(migrated?.transporterLevels).toEqual([1, 1, 1, 1])
    expect(migrated?.guardLevels).toEqual([1, 1, 1, 0])
  })

  // Bis Schema 7 hieß das Lager „Beutel" und lag als `chestGold`/`chestLevel` im Spielstand. Seit
  // Schema 8 trägt der Beutel des Spielers diesen Namen — die alten Felder müssen deshalb auf das
  // Lager wandern, nicht auf den Beutel, sonst stünde ein ausgebautes Lager plötzlich auf dem
  // Rücken des Spielers und der Puffer wäre wieder der kleinste.
  it('moves the old bag of schema 7 onto the stockpile, not onto the player', () => {
    const { stockGold: _gold, stockLevel: _level, ...rest } = createInitialState(0)
    const migrated = migrateGame({ ...rest, schemaVersion: 7, chestGold: 30, chestLevel: 4 })
    expect(migrated?.schemaVersion).toBe(9)
    expect(migrated?.stockGold).toBe(30)
    expect(migrated?.stockLevel).toBe(4)
    // Schema 9 führt die fliegenden Förderungen; ein älterer Spielstand hat keine — dort lag
    // gefördertes Gold sofort im Lager.
    expect(migrated?.stockArrivals).toEqual([])
    // Die vier Stücke des Spielers beginnen auf ihrer ersten Stufe — nichts gewonnen, nichts verloren.
    expect([migrated?.packLevel, migrated?.bootsLevel, migrated?.lampLevel]).toEqual([0, 0, 0])
    expect(migrated && 'chestGold' in migrated).toBe(false)
  })
})

// Die vier Ausrüstungsstücke des Spielers: je eines für jede seiner Handlungen, die Stiefel für
// beide, bei denen er läuft. Sie sind der Grund, dass aktives Spiel nicht zwangsläufig aufhört,
// sich zu lohnen — ohne sie wären Fuhre und Wachgang Konstanten gegen eine wachsende Automatik.
describe('Ausrüstung des Spielers', () => {
  const withLevels = (levels: Partial<GameState>): GameState => ({ ...createInitialState(0), ...levels })

  it('carries more per trip with a better pack', () => {
    const better = withLevels({ packLevel: 2, stockLevel: 4 })
    expect(packCargo(better)).toBeGreaterThan(packCargo(createInitialState(0)))

    const loaded = startTransport({ ...better, stockGold: 500 }, 0)
    expect(loaded.playerTrip?.gold).toBe(packCargo(better))
  })

  // Niemand schultert mehr, als der Haufen überhaupt fasst. Ohne diesen Deckel wäre ein Beutel
  // über der Lagergröße ein Kauf ohne Wirkung — und die Karte verspräche ihn trotzdem.
  it('never promises more load than the stockpile holds', () => {
    const oversized = withLevels({ packLevel: 6, stockLevel: 0 })
    expect(packCargo(oversized)).toBe(stockCapacity(oversized))

    const card = getEquipmentUpgrade(oversized, 'pack')
    const [, load] = card.facts
    expect(load.to).toBe(load.from)
  })

  // Fuhre und Wachgang sind beides Wege, die der Spieler selbst geht. Wirkten die Stiefel nur auf
  // die Fuhre, bliebe der Wachgang der einzige Teil von ihm, der nie besser wird.
  it('shortens both walked actions with better boots', () => {
    const bare = createInitialState(0)
    const shod = withLevels({ bootsLevel: 4 })
    expect(manualTripSeconds(shod)).toBeLessThan(manualTripSeconds(bare))
    expect(manualSecureSeconds(shod)).toBeLessThan(manualSecureSeconds(bare))

    const travelling = startTransport({ ...shod, stockGold: 200 }, 0)
    expect(travelling.playerTrip?.endsAt).toBe(manualTripSeconds(shod) * 1_000)

    const securing = lowerThreat({ ...shod, threat: 90 }, 0)
    expect(securing.secureEndsAt).toBe(manualSecureSeconds(shod) * 1_000)
  })

  // Die Stiefel bauen die **Geschwindigkeit** aus, und die wächst. Dass die Wege dabei kürzer
  // werden, ist keine Sonderregel, sondern die Definition von Tempo: Eine Strecke kostet
  // `Länge ÷ Geschwindigkeit`, die wachsende Zahl steht also im Nenner. Damit kann die Richtung
  // nicht mehr auseinanderlaufen — es gibt keine Stelle, an der ein „mehr“ von Hand in ein
  // „weniger“ übersetzt würde.
  it('turns rising boot speed into falling walk times', () => {
    const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    const states = levels.map((bootsLevel) => withLevels({ bootsLevel }))

    const speeds = states.map(bootsSpeed)
    expect(speeds.every((speed, index) => index === 0 || speed > speeds[index - 1])).toBe(true)
    expect(speeds[0]).toBe(1)

    // Und jede Dauer ist genau die Streckenlänge geteilt durch dieses Tempo.
    for (const state of states) {
      expect(manualTripSeconds(state)).toBeCloseTo(manualTripSeconds(createInitialState(0)) / bootsSpeed(state), 9)
      expect(manualSecureSeconds(state)).toBeCloseTo(manualSecureSeconds(createInitialState(0)) / bootsSpeed(state), 9)
    }

    const trips = states.map(manualTripSeconds)
    const walks = states.map(manualSecureSeconds)
    expect(trips.every((seconds, index) => index === 0 || seconds < trips[index - 1])).toBe(true)
    expect(walks.every((seconds, index) => index === 0 || seconds < walks[index - 1])).toBe(true)
  })

  // Kein Weg wird beliebig kurz: Die Fuhre liegt auf demselben Boden wie jeder andere Takt, der
  // Wachgang darunter, weil er kein Takt einer Automatik ist, sondern ein Tastendruck — aber nicht
  // so weit, dass die Sperre der beiden anderen Aktionen nicht mehr zu spüren wäre.
  it('keeps a floor under both walks', () => {
    const winged = withLevels({ bootsLevel: 40 })
    expect(manualTripSeconds(winged)).toBe(MIN_CYCLE_SECONDS)
    expect(manualSecureSeconds(winged)).toBe(MANUAL_SECURE_FLOOR_SECONDS)
  })

  // Am Boden angekommen macht keine weitere Stufe einen Weg noch kürzer — und die Karte darf dann
  // auch keine steigende Zahl zeigen. Sie nennt deshalb nicht das rohe Tempo, sondern das, was auf
  // der Fuhre tatsächlich ankommt: Das steht still, sobald der Boden greift.
  it('stops the promised speed where no walk can get shorter', () => {
    const winged = withLevels({ bootsLevel: 40 })
    const faster = withLevels({ bootsLevel: 41 })
    expect(bootsSpeed(faster)).toBeGreaterThan(bootsSpeed(winged))
    expect(bootsPace(faster)).toBe(bootsPace(winged))

    const [, speed] = getEquipmentUpgrade(winged, 'boots').facts
    expect(speed.label).toBe('Geschwindigkeit')
    expect(speed.to).toBe(speed.from)

    // Solange noch kein Boden greift, ist die Karte dagegen das rohe Tempo.
    const walking = withLevels({ bootsLevel: 3 })
    expect(bootsPace(walking)).toBeCloseTo(bootsSpeed(walking), 9)
    const [, growing] = getEquipmentUpgrade(walking, 'boots').facts
    expect(Number(growing.to.replace(',', '.'))).toBeGreaterThan(Number(growing.from.replace(',', '.')))
  })

  // Die Lampe zählt in denselben Punkten wie eine Wache — dieselbe Beschriftung, dieselbe Skala.
  // Beide heißen **Sichtweite**: Was ein Wachgang abträgt, ist abgesuchtes Gelände. „Kraft" ist
  // seither das dritte Attribut der Wachen und beschreibt etwas anderes — den Ernstfall.
  it('takes off as much risk as the lamp is worth', () => {
    const bright = withLevels({ lampLevel: 3, threat: 100 })
    expect(lampSight(bright)).toBeGreaterThan(lampSight(createInitialState(0)))
    expect(lowerThreat(bright, 0).threat).toBe(100 - lampSight(bright))
    expect(getEquipmentUpgrade(bright, 'lamp').facts[1].label).toBe('Sichtweite')
    expect(getSlotUpgrades(bright, 'vault')[0].facts[1].label).toBe('Sichtweite')
  })

  // Der Reiter „Ausrüstung“ trägt genau die vier Stücke am Körper des Spielers. Die beiden
  // Behälter des Reiches stehen bei ihrem Abschnitt — dorthin zeigt, wer sie in der Szene antippt.
  // Jedes Stück trägt sein eigenes Bild.
  it('keeps the player gear together and the containers with their section', () => {
    const state = createInitialState(0)
    const gear = getCategoryUpgrades(state, 'equipment')
    expect(gear.map((card) => card.equipmentId)).toEqual(['tap', 'pack', 'boots', 'lamp'])
    expect(new Set(gear.map((card) => card.spriteFamily)).size).toBe(gear.length)
    expect(getEquipmentUpgrade(state, 'stock').category).toBe('transporters')
    expect(getEquipmentUpgrade(state, 'vault').category).toBe('guards')
    expect(getCategoryUpgrades(state, 'guards')[0].equipmentId).toBe('vault')
    expect(getCategoryUpgrades(state, 'transporters')[0].equipmentId).toBe('stock')
  })
})
