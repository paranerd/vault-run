import type { GameState, UpgradeId, UpgradeView } from './types'

export const MAX_OFFLINE_SECONDS = 8 * 60 * 60

export const TRANSPORTS = [
  { name: 'Zu Fuß', upgrade: 'Bessere Schuhe', duration: 12, capacity: 20, icon: 'footprints' },
  { name: 'Mit guten Schuhen', upgrade: 'Fahrrad', duration: 9, capacity: 24, icon: 'footprints' },
  { name: 'Fahrrad', upgrade: 'Auto', duration: 6, capacity: 48, icon: 'bike' },
  { name: 'Auto', upgrade: null, duration: 4, capacity: 100, icon: 'car' },
] as const

export const SECURITY = [
  { name: 'Einfaches Schloss', next: 'Wachhund', factor: 1, loss: 0.3 },
  { name: 'Wachhund', next: 'Kameras', factor: 1.8, loss: 0.24 },
  { name: 'Kameras', next: 'Wachdienst', factor: 3, loss: 0.18 },
  { name: 'Wachdienst', next: 'Sicherheitszentrale', factor: 5, loss: 0.12 },
  { name: 'Sicherheitszentrale', next: null, factor: 8, loss: 0.08 },
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
      id: 'tap', name: 'Bessere Abschlüsse',
      description: `Jeder Tap bringt danach ${Math.ceil(tapValue(state) * 1.42)} Gold.`,
      level: `Stufe ${state.tapLevel + 1}`, cost: upgradeCost(state, 'tap'), available: true, accent: 'business',
      currentEffect: `+${Math.ceil(tapValue(state))}`,
      nextEffect: `+${Math.ceil(tapValue({ ...state, tapLevel: state.tapLevel + 1 }))}`,
      category: 'production',
    },
    {
      id: 'staff', name: state.staffLevel ? 'Team erweitern' : 'Ersten Mitarbeiter einstellen',
      description: `Passives Geschäft: ${passiveRate({ ...state, staffLevel: state.staffLevel + 1 }).toFixed(1)} Gold/s.`,
      level: state.staffLevel ? `${state.staffLevel} Mitarbeiter` : 'Noch manuell', cost: upgradeCost(state, 'staff'), available: true, accent: 'business',
      currentEffect: `${effectRate(passiveRate(state))}/s`,
      nextEffect: `${effectRate(passiveRate({ ...state, staffLevel: state.staffLevel + 1 }))}/s`,
      category: 'production',
    },
    {
      id: 'chest', name: 'Größere Geschäftstruhe',
      description: `Mehr ungesichertes Gold zwischen zwei Fahrten lagern.`,
      level: `${Math.floor(chestCapacity(state))} Kapazität`, cost: upgradeCost(state, 'chest'), available: true, accent: 'logistics',
      currentEffect: effectValue(chestCapacity(state)),
      nextEffect: effectValue(chestCapacity({ ...state, chestLevel: state.chestLevel + 1 })),
      category: 'storage',
    },
    {
      id: 'transport', name: nextTransport ?? 'Transport ausgereizt',
      description: transportMaxed ? 'Das Auto ist für diesen Standort schnell genug.' : 'Kürzere Fahrt, größere Ladung und weniger Ausfallzeit.',
      level: transportName(state), cost: upgradeCost(state, 'transport'), available: !transportMaxed, maxed: transportMaxed, accent: 'logistics',
      currentEffect: `${TRANSPORTS[state.transportLevel].duration} Sek. · ${effectValue(TRANSPORTS[state.transportLevel].capacity)} Gold`,
      nextEffect: transportMaxed ? 'Maximal' : `${TRANSPORTS[state.transportLevel + 1].duration} Sek. · ${effectValue(TRANSPORTS[state.transportLevel + 1].capacity)} Gold`,
      category: 'transport',
    },
    {
      id: 'courier', name: state.courierUnlocked ? 'Bote eingestellt' : 'Boten einstellen',
      description: state.courierUnlocked ? 'Fahrten starten automatisch. Du kannst weiter Geschäfte machen.' : 'Automatisiert den Transport und beendet die Produktionspause.',
      level: state.courierUnlocked ? 'Automatisiert' : 'Du fährst selbst', cost: upgradeCost(state, 'courier'), available: !state.courierUnlocked, maxed: state.courierUnlocked, accent: 'logistics',
      currentEffect: state.courierUnlocked ? 'Automatisch' : 'Manuell',
      nextEffect: state.courierUnlocked ? 'Maximal' : 'Automatisch',
      category: 'transport',
    },
    {
      id: 'cargo', name: 'Größerer Transporter',
      description: 'Erhöht die Ladekapazität des gesamten Konvois um 65 %.',
      level: `Ladung ${Math.floor(cargoCapacity(state))}`, cost: upgradeCost(state, 'cargo'), available: state.courierUnlocked, accent: 'logistics',
      currentEffect: effectValue(cargoCapacity(state)),
      nextEffect: effectValue(cargoCapacity({ ...state, cargoLevel: state.cargoLevel + 1 })),
      category: 'transport',
    },
    {
      id: 'convoy', name: 'Weiteres Fahrzeug',
      description: 'Ein zusätzliches Fahrzeug fährt sichtbar im gemeinsamen Konvoi.',
      level: `${convoySize(state)} Fahrzeug${convoySize(state) === 1 ? '' : 'e'}`, cost: upgradeCost(state, 'convoy'), available: state.courierUnlocked, accent: 'logistics',
      currentEffect: `${convoySize(state)} Fahrzeug${convoySize(state) === 1 ? '' : 'e'}`,
      nextEffect: `${convoySize({ ...state, convoyLevel: state.convoyLevel + 1 })} Fahrzeuge`,
      category: 'transport',
    },
    {
      id: 'vault', name: 'Tresor erweitern',
      description: `Geschütztes Vermögen auf ${Math.floor(vaultCapacity({ ...state, vaultLevel: state.vaultLevel + 1 }))} erhöhen.`,
      level: `${Math.floor(vaultCapacity(state))} Kapazität`, cost: upgradeCost(state, 'vault'), available: true, accent: 'vault',
      currentEffect: effectValue(vaultCapacity(state)),
      nextEffect: effectValue(vaultCapacity({ ...state, vaultLevel: state.vaultLevel + 1 })),
      category: 'storage',
    },
    {
      id: 'security', name: nextSecurity ?? 'Maximale Sicherheit',
      description: securityMaxed ? 'Dieser Standort ist maximal geschützt.' : 'Einbrüche werden seltener und richten weniger Schaden an.',
      level: SECURITY[state.securityLevel].name, cost: upgradeCost(state, 'security'), available: !securityMaxed, maxed: securityMaxed, accent: 'vault',
      currentEffect: `${Math.round(SECURITY[state.securityLevel].loss * 100)} % Verlust`,
      nextEffect: securityMaxed ? 'Maximal' : `${Math.round(SECURITY[state.securityLevel + 1].loss * 100)} % Verlust`,
      category: 'security',
    },
  ]
}
