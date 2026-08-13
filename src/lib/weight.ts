export type WeightUnit = 'lbs' | 'kg'

const LBS_PER_KG = 2.20462

/** All weight logic (macro calculations, weight-trend regression) is stored and computed in lbs internally. */
export function toLbs(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value * LBS_PER_KG : value
}

export function fromLbs(lbs: number, unit: WeightUnit): number {
  return unit === 'kg' ? lbs / LBS_PER_KG : lbs
}

export function formatWeight(lbs: number, unit: WeightUnit): string {
  const value = fromLbs(lbs, unit)
  return `${Math.round(value * 10) / 10}${unit}`
}
