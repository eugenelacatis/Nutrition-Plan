import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { persistPlan } from '@/lib/nutrition/persistPlan'
import { computeMealTimes } from '@/lib/nutrition/mealTiming'
import type { MealPlan, Meal } from '@/lib/nutrition/nutritionAI'

const VALID_GOALS = ['weight_loss', 'muscle_gain', 'maintenance']
const VALID_SLOTS = ['breakfast', 'pre_workout', 'post_workout', 'lunch', 'dinner', 'snack']
const MAX_REASONABLE_VALUE = 20000
const MAX_DAYS = 14
const MAX_MEALS_PER_DAY = 20
const MAX_LIST_ITEMS = 30
const MAX_STRING_LENGTH = 500

function isValidStringList(value: any, maxItems: number): boolean {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every((item) => typeof item === 'string' && item.length <= MAX_STRING_LENGTH)
  )
}

function isValidMeal(meal: any): meal is Meal {
  return (
    typeof meal?.name === 'string' &&
    meal.name.length <= MAX_STRING_LENGTH &&
    VALID_SLOTS.includes(meal?.slot) &&
    (meal?.scheduledTime === null || meal?.scheduledTime === undefined || typeof meal?.scheduledTime === 'string') &&
    Number.isFinite(meal?.calories) &&
    meal.calories >= 0 &&
    meal.calories <= MAX_REASONABLE_VALUE &&
    Number.isFinite(meal?.protein) &&
    Number.isFinite(meal?.carbs) &&
    Number.isFinite(meal?.fat) &&
    isValidStringList(meal?.ingredients, MAX_LIST_ITEMS) &&
    isValidStringList(meal?.instructions, MAX_LIST_ITEMS) &&
    Number.isFinite(meal?.prepTime) &&
    Number.isFinite(meal?.cookTime)
  )
}

function isValidPlan(plan: any): plan is MealPlan {
  return (
    typeof plan?.name === 'string' &&
    plan.name.length <= MAX_STRING_LENGTH &&
    typeof plan?.description === 'string' &&
    plan.description.length <= MAX_STRING_LENGTH &&
    Array.isArray(plan?.dailyMeals) &&
    plan.dailyMeals.length > 0 &&
    plan.dailyMeals.length <= MAX_DAYS &&
    plan.dailyMeals.every(
      (d: any) =>
        typeof d?.day === 'string' &&
        d.day.length <= MAX_STRING_LENGTH &&
        Array.isArray(d?.meals) &&
        d.meals.length <= MAX_MEALS_PER_DAY &&
        d.meals.every(isValidMeal)
    ) &&
    Number.isFinite(plan?.totalCalories) &&
    plan.totalCalories >= 0 &&
    plan.totalCalories <= MAX_REASONABLE_VALUE &&
    Number.isFinite(plan?.totalProtein) &&
    Number.isFinite(plan?.totalCarbs) &&
    Number.isFinite(plan?.totalFat)
  )
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { goals, plan } = await request.json()

  if (!goals || !VALID_GOALS.includes(goals)) {
    return NextResponse.json(
      { success: false, error: `Goals must be one of: ${VALID_GOALS.join(', ')}` },
      { status: 400 }
    )
  }

  if (!isValidPlan(plan)) {
    return NextResponse.json({ success: false, error: 'Invalid plan payload' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { wakeTime: true, workoutTime: true, sleepTime: true },
    })

    const dailyMeals = user?.workoutTime
      ? plan.dailyMeals.map((dailyMeal: MealPlan['dailyMeals'][number]) => {
          const scheduledTimes = computeMealTimes(dailyMeal.meals, user)
          return {
            ...dailyMeal,
            meals: dailyMeal.meals.map((meal, i) => ({ ...meal, scheduledTime: scheduledTimes[i] })),
          }
        })
      : plan.dailyMeals

    const savedPlan = await persistPlan(session.user.id, {
      ...plan,
      dailyMeals,
      aiGenerated: Boolean(plan.aiGenerated),
    })

    return NextResponse.json({ success: true, data: savedPlan })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
