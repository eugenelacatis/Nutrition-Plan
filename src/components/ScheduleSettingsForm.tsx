'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ScheduleSettingsForm() {
  const [wakeTime, setWakeTime] = useState('')
  const [workoutTime, setWorkoutTime] = useState('')
  const [workStart, setWorkStart] = useState('')
  const [workEnd, setWorkEnd] = useState('')
  const [sleepTime, setSleepTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    apiClient.getSchedule().then((response) => {
      if (response.success && response.data) {
        if (response.data.wakeTime) setWakeTime(response.data.wakeTime)
        if (response.data.workoutTime) setWorkoutTime(response.data.workoutTime)
        if (response.data.workStart) setWorkStart(response.data.workStart)
        if (response.data.workEnd) setWorkEnd(response.data.workEnd)
        if (response.data.sleepTime) setSleepTime(response.data.sleepTime)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      await apiClient.setSchedule(
        wakeTime || null,
        workoutTime || null,
        workStart || null,
        workEnd || null,
        sleepTime || null
      )
      setSaved(true)
    } catch (error) {
      console.error('Error saving schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input type="time" label="Wake time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
      <Input
        type="time"
        label="Workout time"
        value={workoutTime}
        onChange={(e) => setWorkoutTime(e.target.value)}
      />
      <Input type="time" label="Work starts" value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
      <Input type="time" label="Work ends" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
      <Input type="time" label="Sleep time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? 'Saving…' : 'Save schedule'}
      </Button>
      {saved && <p className="text-sm text-sage-400">Saved</p>}
    </form>
  )
}
