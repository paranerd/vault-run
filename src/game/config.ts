import { formatDecimal, formatGold, formatInteger } from './format'
import type {
  EquipmentUpgradeId,
  GameState,
  SectionId,
  SlotGroup,
  SlotIndex,
  SlotLevels,
  UpgradeCategory,
  UpgradeFilter,
  UpgradeFact,
  UpgradeView,
} from './types'

export const MAX_OFFLINE_SECONDS = 8 * 60 * 60
export const GOLD_FLIGHT_DURATION_MS = 900

/** Alle Stufennamen stehen in `docs/stufen.md` mit ihren Beschreibungen; hier steht nur, was das
    Spiel selbst anzeigt. Zehn Namen je Strang, und darüber hinaus zählt die Stufennummer weiter,
    während der letzte Name stehen bleibt — die Stufen sind nicht gedeckelt. */
export const PICKAXES = [
  'Rostige Pickhacke', 'Geflickte Pickhacke', 'Eiserne Pickhacke', 'Gehärtete Stahlhaue',
  'Doppelspitzhaue', 'Silberstahlhaue', 'Zwergenhaue', 'Goldene Pickhacke', 'Runenhaue',
  'Drachenzahnhaue',
] as const

/** Was der Spieler selbst schultert — nicht der Puffer, in den seine Bergleute fördern. Der heißt
    seit dieser Trennung `STOCKPILES`. */
export const PACKS = [
  'Löchriger Lederbeutel', 'Genähter Lederbeutel', 'Verstärkter Goldbeutel', 'Doppelte Gürteltasche',
  'Großer Bergmannssack', 'Zunftranzen', 'Eisenbeschlagener Packsack', 'Königlicher Goldsack',
  'Runenbeutel', 'Beutel der Leere',
] as const

export const BOOTS = [
  'Durchgelaufene Schuhe', 'Genagelte Arbeitsschuhe', 'Geschnürte Lederstiefel', 'Grubenstiefel',
  'Marschstiefel', 'Federleichte Stiefel', 'Zwergenstiefel', 'Siebenmeilenstiefel', 'Runenstiefel',
  'Windschuhe',
] as const

export const LAMPS = [
  'Rußige Talgfunzel', 'Blechlaterne', 'Hornlaterne', 'Spiegelöllampe', 'Karbidlampe',
  'Zwergenleuchte', 'Bannlaterne', 'Spiegelkranzlaterne', 'Runenlicht', 'Sonnenstein',
] as const

export const STOCKPILES = [
  'Loser Erzhaufen', 'Bretterverschlag', 'Geflochtene Erzkörbe', 'Gezimmerter Schuppen',
  'Steinernes Erzlager', 'Grubenspeicher', 'Zunftdepot', 'Gewölbelager', 'Runenspeicher',
  'Hallenlager',
] as const

export const TREASURE_CHESTS = [
  'Morsche Holzkiste', 'Beschlagene Holztruhe', 'Eisentruhe', 'Riegeltruhe', 'Steinschrein',
  'Vergoldete Prunktruhe', 'Zwergentresor', 'Juwelentruhe', 'Runentruhe', 'Drachenhort',
] as const

export const SECTION_SLOT_GROUP: Record<SectionId, SlotGroup> = {
  mine: 'miners',
  stock: 'transporters',
  vault: 'guards',
}

export const SECTION_LABEL: Record<SectionId, string> = {
  mine: 'Mine',
  stock: 'Lager',
  vault: 'Truhe',
}

/** Sprechende Stufennamen, zehn je Strang; darüber hinaus gilt der letzte Name. */
const SLOT_STAGE_NAMES: Record<SlotGroup, readonly string[]> = {
  miners: [
    'Tagelöhner', 'Grubenknappe', 'Hauer', 'Steinbrecher', 'Sprengmeister', 'Erzmeister',
    'Zwergenhauer', 'Rutengänger', 'Runenbrecher', 'Steingolem',
  ],
  transporters: [
    'Laufbursche', 'Packesel', 'Schubkarre', 'Packpferd', 'Ochsenkarren', 'Panzerkarren',
    'Vierspänner', 'Königskutsche', 'Greifengespann', 'Torstein',
  ],
  guards: [
    'Nachtwächter', 'Wachhund', 'Speerknecht', 'Söldnerwache', 'Rüdenmeister', 'Wachhauptmann',
    'Schattenspäher', 'Ordensritter', 'Königsgardist', 'Greifenreiter',
  ],
}

const SLOT_EMPTY_NAME: Record<SlotGroup, string> = {
  miners: 'Leerer Stollen',
  transporters: 'Kein Transport',
  guards: 'Unbewachte Ecke',
}

/** Wie eine Gruppe zusammenwirkt. Steht einmal über den vier Karten, weil es für alle vier
    identisch gilt — auf den Karten selbst stand derselbe Satz bisher viermal untereinander.
    Hier steht außerdem alles, was mehrere Slots gemeinsam bewirken: Auf der Karte hätte es keine
    Zahl, die nur zu ihr gehört, und ließe sie sich beim Kauf nebenan ändern. */
