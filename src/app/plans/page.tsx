'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { apiClient, Plan } from '@/lib/api'
import Button from '@/components/ui/Button'
import MacroRing from '@/components/ui/MacroRing'

export default function PlansPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<Omit<Plan, 'meals'>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchPlans()
    }
  }, [user])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const response = await apiClient.listPlans()
      if (response.success) {
        setPlans(response.data)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16 items-start mb-10">
          <div className="text-sm uppercase tracking-widest text-ink-900/40">
            Plans
          </div>
          <div className="flex items-start justify-between">
            <h1 className="font-display text-4xl text-ink-900">Your nutrition plans</h1>
            <Link href="/plans/new">
              <Button variant="primary">Create new plan</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16">
          <div />
          <div>
            {loading ? (
              <p className="text-ink-900/60">Loading plans…</p>
            ) : plans.length === 0 ? (
              <div className="border-t border-ink-900/15 pt-8">
                <p className="text-ink-900/60 mb-4">No plans created yet</p>
                <Link href="/plans/new">
                  <Button variant="primary">Create your first plan</Button>
                </Link>
              </div>
            ) : (
              <div>
                {plans.map((plan) => (
                  <Link key={plan.id} href={`/plans/${plan.id}`}>
                    <div className="flex gap-6 items-center border-t border-ink-900/15 py-6 hover:border-ember-500/40 transition-colors">
                      <MacroRing
                        size={64}
                        strokeWidth={7}
                        segments={[
                          { value: plan.totalProtein, colorVar: '--sage-400', label: 'Protein' },
                          { value: plan.totalCarbs, colorVar: '--gold-400', label: 'Carbs' },
                          { value: plan.totalFat, colorVar: '--ember-500', label: 'Fat' },
                        ]}
                      />
                      <div className="flex-1">
                        <h3 className="font-display text-lg text-ink-900">{plan.name}</h3>
                        <p className="text-ink-900/50 text-sm mt-1">{plan.description}</p>
                        <div className="tabular mt-2 text-sm text-ink-900/60">
                          {plan.totalCalories} cal · {plan.totalProtein}g protein
                        </div>
                      </div>
                      <div className="text-xs text-ink-900/30">
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
