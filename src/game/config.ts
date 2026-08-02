import type { GameState, UpgradeId, UpgradeView } from './types'

export const MAX_OFFLINE_SECONDS = 8 * 60 * 60

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

export const TRANSPORTS = [
  { name: 'Zu Fuß', upgrade: 'Packpferd', duration: 12, capacity: 20, icon: 'courier' },
  { name: 'Packpferd', upgrade: 'Schatzkarren', duration: 9, capacity: 24, icon: 'horse' },
  { name: 'Schatzkarren', upgrade: 'Königliche Kutsche', duration: 6, capacity: 48, icon: 'cart' },
  { name: 'Königliche Kutsche', upgrade: null, duration: 4, capacity: 100, icon: 'carriage' },
] as const

export const SECURITY = [
  { name: 'Eisenschloss', next: 'Wachhund', factor: 1, loss: 0.3 },
  { name: 'Wachhund', next: 'Wachturm', factor: 1.8, loss: 0.24 },
  { name: 'Wachturm', next: 'Königsgarde', factor: 3, loss: 0.18 },
  { name: 'Königsgarde', next: 'Schatzfestung', factor: 5, loss: 0.12 },
  { name: 'Schatzfestung', next: null, factor: 8, loss: 0.08 },
] as const

export const tapValue = (state: GameState) => 1 * 1.42 ** state.tapLevel
export const passiveRate = (state: GameState) => state.staffLevel === 0 ? 0 : 0.65 * 1.5 ** (state.staffLevel - 1)
export const chestCapacity = (state: GameState) => 50 * 1.55 ** state.chestLevel
export const vaultCapacity = (state: GameState) => 500 * 2.4 ** state.vaultLevel
export const convoySize = (state: GameState) => 1 + state.convoyLevel
export const cargoCapacity = (state: GameState) => {
  const base = TRANSPORTS[state.transportLevel].capacity
  return base * 1.65 ** state.cargoLevel * convoySize(state)
}
export const transportDuration = (state: GameState) => TRANSPORTS[state.transportLevel].duration
export const expressDuration = (state: GameState) => Math.max(2, transportDuration(state) * 0.6)
export const transportName = (state: GameState) => TRANSPORTS[state.transportLevel].name

const effectValue = (value: number) => Math.floor(value).toLocaleString('de-DE')
const effectRate = (value: number) => value.toLocaleString('de-DE', { maximumFractionDigits: 1 })
const visualStage = (level: number) => Math.min(3, level)

const cost = (base: number, factor: number, level: number) => Math.ceil(base * factor ** level)

export function upgradeCost(state: GameState, id: UpgradeId): number {
  switch (id) {
    case 'tap': return cost(12, 1.58, state.tapLevel)
    case 'staff': return cost(75, 1.72, state.staffLevel)
    case 'chest': return cost(45, 1.62, state.chestLevel)
    case 'transport': return [35, 110, 360][state.transportLevel] ?? Number.POSITIVE_INFINITY
    case 'courier': return state.courierUnlocked ? Number.POSITIVE_INFINITY : 240
    case 'cargo': return cost(320, 1.78, state.cargoLevel)
    case 'convoy': return cost(1_600, 2.2, state.convoyLevel)
    case 'vault': return cost(300, 1.85, state.vaultLevel)
    case 'security': return cost(180, 2.05, state.securityLevel)
  }
}

