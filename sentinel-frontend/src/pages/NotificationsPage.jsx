import React, { useState } from 'react'
import { Bell, Trash2, CheckCheck } from 'lucide-react'
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
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-slate-500" />
          <span className="text-sm text-slate-600">{notifs.length} notifications</span>
          {unread > 0 && <Badge color="blue">{unread} unread</Badge>}
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" loading={markingAll} onClick={handleMarkAll}>
            <CheckCheck size={12} /> Mark all read
          </Button>
        )}
      </div>

      {notifs.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <Bell size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No notifications</p>
          </div>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-slate-50">
            {notifs.map((n) => (
              <div key={n.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/40' : ''}`}>
                <div className="flex-shrink-0 mt-0.5">
                  {!n.isRead ? (
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-1" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-200 mt-1" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge color={TYPE_COLORS[n.type] || 'slate'}>{n.type?.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-sm text-slate-800">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMark(n.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                      title="Mark as read"
                    >
                      <CheckCheck size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}