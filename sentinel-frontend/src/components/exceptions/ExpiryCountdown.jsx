import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

function getRemaining(expiryDate) {
    const diff = new Date(expiryDate).getTime() - Date.now()
    if (diff <= 0) return null
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    return { days, hours, mins, diff }
}

export function ExpiryCountdown({ expiryDate }) {
    const [remaining, setRemaining] = useState(() => getRemaining(expiryDate))

    useEffect(() => {
        const id = setInterval(() => setRemaining(getRemaining(expiryDate)), 60000)
        return () => clearInterval(id)
    }, [expiryDate])

    if (!expiryDate || !remaining) return null
    // Only show countdown if expiring within 7 days
    if (remaining.diff > 7 * 86400000) return null

    const urgent = remaining.days < 1
    const warn = remaining.days < 3

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-all ${urgent ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                warn ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
            <Clock size={12} className={urgent ? 'animate-pulse' : ''} />
            <span className="tracking-widest uppercase">
                {remaining.days}d {remaining.hours}h {remaining.mins}m
            </span>
        </span>
    )
}