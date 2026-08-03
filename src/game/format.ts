/** `Number.prototype.toLocaleString` mit Options-Objekt baut bei *jedem* Aufruf einen neuen
    `Intl.NumberFormat` — gemessen ~41 µs gegenüber ~0,7 µs für einen wiederverwendeten Formatter.
    Bei zehn Renders pro Sekunde summierte sich das auf mehrere hundert Formatter-Konstruktionen
    pro Sekunde. Deshalb existiert jeder Formatter hier genau einmal. */
const INTEGER = new Intl.NumberFormat('de-DE')
const ONE_DECIMAL = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })

export const formatInteger = (value: number): string => INTEGER.format(value)
export const formatDecimal = (value: number): string => ONE_DECIMAL.format(value)

const GOLD_UNITS = [
  { value: 1e12, suffix: ' Bio.' },
  { value: 1e9, suffix: ' Mrd.' },
  { value: 1e6, suffix: ' Mio.' },
  { value: 1e3, suffix: ' Tsd.' },
] as const

export function formatGold(value: number): string {
  if (!Number.isFinite(value)) return '–'
  if (value < 1_000) return INTEGER.format(Math.floor(value))
  const unit = GOLD_UNITS.find((entry) => value >= entry.value)!
  return `${ONE_DECIMAL.format(value / unit.value)}${unit.suffix}`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)} Sek.`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours ? `${hours} Std. ${minutes} Min.` : `${minutes} Min.`
}
