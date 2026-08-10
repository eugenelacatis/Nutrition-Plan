'use client'

import { createContext, useContext } from 'react'
import { SessionProvider, useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react'
import { apiClient } from '@/lib/api'

interface LocalUser {
  id: string
  email: string
}

interface AuthContextType {
  user: LocalUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const GUEST_PLAN_STORAGE_KEY = 'guest-plan-pending'

async function claimPendingGuestPlan() {
  const raw = sessionStorage.getItem(GUEST_PLAN_STORAGE_KEY)
  if (!raw) return

  try {
    const pending = JSON.parse(raw)
    await apiClient.claimGuestPlan(pending)
    sessionStorage.removeItem(GUEST_PLAN_STORAGE_KEY)
  } catch (error) {
    // Best-effort: leave the pending plan in sessionStorage so it can be
    // retried later rather than silently losing the guest's trial plan.
    console.error('Failed to claim guest plan:', error)
  }
}

function AuthContextBridge({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  const signIn = async (email: string, password: string) => {
    const result = await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      throw new Error('Invalid email or password')
    }

    await claimPendingGuestPlan()
  }

  const signUp = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'An error occurred')
    }

    await signIn(email, password)
  }

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false })
  }

  const value: AuthContextType = {
    user: session?.user ? { id: session.user.id as string, email: session.user.email as string } : null,
    loading: status === 'loading',
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextBridge>{children}</AuthContextBridge>
    </SessionProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
