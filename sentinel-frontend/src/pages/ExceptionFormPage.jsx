import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { exceptionsApi } from '../api/exceptions.js'
import { lookupsApi } from '../api/lookups.js'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { FormField, Input, Select, Textarea } from '../components/ui/Form.jsx'
import { RiskBadge } from '../components/ui/Badge.jsx'
import { PageSpinner } from '../components/ui/Form.jsx'

function getRisk(score) {
  if (score <= 25) return 'LOW'
  if (score <= 50) return 'MEDIUM'
  if (score <= 75) return 'HIGH'
  return 'CRITICAL'
}

export default function ExceptionFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [form, setForm] = useState({
    title: '', description: '', businessJustification: '', systemAffected: '',
    exceptionTypeId: '', policyId: '', departmentId: '', startDate: '', expiryDate: '',
  })
  const [departments, setDepartments] = useState([])
  const [types, setTypes] = useState([])
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewScore, setPreviewScore] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [depts, etypes, pols] = await Promise.all([
          lookupsApi.departments(),
          lookupsApi.exceptionTypes(),
          lookupsApi.policies(),
        ])
        setDepartments(depts)
        setTypes(etypes)
        setPolicies(pols)

        if (isEdit) {
          const exc = await exceptionsApi.get(id)
          setForm({
            title: exc.title || '',
            description: exc.description || '',
            businessJustification: exc.businessJustification || '',
            systemAffected: exc.systemAffected || '',
            exceptionTypeId: exc.exceptionTypeId || '',
            policyId: exc.policyId || '',
            departmentId: exc.departmentId || '',
            startDate: exc.startDate ? exc.startDate.split('T')[0] : '',
            expiryDate: exc.expiryDate ? exc.expiryDate.split('T')[0] : '',
          })
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setPageLoading(false)
      }
    }
    load()
  }, [id])

  // Live risk preview
  useEffect(() => {
    if (form.exceptionTypeId && form.startDate && form.expiryDate) {
      const type = types.find(t => t.id === form.exceptionTypeId)
      if (!type) return
      const days = Math.ceil((new Date(form.expiryDate) - new Date(form.startDate)) / 86400000)
      const dur = days <= 30 ? 10 : days <= 90 ? 25 : days <= 180 ? 40 : 50
      const score = Math.min(100, Math.max(0, type.baseRiskScore + dur))
      setPreviewScore(score)
    } else {
      setPreviewScore(null)
    }
  }, [form.exceptionTypeId, form.startDate, form.expiryDate, types])

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.title || !form.businessJustification || !form.systemAffected || !form.exceptionTypeId || !form.departmentId) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        policyId: form.policyId || undefined,
        startDate: form.startDate || undefined,
        expiryDate: form.expiryDate || undefined,
      }

      if (isEdit) {
        await exceptionsApi.update(id, payload)
        navigate(`/exceptions/${id}`)
      } else {
        const created = await exceptionsApi.create(payload)
        navigate(`/exceptions/${created.id}`)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) return <PageSpinner />

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(isEdit ? `/exceptions/${id}` : '/exceptions')} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-900">{isEdit ? 'Edit Exception' : 'New Exception Request'}</h2>
          <p className="text-xs text-slate-500">{isEdit ? 'Update the details of this exception' : 'Submit a new policy exception request for review'}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader title="Basic Information" />
          <div className="space-y-4">
            <FormField label="Exception Title" required>
              <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brief, descriptive title for this exception" required />
            </FormField>
            <FormField label="Description">
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Additional context or notes (optional)" />
            </FormField>
            <FormField label="Business Justification" required>
              <Textarea rows={4} value={form.businessJustification} onChange={e => set('businessJustification', e.target.value)} placeholder="Why is this exception necessary? What business need does it serve?" required />
            </FormField>
            <FormField label="System Affected" required>
              <Input value={form.systemAffected} onChange={e => set('systemAffected', e.target.value)} placeholder="Which system, service, or infrastructure is affected?" required />
            </FormField>
          </div>
        </Card>

        <Card>
          <CardHeader title="Classification" />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Exception Type" required>
              <Select value={form.exceptionTypeId} onChange={e => set('exceptionTypeId', e.target.value)} required>
                <option value="">Select type…</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name} (base risk: {t.baseRiskScore})</option>)}
              </Select>
            </FormField>
            <FormField label="Department" required>
              <Select value={form.departmentId} onChange={e => set('departmentId', e.target.value)} required>
                <option value="">Select department…</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Related Policy">
              <Select value={form.policyId} onChange={e => set('policyId', e.target.value)}>
                <option value="">None (select if applicable)</option>
                {policies.map(p => <option key={p.id} value={p.id}>{p.policyCode} — {p.title}</option>)}
              </Select>
            </FormField>
          </div>
        </Card>

        <Card>
          <CardHeader title="Duration" subtitle="Both dates are required before submitting for review" />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date">
              <Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </FormField>
            <FormField label="Expiry Date">
              <Input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
            </FormField>
          </div>

          {previewScore !== null && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Estimated Risk Score</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Based on type and duration (approximate)</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-800">{previewScore}</span>
                  <RiskBadge level={getRisk(previewScore)} />
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(isEdit ? `/exceptions/${id}` : '/exceptions')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Exception'}
          </Button>
        </div>
      </form>
    </div>
  )
}