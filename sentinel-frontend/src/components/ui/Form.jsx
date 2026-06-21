import React from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2, FileX } from 'lucide-react'

export function FormField({ label, error, required, children }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-[10px] font-bold text-dark-text/30 uppercase tracking-widest px-1">
          {label} {required && <span className="text-red-500 normal-case">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-wider px-1">{error}</p>}
    </div>
  )
}

export function Input({ className = '', ...props }) {
  return <input className={`input-field ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`input-field appearance-none cursor-pointer ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', rows = 3, ...props }) {
  return <textarea rows={rows} className={`input-field resize-none min-h-[100px] ${className}`} {...props} />
}

export function SearchBar({ value, onChange, placeholder = 'Search repository...', className = '' }) {
  return (
    <div className={`relative group ${className}`}>
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text/20 group-focus-within:text-primary transition-colors" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-12 pr-6"
      />
    </div>
  )
}

export function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
      <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest">
        Displaying <span className="text-white">{start}–{end}</span> <span className="lowercase transition-all">of</span> <span className="text-white">{total}</span>
      </p>
      <div className="flex items-center gap-1.5 focus:outline-none">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg text-dark-text/30 hover:bg-white/5 hover:text-white disabled:opacity-0 transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum
            if (totalPages <= 5) pageNum = i + 1
            else if (page <= 3) pageNum = i + 1
            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
            else pageNum = page - 2 + i
            return (
              <button
                key={pageNum}
                onClick={() => onChange(pageNum)}
                className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${page === pageNum ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-dark-text/30 hover:bg-white/5 hover:text-white'}`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg text-dark-text/30 hover:bg-white/5 hover:text-white disabled:opacity-0 transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }
  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <div className="absolute inset-0 rounded-full border-2 border-white/5" />
      <Loader2 className={`animate-spin text-primary w-full h-full stroke-[3px]`} />
    </div>
  )
}

export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in gap-4">
      <Spinner size="lg" />
      <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest animate-pulse">Syncing with Governance Node...</p>
    </div>
  )
}

export function EmptyState({ title = 'No assets found', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 text-dark-text/10">
        <FileX size={40} />
      </div>
      <p className="text-xl font-display font-semibold text-white tracking-tight">{title}</p>
      {message && <p className="text-sm text-dark-text/40 mt-2 max-w-sm font-medium">{message}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  )
}

export function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-4 flex items-center gap-4 animate-shake">
      <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
      <p className="text-xs font-bold text-red-300 uppercase tracking-wider">{message}</p>
    </div>
  )
}