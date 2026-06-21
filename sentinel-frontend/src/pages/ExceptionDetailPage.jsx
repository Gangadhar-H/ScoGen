import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit, Trash2, Send, RefreshCw, XCircle,
  Shield, Clock, CheckCircle, AlertTriangle, User, Building, Calendar,
  AlertOctagon
} from 'lucide-react'
import { exceptionsApi } from '../api/exceptions.js'
import { auditApi } from '../api/audit.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { RiskBadge, StatusBadge, Badge } from '../components/ui/Badge.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { PageSpinner, ErrorMessage, FormField, Textarea } from '../components/ui/Form.jsx'
import { formatDate, formatDateTime } from '../utils/format.js'
import { ExpiryCountdown } from '../components/exceptions/ExpiryCountdown.jsx'

function TimelineEvent({ action, user, timestamp, oldValue, newValue }) {
  const ACTION_ICONS = {
    CREATE_EXCEPTION: CheckCircle,
    SUBMIT_FOR_REVIEW: Send,
    APPROVE: CheckCircle,
    REJECT: XCircle,
    REQUEST_INFO: AlertTriangle,
    REVOKE: XCircle,
    EMERGENCY_REVOKE: XCircle,
    UPDATE_EXCEPTION: Edit,
    RENEW: RefreshCw,
  }
  const Icon = ACTION_ICONS[action] || Clock

  return (
    <div className="flex gap-4 relative group">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center transition-colors group-hover:border-primary/30 z-10">
          <Icon size={14} className="text-dark-text/40 group-hover:text-primary transition-colors" />
        </div>
        <div className="w-0.5 h-full bg-white/5 group-last:bg-transparent -mt-1" />
      </div>
      <div className="flex-1 pb-8">
        <p className="text-xs font-bold text-white uppercase tracking-widest">{action.replace(/_/g, ' ')}</p>
        <p className="text-[10px] text-dark-text/30 font-medium mt-1">
          {user?.name || 'Governance Engine'} <span className="mx-1.5 opacity-20">/</span> {formatDateTime(timestamp)}
        </p>
        {(newValue?.status || newValue?.riskLevel) && (
          <div className="mt-3 flex items-center gap-2">
            {newValue.status && <StatusBadge status={newValue.status} />}
            {newValue.riskLevel && <RiskBadge level={newValue.riskLevel} />}
          </div>
        )}
      </div>
    </div>
  )
}