const SLOT_GROUP_HINT: Record<SlotGroup, string> = {
  miners: 'Jeder Bergmann fördert für sich, jede Sekunde einmal. Jede Stufe erhöht allein seine Fördermenge.',
  transporters: 'Jeder Fuhrknecht fährt für sich, mit eigener Ladung und eigener Dauer. Deine eigene Fuhre läuft unabhängig daneben.',
  guards: 'Jede Wache trägt in ihrem eigenen Takt Risiko ab. Ihre Kraft wirkt dagegen nur zusammen: Jeder Punkt des Trupps senkt den Verlust bei einem Diebeszug um 7 %.',
}

export function slotStageName(group: SlotGroup, level: number): string {
  if (level <= 0) return SLOT_EMPTY_NAME[group]
  const names = SLOT_STAGE_NAMES[group]
  return names[Math.min(names.length - 1, level - 1)]
}

const SLOT_SECTION: Record<SlotGroup, SectionId> = {
  miners: 'mine',
  transporters: 'stock',
  guards: 'vault',
}

const SLOT_ACCENT: Record<SlotGroup, UpgradeView['accent']> = {
  miners: 'business',
  transporters: 'logistics',
  guards: 'vault',
}

const SLOT_SPRITE: Record<SlotGroup, UpgradeView['spriteFamily']> = {
  miners: 'miner',
  transporters: 'transport',
  guards: 'security',
}

const cost = (base: number, factor: number, level: number) => Math.ceil(base * factor ** level)
const effectGold = (value: number) => formatGold(value)
/** Der Name zur Stufe. Oberhalb des letzten benannten Rangs bleibt er stehen, während die
    Stufennummer weiterzählt — die Namenstabellen decken zehn Stufen ab, die Stufen selbst sind
    nicht gedeckelt. */
const stageName = (names: readonly string[], level: number) =>
  names[Math.min(names.length - 1, Math.max(0, level))]
const effectValue = (value: number) => formatInteger(Math.floor(value))
const effectRate = (value: number) => formatDecimal(value)

export const slotVisualLevel = (group: SlotGroup, level: number) => {
  return Math.max(0, level - 1)
}

export const tapValue = (state: GameState) => Math.ceil(1.42 ** state.tapLevel)
/** Rund 17 schnelle Schläge auf der Startstufe. Jede Pickhackenstufe senkt die Belastung. */
export const exhaustionPerTap = (state: GameState) => Math.max(1.5, 6 * 0.9 ** state.tapLevel)
/** 20 Punkte pro Sekunde ergeben die abgestimmten fünf Sekunden von 100 auf 0. */
export const exhaustionRecoveryRate = (_state: GameState) => 20
/** Die Zwangspause bei 100 %. Sie ist der einzige Preis des Dauerschürfens und war mit einer
    Dreiviertelsekunde kürzer als die Reaktionszeit, die sie erzwingen sollte — wer schnell genug
    tippte, merkte sie kaum. Vier Sekunden sind lang genug, dass die volle Leiste den Spieler
    tatsächlich vom Fels wegschickt, und liegen dabei unter der Erholung selbst (5 s), sodass die
    Pause nicht länger dauert als das Abkühlen danach. */
export const EXHAUSTION_BREAK_MS = 4_000

/** Ein voller Balken ist in jedem Abschnitt dasselbe: der Punkt, an dem gehandelt werden muss.
    Risiko, Lager und Erschöpfung teilen sich darum eine einzige Warnschwelle — die Farbe sagt
    dann überall dasselbe, statt dass jeder Abschnitt sein eigenes „bald" hätte. */
export const METER_WARNING = 75
export const METER_ALERT = 90

export const stockCapacity = (state: GameState) => 50 * 1.55 ** state.stockLevel
export const vaultCapacity = (state: GameState) => 500 * 2.4 ** state.vaultLevel

/** Jede Einheit im Spiel — Bergmann, Fuhrknecht, Wache — arbeitet nach demselben Muster: eine
    eigene **Menge** in einem eigenen **Takt**, unabhängig von allen anderen. Nichts wird über eine
    Gruppe verrechnet, es gibt keine gemeinsame Fuhre und keinen Trupp-Bonus. Der Durchsatz einer
    Gruppe ist schlicht die Summe ihrer Einheiten, und der Zuwachs eines Aufstiegs hängt nur an der
    Einheit, die aufsteigt.
 *
 *  Kein Takt läuft schneller als eine Sekunde. Das hält die Ankünfte einzeln sichtbar, statt sie
 *  zu einem Flimmern zu verschmelzen, und deckelt zugleich die Zahl der Animationen: Bei vollem
 *  Ausbau liefern höchstens zwölf Einheiten je Sekunde je einmal. Oberhalb des Bodens trägt
 *  ausschließlich die Menge das weitere Wachstum. */
export const MIN_CYCLE_SECONDS = 1

