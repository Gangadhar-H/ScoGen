import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className={`relative glass-card shadow-2xl border-white/10 w-full ${sizes[size]} max-h-[90vh] flex flex-col animate-fade-in overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0 bg-white/[0.02]">
          <h2 className="text-lg font-display font-bold text-white tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-dark-text/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}