export type SectionId = 'mine' | 'bag' | 'chest'
export type EquipmentUpgradeId = 'tap' | 'chest' | 'vault'
export type SlotGroup = 'miners' | 'transporters' | 'guards'
export type UpgradeCategory = 'equipment' | SlotGroup
export type UpgradeFilter = 'all' | UpgradeCategory
export type SlotIndex = 0 | 1 | 2 | 3
export type SlotLevels = [number, number, number, number]

export interface SlotUpgradeTarget {
  group: SlotGroup
  index: SlotIndex
}

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
  schemaVersion: 5
  savedAt: number
  lastTick: number
  chestGold: number
  vaultGold: number
  inTransitGold: number
  lifetimeGold: number
  lostGold: number
  stolenGold: number
  tapLevel: number
  chestLevel: number
  vaultLevel: number
  minerLevels: SlotLevels
  transporterLevels: SlotLevels
  guardLevels: SlotLevels
  threat: number
  /** Laufende manuelle Sicherung; blockiert bis `secureEndsAt` alle Aktionen, solange keine Wache automatisiert. */
  secureStartedAt: number | null
  secureEndsAt: number | null
  /** Zeitpunkt der letzten automatischen Sicherung; `null`, solange keine Wache angestellt ist. */
  lastAutoSecureAt: number | null
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
  key: string
  section: SectionId
  /** Sprechender Name der Stufe, auf der das Upgrade gerade steht. */
  name: string
  description: string
  /** Spielerseitige Stufennummer; die nächste Stufe ist immer `stage + 1`. */
  stage: number
  currentEffect: string
  nextEffect: string
  cost: number
  available: boolean
  maxed?: boolean
  accent: 'business' | 'logistics' | 'vault'
  spriteFamily: 'pickaxe' | 'bag' | 'chest' | 'miner' | 'transport' | 'security'
  spriteLevel: number
  equipmentId?: EquipmentUpgradeId
  slot?: SlotUpgradeTarget
}
