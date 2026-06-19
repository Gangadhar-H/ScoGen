import React from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2, FileX } from 'lucide-react'

export function FormField({ label, error, required, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="sentinel-label">
          {label} {required && <span className="text-red-500 normal-case">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Input({ className = '', ...props }) {
  return <input className={`sentinel-input ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`sentinel-input ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', rows = 3, ...props }) {
  return <textarea rows={rows} className={`sentinel-input resize-none ${className}`} {...props} />
}

export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="sentinel-input pl-9 pr-4"
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
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
      <p className="text-xs text-slate-500">
        Showing <span className="font-medium">{start}–{end}</span> of <span className="font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
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
              className={`w-7 h-7 rounded text-xs font-medium ${page === pageNum ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {pageNum}
            </button>
          )
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return <Loader2 className={`animate-spin text-brand-600 ${sizes[size]} ${className}`} />
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )
}

export function EmptyState({ title = 'No data', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileX size={36} className="text-slate-300 mb-3" />
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {message && <p className="text-xs text-slate-400 mt-1 max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  )
}