function RiskBar({ label, value, max = 100 }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] font-bold text-dark-text/40 uppercase tracking-widest">{label}</span>
        <span className="text-xs font-mono font-bold text-white">{value}<span className="text-[10px] opacity-20 ml-0.5">/{max}</span></span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-1000 shadow-lg shadow-primary/20" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ExceptionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()

  const [exception, setException] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [modal, setModal] = useState(null) // 'revoke' | 'delete'
  const [revokeReason, setRevokeReason] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [exc, tl] = await Promise.all([
        exceptionsApi.get(id),
        auditApi.timeline(id).catch(() => ({ timeline: [] })),
      ])
      setException(exc)
      setTimeline(tl.timeline || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleSubmit() {
    setActionLoading(true)
    try {
      await exceptionsApi.submit(id)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRenew() {
    setActionLoading(true)
    try {
      await exceptionsApi.renew(id)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRevoke() {
    setActionLoading(true)
    try {
      await exceptionsApi.revoke(id, revokeReason)
      setModal(null)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    setActionLoading(true)
    try {
      await exceptionsApi.delete(id)
      navigate('/exceptions')
    } catch (e) {
      setError(e.message)
      setActionLoading(false)
    }
  }

  if (loading) return <PageSpinner />
  if (error && !exception) return <ErrorMessage message={error} />
  if (!exception) return null

  const isOwner = exception.requesterId === user?.id
  const canEdit = (isOwner || hasRole('ADMIN')) && ['DRAFT', 'INFO_REQUESTED'].includes(exception.status)
  const canSubmit = (isOwner || hasRole('ADMIN')) && ['DRAFT', 'INFO_REQUESTED'].includes(exception.status)
  const canDelete = (isOwner || hasRole('ADMIN')) && exception.status === 'DRAFT'
  const canRenew = (isOwner || hasRole('ADMIN')) && exception.status === 'ACTIVE'
  const canRevoke = (isOwner || hasRole('ADMIN', 'SECURITY_REVIEWER')) && ['ACTIVE', 'SUBMITTED', 'MANAGER_APPROVED', 'DRAFT'].includes(exception.status)

  const compliance = exception.exceptionType?.complianceJunctions || []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/exceptions')}
            className="mt-1 p-2 rounded-xl bg-white/5 text-dark-text/40 hover:bg-white/10 hover:text-white transition-all shadow-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StatusBadge status={exception.status} />
              <RiskBadge level={exception.riskLevel} />
              {exception.isCritical && <Badge color="red">Critical Payload</Badge>}
              <span className="text-[10px] font-bold text-dark-text/20 uppercase tracking-[0.2em] ml-2">Node ID: {exception.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight leading-tight">{exception.title}</h1>
            <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-dark-text/30 uppercase tracking-widest">
              <User size={12} /> {exception.requester?.name}
              <span className="opacity-20">/</span>
              <Building size={12} /> {exception.department?.name}
              <span className="opacity-20">/</span>
              <Calendar size={12} /> Initialized {formatDate(exception.createdAt)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-2xl">
          {canEdit && (
            <Button variant="secondary" size="md" onClick={() => navigate(`/exceptions/${id}/edit`)}>
              <Edit size={16} /> Edit Node
            </Button>
          )}
          {canSubmit && (
            <Button variant="primary" size="md" loading={actionLoading} onClick={handleSubmit}>
              <Send size={16} /> Submit Repository
            </Button>
          )}
          {canRenew && (
            <Button variant="secondary" size="md" loading={actionLoading} onClick={handleRenew}>
              <RefreshCw size={16} /> Renew Lease
            </Button>
          )}
          {canRevoke && (
            <Button variant="danger" size="md" onClick={() => setModal('revoke')}>
              <XCircle size={16} /> Terminate
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="md" onClick={() => setModal('delete')} className="text-red-400 hover:bg-red-400/10 hover:text-red-300">
              <Trash2 size={16} /> Wipe
            </Button>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main analytical container */}
        <div className="lg:col-span-8 space-y-8">
          <Card>
            <CardHeader title="Analytical Overview" subtitle="Operational parameters and system definitions" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <div className="space-y-1">
                <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest">Core Framework</p>
                <p className="text-sm text-white font-semibold">{exception.exceptionType?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest">Policy Reference</p>
                <p className="text-sm text-white font-semibold truncate">
                  {exception.policy ? (
                    <span className="flex items-center gap-2">
                      <span className="text-primary-light">{exception.policy.policyCode}</span>
                      <span className="opacity-20">|</span>
                      {exception.policy.title}
                    </span>
                  ) : <span className="opacity-20 font-normal">No policy signature</span>}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest">Affected Node</p>
                <p className="text-sm text-white font-semibold">{exception.systemAffected || 'Universal Node'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest">Lifecycle Iteration</p>
                <p className="text-sm text-white font-semibold">{exception.renewalCount} Cycles</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest">Activation Timestamp</p>
                <p className="text-sm text-white font-semibold">{formatDate(exception.startDate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest">Temporal Termination</p>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-white font-semibold">{formatDate(exception.expiryDate)}</p>
                  <div className="scale-90 opacity-60"><ExpiryCountdown expiryDate={exception.expiryDate} /></div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest mb-2 px-1">Governance Justification</p>
                <p className="text-sm text-dark-text/80 leading-relaxed font-medium">{exception.businessJustification}</p>
              </div>
              {exception.description && (
                <div className="px-1">
                  <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest mb-2 font-display">Technical Description</p>
                  <p className="text-sm text-dark-text/60 leading-relaxed">{exception.description}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Decision Timeline */}
          {exception.approvals?.length > 0 && (
            <Card>
              <CardHeader title="Policy Decisions" subtitle="Official overrides and regulatory consensus" />
              <div className="space-y-3">
                {exception.approvals.map((a) => (
                  <div key={a.id} className="group relative overflow-hidden p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/5 ${a.decision === 'APPROVED' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {a.decision === 'APPROVED' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-widest">
                            {a.approvalRole === 'MANAGER' ? 'Unit Manager Approval' : 'CSO Review'}
                          </p>
                          <p className="text-[10px] text-dark-text/30 font-medium mt-0.5">{a.approver?.name || 'System Node'}</p>
                        </div>
                      </div>
                      <Badge color={a.decision === 'APPROVED' ? 'green' : a.decision === 'REJECTED' ? 'red' : 'yellow'}>
                        {a.decision}
                      </Badge>
                    </div>
                    {a.comments && (
                      <div className="pl-11">
                        <p className="text-sm text-dark-text/60 italic font-medium leading-relaxed border-l-2 border-white/5 pl-4 ml-1">
                          "{a.comments}"
                        </p>
                      </div>
                    )}
                    {a.overrideRiskScore != null && (
                      <div className="mt-4 pl-11 flex items-center gap-2 text-[10px] font-bold text-orange-400/70 tracking-widest uppercase">
                        <AlertTriangle size={12} /> Manual Risk Override: Index {a.overrideRiskScore}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Compliance Network */}
          {compliance.length > 0 && (
            <Card>
              <CardHeader title="Control Alignment" subtitle="Mapped regulatory framework junctions" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {compliance.map((j) => (
                  <div key={j.id} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-primary/20 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary-light transition-transform group-hover:scale-110">
                      <Shield size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate uppercase tracking-widest">{j.framework?.name}</p>
                      <p className="text-[10px] text-dark-text/30 font-medium truncate mt-0.5">{j.framework?.controlCode} — {j.framework?.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Intelligence Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Risk Intelligence */}
          {exception.riskAssessment && (
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] -z-10" />
              <CardHeader title="Risk Profile" />
              <div className="mb-10 flex flex-col items-center">
                <div className="relative">
                  <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center transition-all duration-1000 ${exception.riskLevel === 'CRITICAL' ? 'border-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)]' :
                    exception.riskLevel === 'HIGH' ? 'border-orange-500/20 text-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.15)]' :
                      'border-emerald-500/20 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                    }`}>
                    <div className="text-center">
                      <span className="text-4xl font-display font-bold leading-none">{exception.riskScore}</span>
                      <p className="text-[10px] font-bold uppercase tracking-tighter opacity-40 mt-1">Index</p>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-[0.2em] mt-4">Security Level: <span className="text-white">{exception.riskLevel}</span></p>
              </div>

              <div className="space-y-5">
                <RiskBar label="Architecture Vector" value={exception.riskAssessment.typeRisk} max={70} />
                <RiskBar label="Temporal Duration" value={exception.riskAssessment.durationRisk} max={50} />
                <RiskBar label="Repetition Factor" value={exception.riskAssessment.renewalRisk} max={15} />
                {exception.riskAssessment.approvalBonus > 0 && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Compliance Bonus</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">-{exception.riskAssessment.approvalBonus}</span>
                  </div>
                )}
              </div>

              {exception.riskAssessment.assessmentNotes && (
                <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest mt-8 border-t border-white/5 pt-4 text-center">
                  System generated analytical notes observed
                </p>
              )}
            </Card>
          )}

          {/* Anomaly Detection */}
          {exception.anomalyFlags?.filter(f => !f.isResolved).length > 0 && (
            <Card className="border-red-500/20 shadow-lg shadow-red-500/5">
              <CardHeader title="Security Anomalies" />
              <div className="space-y-3">
                {exception.anomalyFlags.filter(f => !f.isResolved).map((f) => (
                  <div key={f.id} className={`p-4 rounded-xl border relative group overflow-hidden ${f.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-100' : 'bg-amber-500/10 border-amber-500/20 text-amber-100'
                    }`}>
                    <div className="absolute top-0 right-0 w-8 h-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <AlertOctagon size={32} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{f.anomalyType.replace(/_/g, ' ')}</p>
                    <p className="mt-2 text-xs font-medium leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">{f.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Audit Repository */}
          {timeline.length > 0 && (
            <Card>
              <CardHeader title="Node Timeline" subtitle="System modification log" />
              <div className="space-y-1">
                {timeline.slice(0, 5).map((e, i) => (
                  <TimelineEvent key={i} {...e} />
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100">
                Full Audit Log
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Revoke overlay */}
      <Modal open={modal === 'revoke'} onClose={() => setModal(null)} title="Terminate Node Lease" size="sm">
        <div className="space-y-6">
          <p className="text-sm text-dark-text/60 font-medium">Warning: This action will immediately revoke the exception status and trigger departmental notification. This cannot be reversed.</p>
          <FormField label="Revocation Rationale">
            <Textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Provide justification for architectural termination…"
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModal(null)}>Abort</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleRevoke}>Confirm Termination</Button>
          </div>
        </div>
      </Modal>

      {/* Delete overlay */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Wipe Asset Record" size="sm">
        <div className="space-y-6">
          <p className="text-sm text-dark-text/60 font-medium">Are you sure you want to permanently erase this exception draft from the repository?</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleDelete}>Wipe Asset</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}