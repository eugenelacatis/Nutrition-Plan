import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// A valid bcrypt hash with no matching password, used to keep authorize()'s
// timing constant whether or not the email is registered.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Vz0DkAoZ0RyRXK9pP5gaHewaZmFtu'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials.email
        const password = credentials.password

        if (typeof email !== 'string' || typeof password !== 'string') return null

        const user = await prisma.user.findUnique({ where: { email } })

        // Always run bcrypt.compare, even for a nonexistent user, so response
        // time doesn't reveal whether the email is registered.
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
        if (!valid || !user) return null

        return { id: user.id, email: user.email }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.id = user.id
      return token
    },
    session: ({ session, token }) => {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
})