// --- Die Ausrüstung des Spielers: eine eigene Größe je Handlung -------------------------------
/** Der Spieler hat drei Handlungen — schürfen, seine eigene Fuhre tragen, von Hand Wache gehen —
    und für jede ein Ausrüstungsstück, das sie besser macht. Ohne sie wäre nur der Schlag
    ausbaubar gewesen, und Fuhre wie Wachgang blieben Konstanten in einem Spiel, dessen Automatik
    unbegrenzt wächst: Aktives Spiel hörte damit zwangsläufig auf, sich zu lohnen.
 *
 *  Die Stiefel sind das einzige Stück, das auf zwei Handlungen wirkt. Das ist kein Sonderfall,
 *  sondern dieselbe Regel: Fuhre und Wachgang sind beide Wege, die er zu Fuß zurücklegt. Wären
 *  sie nur der Fuhre zugeschlagen, bliebe der Wachgang der einzige Teil von ihm, der nie besser
 *  wird — und damit ab dem dritten Wachposten überflüssig. */

/** Die **Ladung**: was er in einer Fuhre schultert. Gedeckelt auf das, was im Lager überhaupt
    Platz hat — mehr als der Haufen fasst, kann niemand daraus wegtragen. Ohne diesen Deckel wäre
    ein Beutel über der Lagergröße ein Kauf ohne Wirkung; mit ihm zeigt die Karte vorher und
    nachher dieselbe Zahl und sagt damit selbst, dass zuerst das Lager wachsen muss. */
export const packCargo = (state: GameState) => Math.min(Math.round(25 * 1.5 ** state.packLevel), stockCapacity(state))

/** Die beiden Wege, die der Spieler zu Fuß geht, als **Länge**: die Sekunden, die er auf seinem
    Anfangstempo für Hin- und Rückweg zusammen braucht. Die Strecke ändert sich nie — was sich
    ändert, ist, wie schnell er sie zurücklegt. */
const TRIP_ROUTE_SECONDS = 12
const SECURE_ROUTE_SECONDS = 1.5

/** Die **Geschwindigkeit** des Spielers, als Vielfaches seines Anfangstempos. Das ist die Größe,
    die die Stiefel ausbauen, und sie **wächst** — anders als die Dauer, die vorher an dieser
    Stelle stand und mit jeder Stufe kleiner wurde.
 *
 *  Dass die Wege trotzdem kürzer werden, ist keine Sonderregel, sondern die Definition von Tempo:
 *  Eine Strecke kostet `Länge ÷ Geschwindigkeit`. Die wachsende Zahl steht damit im Nenner, und
 *  die Richtung stimmt von selbst — es gibt keine Stelle mehr, an der ein „mehr ist besser“ per
 *  Hand in ein „weniger ist besser“ übersetzt werden müsste.
 *
 *  Der Faktor ist der Kehrwert des früheren 0,88: Jede Stufe macht denselben Sprung wie vorher,
 *  nur von der anderen Seite gelesen. */
export const bootsSpeed = (state: GameState) => 1 / 0.88 ** state.bootsLevel

/** Die **Dauer** eines Weges: seine Länge durch das Tempo, gegen den Boden von einer Sekunde —
    derselbe Boden wie bei jeder anderen Einheit. */
export const manualTripSeconds = (state: GameState) =>
  Math.max(MIN_CYCLE_SECONDS, TRIP_ROUTE_SECONDS / bootsSpeed(state))

/** Der Wachgang ist kein Takt einer Automatik, sondern ein Tastendruck; sein Boden liegt deshalb
    unter `MIN_CYCLE_SECONDS`, der die Zahl gleichzeitiger Animationen deckelt. Eine halbe Sekunde
    ist die Grenze, unterhalb derer die Sperre der beiden anderen Aktionen nicht mehr zu spüren
    wäre — und genau diese Sperre ist der Preis des Wachgangs. */
export const MANUAL_SECURE_FLOOR_SECONDS = 0.5
export const manualSecureSeconds = (state: GameState) =>
  Math.max(MANUAL_SECURE_FLOOR_SECONDS, SECURE_ROUTE_SECONDS / bootsSpeed(state))

/** Das Tempo, das auf der Stiefelkarte steht: nicht das rohe `bootsSpeed`, sondern das, was der
    Spieler auf der Fuhre tatsächlich erreicht. Beides ist dasselbe, solange kein Boden greift.
 *
 *  Der Unterschied zählt erst ganz oben: Ab dem Boden der Fuhre wird kein Weg mehr kürzer, und
 *  eine Karte, die dort weiter steigende Zahlen zeigte, forderte zu einem Kauf ohne Wirkung auf.
 *  Gemessen wird an der Fuhre, weil sie ihren Boden von beiden Wegen als Letzte erreicht — solange
 *  sie noch schneller wird, tun die Stiefel noch etwas. */
export const bootsPace = (state: GameState) => TRIP_ROUTE_SECONDS / manualTripSeconds(state)

