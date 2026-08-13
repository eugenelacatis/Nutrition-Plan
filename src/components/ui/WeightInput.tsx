'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { toLbs, fromLbs, type WeightUnit } from '@/lib/weight'
import Input from '@/components/ui/Input'

interface WeightInputProps {
  label: string
  /** Current value in lbs (the canonical internal unit), or '' if empty. */
  valueLbs: string
  /** Called with the new value converted to lbs. */
  onChangeLbs: (valueLbs: string) => void
  placeholder?: string
  required?: boolean
}

export default function WeightInput({ label, valueLbs, onChangeLbs, placeholder, required }: WeightInputProps) {
  const [unit, setUnit] = useState<WeightUnit>('lbs')

  useEffect(() => {
    apiClient.getGoal().then((response) => {
      if (response.success && response.data?.weightUnit) {
        setUnit(response.data.weightUnit)
      }
    })
  }, [])

  const displayValue = valueLbs === '' ? '' : String(Math.round(fromLbs(parseFloat(valueLbs), unit) * 10) / 10)

  const handleChange = (raw: string) => {
    if (raw === '') {
      onChangeLbs('')
      return
    }
    const parsed = parseFloat(raw)
    if (isNaN(parsed)) return
    onChangeLbs(String(toLbs(parsed, unit)))
  }

  const toggleUnit = async () => {
    const nextUnit: WeightUnit = unit === 'lbs' ? 'kg' : 'lbs'
    setUnit(nextUnit)
    apiClient.setWeightUnit(nextUnit).catch((error) => console.error('Error saving weight unit:', error))
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Input
          type="number"
          step="0.1"
          label={label}
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      </div>
      <button
        type="button"
        onClick={toggleUnit}
        className="mb-2 px-2 py-1 text-xs border border-ink-900/25 text-ink-900/70 hover:border-ink-900/50"
      >
        {unit}
      </button>
    </div>
  )
}
