import { buildMonthGrid } from '@/lib/calendar'
import { scoreTier } from '@/lib/scoreTier'
import type { CalendarDaySummary } from '@/lib/api'

interface CalendarGridProps {
  year: number
  month: number
  days: CalendarDaySummary[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const dotClasses: Record<'good' | 'warn' | 'bad', string> = {
  good: 'bg-sage-400',
  warn: 'bg-gold-400',
  bad: 'bg-brick-500',
}

export default function CalendarGrid({ year, month, days, selectedDate, onSelectDate }: CalendarGridProps) {
  const weeks = buildMonthGrid(year, month)
  const daysByDate = new Map(days.map((d) => [d.date, d]))

  return (
    <div>
      <div className="grid grid-cols-7 gap-px mb-2">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-xs uppercase tracking-widest text-ink-900/40 text-center py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {weeks.flat().map((cell) => {
          const summary = cell.isCurrentMonth ? daysByDate.get(cell.date) : undefined
          const isSelected = selectedDate === cell.date

          if (!cell.isCurrentMonth) {
            return (
              <div key={cell.date} className="aspect-square flex items-center justify-center text-sm text-ink-900/20">
                {cell.day}
              </div>
            )
          }

          return (
            <button
              key={cell.date}
              onClick={() => onSelectDate(cell.date)}
              className={`aspect-square flex flex-col items-center justify-center gap-1 border text-sm transition-colors ${
                isSelected
                  ? 'border-ember-500 text-ember-400'
                  : cell.isToday
                    ? 'border-ink-900/40 text-ink-900 hover:border-ink-900/60'
                    : 'border-ink-900/10 text-ink-900 hover:border-ink-900/30'
              }`}
            >
              <span className="tabular">{cell.day}</span>
              {summary?.hasLog && summary.score !== null ? (
                <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[scoreTier(summary.score)]}`} />
              ) : (
                <span className="h-1.5 w-1.5" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