/** Die **Sichtweite** eines Wachgangs, in denselben Punkten der Hundert-Punkte-Skala, die auch eine
    Wache abträgt (`guardSight`). Dieselbe Beschriftung heißt dieselbe Skala: Lampe und Wache sind
    damit unmittelbar gegeneinander abwägbar. Der Spieler liegt dabei weit über jeder einzelnen
    Wache — er bezahlt seine Punkte mit eigener Zeit, in der er weder fördert noch trägt.
 *
 *  Das Attribut hieß früher „Kraft“. Eine Lampe hat keine Kraft, sie leuchtet: Was sie abträgt,
 *  ist entdeckte Umgebung, und genau das ist die Skala des Risikos. „Kraft“ ist seither die
 *  Handfestigkeit der Wachen im Ernstfall — eine andere Größe, die auch anders heißen muss. */
export const lampSight = (state: GameState) => Math.round(25 * 1.25 ** state.lampLevel)

// --- Bergleute: eine Förderung je Sekunde, die Stufe bestimmt allein die Menge ---
/** Bergleute arbeiten immer im Sekundentakt. Damit ist ihre Fördermenge zugleich ihre Rate, und
    die Karte braucht keine Taktzeile. */
export const minerInterval = (_level: number) => MIN_CYCLE_SECONDS
/** Ganze Goldstücke je Sekunde, Stufe für Stufe rund anderthalbmal so viel: 1, 2, 3, 4, 6, 8, 12,
    18, 26 … Die Kurve ist dieselbe wie zuvor (Faktor 1,5), nur auf ganze Stücke aufgerundet und
    damit gleichmäßig um gut die Hälfte angehoben — die frühere Reihe begann bei 0,65 und traf
    zwischen den Stufen nie eine ganze Zahl. Der Aufschlag steckt in den Kosten (`slotUpgradeCost`),
    sodass ein Bergmann pro Gold dasselbe leistet wie vorher; was sich ändert, ist allein, dass
    jeder Takt ein sichtbares Goldstück liefert statt eines Bruchteils.
    Aufgerundet wird, nicht gerundet: Nur so wächst die Reihe auf jeder Stufe echt an, statt in den
    unteren Stufen zweimal denselben Wert zu zeigen — ein Aufstieg, der nichts ändert, ist keiner. */
export const minerRate = (level: number) => level === 0 ? 0 : Math.ceil(1.5 ** (level - 1))
export const minerYield = (level: number) => level === 0 ? 0 : minerRate(level) * minerInterval(level)
export const passiveRate = (state: GameState) => state.minerLevels.reduce((total, level) => total + minerRate(level), 0)

// --- Fuhrknechte: Ladung je Fahrt, Dauer einer Fahrt ---
export const activeTransporters = (state: GameState) => state.transporterLevels.filter((level) => level > 0).length
export const hasAutomaticTransport = (state: GameState) => activeTransporters(state) > 0
export const transporterCapacity = (level: number) => level === 0 ? 0 : 12 * 1.55 ** (level - 1)
/** 12 s auf Stufe 1, gegen den Boden von 1 s hin immer kürzer. Der Faktor ist so gewählt, dass die
    Fahrzeit über die ersten acht Stufen denselben Bogen nimmt wie früher die gemeinsame Fuhre. */
export const transporterTripSeconds = (level: number) => Math.max(MIN_CYCLE_SECONDS, 12 / (1 + (level - 1) * 0.45))
export const transporterRate = (level: number) => level === 0 ? 0 : transporterCapacity(level) / transporterTripSeconds(level)
export const automaticTransportRate = (state: GameState) =>
  state.transporterLevels.reduce((total, level) => total + transporterRate(level), 0)

/** Anteil der Schatztruhe, den ein Diebeszug mitnimmt. Deutlich kleiner als der frühere
    Lager-Anteil: Bezugsgröße ist jetzt das gesamte Vermögen, nicht der Inhalt eines Haufens.
    Je Kraftpunkt des Trupps bleiben 93 % des Verlusts übrig; eine Wachenstufe bringt zwei Punkte
    und senkt ihn damit um dieselben gut 13 %, die vorher als unsichtbarer Stufenbonus im Hinweis
    über der Gruppe standen. */
export const LOSS_PER_MIGHT = 0.93
export const securityLoss = (state: GameState) => Math.max(0.015, 0.08 * LOSS_PER_MIGHT ** guardMightTotal(state))

/** Ab `METER_ALERT` pulsiert zusätzlich die Sicherung — die Vorwarnung vor dem Diebeszug. */
export const RISK_ALERT = METER_ALERT

/** Wie stark der Anstieg je Truhenstufe zulegt. Ohne diesen Faktor stand ein fester Deckel von
    1,05 %/s gegen Wachen, die unbegrenzt weiterwachsen — drei billigste Wachen für 450 Gold
    stellten das Risiko dauerhaft auf null, und mit ihm den ganzen Diebstahl-Teil des Spiels.
    Eine Konstante gegen eine unbegrenzte Gegenkraft kann nur einmal ausgehen. */
export const RISK_PER_VAULT_LEVEL = 0.25

