/**
 * Single source of truth for structured personalization questions.
 * Add a new question by adding one entry here — the settings form, the
 * validation route, and the AI prompt builder all derive from this list.
 */
export interface PersonalizationQuestion {
  key: 'mealCountPref' | 'cookTimePref' | 'proteinPref'
  label: string
  promptLabel: string
  type: 'select' | 'text'
  options?: { value: string; label: string }[]
  placeholder?: string
}

export const PERSONALIZATION_QUESTIONS: PersonalizationQuestion[] = [
  {
    key: 'mealCountPref',
    label: 'How many meals per day do you prefer?',
    promptLabel: 'Preferred meal count',
    type: 'select',
    options: [
      { value: '', label: 'No preference' },
      { value: '3', label: '3 meals' },
      { value: '4-5', label: '4-5 meals' },
      { value: '6+', label: '6+ meals' },
    ],
  },
  {
    key: 'cookTimePref',
    label: 'How much time do you have to cook?',
    promptLabel: 'Cooking time constraint',
    type: 'select',
    options: [
      { value: '', label: 'No preference' },
      { value: 'quick', label: 'Quick meals only (under 15 min)' },
      { value: 'moderate', label: 'Moderate (up to 30 min)' },
      { value: 'flexible', label: 'I have time to cook' },
    ],
  },
  {
    key: 'proteinPref',
    label: 'Favorite protein sources? (optional)',
    promptLabel: 'Favorite proteins',
    type: 'text',
    placeholder: 'e.g. chicken, salmon, eggs',
  },
]

export const PERSONALIZATION_KEYS = PERSONALIZATION_QUESTIONS.map((q) => q.key)
