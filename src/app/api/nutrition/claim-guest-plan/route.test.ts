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
  return new Request('http://localhost/api/nutrition/claim-guest-plan', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function validMeal(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Chicken and Rice',
    slot: 'dinner',
    scheduledTime: null,
    calories: 500,
    protein: 40,
    carbs: 50,
    fat: 15,
    ingredients: ['chicken', 'rice'],
    instructions: ['cook it'],
    prepTime: 10,
    cookTime: 20,
    ...overrides,
  }
}

function validPlan(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Muscle Gain Plan',
    description: 'A plan',
    dailyMeals: [{ day: 'Daily Meals', meals: [validMeal()] }],
    totalCalories: 500,
    totalProtein: 40,
    totalCarbs: 50,
    totalFat: 15,
    aiGenerated: true,
    ...overrides,
  }
}

beforeEach(() => {
  resetPrismaMock()
  mockAuth.mockReset()
  prismaMock.user.findUnique.mockResolvedValue(null)
})

describe('POST /api/nutrition/claim-guest-plan', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await POST(jsonRequest({ goals: 'muscle_gain', plan: validPlan() }))

    expect(res.status).toBe(401)
    expect(prismaMock.plan.create).not.toHaveBeenCalled()
  })

  it('rejects a goals value outside the allowed enum', async () => {
    authedAs('user-1')

    const res = await POST(jsonRequest({ goals: 'get_shredded', plan: validPlan() }))

    expect(res.status).toBe(400)
    expect(prismaMock.plan.create).not.toHaveBeenCalled()
  })

  it('persists a well-formed plan for the authenticated user', async () => {
    authedAs('user-1')
    prismaMock.plan.create.mockResolvedValue({ id: 'plan-1' })

    const res = await POST(jsonRequest({ goals: 'muscle_gain', plan: validPlan() }))

    expect(res.status).toBe(200)
    expect(prismaMock.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1', name: 'Muscle Gain Plan' }) })
    )
  })

  it('rejects a plan with no dailyMeals', async () => {
    authedAs('user-1')

    const res = await POST(jsonRequest({ goals: 'muscle_gain', plan: validPlan({ dailyMeals: [] }) }))

    expect(res.status).toBe(400)
    expect(prismaMock.plan.create).not.toHaveBeenCalled()
  })

  it('rejects a meal with a non-finite calorie value (e.g. NaN/Infinity injected as JSON-parsed strings)', async () => {
    authedAs('user-1')
    const plan = validPlan({
      dailyMeals: [{ day: 'Daily Meals', meals: [validMeal({ calories: 'a lot' })] }],
    })

    const res = await POST(jsonRequest({ goals: 'muscle_gain', plan }))

    expect(res.status).toBe(400)
  })

  it('rejects a meal with an absurdly large calorie value (guards against a corrupted client payload)', async () => {
    authedAs('user-1')
    const plan = validPlan({
      dailyMeals: [{ day: 'Daily Meals', meals: [validMeal({ calories: 999999 })] }],
    })

    const res = await POST(jsonRequest({ goals: 'muscle_gain', plan }))

    expect(res.status).toBe(400)
  })

  it('rejects a negative calorie value', async () => {
    authedAs('user-1')
    const plan = validPlan({
      dailyMeals: [{ day: 'Daily Meals', meals: [validMeal({ calories: -100 })] }],
    })

    const res = await POST(jsonRequest({ goals: 'muscle_gain', plan }))

    expect(res.status).toBe(400)
  })

  it('rejects an ingredients list that is not an array of strings', async () => {
    authedAs('user-1')
    const plan = validPlan({
      dailyMeals: [{ day: 'Daily Meals', meals: [validMeal({ ingredients: [{ name: 'chicken' }] })] }],
    })

    const res = await POST(jsonRequest({ goals: 'muscle_gain', plan }))

    expect(res.status).toBe(400)
  })

  it('rejects more days than MAX_DAYS (14)', async () => {
    authedAs('user-1')
    const dailyMeals = Array.from({ length: 15 }, (_, i) => ({ day: `Day ${i}`, meals: [validMeal()] }))

    const res = await POST(jsonRequest({ goals: 'muscle_gain', plan: validPlan({ dailyMeals }) }))

    expect(res.status).toBe(400)
  })

  it('rejects a plan missing required top-level fields (e.g. no description)', async () => {
    authedAs('user-1')
    const plan = validPlan({ description: undefined })

    const res = await POST(jsonRequest({ goals: 'muscle_gain', plan }))

    expect(res.status).toBe(400)
  })

  it('rejects a completely malformed plan payload (e.g. a plain string)', async () => {
    authedAs('user-1')

    const res = await POST(jsonRequest({ goals: 'muscle_gain', plan: 'not a plan' }))

    expect(res.status).toBe(400)
  })

  it('coerces aiGenerated to a boolean regardless of the claimed payload value', async () => {
    authedAs('user-1')
    prismaMock.plan.create.mockResolvedValue({ id: 'plan-1' })

    await POST(jsonRequest({ goals: 'muscle_gain', plan: validPlan({ aiGenerated: 'yes please' }) }))

    expect(prismaMock.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ aiGenerated: true }) })
    )
  })

  it('accepts a trial-shaped meal (slot present, no scheduledTime)', async () => {
    authedAs('user-1')
    prismaMock.plan.create.mockResolvedValue({ id: 'plan-1' })
    const plan = validPlan({
      dailyMeals: [{ day: 'Daily Meals', meals: [validMeal({ slot: 'pre_workout', scheduledTime: undefined })] }],
    })

    const res = await POST(jsonRequest({ goals: 'muscle_gain', plan }))

    expect(res.status).toBe(200)
  })

  it('rejects an invalid slot value', async () => {
    authedAs('user-1')
    const plan = validPlan({
      dailyMeals: [{ day: 'Daily Meals', meals: [validMeal({ slot: 'brunch' })] }],
    })

    const res = await POST(jsonRequest({ goals: 'muscle_gain', plan }))

    expect(res.status).toBe(400)
    expect(prismaMock.plan.create).not.toHaveBeenCalled()
  })

  it('recomputes scheduledTime server-side when the claiming user has a saved workout time', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ wakeTime: '07:00', workoutTime: '18:00', sleepTime: '22:00' })
    prismaMock.plan.create.mockResolvedValue({ id: 'plan-1' })
    const plan = validPlan({
      dailyMeals: [{ day: 'Daily Meals', meals: [validMeal({ slot: 'pre_workout', scheduledTime: null })] }],
    })

    await POST(jsonRequest({ goals: 'muscle_gain', plan }))

    const createArg = prismaMock.plan.create.mock.calls[0][0]
    expect(createArg.data.meals.create[0].scheduledTime).toBe('16:45')
  })

  it('persists scheduledTime as null when the claiming user has no saved schedule', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.plan.create.mockResolvedValue({ id: 'plan-1' })
    const plan = validPlan({
      dailyMeals: [{ day: 'Daily Meals', meals: [validMeal({ slot: 'pre_workout', scheduledTime: null })] }],
    })

    await POST(jsonRequest({ goals: 'muscle_gain', plan }))

    const createArg = prismaMock.plan.create.mock.calls[0][0]
    expect(createArg.data.meals.create[0].scheduledTime).toBeNull()
  })

  it('returns 500 with the error message when persistence fails', async () => {
    authedAs('user-1')
    prismaMock.plan.create.mockRejectedValue(new Error('db is down'))

    const res = await POST(jsonRequest({ goals: 'muscle_gain', plan: validPlan() }))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('db is down')
  })
})
