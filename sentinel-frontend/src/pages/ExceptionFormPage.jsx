import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Sparkles, TrendingDown, Loader2 } from 'lucide-react'
import { exceptionsApi } from '../api/exceptions.js'
import { lookupsApi } from '../api/lookups.js'
import { advisorApi } from '../api/advisor.js'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { FormField, Input, Select, Textarea } from '../components/ui/Form.jsx'
import { RiskBadge } from '../components/ui/Badge.jsx'
import { PageSpinner } from '../components/ui/Form.jsx'

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
  const [advisorSuggestion, setAdvisorSuggestion] = useState(null)
  const [advisorLoading, setAdvisorLoading] = useState(false)
  const getRisk = (score) => {
    if (score >= 76) return 'CRITICAL'
    if (score >= 51) return 'HIGH'
    if (score >= 26) return 'MEDIUM'
    return 'LOW'
  }

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

  useEffect(() => {
    if (!form.exceptionTypeId) {
      setAdvisorSuggestion(null)
      return
    }
    if (!form.businessJustification || form.businessJustification.trim().length < 15) {
      setAdvisorSuggestion(null)
      return
    }
    const timer = setTimeout(async () => {
      setAdvisorLoading(true)
      try {
        const res = await advisorApi.suggest({
          exceptionTypeId: form.exceptionTypeId,
          title: form.title,
          businessJustification: form.businessJustification,
          systemAffected: form.systemAffected,
          startDate: form.startDate || null,
          expiryDate: form.expiryDate || null,
        })
        setAdvisorSuggestion(res.hasSuggestion ? res : null)
      } catch {
        setAdvisorSuggestion(null)
      } finally {
        setAdvisorLoading(false)
      }
    }, 900)
    return () => clearTimeout(timer)
  }, [form.exceptionTypeId, form.startDate, form.expiryDate, form.businessJustification, form.title, form.systemAffected])

  function applyAdvisorSuggestion() {
    if (!advisorSuggestion?.alternative) return
    set('startDate', new Date(advisorSuggestion.alternative.startDate).toISOString().slice(0, 10))
    set('expiryDate', new Date(advisorSuggestion.alternative.expiryDate).toISOString().slice(0, 10))
    setAdvisorSuggestion(null)
  }

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
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(isEdit ? `/exceptions/${id}` : '/exceptions')} className="p-2.5 rounded-xl text-dark-text/30 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/5 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">{isEdit ? 'Re-config Protocol' : 'Initialize Request'}</h1>
          <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest mt-1">
            {isEdit ? 'Updating existing exception signature' : 'Encoding a new architectural exception into the governance layer'}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-display font-bold text-white tracking-tight">Core Parameters</h3>
            <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest mt-1">Fundamental request identifiers</p>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <FormField label="Protocol Title" required>
              <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Define a descriptive entity signature..." required />
            </FormField>
            <FormField label="Scope Extension">
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Provide additional structural context (optional)..." />
            </FormField>
            <FormField label="Strategic Justification" required>
              <Textarea rows={4} value={form.businessJustification} onChange={e => set('businessJustification', e.target.value)} placeholder="Define the operational necessity for this protocol divergence..." required />
            </FormField>
            <FormField label="Target Infrastructure" required>
              <Input value={form.systemAffected} onChange={e => set('systemAffected', e.target.value)} placeholder="Which resource node or sector is affected?" required />
            </FormField>
          </div>
        </Card>

        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-display font-bold text-white tracking-tight">Taxonomy</h3>
            <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest mt-1">Structural classification and domain ownership</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Exception Class" required>
              <Select value={form.exceptionTypeId} onChange={e => set('exceptionTypeId', e.target.value)} required>
                <option value="">Select Variant...</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name} (Base Index: {t.baseRiskScore})</option>)}
              </Select>
            </FormField>
            <FormField label="Functional Domain" required>
              <Select value={form.departmentId} onChange={e => set('departmentId', e.target.value)} required>
                <option value="">Select Domain...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Associated Governance Policy">
                <Select value={form.policyId} onChange={e => set('policyId', e.target.value)}>
                  <option value="">Null (Self-contained request)</option>
                  {policies.map(p => <option key={p.id} value={p.id}>{p.policyCode} — {p.title}</option>)}
                </Select>
              </FormField>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-display font-bold text-white tracking-tight">Temporal Scope</h3>
            <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest mt-1">Lifecycle boundaries for the requested divergence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Execution Start">
              <Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </FormField>
            <FormField label="Operational Expiry">
              <Input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
            </FormField>
          </div>

          {(previewScore !== null || advisorLoading || advisorSuggestion) && (
            <div className="mt-8 space-y-4">
              {previewScore !== null && (
                <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest">Analytical Risk Projection</p>
                    <p className="text-[9px] text-dark-text/20 uppercase tracking-tighter mt-0.5">Automated calculation based on type/duration vectors</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-display font-bold text-white tracking-tighter">{previewScore}</span>
                    <RiskBadge level={getRisk(previewScore)} />
                  </div>
                </div>
              )}

              {advisorLoading && !advisorSuggestion && (
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3 text-[10px] font-bold text-primary-light uppercase tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.05)]">
                  <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  Synchronizing with Governance AI...
                </div>
              )}

              {advisorSuggestion && (
                <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles size={80} />
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                      <Sparkles size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-primary-light uppercase tracking-widest">Architectural Advisor</p>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-widest border border-emerald-500/20">
                          <TrendingDown size={12} /> -{advisorSuggestion.alternative.riskReductionPercent}% Risk Vector
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white leading-relaxed">{advisorSuggestion.alternative.rationale}</p>

                      <div className="flex items-center gap-6 mt-4 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-dark-text/30 uppercase tracking-widest">Proposal</span>
                          <span className="text-xs font-bold text-white mt-1">{advisorSuggestion.alternative.label}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-dark-text/30 uppercase tracking-widest">Interval</span>
                          <span className="text-xs font-bold text-white mt-1">{advisorSuggestion.alternative.durationDays} Cycles</span>
                        </div>
                      </div>

                      <Button variant="primary" size="md" className="mt-6" onClick={applyAdvisorSuggestion}>
                        Sync Architectural Proposal
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate(isEdit ? `/exceptions/${id}` : '/exceptions')}>
            Abort
          </Button>
          <Button type="submit" variant="primary" loading={loading} className="px-10">
            {isEdit ? 'Commit Changes' : 'Execute Request'}
          </Button>
        </div>
      </form>
    </div>
  )
}