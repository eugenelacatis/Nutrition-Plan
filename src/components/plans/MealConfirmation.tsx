'use client'

import { useState } from 'react'
import { apiClient, Food, MacroDiff, PlanMeal } from '@/lib/api'

interface MealConfirmationProps {
  planMeal: PlanMeal
  foods: Food[]
}

type Status = 'as_planned' | 'substituted' | 'skipped'

export default function MealConfirmation({ planMeal, foods }: MealConfirmationProps) {
  const [status, setStatus] = useState<Status | null>(
    planMeal.mealLogs?.[0]?.status ?? null
  )
  const [showSubstitutePicker, setShowSubstitutePicker] = useState(false)
  const [substituteFoodId, setSubstituteFoodId] = useState('')
  const [substituteQuantityG, setSubstituteQuantityG] = useState('')
  const [macroDiff, setMacroDiff] = useState<MacroDiff | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const confirm = async (
    newStatus: Status,
    foodId?: string,
    quantityG?: number
  ) => {
    setLoading(true)
    setError('')

    try {
      const response = await apiClient.logMeal(planMeal.id, newStatus, foodId, quantityG)
      if (response.success) {
        setStatus(newStatus)
        setMacroDiff(response.data.macroDiff)
        setShowSubstitutePicker(false)
      }
    } catch (err) {
      setError('Failed to log meal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubstituteSubmit = () => {
    const quantity = parseFloat(substituteQuantityG)
    if (!substituteFoodId || !quantity || quantity <= 0) {
      setError('Choose a food and enter a quantity in grams')
      return
    }
    confirm('substituted', substituteFoodId, quantity)
  }

  return (
    <div className="pt-3 border-t border-gray-100">
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => confirm('as_planned')}
          disabled={loading}
          className={`flex-1 px-2 py-1 text-xs font-medium rounded ${
            status === 'as_planned'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          As planned
        </button>
        <button
          type="button"
          onClick={() => setShowSubstitutePicker(true)}
          disabled={loading}
          className={`flex-1 px-2 py-1 text-xs font-medium rounded ${
            status === 'substituted'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Substituted
        </button>
        <button
          type="button"
          onClick={() => confirm('skipped')}
          disabled={loading}
          className={`flex-1 px-2 py-1 text-xs font-medium rounded ${
            status === 'skipped'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Skipped
        </button>
      </div>

      {showSubstitutePicker && (
        <div className="space-y-2 mb-2">
          <select
            value={substituteFoodId}
            onChange={(e) => setSubstituteFoodId(e.target.value)}
            className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
          >
            <option value="">Select a food...</option>
            {foods.map((food) => (
              <option key={food.id} value={food.id}>
                {food.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              step="1"
              value={substituteQuantityG}
              onChange={(e) => setSubstituteQuantityG(e.target.value)}
              placeholder="Quantity (g)"
              className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
            />
            <button
              type="button"
              onClick={handleSubstituteSubmit}
              disabled={loading}
              className="px-3 py-1 text-xs font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {error && <div className="text-xs text-red-600 mb-2">{error}</div>}

      {macroDiff && status === 'substituted' && (
        <div className="text-xs text-gray-600 bg-yellow-50 rounded p-2">
          <div className="font-medium mb-1">Macro difference from plan:</div>
          <div className="grid grid-cols-4 gap-1">
            <span>{macroDiff.calories >= 0 ? '+' : ''}{macroDiff.calories} cal</span>
            <span>{macroDiff.protein >= 0 ? '+' : ''}{macroDiff.protein}g protein</span>
            <span>{macroDiff.carbs >= 0 ? '+' : ''}{macroDiff.carbs}g carbs</span>
            <span>{macroDiff.fat >= 0 ? '+' : ''}{macroDiff.fat}g fat</span>
          </div>
        </div>
      )}
    </div>
  )
}
