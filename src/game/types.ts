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
  schemaVersion: 6
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

/** Was der Kauf zusätzlich einbringt — die eine Zahl, um die es auf einer Upgrade-Karte geht.
    Bewusst der Zugewinn und nicht „vorher → nachher“: Der Bestand steht ohnehin auf der Kachel
    des Abschnitts, hier zählt allein, was die Stufe obendrauf legt. */
export interface UpgradeGain {
  /** Vorzeichenbehafteter Zuwachs, z. B. „+0,7“. */
  amount: string
  /** Einheit dahinter, z. B. „Gold/s“. */
  unit: string
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
  /** Was der Kauf einbringt — die eine Zahl der Karte. */
  gain: UpgradeGain
  cost: number
  available: boolean
  maxed?: boolean
  accent: 'business' | 'logistics' | 'vault'
  spriteFamily: 'pickaxe' | 'bag' | 'chest' | 'miner' | 'transport' | 'security'
  spriteLevel: number
  equipmentId?: EquipmentUpgradeId
  slot?: SlotUpgradeTarget
}
