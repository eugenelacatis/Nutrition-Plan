'use client'

import { useState } from 'react'
import DailyLogForm from '@/components/DailyLogForm'
import OptimalScoreDashboard from '@/components/ScoreDashboard'

export default function DashboardPage() {
  const [showLogForm, setShowLogForm] = useState(false)
  const [refreshDashboard, setRefreshDashboard] = useState(0)

  const handleLogSubmitted = () => {
    setShowLogForm(false)
    setRefreshDashboard(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Track your daily metrics and see your optimal score</p>
        </div>

        {/* Action Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowLogForm(!showLogForm)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {showLogForm ? 'Cancel' : 'Log Daily Metrics'}
          </button>
        </div>

        {/* Daily Log Form */}
        {showLogForm && (
          <div className="mb-8">
            <DailyLogForm onLogSubmitted={handleLogSubmitted} />
          </div>
        )}

        {/* Optimal Score Dashboard */}
        <OptimalScoreDashboard key={refreshDashboard} />
      </div>
    </div>
  )
} 