import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const plan = await prisma.plan.findUnique({
    where: { id: params.id },
    include: { meals: { include: { mealLogs: true } } },
  })

  if (!plan || plan.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: plan })
}
