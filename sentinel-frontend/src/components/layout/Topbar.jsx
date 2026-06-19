import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, LogOut, User, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useNotifs } from '../../context/NotifContext.jsx'
import { notificationsApi } from '../../api/notifications.js'
import { timeAgo } from '../../utils/format.js'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/exceptions': 'Exceptions',
  '/exceptions/new': 'New Exception Request',
  '/approvals': 'Approval Queue',
  '/reports': 'Reports',
  '/audit-logs': 'Audit Logs',
  '/admin': 'Administration',
  '/notifications': 'Notification Center',
}

function NotifDropdown({ onClose }) {
  const [notifs, setNotifs] = useState([])
  const { setUnreadCount } = useNotifs()
  const navigate = useNavigate()

  useEffect(() => {
    notificationsApi.list({ limit: 10 }).then((d) => setNotifs(d.data || []))
  }, [])

  async function handleMarkAll() {
    await notificationsApi.markAllRead()
    setNotifs(notifs.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  async function handleMark(id) {
    await notificationsApi.markRead(id)
    setNotifs(notifs.map((n) => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  return (
    <div className="absolute right-0 top-10 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
        <button onClick={handleMarkAll} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
          Mark all read
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
        {notifs.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-8">No notifications</p>
        )}
        {notifs.map((n) => (
          <div
            key={n.id}
            onClick={() => { handleMark(n.id); onClose() }}
            className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}
          >
            <div className="flex items-start gap-2">
              {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />}
              <div className={!n.isRead ? '' : 'pl-3.5'}>
                <p className="text-xs text-slate-800 leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-slate-100">
        <button
          onClick={() => { navigate('/notifications'); onClose() }}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          View all notifications →
        </button>
      </div>
    </div>
  )
}

export function Topbar() {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifs()
  const navigate = useNavigate()
  const location = useLocation()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUser, setShowUser] = useState(false)

  const pathKey = Object.keys(PAGE_TITLES).find((k) => location.pathname === k || location.pathname.startsWith(k + '/'))
  const title = PAGE_TITLES[pathKey] || 'SentinelGRC'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-slate-200 h-14 flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUser(false) }}
            className="relative p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && <NotifDropdown onClose={() => setShowNotifs(false)} />}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUser(!showUser); setShowNotifs(false) }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">
              <User size={12} className="text-brand-700" />
            </div>
            <span className="text-sm font-medium text-slate-700 max-w-32 truncate">{user?.name}</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>
          {showUser && (
            <div className="absolute right-0 top-10 w-44 bg-white rounded-lg border border-slate-200 shadow-xl z-50 py-1">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-800">{user?.name}</p>
                <p className="text-[10px] text-slate-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={12} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside handler */}
      {(showNotifs || showUser) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotifs(false); setShowUser(false) }} />
      )}
    </header>
  )
}