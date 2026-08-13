import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/test/prismaMock'

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/nutrition/nutritionAI', () => ({
  default: { generateMealPlan: vi.fn() },
}))

import nutritionAI from '@/lib/nutrition/nutritionAI'
import { getTrialPlan } from './trialPlanCache'

const mockGenerate = vi.mocked(nutritionAI.generateMealPlan)

function fakePlan(id: string) {
  return { id, name: `Plan ${id}`, dailyMeals: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, description: '', created_at: '', aiGenerated: true }
}

beforeEach(() => {
  resetPrismaMock()
  mockGenerate.mockReset()
})

describe('getTrialPlan', () => {
  it('serves a plan from an existing DB pool without calling the AI', async () => {
    const pool = [fakePlan('a'), fakePlan('b'), fakePlan('c')]
    prismaMock.trialPlanPool.findUnique.mockResolvedValue({ goal: 'muscle_gain', plans: JSON.stringify(pool) })

    const plan = await getTrialPlan('muscle_gain')

    expect(mockGenerate).not.toHaveBeenCalled()
    expect(pool.map((p) => p.id)).toContain(plan.id)
  })

  it('generates a pool of exactly 3 plans on a cache miss', async () => {
    prismaMock.trialPlanPool.findUnique.mockResolvedValue(null)
    mockGenerate.mockImplementation(async () => fakePlan(Math.random().toString()))
    prismaMock.trialPlanPool.upsert.mockResolvedValue({})

    await getTrialPlan('weight_loss')

    expect(mockGenerate).toHaveBeenCalledTimes(3)
    expect(mockGenerate).toHaveBeenCalledWith('weight_loss', [])
  })

  it('persists the generated pool to the database on a cache miss', async () => {
    prismaMock.trialPlanPool.findUnique.mockResolvedValue(null)
    mockGenerate.mockImplementation(async () => fakePlan('x'))
    prismaMock.trialPlanPool.upsert.mockResolvedValue({})

    await getTrialPlan('weight_loss')

    expect(prismaMock.trialPlanPool.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { goal: 'weight_loss' },
        create: expect.objectContaining({ goal: 'weight_loss' }),
      })
    )
    const createArg = prismaMock.trialPlanPool.upsert.mock.calls[0][0].create
    const persisted = JSON.parse(createArg.plans)
    expect(persisted).toHaveLength(3)
  })

  it('deduplicates concurrent requests for the same goal into a single pool build', async () => {
    prismaMock.trialPlanPool.findUnique.mockResolvedValue(null)
    let calls = 0
    mockGenerate.mockImplementation(async () => {
      calls++
      return fakePlan(String(calls))
    })
    prismaMock.trialPlanPool.upsert.mockResolvedValue({})

    // Two concurrent callers for the same goal, before either has finished.
    const [a, b] = await Promise.all([getTrialPlan('maintenance'), getTrialPlan('maintenance')])

    // Only one pool (3 plans) should have been generated in total, not two (6).
    expect(mockGenerate).toHaveBeenCalledTimes(3)
    expect(a).toBeDefined()
    expect(b).toBeDefined()
  })

  it('never passes a schedule argument to generateMealPlan (cost-safety regression guard)', async () => {
    prismaMock.trialPlanPool.findUnique.mockResolvedValue(null)
    mockGenerate.mockImplementation(async () => fakePlan('x'))
    prismaMock.trialPlanPool.upsert.mockResolvedValue({})

    await getTrialPlan('muscle_gain')

    for (const call of mockGenerate.mock.calls) {
      expect(call).toHaveLength(2)
      expect(call[2]).toBeUndefined()
    }
  })

  it('does not call the AI again for a second request once the pool is persisted', async () => {
    prismaMock.trialPlanPool.findUnique
      .mockResolvedValueOnce(null) // first call: cache miss
      .mockResolvedValueOnce({ goal: 'maintenance', plans: JSON.stringify([fakePlan('a')]) }) // second call: hit
    mockGenerate.mockImplementation(async () => fakePlan('a'))
    prismaMock.trialPlanPool.upsert.mockResolvedValue({})

    await getTrialPlan('maintenance')
    mockGenerate.mockClear()
    await getTrialPlan('maintenance')

    expect(mockGenerate).not.toHaveBeenCalled()
  })
})
