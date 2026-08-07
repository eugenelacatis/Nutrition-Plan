'use client'

import { useState, useEffect } from 'react'
import { apiClient, type OptimalScore } from '@/lib/api'

interface OptimalScoreDashboardProps {
  onRefresh?: () => void
}

export default function OptimalScoreDashboard({ onRefresh }: OptimalScoreDashboardProps) {
  const [optimalScore, setOptimalScore] = useState<OptimalScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOptimalScore = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getOptimalScore()
      if (response.success) {
        setOptimalScore(response.data)
      }
    } catch (error) {
      console.error('Error fetching optimal score:', error)
      setError('Failed to load optimal score')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOptimalScore()
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  if (!optimalScore) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-gray-500">
          No data available. Start logging your daily metrics to see your optimal score.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Performance Score</h2>
        <p className="text-gray-600">Based on your sleep, digestion, and adherence patterns</p>
      </div>

      {/* Main Score */}
      <div className="mb-8 text-center">
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(optimalScore.score)}`}>
          <span className={`text-4xl font-bold ${getScoreColor(optimalScore.score)}`}>
            {optimalScore.score}
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {optimalScore.score >= 80 ? 'Excellent' : 
             optimalScore.score >= 60 ? 'Good' : 
             optimalScore.score >= 40 ? 'Fair' : 'Needs Improvement'}
          </h3>
          <p className="text-gray-600">
            {optimalScore.score >= 80 ? 'Keep up the great work!' :
             optimalScore.score >= 60 ? 'You\'re on the right track' :
             optimalScore.score >= 40 ? 'Focus on the fundamentals' : 'Prioritize sleep and digestion'}
          </p>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Sleep Quality</h4>
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold ${getScoreColor(optimalScore.factors.sleep.score)}`}>
              {optimalScore.factors.sleep.score}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(optimalScore.factors.sleep.weight * 100)}% weight
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Digestion</h4>
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold ${getScoreColor(optimalScore.factors.digestion.score)}`}>
              {optimalScore.factors.digestion.score}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(optimalScore.factors.digestion.weight * 100)}% weight
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Weight Consistency</h4>
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold ${getScoreColor(optimalScore.factors.weight.score)}`}>
              {optimalScore.factors.weight.score}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(optimalScore.factors.weight.weight * 100)}% weight
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h4>
        {optimalScore.recommendations.length > 0 ? (
          <ul className="space-y-2">
            {optimalScore.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">Great job! Keep maintaining your current habits.</p>
        )}
      </div>

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchOptimalScore}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Refresh Score
        </button>
      </div>
    </div>
  )
} 