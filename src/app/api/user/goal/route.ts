import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const VALID_DIRECTIONS = ['lose', 'gain', 'maintain']
const VALID_WEIGHT_UNITS = ['lbs', 'kg']

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { goalWeight: true, goalDirection: true, weightUnit: true },
  })

  return NextResponse.json({ success: true, data: user })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { goalWeight, goalDirection, weightUnit } = await request.json()

  if (goalDirection && !VALID_DIRECTIONS.includes(goalDirection)) {
    return NextResponse.json(
      { success: false, error: `goalDirection must be one of: ${VALID_DIRECTIONS.join(', ')}` },
      { status: 400 }
    )
  }

  if (goalWeight !== undefined && goalWeight !== null && (typeof goalWeight !== 'number' || goalWeight <= 0)) {
    return NextResponse.json(
      { success: false, error: 'goalWeight must be a positive number' },
      { status: 400 }
    )
  }

  if (weightUnit !== undefined && weightUnit !== null && !VALID_WEIGHT_UNITS.includes(weightUnit)) {
    return NextResponse.json(
      { success: false, error: `weightUnit must be one of: ${VALID_WEIGHT_UNITS.join(', ')}` },
      { status: 400 }
    )
  }

  const data: Record<string, unknown> = { goalWeight, goalDirection }
  if (weightUnit !== undefined) data.weightUnit = weightUnit

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { goalWeight: true, goalDirection: true, weightUnit: true },
  })

  return NextResponse.json({ success: true, data: user })
}
