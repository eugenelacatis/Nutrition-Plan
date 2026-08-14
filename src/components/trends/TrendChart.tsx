'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, type TooltipContentProps } from 'recharts'
import type { TrendPoint } from '@/lib/api'

interface TrendChartProps {
  data: TrendPoint[]
  dataKey: 'weight' | 'sleepHours' | 'digestionRating'
  color: string // literal rgba() string, not a CSS var reference — Recharts SVG props need a concrete color
  valueTransform?: (raw: number) => number // e.g. fromLbs for weight
  formatValue?: (raw: number) => string
  yDomain?: [number, number] // fixed for sleep/digestion; 'auto' for weight
}

const CHART_HEIGHT = 260

function CustomTooltip({ active, payload, label, formatValue }: TooltipContentProps<number, string> & { formatValue?: (raw: number) => string }) {
  if (!active || !payload || payload.length === 0) return null
  const value = payload[0].value as number

  return (
    <div
      style={{
        backgroundColor: 'rgb(250 246 238)',
        border: '1px solid rgba(35,31,26,0.15)',
        padding: '6px 10px',
        boxShadow: 'none',
      }}
    >
      <p style={{ color: 'rgba(35,31,26,0.6)', fontSize: 12, margin: 0 }}>{label}</p>
      <p style={{ color: 'rgb(35 31 26)', fontSize: 14, margin: 0 }}>
        {formatValue ? formatValue(value) : value}
      </p>
    </div>
  )
}

export default function TrendChart({ data, dataKey, color, valueTransform, formatValue, yDomain }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div style={{ height: CHART_HEIGHT }} className="flex items-center justify-center">
        <p className="text-ink-900/60">No data logged in this range yet</p>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    [dataKey]: valueTransform ? valueTransform(d[dataKey]) : d[dataKey],
  }))

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid stroke="rgba(35,31,26,0.1)" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(35,31,26,0.4)', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          domain={yDomain ?? ['auto', 'auto']}
          tick={{ fill: 'rgba(35,31,26,0.4)', fontSize: 12 }}
        />
        <Tooltip content={(props) => <CustomTooltip {...props} formatValue={formatValue} />} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
