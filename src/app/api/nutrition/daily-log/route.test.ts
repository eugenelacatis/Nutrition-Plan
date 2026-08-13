import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/test/prismaMock'

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { auth } from '@/auth'
import { POST } from './route'

const mockAuth = vi.mocked(auth)

function authedAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } } as any)
}

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/nutrition/daily-log', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const VALID_LOG = { weight: 180, sleepHours: 7.5, wakeTime: '06:30', digestionRating: 4 }

beforeEach(() => {
  resetPrismaMock()
  mockAuth.mockReset()
})

describe('POST /api/nutrition/daily-log', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await POST(jsonRequest(VALID_LOG))

    expect(res.status).toBe(401)
    expect(prismaMock.dailyLog.create).not.toHaveBeenCalled()
  })

  it.each(['weight', 'sleepHours', 'wakeTime', 'digestionRating'])(
    'rejects a request missing %s',
    async (field) => {
      authedAs('user-1')
      const body = { ...VALID_LOG, [field]: undefined }

      const res = await POST(jsonRequest(body))

      expect(res.status).toBe(400)
      expect(prismaMock.dailyLog.create).not.toHaveBeenCalled()
    }
  )

  it('rejects a digestion rating below 1', async () => {
    authedAs('user-1')

    const res = await POST(jsonRequest({ ...VALID_LOG, digestionRating: 0 }))

    expect(res.status).toBe(400)
    expect(prismaMock.dailyLog.create).not.toHaveBeenCalled()
  })

  it('rejects a digestion rating above 5', async () => {
    authedAs('user-1')

    const res = await POST(jsonRequest({ ...VALID_LOG, digestionRating: 6 }))

    expect(res.status).toBe(400)
  })

  it.each([1, 2, 3, 4, 5])('accepts a digestion rating of %i', async (digestionRating) => {
    authedAs('user-1')
    prismaMock.dailyLog.create.mockResolvedValue({ id: 'log-1', ...VALID_LOG, digestionRating })

    const res = await POST(jsonRequest({ ...VALID_LOG, digestionRating }))

    expect(res.status).toBe(200)
  })

  it('creates a log scoped to the authenticated user with parsed numeric fields', async () => {
    authedAs('user-1')
    prismaMock.dailyLog.create.mockResolvedValue({ id: 'log-1', ...VALID_LOG })

    await POST(jsonRequest({ weight: '180.5', sleepHours: '7.5', wakeTime: '06:30', digestionRating: '4' }))

    expect(prismaMock.dailyLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          weight: 180.5,
          sleepHours: 7.5,
          wakeTime: '06:30',
          digestionRating: 4,
        }),
      })
    )
  })

  it('defaults date to today (YYYY-MM-DD) when not provided', async () => {
    authedAs('user-1')
    prismaMock.dailyLog.create.mockResolvedValue({ id: 'log-1', ...VALID_LOG })

    await POST(jsonRequest(VALID_LOG))

    const todayStr = new Date().toISOString().split('T')[0]
    expect(prismaMock.dailyLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ date: todayStr }) })
    )
  })

  it('uses the provided date when given', async () => {
    authedAs('user-1')
    prismaMock.dailyLog.create.mockResolvedValue({ id: 'log-1', ...VALID_LOG })

    await POST(jsonRequest({ ...VALID_LOG, date: '2026-01-01' }))

    expect(prismaMock.dailyLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ date: '2026-01-01' }) })
    )
  })
})
