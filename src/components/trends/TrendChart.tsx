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
  avgKey?: string // optional precomputed rolling-average series merged in alongside dataKey
}

const CHART_HEIGHT = 260

function CustomTooltip({ active, payload, label, formatValue, avgKey }: TooltipContentProps<number, string> & { formatValue?: (raw: number) => string; avgKey?: string }) {
  if (!active || !payload || payload.length === 0) return null
  const rawEntry = avgKey ? payload.find((p) => p.dataKey !== avgKey) : payload[0]
  const avgEntry = avgKey ? payload.find((p) => p.dataKey === avgKey) : undefined
  const value = rawEntry?.value as number

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
      {avgEntry && (
        <p style={{ color: 'rgba(35,31,26,0.6)', fontSize: 12, margin: 0 }}>
          7-day avg: {formatValue ? formatValue(avgEntry.value as number) : avgEntry.value}
        </p>
      )}
    </div>
  )
}

export default function TrendChart({ data, dataKey, color, valueTransform, formatValue, yDomain, avgKey }: TrendChartProps) {
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
        <Tooltip content={(props) => <CustomTooltip {...props} formatValue={formatValue} avgKey={avgKey} />} />
        {avgKey ? (
          <>
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeOpacity={0.4}
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={{ r: 2, fill: color, fillOpacity: 0.4, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
            <Line type="monotone" dataKey={avgKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </>
        ) : (
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
