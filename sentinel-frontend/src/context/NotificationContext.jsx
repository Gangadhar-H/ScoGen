import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { notificationsApi } from '../api/notifications.js'
import { useAuth } from './AuthContext.jsx'

const NotifContext = createContext(null)

export function NotifProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const data = await notificationsApi.list({ isRead: false, limit: 1 })
      setUnreadCount(data.unreadCount || 0)
    } catch {}
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30000)
    return () => clearInterval(id)
  }, [refresh])

  return (
    <NotifContext.Provider value={{ unreadCount, setUnreadCount, refresh }}>
      {children}
    </NotifContext.Provider>
  )
}

export function useNotifs() {
  const ctx = useContext(NotifContext)
  if (!ctx) throw new Error('useNotifs must be used within NotifProvider')
  return ctx
}