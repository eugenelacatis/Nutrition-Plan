import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { verifyCredentials } from '@/lib/auth/verifyCredentials'

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

        return verifyCredentials(email, password)
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
