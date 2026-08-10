interface MacroSegment {
  value: number
  colorVar: string
  label: string
}

interface MacroRingProps {
  segments: MacroSegment[]
  size?: number
  strokeWidth?: number
  centerLabel?: string
  centerValue?: string
}

export default function MacroRing({
  segments,
  size = 140,
  strokeWidth = 14,
  centerLabel,
  centerValue,
}: MacroRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1

  let offsetSoFar = 0
  const arcs = segments.map((segment) => {
    const fraction = segment.value / total
    const dashLength = fraction * circumference
    const gapLength = circumference - dashLength
    const rotation = (offsetSoFar / total) * 360
    offsetSoFar += segment.value
    return { ...segment, dashLength, gapLength, rotation }
  })

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--cream-100))"
          strokeWidth={strokeWidth}
        />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`rgb(var(${arc.colorVar}))`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dashLength} ${arc.gapLength}`}
            strokeLinecap="round"
            transform={`rotate(${arc.rotation} ${size / 2} ${size / 2})`}
          />
        ))}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="tabular text-2xl font-semibold text-ink-900">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-xs uppercase tracking-wide text-ink-900/60">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
