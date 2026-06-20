import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotifProvider } from './context/NotifContext.jsx'
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx'

import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ExceptionsPage from './pages/ExceptionsPage.jsx'
import ExceptionDetailPage from './pages/ExceptionDetailPage.jsx'
import ExceptionFormPage from './pages/ExceptionFormPage.jsx'
import ApprovalsPage from './pages/ApprovalsPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import AuditLogsPage from './pages/AuditLogsPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotifProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />

            {/* Exceptions */}
            <Route path="/exceptions" element={
              <ProtectedRoute><ExceptionsPage /></ProtectedRoute>
            } />
            <Route path="/exceptions/new" element={
              <ProtectedRoute roles={['REQUESTER', 'ADMIN']}><ExceptionFormPage /></ProtectedRoute>
            } />
            <Route path="/exceptions/:id" element={
              <ProtectedRoute><ExceptionDetailPage /></ProtectedRoute>
            } />
            <Route path="/exceptions/:id/edit" element={
              <ProtectedRoute><ExceptionFormPage /></ProtectedRoute>
            } />

            {/* Approvals (Approver, Security Reviewer, Admin) */}
            <Route path="/approvals" element={
              <ProtectedRoute roles={['APPROVER', 'SECURITY_REVIEWER', 'ADMIN']}>
                <ApprovalsPage />
              </ProtectedRoute>
            } />

            {/* Reports (Security Reviewer, Auditor, Admin) */}
            <Route path="/reports" element={
              <ProtectedRoute roles={['SECURITY_REVIEWER', 'AUDITOR', 'ADMIN']}>
                <ReportsPage />
              </ProtectedRoute>
            } />

            {/* Audit Logs (Security Reviewer, Auditor, Admin) */}
            <Route path="/audit-logs" element={
              <ProtectedRoute roles={['SECURITY_REVIEWER', 'AUDITOR', 'ADMIN']}>
                <AuditLogsPage />
              </ProtectedRoute>
            } />

            {/* Notifications (any authenticated user) */}
            <Route path="/notifications" element={
              <ProtectedRoute><NotificationsPage /></ProtectedRoute>
            } />

            {/* Admin (Admin only) */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['ADMIN']}><AdminPage /></ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotifProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}