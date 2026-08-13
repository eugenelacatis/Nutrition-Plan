import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

const SCHEDULE_FIELDS = ['wakeTime', 'workoutTime', 'workStart', 'workEnd', 'sleepTime'] as const

function isValidTime(v: unknown): v is string {
  return typeof v === 'string' && TIME_REGEX.test(v)
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { wakeTime: true, workoutTime: true, workStart: true, workEnd: true, sleepTime: true },
  })

  return NextResponse.json({ success: true, data: user })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const data: Record<string, string | null> = {}

  for (const field of SCHEDULE_FIELDS) {
    if (!(field in body)) continue

    const value = body[field]
    if (value !== null && !isValidTime(value)) {
      return NextResponse.json(
        { success: false, error: `${field} must be a valid HH:MM time or null` },
        { status: 400 }
      )
    }
    data[field] = value
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { wakeTime: true, workoutTime: true, workStart: true, workEnd: true, sleepTime: true },
  })

  return NextResponse.json({ success: true, data: user })
}
