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
  return new Request('http://localhost/api/user/schedule', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  resetPrismaMock()
  mockAuth.mockReset()
})

describe('GET /api/user/schedule', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it("returns the user's saved schedule fields", async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({
      wakeTime: '07:00',
      workoutTime: '17:00',
      workStart: '09:00',
      workEnd: '17:00',
      sleepTime: '22:00',
    })

    const res = await GET()
    const body = await res.json()

    expect(body.data.workoutTime).toBe('17:00')
  })
})

describe('PATCH /api/user/schedule', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await PATCH(jsonRequest({ workoutTime: '17:00' }))

    expect(res.status).toBe(401)
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it('persists a valid workoutTime', async () => {
    authedAs('user-1')
    prismaMock.user.update.mockResolvedValue({ workoutTime: '17:00' })

    const res = await PATCH(jsonRequest({ workoutTime: '17:00' }))

    expect(res.status).toBe(200)
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { workoutTime: '17:00' } })
    )
  })

  it('rejects an invalid hour (25:00)', async () => {
    authedAs('user-1')

    const res = await PATCH(jsonRequest({ workoutTime: '25:00' }))

    expect(res.status).toBe(400)
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it('rejects a time missing a leading zero (5:00)', async () => {
    authedAs('user-1')

    const res = await PATCH(jsonRequest({ wakeTime: '5:00' }))

    expect(res.status).toBe(400)
  })

  it('persists an explicit null to clear a field', async () => {
    authedAs('user-1')
    prismaMock.user.update.mockResolvedValue({ wakeTime: null })

    const res = await PATCH(jsonRequest({ wakeTime: null }))

    expect(res.status).toBe(200)
    expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { wakeTime: null } }))
  })

  it('only updates the fields present in the request body', async () => {
    authedAs('user-1')
    prismaMock.user.update.mockResolvedValue({ sleepTime: '23:00' })

    await PATCH(jsonRequest({ sleepTime: '23:00' }))

    expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { sleepTime: '23:00' } }))
  })
})
