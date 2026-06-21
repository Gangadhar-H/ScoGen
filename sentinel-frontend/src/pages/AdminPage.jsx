import React, { useState } from 'react'
import { Users, FileText, Shield, Plus, Edit, Building } from 'lucide-react'
import { adminApi } from '../api/admin.js'
import { lookupsApi } from '../api/lookups.js'
import { useFetch } from '../hooks/useFetch.js'
import { Card, CardHeader, StatCard } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { Table } from '../components/ui/Table.jsx'
import { FormField, Input, Select, PageSpinner, ErrorMessage } from '../components/ui/Form.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { ROLE_LABELS, formatDate } from '../utils/format.js'

const ROLES = ['REQUESTER', 'APPROVER', 'SECURITY_REVIEWER', 'AUDITOR', 'ADMIN']

function UserModal({ open, onClose, user, departments, onSave }) {
  const isEdit = !!user
  const [form, setForm] = useState(user || { email: '', name: '', password: '', role: 'REQUESTER', departmentId: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    setLoading(true)
    try {
      if (isEdit) {
        await adminApi.updateUser(user.id, { role: form.role, departmentId: form.departmentId || undefined, name: form.name })
      } else {
        await adminApi.createUser(form)
      }
      onSave()
      lookupsApi.invalidate('policies')
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit User' : 'Create User'} size="sm">
      <div className="space-y-4">
        {error && <ErrorMessage message={error} />}
        <FormField label="Full Name" required>
          <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" />
        </FormField>
        {!isEdit && (
          <>
            <FormField label="Email" required>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@company.com" />
            </FormField>
            <FormField label="Password" required>
              <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Minimum 8 characters" />
            </FormField>
          </>
        )}
        <FormField label="Role" required>
          <Select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </FormField>
        <FormField label="Department">
          <Select value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}>
            <option value="">None</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </FormField>
        {isEdit && (
          <FormField label="Status">
            <Select value={form.isActive ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </FormField>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={loading} onClick={handleSave}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function PolicyModal({ open, onClose, departments, onSave }) {
  const [form, setForm] = useState({ policyCode: '', title: '', description: '', severity: 'MEDIUM', ownerDepartmentId: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    setLoading(true)
    try {
      await adminApi.createPolicy(form)
      onSave()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Policy" size="sm">
      <div className="space-y-4">
        {error && <ErrorMessage message={error} />}
        <FormField label="Policy Code" required><Input value={form.policyCode} onChange={e => setForm(p => ({ ...p, policyCode: e.target.value }))} placeholder="SEC-010" /></FormField>
        <FormField label="Title" required><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Policy title" /></FormField>
        <FormField label="Description"><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></FormField>
        <FormField label="Severity">
          <Select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>
        </FormField>
        <FormField label="Owner Department" required>
          <Select value={form.ownerDepartmentId} onChange={e => setForm(p => ({ ...p, ownerDepartmentId: e.target.value }))}>
            <option value="">Select department…</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </FormField>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={loading} onClick={handleSave}>Create Policy</Button>
        </div>
      </div>
    </Modal>
  )
}

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'policies', label: 'Policies', icon: Shield },
]

export default function AdminPage() {
  const [tab, setTab] = useState('users')
  const [userModal, setUserModal] = useState(null) // null | 'create' | user obj
  const [policyModal, setPolicyModal] = useState(false)

  const { data: metrics, loading: metricsLoading } = useFetch(() => adminApi.metrics(), [])
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useFetch(() => adminApi.listUsers({ limit: 50 }), [])
  const { data: departments } = useFetch(() => lookupsApi.departments(), [])
  const { data: policiesData, refetch: refetchPolicies } = useFetch(() => lookupsApi.policies(), [])

  const users = usersData?.data || []
  const policies = policiesData || []
  const depts = departments || []

  const userColumns = [
    {
      key: 'name', label: 'Identity', render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary-light font-display font-bold border border-white/5">
            {v?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">{v}</p>
            <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-wider">{row.email}</p>
          </div>
        </div>
      )
    },
    { key: 'role', label: 'Access Level', render: (v) => <Badge color={v === 'ADMIN' ? 'red' : v === 'SECURITY_REVIEWER' ? 'accent' : 'secondary'}>{ROLE_LABELS[v]}</Badge> },
    { key: 'isActive', label: 'Operational Status', render: (v) => <Badge color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Badge> },
    { key: 'createdAt', label: 'Registry Date', render: (v) => <span className="text-xs text-dark-text/40 font-medium">{formatDate(v)}</span> },
    {
      key: 'id', label: '', render: (v, row) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setUserModal(row) }} className="hover:bg-white/5">
          <Edit size={14} className="text-primary-light" />
          <span className="ml-1 uppercase text-[10px] tracking-widest font-bold">Configure</span>
        </Button>
      )
    },
  ]

  const policyColumns = [
    { key: 'policyCode', label: 'Protocol ID', render: (v) => <span className="font-mono text-[10px] font-bold text-primary-light bg-primary/10 px-2 py-1 rounded-md border border-primary/20">{v}</span> },
    { key: 'title', label: 'Policy Signature', render: (v) => <span className="text-sm font-bold text-white tracking-tight">{v}</span> },
    { key: 'severity', label: 'Criticality', render: (v) => <Badge color={v === 'HIGH' ? 'red' : v === 'MEDIUM' ? 'yellow' : 'green'}>{v}</Badge> },
    { key: 'description', label: 'Scope Definition', render: (v) => <span className="text-xs text-dark-text/40 font-medium truncate max-w-sm block leading-relaxed">{v || 'Analytical scope undefined'}</span> },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* System Architecture Metrics */}
      {!metricsLoading && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Network Users" value={metrics.userCount} icon={Users} color="primary" />
          <StatCard label="Total Exception Nodes" value={metrics.exceptionCount} icon={FileText} color="secondary" />
          <StatCard label="Active Governance Nodes" value={metrics.activeCount} icon={Shield} color="accent" />
          <StatCard label="Functional Units" value={metrics.departmentCount} icon={Building} color="milk" />
        </div>
      )}

      {/* Structural Controls */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-2xl border border-white/5 self-start">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${tab === t.id
                ? 'bg-gradient-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                : 'text-dark-text/30 hover:text-white hover:bg-white/5'
                }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-white tracking-tight">Identity Nexus</h2>
                <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest mt-1">
                  Authorized personnel with cross-departmental access clearance
                </p>
              </div>
              <Button variant="primary" size="md" onClick={() => setUserModal('create')}>
                <Plus size={18} /> <span>Initialize Identity</span>
              </Button>
            </div>
            <Card className="p-0">
              <Table columns={userColumns} data={users} loading={usersLoading} empty="No validated identities found in this sector" />
            </Card>
          </div>
        )}

        {tab === 'policies' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-white tracking-tight">Regulatory Protocols</h2>
                <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest mt-1">
                  Governance framework defining operational security boundaries
                </p>
              </div>
              <Button variant="primary" size="md" onClick={() => setPolicyModal(true)}>
                <Plus size={18} /> <span>Encode Protocol</span>
              </Button>
            </div>
            <Card className="p-0">
              <Table columns={policyColumns} data={policies} loading={false} empty="No governance protocols detected" />
            </Card>
          </div>
        )}
      </div>

      {/* Configuration Overlays */}
      <UserModal
        open={!!userModal}
        onClose={() => setUserModal(null)}
        user={userModal !== 'create' ? userModal : null}
        departments={depts}
        onSave={refetchUsers}
      />
      <PolicyModal
        open={policyModal}
        onClose={() => setPolicyModal(false)}
        departments={depts}
        onSave={refetchPolicies}
      />
    </div>
  )
}