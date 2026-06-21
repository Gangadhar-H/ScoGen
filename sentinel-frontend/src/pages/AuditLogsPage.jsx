import React, { useState, useCallback } from 'react'
import { auditApi } from '../api/audit.js'
import { Card } from '../components/ui/Card.jsx'
import { Table } from '../components/ui/Table.jsx'
import { FormField, Input, Select, Pagination, PageSpinner } from '../components/ui/Form.jsx'
import { formatDateTime } from '../utils/format.js'
import { useFetch } from '../hooks/useFetch.js'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { Download } from 'lucide-react'

const ACTIONS = ['LOGIN', 'REGISTER', 'CREATE_EXCEPTION', 'UPDATE_EXCEPTION', 'DELETE_EXCEPTION',
  'SUBMIT_FOR_REVIEW', 'APPROVE', 'REJECT', 'REQUEST_INFO', 'REVOKE', 'EMERGENCY_REVOKE',
  'RENEW', 'OVERRIDE_RISK_SCORE', 'CREATE_USER', 'UPDATE_USER', 'ADVISOR_SUGGESTION_SHOWN']

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ action: '', startDate: '', endDate: '' })
  const [showFilters, setShowFilters] = useState(false)

  const { data, loading } = useFetch(
    () => auditApi.list({ page, limit: 20, action: filters.action || undefined, startDate: filters.startDate || undefined, endDate: filters.endDate || undefined }),
    [page, filters]
  )

  const logs = data?.data || []
  const total = data?.total || 0

  function setFilter(k, v) {
    setFilters(prev => ({ ...prev, [k]: v }))
    setPage(1)
  }

  async function handleExportPdf() {
    const token = localStorage.getItem('sentinel_token')
    const res = await fetch(auditApi.exportPdfUrl({ action: filters.action, startDate: filters.startDate, endDate: filters.endDate }), {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-trail.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      key: 'createdAt',
      label: 'Timestamp',
      width: '180px',
      render: (v) => <span className="text-[10px] font-mono font-bold text-dark-text/30 uppercase tracking-wider">{formatDateTime(v)}</span>
    },
    {
      key: 'user',
      label: 'Operator Identity',
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-dark-text/30 font-bold text-[10px] border border-white/5">
            {v?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <p className="text-xs font-bold text-white tracking-tight">{v?.name || 'Governance Engine'}</p>
            <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest">{v?.email || 'SYSTEM_PROC'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Event Type',
      render: (v) => {
        const isDestructive = v?.includes('DELETE') || v?.includes('REVOKE') || v?.includes('REJECT')
        const isSuccess = v?.includes('APPROVE') || v?.includes('ACTIVE') || v?.includes('LOGIN')
        const isCreation = v?.includes('CREATE') || v?.includes('SUBMIT')

        return (
          <span className={`font-mono text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-widest ${isDestructive ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              isSuccess ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                isCreation ? 'bg-primary/10 text-primary-light border-primary/20' :
                  'bg-white/5 text-dark-text/40 border-white/10'
            }`}>
            {v?.replace(/_/g, ' ')}
          </span>
        )
      }
    },
    { key: 'resourceType', label: 'Asset Class', render: (v) => <span className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest">{v}</span> },
    {
      key: 'newValue',
      label: 'Status Transition',
      render: (v, row) => {
        const status = v?.status || row.oldValue?.status
        if (!status) return <span className="text-dark-text/10">—</span>
        return (
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-tighter">
            {row.oldValue?.status && <span className="line-through text-dark-text/20">{row.oldValue.status}</span>}
            {row.oldValue?.status && v?.status && <span className="text-dark-text/20">→</span>}
            {v?.status && <span className="text-emerald-400 text-glow-sm">{v.status}</span>}
          </div>
        )
      }
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">System Audit Trail</h1>
          <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest mt-1">
            Persistent ledger of all governance activities Node logs: <span className="text-white">{total}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'bg-white/20' : ''}>
            <SlidersHorizontal size={16} />
            <span className="ml-1 uppercase text-[10px] tracking-widest font-bold">Query Params</span>
          </Button>
          <Button variant="secondary" size="md" onClick={handleExportPdf}>
            <Download size={16} />
            <span className="ml-1 uppercase text-[10px] tracking-widest font-bold">Export Ledger</span>
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="border-primary/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="Event Action">
              <Select value={filters.action} onChange={e => setFilter('action', e.target.value)}>
                <option value="">Full Trace</option>
                {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
              </Select>
            </FormField>
            <FormField label="Temporal Start">
              <Input type="date" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)} />
            </FormField>
            <FormField label="Temporal End">
              <Input type="date" value={filters.endDate} onChange={e => setFilter('endDate', e.target.value)} />
            </FormField>
            <div className="flex items-end">
              <Button variant="ghost" size="md" onClick={() => setFilters({ action: '', startDate: '', endDate: '' })} className="w-full">
                Wipe Filter Params
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <Table columns={columns} data={logs} loading={loading} empty="No architectural logs detected in this sector" />
        <Pagination page={page} total={total} pageSize={20} onChange={setPage} />
      </Card>
    </div>
  )
}