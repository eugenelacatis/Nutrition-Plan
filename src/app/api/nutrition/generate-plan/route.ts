import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import nutritionAI from '@/lib/nutrition/nutritionAI'
import { persistPlan } from '@/lib/nutrition/persistPlan'
import { prisma } from '@/lib/prisma'

const VALID_GOALS = ['weight_loss', 'muscle_gain', 'maintenance']
const MAX_REASONABLE_VALUE = 20000

function isValidMacroTargets(value: any): value is { calories: number; protein: number; carbs: number; fat: number } {
  if (value === undefined || value === null) return true
  const fields = ['calories', 'protein', 'carbs', 'fat'] as const
  return fields.every(
    (field) => Number.isFinite(value?.[field]) && value[field] > 0 && value[field] <= MAX_REASONABLE_VALUE
  )
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { goals, restrictions, hasWorkout, macroTargets } = await request.json()

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

  if (!isValidMacroTargets(macroTargets)) {
    return NextResponse.json(
      { success: false, error: 'macroTargets must have positive, finite calories/protein/carbs/fat' },
      { status: 400 }
    )
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        wakeTime: true,
        workoutTime: true,
        workStart: true,
        workEnd: true,
        sleepTime: true,
        notes: true,
        mealCountPref: true,
        cookTimePref: true,
        proteinPref: true,
      },
    })

    const mealPlan = await nutritionAI.generateMealPlan(
      goals,
      restrictions || [],
      { ...user, hasWorkout: hasWorkout !== false },
      macroTargets ?? undefined,
      user ?? undefined
    )
    const savedPlan = await persistPlan(session.user.id, mealPlan)

    return NextResponse.json({ success: true, data: savedPlan })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
