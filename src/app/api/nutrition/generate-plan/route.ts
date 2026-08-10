import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import nutritionAI from '@/lib/nutrition/nutritionAI'
import { persistPlan } from '@/lib/nutrition/persistPlan'

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
    const savedPlan = await persistPlan(session.user.id, mealPlan)

    return NextResponse.json({ success: true, data: savedPlan })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
