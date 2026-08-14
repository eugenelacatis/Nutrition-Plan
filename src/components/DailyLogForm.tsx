'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api'
import Input from '@/components/ui/Input'
import WeightInput from '@/components/ui/WeightInput'
import Button from '@/components/ui/Button'

interface DailyLogFormProps {
  onLogSubmitted?: () => void
}

export default function DailyLogForm({ onLogSubmitted }: DailyLogFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    weight: '',
    sleepHours: '',
    wakeTime: '',
    digestionRating: 3
  })

  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiClient.logDailyMetrics(
        parseFloat(formData.weight),
        parseFloat(formData.sleepHours),
        formData.wakeTime,
        formData.digestionRating
      )

      if (response.success) {
        setFormData({
          weight: '',
          sleepHours: '',
          wakeTime: '',
          digestionRating: 3
        })

        onLogSubmitted?.()
      }
    } catch (error) {
      console.error('Error logging daily metrics:', error)
      setError('Failed to log daily metrics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-brick-500">{error}</p>}

      <WeightInput
        label="Weight"
        valueLbs={formData.weight}
        onChangeLbs={(weight) => setFormData(prev => ({ ...prev, weight }))}
        placeholder="180.5"
        required
      />

      <Input
        type="number"
        step="0.5"
        min="0"
        max="24"
        label="Sleep hours"
        value={formData.sleepHours}
        onChange={(e) => setFormData(prev => ({ ...prev, sleepHours: e.target.value }))}
        placeholder="7.5"
        required
      />

      <Input
        type="time"
        label="Wake time"
        value={formData.wakeTime}
        onChange={(e) => setFormData(prev => ({ ...prev, wakeTime: e.target.value }))}
        required
      />

      <div>
        <label className="text-sm text-ink-900/60">
          Yesterday&apos;s digestion rating
        </label>
        <div className="flex items-center gap-4 mt-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, digestionRating: rating }))}
              className={`w-9 h-9 border flex items-center justify-center text-sm transition-colors ${
                formData.digestionRating === rating
                  ? 'border-ember-500 text-ember-400'
                  : 'border-ink-900/20 text-ink-900/60 hover:border-ink-900/40'
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-900/40">
          1 = Poor (gas, upset stomach, sleep disruption) · 5 = Excellent (no issues)
        </p>
      </div>

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? 'Logging…' : 'Log daily metrics'}
      </Button>
    </form>
  )
}
