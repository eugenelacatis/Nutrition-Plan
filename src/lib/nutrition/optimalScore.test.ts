import { describe, it, expect } from 'vitest'
import { computeOptimalScore, type ScoredLog } from './optimalScore'

// Logs as returned by findMany: newest-first (orderBy createdAt desc).
function log(overrides: Partial<ScoredLog>): ScoredLog {
  return { weight: 180, sleepHours: 8, digestionRating: 4, ...overrides }
}

describe('computeOptimalScore', () => {
  it('returns a zero score with a starter recommendation when there are no logs', () => {
    const result = computeOptimalScore([], null)

    expect(result.score).toBe(0)
    expect(result.recommendations).toEqual([
      'Start logging your daily metrics to get personalized recommendations',
    ])
    expect(result.factors.sleep.score).toBe(0)
    expect(result.factors.digestion.score).toBe(0)
    expect(result.factors.weight.score).toBe(0)
  })

  it('scores 7-9h average sleep as ideal (100) and rewards good digestion, without a sleep recommendation', () => {
    const result = computeOptimalScore([log({ sleepHours: 8, digestionRating: 5 })], null)

    expect(result.factors.sleep.score).toBe(100)
    expect(result.factors.digestion.score).toBe(100)
    expect(result.recommendations).not.toContain('Focus on getting 7-9 hours of sleep consistently')
  })

  it('scores sub-6h average sleep as poor (40) and emits the sleep recommendation', () => {
    const result = computeOptimalScore([log({ sleepHours: 5 })], null)

    expect(result.factors.sleep.score).toBe(40)
    expect(result.recommendations).toContain('Focus on getting 7-9 hours of sleep consistently')
  })

  it('scores digestion below 3 as poor (40) and emits the digestion recommendation', () => {
    const result = computeOptimalScore([log({ digestionRating: 2 })], null)

    expect(result.factors.digestion.score).toBe(40)
    expect(result.recommendations).toContain('Consider tracking which foods affect your digestion')
  })

  it('gives a neutral weight score (50) with fewer than 2 logs, regardless of goal direction', () => {
    const result = computeOptimalScore([log({ weight: 180 })], 'lose')

    expect(result.factors.weight.score).toBe(50)
  })

  it('rewards a steady downward weight trend when the goal is to lose weight', () => {
    // Newest-first input; function reverses to oldest-first before scoring.
    // Oldest->newest weight: 182, 181.5, 181, 180.5, 180 (steady loss, slope ~ -0.5/log)
    const logs = [180, 180.5, 181, 181.5, 182].map((weight) => log({ weight }))

    const result = computeOptimalScore(logs, 'lose')

    expect(result.factors.weight.score).toBe(100)
  })

  it('penalizes a weight trend moving opposite the goal direction', () => {
    // Oldest->newest weight rising while the goal is to lose: off track.
    const logs = [180, 181, 182, 183, 184].map((weight) => log({ weight })).reverse()

    const result = computeOptimalScore(logs, 'lose')

    expect(result.factors.weight.score).toBe(40)
    expect(result.recommendations).toContain(
      "Your weight trend isn't tracking toward your lose goal — review your adherence"
    )
  })

  it('rewards stability (near-zero slope) when maintaining', () => {
    const logs = [180, 180, 180.05, 179.95, 180].map((weight) => log({ weight })).reverse()

    const result = computeOptimalScore(logs, 'maintain')

    expect(result.factors.weight.score).toBe(100)
  })

  it('suggests setting a goal when weight score is low and no goalDirection is set', () => {
    // Large erratic swings with no goal set -> magnitude > 0.3 -> score 40 (< 70)
    const logs = [180, 185, 178, 190, 175].map((weight) => log({ weight })).reverse()

    const result = computeOptimalScore(logs, null)

    expect(result.factors.weight.score).toBeLessThan(70)
    expect(result.recommendations).toContain('Set a weight goal to get trend-based recommendations')
  })

  it('computes the overall score as the 0.4/0.3/0.3 weighted sum of the three factors, rounded', () => {
    // Ideal sleep (100) + poor digestion (40) + neutral weight (50, only 1 log)
    const result = computeOptimalScore([log({ sleepHours: 8, digestionRating: 1 })], null)

    const expected = Math.round(100 * 0.4 + 40 * 0.3 + 50 * 0.3)
    expect(result.score).toBe(expected)
  })

  it('adds the general priority recommendation only when the overall score is below 70', () => {
    const result = computeOptimalScore([log({ sleepHours: 8, digestionRating: 5 })], null)

    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.recommendations).not.toContain('Prioritize sleep and digestion for better results')
  })
})
