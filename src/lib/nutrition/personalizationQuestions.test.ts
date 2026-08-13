import { describe, it, expect } from 'vitest'
import { PERSONALIZATION_QUESTIONS, PERSONALIZATION_KEYS } from './personalizationQuestions'

describe('PERSONALIZATION_QUESTIONS', () => {
  it('every question has a unique key', () => {
    const keys = PERSONALIZATION_QUESTIONS.map((q) => q.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('every select-type question has at least one option', () => {
    for (const q of PERSONALIZATION_QUESTIONS.filter((q) => q.type === 'select')) {
      expect(q.options && q.options.length).toBeGreaterThan(0)
    }
  })

  it('PERSONALIZATION_KEYS derives exactly the keys from the question list', () => {
    expect(PERSONALIZATION_KEYS).toEqual(PERSONALIZATION_QUESTIONS.map((q) => q.key))
  })
})
