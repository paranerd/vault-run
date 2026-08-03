import { describe, expect, it } from 'vitest'
import {
  GOLD_FLIGHT_DURATION_MS,
  MANUAL_SECURE_AMOUNT,
  OFFLINE_THEFT_SHARE,
  SECURE_COOLDOWN_MS,
  automaticTransportAmount,
  cargoCapacity,
  chestCapacity,
  getEquipmentUpgrade,
  getSlotUpgrades,
  passiveRate,
  riskGrowth,
  securingInterval,
  securingPower,
  securingRate,
  securityLoss,
  slotVisualLevel,
  slotUpgradeCost,
  tapValue,
  vaultCapacity,
} from './config'
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
    expect(cargoCapacity(staffed)).toBeGreaterThan(cargoCapacity(state))
  })

  it('describes equipment and every slot with current and next effects', () => {
    const state = createInitialState(0)
    const upgrades = [getEquipmentUpgrade(state, 'mine'), ...getSlotUpgrades(state, 'mine')]
    expect(upgrades).toHaveLength(5)
    expect(upgrades.every((upgrade) => upgrade.currentEffect && upgrade.nextEffect)).toBe(true)
    expect(upgrades[0]).toMatchObject({ currentEffect: '+1', nextEffect: '+2' })
  })

  it('uses the promised integer pickaxe value in gameplay and upgrade stats', () => {
    const state = { ...createInitialState(0), tapLevel: 4 }
    const upgraded = getEquipmentUpgrade(state, 'mine')
    expect(tapValue(state)).toBe(5)
    expect(upgraded.currentEffect).toBe('+5')
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

  it('leads the guard card with the securing rate and keeps the cadence in the text', () => {
    const state = createInitialState(0)
    const [unguarded] = getSlotUpgrades(state, 'chest')
    expect(unguarded.currentEffect).toBe('Ungesichert')
    expect(unguarded.nextEffect).toBe('-0,7 %/s gesamt')
    expect(unguarded.description).toBe('Der Trupp senkt das Risiko danach alle 12 s um 8 Punkte und drückt den Verlust bei einem Diebeszug auf 6,9 %.')

    const guarded = { ...state, guardLevels: [1, 1, 0, 0] as [number, number, number, number] }
    expect(getSlotUpgrades(guarded, 'chest')[0].currentEffect).toBe('-1,0 %/s gesamt')
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
