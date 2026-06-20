import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Filter } from 'lucide-react'
import { exceptionsApi } from '../api/exceptions.js'
import { lookupsApi } from '../api/lookups.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Table } from '../components/ui/Table.jsx'
import { RiskBadge, StatusBadge } from '../components/ui/Badge.jsx'
import { SearchBar, Select, Pagination } from '../components/ui/Form.jsx'
import { formatDate } from '../utils/format.js'
import { ExpiryCountdown } from '../components/exceptions/ExpiryCountdown.jsx'


const STATUSES = ['DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'INFO_REQUESTED', 'ACTIVE', 'EXPIRED', 'REVOKED', 'REJECTED']
const STATUS_LABELS = { DRAFT: 'Draft', SUBMITTED: 'Pending Review', MANAGER_APPROVED: 'Manager Approved', INFO_REQUESTED: 'Info Requested', ACTIVE: 'Active', EXPIRED: 'Expired', REVOKED: 'Revoked', REJECTED: 'Rejected' }

export default function ExceptionsPage() {
  const { hasRole } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [exceptions, setExceptions] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  const page = parseInt(searchParams.get('page') || '1')
  const status = searchParams.get('status') || ''
  const departmentId = searchParams.get('departmentId') || ''
  const [search, setSearch] = useState('')

  const canCreate = hasRole('REQUESTER', 'ADMIN')

  useEffect(() => {
    lookupsApi.departments().then(setDepartments).catch(() => { })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 15 }
      if (status) params.status = status
      if (departmentId) params.departmentId = departmentId
      const res = await exceptionsApi.list(params)
      setExceptions(res.data || [])
      setTotal(res.total || 0)
    } catch {
      setExceptions([])
    } finally {
      setLoading(false)
    }
  }, [page, status, departmentId])

  useEffect(() => { load() }, [load])

  function setParam(key, val) {
    const p = new URLSearchParams(searchParams)
    if (val) p.set(key, val)
    else p.delete(key)
    p.delete('page')
    setSearchParams(p)
  }

  const filtered = search
    ? exceptions.filter(e =>
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.requester?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.name?.toLowerCase().includes(search.toLowerCase())
    )
    : exceptions

  const columns = [
    {
      key: 'title',
      label: 'Exception',
      render: (v, row) => (
        <div className="max-w-64">
          <p className="font-medium text-slate-900 text-xs truncate">{v}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{row.requester?.name} · {row.department?.name}</p>
        </div>
      )
    },
    { key: 'exceptionType', label: 'Type', render: (v) => <span className="text-xs text-slate-600">{v?.name || '—'}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'riskLevel', label: 'Risk', render: (v) => <RiskBadge level={v} /> },
    {
      key: 'riskScore', label: 'Score', render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-12 bg-slate-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${v >= 76 ? 'bg-red-500' : v >= 51 ? 'bg-orange-500' : v >= 26 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${v}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">{v}</span>
        </div>
      )
    },
    {
      key: 'expiryDate', label: 'Expires', render: (v) => (
        <div className="space-y-0.5">
          <span className="text-xs text-slate-500">{formatDate(v)}</span>
          <div><ExpiryCountdown expiryDate={v} /></div>
        </div>
      )
    },
    { key: 'createdAt', label: 'Created', render: (v) => <span className="text-xs text-slate-400">{formatDate(v)}</span> },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{total} exception{total !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={12} /> Filters {(status || departmentId) ? '•' : ''}
          </Button>
          {canCreate && (
            <Button variant="primary" size="sm" onClick={() => navigate('/exceptions/new')}>
              <Plus size={12} /> New Exception
            </Button>
          )}
        </div>
      </div>

      {/* Search + filters */}
      <Card>
        <div className="space-y-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by title, requester, or department…" />
          {showFilters && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <Select value={status} onChange={(e) => setParam('status', e.target.value)} className="flex-1 max-w-48">
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </Select>
              <Select value={departmentId} onChange={(e) => setParam('departmentId', e.target.value)} className="flex-1 max-w-48">
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
              {(status || departmentId) && (
                <Button variant="ghost" size="sm" onClick={() => { setParam('status', ''); setParam('departmentId', '') }}>
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <Table
          columns={columns}
          data={filtered}
          loading={loading}
          empty="No exceptions found"
          onRowClick={(row) => navigate(`/exceptions/${row.id}`)}
        />
        <Pagination
          page={page}
          total={total}
          pageSize={15}
          onChange={(p) => {
            const params = new URLSearchParams(searchParams)
            params.set('page', p)
            setSearchParams(params)
          }}
        />
      </Card>
    </div>
  )
}