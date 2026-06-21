import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, CheckCircle, Clock, Shield,
  TrendingUp, FileText, Users, AlertOctagon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { reportsApi } from '../api/reports.js'
import { exceptionsApi } from '../api/exceptions.js'
import { adminApi } from '../api/admin.js'
import { StatCard } from '../components/ui/Card.jsx'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { RiskBadge, StatusBadge } from '../components/ui/Badge.jsx'
import { PageSpinner } from '../components/ui/Form.jsx'
import { Table } from '../components/ui/Table.jsx'
import {
  RiskDistributionChart, DepartmentRiskChart, ComplianceImpactChart
} from '../components/charts/Charts.jsx'
import { reportsApi as rApi } from '../api/reports.js'
import { formatDate } from '../utils/format.js'
import { GovernanceScoreSummary } from '../components/charts/GovernanceScoreCard.jsx'

export default function DashboardPage() {
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()
  const [dashData, setDashData] = useState(null)
  const [exceptions, setExceptions] = useState([])
  const [deptData, setDeptData] = useState(null)
  const [complianceData, setComplianceData] = useState([])
  const [activeData, setActiveData] = useState(null)
  const [adminMetrics, setAdminMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [govScore, setGovScore] = useState(null)

  const canSeeReports = hasRole('ADMIN', 'SECURITY_REVIEWER', 'AUDITOR', 'APPROVER')
  const isAdmin = hasRole('ADMIN')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const promises = [exceptionsApi.list({ limit: 8 })]

        if (canSeeReports) {
          promises.push(reportsApi.dashboard())
          promises.push(rApi.departmentWise())
          promises.push(rApi.complianceImpact())
          promises.push(rApi.active())
          promises.push(rApi.governanceScore())
        }
        if (isAdmin) {
          promises.push(adminApi.metrics())
        }

        const results = await Promise.allSettled(promises)

        if (results[0].status === 'fulfilled') setExceptions(results[0].value?.data || [])
        if (canSeeReports) {
          if (results[1]?.status === 'fulfilled') setDashData(results[1].value)
          if (results[2]?.status === 'fulfilled') setDeptData(results[2].value?.data)
          if (results[3]?.status === 'fulfilled') setComplianceData(results[3].value?.data || [])
          if (results[4]?.status === 'fulfilled') setActiveData(results[4].value)
          if (results[5]?.status === 'fulfilled') setGovScore(results[5].value)   // NEW
        }
        if (isAdmin && results[canSeeReports ? 6 : 1]?.status === 'fulfilled') {   // index shifted 5→6
          setAdminMetrics(results[canSeeReports ? 6 : 1].value)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const exceptionColumns = [
    {
      key: 'title', label: 'Exception', render: (v, row) => (
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate max-w-xs">{v}</p>
          <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-wider mt-1">{row.department?.name}</p>
        </div>
      )
    },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'riskLevel', label: 'Risk', render: (v) => <RiskBadge level={v} /> },
    { key: 'expiryDate', label: 'Expires', render: (v) => <span className="text-xs text-dark-text/50 font-medium">{formatDate(v)}</span> },
  ]

  if (loading) return <PageSpinner />

  const riskData = activeData?.byRiskLevel || {}
  const totalExceptions = exceptions.length

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {canSeeReports ? (
          <>
            <StatCard
              label="Active Exceptions"
              value={dashData?.activeCount ?? '—'}
              icon={Activity}
              color="green"
              onClick={() => navigate('/exceptions?status=ACTIVE')}
            />
            <StatCard
              label="Expiring Soon"
              value={dashData?.expiringSoon ?? '—'}
              icon={Clock}
              color="amber"
              trend="Within 7 days"
            />
            <StatCard
              label="Pending Reviews"
              value={dashData?.pendingApprovals ?? '—'}
              icon={CheckCircle}
              color="blue"
              onClick={() => navigate('/approvals')}
            />
            <StatCard
              label="High / Critical Risk"
              value={dashData?.highRiskCount ?? '—'}
              icon={AlertTriangle}
              color="red"
              onClick={() => navigate('/reports')}
            />
          </>
        ) : (
          <>
            <StatCard label="My Exceptions" value={totalExceptions} icon={FileText} color="blue" />
            <StatCard
              label="Active"
              value={exceptions.filter(e => e.status === 'ACTIVE').length}
              icon={Activity}
              color="green"
            />
            <StatCard
              label="Pending Review"
              value={exceptions.filter(e => e.status === 'SUBMITTED').length}
              icon={Clock}
              color="amber"
            />
            <StatCard
              label="Drafts"
              value={exceptions.filter(e => e.status === 'DRAFT').length}
              icon={FileText}
              color="slate"
            />
          </>
        )}
      </div>

      {/* Admin metrics row */}
      {isAdmin && adminMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={adminMetrics.userCount} icon={Users} color="purple" onClick={() => navigate('/admin')} />
          <StatCard label="Total Exceptions" value={adminMetrics.exceptionCount} icon={FileText} color="blue" />
          <StatCard label="Active Now" value={adminMetrics.activeCount} icon={Activity} color="green" />
          <StatCard label="Departments" value={adminMetrics.departmentCount} icon={Shield} color="slate" />
        </div>
      )}

      {/* Anomaly warning */}
      {canSeeReports && dashData?.anomalyCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-4 flex items-center gap-4 animate-pulse">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertOctagon size={20} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-200">
              {dashData.anomalyCount} critical anomaly flag{dashData.anomalyCount !== 1 ? 's' : ''} detected
            </p>
            <p className="text-xs text-red-400/70 mt-0.5 font-medium">Potential policy violations require immediate governance review.</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => navigate('/audit-logs')}>Review All</Button>
        </div>
      )}

      {canSeeReports && govScore && (
        <GovernanceScoreSummary score={govScore.organizationScore} grade={govScore.organizationGrade} />
      )}

      {/* Charts row */}
      {canSeeReports && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card>
            <CardHeader title="Risk Distribution" subtitle="Active exceptions by risk level" />
            <RiskDistributionChart data={riskData} />
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Exceptions by Department" subtitle="Status breakdown per department" />
            <DepartmentRiskChart data={deptData} />
          </Card>
        </div>
      )}

      {/* Bottom row */}
      <div className={`grid gap-6 ${canSeeReports ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
        <Card className={canSeeReports ? 'lg:col-span-2' : ''}>
          <CardHeader
            title="Recent Exceptions"
            subtitle="Latest organization-wide activity"
            action={
              <button onClick={() => navigate('/exceptions')} className="text-xs text-primary-light hover:text-white transition-colors font-bold uppercase tracking-widest">
                View Repository →
              </button>
            }
          />
          <Table
            columns={exceptionColumns}
            data={exceptions}
            loading={false}
            empty="No exceptions yet"
            onRowClick={(row) => navigate(`/exceptions/${row.id}`)}
          />
        </Card>

        {canSeeReports && (
          <Card>
            <CardHeader title="Compliance Impact" subtitle="Exceptions per framework" />
            <ComplianceImpactChart data={complianceData} />
          </Card>
        )}
      </div>
    </div>
  )
}