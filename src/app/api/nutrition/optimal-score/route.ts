import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { computeOptimalScore } from '@/lib/nutrition/optimalScore'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { goalDirection: true },
  })

  const logs = await prisma.dailyLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 7,
  })

  const result = computeOptimalScore(logs, user?.goalDirection ?? null)

  return NextResponse.json({ success: true, data: result })
}
