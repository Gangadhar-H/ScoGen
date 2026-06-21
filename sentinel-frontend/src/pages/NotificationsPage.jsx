import React, { useState } from 'react'
import { Bell, Trash2, CheckCheck, Clock } from 'lucide-react'
import { notificationsApi } from '../api/notifications.js'
import { useNotifs } from '../context/NotifContext.jsx'
import { useFetch } from '../hooks/useFetch.js'
import { Card } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { PageSpinner } from '../components/ui/Form.jsx'
import { formatDateTime, timeAgo } from '../utils/format.js'

const TYPE_COLORS = {
  APPROVAL_REQUIRED: 'blue',
  EXPIRY_WARNING: 'amber',
  OVERDUE: 'red',
  RENEWAL_REQUIRED: 'orange',
  APPROVAL_CONFIRMED: 'green',
  REJECTED: 'red',
  INFO_REQUESTED: 'purple',
}

export default function NotificationsPage() {
  const { setUnreadCount } = useNotifs()
  const [markingAll, setMarkingAll] = useState(false)

  const { data, loading, refetch } = useFetch(
    () => notificationsApi.list({ limit: 100 }),
    []
  )

  const notifs = data?.data || []

  async function handleMarkAll() {
    setMarkingAll(true)
    try {
      await notificationsApi.markAllRead()
      setUnreadCount(0)
      refetch()
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleMark(id) {
    await notificationsApi.markRead(id)
    setUnreadCount(c => Math.max(0, c - 1))
    refetch()
  }

  async function handleDelete(id) {
    await notificationsApi.delete(id)
    refetch()
  }

  if (loading) return <PageSpinner />

  const unread = notifs.filter(n => !n.isRead).length

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Activity Stream</h1>
          <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest mt-1">
            Real-time architectural events and governance alerts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-dark-text/30 font-bold text-[10px] uppercase tracking-widest">
            <Bell size={14} /> {notifs.length} Transmission{notifs.length !== 1 ? 's' : ''}
          </div>
          {unread > 0 && (
            <Button variant="secondary" size="sm" loading={markingAll} onClick={handleMarkAll}>
              <CheckCheck size={14} /> <span>Acknowledge All</span>
            </Button>
          )}
        </div>
      </div>

      {notifs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mb-6 text-dark-text/10">
            <Bell size={32} />
          </div>
          <p className="text-sm font-bold text-dark-text/30 uppercase tracking-widest">No active transmissions in current sector</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => (
            <div key={n.id} className={`glass-card p-5 group hover:bg-white/[0.04] transition-all border-white/5 flex items-start gap-4 ${!n.isRead ? 'border-primary/20 bg-primary/5 shadow-[0_0_20px_rgba(79,70,229,0.05)]' : ''}`}>
              <div className="flex-shrink-0 mt-1">
                {!n.isRead ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(79,70,229,0.5)] animate-pulse" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge color={TYPE_COLORS[n.type] || 'milk'}>{n.type?.replace(/_/g, ' ')}</Badge>
                </div>
                <p className={`text-sm leading-relaxed ${!n.isRead ? 'text-white font-bold' : 'text-dark-text/40 font-medium'}`}>{n.message}</p>
                <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-dark-text/30 uppercase tracking-widest">
                  <Clock size={10} /> {timeAgo(n.createdAt)}
                  <span className="opacity-20">•</span>
                  <span className="font-mono">{formatDateTime(n.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                {!n.isRead && (
                  <button
                    onClick={() => handleMark(n.id)}
                    className="p-2 rounded-xl text-dark-text/30 hover:text-primary hover:bg-primary/10 transition-all"
                    title="Acknowledge"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-2 rounded-xl text-dark-text/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Purge"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}