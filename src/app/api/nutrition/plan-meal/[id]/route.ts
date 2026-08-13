import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { scheduledTime, sortOrder } = await request.json()

  if (scheduledTime !== undefined && scheduledTime !== null && !TIME_REGEX.test(scheduledTime)) {
    return NextResponse.json(
      { success: false, error: 'scheduledTime must be a valid HH:MM time or null' },
      { status: 400 }
    )
  }

  if (sortOrder !== undefined && (!Number.isInteger(sortOrder) || sortOrder < 0)) {
    return NextResponse.json(
      { success: false, error: 'sortOrder must be a non-negative integer' },
      { status: 400 }
    )
  }

  const planMeal = await prisma.planMeal.findUnique({
    where: { id: params.id },
    include: { plan: { select: { userId: true } } },
  })

  if (!planMeal || planMeal.plan.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Meal not found' }, { status: 404 })
  }

  const updated = await prisma.planMeal.update({
    where: { id: params.id },
    data: {
      ...(scheduledTime !== undefined && { scheduledTime }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  })

  return NextResponse.json({ success: true, data: updated })
}
