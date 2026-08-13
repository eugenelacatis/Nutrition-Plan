import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { prismaMock, resetPrismaMock } from '@/test/prismaMock'

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

import { verifyCredentials } from './verifyCredentials'

beforeEach(() => {
  resetPrismaMock()
})

describe('verifyCredentials', () => {
  it('returns the user id and email for a correct password', async () => {
    const passwordHash = await bcrypt.hash('correct-horse-battery-staple', 10)
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'a@example.com', passwordHash })

    const result = await verifyCredentials('a@example.com', 'correct-horse-battery-staple')

    expect(result).toEqual({ id: 'user-1', email: 'a@example.com' })
  })

  it('returns null for an incorrect password on an existing user', async () => {
    const passwordHash = await bcrypt.hash('the-real-password', 10)
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'a@example.com', passwordHash })

    const result = await verifyCredentials('a@example.com', 'wrong-password')

    expect(result).toBeNull()
  })

  it('returns null for a nonexistent user without throwing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    const result = await verifyCredentials('nobody@example.com', 'whatever-password')

    expect(result).toBeNull()
  })

  it('still runs a bcrypt comparison for a nonexistent user (timing-attack guard)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const compareSpy = vi.spyOn(bcrypt, 'compare')

    await verifyCredentials('nobody@example.com', 'whatever-password')

    expect(compareSpy).toHaveBeenCalledTimes(1)
    // Must compare against a real bcrypt hash (the dummy), not skip the call
    // or compare against an empty string/undefined.
    const [, comparedHash] = compareSpy.mock.calls[0]
    expect(comparedHash).toMatch(/^\$2[aby]\$/)
    compareSpy.mockRestore()
  })

  it('takes roughly the same time whether the user exists (wrong password) or not, within the same order of magnitude', async () => {
    const passwordHash = await bcrypt.hash('the-real-password', 10)

    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'user-1', email: 'a@example.com', passwordHash })
    const startExisting = performance.now()
    await verifyCredentials('a@example.com', 'wrong-password')
    const existingUserMs = performance.now() - startExisting

    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    const startMissing = performance.now()
    await verifyCredentials('nobody@example.com', 'wrong-password')
    const missingUserMs = performance.now() - startMissing

    // Both paths run one real bcrypt.compare call, so timings should be
    // comparable rather than the missing-user path returning near-instantly.
    const ratio = Math.max(existingUserMs, missingUserMs) / Math.max(1, Math.min(existingUserMs, missingUserMs))
    expect(ratio).toBeLessThan(5)
  })
})
