'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface CreatePlanFormProps {
  onPlanCreated?: (planId: string) => void
}

export default function CreatePlanForm({ onPlanCreated }: CreatePlanFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  
  const [formData, setFormData] = useState({
    weight: '',
    goal: 'muscle_gain',
    dietaryRestrictions: [] as string[],
    calorieTarget: 0,
    proteinTarget: 0,
    carbTarget: 0,
    fatTarget: 0,
    rateOfChange: 0.375 // Default to middle of muscle gain range
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
        proteinPerLb = 1.5 // 1.5g protein per lb (higher for muscle preservation)
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

    try {
      const response = await apiClient.generateMealPlan(
        formData.goal,
        formData.dietaryRestrictions
      )
      
      if (response.success) {
        const mealPlan = response.data
        
        // Store the plan in localStorage for demo purposes
        const existingPlans = JSON.parse(localStorage.getItem('nutrition-plans') || '[]')
        const updatedPlans = [mealPlan, ...existingPlans]
        localStorage.setItem('nutrition-plans', JSON.stringify(updatedPlans))

        onPlanCreated?.(mealPlan.id)
        router.push(`/plans/${mealPlan.id}`)
      }
    } catch (error) {
      console.error('Error creating plan:', error)
      // Fallback to demo data if API fails
      const demoPlan = {
        id: `demo-${Date.now()}`,
        name: `${formData.goal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Plan`,
        description: `Demo plan for ${formData.goal.replace('_', ' ')}`,
        dailyMeals: [],
        totalCalories: formData.calorieTarget * 7,
        totalProtein: formData.proteinTarget * 7,
        totalCarbs: formData.carbTarget * 7,
        totalFat: formData.fatTarget * 7,
        created_at: new Date().toISOString()
      }
      
      const existingPlans = JSON.parse(localStorage.getItem('nutrition-plans') || '[]')
      const updatedPlans = [demoPlan, ...existingPlans]
      localStorage.setItem('nutrition-plans', JSON.stringify(updatedPlans))

      onPlanCreated?.(demoPlan.id)
      router.push(`/plans/${demoPlan.id}`)
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Nutrition Plan</h2>
        <p className="text-gray-600">Let AI generate a personalized meal plan based on your goals</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <div className={`w-16 h-1 mx-2 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
          <div className={`w-16 h-1 mx-2 ${step >= 4 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 4 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            4
          </div>
        </div>
      </div>

      {/* Step 1: Weight Input */}
      {step === 1 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">What's your current weight?</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (lbs)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="180.5"
                required
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your nutrition targets will be calculated based on your bodyweight and goal.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!formData.weight}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Goal Selection */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">What's your primary goal?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => (
              <button
                key={goal.value}
                onClick={() => setFormData(prev => ({ ...prev, goal: goal.value }))}
                className={`p-6 border-2 rounded-lg transition-colors text-left ${
                  formData.goal === goal.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                }`}
              >
                <h4 className="font-semibold text-gray-900">{goal.label}</h4>
              </button>
            ))}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Dietary Restrictions */}
      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">Any dietary restrictions?</h3>
          
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
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    formData.dietaryRestrictions.includes(restriction)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {restriction}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={restrictionInput}
                onChange={(e) => setRestrictionInput(e.target.value)}
                placeholder="Add custom restriction..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyPress={(e) => e.key === 'Enter' && addRestriction()}
              />
              <button
                onClick={addRestriction}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Nutrition Targets */}
      {step === 4 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">Your calculated nutrition targets</h3>
          
          <div className="bg-green-50 p-4 rounded-md mb-6">
            <p className="text-sm text-green-800">
              <strong>Calculated for {formData.weight}lbs:</strong> These targets are based on your bodyweight and {formData.goal.replace('_', ' ')} goal.
            </p>
          </div>

          {/* Rate of Change Slider */}
          {(formData.goal === 'muscle_gain' || formData.goal === 'weight_loss') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate of Change
                </label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {formData.goal === 'muscle_gain' ? '0.25%' : '0.5%'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {getRateOfChangeLabel()}
                  </span>
                  <span className="text-sm text-gray-600">
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
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <p className="text-sm text-gray-600 mt-1">
                  {getRateOfChangeDescription()}
                </p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Calories
              </label>
              <input
                type="number"
                value={formData.calorieTarget}
                onChange={(e) => setFormData(prev => ({ ...prev, calorieTarget: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="1000"
                max="10000"
                step="25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Protein (g/day)
              </label>
              <input
                type="number"
                value={formData.proteinTarget}
                onChange={(e) => setFormData(prev => ({ ...prev, proteinTarget: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="50"
                max="1000"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carbs (g/day)
              </label>
              <input
                type="number"
                value={formData.carbTarget}
                onChange={(e) => setFormData(prev => ({ ...prev, carbTarget: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="50"
                max="1500"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fat (g/day)
              </label>
              <input
                type="number"
                value={formData.fatTarget}
                onChange={(e) => setFormData(prev => ({ ...prev, fatTarget: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="30"
                max="500"
                step="1"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The calories and macros provided are a baseline for your weight. Depending on your weekly trends, they will be adjusted accordingly for you.
            </p>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating Plan...' : 'Generate Plan'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
} 