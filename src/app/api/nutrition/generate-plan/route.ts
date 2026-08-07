import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import nutritionAI from '@/lib/nutrition/nutritionAI'

const VALID_GOALS = ['weight_loss', 'muscle_gain', 'maintenance']

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { goals, restrictions } = await request.json()

  if (!goals || !VALID_GOALS.includes(goals)) {
    return NextResponse.json(
      { success: false, error: `Goals must be one of: ${VALID_GOALS.join(', ')}` },
      { status: 400 }
    )
  }

  if (restrictions && (!Array.isArray(restrictions) || restrictions.length > 10)) {
    return NextResponse.json(
      { success: false, error: 'Restrictions must be an array of at most 10 items' },
      { status: 400 }
    )
  }

  try {
    const mealPlan = await nutritionAI.generateMealPlan(goals, restrictions || [])

    const savedPlan = await prisma.plan.create({
      data: {
        userId: session.user.id,
        name: mealPlan.name,
        description: mealPlan.description,
        totalCalories: mealPlan.totalCalories,
        totalProtein: mealPlan.totalProtein,
        totalCarbs: mealPlan.totalCarbs,
        totalFat: mealPlan.totalFat,
        aiGenerated: mealPlan.aiGenerated,
        meals: {
          create: mealPlan.dailyMeals.flatMap((dailyMeal) =>
            dailyMeal.meals.map((meal) => ({
              day: dailyMeal.day,
              name: meal.name,
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat,
              ingredients: JSON.stringify(meal.ingredients),
              instructions: JSON.stringify(meal.instructions),
              prepTime: meal.prepTime,
              cookTime: meal.cookTime,
            }))
          ),
        },
      },
      include: { meals: true },
    })

    return NextResponse.json({ success: true, data: savedPlan })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
