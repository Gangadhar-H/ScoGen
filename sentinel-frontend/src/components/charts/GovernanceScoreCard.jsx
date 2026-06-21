import React from 'react'
import { ShieldCheck, ShieldAlert, ShieldX, RefreshCw, CheckSquare, AlertOctagon } from 'lucide-react'
import { Card } from '../ui/Card.jsx'

const GRADE_COLORS = {
    A: { text: 'text-green-700', bg: 'bg-green-100', bar: 'bg-green-500' },
    B: { text: 'text-emerald-700', bg: 'bg-emerald-100', bar: 'bg-emerald-500' },
    C: { text: 'text-amber-700', bg: 'bg-amber-100', bar: 'bg-amber-500' },
    D: { text: 'text-orange-700', bg: 'bg-orange-100', bar: 'bg-orange-500' },
    F: { text: 'text-red-700', bg: 'bg-red-100', bar: 'bg-red-500' },
}

function ScoreRing({ score, grade, size = 56 }) {
    const colors = GRADE_COLORS[grade] || GRADE_COLORS.C
    return (
        <div className={`flex-shrink-0 flex items-center justify-center rounded-full ${colors.bg}`} style={{ width: size, height: size }}>
            <span className={`text-base font-bold ${colors.text}`}>{score}</span>
        </div>
    )
}

function FactorRow({ icon: Icon, label, detail, penalty }) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-600">
                <Icon size={12} className="text-slate-400" />
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{detail}</span>
                <span className={`text-xs font-mono font-semibold ${penalty > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                    -{penalty}
                </span>
            </div>
        </div>
    )
}

export function DepartmentScoreCard({ dept }) {
    const colors = GRADE_COLORS[dept.grade] || GRADE_COLORS.C
    const { breakdown } = dept

    return (
        <Card>
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-sm font-semibold text-slate-900">{dept.departmentName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        {dept.totalExceptions} exception{dept.totalExceptions !== 1 ? 's' : ''} tracked
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${colors.bg} ${colors.text}`}>{dept.grade}</span>
                    <ScoreRing score={dept.score} grade={dept.grade} />
                </div>
            </div>

            <div className="h-1.5 bg-slate-100 rounded-full mb-3">
                <div className={`h-1.5 rounded-full ${colors.bar} transition-all`} style={{ width: `${dept.score}%` }} />
            </div>

            <div className="divide-y divide-slate-50 border-t border-slate-100 pt-1">
                <FactorRow icon={AlertOctagon} label="Expired exceptions"
                    detail={`${breakdown.expiredExceptions.count}/${breakdown.expiredExceptions.total || 0}`}
                    penalty={breakdown.expiredExceptions.penalty} />
                <FactorRow icon={RefreshCw} label="Late renewals"
                    detail={`${breakdown.lateRenewals.count} flagged`}
                    penalty={breakdown.lateRenewals.penalty} />
                <FactorRow icon={CheckSquare} label="Approval quality"
                    detail={`${breakdown.approvalQuality.reworkCount}/${breakdown.approvalQuality.decidedCount} reworked`}
                    penalty={breakdown.approvalQuality.penalty} />
                <FactorRow icon={ShieldAlert} label="Audit findings"
                    detail={`${breakdown.auditFindings.count} open`}
                    penalty={breakdown.auditFindings.penalty} />
            </div>
        </Card>
    )
}

export function GovernanceScoreSummary({ score, grade }) {
    const colors = GRADE_COLORS[grade] || GRADE_COLORS.C
    const Icon = score >= 75 ? ShieldCheck : score >= 40 ? ShieldAlert : ShieldX

    return (
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${colors.bg}`}>
                <Icon size={24} className={colors.text} />
            </div>
            <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Governance Credit Score</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-bold text-slate-900">{score}</span>
                    <span className="text-sm text-slate-400">/ 100</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-md text-xs font-bold ${colors.bg} ${colors.text}`}>
                        Grade {grade}
                    </span>
                </div>
            </div>
        </div>
    )
}