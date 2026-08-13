import { describe, it, expect } from 'vitest'
import { buildMonthGrid, toDateString, parseDateString, shiftMonth, formatMonthLabel } from './calendar'

describe('buildMonthGrid', () => {
  it('pads leading days when the month does not start on Sunday', () => {
    // August 2026 starts on a Saturday (UTC) -> 6 leading days from July.
    const weeks = buildMonthGrid(2026, 8, '2026-08-01')

    expect(weeks[0]).toHaveLength(7)
    const leading = weeks[0].filter((c) => !c.isCurrentMonth)
    expect(leading).toHaveLength(6)
    expect(leading[leading.length - 1].date).toBe('2026-07-31')
  })

  it('produces complete weeks of length 7 for every row', () => {
    const weeks = buildMonthGrid(2026, 8)
    for (const week of weeks) {
      expect(week).toHaveLength(7)
    }
  })

  it('pads trailing days from the next month to complete the final week', () => {
    const weeks = buildMonthGrid(2026, 8, '2026-08-01')
    const lastWeek = weeks[weeks.length - 1]
    const trailing = lastWeek.filter((c) => !c.isCurrentMonth)
    if (trailing.length > 0) {
      expect(trailing[0].date).toBe('2026-09-01')
    }
  })

  it('marks isToday only on the cell matching the injected todayDate', () => {
    const weeks = buildMonthGrid(2026, 8, '2026-08-13')
    const allCells = weeks.flat()
    const todayCells = allCells.filter((c) => c.isToday)

    expect(todayCells).toHaveLength(1)
    expect(todayCells[0].date).toBe('2026-08-13')
  })

  it('handles February in a leap year (29 days)', () => {
    const weeks = buildMonthGrid(2024, 2, '2024-02-01')
    const currentMonthDays = weeks.flat().filter((c) => c.isCurrentMonth)

    expect(currentMonthDays).toHaveLength(29)
    expect(currentMonthDays[currentMonthDays.length - 1].date).toBe('2024-02-29')
  })

  it('handles February in a non-leap year (28 days)', () => {
    const weeks = buildMonthGrid(2026, 2, '2026-02-01')
    const currentMonthDays = weeks.flat().filter((c) => c.isCurrentMonth)

    expect(currentMonthDays).toHaveLength(28)
    expect(currentMonthDays[currentMonthDays.length - 1].date).toBe('2026-02-28')
  })
})

describe('toDateString / parseDateString', () => {
  it('round-trips year/month/day through toDateString and parseDateString', () => {
    const date = toDateString(2026, 3, 5)
    expect(date).toBe('2026-03-05')
    expect(parseDateString(date)).toEqual({ year: 2026, month: 3, day: 5 })
  })
})

describe('shiftMonth', () => {
  it('rolls over December to January of the next year', () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 })
  })

  it('rolls over January to December of the previous year', () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 })
  })

  it('shifts within the same year when no rollover is needed', () => {
    expect(shiftMonth(2026, 6, 1)).toEqual({ year: 2026, month: 7 })
    expect(shiftMonth(2026, 6, -1)).toEqual({ year: 2026, month: 5 })
  })
})

describe('formatMonthLabel', () => {
  it('formats a 1-indexed month and year as a readable label', () => {
    expect(formatMonthLabel(2026, 8)).toBe('August 2026')
    expect(formatMonthLabel(2026, 1)).toBe('January 2026')
  })
})
