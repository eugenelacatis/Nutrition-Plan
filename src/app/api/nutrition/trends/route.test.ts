import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/test/prismaMock'

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { auth } from '@/auth'
import { GET } from './route'
import { resolveTrendRange, type TrendRange } from '@/lib/dateRange'

const mockAuth = vi.mocked(auth)

function authedAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } } as any)
}

function req(query: string): Request {
  return new Request(`http://localhost/api/nutrition/trends${query}`)
}

beforeEach(() => {
  resetPrismaMock()
  mockAuth.mockReset()
  prismaMock.dailyLog.findMany.mockResolvedValue([])
})

describe('GET /api/nutrition/trends', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await GET(req('?range=90d'))

    expect(res.status).toBe(401)
  })

  it('returns 400 on an invalid range value', async () => {
    authedAs('user-1')

    const res = await GET(req('?range=bogus'))

    expect(res.status).toBe(400)
  })

  it('defaults to 90d when range is omitted', async () => {
    authedAs('user-1')

    const res = await GET(req(''))
    const body = await res.json()

    expect(body.data.range).toBe('90d')
  })

  it.each<TrendRange>(['90d', '6m', '1y'])(
    'queries dailyLog with the correct where/orderBy/select for range=%s',
    async (range) => {
      authedAs('user-1')

      const res = await GET(req(`?range=${range}`))
      const body = await res.json()

      const { start, end } = resolveTrendRange(range)

      expect(prismaMock.dailyLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', date: { gte: start, lte: end } },
        orderBy: { date: 'asc' },
        select: { date: true, weight: true, sleepHours: true, digestionRating: true },
      })
      expect(body.data.start).toBe(start)
      expect(body.data.end).toBe(end)
      expect(body.data.range).toBe(range)
    }
  )

  it('returns the raw logs array from prisma in the response', async () => {
    authedAs('user-1')
    const logs = [{ date: '2026-08-01', weight: 180, sleepHours: 8, digestionRating: 4 }]
    prismaMock.dailyLog.findMany.mockResolvedValue(logs)

    const res = await GET(req('?range=90d'))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data.logs).toEqual(logs)
  })
})
