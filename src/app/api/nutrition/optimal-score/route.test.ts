import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/test/prismaMock'

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))

const mockComputeOptimalScore = vi.fn()
vi.mock('@/lib/nutrition/optimalScore', () => ({
  computeOptimalScore: (...args: unknown[]) => mockComputeOptimalScore(...args),
}))

import { auth } from '@/auth'
import { GET } from './route'

const mockAuth = vi.mocked(auth)

function authedAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } } as any)
}

const STUB_RESULT = {
  score: 75,
  recommendations: [],
  factors: {
    sleep: { score: 100, weight: 0.4 },
    digestion: { score: 70, weight: 0.3 },
    weight: { score: 50, weight: 0.3 },
  },
}

beforeEach(() => {
  resetPrismaMock()
  mockAuth.mockReset()
  mockComputeOptimalScore.mockReset()
  mockComputeOptimalScore.mockReturnValue(STUB_RESULT)
})

describe('GET /api/nutrition/optimal-score', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await GET()

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(mockComputeOptimalScore).not.toHaveBeenCalled()
  })

  it('queries the most recent 7 logs for the authenticated user (take: 7, orderBy createdAt desc)', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: null })
    prismaMock.dailyLog.findMany.mockResolvedValue([])

    await GET()

    expect(prismaMock.dailyLog.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 7,
    })
  })

  it('wires the fetched logs and goalDirection into computeOptimalScore', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: 'lose' })
    const logs = [{ weight: 180, sleepHours: 8, digestionRating: 4 }]
    prismaMock.dailyLog.findMany.mockResolvedValue(logs)

    await GET()

    expect(mockComputeOptimalScore).toHaveBeenCalledWith(logs, 'lose')
  })

  it('defaults goalDirection to null when the user has none set', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: null })
    prismaMock.dailyLog.findMany.mockResolvedValue([])

    await GET()

    expect(mockComputeOptimalScore).toHaveBeenCalledWith([], null)
  })

  it('returns computeOptimalScore output as the response data', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalDirection: null })
    prismaMock.dailyLog.findMany.mockResolvedValue([])

    const res = await GET()
    const body = await res.json()

    expect(body).toEqual({ success: true, data: STUB_RESULT })
  })
})
