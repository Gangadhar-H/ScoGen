import React, { useState } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { Button } from '../components/ui/Button.jsx'

const DEMO_ACCOUNTS = [
  { email: 'admin@socgen.local', role: 'Admin' },
  { email: 'requester@socgen.local', role: 'Requester' },
  { email: 'manager@socgen.local', role: 'Approver' },
  { email: 'security@socgen.local', role: 'Security Reviewer' },
  { email: 'auditor@socgen.local', role: 'Auditor' },
]

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 to-brand-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white">SentinelGRC</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white leading-snug">
            Policy Exception<br />Lifecycle Management
          </h2>
          <p className="text-slate-400 mt-4 text-sm leading-relaxed max-w-sm">
            Enterprise-grade governance, risk, and compliance platform for managing policy exceptions across your organization.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: 'Risk Scoring', desc: 'Automated risk assessment' },
              { label: 'Audit Trail', desc: 'Immutable audit logs' },
              { label: 'Approval Workflows', desc: 'Multi-stage reviews' },
              { label: 'Compliance Mapping', desc: 'NIST, GDPR, ISO 27001' },
            ].map((f) => (
              <div key={f.label} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-xs font-semibold text-brand-300">{f.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">© 2025 SentinelGRC. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">SentinelGRC</span>
          </div>

          <h1 className="text-xl font-bold text-white mb-1">Sign in to your account</h1>
          <p className="text-sm text-slate-400 mb-8">Enter your credentials to access the platform</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/50 border border-red-700 rounded-lg px-4 py-3 mb-5">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-3 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 pr-10 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="primary" loading={loading} className="w-full justify-center py-2.5">
              Sign in
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <p className="text-xs text-slate-500 text-center mb-3">Demo accounts (password: <code className="text-brand-400 font-mono">password123</code>)</p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => { setEmail(a.email); setPassword('password123') }}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg hover:bg-slate-800 hover:border-slate-600 transition-colors text-left"
                >
                  <span className="text-xs text-slate-300 font-mono">{a.email}</span>
                  <span className="text-[10px] text-brand-400 font-semibold">{a.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}