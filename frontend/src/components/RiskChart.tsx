/**
 * components/RiskChart.tsx — Risk score visualization with Recharts.
 */

import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie, Legend,
} from 'recharts'

interface SeverityData {
  severity: string
  count: number
}

interface RiskRadarData {
  subject: string
  score: number
}

// ── Severity breakdown bar chart ─────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ff2d55',
  High: '#ff6b35',
  Medium: '#ffd60a',
  Low: '#34c759',
  Info: '#636e7b',
}

interface SeverityChartProps {
  data: SeverityData[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-elevated border border-bg-border rounded p-3 font-mono text-xs">
      <div className="text-text-secondary mb-1">{label}</div>
      <div className="text-text-primary font-semibold">{payload[0]?.value} findings</div>
    </div>
  )
}

export function SeverityBarChart({ data }: SeverityChartProps) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <XAxis
            dataKey="severity"
            tick={{ fill: '#8899aa', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            axisLine={{ stroke: '#1e2a3a' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8899aa', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,212,255,0.05)' }} />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] ?? '#636e7b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Risk radar chart ──────────────────────────────────────────────────────────

interface RiskRadarProps {
  data: RiskRadarData[]
}

export function RiskRadarChart({ data }: RiskRadarProps) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#1e2a3a" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#8899aa', fontSize: 9, fontFamily: 'IBM Plex Mono' }}
          />
          <Radar
            name="Risk Score"
            dataKey="score"
            stroke="#00d4ff"
            fill="#00d4ff"
            fillOpacity={0.12}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Severity donut / pie chart ────────────────────────────────────────────────

interface SeverityPieProps {
  data: SeverityData[]
}

export function SeverityPieChart({ data }: SeverityPieProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="h-56 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            dataKey="count"
            nameKey="severity"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] ?? '#636e7b'} />
            ))}
          </Pie>
          <Legend
            iconType="circle"
            iconSize={6}
            formatter={(value) => (
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#8899aa' }}>
                {value}
              </span>
            )}
          />
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center total */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center" style={{ marginTop: '-20px' }}>
          <div className="font-mono text-2xl font-semibold text-text-primary">{total}</div>
          <div className="font-mono text-[9px] text-text-muted tracking-widest">TOTAL</div>
        </div>
      </div>
    </div>
  )
}
