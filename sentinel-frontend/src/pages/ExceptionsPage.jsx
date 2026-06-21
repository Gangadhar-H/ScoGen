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
import { SearchBar, Select, Pagination, FormField } from '../components/ui/Form.jsx'
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
      label: 'Exception Asset',
      render: (v, row) => (
        <div className="max-w-xs group cursor-pointer">
          <p className="font-semibold text-white text-sm truncate group-hover:text-primary transition-colors">{v}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-dark-text/30 font-bold uppercase tracking-wider">{row.department?.name}</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="text-[10px] text-dark-text/30 font-bold uppercase tracking-wider">{row.requester?.name}</span>
          </div>
        </div>
      )
    },
    { key: 'exceptionType', label: 'Framework', render: (v) => <span className="text-xs text-dark-text/50 font-medium">{v?.name || '—'}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'riskLevel', label: 'Risk Vector', render: (v) => <RiskBadge level={v} /> },
    {
      key: 'riskScore', label: 'Index', render: (v) => (
        <div className="flex items-center gap-3">
          <div className="w-16 bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${v >= 76 ? 'bg-red-500' : v >= 51 ? 'bg-orange-500' : v >= 26 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${v}%` }}
            />
          </div>
          <span className="text-[10px] text-dark-text/40 font-bold font-mono">{v}</span>
        </div>
      )
    },
    {
      key: 'expiryDate', label: 'Temporal Status', render: (v) => (
        <div className="space-y-1">
          <span className="text-[10px] text-dark-text/50 font-bold tracking-tight">{formatDate(v)}</span>
          <div className="scale-90 origin-left opacity-80"><ExpiryCountdown expiryDate={v} /></div>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Overlay */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Exceptions Repository</h1>
          <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest mt-1">
            {total} active security nodes detected in current cycle
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'bg-white/20' : ''}>
            <Filter size={16} className={showFilters ? 'text-primary' : 'text-dark-text/40'} />
            <span className="ml-1">Parameters</span>
            {(status || departmentId) && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-1" />}
          </Button>
          {canCreate && (
            <Button variant="primary" size="md" onClick={() => navigate('/exceptions/new')}>
              <Plus size={20} />
              <span>Initiate New</span>
            </Button>
          )}
        </div>
      </div>

      {/* Global Filter Array */}
      <div className={`transition-all duration-300 ${showFilters ? 'opacity-100' : 'opacity-0 h-0 pointer-events-none'}`}>
        <Card className="border-primary/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Lifecycle Status">
              <Select value={status} onChange={(e) => setParam('status', e.target.value)}>
                <option value="">All Operational States</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </Select>
            </FormField>
            <FormField label="Departmental Node">
              <Select value={departmentId} onChange={(e) => setParam('departmentId', e.target.value)}>
                <option value="">All Functional Units</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </FormField>
            <div className="flex items-end gap-2">
              {(status || departmentId) && (
                <Button variant="ghost" size="md" onClick={() => { setParam('status', ''); setParam('departmentId', '') }} className="w-full">
                  Reset Filters
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Repository Shell */}
      <div className="space-y-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title, requester, or department node…" />

        <Card className="p-0">
          <Table
            columns={columns}
            data={filtered}
            loading={loading}
            empty="No exception signatures found in this sector"
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
    </div>
  )
}