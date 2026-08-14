/**
 * Computes a rolling average over `values`, using the last `window` entries
 * (by array position, not calendar day) ending at each index. Ramps up over
 * the first `window - 1` points using however many entries are available.
 */
export function rollingAverage(values: number[], window = 7): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1)
    const slice = values.slice(start, i + 1)
    return slice.reduce((sum, v) => sum + v, 0) / slice.length
  })
}
