export type TrendRange = '90d' | '6m' | '1y'

export const TREND_RANGES: { value: TrendRange; label: string }[] = [
  { value: '90d', label: '90 days' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
]

/** Number of days in the given 1-indexed month/year, UTC-based. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Subtracts `n` days from `from` (a YYYY-MM-DD string), returning a YYYY-MM-DD string. */
export function daysAgo(n: number, from: string = new Date().toISOString().split('T')[0]): string {
  const [year, month, day] = from.split('-').map(Number)
  const result = new Date(Date.UTC(year, month - 1, day - n))
  return result.toISOString().split('T')[0]
}

/**
 * Subtracts `n` months from `from` (a YYYY-MM-DD string), clamping to the
 * target month's last day if the source day-of-month doesn't exist there
 * (e.g. monthsAgo(1, '2026-03-31') -> '2026-02-28').
 */
export function monthsAgo(n: number, from: string = new Date().toISOString().split('T')[0]): string {
  const [year, month, day] = from.split('-').map(Number)
  const zeroIndexed = month - 1 - n
  const targetYear = year + Math.floor(zeroIndexed / 12)
  const targetMonth = ((zeroIndexed % 12) + 12) % 12 + 1
  const clampedDay = Math.min(day, daysInMonth(targetYear, targetMonth))
  return new Date(Date.UTC(targetYear, targetMonth - 1, clampedDay)).toISOString().split('T')[0]
}

/** Resolves a TrendRange preset into a concrete { start, end } date pair. */
export function resolveTrendRange(
  range: TrendRange,
  todayDate: string = new Date().toISOString().split('T')[0]
): { start: string; end: string } {
  const end = todayDate
  let start: string
  switch (range) {
    case '90d':
      start = daysAgo(90, end)
      break
    case '6m':
      start = monthsAgo(6, end)
      break
    case '1y':
      start = monthsAgo(12, end)
      break
  }
  return { start, end }
}
