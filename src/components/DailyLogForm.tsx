'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

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
        // Reset form
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
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Daily Log</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sleep Hours
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            value={formData.sleepHours}
            onChange={(e) => setFormData(prev => ({ ...prev, sleepHours: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="7.5"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wake Time
          </label>
          <input
            type="time"
            value={formData.wakeTime}
            onChange={(e) => setFormData(prev => ({ ...prev, wakeTime: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yesterday's Digestion Rating
          </label>
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, digestionRating: rating }))}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  formData.digestionRating === rating
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            1 = Poor (gas, upset stomach, sleep disruption) • 5 = Excellent (no issues)
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging...' : 'Log Daily Metrics'}
        </button>
      </form>
    </div>
  )
} 