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
  return new Request('http://localhost/api/nutrition/meal-log', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const PLANNED_MEAL = {
  id: 'meal-1',
  planId: 'plan-1',
  calories: 500,
  protein: 40,
  carbs: 50,
  fat: 15,
  plan: { id: 'plan-1', userId: 'user-1' },
}

beforeEach(() => {
  resetPrismaMock()
  mockAuth.mockReset()
})

describe('POST /api/nutrition/meal-log', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await POST(jsonRequest({ planMealId: 'meal-1', status: 'as_planned' }))

    expect(res.status).toBe(401)
  })

  it('rejects an invalid status value', async () => {
    authedAs('user-1')

    const res = await POST(jsonRequest({ planMealId: 'meal-1', status: 'ate_it_all' }))

    expect(res.status).toBe(400)
    expect(prismaMock.mealLog.create).not.toHaveBeenCalled()
  })

  it('rejects a missing planMealId', async () => {
    authedAs('user-1')

    const res = await POST(jsonRequest({ status: 'as_planned' }))

    expect(res.status).toBe(400)
  })

  it('returns 404 when the plan meal does not belong to the requesting user', async () => {
    authedAs('attacker')
    prismaMock.planMeal.findUnique.mockResolvedValue(PLANNED_MEAL) // owned by user-1

    const res = await POST(jsonRequest({ planMealId: 'meal-1', status: 'as_planned' }))

    expect(res.status).toBe(404)
    expect(prismaMock.mealLog.create).not.toHaveBeenCalled()
  })

  it('returns 404 when the plan meal does not exist', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(null)

    const res = await POST(jsonRequest({ planMealId: 'does-not-exist', status: 'as_planned' }))

    expect(res.status).toBe(404)
  })

  it('logs an as-planned meal with no macro diff', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(PLANNED_MEAL)
    prismaMock.mealLog.create.mockResolvedValue({
      id: 'log-1',
      status: 'as_planned',
      substituteFood: null,
      substituteQuantityG: null,
    })

    const res = await POST(jsonRequest({ planMealId: 'meal-1', status: 'as_planned' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.macroDiff).toBeNull()
    expect(prismaMock.mealLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'as_planned',
          substituteFoodId: null,
          substituteQuantityG: null,
        }),
      })
    )
  })

  it('logs a skipped meal with no macro diff', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(PLANNED_MEAL)
    prismaMock.mealLog.create.mockResolvedValue({
      id: 'log-1',
      status: 'skipped',
      substituteFood: null,
      substituteQuantityG: null,
    })

    const res = await POST(jsonRequest({ planMealId: 'meal-1', status: 'skipped' }))
    const body = await res.json()

    expect(body.data.macroDiff).toBeNull()
  })

  it('rejects a substitution missing substituteFoodId or quantity', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(PLANNED_MEAL)

    const res = await POST(
      jsonRequest({ planMealId: 'meal-1', status: 'substituted', substituteFoodId: null, substituteQuantityG: 150 })
    )

    expect(res.status).toBe(400)
    expect(prismaMock.mealLog.create).not.toHaveBeenCalled()
  })

  it('rejects a substitution with a non-positive quantity', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(PLANNED_MEAL)

    const res = await POST(
      jsonRequest({ planMealId: 'meal-1', status: 'substituted', substituteFoodId: 'food-1', substituteQuantityG: 0 })
    )

    expect(res.status).toBe(400)
  })

  it('returns 404 when the substitute food does not exist', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(PLANNED_MEAL)
    prismaMock.food.findUnique.mockResolvedValue(null)

    const res = await POST(
      jsonRequest({
        planMealId: 'meal-1',
        status: 'substituted',
        substituteFoodId: 'ghost-food',
        substituteQuantityG: 150,
      })
    )

    expect(res.status).toBe(404)
    expect(prismaMock.mealLog.create).not.toHaveBeenCalled()
  })

  it('computes macroDiff as substitute macros (scaled by quantity/100) minus the planned meal macros', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(PLANNED_MEAL)
    prismaMock.food.findUnique.mockResolvedValue({
      id: 'food-1',
      caloriesPer100g: 200,
      proteinPer100g: 20,
      carbsPer100g: 10,
      fatPer100g: 5,
    })

    const substituteFood = {
      caloriesPer100g: 200,
      proteinPer100g: 20,
      carbsPer100g: 10,
      fatPer100g: 5,
    }
    // 150g of the substitute food -> factor 1.5
    prismaMock.mealLog.create.mockResolvedValue({
      id: 'log-1',
      status: 'substituted',
      substituteFood,
      substituteQuantityG: 150,
    })

    const res = await POST(
      jsonRequest({
        planMealId: 'meal-1',
        status: 'substituted',
        substituteFoodId: 'food-1',
        substituteQuantityG: 150,
      })
    )
    const body = await res.json()

    // Substitute at 150g: calories 300, protein 30, carbs 15, fat 7.5->8 (rounded)
    // Planned meal: calories 500, protein 40, carbs 50, fat 15
    expect(body.data.macroDiff).toEqual({
      calories: 300 - 500,
      protein: 30 - 40,
      carbs: 15 - 50,
      fat: 8 - 15,
    })
  })

  it('persists the substitute food id and quantity on the meal log when substituted', async () => {
    authedAs('user-1')
    prismaMock.planMeal.findUnique.mockResolvedValue(PLANNED_MEAL)
    prismaMock.food.findUnique.mockResolvedValue({
      id: 'food-1',
      caloriesPer100g: 100,
      proteinPer100g: 10,
      carbsPer100g: 10,
      fatPer100g: 5,
    })
    prismaMock.mealLog.create.mockResolvedValue({
      id: 'log-1',
      status: 'substituted',
      substituteFood: { caloriesPer100g: 100, proteinPer100g: 10, carbsPer100g: 10, fatPer100g: 5 },
      substituteQuantityG: 100,
    })

    await POST(
      jsonRequest({
        planMealId: 'meal-1',
        status: 'substituted',
        substituteFoodId: 'food-1',
        substituteQuantityG: 100,
      })
    )

    expect(prismaMock.mealLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          planMealId: 'meal-1',
          status: 'substituted',
          substituteFoodId: 'food-1',
          substituteQuantityG: 100,
        }),
      })
    )
  })
})
