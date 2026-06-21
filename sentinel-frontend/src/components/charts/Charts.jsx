import React from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts'
import { Card, CardHeader } from '../ui/Card.jsx'

const RISK_CHART_COLORS = {
  LOW: '#06B6D4',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#EF4444',
}

const STATUS_CHART_COLORS = {
  DRAFT: '#262626',
  SUBMITTED: '#4F46E5',
  MANAGER_APPROVED: '#06B6D4',
  INFO_REQUESTED: '#A78BFA',
  ACTIVE: '#10B981',
  EXPIRED: '#EF4444',
  REVOKED: '#4B5563',
  REJECTED: '#DC2626',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-card/90 backdrop-blur-xl border border-dark-border/50 shadow-2xl rounded-xl px-4 py-3 animate-fade-in">
      {label && <p className="text-xs font-bold text-white uppercase tracking-widest mb-2 opacity-40">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <p className="text-xs text-dark-text font-medium">
            <span className="opacity-60">{p.name}:</span> <span className="text-white font-bold">{p.value}</span>
          </p>
        </div>
      ))}
    </div>
  )
}

export function RiskDistributionChart({ data }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({ name, value }))
  if (!chartData.length) return <div className="h-40 flex items-center justify-center text-xs text-dark-text/20">System idle - No data</div>

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={RISK_CHART_COLORS[entry.name] || '#262626'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-[10px] font-bold text-dark-text/40 uppercase tracking-widest ml-1">{value}</span>}
          iconSize={6}
          iconType="circle"
          verticalAlign="bottom"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function StatusOverviewChart({ data }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({ name: name.replace('_', ' '), value, key: name }))
  if (!chartData.length) return <div className="h-40 flex items-center justify-center text-xs text-dark-text/20">System idle - No data</div>

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={STATUS_CHART_COLORS[entry.key] || '#262626'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(value) => <span className="text-[10px] font-bold text-dark-text/40 uppercase tracking-widest ml-1">{value}</span>} iconSize={6} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function DepartmentRiskChart({ data }) {
  if (!data) return <div className="h-40 flex items-center justify-center text-xs text-dark-text/20">No department data available</div>

  const depts = Object.keys(data)
  const statuses = ['ACTIVE', 'SUBMITTED', 'EXPIRED', 'DRAFT']

  const chartData = depts.map((dept) => ({
    dept: dept.length > 12 ? dept.slice(0, 12) + '…' : dept,
    ...statuses.reduce((acc, s) => ({ ...acc, [s]: data[dept][s] || 0 }), {}),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#666' }} axisLine={{ stroke: '#262626' }} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={{ stroke: '#262626' }} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <Bar dataKey="ACTIVE" stackId="a" fill="#10B981" name="Active" radius={[0, 0, 0, 0]} />
        <Bar dataKey="SUBMITTED" stackId="a" fill="#4F46E5" name="Submitted" />
        <Bar dataKey="EXPIRED" stackId="a" fill="#EF4444" name="Expired" />
        <Bar dataKey="DRAFT" stackId="a" fill="#262626" name="Draft" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ComplianceImpactChart({ data }) {
  if (!data?.length) return <div className="h-40 flex items-center justify-center text-xs text-dark-text/20">No framework alignment data</div>

  const chartData = data.map((d) => ({ framework: d.framework, count: d.exceptionCount }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis dataKey="framework" type="category" tick={{ fontSize: 10, fill: '#666' }} width={80} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <Bar dataKey="count" fill="#4F46E5" name="Exceptions" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  )
}