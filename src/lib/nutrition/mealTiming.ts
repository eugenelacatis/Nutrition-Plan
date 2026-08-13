export type MealSlot = 'breakfast' | 'pre_workout' | 'post_workout' | 'lunch' | 'dinner' | 'snack'

export interface ScheduleInput {
  wakeTime?: string | null
  workoutTime?: string | null
  sleepTime?: string | null
}

export const DEFAULT_SCHEDULE: ScheduleInput = {
  wakeTime: '07:00',
  workoutTime: '17:00',
  sleepTime: '22:00',
}

const PRE_WORKOUT_OFFSET_MIN = 75 // midpoint of the 60-90 min pre-workout window
const POST_WORKOUT_OFFSET_MIN = 45 // midpoint of the 30-60 min post-workout window
const BREAKFAST_AFTER_WAKE_MIN = 30
const DEFAULT_WAKE = '07:00'
const DEFAULT_SLEEP = '22:00'

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function toHHMM(totalMin: number): string {
  const clamped = ((totalMin % 1440) + 1440) % 1440
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

/** Formats an "HH:MM" 24h string as a 12h display time, e.g. "07:30" -> "7:30 AM". */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const displayHour = h % 12 === 0 ? 12 : h % 12
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Assigns a scheduledTime ("HH:MM") to each meal based on its AI-assigned
 * slot and the user's schedule. Pure function — no AI call, so re-running
 * this after a manual schedule edit costs nothing.
 */
export function computeMealTimes(meals: { slot: MealSlot }[], schedule: ScheduleInput): string[] {
  const wake = toMinutes(schedule.wakeTime ?? DEFAULT_WAKE)
  const sleep = toMinutes(schedule.sleepTime ?? DEFAULT_SLEEP)
  const workout = schedule.workoutTime ? toMinutes(schedule.workoutTime) : null

  const anchors: Record<MealSlot, number> = {
    breakfast: wake + BREAKFAST_AFTER_WAKE_MIN,
    pre_workout: workout !== null ? workout - PRE_WORKOUT_OFFSET_MIN : wake + 180,
    post_workout: workout !== null ? workout + POST_WORKOUT_OFFSET_MIN : wake + 300,
    lunch: wake + 300,
    dinner: sleep - 180,
    snack: wake + 420,
  }

  return meals.map((meal, i) => {
    const base = anchors[meal.slot]
    const dupIndex = meals.slice(0, i).filter((m) => m.slot === meal.slot).length
    return toHHMM(base + dupIndex * 15)
  })
}
