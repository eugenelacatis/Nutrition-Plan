import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { resolveTrendRange, type TrendRange } from '@/lib/dateRange'

const VALID_RANGES: TrendRange[] = ['90d', '6m', '1y']

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const rawRange = searchParams.get('range')
  const range = (rawRange || '90d') as TrendRange

  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json(
      { success: false, error: 'range must be one of 90d, 6m, 1y' },
      { status: 400 }
    )
  }

  const userId = session.user.id
  const { start, end } = resolveTrendRange(range)

  const logs = await prisma.dailyLog.findMany({
    where: { userId, date: { gte: start, lte: end } },
    orderBy: { date: 'asc' },
    select: { date: true, weight: true, sleepHours: true, digestionRating: true },
  })

  return NextResponse.json({ success: true, data: { range, start, end, logs } })
}
