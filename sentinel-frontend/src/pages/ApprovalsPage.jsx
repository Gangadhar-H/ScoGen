import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, HelpCircle, Eye, AlertTriangle, Building, User } from 'lucide-react'
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
    <div className="glass-card p-6 hover:bg-white/[0.04] transition-all group border-white/5 hover:border-primary/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge color={approval.approvalRole === 'MANAGER' ? 'secondary' : 'accent'}>
              {approval.approvalRole === 'MANAGER' ? 'Manager Review' : 'CSO Review'}
            </Badge>
            {exc && <StatusBadge status={exc.status} />}
          </div>
          <h3 className="text-lg font-display font-bold text-white tracking-tight group-hover:text-primary transition-colors">{exc?.title || '—'}</h3>
          <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-dark-text/30 uppercase tracking-widest">
            <Building size={12} /> {exc?.department?.name}
            <span className="opacity-20">/</span>
            <User size={12} /> {exc?.requester?.name}
          </div>

          <div className="flex flex-wrap items-center gap-6 mt-6">
            {exc && <RiskBadge level={exc.riskLevel} />}
            {exc && (
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-dark-text/30 uppercase tracking-tighter">Analytical Index</span>
                <span className="text-sm font-mono font-bold text-white leading-none mt-1">{exc.riskScore}</span>
              </div>
            )}
            {exc?.expiryDate && (
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-dark-text/30 uppercase tracking-tighter">Operational Expiry</span>
                <span className="text-sm font-bold text-white leading-none mt-1">{formatDate(exc.expiryDate)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:bg-white/[0.02] md:p-2 md:rounded-2xl border-white/5 self-start md:self-center">
          <Button variant="secondary" size="md" onClick={() => navigate(`/exceptions/${exc?.id}`)}>
            <Eye size={18} /> Review
          </Button>
          <div className="w-px h-6 bg-white/5 hidden md:block" />
          <Button variant="primary" size="md" onClick={() => onAction('approve', approval)}>
            <CheckCircle size={18} /> Approve
          </Button>
          <Button variant="secondary" size="md" onClick={() => onAction('info', approval)}>
            <HelpCircle size={18} /> Request Data
          </Button>
          <Button variant="danger" size="md" onClick={() => onAction('reject', approval)}>
            <XCircle size={18} /> Reject
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

  const title = modal?.type === 'approve' ? 'Architecture Approval' : modal?.type === 'reject' ? 'Terminate Request' : 'Information Query'
  const btnVariant = modal?.type === 'approve' ? 'primary' : modal?.type === 'reject' ? 'danger' : 'secondary'
  const btnLabel = modal?.type === 'approve' ? 'Confirm Approval' : modal?.type === 'reject' ? 'Confirm Rejection' : 'Send Information Request'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Consensus Queue</h1>
          <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest mt-1">
            Nodes requiring regulatory decision in current sector
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border transition-all ${pending.length > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${pending.length > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{pending.length} Outstanding Decision{pending.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {pending.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <CheckCircle size={40} />
          </div>
          <p className="text-xl font-display font-semibold text-white tracking-tight">Queue Synchronized</p>
          <p className="text-sm text-dark-text/40 mt-2 max-w-sm font-medium italic">Consensus reached for all active exception signatures in your domain.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((a) => (
            <ApprovalCard key={a.id} approval={a} onAction={openModal} />
          ))}
        </div>
      )}

      {/* Decision Engine Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={title} size="sm">
        {modal && (
          <div className="space-y-6">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <RiskBadge level={modal.approval.exception?.riskLevel} />
                <span className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest">Index: {modal.approval.exception?.riskScore}</span>
              </div>
              <p className="text-sm font-bold text-white leading-tight">{modal.approval.exception?.title}</p>
              <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest mt-1">{modal.approval.exception?.department?.name}</p>
            </div>

            {actionError && <ErrorMessage message={actionError} />}

            <FormField label={modal.type === 'info' ? 'Query Parameters' : 'Analytical Comments'}>
              <Textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder={
                  modal.type === 'approve' ? 'Approval rationale (optional)...' :
                    modal.type === 'reject' ? 'Architectural disqualification reason (required)...' :
                      'Define required dataset parameters...'
                }
              />
            </FormField>

            {modal.type === 'approve' && canOverride && (
              <div className="border-t border-white/5 pt-6 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                  <AlertTriangle size={14} className="animate-pulse" /> Security Intelligence Override
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <FormField label="Manual Risk Normalization (0–100)">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={overrideScore}
                      onChange={e => setOverrideScore(e.target.value)}
                      placeholder="Input normalized analytical index"
                    />
                  </FormField>
                  {overrideScore && (
                    <FormField label="Override Justification">
                      <Textarea
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                        placeholder="Regulatory justification for index normalization..."
                        rows={2}
                      />
                    </FormField>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setModal(null)}>Abort</Button>
              <Button variant={btnVariant} loading={actionLoading} onClick={handleAction}>
                {btnLabel}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}