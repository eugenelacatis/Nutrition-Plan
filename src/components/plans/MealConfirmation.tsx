'use client'

import { useState } from 'react'
import { apiClient, Food, MacroDiff, PlanMeal } from '@/lib/api'
import Button from '@/components/ui/Button'

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
    <div className="pt-3 border-t border-ink-900/10">
      <div className="flex gap-2 mb-2">
        <Button
          variant={status === 'as_planned' ? 'primary' : 'secondary'}
          size="md"
          onClick={() => confirm('as_planned')}
          disabled={loading}
          className="flex-1 !px-2 !py-1 text-xs"
        >
          As planned
        </Button>
        <Button
          variant={status === 'substituted' ? 'primary' : 'secondary'}
          size="md"
          onClick={() => setShowSubstitutePicker(true)}
          disabled={loading}
          className="flex-1 !px-2 !py-1 text-xs"
        >
          Substituted
        </Button>
        <Button
          variant={status === 'skipped' ? 'primary' : 'secondary'}
          size="md"
          onClick={() => confirm('skipped')}
          disabled={loading}
          className="flex-1 !px-2 !py-1 text-xs"
        >
          Skipped
        </Button>
      </div>

      {showSubstitutePicker && (
        <div className="space-y-2 mb-2">
          <select
            value={substituteFoodId}
            onChange={(e) => setSubstituteFoodId(e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-ink-900/15 bg-cream-50 text-ink-900"
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
              className="flex-1 text-xs px-2 py-1.5 border border-ink-900/15 bg-cream-50 text-ink-900 placeholder:text-ink-900/40"
            />
            <Button
              variant="primary"
              size="md"
              onClick={handleSubstituteSubmit}
              disabled={loading}
              className="!px-3 !py-1 text-xs"
            >
              Confirm
            </Button>
          </div>
        </div>
      )}

      {error && <div className="text-xs text-brick-500 mb-2">{error}</div>}

      {macroDiff && status === 'substituted' && (
        <div className="tabular text-xs text-ink-900/60 border border-ink-900/15 p-2">
          <div className="font-medium mb-1 text-ink-900/80">Macro difference from plan:</div>
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
