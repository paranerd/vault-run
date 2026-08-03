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

export const PICKAXES = [
  'Rostige Pickhacke',
  'Eiserne Pickhacke',
  'Stählerne Pickhacke',
  'Goldene Pickhacke',
] as const

export const BAGS = [
  'Alter Lederbeutel',
  'Verstärkter Goldbeutel',
  'Großer Bergmannssack',
  'Königlicher Goldsack',
] as const

export const TREASURE_CHESTS = [
  'Einfache Holzkiste',
  'Eisenbeschlagene Truhe',
  'Vergoldete Prunktruhe',
  'Ultimative Juwelentruhe',
] as const

export const SECTION_SLOT_GROUP: Record<SectionId, SlotGroup> = {
  mine: 'miners',
  bag: 'transporters',
  chest: 'guards',
}

export const SECTION_LABEL: Record<SectionId, string> = {
  mine: 'Mine',
  bag: 'Beutel',
  chest: 'Truhe',
}

/** Sprechende Stufennamen, parallel zu den Sprite-Stufen; darüber hinaus gilt der letzte Name. */
const SLOT_STAGE_NAMES: Record<SlotGroup, readonly string[]> = {
  miners: ['Tagelöhner', 'Grubenknappe', 'Steinbrecher', 'Erzmeister'],
  transporters: ['Läufer', 'Packpferd', 'Schatzkarren', 'Königskutsche'],
  guards: ['Eisenschloss', 'Wachhund', 'Wachturm', 'Königsgarde', 'Schatzfestung'],
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
  guards: 'Jede Wache trägt in ihrem eigenen Takt Risiko ab. Jede Stufe senkt zusätzlich den Verlust bei einem Diebeszug um 14 %.',
}

export function slotStageName(group: SlotGroup, level: number): string {
  if (level <= 0) return SLOT_EMPTY_NAME[group]
  const names = SLOT_STAGE_NAMES[group]
  return names[Math.min(names.length - 1, level - 1)]
}

