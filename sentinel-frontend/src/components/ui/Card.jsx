import React from 'react'

export function Card({ children, title, subtitle, footer, className = '', headerAction }) {
  return (
    <div className={`glass-card overflow-hidden group transition-all duration-300 hover:shadow-primary/5 ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            {title && <h3 className="text-lg font-display font-semibold text-white tracking-tight leading-none">{title}</h3>}
            {subtitle && <p className="text-xs text-dark-text/40 mt-1.5 font-medium leading-none">{subtitle}</p>}
          </div>
          {headerAction}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5">
          {footer}
        </div>
      )}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h3 className="text-lg font-display font-semibold text-white tracking-tight leading-none">{title}</h3>
        {subtitle && <p className="text-xs text-dark-text/40 mt-1.5 font-medium leading-none">{subtitle}</p>}
      </div>
      {action && <div className="animate-fade-in">{action}</div>}
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, trend, color = 'blue', onClick }) {
  const colorMap = {
    blue: { bg: 'bg-primary/10', icon: 'text-primary-light', glow: 'shadow-primary/5' },
    green: { bg: 'bg-secondary/10', icon: 'text-secondary', glow: 'shadow-secondary/5' },
    red: { bg: 'bg-red-500/10', icon: 'text-red-400', glow: 'shadow-red-500/5' },
    amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400', glow: 'shadow-amber-500/5' },
    purple: { bg: 'bg-accent/10', icon: 'text-accent', glow: 'shadow-accent/5' },
    slate: { bg: 'bg-white/5', icon: 'text-dark-text/50', glow: 'shadow-white/5' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div
      className={`glass-card p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-primary/30 hover:shadow-premium' : ''} ${c.glow}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest">{label}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-display font-bold text-white tracking-tight leading-none">{value ?? '—'}</p>
          </div>
          {trend && (
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-[10px] font-semibold text-dark-text/40 bg-white/5 px-2 py-0.5 rounded-full">{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`${c.bg} rounded-2xl p-4 transition-transform duration-300 group-hover:scale-110`}>
            <Icon size={24} className={c.icon} />
          </div>
        )}
      </div>
    </div>
  )
}