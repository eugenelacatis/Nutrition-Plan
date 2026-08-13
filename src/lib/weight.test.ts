import { describe, it, expect } from 'vitest'
import { toLbs, fromLbs, formatWeight } from './weight'

describe('toLbs', () => {
  it('returns the value unchanged when the unit is already lbs', () => {
    expect(toLbs(180, 'lbs')).toBe(180)
  })

  it('converts kg to lbs', () => {
    expect(toLbs(100, 'kg')).toBeCloseTo(220.462, 3)
  })
})

describe('fromLbs', () => {
  it('returns the value unchanged when the target unit is lbs', () => {
    expect(fromLbs(180, 'lbs')).toBe(180)
  })

  it('converts lbs to kg', () => {
    expect(fromLbs(220.462, 'kg')).toBeCloseTo(100, 3)
  })

  it('round-trips through toLbs without drift', () => {
    const original = 82.5
    const lbs = toLbs(original, 'kg')
    expect(fromLbs(lbs, 'kg')).toBeCloseTo(original, 5)
  })
})

describe('formatWeight', () => {
  it('formats lbs with one decimal place and the unit suffix', () => {
    expect(formatWeight(180, 'lbs')).toBe('180lbs')
  })

  it('formats kg, converting from the internal lbs value', () => {
    expect(formatWeight(220.462, 'kg')).toBe('100kg')
  })

  it('rounds to one decimal place', () => {
    expect(formatWeight(181.4, 'lbs')).toBe('181.4lbs')
  })
})
