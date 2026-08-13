import { vi } from 'vitest'

// A hand-rolled mock covering only the Prisma methods the routes under test
// actually call. Each is a vi.fn() so tests assert on real call args/results
// rather than stubbing return values that are never checked.
export const prismaMock = {
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  dailyLog: { findMany: vi.fn(), create: vi.fn(), upsert: vi.fn() },
  planMeal: { findUnique: vi.fn(), update: vi.fn() },
  food: { findUnique: vi.fn() },
  mealLog: { create: vi.fn(), findMany: vi.fn() },
  trialPlanPool: { findUnique: vi.fn(), upsert: vi.fn() },
  plan: { create: vi.fn() },
}

export function resetPrismaMock() {
  for (const model of Object.values(prismaMock)) {
    for (const fn of Object.values(model)) {
      ;(fn as ReturnType<typeof vi.fn>).mockReset()
    }
  }
}
