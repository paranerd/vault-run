import { describe, expect, it } from 'vitest'
import {
  EXHAUSTION_BREAK_MS,
  GOLD_FLIGHT_DURATION_MS,
  MANUAL_CARGO,
  MANUAL_SECURE_AMOUNT,
  MANUAL_TRIP_SECONDS,
  OFFLINE_THEFT_SHARE,
  SECURE_COOLDOWN_MS,
  automaticTransportRate,
  chestCapacity,
  exhaustionPerTap,
  exhaustionRecoveryRate,
  getAllUpgrades,
  guardInterval,
  getEquipmentUpgrade,
  getSlotUpgrades,
  getUpgradeGroups,
  minerInterval,
  passiveRate,
  transporterTripSeconds,
  riskGrowth,
  guardPower,
  guardRate,
  minerRate,
  minerYield,
  securingRate,
  securityLoss,
  slotVisualLevel,
  slotUpgradeCost,
  tapValue,
  transporterCapacity,
  transporterRate,
  vaultCapacity,
  withSlotLevel,
} from './config'
import { formatDecimal, formatGold } from './format'
import {
  advanceGame,
  buyEquipmentUpgrade,
  buySlotUpgrade,
  createInitialState,
  isPlayerBusy,
  isSecuringManually,
  lowerThreat,
  startTransport,
  tap,
} from './engine'
import { migrateGame } from './storage'

/** Was `ticks` Takte eines Bergmanns im Beutel ergeben. In den Beutel gehen nur ganze Goldstücke;
    der Bruchteil bleibt am Fels liegen und geht in den nächsten Takt ein. Über die Takte hinweg
    ist die Summe darum immer der abgerundete Ertrag der Rate. */
const mined = (level: number, ticks: number) => Math.floor(ticks * minerYield(level))

