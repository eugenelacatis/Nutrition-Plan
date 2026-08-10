'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient, TrialMealPlan } from '@/lib/api'
import { GUEST_PLAN_STORAGE_KEY } from '@/contexts/AuthContext'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import MacroRing from '@/components/ui/MacroRing'

const GOALS = [
  { value: 'weight_loss', label: 'Lose weight' },
  { value: 'muscle_gain', label: 'Build muscle' },
  { value: 'maintenance', label: 'Maintain' },
] as const

export default function Home() {
  const { user } = useAuth()
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trialPlan, setTrialPlan] = useState<TrialMealPlan | null>(null)

  const handleTry = async (goal: string) => {
    setSelectedGoal(goal)
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.tryPlan(goal)
      setTrialPlan(response.data)
      sessionStorage.setItem(
        GUEST_PLAN_STORAGE_KEY,
        JSON.stringify({ goals: goal, restrictions: [], plan: response.data })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong generating your plan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-cream-50">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h1 className="font-display text-6xl leading-[1.05]">
            <span className="text-ink-900">Plans built</span>{' '}
            <span className="text-ink-900/30">around</span>{' '}
            <span className="text-ink-900">your macros.</span>
          </h1>
          <p className="mt-6 text-lg text-ink-900/60 max-w-md">
            Pick a goal and see a real, AI-generated meal plan in seconds — no account
            needed. Sign up only when you want to save it.
          </p>

          {!user && (
            <div className="mt-10 flex flex-wrap gap-3">
              {GOALS.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => handleTry(goal.value)}
                  disabled={loading}
                  className={`px-5 py-3 border text-sm transition-colors disabled:opacity-40 ${
                    selectedGoal === goal.value
                      ? 'bg-ember-500 text-ink-900 border-ember-500'
                      : 'border-ink-900/25 text-ink-900 hover:border-ink-900/50'
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          )}

          {user && (
            <div className="mt-10">
              <Link href="/dashboard">
                <Button variant="primary" size="lg">Go to dashboard</Button>
              </Link>
            </div>
          )}
        </div>

        <div className="relative aspect-square max-w-md mx-auto w-full">
          <div
            className="w-full h-full rounded-full overflow-hidden bg-cover bg-center"
            style={{ backgroundImage: 'url(/healthy-bowl.jpg)', backgroundPosition: '57% 55%' }}
          />
        </div>
      </div>

      {/* Result */}
      {(loading || error || trialPlan) && (
        <div className="max-w-6xl mx-auto px-6 pb-20 border-t border-ink-900/15 pt-14">
          {loading && <p className="text-ink-900/60">Generating your plan…</p>}

          {error && (
            <div>
              <p className="text-brick-500">{error}</p>
              <button
                onClick={() => selectedGoal && handleTry(selectedGoal)}
                className="mt-3 text-sm text-ink-900/60 underline underline-offset-4 hover:text-ink-900"
              >
                Try again
              </button>
            </div>
          )}

          {trialPlan && !loading && (
            <div>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="font-display text-3xl text-ink-900">{trialPlan.name}</h2>
                  <p className="text-ink-900/60 mt-2">{trialPlan.description}</p>
                </div>
                <MacroRing
                  size={100}
                  strokeWidth={10}
                  segments={[
                    { value: trialPlan.totalProtein, colorVar: '--sage-400', label: 'Protein' },
                    { value: trialPlan.totalCarbs, colorVar: '--gold-400', label: 'Carbs' },
                    { value: trialPlan.totalFat, colorVar: '--ember-500', label: 'Fat' },
                  ]}
                  centerValue={String(trialPlan.totalCalories)}
                  centerLabel="cal"
                />
              </div>

              {!user && (
                <Link href="/signup">
                  <Button variant="primary" className="mt-6">Sign up to save this plan</Button>
                </Link>
              )}

              <div className="mt-10 grid sm:grid-cols-2 gap-8">
                {trialPlan.dailyMeals.flatMap((day) =>
                  day.meals.map((meal, i) => (
                    <div key={`${day.day}-${i}`} className="border-t border-ink-900/10 pt-4">
                      <h3 className="font-display text-lg text-ink-900">{meal.name}</h3>
                      <div className="tabular flex gap-4 mt-1 text-sm text-ink-900/50">
                        <span>{meal.calories} cal</span>
                        <span>{meal.protein}g protein</span>
                        <span>{meal.carbs}g carbs</span>
                        <span>{meal.fat}g fat</span>
                      </div>
                      <ul className="mt-3 text-sm text-ink-900/60 space-y-1">2                        {meal.ingredients.map((ingredient, idx) => (
                          <li key={idx}>{ingredient}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
