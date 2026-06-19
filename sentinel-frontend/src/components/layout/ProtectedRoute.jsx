import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { AppLayout } from '../layout/AppLayout.jsx'

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <span className="text-red-600 text-lg">🔒</span>
          </div>
          <h2 className="text-base font-semibold text-slate-800 mb-1">Access Restricted</h2>
          <p className="text-sm text-slate-500">Your role doesn't have permission to view this page.</p>
        </div>
      </AppLayout>
    )
  }

  return <AppLayout>{children}</AppLayout>
}