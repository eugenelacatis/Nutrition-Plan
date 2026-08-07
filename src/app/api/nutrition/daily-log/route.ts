import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { weight, sleepHours, wakeTime, digestionRating, date } = await request.json()

  if (!weight || !sleepHours || !wakeTime || !digestionRating) {
    return NextResponse.json(
      {
        success: false,
        error: 'Weight, sleep hours, wake time, and digestion rating are required',
      },
      { status: 400 }
    )
  }

  if (digestionRating < 1 || digestionRating > 5) {
    return NextResponse.json(
      { success: false, error: 'Digestion rating must be between 1 and 5' },
      { status: 400 }
    )
  }

  const dailyLog = await prisma.dailyLog.create({
    data: {
      userId: session.user.id,
      weight: parseFloat(weight),
      sleepHours: parseFloat(sleepHours),
      wakeTime,
      digestionRating: parseInt(digestionRating),
      date: date || new Date().toISOString().split('T')[0],
    },
  })

  return NextResponse.json({ success: true, data: dailyLog })
}
