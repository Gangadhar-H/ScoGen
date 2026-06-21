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

  // Add this handler inside the component, near setFilter:
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
      width: '160px',
      render: (v) => <span className="text-xs font-mono text-slate-500">{formatDateTime(v)}</span>
    },
    {
      key: 'user',
      label: 'User',
      render: (v) => (
        <div>
          <p className="text-xs font-medium text-slate-800">{v?.name || 'System'}</p>
          <p className="text-[10px] text-slate-400">{v?.email}</p>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: (v) => (
        <span className={`font-mono text-xs px-2 py-0.5 rounded ${v?.includes('DELETE') || v?.includes('REVOKE') || v?.includes('REJECT') ? 'bg-red-50 text-red-700' :
            v?.includes('APPROVE') || v?.includes('ACTIVE') ? 'bg-green-50 text-green-700' :
              v?.includes('CREATE') || v?.includes('SUBMIT') ? 'bg-blue-50 text-blue-700' :
                'bg-slate-50 text-slate-600'
          }`}>
          {v}
        </span>
      )
    },
    { key: 'resourceType', label: 'Resource', render: (v) => <span className="text-xs text-slate-500 capitalize">{v}</span> },
    {
      key: 'newValue',
      label: 'Details',
      render: (v, row) => {
        const status = v?.status || row.oldValue?.status
        if (!status) return <span className="text-xs text-slate-300">—</span>
        return (
          <div className="text-[10px] text-slate-500 font-mono">
            {row.oldValue?.status && <span className="line-through text-red-400">{row.oldValue.status}</span>}
            {row.oldValue?.status && v?.status && <span className="mx-1">→</span>}
            {v?.status && <span className="text-green-700">{v.status}</span>}
          </div>
        )
      }
    },
  ]

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{total} log entries</p>
        <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={12} /> Filters {(filters.action || filters.startDate) ? '•' : ''}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExportPdf}>
          <Download size={12} /> Export PDF
        </Button>
      </div>

      {showFilters && (
        <Card>
          <div className="flex items-end gap-3">
            <FormField label="Action">
              <Select value={filters.action} onChange={e => setFilter('action', e.target.value)} className="w-56">
                <option value="">All Actions</option>
                {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
            </FormField>
            <FormField label="From Date">
              <Input type="date" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)} className="w-40" />
            </FormField>
            <FormField label="To Date">
              <Input type="date" value={filters.endDate} onChange={e => setFilter('endDate', e.target.value)} className="w-40" />
            </FormField>
            <Button variant="ghost" size="sm" onClick={() => setFilters({ action: '', startDate: '', endDate: '' })}>
              Clear
            </Button>
          </div>
        </Card>
      )}

      <Card padding={false}>
        <Table columns={columns} data={logs} loading={loading} empty="No audit logs found" />
        <Pagination page={page} total={total} pageSize={20} onChange={setPage} />
      </Card>
    </div>
  )
}