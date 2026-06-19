import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Shield, LayoutDashboard, FileText, CheckSquare, Eye, Users,
  BarChart3, Bell, BookOpen, Settings, ChevronLeft, ChevronRight,
  AlertTriangle, Lock
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROLE_LABELS } from '../../utils/format.js'

const NAV_ITEMS = {
  REQUESTER: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/exceptions', label: 'My Exceptions', icon: FileText },
    { to: '/exceptions/new', label: 'New Request', icon: FileText },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ],
  APPROVER: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/approvals', label: 'Approval Queue', icon: CheckSquare },
    { to: '/exceptions', label: 'Exceptions', icon: FileText },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ],
  SECURITY_REVIEWER: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/approvals', label: 'Review Queue', icon: Eye },
    { to: '/exceptions', label: 'Exceptions', icon: FileText },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/audit-logs', label: 'Audit Logs', icon: BookOpen },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ],
  AUDITOR: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/exceptions', label: 'Exceptions', icon: FileText },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/audit-logs', label: 'Audit Logs', icon: BookOpen },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ],
  ADMIN: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/exceptions', label: 'Exceptions', icon: FileText },
    { to: '/approvals', label: 'Approvals', icon: CheckSquare },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/audit-logs', label: 'Audit Logs', icon: BookOpen },
    { to: '/admin', label: 'Administration', icon: Settings },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ],
}

export function Sidebar() {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const items = NAV_ITEMS[user?.role] || []

  return (
    <aside className={`flex flex-col bg-slate-900 text-slate-300 transition-all duration-200 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <Shield size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-white leading-none">SentinelGRC</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Policy Management</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {ROLE_LABELS[user?.role] || 'Navigation'}
          </p>
        )}
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={16} className="flex-shrink-0" />
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + collapse */}
      <div className="border-t border-slate-700/50 p-3 space-y-2">
        {!collapsed && user && (
          <div className="px-2 py-2 rounded-md bg-slate-800">
            <p className="text-xs font-medium text-white truncate">{user.name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{ROLE_LABELS[user.role]}</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-end'} px-2 py-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-800 transition-colors`}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  )
}