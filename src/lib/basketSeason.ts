// BCVB sporting seasons run from 1 August through 31 July.
export function getBasketSeasonStartYear(date: Date = new Date()): number {
  return date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1
}

export function getBasketSeasonLabel(date: Date = new Date()): string {
  const start = getBasketSeasonStartYear(date)
  return `${start}-${start + 1}`
}
