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

/** Eine Fuhre, die gerade unterwegs ist — die eines Fuhrknechts oder die des Spielers selbst.
    `deliveredAt` ist der Moment, in dem das Gold in der Truhe landet (Ende der Flug-Animation),
    `endsAt` der Moment, in dem der Träger zurück und wieder abfahrbereit ist. */
export interface Trip {
  gold: number
  startedAt: number
  deliveredAt: number
  endsAt: number
}

/** Je Slot eine laufende Fuhre oder `null`. */
export type SlotTrips = [Trip | null, Trip | null, Trip | null, Trip | null]
/** Je Slot der Zeitpunkt der letzten eigenen Lieferung bzw. Sicherung; `null`, solange der Slot
    noch nicht getaktet hat. Daraus ergibt sich der nächste Takt, und die Anzeige erkennt daran
    eine frische Lieferung. */
export type SlotBeats = [number | null, number | null, number | null, number | null]

export interface GameState {
  schemaVersion: 7
  savedAt: number
  lastTick: number
  chestGold: number
  vaultGold: number
  lifetimeGold: number
  lostGold: number
  stolenGold: number
  tapLevel: number
  chestLevel: number
  vaultLevel: number
  minerLevels: SlotLevels
  transporterLevels: SlotLevels
  guardLevels: SlotLevels
  /** Erschöpfung des Spielers von 0–100. Nur eigene Schläge erhöhen sie. */
  exhaustion: number
  /** Bei 100 % bleibt die Erschöpfung bis zu diesem Zeitpunkt stehen; erst danach erholt sie sich. */
  exhaustedUntil: number | null
  threat: number
  /** Laufende manuelle Sicherung; blockiert bis `secureEndsAt` alle Aktionen, solange keine Wache automatisiert. */
  secureStartedAt: number | null
  secureEndsAt: number | null
  /** Letzte Förderung je Bergmann und letzte Sicherung je Wache. */
  minerBeats: SlotBeats
  guardBeats: SlotBeats
  /** Die vier Fuhren der Fuhrknechte, jede für sich unterwegs. */
  transporterTrips: SlotTrips
  /** Die Fuhre, die der Spieler selbst trägt — unabhängig von allen Fuhrknechten. */
  playerTrip: Trip | null
  tripCount: number
  theftCount: number
  eventSequence: number
  events: GameEvent[]
  lastOfflineReport?: OfflineReport
}

/** Eine Zeile der Attributtabelle einer Upgrade-Karte: derselbe Wert vor und nach dem Kauf,
    dahinter sein Name. Die erste Zeile ist immer die Stufe; ihr Name ist der Rang, den die
    Einheit danach trägt. */
export interface UpgradeFact {
  from: string
  to: string
  /** Steht am Zeilenende. Leer, wenn die Zeile für sich spricht — etwa die Stufenzeile einer
      Einheit, die ihren Rangnamen behält. */
  label: string
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
  /** Alle Attribute der Einheit, jeweils vorher und nachher. Erste Zeile ist die Stufe. */
  facts: UpgradeFact[]
  cost: number
  available: boolean
  maxed?: boolean
  accent: 'business' | 'logistics' | 'vault'
  spriteFamily: 'pickaxe' | 'bag' | 'chest' | 'miner' | 'transport' | 'security'
  spriteLevel: number
  equipmentId?: EquipmentUpgradeId
  slot?: SlotUpgradeTarget
}
