import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// A valid bcrypt hash with no matching password, used to keep verifyCredentials'
// timing constant whether or not the email is registered.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Vz0DkAoZ0RyRXK9pP5gaHewaZmFtu'

export async function verifyCredentials(
  email: string,
  password: string
): Promise<{ id: string; email: string } | null> {
  const user = await prisma.user.findUnique({ where: { email } })

  // Always run bcrypt.compare, even for a nonexistent user, so response
  // time doesn't reveal whether the email is registered.
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
  if (!valid || !user) return null

  return { id: user.id, email: user.email }
}
