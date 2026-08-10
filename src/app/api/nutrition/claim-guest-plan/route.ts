import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { persistPlan } from '@/lib/nutrition/persistPlan'
import type { MealPlan, Meal } from '@/lib/nutrition/nutritionAI'

const VALID_GOALS = ['weight_loss', 'muscle_gain', 'maintenance']
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
    const savedPlan = await persistPlan(session.user.id, {
      ...plan,
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
