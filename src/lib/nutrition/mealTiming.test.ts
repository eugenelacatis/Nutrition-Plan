import { describe, it, expect } from 'vitest'
import { computeMealTimes } from './mealTiming'

describe('computeMealTimes', () => {
  it('schedules breakfast 30 minutes after wake time', () => {
    const result = computeMealTimes([{ slot: 'breakfast' }], { wakeTime: '07:00' })
    expect(result).toEqual(['07:30'])
  })

  it('schedules pre_workout 75 minutes before workout time', () => {
    const result = computeMealTimes([{ slot: 'pre_workout' }], { workoutTime: '17:00' })
    expect(result).toEqual(['15:45'])
  })

  it('schedules post_workout 45 minutes after workout time', () => {
    const result = computeMealTimes([{ slot: 'post_workout' }], { workoutTime: '17:00' })
    expect(result).toEqual(['17:45'])
  })

  it('wraps pre_workout time into the previous day when the workout is very early', () => {
    const result = computeMealTimes([{ slot: 'pre_workout' }], { workoutTime: '00:30' })
    expect(result).toEqual(['23:15'])
  })

  it('schedules dinner 180 minutes before sleep time', () => {
    const result = computeMealTimes([{ slot: 'dinner' }], { sleepTime: '22:00' })
    expect(result).toEqual(['19:00'])
  })

  it('schedules lunch 300 minutes after wake time', () => {
    const result = computeMealTimes([{ slot: 'lunch' }], { wakeTime: '06:00' })
    expect(result).toEqual(['11:00'])
  })

  it('staggers duplicate slots by 15 minutes to avoid time collisions', () => {
    const result = computeMealTimes([{ slot: 'snack' }, { slot: 'snack' }], { wakeTime: '07:00' })
    expect(result).toEqual(['14:00', '14:15'])
  })

  it('falls back to wake-relative offsets for pre/post workout when no workout time is given', () => {
    const result = computeMealTimes([{ slot: 'pre_workout' }, { slot: 'post_workout' }], { wakeTime: '07:00' })
    expect(result).toEqual(['10:00', '12:00'])
  })

  it('uses default wake/sleep times when the schedule is empty', () => {
    const result = computeMealTimes([{ slot: 'breakfast' }], {})
    expect(result).toEqual(['07:30'])
  })
})
