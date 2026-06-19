import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, HelpCircle, Eye, AlertTriangle } from 'lucide-react'
import { approvalsApi } from '../api/approvals.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useFetch } from '../hooks/useFetch.js'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { RiskBadge, StatusBadge, Badge } from '../components/ui/Badge.jsx'
import { FormField, Textarea, Input, PageSpinner, ErrorMessage } from '../components/ui/Form.jsx'
import { formatDate } from '../utils/format.js'

function ApprovalCard({ approval, onAction }) {
  const exc = approval.exception
  const navigate = useNavigate()

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge color={approval.approvalRole === 'MANAGER' ? 'blue' : 'purple'}>
              {approval.approvalRole === 'MANAGER' ? 'Manager Review' : 'Security Review'}
            </Badge>
            {exc && <StatusBadge status={exc.status} />}
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mt-1.5">{exc?.title || '—'}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{exc?.department?.name} · Requester: {exc?.requester?.name}</p>

          <div className="flex items-center gap-4 mt-3">
            {exc && <RiskBadge level={exc.riskLevel} />}
            {exc && <span className="text-xs text-slate-500">Score: <span className="font-mono font-semibold">{exc.riskScore}</span></span>}
            {exc?.expiryDate && <span className="text-xs text-slate-400">Expires: {formatDate(exc.expiryDate)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/exceptions/${exc?.id}`)}>
            <Eye size={12} /> View
          </Button>
          <Button variant="success" size="sm" onClick={() => onAction('approve', approval)}>
            <CheckCircle size={12} /> Approve
          </Button>
          <Button variant="warning" size="sm" onClick={() => onAction('info', approval)}>
            <HelpCircle size={12} /> Info
          </Button>
          <Button variant="danger" size="sm" onClick={() => onAction('reject', approval)}>
            <XCircle size={12} /> Reject
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ApprovalsPage() {
  const { hasRole } = useAuth()
  const navigate = useNavigate()
  const [modal, setModal] = useState(null) // { type, approval }
  const [comments, setComments] = useState('')
  const [overrideScore, setOverrideScore] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const { data, loading, error, refetch } = useFetch(
    () => approvalsApi.list({ decision: 'PENDING', limit: 50 }),
    []
  )

  const approvals = data?.data || []
  const pending = approvals.filter(a => a.decision === 'PENDING')

  const canOverride = hasRole('SECURITY_REVIEWER', 'ADMIN')

  function openModal(type, approval) {
    setModal({ type, approval })
    setComments('')
    setOverrideScore('')
    setOverrideReason('')
    setActionError('')
  }

  async function handleAction() {
    const { type, approval } = modal
    setActionLoading(true)
    setActionError('')
    try {
      if (type === 'approve') {
        const body = { comments }
        if (canOverride && overrideScore) {
          body.overrideRiskScore = parseInt(overrideScore)
          body.overrideReason = overrideReason
        }
        await approvalsApi.approve(approval.exceptionId, body)
      } else if (type === 'reject') {
        await approvalsApi.reject(approval.exceptionId, comments)
      } else if (type === 'info') {
        await approvalsApi.requestInfo(approval.exceptionId, comments)
      }
      setModal(null)
      refetch()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <PageSpinner />
  if (error) return <ErrorMessage message={error} />

  const title = modal?.type === 'approve' ? 'Approve Exception' : modal?.type === 'reject' ? 'Reject Exception' : 'Request More Information'
  const btnVariant = modal?.type === 'approve' ? 'success' : modal?.type === 'reject' ? 'danger' : 'warning'
  const btnLabel = modal?.type === 'approve' ? 'Approve' : modal?.type === 'reject' ? 'Reject' : 'Request Info'

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <div className="bg-amber-100 rounded-lg px-4 py-2">
          <p className="text-xs font-semibold text-amber-800">{pending.length} pending</p>
        </div>
        {pending.length === 0 && (
          <p className="text-sm text-slate-500">Queue is clear — no pending approvals.</p>
        )}
      </div>

      {pending.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No pending approvals in your queue.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((a) => (
            <ApprovalCard key={a.id} approval={a} onAction={openModal} />
          ))}
        </div>
      )}

      {/* Action Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={title} size="sm">
        {modal && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-semibold text-slate-700">{modal.approval.exception?.title}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{modal.approval.exception?.department?.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <RiskBadge level={modal.approval.exception?.riskLevel} />
                <span className="text-xs text-slate-500">Score: {modal.approval.exception?.riskScore}</span>
              </div>
            </div>

            {actionError && <ErrorMessage message={actionError} />}

            <FormField label={modal.type === 'info' ? 'Information Requested' : 'Comments'}>
              <Textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder={
                  modal.type === 'approve' ? 'Approval notes (optional)…' :
                  modal.type === 'reject' ? 'Reason for rejection (required)…' :
                  'What additional information do you need?'
                }
                rows={3}
              />
            </FormField>

            {modal.type === 'approve' && canOverride && (
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <AlertTriangle size={12} className="text-amber-500" /> Risk Score Override (Security Reviewer)
                </p>
                <FormField label="Override Risk Score (0–100)">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={overrideScore}
                    onChange={e => setOverrideScore(e.target.value)}
                    placeholder="Leave blank to use calculated score"
                  />
                </FormField>
                {overrideScore && (
                  <FormField label="Override Reason">
                    <Textarea
                      value={overrideReason}
                      onChange={e => setOverrideReason(e.target.value)}
                      placeholder="Explain why the risk score is being overridden…"
                      rows={2}
                    />
                  </FormField>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant={btnVariant} size="sm" loading={actionLoading} onClick={handleAction}>
                {btnLabel}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}