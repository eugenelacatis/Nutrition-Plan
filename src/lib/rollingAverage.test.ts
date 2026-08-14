import { describe, it, expect } from 'vitest'
import { rollingAverage } from './rollingAverage'

describe('rollingAverage', () => {
  it('ramps up over the first window-1 points', () => {
    expect(rollingAverage([10, 20, 30], 7)).toEqual([10, 15, 20])
  })

  it('averages the trailing window once enough points exist', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8]
    expect(rollingAverage(values, 7)).toEqual([1, 1.5, 2, 2.5, 3, 3.5, 4, 5])
  })

  it('returns an empty array for empty input', () => {
    expect(rollingAverage([], 7)).toEqual([])
  })
})
