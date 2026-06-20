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
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${urgent ? 'bg-red-100 text-red-700' : warn ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
            }`}>
            <Clock size={10} />
            {remaining.days}d {remaining.hours}h {remaining.mins}m
        </span>
    )
}