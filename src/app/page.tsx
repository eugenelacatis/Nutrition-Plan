'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient, TrialMealPlan } from '@/lib/api'
import { GUEST_PLAN_STORAGE_KEY } from '@/contexts/AuthContext'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import MacroRing from '@/components/ui/MacroRing'
import Card from '@/components/ui/Card'
import FullBleedSection from '@/components/ui/FullBleedSection'
import MealTimeline from '@/components/marketing/MealTimeline'
import GoalToggle from '@/components/marketing/GoalToggle'
import TailoringShowcase from '@/components/marketing/TailoringShowcase'
import Footer from '@/components/layout/Footer'

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
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-sm uppercase tracking-widest text-ink-900/40">
          Built for bodybuilders
        </div>
        <h1 className="font-display text-7xl md:text-8xl leading-[0.95] mt-4 max-w-4xl">
          <span className="text-ink-900">Plans built</span>{' '}
          <span className="text-ink-900/30">around</span>{' '}
          <span className="text-ink-900">your macros.</span>
        </h1>
        <p className="mt-6 text-lg text-ink-900/60 max-w-md">
          Pick a goal and see a real, AI-generated meal plan in seconds — no account
          needed. Sign up only when you want to save it.
        </p>

        {!user && (
          <div className="mt-10">
            <GoalToggle selectedGoal={selectedGoal} onSelect={handleTry} disabled={loading} />
          </div>
        )}

        {user && (
          <div className="mt-10">
            <Link href="/dashboard">
              <Button variant="primary" size="lg">Go to dashboard</Button>
            </Link>
          </div>
        )}

        <div className="mt-20">
          <MealTimeline />
        </div>
      </div>

      {/* Tailoring band */}
      <FullBleedSection className="bg-ink-900">
        <TailoringShowcase />
      </FullBleedSection>

      {/* Try-it result */}
      {(loading || error || trialPlan) && (
        <div className="max-w-6xl mx-auto px-6 py-20 border-b border-ink-900/15">
          {loading && (
            <p className="text-ink-900/60 motion-safe:animate-pulse">Generating your plan…</p>
          )}

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

              <div className="mt-10 grid sm:grid-cols-2 gap-6">
                {trialPlan.dailyMeals.flatMap((day) =>
                  day.meals.map((meal, i) => (
                    <Card key={`${day.day}-${i}`}>
                      <h3 className="font-display text-lg text-ink-900">{meal.name}</h3>
                      <div className="tabular flex gap-4 mt-1 text-sm text-ink-900/50">
                        <span>{meal.calories} cal</span>
                        <span>{meal.protein}g protein</span>
                        <span>{meal.carbs}g carbs</span>
                        <span>{meal.fat}g fat</span>
                      </div>
                      <ul className="mt-3 text-sm text-ink-900/60 space-y-1">
                        {meal.ingredients.map((ingredient, idx) => (
                          <li key={idx}>{ingredient}</li>
                        ))}
                      </ul>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  )
}
