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
    <div className="absolute right-0 top-[calc(100%+12px)] w-80 bg-dark-card border border-dark-border shadow-2xl rounded-2xl z-50 animate-fade-in overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border/50">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest opacity-30">Notifications</h3>
        <button onClick={handleMarkAll} className="text-xs text-primary-light hover:text-white transition-colors font-semibold">
          Mark all read
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto custom-scrollbar">
        {notifs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="p-3 rounded-full bg-white/5 mb-3">
              <Bell size={24} className="text-dark-text/20" />
            </div>
            <p className="text-xs text-dark-text/40 font-medium">All caught up!</p>
          </div>
        )}
        {notifs.map((n) => (
          <div
            key={n.id}
            onClick={() => { handleMark(n.id); onClose() }}
            className={`px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors group relative ${!n.isRead ? 'bg-primary/5' : ''}`}
          >
            {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-relaxed transition-colors ${!n.isRead ? 'text-white font-medium' : 'text-dark-text/60'}`}>{n.message}</p>
                <p className="text-[10px] text-dark-text/30 mt-1.5 font-medium">{timeAgo(n.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-dark-border/50 bg-white/5">
        <button
          onClick={() => { navigate('/notifications'); onClose() }}
          className="w-full text-center text-xs text-primary-light hover:text-white transition-colors font-bold uppercase tracking-wider"
        >
          View All Center
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
  const title = PAGE_TITLES[pathKey] || 'Sentinel'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-dark-bg/40 backdrop-blur-xl border-b border-dark-border/30 h-20 flex items-center px-8 gap-6 flex-shrink-0 relative z-40">
      <div className="flex-1">
        <h1 className="text-xl font-display font-bold text-white tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-5">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUser(false) }}
            className={`relative p-2.5 rounded-xl transition-all duration-200 ${showNotifs
              ? 'bg-primary/20 text-primary-light border border-primary/30'
              : 'text-dark-text/50 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            )}
          </button>
          {showNotifs && <NotifDropdown onClose={() => setShowNotifs(false)} />}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-dark-border/50" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUser(!showUser); setShowNotifs(false) }}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${showUser
              ? 'bg-white/10 text-white border border-white/20'
              : 'hover:bg-white/5 transition-colors border border-transparent text-dark-text/70'
              }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
              <User size={16} className="text-primary-light" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold leading-none">{user?.name}</p>
              <p className="text-[10px] text-dark-text/40 mt-1 font-medium">{user?.email}</p>
            </div>
            <ChevronDown size={14} className={`text-dark-text/30 transition-transform duration-200 ${showUser ? 'rotate-180' : ''}`} />
          </button>
          {showUser && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-56 bg-dark-card border border-dark-border shadow-2xl rounded-2xl p-2 animate-fade-in overflow-hidden">
              <div className="px-4 py-4 mb-1 border-b border-dark-border/50">
                <p className="text-xs font-bold text-dark-text/30 uppercase tracking-widest leading-none">Account</p>
                <p className="text-sm font-semibold text-white mt-2 truncate">{user?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 rounded-xl transition-colors font-medium mt-1 group"
              >
                <div className="p-1.5 rounded-lg bg-red-400/10 group-hover:bg-red-400/20 transition-colors">
                  <LogOut size={14} />
                </div>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside handler */}
      {(showNotifs || showUser) && (
        <div className="fixed inset-0 z-[-1]" onClick={() => { setShowNotifs(false); setShowUser(false) }} />
      )}
    </header>
  )
}