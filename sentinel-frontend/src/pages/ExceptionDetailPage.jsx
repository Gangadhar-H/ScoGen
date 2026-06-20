import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit, Trash2, Send, RefreshCw, XCircle,
  Shield, Clock, CheckCircle, AlertTriangle, User, Building, Calendar
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
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
          <Icon size={12} className="text-slate-500" />
        </div>
      </div>
      <div className="flex-1 pb-4 border-l border-slate-200 pl-3 -ml-3.5 pt-0.5">
        <p className="text-xs font-semibold text-slate-800">{action.replace(/_/g, ' ')}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {user?.name || 'System'} · {formatDateTime(timestamp)}
        </p>
        {newValue?.status && (
          <p className="text-[10px] text-slate-500 mt-1">
            → <StatusBadge status={newValue.status} />
          </p>
        )}
      </div>
    </div>
  )
}

function RiskBar({ label, value, max = 100 }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-mono font-medium text-slate-800">{value}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full">
        <div className="h-1.5 bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/exceptions')} className="mt-0.5 p-1.5 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={exception.status} />
              <RiskBadge level={exception.riskLevel} />
              {exception.isCritical && <Badge color="red">Critical</Badge>}
            </div>
            <h2 className="text-base font-bold text-slate-900 max-w-2xl">{exception.title}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Requested by {exception.requester?.name} · {exception.department?.name} · Created {formatDate(exception.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {canEdit && (
            <Button variant="secondary" size="sm" onClick={() => navigate(`/exceptions/${id}/edit`)}>
              <Edit size={12} /> Edit
            </Button>
          )}
          {canSubmit && (
            <Button variant="primary" size="sm" loading={actionLoading} onClick={handleSubmit}>
              <Send size={12} /> Submit for Review
            </Button>
          )}
          {canRenew && (
            <Button variant="secondary" size="sm" loading={actionLoading} onClick={handleRenew}>
              <RefreshCw size={12} /> Renew
            </Button>
          )}
          {canRevoke && (
            <Button variant="danger" size="sm" onClick={() => setModal('revoke')}>
              <XCircle size={12} /> Revoke
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => setModal('delete')}>
              <Trash2 size={12} /> Delete
            </Button>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader title="Exception Details" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Type</p>
                <p className="text-slate-800">{exception.exceptionType?.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Policy</p>
                <p className="text-slate-800">{exception.policy ? `${exception.policy.policyCode} — ${exception.policy.title}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">System Affected</p>
                <p className="text-slate-800">{exception.systemAffected}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Renewal Count</p>
                <p className="text-slate-800">{exception.renewalCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Start Date</p>
                <p className="text-slate-800">{formatDate(exception.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Expiry Date</p>
                <p className="text-slate-800 flex items-center gap-2">
                  {formatDate(exception.expiryDate)}
                  <ExpiryCountdown expiryDate={exception.expiryDate} />
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Business Justification</p>
                <p className="text-sm text-slate-700 leading-relaxed">{exception.businessJustification}</p>
              </div>
              {exception.description && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{exception.description}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Approval history */}
          {exception.approvals?.length > 0 && (
            <Card>
              <CardHeader title="Approval History" />
              <div className="space-y-3">
                {exception.approvals.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${a.decision === 'APPROVED' ? 'bg-green-500' :
                      a.decision === 'REJECTED' ? 'bg-red-500' :
                        a.decision === 'MORE_INFO' ? 'bg-amber-500' : 'bg-slate-300'
                      }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-700">
                          {a.approvalRole === 'MANAGER' ? 'Manager Review' : 'Security Review'}
                        </p>
                        <Badge color={a.decision === 'APPROVED' ? 'green' : a.decision === 'REJECTED' ? 'red' : a.decision === 'MORE_INFO' ? 'yellow' : 'slate'}>
                          {a.decision}
                        </Badge>
                      </div>
                      {a.approver && <p className="text-[10px] text-slate-400 mt-0.5">{a.approver.name}</p>}
                      {a.comments && <p className="text-xs text-slate-600 mt-1 italic">"{a.comments}"</p>}
                      {a.overrideRiskScore != null && (
                        <p className="text-xs text-orange-600 mt-1">Risk overridden to {a.overrideRiskScore}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Compliance mapping */}
          {compliance.length > 0 && (
            <Card>
              <CardHeader title="Compliance Framework Mapping" />
              <div className="space-y-2">
                {compliance.map((j) => (
                  <div key={j.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg">
                    <Shield size={14} className="text-brand-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{j.framework?.name}</p>
                      <p className="text-[10px] text-slate-400">{j.framework?.controlCode} — {j.framework?.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Risk assessment */}
          {exception.riskAssessment && (
            <Card>
              <CardHeader title="Risk Breakdown" />
              <div className="mb-4 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${exception.riskLevel === 'CRITICAL' ? 'bg-red-100' :
                  exception.riskLevel === 'HIGH' ? 'bg-orange-100' :
                    exception.riskLevel === 'MEDIUM' ? 'bg-amber-100' : 'bg-green-100'
                  }`}>
                  <span className={`text-xl font-bold ${exception.riskLevel === 'CRITICAL' ? 'text-red-700' :
                    exception.riskLevel === 'HIGH' ? 'text-orange-700' :
                      exception.riskLevel === 'MEDIUM' ? 'text-amber-700' : 'text-green-700'
                    }`}>{exception.riskScore}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Risk Score</p>
              </div>
              <div className="space-y-3">
                <RiskBar label="Type Risk" value={exception.riskAssessment.typeRisk} max={70} />
                <RiskBar label="Duration Risk" value={exception.riskAssessment.durationRisk} max={50} />
                <RiskBar label="Renewal Risk" value={exception.riskAssessment.renewalRisk} max={15} />
                {exception.riskAssessment.approvalBonus > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">Approval Bonus</span>
                      <span className="font-mono font-medium text-green-700">-{exception.riskAssessment.approvalBonus}</span>
                    </div>
                  </div>
                )}
              </div>
              {exception.riskAssessment.assessmentNotes && (
                <p className="text-[10px] text-slate-400 mt-3 border-t border-slate-100 pt-2">{exception.riskAssessment.assessmentNotes}</p>
              )}
            </Card>
          )}

          {/* Anomaly flags */}
          {exception.anomalyFlags?.filter(f => !f.isResolved).length > 0 && (
            <Card>
              <CardHeader title="Anomaly Flags" />
              <div className="space-y-2">
                {exception.anomalyFlags.filter(f => !f.isResolved).map((f) => (
                  <div key={f.id} className={`p-3 rounded-lg border text-xs ${f.severity === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                    <p className="font-semibold">{f.anomalyType.replace(/_/g, ' ')}</p>
                    <p className="mt-0.5 opacity-80">{f.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Audit timeline */}
          {timeline.length > 0 && (
            <Card>
              <CardHeader title="Audit Timeline" />
              <div className="space-y-0">
                {timeline.slice(0, 8).map((e, i) => (
                  <TimelineEvent key={i} {...e} />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Revoke modal */}
      <Modal open={modal === 'revoke'} onClose={() => setModal(null)} title="Revoke Exception" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">This will revoke the exception and notify the requester. This action cannot be undone.</p>
          <FormField label="Reason for Revocation">
            <Textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Explain why this exception is being revoked…"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={actionLoading} onClick={handleRevoke}>Revoke Exception</Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Delete Exception" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Are you sure you want to permanently delete this draft exception?</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={actionLoading} onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}