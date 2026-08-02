import { describe, expect, it } from 'vitest'
import {
  automaticTransportAmount,
  cargoCapacity,
  chestCapacity,
  getEquipmentUpgrade,
  getSlotUpgrades,
  passiveRate,
  securityRating,
  slotUpgradeCost,
  vaultCapacity,
} from './config'
import {
  advanceGame,
  buyEquipmentUpgrade,
  buySlotUpgrade,
  createInitialState,
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

    state = advanceGame(state, 6_000)
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

  it('reduces attention by clicking the treasure chest action', () => {
    const state = { ...createInitialState(0), threat: 50 }
    const secured = lowerThreat(state)
    expect(secured.threat).toBeLessThan(50)
    expect(state.threat).toBe(50)
  })

  it('improves the security rating through independently levelled guards', () => {
    const state = createInitialState(0)
    const guarded = { ...state, guardLevels: [1, 1, 0, 0] as [number, number, number, number] }
    expect(securityRating(guarded)).toBeGreaterThan(securityRating(state))
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
    expect(migrated?.schemaVersion).toBe(4)
    expect(migrated?.minerLevels).toEqual([2, 1, 1, 1])
    expect(migrated?.transporterLevels).toEqual([1, 1, 1, 1])
    expect(migrated?.guardLevels).toEqual([1, 1, 1, 0])
  })
})
