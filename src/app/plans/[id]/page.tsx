'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient, Plan, Food } from '@/lib/api'
import Link from 'next/link'
import MealConfirmation from '@/components/plans/MealConfirmation'
import Card from '@/components/ui/Card'
import MacroRing from '@/components/ui/MacroRing'
import Badge from '@/components/ui/Badge'
import { formatTime, SLOT_LABELS } from '@/lib/nutrition/mealTiming'

export default function PlanDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMealId, setEditingMealId] = useState<string | null>(null)

  useEffect(() => {
    if (user && params.id) {
      fetchPlan()
      fetchFoods()
    }
  }, [user, params.id])

  const fetchPlan = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getPlan(params.id as string)
      if (response.success) {
        setPlan(response.data)
      } else {
        router.push('/plans')
      }
    } catch (error) {
      console.error('Error fetching plan:', error)
      router.push('/plans')
    } finally {
      setLoading(false)
    }
  }

  const fetchFoods = async () => {
    try {
      const response = await apiClient.getFoods()
      if (response.success) {
        setFoods(response.data)
      }
    } catch (error) {
      console.error('Error fetching foods:', error)
    }
  }

  const handleTimeChange = async (mealId: string, scheduledTime: string) => {
    setEditingMealId(null)
    try {
      const response = await apiClient.updatePlanMeal(mealId, { scheduledTime })
      if (response.success) {
        setPlan((prev) =>
          prev
            ? { ...prev, meals: prev.meals.map((m) => (m.id === mealId ? { ...m, scheduledTime } : m)) }
            : prev
        )
      }
    } catch (error) {
      console.error('Error updating meal time:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <p className="text-ink-900/60">Loading plan…</p>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <h2 className="font-display text-2xl text-ink-900 mb-4">Plan not found</h2>
          <Link href="/plans" className="text-ember-400 hover:text-ember-500 underline underline-offset-4">
            Back to plans
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16 mb-10">
          <div className="text-sm uppercase tracking-widest text-ink-900/40">
            <Link href="/plans" className="hover:text-ink-900">← Plans</Link>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-4xl text-ink-900">{plan.name}</h1>
              <p className="mt-2 text-ink-900/60">{plan.description}</p>
            </div>
            <div className="text-sm text-ink-900/30 whitespace-nowrap">
              {new Date(plan.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16">
          <div className="text-sm uppercase tracking-widest text-ink-900/40">
            Macros
          </div>
          <div className="flex items-center gap-8 border-t border-ink-900/15 pt-8 pb-10">
            <MacroRing
              size={130}
              strokeWidth={13}
              segments={[
                { value: plan.totalProtein, colorVar: '--sage-400', label: 'Protein' },
                { value: plan.totalCarbs, colorVar: '--gold-400', label: 'Carbs' },
                { value: plan.totalFat, colorVar: '--ember-500', label: 'Fat' },
              ]}
              centerValue={String(plan.totalCalories)}
              centerLabel="calories"
            />
            <div className="tabular grid grid-cols-3 gap-8">
              <div>
                <div className="text-xl font-semibold text-sage-400">{plan.totalProtein}g</div>
                <div className="text-sm text-ink-900/50">Protein</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-gold-400">{plan.totalCarbs}g</div>
                <div className="text-sm text-ink-900/50">Carbs</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-ember-500">{plan.totalFat}g</div>
                <div className="text-sm text-ink-900/50">Fat</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16">
          <div className="text-sm uppercase tracking-widest text-ink-900/40">
            Meals
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-ink-900/15 pt-8">
            {[...plan.meals]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((meal) => (
              <Card key={meal.id}>
                <h4 className="font-display text-lg text-ink-900 mb-2">{meal.name}</h4>

                <div className="tabular flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-900/60 mb-3">
                  {editingMealId === meal.id ? (
                    <input
                      type="time"
                      autoFocus
                      defaultValue={meal.scheduledTime ?? ''}
                      onBlur={(e) => (e.target.value ? handleTimeChange(meal.id, e.target.value) : setEditingMealId(null))}
                      className="border-b border-ink-900/25 bg-transparent text-ink-900 focus:outline-none focus:border-ember-400"
                    />
                  ) : (
                    meal.scheduledTime && (
                      <button
                        type="button"
                        onClick={() => setEditingMealId(meal.id)}
                        className="font-medium text-ink-900 hover:text-ember-400"
                      >
                        {formatTime(meal.scheduledTime)}
                      </button>
                    )
                  )}
                  <Badge tone="neutral">{SLOT_LABELS[meal.slot]}</Badge>
                  <span>{meal.calories} cal</span>
                  <span>{meal.protein}g protein</span>
                  <span>{meal.carbs}g carbs</span>
                </div>

                <ul className="text-sm text-ink-900/70 space-y-1 mb-3">
                  {meal.ingredients.map((ingredient, idx) => (
                    <li key={idx}>{ingredient}</li>
                  ))}
                </ul>

                <details className="mb-3">
                  <summary className="text-sm font-medium text-ink-900/70 cursor-pointer">
                    Instructions
                  </summary>
                  <ol className="mt-2 text-sm text-ink-900/60 space-y-1 list-decimal list-inside">
                    {meal.instructions.map((instruction, idx) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </details>

                <div className="flex justify-between text-xs text-ink-900/40 mb-3">
                  <span>Prep: {meal.prepTime}min</span>
                  <span>Cook: {meal.cookTime}min</span>
                </div>

                <MealConfirmation planMeal={meal} foods={foods} />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
