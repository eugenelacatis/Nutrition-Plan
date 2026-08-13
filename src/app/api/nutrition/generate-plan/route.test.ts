import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/test/prismaMock'

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/nutrition/nutritionAI', () => ({
  default: { generateMealPlan: vi.fn(), generateDemoMealPlan: vi.fn() },
}))
vi.mock('@/lib/nutrition/persistPlan', () => ({ persistPlan: vi.fn() }))

import { auth } from '@/auth'
import nutritionAI from '@/lib/nutrition/nutritionAI'
import { persistPlan } from '@/lib/nutrition/persistPlan'
import { POST } from './route'

const mockAuth = vi.mocked(auth)
const mockGenerate = vi.mocked(nutritionAI.generateMealPlan)
const mockPersist = vi.mocked(persistPlan)

function authedAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } } as any)
}

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/nutrition/generate-plan', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const FAKE_PLAN = { id: 'plan-1', dailyMeals: [] } as any

beforeEach(() => {
  resetPrismaMock()
  mockAuth.mockReset()
  mockGenerate.mockReset()
  mockPersist.mockReset()
})

describe('POST /api/nutrition/generate-plan', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await POST(jsonRequest({ goals: 'muscle_gain' }))

    expect(res.status).toBe(401)
    expect(mockGenerate).not.toHaveBeenCalled()
  })

  it('rejects an invalid goals value', async () => {
    authedAs('user-1')

    const res = await POST(jsonRequest({ goals: 'shred_fast' }))

    expect(res.status).toBe(400)
    expect(mockGenerate).not.toHaveBeenCalled()
  })

  it("fetches the user's schedule and passes it as generateMealPlan's third argument", async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({
      wakeTime: '07:00',
      workoutTime: '18:00',
      workStart: '09:00',
      workEnd: '17:00',
      sleepTime: '22:00',
    })
    mockGenerate.mockResolvedValue(FAKE_PLAN)
    mockPersist.mockResolvedValue(FAKE_PLAN)

    await POST(jsonRequest({ goals: 'muscle_gain', restrictions: [] }))

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } })
    )
    expect(mockGenerate).toHaveBeenCalledWith(
      'muscle_gain',
      [],
      expect.objectContaining({ workoutTime: '18:00', hasWorkout: true }),
      undefined,
      expect.anything()
    )
  })

  it('passes hasWorkout: false when the request marks it a rest day', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({
      wakeTime: '07:00',
      workoutTime: '18:00',
      workStart: null,
      workEnd: null,
      sleepTime: '22:00',
    })
    mockGenerate.mockResolvedValue(FAKE_PLAN)
    mockPersist.mockResolvedValue(FAKE_PLAN)

    await POST(jsonRequest({ goals: 'muscle_gain', hasWorkout: false }))

    expect(mockGenerate).toHaveBeenCalledWith(
      'muscle_gain',
      [],
      expect.objectContaining({ hasWorkout: false }),
      undefined,
      expect.anything()
    )
  })

  it("passes the client's macroTargets through as generateMealPlan's fourth argument", async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue(null)
    mockGenerate.mockResolvedValue(FAKE_PLAN)
    mockPersist.mockResolvedValue(FAKE_PLAN)

    const macroTargets = { calories: 3100, protein: 220, carbs: 380, fat: 75 }
    await POST(jsonRequest({ goals: 'muscle_gain', macroTargets }))

    // user lookup resolves null in this test, so hasWorkout still defaults true and personalization is undefined.
    expect(mockGenerate).toHaveBeenCalledWith(
      'muscle_gain',
      [],
      { hasWorkout: true },
      macroTargets,
      undefined
    )
  })

  it("fetches and passes the user's personalization preferences as generateMealPlan's fifth argument", async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({
      notes: 'I hate fish',
      mealCountPref: '6+',
      cookTimePref: null,
      proteinPref: null,
    })
    mockGenerate.mockResolvedValue(FAKE_PLAN)
    mockPersist.mockResolvedValue(FAKE_PLAN)

    await POST(jsonRequest({ goals: 'muscle_gain' }))

    expect(mockGenerate).toHaveBeenCalledWith(
      'muscle_gain',
      [],
      expect.anything(),
      undefined,
      expect.objectContaining({ notes: 'I hate fish', mealCountPref: '6+' })
    )
  })

  it('rejects macroTargets with a non-finite value', async () => {
    authedAs('user-1')

    const res = await POST(
      jsonRequest({ goals: 'muscle_gain', macroTargets: { calories: NaN, protein: 200, carbs: 300, fat: 75 } })
    )

    expect(res.status).toBe(400)
    expect(mockGenerate).not.toHaveBeenCalled()
  })

  it('rejects macroTargets with a non-positive value', async () => {
    authedAs('user-1')

    const res = await POST(
      jsonRequest({ goals: 'muscle_gain', macroTargets: { calories: 3000, protein: 0, carbs: 300, fat: 75 } })
    )

    expect(res.status).toBe(400)
    expect(mockGenerate).not.toHaveBeenCalled()
  })

  it('rejects macroTargets with an absurdly large value', async () => {
    authedAs('user-1')

    const res = await POST(
      jsonRequest({ goals: 'muscle_gain', macroTargets: { calories: 999999, protein: 200, carbs: 300, fat: 75 } })
    )

    expect(res.status).toBe(400)
    expect(mockGenerate).not.toHaveBeenCalled()
  })

  it('persists the generated plan for the authenticated user', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue(null)
    mockGenerate.mockResolvedValue(FAKE_PLAN)
    mockPersist.mockResolvedValue({ id: 'saved-1' } as any)

    const res = await POST(jsonRequest({ goals: 'muscle_gain' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(mockPersist).toHaveBeenCalledWith('user-1', FAKE_PLAN)
    expect(body.data).toEqual({ id: 'saved-1' })
  })
})
