'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { GUEST_PLAN_STORAGE_KEY } from '@/contexts/AuthContext'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasPendingPlan, setHasPendingPlan] = useState(false)
  const { signUp } = useAuth()

  useEffect(() => {
    setHasPendingPlan(Boolean(sessionStorage.getItem(GUEST_PLAN_STORAGE_KEY)))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await signUp(email, password)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-16">
        <div className="text-sm uppercase tracking-widest text-ink-900/40">
          Sign up
        </div>

        <div className="max-w-sm">
          <h2 className="font-display text-3xl text-ink-900">Create your account</h2>

          {hasPendingPlan && (
            <div className="mt-4">
              <Badge tone="warn">Signing up will save the plan you just built</Badge>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              label="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {error && <p className="text-sm text-brick-500">{error}</p>}

            <Button type="submit" variant="primary" disabled={loading} size="lg" className="w-full">
              {loading ? 'Creating account…' : 'Sign up'}
            </Button>

            <p className="text-sm text-ink-900/50">
              Already have an account?{' '}
              <Link href="/login" className="text-ember-400 hover:text-ember-500 underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
