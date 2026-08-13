'use client'

import { useState } from 'react'
import DailyLogForm from '@/components/DailyLogForm'
import OptimalScoreDashboard from '@/components/ScoreDashboard'
import GoalSettingsForm from '@/components/GoalSettingsForm'
import ScheduleSettingsForm from '@/components/ScheduleSettingsForm'
import PersonalizationSettingsForm from '@/components/PersonalizationSettingsForm'
import Button from '@/components/ui/Button'

export default function DashboardPage() {
  const [showLogForm, setShowLogForm] = useState(false)
  const [showGoalSettings, setShowGoalSettings] = useState(false)
  const [showScheduleSettings, setShowScheduleSettings] = useState(false)
  const [showPersonalizationSettings, setShowPersonalizationSettings] = useState(false)
  const [refreshDashboard, setRefreshDashboard] = useState(0)

  const handleLogSubmitted = () => {
    setShowLogForm(false)
    setRefreshDashboard(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-cream-50 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16 mb-10">
          <div className="text-sm uppercase tracking-widest text-ink-900/40">
            Dashboard
          </div>
          <div className="flex items-start justify-between">
            <h1 className="font-display text-4xl text-ink-900">Your score</h1>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowLogForm(!showLogForm)}>
                {showLogForm ? 'Cancel' : 'Log daily metrics'}
              </Button>
              <Button variant="secondary" onClick={() => setShowGoalSettings(!showGoalSettings)}>
                {showGoalSettings ? 'Hide goal' : 'Edit goal'}
              </Button>
              <Button variant="secondary" onClick={() => setShowScheduleSettings(!showScheduleSettings)}>
                {showScheduleSettings ? 'Hide schedule' : 'Edit schedule'}
              </Button>
              <Button variant="secondary" onClick={() => setShowPersonalizationSettings(!showPersonalizationSettings)}>
                {showPersonalizationSettings ? 'Hide preferences' : 'Edit preferences'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16">
          <div />
          <OptimalScoreDashboard key={refreshDashboard} />
        </div>

        {showLogForm && (
          <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16 border-t border-ink-900/15 mt-10 pt-8">
            <div className="text-sm uppercase tracking-widest text-ink-900/40">
              Log
            </div>
            <div className="max-w-sm">
              <DailyLogForm onLogSubmitted={handleLogSubmitted} />
            </div>
          </div>
        )}

        {showGoalSettings && (
          <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16 border-t border-ink-900/15 mt-10 pt-8">
            <div className="text-sm uppercase tracking-widest text-ink-900/40">
              Goal
            </div>
            <div className="max-w-sm">
              <GoalSettingsForm />
            </div>
          </div>
        )}

        {showScheduleSettings && (
          <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16 border-t border-ink-900/15 mt-10 pt-8">
            <div className="text-sm uppercase tracking-widest text-ink-900/40">
              Schedule
            </div>
            <div className="max-w-sm">
              <ScheduleSettingsForm />
            </div>
          </div>
        )}

        {showPersonalizationSettings && (
          <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-16 border-t border-ink-900/15 mt-10 pt-8">
            <div className="text-sm uppercase tracking-widest text-ink-900/40">
              Preferences
            </div>
            <div className="max-w-sm">
              <PersonalizationSettingsForm />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