export function getUpgrades(state: GameState): UpgradeView[] {
  const transportMaxed = state.transportLevel >= TRANSPORTS.length - 1
  const securityMaxed = state.securityLevel >= SECURITY.length - 1
  const nextTransport = TRANSPORTS[state.transportLevel].upgrade
  const nextSecurity = SECURITY[state.securityLevel].next

  return [
    {
      id: 'tap', name: visualStage(state.tapLevel) < PICKAXES.length - 1 ? PICKAXES[visualStage(state.tapLevel) + 1] : 'Pickhacke verzaubern',
      description: `Jeder Schlag löst danach ${Math.ceil(tapValue(state) * 1.42)} Gold aus dem Fels.`,
      level: PICKAXES[visualStage(state.tapLevel)], cost: upgradeCost(state, 'tap'), available: true, accent: 'business',
      currentEffect: `+${Math.ceil(tapValue(state))}`,
      nextEffect: `+${Math.ceil(tapValue({ ...state, tapLevel: state.tapLevel + 1 }))}`,
      category: 'production',
    },
    {
      id: 'staff', name: state.staffLevel ? 'Bergleute anheuern' : 'Ersten Bergmann anheuern',
      description: `Deine Mine fördert dann ${passiveRate({ ...state, staffLevel: state.staffLevel + 1 }).toFixed(1)} Gold/s.`,
      level: state.staffLevel ? `${state.staffLevel} Bergleute` : 'Du schürfst allein', cost: upgradeCost(state, 'staff'), available: true, accent: 'business',
      currentEffect: `${effectRate(passiveRate(state))}/s`,
      nextEffect: `${effectRate(passiveRate({ ...state, staffLevel: state.staffLevel + 1 }))}/s`,
      category: 'production',
    },
    {
      id: 'chest', name: visualStage(state.chestLevel) < BAGS.length - 1 ? BAGS[visualStage(state.chestLevel) + 1] : 'Goldsack verstärken',
      description: `Mehr frisch geschürftes Gold vor der nächsten Reise sammeln.`,
      level: BAGS[visualStage(state.chestLevel)], cost: upgradeCost(state, 'chest'), available: true, accent: 'logistics',
      currentEffect: effectValue(chestCapacity(state)),
      nextEffect: effectValue(chestCapacity({ ...state, chestLevel: state.chestLevel + 1 })),
      category: 'storage',
    },
    {
      id: 'transport', name: nextTransport ?? 'Transport ausgereizt',
      description: transportMaxed ? 'Die königliche Kutsche ist der schnellste Goldtransport.' : 'Kürzere Reise, größere Ladung und weniger Ausfallzeit.',
      level: transportName(state), cost: upgradeCost(state, 'transport'), available: !transportMaxed, maxed: transportMaxed, accent: 'logistics',
      currentEffect: `${TRANSPORTS[state.transportLevel].duration} Sek. · ${effectValue(TRANSPORTS[state.transportLevel].capacity)} Gold`,
      nextEffect: transportMaxed ? 'Maximal' : `${TRANSPORTS[state.transportLevel + 1].duration} Sek. · ${effectValue(TRANSPORTS[state.transportLevel + 1].capacity)} Gold`,
      category: 'transport',
    },
    {
      id: 'courier', name: state.courierUnlocked ? 'Fuhrknecht angeheuert' : 'Fuhrknecht anheuern',
      description: state.courierUnlocked ? 'Reisen starten automatisch. Du kannst in der Mine weiterschürfen.' : 'Automatisiert den Transport und beendet die Abbaupause.',
      level: state.courierUnlocked ? 'Automatisiert' : 'Du reist selbst', cost: upgradeCost(state, 'courier'), available: !state.courierUnlocked, maxed: state.courierUnlocked, accent: 'logistics',
      currentEffect: state.courierUnlocked ? 'Automatisch' : 'Manuell',
      nextEffect: state.courierUnlocked ? 'Maximal' : 'Automatisch',
      category: 'transport',
    },
    {
      id: 'cargo', name: 'Mehr Laderaum',
      description: 'Größere Satteltaschen und Wagen erhöhen die Ladung um 65 %.',
      level: `Ladung ${Math.floor(cargoCapacity(state))}`, cost: upgradeCost(state, 'cargo'), available: state.courierUnlocked, accent: 'logistics',
      currentEffect: effectValue(cargoCapacity(state)),
      nextEffect: effectValue(cargoCapacity({ ...state, cargoLevel: state.cargoLevel + 1 })),
      category: 'transport',
    },
    {
      id: 'convoy', name: 'Weiteres Gespann',
      description: 'Ein zusätzliches Gespann schließt sich deinem Goldzug an.',
      level: `${convoySize(state)} Gespann${convoySize(state) === 1 ? '' : 'e'}`, cost: upgradeCost(state, 'convoy'), available: state.courierUnlocked, accent: 'logistics',
      currentEffect: `${convoySize(state)} Gespann${convoySize(state) === 1 ? '' : 'e'}`,
      nextEffect: `${convoySize({ ...state, convoyLevel: state.convoyLevel + 1 })} Gespanne`,
      category: 'transport',
    },
    {
      id: 'vault', name: visualStage(state.vaultLevel) < TREASURE_CHESTS.length - 1 ? TREASURE_CHESTS[visualStage(state.vaultLevel) + 1] : 'Juwelentruhe erweitern',
      description: `Sicheres Schatzlager auf ${Math.floor(vaultCapacity({ ...state, vaultLevel: state.vaultLevel + 1 }))} Gold erhöhen.`,
      level: TREASURE_CHESTS[visualStage(state.vaultLevel)], cost: upgradeCost(state, 'vault'), available: true, accent: 'vault',
      currentEffect: effectValue(vaultCapacity(state)),
      nextEffect: effectValue(vaultCapacity({ ...state, vaultLevel: state.vaultLevel + 1 })),
      category: 'storage',
    },
    {
      id: 'security', name: nextSecurity ?? 'Maximale Sicherheit',
      description: securityMaxed ? 'Dein Schatz ist durch eine ganze Festung geschützt.' : 'Diebeszüge werden seltener und richten weniger Schaden an.',
      level: SECURITY[state.securityLevel].name, cost: upgradeCost(state, 'security'), available: !securityMaxed, maxed: securityMaxed, accent: 'vault',
      currentEffect: `${Math.round(SECURITY[state.securityLevel].loss * 100)} % Verlust`,
      nextEffect: securityMaxed ? 'Maximal' : `${Math.round(SECURITY[state.securityLevel + 1].loss * 100)} % Verlust`,
      category: 'security',
    },
  ]
}
