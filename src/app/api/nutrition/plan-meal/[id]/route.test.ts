import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/test/prismaMock'

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { auth } from '@/auth'
import { PATCH } from './route'

const mockAuth = vi.mocked(auth)

function authedAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } } as any)
}

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/nutrition/plan-meal/meal-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

const OWNED_MEAL = { id: 'meal-1', plan: { userId: 'user-1' } }

beforeEach(() => {
  resetPrismaMock()
  mockAuth.mockReset()
})

describe('PATCH /api/nutrition/plan-meal/[id]', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await PATCH(jsonRequest({ scheduledTime: '08:00' }), { params: { id: 'meal-1' } })

    expect(res.status).toBe(401)
    expect(prismaMock.planMeal.update).not.toHaveBeenCalled()
  })

  it('returns 404 when the plan meal belongs to a different user', async () => {
    authedAs('attacker')
    prismaMock.planMeal.findUnique.mockResolvedValue(OWNED_MEAL)

    const res = await PATCH(jsonRequest({ scheduledTime: '08:00' }), { params: { id: 'meal-1' } })

    expect(res.status).toBe(404)
    expect(prismaMock.planMeal.update).not.toHaveBeenCalled()
  })

  it('returns 404 when the plan meal does not exist', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(null)

    const res = await PATCH(jsonRequest({ scheduledTime: '08:00' }), { params: { id: 'does-not-exist' } })

    expect(res.status).toBe(404)
  })

  it('updates scheduledTime for a valid HH:MM time', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(OWNED_MEAL)
    prismaMock.planMeal.update.mockResolvedValue({ id: 'meal-1', scheduledTime: '08:15' })

    const res = await PATCH(jsonRequest({ scheduledTime: '08:15' }), { params: { id: 'meal-1' } })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.scheduledTime).toBe('08:15')
    expect(prismaMock.planMeal.update).toHaveBeenCalledWith({
      where: { id: 'meal-1' },
      data: { scheduledTime: '08:15' },
    })
  })

  it('rejects an invalid time format without touching the database', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(OWNED_MEAL)

    const res = await PATCH(jsonRequest({ scheduledTime: 'not-a-time' }), { params: { id: 'meal-1' } })

    expect(res.status).toBe(400)
    expect(prismaMock.planMeal.update).not.toHaveBeenCalled()
  })

  it('updates only sortOrder when scheduledTime is not provided', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(OWNED_MEAL)
    prismaMock.planMeal.update.mockResolvedValue({ id: 'meal-1', sortOrder: 3 })

    await PATCH(jsonRequest({ sortOrder: 3 }), { params: { id: 'meal-1' } })

    expect(prismaMock.planMeal.update).toHaveBeenCalledWith({
      where: { id: 'meal-1' },
      data: { sortOrder: 3 },
    })
  })

  it('rejects a negative sortOrder', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(OWNED_MEAL)

    const res = await PATCH(jsonRequest({ sortOrder: -1 }), { params: { id: 'meal-1' } })

    expect(res.status).toBe(400)
    expect(prismaMock.planMeal.update).not.toHaveBeenCalled()
  })

  it('allows clearing scheduledTime with null', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(OWNED_MEAL)
    prismaMock.planMeal.update.mockResolvedValue({ id: 'meal-1', scheduledTime: null })

    const res = await PATCH(jsonRequest({ scheduledTime: null }), { params: { id: 'meal-1' } })

    expect(res.status).toBe(200)
    expect(prismaMock.planMeal.update).toHaveBeenCalledWith({
      where: { id: 'meal-1' },
      data: { scheduledTime: null },
    })
  })
})
