import React from 'react'
import { RISK_COLORS, STATUS_COLORS, STATUS_LABELS } from '../../utils/format.js'

export function RiskBadge({ level }) {
  if (!level) return null
  const colors = RISK_COLORS[level] || RISK_COLORS.LOW
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {level}
    </span>
  )
}

export function StatusBadge({ status }) {
  if (!status) return null
  const colors = STATUS_COLORS[status] || STATUS_COLORS.DRAFT
  const label = STATUS_LABELS[status] || status
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}>
      {label}
    </span>
  )
}

export function Badge({ children, color = 'slate' }) {
  const colorMap = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorMap[color] || colorMap.slate}`}>
      {children}
    </span>
  )
}