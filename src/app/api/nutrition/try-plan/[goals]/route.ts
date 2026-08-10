import { NextResponse } from 'next/server'
import { getTrialPlan } from '@/lib/nutrition/trialPlanCache'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const VALID_GOALS = ['weight_loss', 'muscle_gain', 'maintenance']

export async function GET(
  request: Request,
  { params }: { params: { goals: string } }
) {
  if (!VALID_GOALS.includes(params.goals)) {
    return NextResponse.json(
      { success: false, error: `Goals must be one of: ${VALID_GOALS.join(', ')}` },
      { status: 400 }
    )
  }

  const ip = getClientIp(request)
  // Generous per-IP cap since this now serves from a small cached pool
  // rather than making a fresh AI call per request.
  const allowed = checkRateLimit(`try-plan:${ip}`, 20, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many trial plans generated. Try again later.' },
      { status: 429 }
    )
  }

  try {
    const mealPlan = await getTrialPlan(params.goals)
    return NextResponse.json({ success: true, data: mealPlan })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
