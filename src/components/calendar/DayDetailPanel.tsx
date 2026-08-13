import { parseDateString } from '@/lib/calendar'
import { formatWeight, type WeightUnit } from '@/lib/weight'
import { scoreTextClass } from '@/lib/scoreTier'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import type { CalendarDaySummary } from '@/lib/api'

interface DayDetailPanelProps {
  date: string
  summary: CalendarDaySummary | undefined
  weightUnit: WeightUnit
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const statusTone: Record<string, 'good' | 'warn' | 'bad'> = {
  as_planned: 'good',
  substituted: 'warn',
  skipped: 'bad',
}

const statusLabel: Record<string, string> = {
  as_planned: 'As planned',
  substituted: 'Substituted',
  skipped: 'Skipped',
}

function formatDateLong(date: string): string {
  const { year, month, day } = parseDateString(date)
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`
}

export default function DayDetailPanel({ date, summary, weightUnit }: DayDetailPanelProps) {
  return (
    <Card>
      <h3 className="font-display text-lg text-ink-900">{formatDateLong(date)}</h3>

      {!summary || !summary.hasLog ? (
        <p className="mt-3 text-ink-900/60">No log for this day.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <h4 className="text-sm text-ink-900/50 mb-1">Score</h4>
              <span className={`tabular text-xl font-semibold ${summary.score !== null ? scoreTextClass(summary.score) : ''}`}>
                {summary.score ?? '—'}
              </span>
            </div>
            <div>
              <h4 className="text-sm text-ink-900/50 mb-1">Weight</h4>
              <span className="tabular text-xl text-ink-900">
                {summary.weight !== null ? formatWeight(summary.weight, weightUnit) : '—'}
              </span>
            </div>
            <div>
              <h4 className="text-sm text-ink-900/50 mb-1">Sleep</h4>
              <span className="tabular text-xl text-ink-900">
                {summary.sleepHours !== null ? `${summary.sleepHours}h` : '—'}
              </span>
            </div>
            <div>
              <h4 className="text-sm text-ink-900/50 mb-1">Digestion</h4>
              <span className="tabular text-xl text-ink-900">
                {summary.digestionRating !== null ? `${summary.digestionRating}/5` : '—'}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-ink-900/15 pt-4">
            <h4 className="text-sm text-ink-900/50 mb-3">Meals logged</h4>
            {summary.meals.length === 0 ? (
              <p className="text-ink-900/60 text-sm">No meals logged this day.</p>
            ) : (
              <ul className="space-y-2">
                {summary.meals.map((meal, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <span className="text-ink-900">{meal.name}</span>
                    <Badge tone={statusTone[meal.status] ?? 'neutral'}>{statusLabel[meal.status] ?? meal.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
