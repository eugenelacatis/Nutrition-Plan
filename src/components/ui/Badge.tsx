import { HTMLAttributes } from 'react'

type BadgeTone = 'good' | 'warn' | 'bad' | 'neutral'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  good: 'text-sage-400 border-sage-400/40',
  warn: 'text-gold-400 border-gold-400/40',
  bad: 'text-brick-500 border-brick-500/40',
  neutral: 'text-ink-900/70 border-ink-900/25',
}

export default function Badge({ tone = 'neutral', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs uppercase tracking-wide ${toneClasses[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
