

// REPLACE WITH (adds Download icon + Button import):
import React, { useState, useEffect } from 'react'
import { BarChart3, FileText, AlertTriangle, Building, Shield, Download, ShieldCheck } from 'lucide-react'
import { DepartmentScoreCard, GovernanceScoreSummary } from '../components/charts/GovernanceScoreCard.jsx'
import { reportsApi } from '../api/reports.js'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { RiskBadge, StatusBadge } from '../components/ui/Badge.jsx'
import { Table } from '../components/ui/Table.jsx'
import { PageSpinner } from '../components/ui/Form.jsx'
import { RiskDistributionChart, DepartmentRiskChart, ComplianceImpactChart } from '../components/charts/Charts.jsx'
import { formatDate } from '../utils/format.js'
import { Badge } from '../components/ui/Badge.jsx'



const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'active', label: 'Active', icon: FileText },
  { id: 'critical', label: 'Critical', icon: AlertTriangle },
  { id: 'expired', label: 'Expired', icon: FileText },
  { id: 'department', label: 'By Department', icon: Building },
  { id: 'compliance', label: 'Compliance', icon: Shield },
  { id: 'policy', label: 'Policy Effectiveness', icon: AlertTriangle },
  { id: 'governance', label: 'Governance Score', icon: ShieldCheck }, // NEW
]

