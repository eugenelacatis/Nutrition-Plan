'use client'

import { useState, useEffect, useMemo } from 'react'
import { apiClient, type TrendPoint } from '@/lib/api'
import type { TrendRange } from '@/lib/dateRange'
import { rollingAverage } from '@/lib/rollingAverage'
import { fromLbs, type WeightUnit } from '@/lib/weight'
import Card from '@/components/ui/Card'
import TrendRangeToggle from '@/components/trends/TrendRangeToggle'
import TrendChart from '@/components/trends/TrendChart'

export default function TrendsPage() {
  const [selectedRange, setSelectedRange] = useState<TrendRange>('90d')
  const [points, setPoints] = useState<TrendPoint[]>([])
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiClient.getTrends(selectedRange).then((res) => {
      if (!cancelled && res.success) {
        setPoints(res.data.logs)
      }
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [selectedRange])

  useEffect(() => {
    apiClient.getGoal().then((res) => {
      if (res.success && res.data.weightUnit) {
        setWeightUnit(res.data.weightUnit)
      }
    })
  }, [])

  const weightPoints = useMemo(() => {
    const weights = points.map((p) => fromLbs(p.weight, weightUnit))
    const averages = rollingAverage(weights, 7)
    return points.map((p, i) => ({ ...p, weight: weights[i], weightAvg: averages[i] }))
  }, [points, weightUnit])

  return (
    <div className="min-h-screen bg-cream-50 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16 mb-10">
          <div className="text-sm uppercase tracking-widest text-ink-900/40">Trends</div>
          <div className="flex items-start justify-between">
            <h1 className="font-display text-4xl text-ink-900">Your trends</h1>
            <TrendRangeToggle selectedRange={selectedRange} onSelect={setSelectedRange} />
          </div>
        </div>

        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16">
          <div />
          <div>
            {loading ? (
              <p className="text-ink-900/60">Loading…</p>
            ) : (
              <div className="flex flex-col gap-10">
                <div>
                  <p className="text-sm uppercase tracking-widest text-ink-900/40 mb-3">Weight</p>
                  <Card>
                    <TrendChart
                      data={weightPoints}
                      dataKey="weight"
                      avgKey="weightAvg"
                      color="rgba(232, 137, 74, 1)"
                      formatValue={(v) => `${Math.round(v * 10) / 10}${weightUnit}`}
                    />
                  </Card>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-widest text-ink-900/40 mb-3">Sleep</p>
                  <Card>
                    <TrendChart
                      data={points}
                      dataKey="sleepHours"
                      color="rgba(90, 122, 82, 1)"
                      formatValue={(v) => `${v}h`}
                      yDomain={[0, 12]}
                    />
                  </Card>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-widest text-ink-900/40 mb-3">Digestion</p>
                  <Card>
                    <TrendChart
                      data={points}
                      dataKey="digestionRating"
                      color="rgba(196, 97, 74, 1)"
                      formatValue={(v) => String(v)}
                      yDomain={[1, 5]}
                    />
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
