import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const logs = await prisma.dailyLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 7,
  })

  if (logs.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        score: 0,
        recommendations: ['Start logging your daily metrics to get personalized recommendations'],
        factors: {
          sleep: { score: 0, weight: 0.4 },
          digestion: { score: 0, weight: 0.3 },
          weight: { score: 0, weight: 0.3 },
        },
      },
    })
  }

  const avgSleepHours = logs.reduce((sum, log) => sum + log.sleepHours, 0) / logs.length
  const sleepScore =
    avgSleepHours >= 7 && avgSleepHours <= 9 ? 100 : avgSleepHours >= 6 && avgSleepHours <= 10 ? 70 : 40

  const avgDigestion = logs.reduce((sum, log) => sum + log.digestionRating, 0) / logs.length
  const digestionScore = avgDigestion >= 4 ? 100 : avgDigestion >= 3 ? 70 : 40

  const weightScore = 70

  const overallScore = Math.round(sleepScore * 0.4 + digestionScore * 0.3 + weightScore * 0.3)

  const recommendations: string[] = []
  if (sleepScore < 70) recommendations.push('Focus on getting 7-9 hours of sleep consistently')
  if (digestionScore < 70) recommendations.push('Consider tracking which foods affect your digestion')
  if (overallScore < 70) recommendations.push('Prioritize sleep and digestion for better results')

  return NextResponse.json({
    success: true,
    data: {
      score: overallScore,
      recommendations,
      factors: {
        sleep: { score: sleepScore, weight: 0.4 },
        digestion: { score: digestionScore, weight: 0.3 },
        weight: { score: weightScore, weight: 0.3 },
      },
    },
  })
}
