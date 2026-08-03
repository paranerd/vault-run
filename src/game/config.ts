import type {
  EquipmentUpgradeId,
  GameState,
  SectionId,
  SlotGroup,
  SlotIndex,
  SlotLevels,
  UpgradeCategory,
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
const effectValue = (value: number) => Math.floor(value).toLocaleString('de-DE')
const effectRate = (value: number) => value.toLocaleString('de-DE', { maximumFractionDigits: 1 })
/** Feste Nachkommastelle: Die Wachen-Raten stehen direkt untereinander und dürfen nicht springen. */
const effectFixed = (value: number) => value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
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

export function getEquipmentUpgrade(state: GameState, section: SectionId): UpgradeView {
  if (section === 'mine') {
    const next = withEquipmentLevel(state, 'tap')
    return {
      key: 'equipment:tap', section, equipmentId: 'tap', name: PICKAXES[visualStage(state.tapLevel)],
      description: `Jeder Schlag löst danach ${Math.ceil(tapValue(next))} Gold aus dem Fels.`,
      stage: state.tapLevel + 1, cost: equipmentUpgradeCost(state, 'tap'), available: true, accent: 'business',
      currentEffect: `+${Math.ceil(tapValue(state))}`, nextEffect: `+${Math.ceil(tapValue(next))}`,
      spriteFamily: 'pickaxe', spriteLevel: state.tapLevel,
    }
  }
  if (section === 'bag') {
    const next = withEquipmentLevel(state, 'chest')
    return {
      key: 'equipment:chest', section, equipmentId: 'chest', name: BAGS[visualStage(state.chestLevel)],
      description: 'Mehr frisch geschürftes Gold bis zum nächsten Transport sammeln.',
      stage: state.chestLevel + 1, cost: equipmentUpgradeCost(state, 'chest'), available: true, accent: 'logistics',
      currentEffect: effectValue(chestCapacity(state)), nextEffect: effectValue(chestCapacity(next)),
      spriteFamily: 'bag', spriteLevel: state.chestLevel,
    }
  }
  const next = withEquipmentLevel(state, 'vault')
  return {
    key: 'equipment:vault', section, equipmentId: 'vault', name: TREASURE_CHESTS[visualStage(state.vaultLevel)],
    description: `Das sichere Schatzlager auf ${effectValue(vaultCapacity(next))} Gold erhöhen.`,
    stage: state.vaultLevel + 1, cost: equipmentUpgradeCost(state, 'vault'), available: true, accent: 'vault',
    currentEffect: effectValue(vaultCapacity(state)), nextEffect: effectValue(vaultCapacity(next)),
    spriteFamily: 'chest', spriteLevel: state.vaultLevel,
  }
}

export function getSlotUpgrades(state: GameState, section: SectionId): UpgradeView[] {
  const group = SECTION_SLOT_GROUP[section]
  const levels = group === 'miners' ? state.minerLevels : group === 'transporters' ? state.transporterLevels : state.guardLevels
  return levels.map((level, rawIndex) => {
    const index = rawIndex as SlotIndex
    const next = withSlotLevel(state, group, index)
    let currentEffect = 'Unbesetzt'
    let nextEffect = ''
    let description = ''

    if (group === 'miners') {
      currentEffect = level === 0 ? '0/s' : `${effectRate(minerRate(level))}/s`
      nextEffect = `${effectRate(minerRate(level + 1))}/s`
      description = 'Schürft selbstständig Gold und arbeitet unabhängig von den anderen Bergleuten.'
    } else if (group === 'transporters') {
      currentEffect = level === 0 ? 'Inaktiv' : `${effectValue(transporterCapacity(level))} Gold`
      nextEffect = `${effectValue(transporterCapacity(level + 1))} Gold`
      description = 'Erhöht die automatische Transportmenge und verkürzt die Zeit zwischen Fahrten.'
    } else {
      // Vorne steht die Dauerleistung, weil nur sie zwischen zwei Stufen vergleichbar ist:
      // Takt und Punkte ändern sich gleichzeitig. Der Takt selbst — das, was man tatsächlich
      // sieht — und der Schadensdeckel stehen darunter im Text.
      // „gesamt“ ist nicht schmückend: Die Karte zeigt den Trupp, nicht den Slot. Ohne das Wort
      // läse sich „Stufe 0 | -1,0 %/s“, als sichere die noch unbesetzte Ecke bereits selbst.
      currentEffect = securingRate(state) === 0 ? 'Ungesichert' : `-${effectFixed(securingRate(state))} %/s gesamt`
      nextEffect = `-${effectFixed(securingRate(next))} %/s gesamt`
      description = `Der Trupp senkt das Risiko danach alle ${effectRate(securingInterval(next))} s um ${Math.round(securingPower(next))} Punkte und drückt den Verlust bei einem Diebeszug auf ${effectRate(securityLoss(next) * 100)} %.`
    }

    return {
      key: `slot:${group}:${index}`,
      section: SLOT_SECTION[group],
      slot: { group, index },
      name: slotStageName(group, level),
      description,
      stage: level,
      currentEffect,
      nextEffect,
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
  upgrades: UpgradeView[]
}

export function getUpgradeGroups(state: GameState, filter: UpgradeFilter): UpgradeGroup[] {
  const categories = filter === 'all' ? UPGRADE_CATEGORIES : [filter]
  return categories.map((category) => ({ category, label: UPGRADE_FILTER_LABEL[category], upgrades: getCategoryUpgrades(state, category) }))
}
