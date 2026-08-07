import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '30')

  const logs = await prisma.dailyLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ success: true, data: logs })
}
