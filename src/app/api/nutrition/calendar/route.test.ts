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

function req(query: string): Request {
  return new Request(`http://localhost/api/nutrition/calendar${query}`)
}

function dailyLog(date: string, overrides: Partial<{ weight: number; sleepHours: number; digestionRating: number }> = {}) {
  return { weight: 180, sleepHours: 8, digestionRating: 4, wakeTime: '06:30', date, ...overrides }
}

beforeEach(() => {
  resetPrismaMock()
  mockAuth.mockReset()
  prismaMock.user.findUnique.mockResolvedValue({ goalDirection: null })
  prismaMock.dailyLog.findMany.mockResolvedValue([])
  prismaMock.mealLog.findMany.mockResolvedValue([])
})

describe('GET /api/nutrition/calendar', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await GET(req('?month=2026-08'))

    expect(res.status).toBe(401)
  })

  it('defaults to the current month when month is omitted', async () => {
    authedAs('user-1')

    const res = await GET(req(''))
    const body = await res.json()

    const expectedMonth = new Date().toISOString().slice(0, 7)
    expect(body.data.month).toBe(expectedMonth)
  })

  it('returns 400 on a malformed month param', async () => {
    authedAs('user-1')

    const res = await GET(req('?month=not-a-month'))

    expect(res.status).toBe(400)
  })

  it('queries dailyLog and mealLog with the correct date-range bounds for the month', async () => {
    authedAs('user-1')

    await GET(req('?month=2026-02'))

    expect(prismaMock.dailyLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', date: { gte: '2026-02-01', lte: '2026-02-28' } },
      })
    )
    expect(prismaMock.mealLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', date: { gte: '2026-02-01', lte: '2026-02-28' } },
      })
    )
  })

  it('handles a leap-year February (29 days)', async () => {
    authedAs('user-1')

    const res = await GET(req('?month=2024-02'))
    const body = await res.json()

    expect(body.data.days).toHaveLength(29)
    expect(body.data.days[28].date).toBe('2024-02-29')
  })

  it('maps a day with a DailyLog to hasLog: true with a computed score, and a day without one to hasLog: false, score: null', async () => {
    authedAs('user-1')
    prismaMock.dailyLog.findMany.mockResolvedValue([dailyLog('2026-08-05')])

    const res = await GET(req('?month=2026-08'))
    const body = await res.json()

    const loggedDay = body.data.days.find((d: any) => d.date === '2026-08-05')
    const unloggedDay = body.data.days.find((d: any) => d.date === '2026-08-06')

    expect(loggedDay.hasLog).toBe(true)
    expect(typeof loggedDay.score).toBe('number')
    expect(loggedDay.weight).toBe(180)

    expect(unloggedDay.hasLog).toBe(false)
    expect(unloggedDay.score).toBeNull()
    expect(unloggedDay.weight).toBeNull()
  })

  it('groups and tallies meal logs by date, joined with the meal name and slot', async () => {
    authedAs('user-1')
    prismaMock.mealLog.findMany.mockResolvedValue([
      { date: '2026-08-05', status: 'as_planned', planMeal: { name: 'Chicken bowl', slot: 'lunch' } },
      { date: '2026-08-05', status: 'substituted', planMeal: { name: 'Oats', slot: 'breakfast' } },
      { date: '2026-08-06', status: 'skipped', planMeal: { name: 'Salmon', slot: 'dinner' } },
    ])

    const res = await GET(req('?month=2026-08'))
    const body = await res.json()

    const day5 = body.data.days.find((d: any) => d.date === '2026-08-05')
    const day6 = body.data.days.find((d: any) => d.date === '2026-08-06')

    expect(day5.meals).toEqual([
      { name: 'Chicken bowl', slot: 'lunch', status: 'as_planned' },
      { name: 'Oats', slot: 'breakfast', status: 'substituted' },
    ])
    expect(day6.meals).toEqual([{ name: 'Salmon', slot: 'dinner', status: 'skipped' }])
  })

  it('fetches a prior-month buffer of up to 6 logs to seed the trailing score window for early days', async () => {
    authedAs('user-1')

    await GET(req('?month=2026-08'))

    expect(prismaMock.dailyLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', date: { lt: '2026-08-01' } },
        orderBy: { date: 'desc' },
        take: 6,
      })
    )
  })
})
