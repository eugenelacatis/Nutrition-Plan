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
  return new Request('http://localhost/api/user/personalization', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  resetPrismaMock()
  mockAuth.mockReset()
})

describe('GET /api/user/personalization', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it("returns the user's saved personalization fields", async () => {
    authedAs('user-1')
    prismaMock.user.findUnique.mockResolvedValue({
      notes: 'I hate fish',
      mealCountPref: '4-5',
      cookTimePref: 'quick',
      proteinPref: 'chicken, eggs',
    })

    const res = await GET()
    const body = await res.json()

    expect(body.data.notes).toBe('I hate fish')
    expect(body.data.mealCountPref).toBe('4-5')
  })
})

describe('PATCH /api/user/personalization', () => {
  it('returns 401 when there is no session', async () => {
    mockAuth.mockResolvedValue(null as any)

    const res = await PATCH(jsonRequest({ notes: 'hi' }))

    expect(res.status).toBe(401)
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it('persists valid notes', async () => {
    authedAs('user-1')
    prismaMock.user.update.mockResolvedValue({ notes: 'I hate fish' })

    const res = await PATCH(jsonRequest({ notes: 'I hate fish' }))

    expect(res.status).toBe(200)
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ notes: 'I hate fish' }) })
    )
  })

  it('rejects notes longer than 1000 characters', async () => {
    authedAs('user-1')

    const res = await PATCH(jsonRequest({ notes: 'a'.repeat(1001) }))

    expect(res.status).toBe(400)
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it('persists a structured question field (mealCountPref)', async () => {
    authedAs('user-1')
    prismaMock.user.update.mockResolvedValue({ mealCountPref: '6+' })

    const res = await PATCH(jsonRequest({ mealCountPref: '6+' }))

    expect(res.status).toBe(200)
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ mealCountPref: '6+' }) })
    )
  })

  it('rejects a structured field value that is too long', async () => {
    authedAs('user-1')

    const res = await PATCH(jsonRequest({ proteinPref: 'a'.repeat(201) }))

    expect(res.status).toBe(400)
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it('allows clearing a field with null', async () => {
    authedAs('user-1')
    prismaMock.user.update.mockResolvedValue({ notes: null })

    const res = await PATCH(jsonRequest({ notes: null }))

    expect(res.status).toBe(200)
    expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { notes: null } }))
  })

  it('only updates fields present in the request body', async () => {
    authedAs('user-1')
    prismaMock.user.update.mockResolvedValue({ cookTimePref: 'quick' })

    await PATCH(jsonRequest({ cookTimePref: 'quick' }))

    const dataArg = prismaMock.user.update.mock.calls[0][0].data
    expect(dataArg).toEqual({ cookTimePref: 'quick' })
  })
})