export default function ReportsPage() {
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({})

  async function downloadReportPdf(type) {
    const token = localStorage.getItem('sentinel_token')
    const res = await fetch(reportsApi.exportPdfUrl(type), { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      console.error('PDF export failed', res.status)
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}-exceptions-report.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (tab === 'overview') {
          const [active, dept, compliance] = await Promise.all([
            reportsApi.active(),
            reportsApi.departmentWise(),
            reportsApi.complianceImpact(),
          ])
          setData({ active, dept: dept.data, compliance: compliance.data })
        } else if (tab === 'active') {
          const res = await reportsApi.active()
          setData({ active: res })
        } else if (tab === 'critical') {
          const res = await reportsApi.critical()
          setData({ critical: res })
        } else if (tab === 'expired') {
          const res = await reportsApi.expired()
          setData({ expired: res })
        } else if (tab === 'department') {
          const res = await reportsApi.departmentWise()
          setData({ dept: res.data })
        } else if (tab === 'compliance') {
          const res = await reportsApi.complianceImpact()
          setData({ compliance: res.data })
        } else if (tab === 'policy') {
          const res = await reportsApi.policyEffectiveness()
          setData({ policy: res.data })
        } else if (tab === 'governance') {           // NEW
          const res = await reportsApi.governanceScore()
          setData({ governance: res })
        }
      } catch { }
      finally {
        setLoading(false)
      }
    }
    load()
  }, [tab])

  const excColumns = [
    {
      key: 'title', label: 'Protocol Signature', render: (v, row) => (
        <div>
          <p className="font-bold text-sm text-white tracking-tight max-w-48 truncate">{v}</p>
          <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest">{row.requester?.name}</p>
        </div>
      )
    },
    { key: 'department', label: 'Functional Unit', render: (v) => <span className="text-xs font-medium text-dark-text/40">{v?.name}</span> },
    { key: 'exceptionType', label: 'Class', render: (v) => <span className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest">{v?.name}</span> },
    { key: 'riskLevel', label: 'Index', render: (v) => <RiskBadge level={v} /> },
    { key: 'riskScore', label: 'Vector', render: (v) => <span className="font-mono text-xs font-bold text-white">{v}</span> },
    { key: 'status', label: 'Operational Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'expiryDate', label: 'Terminal Date', render: (v) => <span className="text-xs text-dark-text/40 font-medium">{formatDate(v)}</span> },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Intelligence Ledger</h1>
          <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest mt-1">
            Analytical reporting suite for architectural governance and risk profiling
          </p>
        </div>
      </div>

      {/* Analytical Controls */}
      <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-2xl border border-white/5 self-start overflow-x-auto max-w-full no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap ${tab === t.id
                ? 'bg-gradient-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                : 'text-dark-text/30 hover:text-white hover:bg-white/5'
              }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <PageSpinner />
        </div>
      ) : (
        <div className="animate-fade-in">
          {/* Overview */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <div className="flex items-center justify-between mb-6">
                    <CardHeader title="Risk Profile" subtitle="Active distribution by vector level" />
                  </div>
                  <div className="h-[280px]">
                    <RiskDistributionChart data={data.active?.byRiskLevel || {}} />
                  </div>
                </Card>
                <Card className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <CardHeader title="Functional Nodes" subtitle="Exception density by operational unit" />
                  </div>
                  <div className="h-[280px]">
                    <DepartmentRiskChart data={data.dept} />
                  </div>
                </Card>
              </div>

              <Card>
                <div className="flex items-center justify-between mb-6">
                  <CardHeader title="Governance Framework Index" subtitle="Regulatory mapping density across core infrastructures" />
                </div>
                <div className="h-[320px]">
                  <ComplianceImpactChart data={data.compliance} />
                </div>
              </Card>

              {/* Type breakdown */}
              {data.active?.byType && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(data.active.byType).map(([name, count]) => (
                    <div key={name} className="glass-card p-6 border-white/5 hover:bg-white/[0.04] transition-all group">
                      <p className="text-3xl font-display font-bold text-white tracking-tighter group-hover:text-primary transition-colors">{count}</p>
                      <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest mt-2">{name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Views based on same premium pattern */}
          {['active', 'critical', 'expired'].includes(tab) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-white tracking-tight capitalize">{tab} Report</h3>
                <Button variant="secondary" size="md" onClick={() => downloadReportPdf(tab)}>
                  <Download size={16} /> <span className="ml-1 uppercase text-[10px] tracking-widest font-bold">Download Ledger</span>
                </Button>
              </div>
              <Card className="p-0">
                <Table columns={excColumns} data={data[tab]?.data || []} loading={false} empty={`No ${tab} exceptions detected`} />
              </Card>
            </div>
          )}

          {/* Department Breakdown */}
          {tab === 'department' && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="Unit Distribution" subtitle="Normalized exception metrics per functional node" />
                <div className="h-[320px] mt-6">
                  <DepartmentRiskChart data={data.dept} />
                </div>
              </Card>
              <Card className="p-0 overflow-hidden">
                <table className="w-full text-[11px] font-bold uppercase tracking-wider">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                      <th className="px-6 py-4 text-left text-dark-text/30">Functional Unit</th>
                      {['ACTIVE', 'SUBMITTED', 'DRAFT', 'EXPIRED', 'REJECTED', 'REVOKED'].map(s => (
                        <th key={s} className="px-6 py-4 text-center text-dark-text/30">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {Object.entries(data.dept || {}).map(([dept, counts]) => (
                      <tr key={dept} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-white font-bold">{dept}</td>
                        {['ACTIVE', 'SUBMITTED', 'DRAFT', 'EXPIRED', 'REJECTED', 'REVOKED'].map(s => (
                          <td key={s} className="px-6 py-4 text-center">
                            {counts[s] ? <span className="font-mono text-xs text-primary-light">{counts[s]}</span> : <span className="text-dark-text/10">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* Compliance Breakdown */}
          {tab === 'compliance' && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="Regulatory Mapping" subtitle="Exception density mapped to global compliance architectures" />
                <div className="h-[320px] mt-6">
                  <ComplianceImpactChart data={data.compliance} />
                </div>
              </Card>
              <Card className="p-0 overflow-hidden">
                <table className="w-full text-[11px] font-bold uppercase tracking-wider">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                      <th className="px-6 py-4 text-left text-dark-text/30">Architecture</th>
                      <th className="px-6 py-4 text-left text-dark-text/30">Control ID</th>
                      <th className="px-6 py-4 text-left text-dark-text/30">Entity Variants</th>
                      <th className="px-6 py-4 text-right text-dark-text/30">Total Nodes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(data.compliance || []).map((item, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-white font-bold">{item.framework}</td>
                        <td className="px-6 py-4"><span className="font-mono text-[10px] text-primary-light bg-primary/10 px-2 py-1 rounded border border-primary/20">{item.controlCode}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {item.mappedExceptionTypes.map(t => (
                              <span key={t} className="px-1.5 py-0.5 bg-white/5 text-dark-text/40 rounded text-[9px] border border-white/10">{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-white text-sm">{item.exceptionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* Policy Effectiveness */}
          {tab === 'policy' && (
            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                <h3 className="text-lg font-display font-bold text-white tracking-tight">Policy Resilience Analysis</h3>
                <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest mt-1">Protocols generating critical exception volumes require architectural revision</p>
              </div>
              <table className="w-full text-[11px] font-bold uppercase tracking-wider">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-6 py-4 text-left text-dark-text/30">Core Protocol</th>
                    <th className="px-6 py-4 text-left text-dark-text/30">Severity Vector</th>
                    <th className="px-6 py-4 text-right text-dark-text/30">6Mo Volatility</th>
                    <th className="px-6 py-4 text-left text-dark-text/30">Structural Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(data.policy || []).map((p) => (
                    <tr key={p.policyId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-white font-bold">{p.policyCode} <span className="opacity-40 mx-2">/</span> {p.title}</td>
                      <td className="px-6 py-4"><Badge color={p.severity === 'HIGH' ? 'red' : p.severity === 'MEDIUM' ? 'yellow' : 'green'}>{p.severity}</Badge></td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-white text-sm">{p.exceptionCount}</td>
                      <td className="px-6 py-4">
                        {p.isUnrealistic
                          ? <span className="text-red-400 font-bold flex items-center gap-2 italic ring-1 ring-red-500/20 px-2 py-1 rounded-lg bg-red-500/5">{p.recommendation}</span>
                          : <span className="text-dark-text/20 italic">Architectural Integrity Maintained</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Governance Analytics */}
          {tab === 'governance' && data.governance && (
            <div className="space-y-6">
              <GovernanceScoreSummary
                score={data.governance.organizationScore}
                grade={data.governance.organizationGrade}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.governance.departments.map((dept) => (
                  <DepartmentScoreCard key={dept.departmentId} dept={dept} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}