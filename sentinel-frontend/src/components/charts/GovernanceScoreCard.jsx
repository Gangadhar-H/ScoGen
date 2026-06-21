import React from 'react'
import { ShieldCheck, ShieldAlert, ShieldX, RefreshCw, CheckSquare, AlertOctagon } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { Button } from '../ui/Button.jsx'

const GRADE_COLORS = {
    A: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
    B: { text: 'text-secondary', bg: 'bg-secondary/10', bar: 'bg-secondary', glow: 'shadow-secondary/20' },
    C: { text: 'text-amber-400', bg: 'bg-amber-500/10', bar: 'bg-amber-500', glow: 'shadow-amber-500/20' },
    D: { text: 'text-orange-400', bg: 'bg-orange-500/10', bar: 'bg-orange-500', glow: 'shadow-orange-500/20' },
    F: { text: 'text-red-400', bg: 'bg-red-500/10', bar: 'bg-red-500', glow: 'shadow-red-500/20' },
}

function ScoreRing({ score, grade, size = 64 }) {
    const colors = GRADE_COLORS[grade] || GRADE_COLORS.C
    const radius = (size - 8) / 2
    const circ = 2 * Math.PI * radius
    const strokeDashoffset = circ - (circ * score) / 100

    return (
        <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
            <svg className="absolute -rotate-90 w-full h-full">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={circ}
                    style={{ strokeDashoffset }}
                    className={`${colors.text} transition-all duration-1000 ease-out`}
                />
            </svg>
            <span className={`text-base font-display font-bold text-white`}>{score}</span>
        </div>
    )
}

function FactorRow({ icon: Icon, label, detail, penalty }) {
    return (
        <div className="flex items-center justify-between py-3 group">
            <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-white/5 text-dark-text/30 group-hover:bg-white/10 group-hover:text-white transition-all">
                    <Icon size={14} />
                </div>
                <div>
                    <p className="text-xs font-semibold text-white/80">{label}</p>
                    <p className="text-[10px] text-dark-text/30 font-medium tracking-wide">{detail}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold ${penalty > 0 ? 'text-red-400' : 'text-dark-text/20'}`}>
                    {penalty > 0 ? `-${penalty}` : '0'}
                </span>
            </div>
        </div>
    )
}

export function DepartmentScoreCard({ dept }) {
    const colors = GRADE_COLORS[dept.grade] || GRADE_COLORS.C
    const { breakdown } = dept

    return (
        <Card className="hover:border-white/10">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-lg font-display font-semibold text-white tracking-tight">{dept.departmentName}</h3>
                    <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest mt-1">
                        {dept.totalExceptions} active exceptions Node
                    </p>
                </div>
                <ScoreRing score={dept.score} grade={dept.grade} />
            </div>

            <div className="space-y-1 divide-y divide-white/5 border-t border-white/5 mt-4">
                <FactorRow icon={AlertOctagon} label="Expired Exceptions"
                    detail={`${breakdown.expiredExceptions.count} items requiring review`}
                    penalty={breakdown.expiredExceptions.penalty} />
                <FactorRow icon={RefreshCw} label="Renewal Latency"
                    detail={`${breakdown.lateRenewals.count} cycles delayed`}
                    penalty={breakdown.lateRenewals.penalty} />
                <FactorRow icon={CheckSquare} label="Decision Quality"
                    detail={`${breakdown.approvalQuality.reworkCount} policy reworks`}
                    penalty={breakdown.approvalQuality.penalty} />
            </div>
        </Card>
    )
}

export function GovernanceScoreSummary({ score, grade }) {
    const colors = GRADE_COLORS[grade] || GRADE_COLORS.C
    const Icon = score >= 75 ? ShieldCheck : score >= 40 ? ShieldAlert : ShieldX

    return (
        <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} blur-[80px] -z-10 opacity-50`} />

            <div className="relative">
                <ScoreRing score={score} grade={grade} size={96} />
                <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center border-2 border-dark-card shadow-lg`}>
                    <Icon size={16} />
                </div>
            </div>

            <div className="flex-1 text-center md:text-left">
                <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-widest mb-1">Organization Governance Index</p>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <h2 className="text-4xl font-display font-bold text-white tracking-tighter">
                        System Score: {score}<span className="text-lg opacity-20 ml-1">/100</span>
                    </h2>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-widest ${colors.bg} ${colors.text} border-white/5`}>
                        Operational Grade: {grade}
                    </div>
                </div>
                <p className="mt-3 text-xs text-dark-text/40 font-medium max-w-lg">
                    Current governance posture is within <span className={colors.text}>{grade}</span> parameters.
                    {score < 70 ? ' Remediation recommended for expiring assets.' : ' System performing within nominal security tolerance.'}
                </p>
            </div>

            <Button variant="secondary" size="sm" className="hidden md:flex">Executive Summary</Button>
        </div>
    )
}