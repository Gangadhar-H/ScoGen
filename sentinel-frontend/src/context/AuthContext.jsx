import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('sentinel_user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await authApi.login(email, password)
      localStorage.setItem('sentinel_token', data.token)
      localStorage.setItem('sentinel_user', JSON.stringify(data))
      setUser(data)
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sentinel_token')
    localStorage.removeItem('sentinel_user')
    setUser(null)
  }, [])

  const hasRole = useCallback((...roles) => {
    return user && roles.includes(user.role)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}