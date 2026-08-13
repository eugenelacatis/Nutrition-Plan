'use client'

import { useState, useEffect } from 'react'
import { apiClient, type OptimalScore } from '@/lib/api'
import { scoreTextClass } from '@/lib/scoreTier'
import Button from '@/components/ui/Button'
import MacroRing from '@/components/ui/MacroRing'

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

  if (loading) {
    return <p className="text-ink-900/60">Loading score…</p>
  }

  if (error) {
    return <p className="text-brick-500">{error}</p>
  }

  if (!optimalScore) {
    return (
      <p className="text-ink-900/60">
        No data available. Start logging your daily metrics to see your optimal score.
      </p>
    )
  }

  const { score, factors, recommendations } = optimalScore

  return (
    <div>
      <div className="flex items-center gap-8">
        <MacroRing
          size={130}
          strokeWidth={13}
          segments={[
            { value: factors.sleep.score, colorVar: '--sage-400', label: 'Sleep' },
            { value: factors.digestion.score, colorVar: '--gold-400', label: 'Digestion' },
            { value: factors.weight.score, colorVar: '--ember-500', label: 'Weight' },
          ]}
          centerValue={String(score)}
          centerLabel="score"
        />
        <div>
          <h2 className="font-display text-2xl text-ink-900">
            {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs improvement'}
          </h2>
          <p className="text-ink-900/60 mt-1">
            {score >= 80 ? 'Keep up the great work!' :
             score >= 60 ? "You're on the right track" :
             score >= 40 ? 'Focus on the fundamentals' : 'Prioritize sleep and digestion'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-ink-900/15 mt-8 pt-6">
        <div>
          <h4 className="text-sm text-ink-900/50 mb-2">Sleep quality</h4>
          <div className="flex items-baseline justify-between">
            <span className={`tabular text-2xl font-semibold ${scoreTextClass(factors.sleep.score)}`}>
              {factors.sleep.score}
            </span>
            <span className="text-sm text-ink-900/40">
              {Math.round(factors.sleep.weight * 100)}% weight
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-sm text-ink-900/50 mb-2">Digestion</h4>
          <div className="flex items-baseline justify-between">
            <span className={`tabular text-2xl font-semibold ${scoreTextClass(factors.digestion.score)}`}>
              {factors.digestion.score}
            </span>
            <span className="text-sm text-ink-900/40">
              {Math.round(factors.digestion.weight * 100)}% weight
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-sm text-ink-900/50 mb-2">Weight consistency</h4>
          <div className="flex items-baseline justify-between">
            <span className={`tabular text-2xl font-semibold ${scoreTextClass(factors.weight.score)}`}>
              {factors.weight.score}
            </span>
            <span className="text-sm text-ink-900/40">
              {Math.round(factors.weight.weight * 100)}% weight
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-ink-900/15 mt-8 pt-6">
        <h4 className="font-display text-lg text-ink-900 mb-4">Recommendations</h4>
        {recommendations.length > 0 ? (
          <ul className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2 text-ink-900/70">
                <span className="text-ember-400">—</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-900/60">Great job! Keep maintaining your current habits.</p>
        )}
      </div>

      <div className="mt-8">
        <Button variant="secondary" onClick={fetchOptimalScore}>
          Refresh score
        </Button>
      </div>
    </div>
  )
}
