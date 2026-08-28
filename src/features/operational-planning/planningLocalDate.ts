export type PlanningLocalDay = {
  date: string
  weekday: number
}

function localTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function getPlanningLocalDay(
  instant: Date = new Date(),
  timeZone: string = localTimeZone(),
): PlanningLocalDay {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(instant)
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || ''
  const weekdays: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }

  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    weekday: weekdays[value('weekday')],
  }
}
