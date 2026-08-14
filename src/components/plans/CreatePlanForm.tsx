'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import WeightInput from '@/components/ui/WeightInput'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface CreatePlanFormProps {
  onPlanCreated?: (planId: string) => void
}

export default function CreatePlanForm({ onPlanCreated }: CreatePlanFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    weight: '',
    goal: 'muscle_gain',
    dietaryRestrictions: [] as string[],
    calorieTarget: 0,
    proteinTarget: 0,
    carbTarget: 0,
    fatTarget: 0,
    rateOfChange: 0.375, // Default to middle of muscle gain range
    wantsPeriWorkoutMeals: true
  })

  const [restrictionInput, setRestrictionInput] = useState('')

  const goals = [
    { value: 'weight_loss', label: 'Weight Loss'},
    { value: 'muscle_gain', label: 'Muscle Gain'},
    { value: 'maintenance', label: 'Maintenance'}
  ]

  const commonRestrictions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
    'Nut-Free', 'Low-Carb', 'Keto', 'Paleo'
  ]

  // Calculate calories and macros based on bodyweight, goal, and rate of change
  const calculateNutritionTargets = (weight: number, goal: string, rateOfChange: number) => {
    let baseCaloriesPerLb, proteinPerLb, fatPerLb, calorieAdjustment

    switch (goal) {
      case 'muscle_gain':
        baseCaloriesPerLb = 15 // Base maintenance calories
        proteinPerLb = 1.2 // 1.2g protein per lb
        fatPerLb = 0.4 // 0.4g fat per lb
        // Adjust calories based on rate of change (0.25% - 0.5% BW/week)
        // 0.25% BW = 0.5lb/week = 1750 calories/week = 250 calories/day
        // 0.5% BW = 1lb/week = 3500 calories/week = 500 calories/day
        // For any weight: rate × weight × 2.5 = daily calorie adjustment
        calorieAdjustment = rateOfChange * weight * 5
        break
      case 'weight_loss':
        baseCaloriesPerLb = 15 // Base maintenance calories
        proteinPerLb = 1.0 // 1g protein per lb, leaving more of the deficit for carbs
        fatPerLb = 0.3 // 0.3g fat per lb (minimum for hormone production)
        // Adjust calories based on rate of change (0.5% - 1.0% BW/week)
        // 0.5% BW = 1lb/week = 3500 calories/week = 500 calories/day deficit
        // 1.0% BW = 2lb/week = 7000 calories/week = 1000 calories/day deficit
        // For any weight: rate × weight × 2.5 = daily calorie adjustment
        calorieAdjustment = rateOfChange * weight * -5
        break
      case 'maintenance':
      default:
        baseCaloriesPerLb = 15 // 15 calories per lb for maintenance
        proteinPerLb = 1.0 // 1.0g protein per lb
        fatPerLb = 0.35 // 0.35g fat per lb
        calorieAdjustment = 0 // No adjustment for maintenance
        break
    }

    const totalCalories = Math.round(weight * baseCaloriesPerLb + calorieAdjustment)
    const protein = Math.round(weight * proteinPerLb)
    const fat = Math.round(weight * fatPerLb)
    const carbs = Math.round((totalCalories - (protein * 4) - (fat * 9)) / 4) // Remaining calories as carbs

    return {
      calories: totalCalories,
      protein,
      carbs,
      fat
    }
  }

  // Update nutrition targets when weight, goal, or rate of change changes
  useEffect(() => {
    if (formData.weight) {
      const weight = parseFloat(formData.weight)
      const { calories, protein, carbs, fat } = calculateNutritionTargets(weight, formData.goal, formData.rateOfChange)
      setFormData(prev => ({
        ...prev,
        calorieTarget: calories,
        proteinTarget: protein,
        carbTarget: carbs,
        fatTarget: fat
      }))
    }
  }, [formData.weight, formData.goal, formData.rateOfChange])

  // Reset rate of change when goal changes
  useEffect(() => {
    if (formData.goal === 'muscle_gain') {
      setFormData(prev => ({ ...prev, rateOfChange: 0.375 })) // Middle of 0.25-0.5 range
    } else if (formData.goal === 'weight_loss') {
      setFormData(prev => ({ ...prev, rateOfChange: 0.75 })) // Middle of 0.5-1.0 range
    } else {
      setFormData(prev => ({ ...prev, rateOfChange: 0 })) // No change for maintenance
    }
  }, [formData.goal])

  const addRestriction = () => {
    if (restrictionInput.trim() && !formData.dietaryRestrictions.includes(restrictionInput.trim())) {
      setFormData(prev => ({
        ...prev,
        dietaryRestrictions: [...prev.dietaryRestrictions, restrictionInput.trim()]
      }))
      setRestrictionInput('')
    }
  }

  const removeRestriction = (restriction: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.filter(r => r !== restriction)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiClient.generateMealPlan(
        formData.goal,
        formData.dietaryRestrictions,
        formData.wantsPeriWorkoutMeals,
        {
          calories: formData.calorieTarget,
          protein: formData.proteinTarget,
          carbs: formData.carbTarget,
          fat: formData.fatTarget,
        }
      )

      if (response.success) {
        const plan = response.data
        onPlanCreated?.(plan.id)
        router.push(`/plans/${plan.id}`)
      }
    } catch (error) {
      console.error('Error creating plan:', error)
      setError('Failed to generate your plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getRateOfChangeLabel = () => {
    if (formData.goal === 'muscle_gain') {
      return `${(formData.rateOfChange).toFixed(2)}% bodyweight per week`
    } else if (formData.goal === 'weight_loss') {
      return `${(formData.rateOfChange).toFixed(2)}% bodyweight per week`
    }
    return 'Maintenance'
  }

  const getRateOfChangeDescription = () => {
    if (formData.goal === 'muscle_gain') {
      if (formData.rateOfChange <= 0.3) return 'Conservative (less fat gain)'
      if (formData.rateOfChange <= 0.4) return 'Moderate (balanced)'
      return 'Aggressive (more fat gain)'
    } else if (formData.goal === 'weight_loss') {
      if (formData.rateOfChange <= 0.6) return 'Conservative (preserve muscle)'
      if (formData.rateOfChange <= 0.8) return 'Moderate (balanced)'
      return 'Aggressive (faster fat loss)'
    }
    return 'Maintain current weight'
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="font-display text-3xl text-ink-900 mb-2">Create your nutrition plan</h2>
        <p className="text-ink-900/60">Let AI generate a personalized meal plan based on your goals</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          {[1, 2, 3, 4].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 border flex items-center justify-center text-sm font-medium ${
                step >= s ? 'border-ember-500 text-ember-400' : 'border-ink-900/20 text-ink-900/40'
              }`}>
                {s}
              </div>
              {i < 3 && (
                <div className={`w-16 h-px mx-2 ${step > s ? 'bg-ember-500' : 'bg-ink-900/15'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Weight Input */}
      {step === 1 && (
        <div className="space-y-6">
          <h3 className="font-display text-xl text-ink-900">What&apos;s your current weight?</h3>
          <div className="space-y-4">
            <WeightInput
              label="Weight"
              valueLbs={formData.weight}
              onChangeLbs={(weight) => setFormData(prev => ({ ...prev, weight }))}
              placeholder="180.5"
              required
            />

            <p className="text-sm text-ink-900/60 border-l border-ink-900/20 pl-4">
              Your nutrition targets will be calculated based on your bodyweight and goal.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!formData.weight}
              variant="primary"
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Goal Selection */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="font-display text-xl text-ink-900">What&apos;s your primary goal?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => (
              <button
                key={goal.value}
                onClick={() => setFormData(prev => ({ ...prev, goal: goal.value }))}
                className={`p-6 border text-left transition-colors ${
                  formData.goal === goal.value
                    ? 'border-ember-500 text-ember-400'
                    : 'border-ink-900/15 text-ink-900 hover:border-ink-900/40'
                }`}
              >
                <h4 className="font-display">{goal.label}</h4>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Dietary Restrictions */}
      {step === 3 && (
        <div className="space-y-6">
          <h3 className="font-display text-xl text-ink-900">Any dietary restrictions?</h3>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {commonRestrictions.map((restriction) => (
                <button
                  key={restriction}
                  onClick={() => {
                    if (formData.dietaryRestrictions.includes(restriction)) {
                      removeRestriction(restriction)
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        dietaryRestrictions: [...prev.dietaryRestrictions, restriction]
                      }))
                    }
                  }}
                >
                  <Badge tone={formData.dietaryRestrictions.includes(restriction) ? 'warn' : 'neutral'}>
                    {restriction}
                  </Badge>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                value={restrictionInput}
                onChange={(e) => setRestrictionInput(e.target.value)}
                placeholder="Add custom restriction..."
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addRestriction()}
              />
              <Button variant="secondary" onClick={addRestriction}>
                Add
              </Button>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button variant="primary" onClick={() => setStep(4)}>
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Nutrition Targets */}
      {step === 4 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="font-display text-xl text-ink-900">Your calculated nutrition targets</h3>

          <p className="text-sm text-ink-900/60 border-l border-sage-400/40 pl-4">
            <strong className="text-ink-900">Calculated for {formData.weight}lbs:</strong> These targets are based on your bodyweight and {formData.goal.replace('_', ' ')} goal.
          </p>

          {/* Rate of Change Slider */}
          {(formData.goal === 'muscle_gain' || formData.goal === 'weight_loss') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-900/80">Rate of change</label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-900/50">
                  {formData.goal === 'muscle_gain' ? '0.25%' : '0.5%'}
                </span>
                <span className="text-sm font-medium text-ink-900">
                  {getRateOfChangeLabel()}
                </span>
                <span className="text-sm text-ink-900/50">
                  {formData.goal === 'muscle_gain' ? '0.5%' : '1.0%'}
                </span>
              </div>
              <input
                type="range"
                min={formData.goal === 'muscle_gain' ? 0.25 : 0.5}
                max={formData.goal === 'muscle_gain' ? 0.5 : 1.0}
                step={0.025}
                value={formData.rateOfChange}
                onChange={(e) => setFormData(prev => ({ ...prev, rateOfChange: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-cream-100 rounded-lg cursor-pointer accent-ember-500"
              />
              <p className="text-sm text-ink-900/50">
                {getRateOfChangeDescription()}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[176px]">
            <Input
              type="number"
              label="Daily calories"
              value={formData.calorieTarget}
              onChange={(e) => {
                const parsed = parseInt(e.target.value)
                setFormData(prev => ({ ...prev, calorieTarget: isNaN(parsed) ? prev.calorieTarget : parsed }))
              }}
              min="1000"
              max="10000"
              step="25"
            />
            <Input
              type="number"
              label="Protein (g/day)"
              value={formData.proteinTarget}
              onChange={(e) => {
                const parsed = parseInt(e.target.value)
                setFormData(prev => ({ ...prev, proteinTarget: isNaN(parsed) ? prev.proteinTarget : parsed }))
              }}
              min="50"
              max="1000"
              step="1"
            />
            <Input
              type="number"
              label="Carbs (g/day)"
              value={formData.carbTarget}
              onChange={(e) => {
                const parsed = parseInt(e.target.value)
                setFormData(prev => ({ ...prev, carbTarget: isNaN(parsed) ? prev.carbTarget : parsed }))
              }}
              min="50"
              max="1500"
              step="1"
            />
            <Input
              type="number"
              label="Fat (g/day)"
              value={formData.fatTarget}
              onChange={(e) => {
                const parsed = parseInt(e.target.value)
                setFormData(prev => ({ ...prev, fatTarget: isNaN(parsed) ? prev.fatTarget : parsed }))
              }}
              min="30"
              max="500"
              step="1"
            />
          </div>

          <p className="text-sm text-ink-900/60 border-l border-ink-900/20 pl-4">
            The calories and macros provided are a baseline for your weight. Depending on your weekly trends, they will be adjusted accordingly for you.
          </p>

          <label className="flex items-center gap-2 text-sm text-ink-900/80">
            <input
              type="checkbox"
              checked={formData.wantsPeriWorkoutMeals}
              onChange={(e) => setFormData(prev => ({ ...prev, wantsPeriWorkoutMeals: e.target.checked }))}
              className="accent-ember-500"
            />
            Include pre- and post-workout meals in this plan
          </label>
          <p className="text-sm text-ink-900/50">
            Plans are generated one day at a time for now, so uncheck this if today is a rest day.
          </p>

          {error && <p className="text-sm text-brick-500">{error}</p>}

          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep(3)}>
              ← Back
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Generating plan…' : 'Generate plan'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
