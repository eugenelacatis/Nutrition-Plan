'use client'

import { useAuth } from '@/contexts/AuthContext'
import { GUEST_PLAN_STORAGE_KEY } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Badge from '@/components/ui/Badge'

export default function Navigation() {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [hasPendingPlan, setHasPendingPlan] = useState(false)

  useEffect(() => {
    setHasPendingPlan(Boolean(sessionStorage.getItem(GUEST_PLAN_STORAGE_KEY)))
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const navLinkClass = 'text-sm text-ink-900/50 hover:text-ink-900 transition-colors'

  return (
    <nav className="border-b border-ink-900/15">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-10">
            <Link href="/" className="font-display text-lg text-ink-900">
              Nutrition Plan
            </Link>
            <div className="hidden sm:flex gap-8">
              <Link href="/dashboard" className={navLinkClass}>
                Dashboard
              </Link>
              <Link href="/plans" className={navLinkClass}>
                Plans
              </Link>
              <Link href="/dashboard/calendar" className={navLinkClass}>
                Calendar
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            {!user && hasPendingPlan && (
              <Badge tone="warn">Plan ready — sign up to save</Badge>
            )}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="h-8 w-8 border border-ember-500 text-ember-400 flex items-center justify-center text-sm focus:outline-none"
                >
                  {user.email.charAt(0).toUpperCase()}
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 border border-ink-900/15 bg-cream-50 py-1">
                    <div className="px-4 py-2 text-sm text-ink-900/50 border-b border-ink-900/15">
                      {user.email}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-ink-900/80 hover:text-ink-900"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link href="/login" className={navLinkClass}>
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="bg-ember-500 hover:bg-ember-400 text-ink-900 px-4 py-2 text-sm font-medium transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 text-ink-900/70 hover:text-ink-900 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden border-t border-ink-900/15">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/dashboard"
              className="text-ink-900/70 hover:text-ink-900 block px-4 py-2 text-base"
            >
              Dashboard
            </Link>
            <Link
              href="/plans"
              className="text-ink-900/70 hover:text-ink-900 block px-4 py-2 text-base"
            >
              Plans
            </Link>
            <Link
              href="/dashboard/calendar"
              className="text-ink-900/70 hover:text-ink-900 block px-4 py-2 text-base"
            >
              Calendar
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-ink-900/15">
            {user ? (
              <div className="space-y-1">
                <div className="px-4 py-2 text-base text-ink-900/80">
                  {user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-base text-ink-900/60 hover:text-ink-900"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  href="/login"
                  className="block px-4 py-2 text-base text-ink-900/60 hover:text-ink-900"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="block px-4 py-2 text-base text-ink-900/60 hover:text-ink-900"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
