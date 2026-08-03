import { formatDecimal, formatFixedDecimal, formatInteger } from './format'
import type {
  EquipmentUpgradeId,
  GameState,
  SectionId,
  SlotGroup,
  SlotIndex,
  SlotLevels,
  UpgradeCategory,
  UpgradeEffect,
  UpgradeFilter,
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

/** Was eine Gruppe grundsätzlich tut. Steht einmal über den vier Karten, weil er für alle vier
    identisch gilt — auf den Karten selbst stand derselbe Satz bisher viermal untereinander. */
const SLOT_GROUP_HINT: Record<SlotGroup, string> = {
  miners: 'Bergleute schürfen ohne Klicks. Jeder Stollen zählt für sich und fördert gleichzeitig mit den anderen.',
  transporters: 'Fuhrknechte bringen das Gold von allein zur Truhe: größere Fuhren in kürzerem Takt.',
  guards: 'Wachen senken das Risiko laufend und drücken den Verlust, falls es doch zum Diebeszug kommt.',
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
const visualStage = (level: number) => Math.min(3, Math.max(0, level))
const effectValue = (value: number) => formatInteger(Math.floor(value))
const effectRate = (value: number) => formatDecimal(value)
const effectFixed = (value: number) => formatFixedDecimal(value)
const totalLevels = (levels: SlotLevels) => levels.reduce((total, level) => total + level, 0)

export const slotVisualLevel = (group: SlotGroup, level: number) => {
  return Math.max(0, level - 1)
}

export const tapValue = (state: GameState) => Math.ceil(1.42 ** state.tapLevel)
export const minerRate = (level: number) => level === 0 ? 0 : 0.65 * 1.5 ** (level - 1)
export const passiveRate = (state: GameState) => state.minerLevels.reduce((total, level) => total + minerRate(level), 0)
export const chestCapacity = (state: GameState) => 50 * 1.55 ** state.chestLevel
export const vaultCapacity = (state: GameState) => 500 * 2.4 ** state.vaultLevel

export const activeTransporters = (state: GameState) => state.transporterLevels.filter((level) => level > 0).length
export const hasAutomaticTransport = (state: GameState) => activeTransporters(state) > 0
export const transporterCapacity = (level: number) => level === 0 ? 0 : 12 * 1.55 ** (level - 1)
export const automaticTransportAmount = (state: GameState) => state.transporterLevels.reduce((total, level) => total + transporterCapacity(level), 0)
export const cargoCapacity = (state: GameState) => Math.max(20, automaticTransportAmount(state))
export const transportDuration = (state: GameState) => {
  const active = activeTransporters(state)
  if (active === 0) return 12
  const experience = totalLevels(state.transporterLevels) - active
  return Math.max(3, 12 / (1 + (active - 1) * 0.18 + experience * 0.12))
}
export const expressDuration = (state: GameState) => Math.max(2, transportDuration(state) * 0.6)

/** Dauerdurchsatz der automatischen Fuhren. `cargoCapacity` hat einen Boden von 20, ein
    einzelner Fuhrknecht schleppt also mehr als seine nominelle Kapazität. */
export const automaticTransportRate = (state: GameState) =>
  hasAutomaticTransport(state) ? cargoCapacity(state) / transportDuration(state) : 0

export const guardStrength = (state: GameState) => totalLevels(state.guardLevels)

/** Anteil der Schatztruhe, den ein Diebeszug mitnimmt. Deutlich kleiner als der frühere
    Beutel-Anteil: Bezugsgröße ist jetzt das gesamte Vermögen, nicht der Inhalt einer Tasche. */
export const securityLoss = (state: GameState) => Math.max(0.015, 0.08 * 0.86 ** guardStrength(state))

/** Ab hier färbt sich die Risikokachel; ab `RISK_ALERT` pulsiert zusätzlich die Sicherung. */
export const RISK_WARNING = 50
export const RISK_ALERT = 80

/** Risiko-Zuwachs pro Sekunde. Wächst nur, solange etwas in der Schatztruhe liegt, und hängt
    allein an deren Füllstand — die Diebe zielen auf den Hort, nicht auf den Beutel. Die Wachen
    greifen über ihre Sicherungen ein, nicht bremsend, sonst zählten sie doppelt. */
export const riskGrowth = (state: GameState) => {
  if (state.vaultGold <= 0) return 0
  const fill = Math.min(1, state.vaultGold / vaultCapacity(state))
  return 0.3 + 0.75 * fill
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

/** Takt der automatischen Sicherung: mehr Wachen kürzen ihn, höhere Stufen zusätzlich. */
export const securingInterval = (state: GameState) => {
  const active = activeGuards(state)
  if (active === 0) return 0
  const experience = guardStrength(state) - active
  return Math.max(3, 12 / (1 + (active - 1) * 0.2 + experience * 0.12))
}

/** Risikopunkte, die eine automatische Sicherung abträgt. */
export const securingPower = (state: GameState) => hasAutomaticSecurity(state) ? 6 + 2 * guardStrength(state) : 0

/** Dauerleistung des Trupps in Risikopunkten pro Sekunde — dieselbe Einheit wie `riskGrowth`,
    damit Kachel und Wachen-Karte direkt gegeneinander lesbar sind. */
export const securingRate = (state: GameState) =>
  hasAutomaticSecurity(state) ? securingPower(state) / securingInterval(state) : 0

export const threatReductionPerClick = (_state: GameState) => MANUAL_SECURE_AMOUNT

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

export function getEquipmentUpgrade(state: GameState, section: SectionId): UpgradeView {
  if (section === 'mine') {
    const next = withEquipmentLevel(state, 'tap')
    const name = PICKAXES[visualStage(state.tapLevel)]
    return {
      key: 'equipment:tap', section, equipmentId: 'tap', name,
      nextName: changedName(name, PICKAXES[visualStage(state.tapLevel + 1)]),
      hint: 'Wirkt nur, wenn du selbst in der Mine klickst.',
      effects: [{ label: 'Pro Schlag', current: effectValue(tapValue(state)), next: effectValue(tapValue(next)), unit: 'Gold' }],
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
      effects: [{ label: 'Beutelgröße', current: effectValue(chestCapacity(state)), next: effectValue(chestCapacity(next)), unit: 'Gold' }],
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
    effects: [{ label: 'Truhengröße', current: effectValue(vaultCapacity(state)), next: effectValue(vaultCapacity(next)), unit: 'Gold' }],
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
    let effects: UpgradeEffect[]

    if (group === 'miners') {
      // Erst der eigene Stollen, dann die Mine als Ganzes: Die erste Zeile beantwortet „was
      // bringt genau diese Karte“, die zweite „was habe ich danach insgesamt“.
      effects = [
        { label: 'Dieser Stollen', current: level === 0 ? 'Unbesetzt' : `${effectRate(minerRate(level))}/s`, next: `${effectRate(minerRate(level + 1))}/s` },
        { label: 'Mine gesamt', current: `${effectRate(passiveRate(state))}/s`, next: `${effectRate(passiveRate(next))}/s` },
      ]
    } else if (group === 'transporters') {
      // Ladung und Fahrzeit sind die beiden Stellschrauben, der Durchsatz ihr gemeinsames
      // Ergebnis — und exakt die Zahl, die auch auf der Beutel-Kachel steht.
      effects = [
        { label: 'Fuhre', current: effectValue(cargoCapacity(state)), next: effectValue(cargoCapacity(next)), unit: 'Gold' },
        { label: 'Fahrzeit', current: effectRate(transportDuration(state)), next: effectRate(transportDuration(next)), unit: 's' },
        {
          label: 'Transport gesamt',
          current: hasAutomaticTransport(state) ? `${effectRate(automaticTransportRate(state))}/s` : 'Nur von Hand',
          next: `${effectRate(automaticTransportRate(next))}/s`,
        },
      ]
    } else {
      // Die Dauerleistung steht vorne, weil nur sie mit dem Risikoanstieg vergleichbar ist: Takt
      // und Punkte ändern sich gleichzeitig, einzeln sagt keiner von beiden etwas aus. Genau
      // deshalb steht der Takt hier auch nicht mehr — er ist in der Rate bereits enthalten.
      // „gesamt“ ist nicht schmückend: Wachen wirken als Trupp, nicht als einzelner Posten.
      effects = [
        {
          label: 'Sicherung gesamt',
          current: securingRate(state) === 0 ? 'Ungesichert' : `-${effectFixed(securingRate(state))} %/s`,
          next: `-${effectFixed(securingRate(next))} %/s`,
        },
        { label: 'Verlust je Diebeszug', current: effectRate(securityLoss(state) * 100), next: effectRate(securityLoss(next) * 100), unit: '%' },
      ]
    }

    return {
      key: `slot:${group}:${index}`,
      section: SLOT_SECTION[group],
      slot: { group, index },
      name,
      nextName: changedName(name, slotStageName(group, level + 1)),
      stage: level,
      effects,
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
