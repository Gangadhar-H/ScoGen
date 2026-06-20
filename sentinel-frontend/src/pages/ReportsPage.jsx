

// REPLACE WITH (adds Download icon + Button import):
import React, { useState, useEffect } from 'react'
import { BarChart3, FileText, AlertTriangle, Building, Shield, Download } from 'lucide-react'
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
      key: 'title', label: 'Exception', render: (v, row) => (
        <div>
          <p className="font-medium text-xs text-slate-900 max-w-48 truncate">{v}</p>
          <p className="text-[10px] text-slate-400">{row.requester?.name}</p>
        </div>
      )
    },
    { key: 'department', label: 'Department', render: (v) => <span className="text-xs">{v?.name}</span> },
    { key: 'exceptionType', label: 'Type', render: (v) => <span className="text-xs">{v?.name}</span> },
    { key: 'riskLevel', label: 'Risk', render: (v) => <RiskBadge level={v} /> },
    { key: 'riskScore', label: 'Score', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'expiryDate', label: 'Expires', render: (v) => <span className="text-xs text-slate-500">{formatDate(v)}</span> },
  ]

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : (
        <>
          {/* Overview */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-5">
                <Card>
                  <CardHeader title="Risk Distribution" subtitle="Active exceptions by risk level" />
                  <RiskDistributionChart data={data.active?.byRiskLevel || {}} />
                </Card>
                <Card className="col-span-2">
                  <CardHeader title="Department Overview" subtitle="Exception counts by department and status" />
                  <DepartmentRiskChart data={data.dept} />
                </Card>
              </div>
              <Card>
                <CardHeader title="Compliance Framework Impact" subtitle="Number of exceptions mapped to each compliance framework" />
                <ComplianceImpactChart data={data.compliance} />
              </Card>

              {/* Type breakdown */}
              {data.active?.byType && (
                <Card>
                  <CardHeader title="Exceptions by Type" />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(data.active.byType).map(([name, count]) => (
                      <div key={name} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-2xl font-bold text-slate-800">{count}</p>
                        <p className="text-xs text-slate-500 mt-1">{name}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Active */}
          {tab === 'active' && (
            <Card padding={false}>
              <div className="px-5 pt-4 pb-0">
                <CardHeader
                  title={`Active Exceptions (${data.active?.count || 0})`}
                  subtitle="Currently active policy exceptions"
                  action={<Button variant="secondary" size="sm" onClick={() => downloadReportPdf('active')}><Download size={12} /> Export PDF</Button>}
                />
              </div>
              <Table columns={excColumns} data={data.active?.data || []} loading={false} empty="No active exceptions" />
            </Card>
          )}

          {/* Critical */}
          {tab === 'critical' && (
            <Card padding={false}>
              <div className="px-5 pt-4 pb-0">
                <CardHeader
                  title={`Critical Risk Exceptions (${data.critical?.count || 0})`}
                  subtitle="Exceptions with CRITICAL risk level — require immediate attention"
                  action={<Button variant="secondary" size="sm" onClick={() => downloadReportPdf('critical')}><Download size={12} /> Export PDF</Button>}
                />
              </div>
              <Table columns={excColumns} data={data.critical?.data || []} loading={false} empty="No critical exceptions" />
            </Card>
          )}

          {/* Expired */}
          {tab === 'expired' && (
            <Card padding={false}>
              <div className="px-5 pt-4 pb-0">
                <CardHeader
                  title={`Expired Exceptions (${data.expired?.count || 0})`}
                  subtitle="Exceptions that have passed their expiry date"
                  action={<Button variant="secondary" size="sm" onClick={() => downloadReportPdf('expired')}><Download size={12} /> Export PDF</Button>}
                />
              </div>
              <Table columns={excColumns} data={data.expired?.data || []} loading={false} empty="No expired exceptions" />
            </Card>
          )}

          {/* Department */}
          {tab === 'department' && (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Department-wise Breakdown" subtitle="Exception status counts per department" />
                <DepartmentRiskChart data={data.dept} />
              </Card>
              <Card>
                <CardHeader title="Detailed Breakdown" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="table-header text-left">Department</th>
                        {['ACTIVE', 'SUBMITTED', 'DRAFT', 'EXPIRED', 'REJECTED', 'REVOKED'].map(s => (
                          <th key={s} className="table-header text-center">{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.dept || {}).map(([dept, counts]) => (
                        <tr key={dept} className="table-row">
                          <td className="table-cell font-medium">{dept}</td>
                          {['ACTIVE', 'SUBMITTED', 'DRAFT', 'EXPIRED', 'REJECTED', 'REVOKED'].map(s => (
                            <td key={s} className="table-cell text-center">
                              {counts[s] ? <span className="font-mono">{counts[s]}</span> : <span className="text-slate-300">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Compliance */}
          {tab === 'compliance' && (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Compliance Impact" subtitle="Exceptions mapped to compliance frameworks" />
                <ComplianceImpactChart data={data.compliance} />
              </Card>
              <Card padding={false}>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Framework</th>
                      <th className="table-header text-left">Control Code</th>
                      <th className="table-header text-left">Exception Types</th>
                      <th className="table-header text-right">Total Exceptions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.compliance || []).map((item, i) => (
                      <tr key={i} className="table-row">
                        <td className="table-cell font-medium">{item.framework}</td>
                        <td className="table-cell font-mono text-xs text-slate-500">{item.controlCode}</td>
                        <td className="table-cell">
                          <div className="flex flex-wrap gap-1">
                            {item.mappedExceptionTypes.map(t => (
                              <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="table-cell text-right font-mono font-semibold">{item.exceptionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}
          {tab === 'policy' && (
            <Card padding={false}>
              <div className="px-5 pt-4 pb-2">
                <CardHeader title="Policy Effectiveness" subtitle="Policies generating 10+ exceptions in the last 6 months may need revision" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Policy</th>
                      <th className="table-header text-left">Severity</th>
                      <th className="table-header text-right">Exceptions (6mo)</th>
                      <th className="table-header text-left">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.policy || []).map((p) => (
                      <tr key={p.policyId} className="table-row">
                        <td className="table-cell font-medium">{p.policyCode} — {p.title}</td>
                        <td className="table-cell"><Badge color={p.severity === 'HIGH' ? 'red' : p.severity === 'MEDIUM' ? 'amber' : 'green'}>{p.severity}</Badge></td>
                        <td className="table-cell text-right font-mono font-semibold">{p.exceptionCount}</td>
                        <td className="table-cell text-xs">
                          {p.isUnrealistic
                            ? <span className="text-red-600 font-medium">{p.recommendation}</span>
                            : <span className="text-slate-400">No action needed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}