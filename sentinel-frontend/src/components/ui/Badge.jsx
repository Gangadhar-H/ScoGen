import React from 'react'
import { RISK_COLORS, STATUS_COLORS, STATUS_LABELS } from '../../utils/format.js'

export function RiskBadge({ level }) {
  if (!level) return null
  const levelColors = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/20',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
    LOW: 'bg-secondary/20 text-secondary border-secondary/20',
  }
  const colors = levelColors[level] || levelColors.LOW
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${colors}`}>
      <span className="w-1 h-1 rounded-full bg-current opacity-70" />
      {level}
    </span>
  )
}

export function StatusBadge({ status }) {
  if (!status) return null
  const statusColors = {
    ACTIVE: 'bg-secondary/20 text-secondary border-secondary/20',
    SUBMITTED: 'bg-primary/20 text-primary-light border-primary/20',
    DRAFT: 'bg-white/5 text-dark-text/40 border-white/5',
    EXPIRED: 'bg-red-500/20 text-red-400 border-red-500/20',
    APPROVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
    REJECTED: 'bg-red-500/20 text-red-400 border-red-500/20',
  }
  const colors = statusColors[status] || statusColors.DRAFT
  const label = STATUS_LABELS[status] || status
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${colors}`}>
      {label}
    </span>
  )
}

export function Badge({ children, color = 'slate' }) {
  const colorMap = {
    slate: 'bg-white/5 text-dark-text/40 border-white/5',
    blue: 'bg-primary/20 text-primary-light border-primary/20',
    green: 'bg-secondary/20 text-secondary border-secondary/20',
    yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/20 text-red-400 border-red-500/20',
    purple: 'bg-accent/20 text-accent border-accent/20',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${colorMap[color] || colorMap.slate}`}>
      {children}
    </span>
  )
}