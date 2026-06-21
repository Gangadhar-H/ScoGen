import React from 'react'
import { Loader2 } from 'lucide-react'

export function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  const base = 'inline-flex items-center gap-2 font-semibold transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed justify-center'

  const variants = {
    primary: 'bg-gradient-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95',
    secondary: 'bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 active:scale-95',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-95',
    ghost: 'text-dark-text/60 hover:text-white hover:bg-white/5 active:scale-95',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 active:scale-95',
  }

  const sizes = {
    sm: 'text-xs px-4 py-2 rounded-lg',
    md: 'text-sm px-6 py-2.5 rounded-xl',
    lg: 'text-base px-8 py-3 rounded-2xl',
  }

  // Override sizes for rounded-full if needed, but let's stick to consistent rounded-xl+
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}