/** Risiko-Zuwachs pro Sekunde. Wächst nur, solange etwas in der Schatztruhe liegt, und hängt am
    Füllstand — die Diebe zielen auf den Hort, nicht auf das Lager. Dazu wächst er mit der Größe
    des Horts: Eine prächtigere Truhe ist ein lohnenderes Ziel, und nur so bleibt der Trupp über
    das ganze Spiel gefordert statt nach den ersten Käufen überflüssig.
 *
 *  Ein Truhenausbau senkt den Druck trotzdem weiterhin sofort: Er verdreifacht die Kapazität,
 *  der Füllstand fällt also auf gut 40 % und der Anstieg auf knapp 60 % — mehr, als der
 *  Stufenfaktor von höchstens 25 % dagegenhält.
 *
 *  Die Wachen greifen über ihre Sicherungen ein, nicht bremsend, sonst zählten sie doppelt. */
export const riskGrowth = (state: GameState) => {
  if (state.vaultGold <= 0) return 0
  const fill = Math.min(1, state.vaultGold / vaultCapacity(state))
  return (0.3 + 0.75 * fill) * (1 + RISK_PER_VAULT_LEVEL * state.vaultLevel)
}

/** Deckel für Diebstahl während einer Offline-Strecke, gemessen an allem, was auf der Strecke
    Truhengold war (Stand beim Verlassen plus Lieferungen). Ohne ihn räumte eine durchschlafene
    Nacht die Truhe restlos leer. */
export const OFFLINE_THEFT_SHARE = 0.25

export const activeGuards = (state: GameState) => state.guardLevels.filter((level) => level > 0).length
export const hasAutomaticSecurity = (state: GameState) => activeGuards(state) > 0

// --- Wachen: Sichtweite je Sicherung, Takt zwischen zwei Sicherungen, Kraft im Ernstfall ---
/** Punkte, die **diese** Wache je Sicherung abträgt — kein Trupp-Wert mehr. Der frühere Sockel von
    6 Punkten gehörte dem Trupp als Ganzem; je Wache gezählt hätte er sich mit jedem Posten
    vervielfacht. Er steckt deshalb kleiner in jeder einzelnen Wache.
 *
 *  Hieß bis eben **Kraft**; die Umbenennung folgt der Grubenlampe. Was eine Runde abträgt, ist
 *  abgesuchtes Gelände — dafür braucht es Augen und Licht, keine Fäuste. */
export const guardSight = (level: number) => level === 0 ? 0 : 4 + 2 * level
export const guardInterval = (level: number) => Math.max(MIN_CYCLE_SECONDS, 12 / (1 + (level - 1) * 0.35))
export const guardRate = (level: number) => level === 0 ? 0 : guardSight(level) / guardInterval(level)

/** Die **Kraft** dieser einen Wache: was sie beiträgt, wenn die Diebe trotz aller Runden zuschlagen.
    Das dritte Attribut der Wachen und das einzige, das nicht am Takt hängt — Sichtweite und Dauer
    verhindern den Diebeszug, Kraft begrenzt ihn.
 *
 *  Zwei Punkte je Stufe, additiv wie die Sichtweite: Damit gehört die Zeile der Wache allein und
 *  bleibt stehen, wenn nebenan gekauft wird. Wirksam wird sie erst als Summe des Trupps
 *  (`guardMightTotal`) — das steht als ein Satz über der Gruppe, nicht auf jeder Karte. */
export const guardMight = (level: number) => level === 0 ? 0 : 2 * level

/** Die Kraft des ganzen Trupps: die Summe dessen, was jede einzelne Wache mitbringt. Anders als
    Sichtweite und Dauer wirkt Kraft nur gemeinsam — sie ist die eine Größe der Wachen, die kein
    Takt ist, sondern der Moment, in dem der Takt nicht gereicht hat. */
export const guardMightTotal = (state: GameState) =>
  state.guardLevels.reduce((total, level) => total + guardMight(level), 0)

/** Summe aller Wachen in Risikopunkten pro Sekunde — dieselbe Einheit wie `riskGrowth`, damit
    Kachel und Wachen-Karte direkt gegeneinander lesbar sind. */
export const securingRate = (state: GameState) =>
  state.guardLevels.reduce((total, level) => total + guardRate(level), 0)

/** Die Stufe, auf der jedes Ausrüstungsstück gerade steht. Eine Stelle statt sechs verstreuter
    Feldzugriffe — Preis, Karte und Kauf lesen alle hierüber. */
export const equipmentLevel = (state: GameState, id: EquipmentUpgradeId): number => {
  switch (id) {
    case 'tap': return state.tapLevel
    case 'pack': return state.packLevel
    case 'boots': return state.bootsLevel
    case 'lamp': return state.lampLevel
    case 'stock': return state.stockLevel
    case 'vault': return state.vaultLevel
  }
}

/** Die Preise der Spielerausrüstung liegen bewusst über der Pickhacke: Sie wirkt auf jeden Schlag,
    die anderen drei nur, solange der Spieler selbst zugreift. Die Stiefel sind das teuerste Stück,
    weil sie als einziges auf zwei Handlungen wirkt und sich mit dem Beutel multipliziert
    (Ladung ÷ Dauer) — an diesem Paar hängt der ganze manuelle Durchsatz. */
