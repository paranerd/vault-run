export function formatGold(value: number): string {
  if (!Number.isFinite(value)) return '–'
  if (value < 1_000) return Math.floor(value).toLocaleString('de-DE')
  const units = [
    { value: 1e12, suffix: ' Bio.' },
    { value: 1e9, suffix: ' Mrd.' },
    { value: 1e6, suffix: ' Mio.' },
    { value: 1e3, suffix: ' Tsd.' },
  ]
  const unit = units.find((entry) => value >= entry.value)!
  return `${(value / unit.value).toLocaleString('de-DE', { maximumFractionDigits: 1 })}${unit.suffix}`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)} Sek.`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours ? `${hours} Std. ${minutes} Min.` : `${minutes} Min.`
}
