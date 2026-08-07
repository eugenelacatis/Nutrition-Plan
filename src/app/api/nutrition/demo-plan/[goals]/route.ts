import { NextResponse } from 'next/server'
import nutritionAI from '@/lib/nutrition/nutritionAI'

export async function GET(
  request: Request,
  { params }: { params: { goals: string } }
) {
  try {
    const mealPlan = nutritionAI.generateDemoMealPlan(params.goals || 'muscle_gain')
    return NextResponse.json({ success: true, data: mealPlan })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
