export interface CalendarDayCell {
  date: string // YYYY-MM-DD
  day: number // 1-31
  isCurrentMonth: boolean
  isToday: boolean
}

export type CalendarWeek = CalendarDayCell[] // always length 7

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Formats a Date/parts into the app's canonical YYYY-MM-DD string, using UTC. */
export function toDateString(year: number, month1Indexed: number, day: number): string {
  const mm = String(month1Indexed).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

/** Parses a YYYY-MM-DD string into { year, month (1-indexed), day }. */
export function parseDateString(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

/** Returns the {year, month} of the month before/after the given one, for prev/next navigation. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const zeroIndexed = month - 1 + delta
  const newYear = year + Math.floor(zeroIndexed / 12)
  const newMonth = ((zeroIndexed % 12) + 12) % 12 + 1
  return { year: newYear, month: newMonth }
}

/** Number of days in the given 1-indexed month/year, UTC-based. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Human-readable "August 2026" label for a 1-indexed month. */
export function formatMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

/**
 * Builds a full month grid (weeks of 7 days each, Sunday-first) for the
 * given year/month, padded with leading/trailing days from adjacent months
 * so every week row is complete.
 *
 * @param year e.g. 2026
 * @param month 1-indexed (1 = January), matching the `YYYY-MM` convention
 *              used elsewhere in the app (NOT JS's 0-indexed Date month).
 * @param todayDate optional YYYY-MM-DD string to mark `isToday`; defaults to
 *                   the real current UTC date. Injectable for testability.
 */
export function buildMonthGrid(
  year: number,
  month: number,
  todayDate: string = new Date().toISOString().split('T')[0]
): CalendarWeek[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1))
  const leadingCount = firstOfMonth.getUTCDay() // 0 = Sunday
  const monthLength = daysInMonth(year, month)

  const { year: prevYear, month: prevMonth } = shiftMonth(year, month, -1)
  const prevMonthLength = daysInMonth(prevYear, prevMonth)
  const { year: nextYear, month: nextMonth } = shiftMonth(year, month, 1)

  const cells: CalendarDayCell[] = []

  for (let i = leadingCount - 1; i >= 0; i--) {
    const day = prevMonthLength - i
    const date = toDateString(prevYear, prevMonth, day)
    cells.push({ date, day, isCurrentMonth: false, isToday: date === todayDate })
  }

  for (let day = 1; day <= monthLength; day++) {
    const date = toDateString(year, month, day)
    cells.push({ date, day, isCurrentMonth: true, isToday: date === todayDate })
  }

  const trailingCount = (7 - (cells.length % 7)) % 7
  for (let day = 1; day <= trailingCount; day++) {
    const date = toDateString(nextYear, nextMonth, day)
    cells.push({ date, day, isCurrentMonth: false, isToday: date === todayDate })
  }

  const weeks: CalendarWeek[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}
