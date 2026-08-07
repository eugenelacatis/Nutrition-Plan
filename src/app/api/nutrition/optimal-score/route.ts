import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Least-squares slope of weight over the log sequence (lbs per log entry).
// Logs are passed oldest-first.
function weightTrendSlope(logs: { weight: number }[]): number {
  const n = logs.length
  if (n < 2) return 0

  const xs = logs.map((_, i) => i)
  const ys = logs.map((log) => log.weight)
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let denominator = 0
  for (let i = 0; i < n; i++) {
    numerator += (xs[i] - meanX) * (ys[i] - meanY)
    denominator += (xs[i] - meanX) ** 2
  }

  return denominator === 0 ? 0 : numerator / denominator
}

function calculateWeightScore(
  logs: { weight: number }[],
  goalDirection: string | null
): number {
  if (logs.length < 2) return 50 // not enough data to judge a trend yet

  const slope = weightTrendSlope(logs)

  if (!goalDirection || goalDirection === 'maintain') {
    // Reward stability: smaller absolute slope is better.
    const magnitude = Math.abs(slope)
    if (magnitude <= 0.1) return 100
    if (magnitude <= 0.3) return 70
    return 40
  }

  const expectedSign = goalDirection === 'lose' ? -1 : 1
  const isOnTrack = Math.sign(slope) === expectedSign || slope === 0
  const magnitude = Math.abs(slope)

  if (!isOnTrack) return 40
  // Reward steady, moderate progress over erratic swings.
  if (magnitude >= 0.05 && magnitude <= 0.5) return 100
  if (magnitude < 0.05) return 60 // on track but very slow
  return 70 // on track but aggressive — still progress, slightly discounted
}

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

  // Logs come back newest-first; the trend calculation needs oldest-first.
  const weightScore = calculateWeightScore([...logs].reverse(), user?.goalDirection ?? null)

  const overallScore = Math.round(sleepScore * 0.4 + digestionScore * 0.3 + weightScore * 0.3)

  const recommendations: string[] = []
  if (sleepScore < 70) recommendations.push('Focus on getting 7-9 hours of sleep consistently')
  if (digestionScore < 70) recommendations.push('Consider tracking which foods affect your digestion')
  if (weightScore < 70 && user?.goalDirection) {
    recommendations.push(
      `Your weight trend isn't tracking toward your ${user.goalDirection} goal — review your adherence`
    )
  } else if (weightScore < 70) {
    recommendations.push('Set a weight goal to get trend-based recommendations')
  }
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
