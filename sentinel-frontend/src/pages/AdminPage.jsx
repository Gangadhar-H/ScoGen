import React, { useState } from 'react'
import { Users, FileText, Shield, Plus, Edit } from 'lucide-react'
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
    { key: 'name', label: 'Name', render: (v, row) => (
      <div>
        <p className="text-xs font-medium text-slate-800">{v}</p>
        <p className="text-[10px] text-slate-400">{row.email}</p>
      </div>
    )},
    { key: 'role', label: 'Role', render: (v) => <Badge color={v === 'ADMIN' ? 'red' : v === 'SECURITY_REVIEWER' ? 'purple' : 'blue'}>{ROLE_LABELS[v]}</Badge> },
    { key: 'isActive', label: 'Status', render: (v) => <Badge color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Badge> },
    { key: 'createdAt', label: 'Created', render: (v) => <span className="text-xs text-slate-400">{formatDate(v)}</span> },
    { key: 'id', label: '', render: (v, row) => (
      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setUserModal(row) }}>
        <Edit size={11} /> Edit
      </Button>
    )},
  ]

  const policyColumns = [
    { key: 'policyCode', label: 'Code', render: (v) => <span className="font-mono text-xs text-brand-700">{v}</span> },
    { key: 'title', label: 'Title', render: (v) => <span className="text-xs font-medium">{v}</span> },
    { key: 'severity', label: 'Severity', render: (v) => <Badge color={v === 'HIGH' ? 'red' : v === 'MEDIUM' ? 'amber' : 'green'}>{v}</Badge> },
    { key: 'description', label: 'Description', render: (v) => <span className="text-xs text-slate-500 truncate max-w-48 block">{v || '—'}</span> },
  ]

  return (
    <div className="space-y-5">
      {/* System metrics */}
      {!metricsLoading && metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={metrics.userCount} icon={Users} color="blue" />
          <StatCard label="Total Exceptions" value={metrics.exceptionCount} icon={FileText} color="purple" />
          <StatCard label="Active Exceptions" value={metrics.activeCount} icon={Shield} color="green" />
          <StatCard label="Departments" value={metrics.departmentCount} icon={Shield} color="slate" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <Card padding={false}>
          <div className="flex items-center justify-between px-5 py-4">
            <CardHeader title={`Users (${users.length})`} subtitle="Manage user accounts and roles" />
            <Button variant="primary" size="sm" onClick={() => setUserModal('create')}>
              <Plus size={12} /> Add User
            </Button>
          </div>
          <Table columns={userColumns} data={users} loading={usersLoading} empty="No users found" />
        </Card>
      )}

      {tab === 'policies' && (
        <Card padding={false}>
          <div className="flex items-center justify-between px-5 py-4">
            <CardHeader title={`Policies (${policies.length})`} subtitle="Manage security policies" />
            <Button variant="primary" size="sm" onClick={() => setPolicyModal(true)}>
              <Plus size={12} /> Add Policy
            </Button>
          </div>
          <Table columns={policyColumns} data={policies} loading={false} empty="No policies found" />
        </Card>
      )}

      {/* Modals */}
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