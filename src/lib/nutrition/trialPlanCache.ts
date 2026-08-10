import nutritionAI, { type MealPlan } from '@/lib/nutrition/nutritionAI'
import { prisma } from '@/lib/prisma'

const POOL_SIZE = 3

// De-duplicates concurrent requests within a single running process only.
// The database row (not this map) is the actual durability guarantee —
// this exists purely so two simultaneous requests for the same goal don't
// both race to build a pool before either has written to the DB.
const pending = new Map<string, Promise<MealPlan[]>>()

async function buildPool(goal: string): Promise<MealPlan[]> {
  const plans = await Promise.all(
    Array.from({ length: POOL_SIZE }, () => nutritionAI.generateMealPlan(goal, []))
  )
  return plans
}

/**
 * Anonymous trial requests never trigger a fresh AI call per visitor. A
 * small pool of real AI plans is generated once per goal, ever, and
 * persisted to the database — NOT kept only in memory, since in-memory
 * state resets on every server restart (dev) or cold start (serverless),
 * which would otherwise silently re-trigger real API spend on each restart.
 */
export async function getTrialPlan(goal: string): Promise<MealPlan> {
  const existing = await prisma.trialPlanPool.findUnique({ where: { goal } })
  if (existing) {
    const pool = JSON.parse(existing.plans) as MealPlan[]
    return pool[Math.floor(Math.random() * pool.length)]
  }

  let inFlight = pending.get(goal)
  if (!inFlight) {
    inFlight = buildPool(goal)
    pending.set(goal, inFlight)
  }

  try {
    const pool = await inFlight

    // Another request may have already written this goal's row while we
    // were generating (a race across two processes/instances) — upsert
    // rather than create so we don't crash on a duplicate unique key.
    await prisma.trialPlanPool.upsert({
      where: { goal },
      create: { goal, plans: JSON.stringify(pool) },
      update: {},
    })

    return pool[Math.floor(Math.random() * pool.length)]
  } finally {
    pending.delete(goal)
  }
}
