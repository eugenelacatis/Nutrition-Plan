'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'

export default function GoalSettingsForm() {
  const [goalWeight, setGoalWeight] = useState('')
  const [goalDirection, setGoalDirection] = useState<'lose' | 'gain' | 'maintain'>('maintain')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    apiClient.getGoal().then((response) => {
      if (response.success && response.data) {
        if (response.data.goalWeight) setGoalWeight(String(response.data.goalWeight))
        if (response.data.goalDirection) setGoalDirection(response.data.goalDirection)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      const weight = goalWeight ? parseFloat(goalWeight) : null
      await apiClient.setGoal(weight, goalDirection)
      setSaved(true)
    } catch (error) {
      console.error('Error saving goal:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Goal</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Goal Weight (lbs)</label>
          <input
            type="number"
            step="0.1"
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="175"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
          <select
            value={goalDirection}
            onChange={(e) => setGoalDirection(e.target.value as 'lose' | 'gain' | 'maintain')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="lose">Lose weight</option>
            <option value="gain">Gain weight</option>
            <option value="maintain">Maintain weight</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Goal'}
        </button>
        {saved && <div className="text-sm text-green-600 text-center">Saved!</div>}
      </form>
    </div>
  )
}
