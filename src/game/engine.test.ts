import { describe, expect, it } from 'vitest'
import {
  GOLD_FLIGHT_DURATION_MS,
  MANUAL_CARGO,
  MANUAL_SECURE_AMOUNT,
  OFFLINE_THEFT_SHARE,
  SECURE_COOLDOWN_MS,
  automaticTransportAmount,
  chestCapacity,
  getAllUpgrades,
  getEquipmentUpgrade,
  getSlotUpgrades,
  getUpgradeGroups,
  passiveRate,
  riskGrowth,
  securingInterval,
  securingPower,
  securingRate,
  securityLoss,
  slotVisualLevel,
  slotUpgradeCost,
  tapValue,
  transportCargo,
  transporterCapacity,
  vaultCapacity,
  withSlotLevel,
} from './config'
import { formatGold } from './format'
import {
  advanceGame,
  buyEquipmentUpgrade,
  buySlotUpgrade,
  createInitialState,
  isSecuringManually,
  lowerThreat,
  startExpressTransport,
  startTransport,
  tap,
} from './engine'
import { migrateGame } from './storage'

describe('Vault Run engine', () => {
  it('moves gold from the bag into the treasure chest in a timed trip', () => {
    let state = createInitialState(0)
    for (let index = 0; index < 10; index += 1) state = tap(state)
    state = startTransport(state, 0)

    expect(state.chestGold).toBe(0)
    expect(state.inTransitGold).toBe(10)
    expect(state.vaultGold).toBe(0)

    state = advanceGame(state, GOLD_FLIGHT_DURATION_MS - 1)
    expect(state.inTransitGold).toBe(10)
    expect(state.vaultGold).toBe(0)

    state = advanceGame(state, GOLD_FLIGHT_DURATION_MS)
    expect(state.inTransitGold).toBe(0)
    expect(state.vaultGold).toBe(10)
    expect(state.transportEndsAt).toBe(12_000)

    state = advanceGame(state, 12_000)
    expect(state.tripCount).toBe(1)
    expect(state.transportEndsAt).toBeNull()
  })

  it('pauses mining while the player transports gold without a transporter', () => {
    let state = createInitialState(0)
    state.minerLevels = [1, 0, 0, 0]
    state.chestGold = 20
    state = startTransport(state, 0)
    state = advanceGame(state, 5_000)
    expect(state.chestGold).toBe(0)
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

  it('runs automated and manual express transports together after hiring a transporter', () => {
    let state = createInitialState(0)
    state.transporterLevels = [1, 1, 0, 0]
    state.chestGold = 40
    state = startTransport(state, 0)
    state = startExpressTransport(state, 0)

    expect(state.inTransitGold).toBe(24)
    expect(state.expressGold).toBe(16)
    state = advanceGame(state, 12_000)
    expect(state.vaultGold).toBe(40)
    expect(state.tripCount).toBe(2)
  })

  it('credits an express load on animation arrival without ending its cooldown', () => {
    let state = createInitialState(0)
    state.transporterLevels = [1, 0, 0, 0]
    state.chestGold = 20
    state = startExpressTransport(state, 0)
    const cooldownEndsAt = state.expressEndsAt

    state = advanceGame(state, GOLD_FLIGHT_DURATION_MS - 1)
    expect(state.vaultGold).toBe(0)

    state = advanceGame(state, GOLD_FLIGHT_DURATION_MS)
    expect(state.vaultGold).toBe(20)
    expect(state.expressEndsAt).toBe(cooldownEndsAt)
  })

  it('blocks manual mining while the player runs an express transport', () => {
    let state = createInitialState(0)
    state.transporterLevels = [1, 0, 0, 0]
    state.chestGold = 20
    state = startExpressTransport(state, 0)

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
    const staffed = { ...state, transporterLevels: [1, 1, 0, 0] as [number, number, number, number] }
    expect(automaticTransportAmount(staffed)).toBe(24)
    expect(transportCargo(staffed)).toBeGreaterThan(transportCargo(state))
  })

  // Die eigene Fuhre steht neben dem Gespann, nicht darunter: Sie bleibt bei ihrer Tragkraft,
  // während die Fuhrknechte ausschließlich ihre eigenen Ladungen summieren. Als beides ein
  // gemeinsamer Boden war, deckte die Tragkraft die ersten Stufen ab — sie brachten nichts.
  it('keeps the carried load apart from the team the transporters pull', () => {
    const state = createInitialState(0)
    expect(transportCargo(state)).toBe(MANUAL_CARGO)

    const single = { ...state, transporterLevels: [1, 0, 0, 0] as [number, number, number, number] }
    expect(transportCargo(single)).toBe(transporterCapacity(1))
    for (let level = 1; level < 5; level += 1) {
      const team = { ...state, transporterLevels: [level, 0, 0, 0] as [number, number, number, number] }
      const upgraded = withSlotLevel(team, 'transporters', 0)
      expect(transportCargo(upgraded) - transportCargo(team)).toBeCloseTo(transporterCapacity(level + 1) - transporterCapacity(level), 6)
    }
  })

  it('reduces every card to the one number the purchase adds', () => {
    const state = createInitialState(0)
    const upgrades = [getEquipmentUpgrade(state, 'mine'), ...getSlotUpgrades(state, 'mine')]
    expect(upgrades).toHaveLength(5)
    expect(upgrades.every((upgrade) => upgrade.gain.amount && upgrade.gain.unit)).toBe(true)
    expect(upgrades[0].gain).toEqual({ amount: '+1', unit: 'Gold je Schlag' })
    expect(upgrades[1].gain).toEqual({ amount: '+0,7', unit: 'Gold/s' })
  })

  // Eine Stufe, die rechnerisch nichts bringt, muss das zeigen — die Karte fordert zum Kauf auf.
  // `tapValue` rundet auf, weshalb Stufe 3 → 4 denselben Wert liefert wie Stufe 2 → 3.
  it('admits it when a level adds nothing at all', () => {
    expect(getEquipmentUpgrade({ ...createInitialState(0), tapLevel: 2 }, 'mine').gain.amount).toBe('±0')
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
    expect(upgraded.gain).toEqual({ amount: '+1', unit: 'Gold je Schlag' })
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
    expect(startTransport(securing, 10).transportEndsAt).toBeNull()
    expect(lowerThreat(securing, 10).threat).toBe(securing.threat)

    const released = advanceGame(securing, SECURE_COOLDOWN_MS + 1)
    expect(released.secureEndsAt).toBeNull()
    expect(isSecuringManually(released)).toBe(false)
  })

  it('lets guards secure on their own without blocking the player', () => {
    const guarded = { ...createInitialState(0), threat: 60, guardLevels: [1, 1, 0, 0] as [number, number, number, number] }
    const securing = lowerThreat(guarded, 0)
    expect(securing.secureEndsAt).not.toBeNull()
    expect(isSecuringManually(securing)).toBe(false)

    const interval = securingInterval(guarded) * 1_000
    const ticked = advanceGame(guarded, interval + 10)
    expect(ticked.threat).toBeCloseTo(60 - securingPower(guarded), 5)
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
    const state = { ...createInitialState(0), vaultGold: 400, chestGold: 40, inTransitGold: 25, threat: 95 }
    const robbed = advanceGame(state, 30_000)
    expect(robbed.theftCount).toBe(1)
    expect(robbed.chestGold).toBe(40)
    expect(robbed.inTransitGold).toBe(25)
  })

  it('builds no risk at all before the first delivery reaches the treasury', () => {
    const state = { ...createInitialState(0), chestGold: 40, minerLevels: [2, 2, 0, 0] as [number, number, number, number] }
    expect(riskGrowth(state)).toBe(0)
    const returned = advanceGame(state, 10 * 60 * 1_000)
    expect(returned.threat).toBe(0)
    expect(returned.theftCount).toBe(0)
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
  it('measures a guard in the risk points the troop gains per securing', () => {
    const state = createInitialState(0)
    expect(getSlotUpgrades(state, 'chest')[0].gain).toEqual({ amount: '+8', unit: 'Punkte je Sicherung' })

    const guarded = { ...state, guardLevels: [1, 1, 0, 0] as [number, number, number, number] }
    expect(getSlotUpgrades(guarded, 'chest')[0].gain).toEqual({ amount: '+2', unit: 'Punkte je Sicherung' })
  })

  // Ein Fuhrknecht bringt genau seine eigene Ladung ein — vom ersten an und ohne tote Stufe.
  it('measures a transporter in the load it carries itself', () => {
    const state = createInitialState(0)
    expect(getSlotUpgrades(state, 'bag')[0].gain).toEqual({ amount: `+${formatGold(transporterCapacity(1))}`, unit: 'Gold je Fuhre' })

    const staffed = { ...state, transporterLevels: [3, 0, 0, 0] as [number, number, number, number] }
    const gained = transporterCapacity(4) - transporterCapacity(3)
    expect(getSlotUpgrades(staffed, 'bag')[0].gain).toEqual({ amount: `+${formatGold(gained)}`, unit: 'Gold je Fuhre' })
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
      const before = getSlotUpgrades(state, section)[0].gain
      const neighbourBought = getSlotUpgrades(withSlotLevel(state, group, 2), section)[0].gain
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

  it('skips work and keeps its identity while the game lies dormant', () => {
    const dormant = createInitialState(0)
    const ticked = advanceGame(dormant, 10_000)

    expect(ticked).toBe(dormant)
    // Die Uhr muss trotzdem laufen, sonst würde die Ruhezeit beim ersten Bergmann rückwirkend
    // als Förderung gutgeschrieben.
    expect(ticked.lastTick).toBe(10_000)

    const hired = { ...ticked, minerLevels: [1, 0, 0, 0] as [number, number, number, number] }
    expect(advanceGame(hired, 11_000).chestGold).toBeCloseTo(passiveRate(hired), 5)
  })

  it('keeps advancing once anything is actually in motion', () => {
    const mining = { ...createInitialState(0), minerLevels: [1, 0, 0, 0] as [number, number, number, number] }
    expect(advanceGame(mining, 1_000)).not.toBe(mining)

    const banked = { ...createInitialState(0), vaultGold: 100 }
    expect(advanceGame(banked, 1_000).threat).toBeGreaterThan(0)

    const carrying = { ...createInitialState(0), transporterLevels: [1, 0, 0, 0] as [number, number, number, number], chestGold: 20 }
    expect(advanceGame(carrying, 1_000).transportStartedAt).not.toBeNull()
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
    expect(migrated?.schemaVersion).toBe(5)
    expect(migrated?.minerLevels).toEqual([2, 1, 1, 1])
    expect(migrated?.transporterLevels).toEqual([1, 1, 1, 1])
    expect(migrated?.guardLevels).toEqual([1, 1, 1, 0])
  })
})