export function equipmentUpgradeCost(state: GameState, id: EquipmentUpgradeId): number {
  const bases: Record<EquipmentUpgradeId, number> = { tap: 12, pack: 60, boots: 150, lamp: 80, stock: 45, vault: 300 }
  const factors: Record<EquipmentUpgradeId, number> = { tap: 1.58, pack: 1.7, boots: 1.8, lamp: 1.7, stock: 1.62, vault: 1.85 }
  return cost(bases[id], factors[id], equipmentLevel(state, id))
}

export function slotUpgradeCost(state: GameState, group: SlotGroup, index: SlotIndex): number {
  // Der Sockel der Bergleute trägt den Aufschlag der ganzzahligen Fördermengen: Die Reihe
  // 1, 2, 3, 4, 6 … liegt gut die Hälfte über der früheren 0,65, 0,98, 1,46 …, und derselbe
  // Faktor steckt hier im Preis. Ein Bergmann kostet damit unverändert rund 115 Gold je Gold
  // je Sekunde auf der ersten Stufe.
  const bases: Record<SlotGroup, number> = { miners: 115, transporters: 180, guards: 150 }
  const factors: Record<SlotGroup, number> = { miners: 1.72, transporters: 1.78, guards: 1.8 }
  const levels = group === 'miners' ? state.minerLevels : group === 'transporters' ? state.transporterLevels : state.guardLevels
  return cost(bases[group], factors[group], levels[index])
}

const EQUIPMENT_LEVEL_KEY: Record<EquipmentUpgradeId, keyof GameState & `${string}Level`> = {
  tap: 'tapLevel', pack: 'packLevel', boots: 'bootsLevel', lamp: 'lampLevel',
  stock: 'stockLevel', vault: 'vaultLevel',
}

export function withEquipmentLevel(state: GameState, id: EquipmentUpgradeId): GameState {
  const key = EQUIPMENT_LEVEL_KEY[id]
  return { ...state, [key]: state[key] + 1 }
}

export function withSlotLevel(state: GameState, group: SlotGroup, index: SlotIndex): GameState {
  const key = group === 'miners' ? 'minerLevels' : group === 'transporters' ? 'transporterLevels' : 'guardLevels'
  const levels = [...state[key]] as SlotLevels
  levels[index] += 1
  return { ...state, [key]: levels }
}

/** Die Stufenzeile, mit der jede Karte beginnt: nur die beiden Nummern. Der Rang nach dem Kauf
    stand bis eben rechts daneben und war die einzige Zeile der Tabelle, die keinen Wert
    verglich — ein Name statt eines Vorher/Nachher, der die Spalte aufhielt, in der überall sonst
    das Attribut steht. Was die Einheit heute ist, sagt die Überschrift der Karte; was sie nach
    dem Kauf ist, sagt sie unmittelbar danach selbst. */
const stageFact = (stage: number): UpgradeFact =>
  ({ from: `Stufe ${stage}`, to: `Stufe ${stage + 1}`, label: '' })

/** Eine Attributzeile: derselbe Wert vor und nach dem Kauf. Reine Zahlen — die Einheit stand
    hinter jedem Nachher-Wert und wiederholte, was der Attributname links davon längst sagt.
    Ein Slot, der noch unbesetzt ist, hat keinen Vorher-Wert; dort steht ein Strich statt einer
    erfundenen Null. */
function fact(label: string, before: number | null, after: number, format: (value: number) => string): UpgradeFact {
  return { from: before === null ? '–' : format(before), to: format(after), label }
}

/** Alles, was eine Ausrüstungskarte von den anderen unterscheidet. Die sechs Karten unterschieden
    sich vorher in drei ausgeschriebenen Zweigen um jeweils vier Zeilen; hier steht je Stück nur
    noch das, was ihm allein gehört.
 *
 *  Einen Fließtext trägt keine von ihnen mehr. Er stand als einziger Teil der Karte neben der
 *  Tabelle statt in ihr, wiederholte auf den vier Spielerstücken viermal denselben Satz („wirkt
 *  nur, wenn du selbst …“) und war auf den beiden Behältern die Regel, die der Füllstand in der
 *  Szene ohnehin zeigt. Was für eine ganze Gruppe gilt, steht weiterhin über ihr. */
interface EquipmentSpec {
  section: SectionId
  /** Der Reiter, unter dem das Stück steht. Die vier Stücke am Körper des Spielers teilen sich den
      Reiter „Ausrüstung“; Lager und Truhe stehen dagegen bei ihrem eigenen Abschnitt, weil sie ihm
      gehören und nicht ihm getragen werden. */
  category: UpgradeCategory
  names: readonly string[]
  accent: UpgradeView['accent']
  spriteFamily: UpgradeView['spriteFamily']
  /** Die Attributzeilen unter der Stufenzeile, vorher und nachher. */
  facts: (state: GameState, next: GameState) => UpgradeFact[]
}

