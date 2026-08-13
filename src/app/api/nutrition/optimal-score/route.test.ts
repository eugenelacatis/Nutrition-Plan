import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/test/prismaMock'

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { auth } from '@/auth'
import { GET } from './route'

const mockAuth = vi.mocked(auth)

function authedAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } } as any)
}

// Logs as returned by findMany: newest-first (orderBy createdAt desc).
function log(overrides: Partial<{ weight: number; sleepHours: number; digestionRating: number }>) {
  return { weight: 180, sleepHours: 8, digestionRating: 4, ...overrides }
}

beforeEach(() => {
  resetPrismaMock()
  mockAuth.mockReset()
})

describe('GET /api/nutrition/optimal-score', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await GET()

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('returns a zero score with a starter recommendation when there are no logs', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: null })
    prismaMock.dailyLog.findMany.mockResolvedValue([])

    const res = await GET()
    const body = await res.json()

    expect(body.data.score).toBe(0)
    expect(body.data.recommendations).toEqual([
      'Start logging your daily metrics to get personalized recommendations',
    ])
    expect(body.data.factors.sleep.score).toBe(0)
    expect(body.data.factors.digestion.score).toBe(0)
    expect(body.data.factors.weight.score).toBe(0)
  })

  it('scores 7-9h average sleep as ideal (100) and rewards good digestion, without a sleep recommendation', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: null })
    prismaMock.dailyLog.findMany.mockResolvedValue([log({ sleepHours: 8, digestionRating: 5 })])

    const res = await GET()
    const body = await res.json()

    expect(body.data.factors.sleep.score).toBe(100)
    expect(body.data.factors.digestion.score).toBe(100)
    expect(body.data.recommendations).not.toContain('Focus on getting 7-9 hours of sleep consistently')
  })

  it('scores sub-6h average sleep as poor (40) and emits the sleep recommendation', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: null })
    prismaMock.dailyLog.findMany.mockResolvedValue([log({ sleepHours: 5 })])

    const res = await GET()
    const body = await res.json()

    expect(body.data.factors.sleep.score).toBe(40)
    expect(body.data.recommendations).toContain('Focus on getting 7-9 hours of sleep consistently')
  })

  it('scores digestion below 3 as poor (40) and emits the digestion recommendation', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: null })
    prismaMock.dailyLog.findMany.mockResolvedValue([log({ digestionRating: 2 })])

    const res = await GET()
    const body = await res.json()

    expect(body.data.factors.digestion.score).toBe(40)
    expect(body.data.recommendations).toContain('Consider tracking which foods affect your digestion')
  })

  it('gives a neutral weight score (50) with fewer than 2 logs, regardless of goal direction', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: 'lose' })
    prismaMock.dailyLog.findMany.mockResolvedValue([log({ weight: 180 })])

    const res = await GET()
    const body = await res.json()

    expect(body.data.factors.weight.score).toBe(50)
  })

  it('rewards a steady downward weight trend when the goal is to lose weight', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: 'lose' })
    // findMany returns newest-first; route reverses to oldest-first before scoring.
    // Oldest->newest weight: 182, 181.5, 181, 180.5, 180 (steady loss, slope ~ -0.5/log)
    prismaMock.dailyLog.findMany.mockResolvedValue(
      [180, 180.5, 181, 181.5, 182].map((weight) => log({ weight }))
    )

    const res = await GET()
    const body = await res.json()

    expect(body.data.factors.weight.score).toBe(100)
  })

  it('penalizes a weight trend moving opposite the goal direction', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: 'lose' })
    // Oldest->newest weight rising while the goal is to lose: off track.
    prismaMock.dailyLog.findMany.mockResolvedValue(
      [180, 181, 182, 183, 184].map((weight) => log({ weight })).reverse()
    )

    const res = await GET()
    const body = await res.json()

    expect(body.data.factors.weight.score).toBe(40)
    expect(body.data.recommendations).toContain(
      "Your weight trend isn't tracking toward your lose goal — review your adherence"
    )
  })

  it('rewards stability (near-zero slope) when maintaining', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: 'maintain' })
    prismaMock.dailyLog.findMany.mockResolvedValue(
      [180, 180, 180.05, 179.95, 180].map((weight) => log({ weight })).reverse()
    )

    const res = await GET()
    const body = await res.json()

    expect(body.data.factors.weight.score).toBe(100)
  })

  it('suggests setting a goal when weight score is low and no goalDirection is set', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: null })
    // Large erratic swings with no goal set -> magnitude > 0.3 -> score 40 (< 70)
    prismaMock.dailyLog.findMany.mockResolvedValue(
      [180, 185, 178, 190, 175].map((weight) => log({ weight })).reverse()
    )

    const res = await GET()
    const body = await res.json()

    expect(body.data.factors.weight.score).toBeLessThan(70)
    expect(body.data.recommendations).toContain('Set a weight goal to get trend-based recommendations')
  })

  it('computes the overall score as the 0.4/0.3/0.3 weighted sum of the three factors, rounded', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: null })
    // Ideal sleep (100) + poor digestion (40) + neutral weight (50, only 1 log)
    prismaMock.dailyLog.findMany.mockResolvedValue([log({ sleepHours: 8, digestionRating: 1 })])

    const res = await GET()
    const body = await res.json()

    const expected = Math.round(100 * 0.4 + 40 * 0.3 + 50 * 0.3)
    expect(body.data.score).toBe(expected)
  })

  it('adds the general priority recommendation only when the overall score is below 70', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: null })
    prismaMock.dailyLog.findMany.mockResolvedValue([log({ sleepHours: 8, digestionRating: 5 })])

    const res = await GET()
    const body = await res.json()

    expect(body.data.score).toBeGreaterThanOrEqual(70)
    expect(body.data.recommendations).not.toContain('Prioritize sleep and digestion for better results')
  })

  it('only considers the most recent 7 logs (take: 7)', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: null })
    prismaMock.dailyLog.findMany.mockResolvedValue([log({})])

    await GET()

    expect(prismaMock.dailyLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 7, where: { userId: 'user-1' } })
    )
  })
})
