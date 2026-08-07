import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const VALID_STATUSES = ['as_planned', 'substituted', 'skipped']

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { planMealId, status, substituteFoodId, substituteQuantityG, date } = await request.json()

  if (!planMealId || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { success: false, error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  const planMeal = await prisma.planMeal.findUnique({
    where: { id: planMealId },
    include: { plan: true },
  })

  if (!planMeal || planMeal.plan.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Meal not found' }, { status: 404 })
  }

  if (status === 'substituted') {
    if (!substituteFoodId || !substituteQuantityG || substituteQuantityG <= 0) {
      return NextResponse.json(
        { success: false, error: 'substituteFoodId and a positive substituteQuantityG are required when substituted' },
        { status: 400 }
      )
    }

    const food = await prisma.food.findUnique({ where: { id: substituteFoodId } })
    if (!food) {
      return NextResponse.json({ success: false, error: 'Food not found' }, { status: 404 })
    }
  }

  const mealLog = await prisma.mealLog.create({
    data: {
      userId: session.user.id,
      planMealId,
      status,
      substituteFoodId: status === 'substituted' ? substituteFoodId : null,
      substituteQuantityG: status === 'substituted' ? substituteQuantityG : null,
      date: date || new Date().toISOString().split('T')[0],
    },
    include: { substituteFood: true },
  })

  let macroDiff = null
  if (status === 'substituted' && mealLog.substituteFood && mealLog.substituteQuantityG) {
    const factor = mealLog.substituteQuantityG / 100
    const substituteCalories = Math.round(mealLog.substituteFood.caloriesPer100g * factor)
    const substituteProtein = Math.round(mealLog.substituteFood.proteinPer100g * factor)
    const substituteCarbs = Math.round(mealLog.substituteFood.carbsPer100g * factor)
    const substituteFat = Math.round(mealLog.substituteFood.fatPer100g * factor)

    macroDiff = {
      calories: substituteCalories - planMeal.calories,
      protein: substituteProtein - planMeal.protein,
      carbs: substituteCarbs - planMeal.carbs,
      fat: substituteFat - planMeal.fat,
    }
  }

  return NextResponse.json({ success: true, data: { mealLog, macroDiff } })
}
