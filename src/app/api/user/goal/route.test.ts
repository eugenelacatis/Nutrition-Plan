import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/test/prismaMock'

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { auth } from '@/auth'
import { GET, PATCH } from './route'

const mockAuth = vi.mocked(auth)

function authedAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } } as any)
}

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/user/goal', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  resetPrismaMock()
  mockAuth.mockReset()
})

describe('GET /api/user/goal', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it('includes weightUnit in the returned data', async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({ goalWeight: 180, goalDirection: 'lose', weightUnit: 'kg' })

    const res = await GET()
    const body = await res.json()

    expect(body.data.weightUnit).toBe('kg')
  })
})

describe('PATCH /api/user/goal', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await PATCH(jsonRequest({ weightUnit: 'kg' }))

    expect(res.status).toBe(401)
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it('rejects an invalid weightUnit value', async () => {
    authedAs('user-1')

    const res = await PATCH(jsonRequest({ weightUnit: 'stone' }))

    expect(res.status).toBe(400)
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it('persists a valid weightUnit', async () => {
    authedAs('user-1')
    prismaMock.user.update.mockResolvedValue({ goalWeight: null, goalDirection: null, weightUnit: 'kg' })

    const res = await PATCH(jsonRequest({ weightUnit: 'kg' }))

    expect(res.status).toBe(200)
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ weightUnit: 'kg' }) })
    )
  })

  it('updating weightUnit alone does not touch goalWeight/goalDirection', async () => {
    authedAs('user-1')
    prismaMock.user.update.mockResolvedValue({ goalWeight: null, goalDirection: null, weightUnit: 'kg' })

    await PATCH(jsonRequest({ weightUnit: 'kg' }))

    const dataArg = prismaMock.user.update.mock.calls[0][0].data
    expect(dataArg.goalWeight).toBeUndefined()
    expect(dataArg.goalDirection).toBeUndefined()
  })

  it('still validates and persists goalWeight/goalDirection as before', async () => {
    authedAs('user-1')
    prismaMock.user.update.mockResolvedValue({ goalWeight: 180, goalDirection: 'lose', weightUnit: null })

    const res = await PATCH(jsonRequest({ goalWeight: 180, goalDirection: 'lose' }))

    expect(res.status).toBe(200)
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ goalWeight: 180, goalDirection: 'lose' }) })
    )
  })
})
