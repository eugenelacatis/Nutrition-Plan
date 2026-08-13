interface TimelineNode {
  time: string
  label: string
  tag: string
  colorVar: string
}

const NODES: TimelineNode[] = [
  { time: '6:30', label: 'Wake', tag: '', colorVar: '--ink-900' },
  { time: '7:00', label: 'Breakfast', tag: '42g protein', colorVar: '--sage-400' },
  { time: '12:30', label: 'Pre-workout', tag: '65g carbs', colorVar: '--gold-400' },
  { time: '16:00', label: 'Post-workout', tag: '48g protein', colorVar: '--ember-500' },
  { time: '20:30', label: 'Dinner', tag: '38g protein', colorVar: '--sage-400' },
]

// Signature hero visual: a clock-anchored training-day sequence, built in
// MacroRing's visual language (thin strokes, tabular numerals, sage/gold/ember).
// Static example data — marketing scaffolding, not wired to live trial data.
export default function MealTimeline() {
  return (
    <div className="w-full">
      <div className="hidden sm:flex items-start justify-between gap-2">
        {NODES.map((node, i) => (
          <div key={i} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={`h-px flex-1 ${i === 0 ? 'opacity-0' : ''} bg-ink-900/15`} />
              <div
                className="h-3 w-3 shrink-0 rounded-full border-2"
                style={{ borderColor: `rgb(var(${node.colorVar}))` }}
              />
              <div className={`h-px flex-1 ${i === NODES.length - 1 ? 'opacity-0' : ''} bg-ink-900/15`} />
            </div>
            <span className="tabular mt-3 text-sm font-medium text-ink-900">{node.time}</span>
            <span className="mt-1 text-xs uppercase tracking-wide text-ink-900/50">{node.label}</span>
            {node.tag && (
              <span className="tabular mt-1 text-xs text-ink-900/40">{node.tag}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-5 sm:hidden">
        {NODES.map((node, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex flex-col items-center self-stretch">
              <div className={`w-px flex-1 ${i === 0 ? 'opacity-0' : ''} bg-ink-900/15`} />
              <div
                className="h-3 w-3 shrink-0 rounded-full border-2"
                style={{ borderColor: `rgb(var(${node.colorVar}))` }}
              />
              <div className={`w-px flex-1 ${i === NODES.length - 1 ? 'opacity-0' : ''} bg-ink-900/15`} />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="tabular text-sm font-medium text-ink-900">{node.time}</span>
              <span className="text-xs uppercase tracking-wide text-ink-900/50">{node.label}</span>
              {node.tag && <span className="tabular text-xs text-ink-900/40">{node.tag}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
