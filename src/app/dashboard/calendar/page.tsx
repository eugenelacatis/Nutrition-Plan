'use client'

import { useState, useEffect } from 'react'
import { apiClient, type CalendarDaySummary } from '@/lib/api'
import { shiftMonth, formatMonthLabel } from '@/lib/calendar'
import type { WeightUnit } from '@/lib/weight'
import Button from '@/components/ui/Button'
import CalendarGrid from '@/components/calendar/CalendarGrid'
import DayDetailPanel from '@/components/calendar/DayDetailPanel'

export default function CalendarPage() {
  const now = new Date()
  const [{ year, month }, setYearMonth] = useState({
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
  })
  const [days, setDays] = useState<CalendarDaySummary[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiClient.getCalendarMonth(year, month).then((res) => {
      if (!cancelled && res.success) {
        setDays(res.data.days)
      }
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [year, month])

  useEffect(() => {
    apiClient.getGoal().then((res) => {
      if (res.success && res.data.weightUnit) {
        setWeightUnit(res.data.weightUnit)
      }
    })
  }, [])

  const navigate = (delta: number) => {
    setYearMonth((prev) => shiftMonth(prev.year, prev.month, delta))
    setSelectedDate(null)
  }

  const selectedSummary = selectedDate ? days.find((d) => d.date === selectedDate) : undefined

  return (
    <div className="min-h-screen bg-cream-50 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16 mb-10">
          <div className="text-sm uppercase tracking-widest text-ink-900/40">Calendar</div>
          <div className="flex items-start justify-between">
            <h1 className="font-display text-4xl text-ink-900">Your history</h1>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => navigate(-1)}>Prev</Button>
              <span className="tabular text-ink-900 min-w-[10ch] text-center">
                {formatMonthLabel(year, month)}
              </span>
              <Button variant="secondary" onClick={() => navigate(1)}>Next</Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16">
          <div />
          <div>
            {loading ? (
              <p className="text-ink-900/60">Loading…</p>
            ) : (
              <CalendarGrid
                year={year}
                month={month}
                days={days}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            )}
          </div>
        </div>

        {selectedDate && (
          <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16 border-t border-ink-900/15 mt-10 pt-8">
            <div className="text-sm uppercase tracking-widest text-ink-900/40">Detail</div>
            <div className="max-w-lg">
              <DayDetailPanel date={selectedDate} summary={selectedSummary} weightUnit={weightUnit} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
