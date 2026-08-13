import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/test/prismaMock'

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

import { POST } from './route'

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  resetPrismaMock()
})

describe('POST /api/auth/signup', () => {
  it('rejects a missing email', async () => {
    const res = await POST(jsonRequest({ password: 'validpass' }))

    expect(res.status).toBe(400)
    expect(prismaMock.user.create).not.toHaveBeenCalled()
  })

  it('rejects a missing password', async () => {
    const res = await POST(jsonRequest({ email: 'a@example.com' }))

    expect(res.status).toBe(400)
  })

  it.each(['not-an-email', 'missing-at.com', '@no-local-part.com', 'no-domain@'])(
    'rejects an invalid email format: %s',
    async (email) => {
      const res = await POST(jsonRequest({ email, password: 'validpass' }))

      expect(res.status).toBe(400)
      expect(prismaMock.user.create).not.toHaveBeenCalled()
    }
  )

  it('rejects a password shorter than 6 characters', async () => {
    const res = await POST(jsonRequest({ email: 'a@example.com', password: '12345' }))

    expect(res.status).toBe(400)
    expect(prismaMock.user.create).not.toHaveBeenCalled()
  })

  it('accepts a password exactly 6 characters long', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue({ id: 'user-1', email: 'a@example.com' })

    const res = await POST(jsonRequest({ email: 'a@example.com', password: '123456' }))

    expect(res.status).toBe(200)
  })

  it('rejects signup when the email is already registered', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-user', email: 'a@example.com' })

    const res = await POST(jsonRequest({ email: 'a@example.com', password: 'validpass' }))

    expect(res.status).toBe(409)
    expect(prismaMock.user.create).not.toHaveBeenCalled()
  })

  it('creates a user with a bcrypt hash, not the plaintext password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue({ id: 'user-1', email: 'a@example.com' })

    await POST(jsonRequest({ email: 'a@example.com', password: 'super-secret-password' }))

    const createArg = prismaMock.user.create.mock.calls[0][0]
    expect(createArg.data.email).toBe('a@example.com')
    expect(createArg.data.passwordHash).not.toBe('super-secret-password')
    expect(createArg.data.passwordHash).toMatch(/^\$2[aby]\$/)
  })

  it('returns only id and email in the response body, never the password hash', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue({ id: 'user-1', email: 'a@example.com', passwordHash: 'should-not-leak' })

    const res = await POST(jsonRequest({ email: 'a@example.com', password: 'validpass' }))
    const body = await res.json()

    expect(body).toEqual({ id: 'user-1', email: 'a@example.com' })
  })
})