const EQUIPMENT: Record<EquipmentUpgradeId, EquipmentSpec> = {
  tap: {
    section: 'mine', category: 'equipment', names: PICKAXES, accent: 'business', spriteFamily: 'pickaxe',
    facts: (state, next) => [
      fact('Fördermenge', tapValue(state), tapValue(next), effectValue),
      fact('Erschöpfung', exhaustionPerTap(state), exhaustionPerTap(next), effectRate),
    ],
  },
  pack: {
    section: 'stock', category: 'equipment', names: PACKS, accent: 'logistics', spriteFamily: 'pack',
    facts: (state, next) => [fact('Ladung', packCargo(state), packCargo(next), effectGold)],
  },
  boots: {
    section: 'stock', category: 'equipment', names: BOOTS, accent: 'logistics', spriteFamily: 'boots',
    facts: (state, next) => [fact('Geschwindigkeit', bootsPace(state), bootsPace(next), effectRate)],
  },
  lamp: {
    section: 'vault', category: 'equipment', names: LAMPS, accent: 'vault', spriteFamily: 'lamp',
    facts: (state, next) => [fact('Sichtweite', lampSight(state), lampSight(next), effectValue)],
  },
  stock: {
    section: 'stock', category: 'transporters', names: STOCKPILES, accent: 'logistics', spriteFamily: 'stock',
    facts: (state, next) => [fact('Kapazität', stockCapacity(state), stockCapacity(next), effectGold)],
  },
  vault: {
    section: 'vault', category: 'guards', names: TREASURE_CHESTS, accent: 'vault', spriteFamily: 'vault',
    facts: (state, next) => [fact('Kapazität', vaultCapacity(state), vaultCapacity(next), effectGold)],
  },
}

export function getEquipmentUpgrade(state: GameState, id: EquipmentUpgradeId): UpgradeView {
  const spec = EQUIPMENT[id]
  const level = equipmentLevel(state, id)
  const next = withEquipmentLevel(state, id)
  const name = stageName(spec.names, level)
  return {
    key: `equipment:${id}`, section: spec.section, category: spec.category, equipmentId: id, name,
    facts: [stageFact(level + 1), ...spec.facts(state, next)],
    stage: level + 1, cost: equipmentUpgradeCost(state, id), available: true,
    accent: spec.accent, spriteFamily: spec.spriteFamily, spriteLevel: level,
  }
}

export function getSlotUpgrades(state: GameState, section: SectionId): UpgradeView[] {
  const group = SECTION_SLOT_GROUP[section]
  const levels = group === 'miners' ? state.minerLevels : group === 'transporters' ? state.transporterLevels : state.guardLevels
  return levels.map((level, rawIndex) => {
    const index = rawIndex as SlotIndex
    const next = withSlotLevel(state, group, index)
    const name = slotStageName(group, level)

    // Alle Attribute der Einheit, jeweils vorher und nachher: erst was sie leistet, dann in
    // welchem Takt. Beides gehört ausschließlich dieser Einheit — die Zeilen stehen deshalb
    // still, wenn nebenan gekauft wird. Die Menge je Takt steht nicht zusätzlich dabei: Sie ist
    // das Produkt der beiden Zeilen und wäre nur eine dritte Schreibweise derselben Sache.
    const empty = level === 0
    const slotFacts: UpgradeFact[] = [stageFact(level)]
    if (group === 'miners') {
      // Der Sekundentakt ist bei Bergleuten fest, deshalb steht hier nur die Menge — sie ist bei
      // einem Takt von einer Sekunde zugleich die Rate.
      slotFacts.push(fact('Fördermenge', empty ? null : minerRate(level), minerRate(level + 1), effectValue))
    } else if (group === 'transporters') {
      slotFacts.push(
        fact('Ladung', empty ? null : transporterCapacity(level), transporterCapacity(level + 1), effectGold),
        fact('Dauer', empty ? null : transporterTripSeconds(level), transporterTripSeconds(level + 1), effectRate),
      )
    } else {
      // Sichtweite, Dauer und Kraft: was eine Sicherung abträgt, wie lange die Wache bis zur
      // nächsten braucht und was sie beiträgt, wenn es doch knallt. Alle drei sind Eigenschaften
      // der Wache selbst; die Dauerleistung ist der Quotient der ersten beiden und stünde doppelt
      // da. Die Kraft steht zuletzt, weil sie als einzige erst als Summe des Trupps wirkt.
      slotFacts.push(
        fact('Sichtweite', empty ? null : guardSight(level), guardSight(level + 1), effectValue),
        fact('Dauer', empty ? null : guardInterval(level), guardInterval(level + 1), effectRate),
        fact('Kraft', empty ? null : guardMight(level), guardMight(level + 1), effectValue),
      )
    }

    return {
      key: `slot:${group}:${index}`,
      section: SLOT_SECTION[group],
      category: group,
      slot: { group, index },
      name,
      stage: level,
      facts: slotFacts,
      cost: slotUpgradeCost(state, group, index),
      available: true,
      accent: SLOT_ACCENT[group],
      spriteFamily: SLOT_SPRITE[group],
      spriteLevel: slotVisualLevel(group, level),
    }
  })
}

