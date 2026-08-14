import { describe, it, expect } from 'vitest'
import { daysAgo, monthsAgo, resolveTrendRange, TREND_RANGES } from './dateRange'

describe('daysAgo', () => {
  it('subtracts a basic number of days within the same month', () => {
    expect(daysAgo(10, '2026-08-13')).toBe('2026-08-03')
  })

  it('subtracts days across a month boundary', () => {
    expect(daysAgo(5, '2026-08-02')).toBe('2026-07-28')
  })
})

describe('monthsAgo', () => {
  it('subtracts a basic number of months with no clamp needed', () => {
    expect(monthsAgo(2, '2026-08-15')).toBe('2026-06-15')
  })

  it('clamps to the target month last day when the source day does not exist there', () => {
    expect(monthsAgo(1, '2026-03-31')).toBe('2026-02-28')
  })

  it('clamps to Feb 29 in a leap year', () => {
    expect(monthsAgo(1, '2024-03-31')).toBe('2024-02-29')
  })

  it('crosses a year boundary when subtracting months', () => {
    expect(monthsAgo(6, '2026-02-01')).toBe('2025-08-01')
  })
})

describe('resolveTrendRange', () => {
  const todayDate = '2026-08-13'

  it('resolves 90d', () => {
    expect(resolveTrendRange('90d', todayDate)).toEqual({ start: '2026-05-15', end: '2026-08-13' })
  })

  it('resolves 6m', () => {
    expect(resolveTrendRange('6m', todayDate)).toEqual({ start: '2026-02-13', end: '2026-08-13' })
  })

  it('resolves 1y', () => {
    expect(resolveTrendRange('1y', todayDate)).toEqual({ start: '2025-08-13', end: '2026-08-13' })
  })

  it('clamps correctly for 1y when the start lands on a leap-year Feb 29 boundary', () => {
    // 12 months before 2028-02-29 (leap) -> 2027-02-29 does not exist -> clamp to 2027-02-28.
    expect(resolveTrendRange('1y', '2028-02-29')).toEqual({ start: '2027-02-28', end: '2028-02-29' })
  })

  it('exposes exactly the three expected range presets', () => {
    expect(TREND_RANGES).toEqual([
      { value: '90d', label: '90 days' },
      { value: '6m', label: '6 months' },
      { value: '1y', label: '1 year' },
    ])
  })
})
