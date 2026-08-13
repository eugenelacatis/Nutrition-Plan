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

function req(url: string): Request {
  return new Request(url)
}

beforeEach(() => {
  resetPrismaMock()
  mockAuth.mockReset()
  prismaMock.dailyLog.findMany.mockResolvedValue([])
})

describe('GET /api/nutrition/daily-logs', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await GET(req('http://localhost/api/nutrition/daily-logs'))

    expect(res.status).toBe(401)
  })

  it('defaults to a limit of 30 when none is provided', async () => {
    authedAs('user-1')

    await GET(req('http://localhost/api/nutrition/daily-logs'))

    expect(prismaMock.dailyLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 30, where: { userId: 'user-1' } })
    )
  })

  it('passes through a limit within bounds', async () => {
    authedAs('user-1')

    await GET(req('http://localhost/api/nutrition/daily-logs?limit=10'))

    expect(prismaMock.dailyLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }))
  })

  it('clamps a limit above 100 down to 100', async () => {
    authedAs('user-1')

    await GET(req('http://localhost/api/nutrition/daily-logs?limit=99999'))

    expect(prismaMock.dailyLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }))
  })

  it('falls back to 30 when limit is not a number', async () => {
    authedAs('user-1')

    await GET(req('http://localhost/api/nutrition/daily-logs?limit=not-a-number'))

    expect(prismaMock.dailyLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 30 }))
  })

  it('orders by most recent first', async () => {
    authedAs('user-1')

    await GET(req('http://localhost/api/nutrition/daily-logs'))

    expect(prismaMock.dailyLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } })
    )
  })
})
