import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/test/prismaMock'

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

import { persistPlan } from './persistPlan'
import type { MealPlan } from './nutritionAI'

beforeEach(() => {
  resetPrismaMock()
})

function fakePlan(): MealPlan {
  return {
    id: 'plan-1',
    name: 'Muscle Gain Plan',
    description: 'desc',
    dailyMeals: [
      {
        day: 'Daily Meals',
        meals: [
          {
            name: 'Breakfast',
            slot: 'breakfast',
            scheduledTime: '07:30',
            calories: 400,
            protein: 30,
            carbs: 40,
            fat: 10,
            ingredients: ['eggs'],
            instructions: ['cook'],
            prepTime: 5,
            cookTime: 10,
          },
          {
            name: 'Pre-Workout Shake',
            slot: 'pre_workout',
            scheduledTime: '15:45',
            calories: 300,
            protein: 25,
            carbs: 30,
            fat: 8,
            ingredients: ['whey'],
            instructions: ['blend'],
            prepTime: 5,
            cookTime: 0,
          },
        ],
      },
    ],
    totalCalories: 700,
    totalProtein: 55,
    totalCarbs: 70,
    totalFat: 18,
    created_at: '2026-01-01T00:00:00.000Z',
    aiGenerated: true,
  }
}

describe('persistPlan', () => {
  it('persists slot, scheduledTime, and sortOrder matching array order for each meal', async () => {
    prismaMock.plan.create.mockResolvedValue({ id: 'saved-plan-1' })

    await persistPlan('user-1', fakePlan())

    const createArg = prismaMock.plan.create.mock.calls[0][0]
    const meals = createArg.data.meals.create

    expect(meals[0]).toMatchObject({ slot: 'breakfast', scheduledTime: '07:30', sortOrder: 0 })
    expect(meals[1]).toMatchObject({ slot: 'pre_workout', scheduledTime: '15:45', sortOrder: 1 })
  })
})
