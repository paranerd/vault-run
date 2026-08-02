import { describe, expect, it } from 'vitest'
import { cargoCapacity, chestCapacity, upgradeCost, vaultCapacity } from './config'
import { advanceGame, buyUpgrade, createInitialState, startTransport, tap } from './engine'

describe('Vault Run engine', () => {
  it('moves gold from the chest into the vault in a discrete trip', () => {
    let state = createInitialState(0)
    for (let index = 0; index < 10; index += 1) state = tap(state)
    state = startTransport(state, 0)

    expect(state.chestGold).toBe(0)
    expect(state.inTransitGold).toBe(10)
    expect(state.vaultGold).toBe(0)

    state = advanceGame(state, 12_000)
    expect(state.inTransitGold).toBe(0)
    expect(state.vaultGold).toBe(10)
    expect(state.tripCount).toBe(1)
  })

  it('pauses business while the player transports gold', () => {
    let state = createInitialState(0)
    state.staffLevel = 1
    state.chestGold = 20
    state = startTransport(state, 0)
    state = advanceGame(state, 5_000)
    expect(state.chestGold).toBe(0)
  })

  it('lets the courier produce and start follow-up trips automatically', () => {
    let state = createInitialState(0)
    state.staffLevel = 1
    state.courierUnlocked = true
    state.chestGold = 20
    state = advanceGame(state, 30_000)
    expect(state.tripCount).toBeGreaterThan(1)
    expect(state.vaultGold).toBeGreaterThan(20)
  })

  it('caps offline simulation at eight hours', () => {
    let state = createInitialState(0)
    state.staffLevel = 1
    state.courierUnlocked = true
    state = advanceGame(state, 24 * 60 * 60 * 1000, true)
    expect(state.lastOfflineReport?.seconds).toBe(8 * 60 * 60)
  })

  it('spends only secured vault gold on upgrades', () => {
    let state = createInitialState(0)
    state.chestGold = 10_000
    expect(buyUpgrade(state, 'tap')).toBe(state)

    state.vaultGold = upgradeCost(state, 'tap')
    const upgraded = buyUpgrade(state, 'tap')
    expect(upgraded.tapLevel).toBe(1)
    expect(upgraded.vaultGold).toBe(0)
  })

  it('keeps all capacities positive and scaling', () => {
    const state = createInitialState(0)
    expect(chestCapacity({ ...state, chestLevel: 1 })).toBeGreaterThan(chestCapacity(state))
    expect(cargoCapacity({ ...state, cargoLevel: 1 })).toBeGreaterThan(cargoCapacity(state))
    expect(vaultCapacity({ ...state, vaultLevel: 1 })).toBeGreaterThan(vaultCapacity(state))
  })
})
