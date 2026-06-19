import React from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts'
import { Card, CardHeader } from '../ui/Card.jsx'

const RISK_CHART_COLORS = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
}

const STATUS_CHART_COLORS = {
  DRAFT: '#94a3b8',
  SUBMITTED: '#eab308',
  MANAGER_APPROVED: '#3b82f6',
  INFO_REQUESTED: '#a855f7',
  ACTIVE: '#22c55e',
  EXPIRED: '#ef4444',
  REVOKED: '#64748b',
  REJECTED: '#f97316',
}

const PALETTE = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#f97316']

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg px-3 py-2">
      {label && <p className="text-xs font-semibold text-slate-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-slate-600" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function RiskDistributionChart({ data }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({ name, value }))
  if (!chartData.length) return <div className="h-40 flex items-center justify-center text-xs text-slate-400">No data</div>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={RISK_CHART_COLORS[entry.name] || '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function StatusOverviewChart({ data }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({ name: name.replace('_', ' '), value, key: name }))
  if (!chartData.length) return <div className="h-40 flex items-center justify-center text-xs text-slate-400">No data</div>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" outerRadius={85} paddingAngle={2} dataKey="value">
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={STATUS_CHART_COLORS[entry.key] || '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} iconSize={8} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function DepartmentRiskChart({ data }) {
  if (!data) return <div className="h-40 flex items-center justify-center text-xs text-slate-400">No data</div>

  const depts = Object.keys(data)
  const statuses = ['ACTIVE', 'SUBMITTED', 'EXPIRED', 'DRAFT']

  const chartData = depts.map((dept) => ({
    dept: dept.length > 10 ? dept.slice(0, 10) + '…' : dept,
    ...statuses.reduce((acc, s) => ({ ...acc, [s]: data[dept][s] || 0 }), {}),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 0, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="ACTIVE" stackId="a" fill="#22c55e" name="Active" />
        <Bar dataKey="SUBMITTED" stackId="a" fill="#eab308" name="Submitted" />
        <Bar dataKey="EXPIRED" stackId="a" fill="#ef4444" name="Expired" />
        <Bar dataKey="DRAFT" stackId="a" fill="#94a3b8" name="Draft" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ComplianceImpactChart({ data }) {
  if (!data?.length) return <div className="h-40 flex items-center justify-center text-xs text-slate-400">No data</div>

  const chartData = data.map((d) => ({ framework: d.framework, count: d.exceptionCount }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 60, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} />
        <YAxis dataKey="framework" type="category" tick={{ fontSize: 10 }} width={56} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" fill="#6366f1" name="Exceptions" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}