describe('Vault Run engine', () => {
  // Ein Bergmann fördert 0,65 je Takt und schickt trotzdem nie Bruchteile in den Beutel: Der erste
  // Takt legt nichts hinein, der zweite ein ganzes Stück, der dritte wieder eines — und was liegen
  // bleibt, ist beim nächsten Mal wieder dabei.
  it('sends only whole gold from the mine into the bag', () => {
    const state = { ...createInitialState(0), minerLevels: [1, 0, 0, 0] as [number, number, number, number] }
    const beat = minerInterval(1) * 1_000
    const banked = [1, 2, 3, 4, 5, 6].map((ticks) => advanceGame(state, ticks * beat).chestGold)

    expect(banked).toEqual([0, 1, 1, 2, 3, 3])
    expect(banked.every(Number.isInteger)).toBe(true)

    // Der angebrochene Fund bleibt im Zustand stehen — sonst verlöre ihn jeder Neustart.
    const afterOne = advanceGame(state, beat)
    expect(afterOne.minerCarry[0]).toBeCloseTo(minerYield(1), 5)
    expect(afterOne.chestGold).toBe(0)

    // Und über viele Takte hinweg bleibt die Rate erhalten: Was ganzzahlig wird, ist die einzelne
    // Portion, nicht die Fördermenge.
    const long = advanceGame(state, 70 * beat)
    expect(long.lifetimeGold).toBe(mined(1, 70))
  })

  it('moves gold from the bag into the treasure chest in a timed trip', () => {
    let state = createInitialState(0)
    for (let index = 0; index < 10; index += 1) state = tap(state)
    state = startTransport(state, 0)

    expect(state.chestGold).toBe(0)
    expect(state.playerTrip?.gold).toBe(10)
    expect(state.vaultGold).toBe(0)

    state = advanceGame(state, GOLD_FLIGHT_DURATION_MS - 1)
    expect(state.playerTrip?.gold).toBe(10)
    expect(state.vaultGold).toBe(0)

    state = advanceGame(state, GOLD_FLIGHT_DURATION_MS)
    expect(state.playerTrip?.gold).toBe(0)
    expect(state.vaultGold).toBe(10)
    expect(state.playerTrip?.endsAt).toBe(MANUAL_TRIP_SECONDS * 1_000)

    state = advanceGame(state, MANUAL_TRIP_SECONDS * 1_000)
    expect(state.tripCount).toBe(1)
    expect(state.playerTrip).toBeNull()
  })

  it('pauses mining while the player transports gold without a transporter', () => {
    let state = createInitialState(0)
    state.minerLevels = [1, 0, 0, 0]
    state.chestGold = 20
    state = startTransport(state, 0)
    state = advanceGame(state, 5_000)
    expect(state.chestGold).toBe(0)
  })

  // Der Beutel ist die Grenze der Förderung. Ein Bergmann, der in den vollen Beutel weiterschlägt,
  // fördert ausschließlich in den Verlust — über eine Nacht ein Vielfaches des Beutels an Gold,
  // das nie irgendwo ankommt.
  it('rests the mine while the bag is full', () => {
    const state = { ...createInitialState(0), minerLevels: [2, 1, 0, 0] as [number, number, number, number] }
    const filled = advanceGame(state, 60_000)
    expect(filled.chestGold).toBeCloseTo(chestCapacity(state), 5)

    const later = advanceGame(filled, 60 * 60_000)
    expect(later.chestGold).toBeCloseTo(chestCapacity(state), 5)
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
    expect(filled.chestGold).toBeCloseTo(chestCapacity(state), 5)
    expect(filled.minerBeats).toEqual([null, null, null, null])

    const ticked = advanceGame(filled, 5 * 60_000 + 10_000)
    expect(ticked).toBe(filled)
    expect(ticked.lastTick).toBe(5 * 60_000 + 10_000)

    // Und die Ruhe endet, sobald eine Fuhre Platz schafft — ohne die Ruhezeit nachzuholen.
    const room = { ...ticked, chestGold: ticked.chestGold - MANUAL_CARGO }
    const resumed = advanceGame(room, 5 * 60_000 + 10_000 + minerInterval(1) * 1_000)
    // Angerechnet wird der Takt mitsamt dem Fund, der seit der Ruhe am Fels liegt — ins Beutel
    // wandert davon nur, was zusammen ein ganzes Goldstück ergibt.
    const portion = Math.floor(room.minerCarry[0] + minerYield(1))
    expect(resumed.chestGold).toBeCloseTo(chestCapacity(state) - MANUAL_CARGO + portion, 5)
  })

  // „Ruht“ heißt nicht „holt später nach“: Nach der Ruhe beginnt ein Bergmann seinen Takt neu,
  // statt jede stillgelegte Sekunde in einem Schwall zu liefern.
  it('starts a fresh cycle after the bag makes room again instead of catching up', () => {
    const state = { ...createInitialState(0), minerLevels: [1, 0, 0, 0] as [number, number, number, number] }
    const capacity = chestCapacity(state)
    const idle = advanceGame({ ...state, chestGold: capacity }, 10 * 60_000)
    expect(idle.chestGold).toBeCloseTo(capacity, 5)

    // Eine Fuhre schafft Platz. Danach steht genau eine Portion an — nach einem vollen Takt, nicht
    // zehn Minuten Ruhe auf einen Schlag.
    const room = { ...idle, chestGold: capacity - MANUAL_CARGO }
    const beat = minerInterval(1) * 1_000
    expect(advanceGame(room, 10 * 60_000 + beat - 1).chestGold).toBeCloseTo(capacity - MANUAL_CARGO, 5)
    // Zwei Takte ergeben zusammen das erste ganze Goldstück — und nur dieses eine, nicht die zehn
    // Minuten Ruhe davor.
    expect(advanceGame(room, 10 * 60_000 + 2 * beat).chestGold).toBeCloseTo(capacity - MANUAL_CARGO + mined(1, 2), 5)
  })

  // Dasselbe für die Ruhe während einer eigenen Fuhre: Wer ohne Fuhrknecht selbst unterwegs ist,
  // hält die Mine an — und findet bei der Rückkehr keine aufgestaute Förderung vor.
  //
  // Ein ruhender Bergmann darf dabei keinen fälligen Takt behalten: `nextBeat` meldete sonst einen
  // Zeitpunkt hinter dem Cursor, die Schleife käme nicht mehr von der Stelle und das Spiel bliebe
  // stehen. Dieser Test läuft in genau diesem Fall nicht durch, sondern gar nicht mehr.
  it('banks nothing while the mine rests during the player trip', () => {
    let state = { ...createInitialState(0), minerLevels: [1, 0, 0, 0] as [number, number, number, number] }
    state = advanceGame(state, 5_000)
    expect(state.chestGold).toBeCloseTo(mined(1, 5), 5)

    const travelling = startTransport(state, 5_000)
    expect(travelling.minerBeats[0]).not.toBeNull()

    const returned = advanceGame(travelling, 5_000 + MANUAL_TRIP_SECONDS * 1_000)
    expect(returned.playerTrip).toBeNull()
    expect(returned.chestGold).toBe(0)
  })

  // Dieselbe Ruhe während einer Sicherung von Hand — auch sie legt das ganze Reich still.
  it('banks nothing while the mine rests during a manual securing', () => {
    const mining = advanceGame({ ...createInitialState(0), minerLevels: [1, 0, 0, 0] as [number, number, number, number], threat: 50 }, 5_000)
    const securing = lowerThreat(mining, 5_000)
    expect(isSecuringManually(securing)).toBe(true)

    const held = advanceGame(securing, 5_000 + SECURE_COOLDOWN_MS - 1)
    expect(held.chestGold).toBeCloseTo(mining.chestGold, 5)
    expect(held.minerBeats).toEqual([null, null, null, null])

    // Und auch nach der Freigabe steht nichts nach: Der Takt beginnt neu.
    const released = advanceGame(held, 5_000 + SECURE_COOLDOWN_MS)
    expect(released.chestGold).toBeCloseTo(mining.chestGold, 5)
  })

  // Eine durchschlafene Nacht ohne Transport füllt den Beutel und lässt es dabei bewenden: Was
  // darüber hinaus verloren geht, ist die eine Portion, die den Beutel bis zum Rand aufgefüllt hat.
  it('loses no more than the topping-up portion across a night without transport', () => {
    const state = { ...createInitialState(0), minerLevels: [3, 3, 3, 3] as [number, number, number, number] }
    const returned = advanceGame(state, 8 * 60 * 60 * 1_000, true)

    expect(returned.chestGold).toBeCloseTo(chestCapacity(state), 5)
    expect(returned.lostGold).toBeLessThanOrEqual(minerYield(3))
    expect(returned.lastOfflineReport?.earned).toBeCloseTo(chestCapacity(state), 5)
  })

  it('does not produce or count losses when tapping a full bag', () => {
    const state = createInitialState(0)
    state.chestGold = chestCapacity(state)
    const tapped = tap(state)
    expect(tapped).toBe(state)
    expect(tapped.lifetimeGold).toBe(0)
    expect(tapped.lostGold).toBe(0)
  })

  it('accepts consecutive mining taps without a cooldown', () => {
    let state = createInitialState(0)
    state = tap(state)
    expect(state.chestGold).toBe(1)
    state = tap(state)
    expect(state.chestGold).toBe(2)
  })

  it('forces a short break only after exhaustion reaches 100 percent', () => {
    let state = createInitialState(0)
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
    expect(getEquipmentUpgrade(base, 'mine').facts[2]).toEqual({
      from: formatDecimal(exhaustionPerTap(base)),
      to: `${formatDecimal(exhaustionPerTap(improved))} %`,
      label: 'Erschöpfung',
    })

    const tired = { ...base, exhaustion: 60 }
    expect(advanceGame(tired, 10_000, true).exhaustion).toBe(0)
  })

  // Jeder Fuhrknecht lädt seine eigene Ladung, die eigene Fuhre kommt daneben obendrauf.
  it('sends every transporter on its own trip beside the player', () => {
    let state = createInitialState(0)
    state.transporterLevels = [1, 2, 0, 0]
    state.chestGold = 200
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
    state.chestGold = 20
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
    state.chestGold = 20
    state = startTransport(state, 0)

    const tapped = tap(state)
    expect(tapped).toBe(state)
  })

  it('lets transporters keep mining active and start follow-up trips automatically', () => {
    let state = createInitialState(0)
    state.minerLevels = [1, 0, 0, 0]
    state.transporterLevels = [1, 0, 0, 0]
    state.chestGold = 20
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
    state.chestGold = 10_000
    expect(buyEquipmentUpgrade(state, 'tap')).toBe(state)

    state.vaultGold = getEquipmentUpgrade(state, 'mine').cost
    const upgraded = buyEquipmentUpgrade(state, 'tap')
    expect(upgraded.tapLevel).toBe(1)
    expect(upgraded.vaultGold).toBe(0)
  })

  it('scales bag, chest and automatic transport capacity', () => {
    const state = createInitialState(0)
    expect(chestCapacity({ ...state, chestLevel: 1 })).toBeGreaterThan(chestCapacity(state))
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
      expect(guardPower(level + 1)).toBeGreaterThan(guardPower(level))
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
    const upgrades = [getEquipmentUpgrade(state, 'mine'), ...getSlotUpgrades(state, 'mine')]
    expect(upgrades).toHaveLength(5)
    expect(upgrades.every((upgrade) => upgrade.facts.every((entry) => entry.from && entry.to))).toBe(true)

    expect(upgrades[0].facts).toEqual([
      { from: 'Stufe 1', to: 'Stufe 2', label: 'Eiserne Pickhacke' },
      { from: '1', to: '2 Gold', label: 'je Schlag' },
      { from: '6', to: '5,4 %', label: 'Erschöpfung' },
    ])
    // Ein unbesetzter Slot hat keinen Vorher-Wert — dort steht ein Strich statt einer erfundenen Null.
    // Bergleute takten immer im Sekundentakt — ihre Karte braucht deshalb keine Taktzeile.
    expect(upgrades[1].facts).toEqual([
      { from: 'Stufe 0', to: 'Stufe 1', label: 'Tagelöhner' },
      { from: '–', to: `+${formatDecimal(minerRate(1))}/s`, label: 'Förderung' },
    ])
  })

  // Eine Stufe, die rechnerisch nichts bringt, muss das zeigen — die Karte fordert zum Kauf auf.
  // `tapValue` rundet auf, weshalb Stufe 3 → 4 denselben Wert liefert wie Stufe 2 → 3.
  it('admits it when a level adds nothing at all', () => {
    const [, hit] = getEquipmentUpgrade({ ...createInitialState(0), tapLevel: 2 }, 'mine').facts
    expect(hit.to).toBe(`${hit.from} Gold`)
  })

  // Der Rangname ist der einzige Vorteil eines Aufstiegs, der in keiner Zahl steckt — und oberhalb
  // der letzten benannten Stufe gibt es ihn nicht mehr. Dann darf die Karte auch keinen versprechen.
  it('announces the next rank only while the upgrade still changes it', () => {
    const state = createInitialState(0)
    expect(getSlotUpgrades(state, 'mine')[0]).toMatchObject({ name: 'Leerer Stollen', nextName: 'Tagelöhner' })
    expect(getSlotUpgrades({ ...state, minerLevels: [4, 0, 0, 0] }, 'mine')[0]).toMatchObject({ name: 'Erzmeister', nextName: undefined })
    expect(getEquipmentUpgrade(state, 'mine')).toMatchObject({ name: 'Rostige Pickhacke', nextName: 'Eiserne Pickhacke' })
    expect(getEquipmentUpgrade({ ...state, tapLevel: 3 }, 'mine').nextName).toBeUndefined()
  })

  it('uses the promised integer pickaxe value in gameplay and upgrade stats', () => {
    const state = { ...createInitialState(0), tapLevel: 4 }
    const upgraded = getEquipmentUpgrade(state, 'mine')
    expect(tapValue(state)).toBe(5)
    expect(upgraded.facts[1]).toEqual({ from: '5', to: '6 Gold', label: 'je Schlag' })
    expect(tap(state).chestGold).toBe(5)
  })

  it('reduces attention by clicking the treasure chest action', () => {
    const state = { ...createInitialState(0), threat: 50 }
    const secured = lowerThreat(state, 0)
    expect(secured.threat).toBe(50 - MANUAL_SECURE_AMOUNT)
    expect(state.threat).toBe(50)
  })

  it('blocks every action while an unguarded player secures by hand', () => {
    const state = { ...createInitialState(0), threat: 50, chestGold: 40 }
    const securing = lowerThreat(state, 0)
    expect(isSecuringManually(securing)).toBe(true)
    expect(tap(securing).chestGold).toBe(40)
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
    expect(ticked.threat).toBeCloseTo(60 - 2 * guardPower(1), 5)

    // Und die Mine fördert während der Sicherung durch — stillgelegt wird sie nur ohne Wachen.
    // Der Bergmann steht auf Stufe 3, damit schon sein erster Takt ein ganzes Goldstück ergibt und
    // die Förderung noch innerhalb der laufenden Sicherung im Beutel ankommt.
    const mining = { ...guarded, minerLevels: [3, 0, 0, 0] as [number, number, number, number] }
    expect(minerInterval(3) * 1_000).toBeLessThan(SECURE_COOLDOWN_MS)
    expect(advanceGame(lowerThreat(mining, 0), minerInterval(3) * 1_000).chestGold).toBeCloseTo(mined(3, 1), 5)
  })

  // Der Spieler ist eine Person: Was er tut, tut er mit beiden Händen. Jede laufende Aktion sperrt
  // deshalb die beiden anderen — auch die Sicherung, die mit Wachen das Reich nicht mehr anhält.
  it('lets one manual action block the other two', () => {
    const busy = { ...createInitialState(0), threat: 50, chestGold: 40, guardLevels: [1, 0, 0, 0] as [number, number, number, number] }

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
    const busy = { ...createInitialState(0), threat: 50, chestGold: 40, guardLevels: [1, 0, 0, 0] as [number, number, number, number] }

    const released = advanceGame(lowerThreat(busy, 0), SECURE_COOLDOWN_MS)
    expect(isPlayerBusy(released)).toBe(false)
    expect(tap(released).chestGold).toBeGreaterThan(40)
    expect(startTransport(released, SECURE_COOLDOWN_MS).playerTrip).not.toBeNull()

    const returned = advanceGame(startTransport(busy, 0), MANUAL_TRIP_SECONDS * 1_000)
    expect(isPlayerBusy(returned)).toBe(false)
    expect(lowerThreat(returned, MANUAL_TRIP_SECONDS * 1_000).threat).toBe(returned.threat - MANUAL_SECURE_AMOUNT)
  })

  it('keeps a guarded treasury safe across a long offline stretch', () => {
    const levels = [3, 3, 3, 3] as [number, number, number, number]
    const state = { ...createInitialState(0), vaultGold: 400, chestGold: 40, chestLevel: 2, guardLevels: levels, minerLevels: levels }
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
    let state = { ...createInitialState(0), vaultGold: 400, chestGold: 65, threat: 95 }
    state = startTransport(state, 0)
    const carried = state.playerTrip?.gold ?? 0
    expect(carried).toBe(MANUAL_CARGO)

    const robbed = advanceGame(state, 30_000)
    expect(robbed.theftCount).toBe(1)
    expect(robbed.chestGold).toBe(45)
  })

  it('builds no risk at all before the first delivery reaches the treasury', () => {
    const state = { ...createInitialState(0), chestGold: 40, minerLevels: [2, 2, 0, 0] as [number, number, number, number] }
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
    const state = { ...createInitialState(0), vaultGold: 0, chestLevel: 4, vaultLevel: 4, minerLevels: levels, transporterLevels: levels }
    const returned = advanceGame(state, 8 * 60 * 60 * 1_000, true)
    const delivered = returned.lastOfflineReport?.delivered ?? 0

    expect(delivered).toBeGreaterThan(0)
    expect(returned.theftCount).toBeGreaterThan(0)
    expect(returned.lastOfflineReport?.stolen ?? 0).toBeLessThanOrEqual(delivered * OFFLINE_THEFT_SHARE + 0.001)
  })

  it('shrinks the raid loss through independently levelled guards', () => {
    const state = createInitialState(0)
    const guarded = { ...state, guardLevels: [1, 1, 0, 0] as [number, number, number, number] }
    expect(securityLoss(guarded)).toBeLessThan(securityLoss(state))
  })

  // Die Wachen-Karte nennt die Punkte, die der Trupp je Sicherung zusätzlich abträgt — dieselbe
  // Einheit, in der die Risikokachel steigt. Takt und Schadensdeckel gehören dem ganzen Trupp und
  // stehen deshalb im Gruppenhinweis, nicht auf einer einzelnen Karte.
  it('measures a guard in the risk it takes off per second by itself', () => {
    const state = createInitialState(0)
    // „x % alle y s“ — was eine Sicherung abträgt und wie oft sie stattfindet.
    expect(getSlotUpgrades(state, 'chest')[0].facts).toEqual([
      { from: 'Stufe 0', to: 'Stufe 1', label: 'Eisenschloss' },
      { from: '–', to: `-${formatDecimal(guardPower(1))} %`, label: 'Risiko' },
      { from: '–', to: `${formatDecimal(guardInterval(1))} s`, label: 'Takt' },
    ])

    expect(getSlotUpgrades(state, 'chest')[0].facts[1].to.startsWith('-')).toBe(true)

    // Eine zweite Wache daneben ändert nichts an diesen Zeilen — jede sichert für sich.
    const guarded = { ...state, guardLevels: [0, 3, 0, 0] as [number, number, number, number] }
    expect(getSlotUpgrades(guarded, 'chest')[0].facts).toEqual(getSlotUpgrades(state, 'chest')[0].facts)
  })

  // Ein Fuhrknecht nennt, was er trägt und wie lange er dafür braucht — nicht den Quotienten.
  it('describes a transporter by its load and its travel time', () => {
    const state = createInitialState(0)
    const [, load, travel] = getSlotUpgrades(state, 'bag')[0].facts
    expect(load).toEqual({ from: '–', to: formatGold(transporterCapacity(1)), label: 'Ladung' })
    expect(travel).toEqual({ from: '–', to: `${formatDecimal(transporterTripSeconds(1))} s`, label: 'Dauer' })

    const staffed = { ...state, transporterLevels: [3, 0, 0, 0] as [number, number, number, number] }
    expect(getSlotUpgrades(staffed, 'bag')[0].facts[1]).toEqual({
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
    const sections = [['mine', 'miners'], ['bag', 'transporters'], ['chest', 'guards']] as const
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
    const [equipment, miners] = getUpgradeGroups(state, 'all')
    expect(equipment.hint).toBeUndefined()
    expect(equipment.upgrades.every((upgrade) => Boolean(upgrade.hint))).toBe(true)
    expect(miners.hint).toBeTruthy()
    expect(miners.upgrades.every((upgrade) => upgrade.hint === undefined)).toBe(true)
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
      chestLevel: 2,
      vaultLevel: 2,
      minerLevels: [2, 1, 0, 0] as [number, number, number, number],
      transporterLevels: [2, 1, 0, 0] as [number, number, number, number],
      guardLevels: [2, 1, 0, 0] as [number, number, number, number],
    }
    const busy = {
      ...levelled,
      vaultGold: 98_765,
      chestGold: 421,
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
      chestLevel: 6,
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
      chestLevel: 12,
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
    expect(advanceGame(hired, 10_000 + 2 * beat).chestGold).toBeCloseTo(mined(1, 2), 5)
  })

  it('keeps advancing once anything is actually in motion', () => {
    const mining = { ...createInitialState(0), minerLevels: [1, 0, 0, 0] as [number, number, number, number] }
    expect(advanceGame(mining, 1_000)).not.toBe(mining)

    const banked = { ...createInitialState(0), vaultGold: 100 }
    expect(advanceGame(banked, 1_000).threat).toBeGreaterThan(0)

    const carrying = { ...createInitialState(0), transporterLevels: [1, 0, 0, 0] as [number, number, number, number], chestGold: 20 }
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
    expect(migrated?.schemaVersion).toBe(7)
    expect(migrated?.minerLevels).toEqual([2, 1, 1, 1])
    expect(migrated?.transporterLevels).toEqual([1, 1, 1, 1])
    expect(migrated?.guardLevels).toEqual([1, 1, 1, 0])
  })
})
