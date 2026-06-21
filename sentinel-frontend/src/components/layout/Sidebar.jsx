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
    <aside className={`flex flex-col bg-dark-bg border-r border-dark-border/50 text-dark-text/70 transition-all duration-300 ease-in-out flex-shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-6 py-8 ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Shield size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <p className="text-lg font-display font-bold text-white tracking-tight leading-none">Sentinel</p>
            <p className="text-[10px] uppercase tracking-widest text-primary-light font-semibold mt-1 opacity-80 leading-none">Intelligence</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {!collapsed && (
          <p className="px-4 mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-dark-text/30">
            {ROLE_LABELS[user?.role] || 'Menu'}
          </p>
        )}
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/exceptions' || item.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                ? 'bg-primary/10 text-primary-light shadow-[inset_0_0_20px_rgba(79,70,229,0.05)] border border-primary/20'
                : 'hover:bg-white/5 hover:text-white border border-transparent'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${collapsed ? '' : ''}`} />
            {!collapsed && <span className="animate-fade-in">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User profile + collapse */}
      <div className="p-4 space-y-4">
        {!collapsed && user && (
          <div className="px-4 py-4 rounded-2xl bg-dark-card/40 border border-dark-border/30 backdrop-blur-md animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-dark-text/40 font-medium truncate mt-0.5">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between px-4 text-xs font-semibold uppercase tracking-wider'} py-2.5 text-dark-text/40 hover:text-white rounded-xl hover:bg-white/5 transition-all group`}
        >
          {!collapsed && <span>Collapse</span>}
          {collapsed ? <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />}
        </button>
      </div>
    </aside >
  )
}