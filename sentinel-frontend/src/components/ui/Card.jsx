import React from 'react'

export function Card({ children, className = '', padding = true }) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, trend, color = 'blue', onClick }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', val: 'text-blue-700' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', val: 'text-green-700' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', val: 'text-red-700' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', val: 'text-amber-700' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', val: 'text-purple-700' },
    slate: { bg: 'bg-slate-50', icon: 'text-slate-600', val: 'text-slate-700' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 shadow-sm p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
          <p className={`mt-1.5 text-2xl font-bold ${c.val}`}>{value ?? '—'}</p>
          {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
        </div>
        {Icon && (
          <div className={`${c.bg} rounded-lg p-3`}>
            <Icon size={20} className={c.icon} />
          </div>
        )}
      </div>
    </div>
  )
}