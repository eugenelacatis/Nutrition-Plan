'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { MealPlan } from '@/lib/api'

export default function PlansPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchPlans()
    }
  }, [user])

  const fetchPlans = async () => {
    // Simulate loading
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Get plans from localStorage
    const storedPlans = JSON.parse(localStorage.getItem('nutrition-plans') || '[]')
    setPlans(storedPlans)
    setLoading(false)
  }

  const clearPlans = () => {
    localStorage.removeItem('nutrition-plans')
    setPlans([])
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please sign in to view your plans
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Nutrition Plans</h1>
            <p className="mt-2 text-gray-600">View and manage your personalized meal plans</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={clearPlans}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
            >
              Clear All Plans
            </button>
          <Link
            href="/plans/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create New Plan
          </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading plans...</div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No plans created yet</div>
            <Link
              href="/plans/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Your First Plan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Calories:</span>
                      <span className="ml-1 font-medium">{plan.totalCalories}/day</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Protein:</span>
                      <span className="ml-1 font-medium">{plan.totalProtein}g/day</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Created {new Date(plan.created_at).toLocaleDateString()}
                    </div>
                    <Link
                      href={`/plans/${plan.id}`}
                      className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 