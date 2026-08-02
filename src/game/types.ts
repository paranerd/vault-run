export type UpgradeId =
  | 'tap'
  | 'staff'
  | 'chest'
  | 'transport'
  | 'courier'
  | 'cargo'
  | 'convoy'
  | 'vault'
  | 'security'

export type UpgradeCategory = 'production' | 'storage' | 'transport' | 'security'

export interface GameEvent {
  id: number
  kind: 'success' | 'warning' | 'info'
  message: string
}

export interface OfflineReport {
  seconds: number
  earned: number
  delivered: number
  stolen: number
}

export interface GameState {
  schemaVersion: 2
  savedAt: number
  lastTick: number
  chestGold: number
  vaultGold: number
  inTransitGold: number
  lifetimeGold: number
  lostGold: number
  stolenGold: number
  tapLevel: number
  staffLevel: number
  chestLevel: number
  transportLevel: number
  courierUnlocked: boolean
  cargoLevel: number
  convoyLevel: number
  vaultLevel: number
  securityLevel: number
  threat: number
  transportStartedAt: number | null
  transportDeliveredAt: number | null
  transportEndsAt: number | null
  expressGold: number
  expressStartedAt: number | null
  expressDeliveredAt: number | null
  expressEndsAt: number | null
  tripCount: number
  theftCount: number
  eventSequence: number
  events: GameEvent[]
  lastOfflineReport?: OfflineReport
}

export interface UpgradeView {
  id: UpgradeId
  name: string
  description: string
  level: string
  cost: number
  available: boolean
  maxed?: boolean
  accent: 'business' | 'logistics' | 'vault'
  category: UpgradeCategory
}
