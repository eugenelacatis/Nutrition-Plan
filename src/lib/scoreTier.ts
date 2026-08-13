export type ScoreTier = 'good' | 'warn' | 'bad'

export function scoreTier(score: number): ScoreTier {
  if (score >= 80) return 'good'
  if (score >= 60) return 'warn'
  return 'bad'
}

const scoreTextClasses: Record<ScoreTier, string> = {
  good: 'text-sage-400',
  warn: 'text-gold-400',
  bad: 'text-brick-500',
}

export function scoreTextClass(score: number): string {
  return scoreTextClasses[scoreTier(score)]
}
