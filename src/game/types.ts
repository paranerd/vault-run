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

/** Eine messbare Größe, die der Stufenaufstieg verändert: benannt, mit Wert vorher und nachher.
    Genau eine Zeile der Wirkungstabelle einer Upgrade-Karte. */
export interface UpgradeEffect {
  /** Was gemessen wird, z. B. „Fördermenge“. */
  label: string
  current: string
  next: string
  /** Einheit, die nur einmal hinter dem Nachher-Wert steht — „12 → 19 Gold“ statt zweimal „Gold“. */
  unit?: string
}

export interface UpgradeView {
  key: string
  section: SectionId
  /** Sprechender Name der Stufe, auf der das Upgrade gerade steht. */
  name: string
  /** Name nach dem Kauf; nur gesetzt, wenn der Aufstieg ihn tatsächlich ändert. */
  nextName?: string
  /** Kurzer Hinweis auf einen Effekt, der sich aus keiner Zahl ablesen lässt. Slots tragen ihn
      nicht — dort steht der gemeinsame Hinweis einmal über der Gruppe statt viermal je Karte. */
  hint?: string
  /** Spielerseitige Stufennummer; die nächste Stufe ist immer `stage + 1`. */
  stage: number
  /** Alles, was der Aufstieg zahlenmäßig verändert — führende Zeile zuerst. */
  effects: UpgradeEffect[]
  cost: number
  available: boolean
  maxed?: boolean
  accent: 'business' | 'logistics' | 'vault'
  spriteFamily: 'pickaxe' | 'bag' | 'chest' | 'miner' | 'transport' | 'security'
  spriteLevel: number
  equipmentId?: EquipmentUpgradeId
  slot?: SlotUpgradeTarget
}
