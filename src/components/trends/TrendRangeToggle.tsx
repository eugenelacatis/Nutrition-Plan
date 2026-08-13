'use client'

import { TREND_RANGES, TrendRange } from '@/lib/dateRange'

interface TrendRangeToggleProps {
  selectedRange: TrendRange
  onSelect: (range: TrendRange) => void
}

export default function TrendRangeToggle({ selectedRange, onSelect }: TrendRangeToggleProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {TREND_RANGES.map((range) => (
        <button
          key={range.value}
          onClick={() => onSelect(range.value)}
          className={`min-h-[44px] px-5 py-3 border text-sm transition-colors ${
            selectedRange === range.value
              ? 'bg-ember-500 text-ink-900 border-ember-500'
              : 'border-ink-900/25 text-ink-900 hover:border-ink-900/50'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}
