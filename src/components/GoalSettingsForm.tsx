'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import WeightInput from '@/components/ui/WeightInput'
import Button from '@/components/ui/Button'

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <WeightInput
        label="Goal weight"
        valueLbs={goalWeight}
        onChangeLbs={setGoalWeight}
        placeholder="175"
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-ink-900/60">Direction</label>
        <select
          value={goalDirection}
          onChange={(e) => setGoalDirection(e.target.value as 'lose' | 'gain' | 'maintain')}
          className="border-b border-ink-900/25 bg-transparent px-0 py-2 text-ink-900 focus:outline-none focus:border-ember-400"
        >
          <option value="lose">Lose weight</option>
          <option value="gain">Gain weight</option>
          <option value="maintain">Maintain weight</option>
        </select>
      </div>
      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? 'Saving…' : 'Save goal'}
      </Button>
      {saved && <p className="text-sm text-sage-400">Saved</p>}
    </form>
  )
}
