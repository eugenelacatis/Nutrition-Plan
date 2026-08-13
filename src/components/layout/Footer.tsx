'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

// Homepage-only footer — not part of the root layout.
export default function Footer() {
  const { user } = useAuth()
  const linkClass = 'text-sm text-ink-900/50 hover:text-ink-900 transition-colors'

  return (
    <footer className="border-t border-ink-900/15">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-6">
        <span className="font-display text-lg text-ink-900">Nutrition Plan</span>
        <div className="flex flex-wrap items-center gap-8">
          <Link href="/dashboard" className={linkClass}>Dashboard</Link>
          <Link href="/plans" className={linkClass}>Plans</Link>
          {!user && (
            <>
              <Link href="/login" className={linkClass}>Sign in</Link>
              <Link href="/signup" className={linkClass}>Sign up</Link>
            </>
          )}
        </div>
      </div>
    </footer>
  )
}