const SLOT_SECTION: Record<SlotGroup, SectionId> = {
  miners: 'mine',
  transporters: 'bag',
  guards: 'chest',
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
const visualStage = (level: number) => Math.min(3, Math.max(0, level))
const effectValue = (value: number) => formatInteger(Math.floor(value))
const effectRate = (value: number) => formatDecimal(value)
/** Beiträge zu einer Summe tragen ihr Vorzeichen: Was hier steht, kommt zum Gesamtwert hinzu.
    Eine Wache trägt umgekehrt ab — sie senkt das Risiko und schreibt deshalb ein Minus. */
const signedRate = (value: number) => `+${formatDecimal(value)}`
const loweringRate = (value: number) => `-${formatDecimal(value)}`
const totalLevels = (levels: SlotLevels) => levels.reduce((total, level) => total + level, 0)

export const slotVisualLevel = (group: SlotGroup, level: number) => {
  return Math.max(0, level - 1)
}

export const tapValue = (state: GameState) => Math.ceil(1.42 ** state.tapLevel)
export const chestCapacity = (state: GameState) => 50 * 1.55 ** state.chestLevel
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

/** Was der Spieler selbst auf dem Rücken zur Truhe trägt, und wie lange er dafür braucht. Eine
    eigene Größe neben den Fuhrknechten, so wie der eigene Schlag neben den Bergleuten steht. */
export const MANUAL_CARGO = 20
export const MANUAL_TRIP_SECONDS = 12

// --- Bergleute: eine Förderung je Sekunde, die Stufe bestimmt allein die Menge ---
/** Bergleute arbeiten immer im Sekundentakt. Damit ist ihre Fördermenge zugleich ihre Rate, und
    die Karte braucht keine Taktzeile — das `/s` an der Menge sagt bereits alles. */
export const minerInterval = (_level: number) => MIN_CYCLE_SECONDS
/** Unverändert gegenüber dem stufenlosen Modell — die Rate ist dieselbe, sie kommt jetzt nur in
    Portionen statt als kontinuierlicher Strom. */
export const minerRate = (level: number) => level === 0 ? 0 : 0.65 * 1.5 ** (level - 1)
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

export const guardStrength = (state: GameState) => totalLevels(state.guardLevels)

/** Anteil der Schatztruhe, den ein Diebeszug mitnimmt. Deutlich kleiner als der frühere
    Beutel-Anteil: Bezugsgröße ist jetzt das gesamte Vermögen, nicht der Inhalt einer Tasche. */
export const securityLoss = (state: GameState) => Math.max(0.015, 0.08 * 0.86 ** guardStrength(state))

/** Ab hier färbt sich die Risikokachel; ab `RISK_ALERT` pulsiert zusätzlich die Sicherung. */
export const RISK_WARNING = 50
export const RISK_ALERT = 80

/** Wie stark der Anstieg je Truhenstufe zulegt. Ohne diesen Faktor stand ein fester Deckel von
    1,05 %/s gegen Wachen, die unbegrenzt weiterwachsen — drei billigste Wachen für 450 Gold
    stellten das Risiko dauerhaft auf null, und mit ihm den ganzen Diebstahl-Teil des Spiels.
    Eine Konstante gegen eine unbegrenzte Gegenkraft kann nur einmal ausgehen. */
export const RISK_PER_VAULT_LEVEL = 0.25

/** Risiko-Zuwachs pro Sekunde. Wächst nur, solange etwas in der Schatztruhe liegt, und hängt am
    Füllstand — die Diebe zielen auf den Hort, nicht auf den Beutel. Dazu wächst er mit der Größe
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

/** Eine manuelle Sicherung nimmt ein Viertel der vollen Risikoskala. */
export const MANUAL_SECURE_AMOUNT = 25
export const SECURE_COOLDOWN_MS = 1_500

export const activeGuards = (state: GameState) => state.guardLevels.filter((level) => level > 0).length
export const hasAutomaticSecurity = (state: GameState) => activeGuards(state) > 0

// --- Wachen: Risikopunkte je Sicherung, Takt zwischen zwei Sicherungen ---
/** Punkte, die **diese** Wache je Sicherung abträgt — kein Trupp-Wert mehr. Der frühere Sockel von
    6 Punkten gehörte dem Trupp als Ganzem; je Wache gezählt hätte er sich mit jedem Posten
    vervielfacht. Er steckt deshalb kleiner in jeder einzelnen Wache. */
export const guardPower = (level: number) => level === 0 ? 0 : 4 + 2 * level
export const guardInterval = (level: number) => Math.max(MIN_CYCLE_SECONDS, 12 / (1 + (level - 1) * 0.35))
export const guardRate = (level: number) => level === 0 ? 0 : guardPower(level) / guardInterval(level)

/** Summe aller Wachen in Risikopunkten pro Sekunde — dieselbe Einheit wie `riskGrowth`, damit
    Kachel und Wachen-Karte direkt gegeneinander lesbar sind. */
export const securingRate = (state: GameState) =>
  state.guardLevels.reduce((total, level) => total + guardRate(level), 0)

export function equipmentUpgradeCost(state: GameState, id: EquipmentUpgradeId): number {
  switch (id) {
    case 'tap': return cost(12, 1.58, state.tapLevel)
    case 'chest': return cost(45, 1.62, state.chestLevel)
    case 'vault': return cost(300, 1.85, state.vaultLevel)
  }
}

export function slotUpgradeCost(state: GameState, group: SlotGroup, index: SlotIndex): number {
  const bases: Record<SlotGroup, number> = { miners: 75, transporters: 180, guards: 150 }
  const factors: Record<SlotGroup, number> = { miners: 1.72, transporters: 1.78, guards: 1.8 }
  const levels = group === 'miners' ? state.minerLevels : group === 'transporters' ? state.transporterLevels : state.guardLevels
  return cost(bases[group], factors[group], levels[index])
}

function withEquipmentLevel(state: GameState, id: EquipmentUpgradeId): GameState {
  if (id === 'tap') return { ...state, tapLevel: state.tapLevel + 1 }
  if (id === 'chest') return { ...state, chestLevel: state.chestLevel + 1 }
  return { ...state, vaultLevel: state.vaultLevel + 1 }
}

export function withSlotLevel(state: GameState, group: SlotGroup, index: SlotIndex): GameState {
  const key = group === 'miners' ? 'minerLevels' : group === 'transporters' ? 'transporterLevels' : 'guardLevels'
  const levels = [...state[key]] as SlotLevels
  levels[index] += 1
  return { ...state, [key]: levels }
}

/** Der Name der nächsten Stufe, aber nur, wenn er sich überhaupt ändert. Oberhalb der letzten
    benannten Stufe wiederholt er sich sonst und wäre als „Vorteil“ eine Falschaussage. */
const changedName = (current: string, next: string) => (next === current ? undefined : next)

/** Die Stufenzeile, mit der jede Karte beginnt. Ihr Name ist der Rang nach dem Kauf — und bleibt
    leer, sobald die Einheit über der letzten benannten Stufe steht und ihren Rang behält. */
const stageFact = (stage: number, nextName?: string): UpgradeFact =>
  ({ from: `Stufe ${stage}`, to: `Stufe ${stage + 1}`, label: nextName ?? '' })

/** Eine Attributzeile: derselbe Wert vor und nach dem Kauf. Die Einheit hängt nur am Nachher-Wert
    — zweimal dieselbe Einheit trägt nichts bei und kostet die Breite, die der Attributname braucht.
    Ein Slot, der noch unbesetzt ist, hat keinen Vorher-Wert; dort steht ein Strich statt einer
    erfundenen Null. */
function fact(label: string, before: number | null, after: number, unit: string, format: (value: number) => string): UpgradeFact {
  return { from: before === null ? '–' : format(before), to: `${format(after)}${unit}`, label }
}

export function getEquipmentUpgrade(state: GameState, section: SectionId): UpgradeView {
  if (section === 'mine') {
    const next = withEquipmentLevel(state, 'tap')
    const name = PICKAXES[visualStage(state.tapLevel)]
    return {
      key: 'equipment:tap', section, equipmentId: 'tap', name,
      nextName: changedName(name, PICKAXES[visualStage(state.tapLevel + 1)]),
      hint: 'Wirkt nur, wenn du selbst in der Mine klickst.',
      facts: [
        stageFact(state.tapLevel + 1, changedName(name, PICKAXES[visualStage(state.tapLevel + 1)])),
        fact('je Schlag', tapValue(state), tapValue(next), ' Gold', effectValue),
      ],
      stage: state.tapLevel + 1, cost: equipmentUpgradeCost(state, 'tap'), available: true, accent: 'business',
      spriteFamily: 'pickaxe', spriteLevel: state.tapLevel,
    }
  }
  if (section === 'bag') {
    const next = withEquipmentLevel(state, 'chest')
    const name = BAGS[visualStage(state.chestLevel)]
    return {
      key: 'equipment:chest', section, equipmentId: 'chest', name,
      nextName: changedName(name, BAGS[visualStage(state.chestLevel + 1)]),
      hint: 'Ist der Beutel voll, ruht die Mine bis zur nächsten Fuhre.',
      facts: [
        stageFact(state.chestLevel + 1, changedName(name, BAGS[visualStage(state.chestLevel + 1)])),
        fact('Platz', chestCapacity(state), chestCapacity(next), ' Gold', effectGold),
      ],
      stage: state.chestLevel + 1, cost: equipmentUpgradeCost(state, 'chest'), available: true, accent: 'logistics',
      spriteFamily: 'bag', spriteLevel: state.chestLevel,
    }
  }
  const next = withEquipmentLevel(state, 'vault')
  const name = TREASURE_CHESTS[visualStage(state.vaultLevel)]
  return {
    key: 'equipment:vault', section, equipmentId: 'vault', name,
    nextName: changedName(name, TREASURE_CHESTS[visualStage(state.vaultLevel + 1)]),
    hint: 'Ist die Truhe voll, bleiben die Fuhren stehen.',
    facts: [
      stageFact(state.vaultLevel + 1, changedName(name, TREASURE_CHESTS[visualStage(state.vaultLevel + 1)])),
      fact('Platz', vaultCapacity(state), vaultCapacity(next), ' Gold', effectGold),
    ],
    stage: state.vaultLevel + 1, cost: equipmentUpgradeCost(state, 'vault'), available: true, accent: 'vault',
    spriteFamily: 'chest', spriteLevel: state.vaultLevel,
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
    const slotFacts: UpgradeFact[] = [stageFact(level, changedName(name, slotStageName(group, level + 1)))]
    if (group === 'miners') {
      // Der Sekundentakt ist bei Bergleuten fest, deshalb steht hier nur die Menge — mit `/s`,
      // weil Menge und Rate bei einem Takt von einer Sekunde dasselbe sind.
      slotFacts.push(fact('Förderung', empty ? null : minerRate(level), minerRate(level + 1), '/s', signedRate))
    } else if (group === 'transporters') {
      slotFacts.push(
        fact('Ladung', empty ? null : transporterCapacity(level), transporterCapacity(level + 1), '', effectGold),
        fact('Dauer', empty ? null : transporterTripSeconds(level), transporterTripSeconds(level + 1), ' s', effectRate),
      )
    } else {
      // „x % alle y s“: was eine Sicherung abträgt und wie oft sie stattfindet. Beides sind die
      // Eigenschaften der Wache selbst; die Dauerleistung ist ihr Quotient und stünde doppelt da.
      slotFacts.push(
        fact('Risiko', empty ? null : guardPower(level), guardPower(level + 1), ' %', loweringRate),
        fact('Takt', empty ? null : guardInterval(level), guardInterval(level + 1), ' s', effectRate),
      )
    }

    return {
      key: `slot:${group}:${index}`,
      section: SLOT_SECTION[group],
      slot: { group, index },
      name,
      nextName: changedName(name, slotStageName(group, level + 1)),
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

export function getAllUpgrades(state: GameState): UpgradeView[] {
  const sections: SectionId[] = ['mine', 'bag', 'chest']
  return sections.flatMap((section) => [getEquipmentUpgrade(state, section), ...getSlotUpgrades(state, section)])
}

export const UPGRADE_CATEGORIES: readonly UpgradeCategory[] = ['equipment', 'miners', 'transporters', 'guards']
export const UPGRADE_FILTERS: readonly UpgradeFilter[] = ['all', ...UPGRADE_CATEGORIES]

export const UPGRADE_FILTER_LABEL: Record<UpgradeFilter, string> = {
  all: 'Alle',
  equipment: 'Ausrüstung',
  miners: 'Bergleute',
  transporters: 'Transport',
  guards: 'Wachen',
}

/** Prefix of every `UpgradeView.key` that belongs to a filter; `all` matches everything. */
export const UPGRADE_FILTER_PREFIX: Record<UpgradeFilter, string> = {
  all: '',
  equipment: 'equipment:',
  miners: 'slot:miners:',
  transporters: 'slot:transporters:',
  guards: 'slot:guards:',
}

export const SECTION_FILTER: Record<SectionId, UpgradeCategory> = SECTION_SLOT_GROUP

export function getCategoryUpgrades(state: GameState, category: UpgradeCategory): UpgradeView[] {
  if (category === 'equipment') return [getEquipmentUpgrade(state, 'mine'), getEquipmentUpgrade(state, 'bag'), getEquipmentUpgrade(state, 'chest')]
  return getSlotUpgrades(state, SLOT_SECTION[category])
}

export interface UpgradeGroup {
  category: UpgradeCategory
  label: string
  /** Gilt für alle Karten der Gruppe und steht deshalb genau einmal darüber. Die Ausrüstung hat
      keinen: Ihre drei Karten tun jeweils etwas anderes und erklären sich auf der Karte selbst. */
  hint?: string
  upgrades: UpgradeView[]
}

export function getUpgradeGroups(state: GameState, filter: UpgradeFilter): UpgradeGroup[] {
  const categories = filter === 'all' ? UPGRADE_CATEGORIES : [filter]
  return categories.map((category) => ({
    category,
    label: UPGRADE_FILTER_LABEL[category],
    hint: category === 'equipment' ? undefined : SLOT_GROUP_HINT[category],
    upgrades: getCategoryUpgrades(state, category),
  }))
}
