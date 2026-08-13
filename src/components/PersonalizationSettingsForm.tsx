'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { PERSONALIZATION_QUESTIONS } from '@/lib/nutrition/personalizationQuestions'
import Button from '@/components/ui/Button'

export default function PersonalizationSettingsForm() {
  const [notes, setNotes] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    apiClient.getPersonalization().then((response) => {
      if (response.success && response.data) {
        if (response.data.notes) setNotes(response.data.notes)
        const loaded: Record<string, string> = {}
        for (const q of PERSONALIZATION_QUESTIONS) {
          const value = response.data[q.key]
          if (value) loaded[q.key] = value
        }
        setAnswers(loaded)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      await apiClient.setPersonalization({ notes: notes || null, ...answers })
      setSaved(true)
    } catch (error) {
      console.error('Error saving personalization:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {PERSONALIZATION_QUESTIONS.map((q) => (
        <div key={q.key} className="flex flex-col gap-1.5">
          <label className="text-sm text-ink-900/60">{q.label}</label>
          {q.type === 'select' ? (
            <select
              value={answers[q.key] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
              className="border-b border-ink-900/25 bg-transparent px-0 py-2 text-ink-900 focus:outline-none focus:border-ember-400"
            >
              {q.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={answers[q.key] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
              placeholder={q.placeholder}
              className="border-b border-ink-900/25 bg-transparent px-0 py-2 text-ink-900 placeholder:text-ink-900/30 focus:outline-none focus:border-ember-400"
            />
          )}
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-ink-900/60">Anything else about your goals, food preferences, or constraints?</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. I hate fish, I meal prep on Sundays, I'm training for a powerlifting meet"
          rows={3}
          maxLength={1000}
          className="border border-ink-900/25 bg-transparent p-3 text-ink-900 placeholder:text-ink-900/30 focus:outline-none focus:border-ember-400"
        />
      </div>

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? 'Saving…' : 'Save preferences'}
      </Button>
      {saved && <p className="text-sm text-sage-400">Saved</p>}
    </form>
  )
}
