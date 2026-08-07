'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { MealPlan } from '@/lib/api'
import Link from 'next/link'

export default function PlanDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && params.id) {
      fetchPlan()
    }
  }, [user, params.id])

  const fetchPlan = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Get plan from localStorage
    const storedPlans = JSON.parse(localStorage.getItem('nutrition-plans') || '[]')
    const foundPlan = storedPlans.find((p: MealPlan) => p.id === params.id)
    
    if (foundPlan) {
      setPlan(foundPlan)
    } else {
      router.push('/plans')
    }
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please sign in to view this plan
          </h2>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading plan...</div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Plan not found</h2>
          <Link
            href="/plans"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Plans
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/plans"
                className="text-indigo-600 hover:text-indigo-500 mb-4 inline-flex items-center"
              >
                ← Back to Plans
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
              <p className="mt-2 text-gray-600">{plan.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Created</div>
              <div className="font-medium">{new Date(plan.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Nutrition Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Nutrition Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {plan.totalCalories}
              </div>
              <div className="text-sm text-gray-500">Calories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {plan.totalProtein}g
              </div>
              <div className="text-sm text-gray-500">Protein</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {plan.totalCarbs}g
              </div>
              <div className="text-sm text-gray-500">Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {plan.totalFat}g
              </div>
              <div className="text-sm text-gray-500">Fat</div>
            </div>
          </div>
        </div>

        {/* Meals */}
        <div className="space-y-8">
          {plan.dailyMeals.map((dailyMeal) => (
            <div key={dailyMeal.day} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Meals</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {dailyMeal.meals.map((meal, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{meal.name}</h4>
                      
                      {/* Nutrition Info */}
                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Calories:</span>
                          <div className="font-medium">{meal.calories}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Protein:</span>
                          <div className="font-medium">{meal.protein}g</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Carbs:</span>
                          <div className="font-medium">{meal.carbs}g</div>
                        </div>
                      </div>

                      {/* Ingredients */}
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Ingredients:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {meal.ingredients.map((ingredient, idx) => (
                            <li key={idx} className="flex items-center">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                              {ingredient}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Instructions */}
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Instructions:</h5>
                        <ol className="text-sm text-gray-600 space-y-1">
                          {meal.instructions.map((instruction, idx) => (
                            <li key={idx} className="flex">
                              <span className="mr-2 text-indigo-600 font-medium">{idx + 1}.</span>
                              {instruction}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Time */}
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Prep: {meal.prepTime}min</span>
                        <span>Cook: {meal.cookTime}min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 