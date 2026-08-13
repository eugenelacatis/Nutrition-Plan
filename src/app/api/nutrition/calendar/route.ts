import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { computeOptimalScore, type ScoredLog } from '@/lib/nutrition/optimalScore'

const MONTH_PARAM_RE = /^\d{4}-\d{2}$/

interface CalendarDaySummary {
  date: string
  hasLog: boolean
  score: number | null
  weight: number | null
  sleepHours: number | null
  wakeTime: string | null
  digestionRating: number | null
  meals: { name: string; slot: string; status: string }[]
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const rawMonth = searchParams.get('month')
  const month = rawMonth || new Date().toISOString().slice(0, 7)

  if (!MONTH_PARAM_RE.test(month)) {
    return NextResponse.json(
      { success: false, error: 'month must be in YYYY-MM format' },
      { status: 400 }
    )
  }

  const [year, monthNum] = month.split('-').map(Number)
  const monthStart = `${month}-01`
  const monthEnd = `${month}-${String(daysInMonth(year, monthNum)).padStart(2, '0')}`

  const userId = session.user.id

  const [user, dailyLogs, mealLogs, priorLogs] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { goalDirection: true } }),
    prisma.dailyLog.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.mealLog.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      include: { planMeal: { select: { name: true, slot: true } } },
    }),
    prisma.dailyLog.findMany({
      where: { userId, date: { lt: monthStart } },
      orderBy: { date: 'desc' },
      take: 6,
    }),
  ])

  const logsByDate = new Map(dailyLogs.map((l) => [l.date, l]))

  const mealsByDate = new Map<string, { name: string; slot: string; status: string }[]>()
  for (const m of mealLogs) {
    const entry = mealsByDate.get(m.date) ?? []
    entry.push({ name: m.planMeal.name, slot: m.planMeal.slot, status: m.status })
    mealsByDate.set(m.date, entry)
  }

  // Combined, sorted oldest-first for windowing; each day's trailing-7 score
  // window is computed from this pool rather than the DB, avoiding N+1 queries.
  const allLogsSorted = [...priorLogs, ...dailyLogs].sort((a, b) => (a.date < b.date ? -1 : 1))

  const days: CalendarDaySummary[] = []
  for (let day = 1; day <= daysInMonth(year, monthNum); day++) {
    const date = `${month}-${String(day).padStart(2, '0')}`
    const log = logsByDate.get(date)

    let score: number | null = null
    if (log) {
      const windowNewestFirst: ScoredLog[] = allLogsSorted
        .filter((l) => l.date <= date)
        .slice(-7)
        .reverse()
      score = computeOptimalScore(windowNewestFirst, user?.goalDirection ?? null).score
    }

    days.push({
      date,
      hasLog: Boolean(log),
      score,
      weight: log?.weight ?? null,
      sleepHours: log?.sleepHours ?? null,
      wakeTime: log?.wakeTime ?? null,
      digestionRating: log?.digestionRating ?? null,
      meals: mealsByDate.get(date) ?? [],
    })
  }

  return NextResponse.json({ success: true, data: { month, days } })
}