export const UPGRADE_CATEGORIES: readonly UpgradeCategory[] = ['equipment', 'miners', 'transporters', 'guards']
export const UPGRADE_FILTERS: readonly UpgradeFilter[] = UPGRADE_CATEGORIES

/** Der Reiter, den der Dock-Button öffnet. Es gibt keinen Sammelreiter mehr, der als neutraler
    Einstieg dienen könnte, also braucht das Sheet einen benannten — und das ist der erste. */
export const DEFAULT_UPGRADE_FILTER: UpgradeFilter = 'equipment'

/** Die Beschriftung der Reiter. Drei von ihnen heißen wie die Abschnitte der Szene, denn sie
    zeigen genau das, was dort steht: die Truhe mit ihren Wachen, das Lager mit seinen Fuhrknechten,
    die Mine mit ihren Bergleuten. Vorher waren sie nach den Angestellten benannt — dann führte ein
    Tap auf die Truhe zu einem Reiter „Wachen“, und der Behälter, den man angetippt hatte, lag
    unter „Ausrüstung“ woanders. Der vierte Reiter trägt weiterhin, was der Spieler am Körper hat. */
export const UPGRADE_FILTER_LABEL: Record<UpgradeFilter, string> = {
  equipment: 'Ausrüstung',
  miners: 'Mine',
  transporters: 'Lager',
  guards: 'Truhe',
}

/** Die Überschrift über einem Block von Karten. Sie ist bewusst nicht die Reiter-Beschriftung:
    Der Reiter nennt den Ort, die Überschrift nennt, was in diesem Block steht — unter „Lager“
    stehen erst das Lager selbst und darunter seine Fuhrknechte. */
const SLOT_GROUP_LABEL: Record<SlotGroup, string> = {
  miners: 'Bergleute',
  transporters: 'Fuhrknechte',
  guards: 'Wachen',
}

/** Die Ausrüstungsstücke eines Reiters, in ihrer Reihenfolge. Die vier Stücke am Körper des
    Spielers bleiben zusammen; Lager und Truhe stehen bei ihrem eigenen Abschnitt, weil dorthin
    zeigt, wer sie in der Szene antippt. */
const CATEGORY_EQUIPMENT: Record<UpgradeCategory, readonly EquipmentUpgradeId[]> = {
  equipment: ['tap', 'pack', 'boots', 'lamp'],
  miners: [],
  transporters: ['stock'],
  guards: ['vault'],
}

export const SECTION_FILTER: Record<SectionId, UpgradeCategory> = SECTION_SLOT_GROUP

/** Der Behälter zuerst, dann seine Angestellten — dieselbe Leserichtung wie in der Szene, wo links
    der Ort steht und rechts die Leute, die dort arbeiten. */
export function getCategoryUpgrades(state: GameState, category: UpgradeCategory): UpgradeView[] {
  return [
    ...CATEGORY_EQUIPMENT[category].map((id) => getEquipmentUpgrade(state, id)),
    ...(category === 'equipment' ? [] : getSlotUpgrades(state, SLOT_SECTION[category])),
  ]
}

export function getAllUpgrades(state: GameState): UpgradeView[] {
  return UPGRADE_CATEGORIES.flatMap((category) => getCategoryUpgrades(state, category))
}

export interface UpgradeGroup {
  /** Eindeutig über alle Gruppen eines Reiters — ein Reiter kann zwei tragen. */
  key: string
  label: string
  /** Gilt für alle Karten der Gruppe und steht deshalb genau einmal darüber. Behälter- und
      Ausrüstungsgruppen haben keinen: Ihre Karten tun jeweils etwas anderes und erklären sich
      auf der Karte selbst. */
  hint?: string
  upgrades: UpgradeView[]
}

/** Ein Reiter zerfällt in bis zu zwei Blöcke: den Behälter des Abschnitts und seine Angestellten.
    Getrennt, weil der Hinweis nur den Angestellten gilt — stünde er über beiden, erklärte ein Satz
    über Fuhrknechte auch die Lagerkarte. */
export function getUpgradeGroups(state: GameState, filter: UpgradeFilter): UpgradeGroup[] {
  const equipment = CATEGORY_EQUIPMENT[filter].map((id) => getEquipmentUpgrade(state, id))
  if (filter === 'equipment') {
    return [{ key: 'equipment', label: UPGRADE_FILTER_LABEL.equipment, upgrades: equipment }]
  }
  return [
    ...(equipment.length > 0 ? [{ key: `container:${filter}`, label: UPGRADE_FILTER_LABEL[filter], upgrades: equipment }] : []),
    {
      key: `slots:${filter}`,
      label: SLOT_GROUP_LABEL[filter],
      hint: SLOT_GROUP_HINT[filter],
      upgrades: getSlotUpgrades(state, SLOT_SECTION[filter]),
    },
  ]
}
