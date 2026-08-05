/** Die drei Abschnitte der Szene, benannt nach dem, was in ihnen steht: der Fels, der Haufen am
    Stollenmund und der Hort. Das Lager hieß früher „Beutel" — ein Name, der die Kette falsch
    erzählte: In diesen Puffer fördern vier angestellte Bergleute, und vier Fuhrknechte laden
    daraus ab. Der Beutel ist seither das, was der Spieler selbst schultert. */
export type SectionId = 'mine' | 'stock' | 'vault'

/** Alles, was einmalig gekauft wird — im Gegensatz zu den vier Slots je Abschnitt.
 *
 *  `tap`, `pack`, `boots` und `lamp` sind die **Ausrüstung des Spielers**: Jedes Stück gehört zu
 *  einer seiner drei Handlungen, die Stiefel zu beiden, bei denen er läuft. `stock` und `vault`
 *  sind dagegen **Behälter des Reiches**. Ohne die vier Spielerstücke wären zwei seiner drei
 *  Handlungen Konstanten in einem Spiel, in dem alles andere unbegrenzt wächst — aktives Spiel
 *  hörte damit zwangsläufig irgendwann auf, sich zu lohnen. */
export type EquipmentUpgradeId = 'tap' | 'pack' | 'boots' | 'lamp' | 'stock' | 'vault'
export type SlotGroup = 'miners' | 'transporters' | 'guards'
export type UpgradeCategory = 'equipment' | SlotGroup
/** Die Reiter des Ausbau-Sheets sind genau die Kategorien — einen Sammelreiter „Alle“ gibt es
    nicht mehr. Er zeigte alle vier Kategorien untereinander und war damit nur die längste Fassung
    dessen, was die vier anderen Reiter einzeln sagen; zugleich konnte er als einziger keine
    Angebote abhaken, weil er auf keine Kategorie zeigte. */
export type UpgradeFilter = UpgradeCategory
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
  schemaVersion: 8
  savedAt: number
  lastTick: number
  /** Was im Lager am Stollenmund liegt: gefördert, aber noch nicht abtransportiert. */
  stockGold: number
  vaultGold: number
  lifetimeGold: number
  lostGold: number
  stolenGold: number
  /** Die vier Ausrüstungsstücke des Spielers: Pickhacke, Beutel, Stiefel, Grubenlampe. */
  tapLevel: number
  packLevel: number
  bootsLevel: number
  lampLevel: number
  /** Die beiden Behälter: das Lager am Stollenmund und der Hort. */
  stockLevel: number
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
  /** Bruchteil eines Goldstücks, den ein Bergmann noch am Fels stehen hat. In den Beutel wandern
      nur ganze Stücke; was ein Takt darüber hinaus fördert, bleibt hier liegen und geht in die
      nächste Förderung ein. Über viele Takte hinweg bleibt die Fördermenge damit exakt die Rate. */
  minerCarry: SlotLevels
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
  /** Der Reiter, unter dem die Karte im Ausbau-Sheet steht. Nicht aus dem `key` ableitbar: Lager
      und Truhe sind Ausrüstung und stehen trotzdem bei ihrem eigenen Abschnitt. */
  category: UpgradeCategory
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
  /** Die Bilddatei-Reihe unter `public/sprites`. Jede Ausrüstung hat ihre eigene, damit keine
      zwei Karten derselben Kategorie dasselbe Bild tragen. */
  spriteFamily: 'pickaxe' | 'pack' | 'boots' | 'lamp' | 'stock' | 'vault' | 'miner' | 'transport' | 'security'
  spriteLevel: number
  equipmentId?: EquipmentUpgradeId
  slot?: SlotUpgradeTarget
}
