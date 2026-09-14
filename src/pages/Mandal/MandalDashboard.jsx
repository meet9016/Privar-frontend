import React, { useEffect, useState } from 'react'
import { Users, Calendar, TrendingUp, Clock, CheckCircle2, AlertCircle, Plus, IndianRupee, ArrowRight, ShieldCheck, Wallet } from 'lucide-react'
import api, { formatDate } from '../../lib/api'
import { MANDAL_ENDPOINTS } from '../../utils/endpoints'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import { getNextHaptaDate } from './MandalSetup'

export default function MandalDashboard({ mandalId, onNavigateTab }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get(MANDAL_ENDPOINTS.GET_DASHBOARD, { params: { mandal_id: mandalId } })
      .then(res => setData(res.data?.data || null))
      .catch(err => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [mandalId])

  if (loading) return <div className="py-12"><Loader size="lg" text="Loading Dashboard..." /></div>

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-2xl">
        <AlertCircle className="w-10 h-10 text-error-text mx-auto mb-3" />
        <p className="text-text font-semibold">{error || 'Could not load dashboard data'}</p>
        <Button variant="primary" onClick={() => window.location.reload()} className="mt-4">Retry</Button>
      </div>
    )
  }

  const { mandal, metrics, recent_payments = [] } = data
  const pct = metrics.month_expected > 0 ? Math.min(100, Math.round((metrics.month_collected / metrics.month_expected) * 100)) : 0
  const nextHapta = getNextHaptaDate(mandal.start_date)
  const nextHaptaStr = nextHapta ? formatDate(nextHapta) : null
  const mDay = mandal.start_date ? new Date(mandal.start_date).getDate() : 1

  return (
    <div className="space-y-4 animate-slide-up text-text">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-text">{mandal.name || 'Member Collection'}</h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              Active
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
            <span>
              Head: <strong className="text-text font-semibold">{mandal.mandal_head_name || 'Not assigned'}</strong>
            </span>
            <span>•</span>
            <span>
              Monthly Amount: <strong className="text-primary font-bold">₹{mandal.monthly_amount || 500}</strong> / member
            </span>
            <span>•</span>
            <span>
              Monthly Hapta: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{mDay}th of every month</strong>
            </span>
            {nextHaptaStr && (
              <>
                <span>•</span>
                <span>
                  Next Collection Date: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{nextHaptaStr}</strong>
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="primary" size="sm" onClick={() => onNavigateTab('contribution')} icon={<Plus className="w-4 h-4" />}>
            Contributions
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigateTab('members')} icon={<Users className="w-4 h-4" />}>
            Manage Members
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Members */}
        <div
          onClick={() => onNavigateTab('members')}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/40 cursor-pointer shadow-xs transition-all hover:shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Total Members</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">{metrics.total_members}</p>
            <p className="text-[11px] text-text-secondary mt-0.5 font-medium">Enrolled in Mandal</p>
          </div>
        </div>

        {/* Month Expected */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Month Expected</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">₹{Number(metrics.month_expected || 0).toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-text-secondary mt-0.5 font-medium">Month: {metrics.current_month}</p>
          </div>
        </div>

        {/* Month Collected */}
        <div className="p-4 rounded-2xl bg-card border border-emerald-500/20 bg-emerald-500/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">Month Collected</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                ₹{Number(metrics.month_collected || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{pct}%</span>
            </div>
            <div className="mt-2 w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Month Pending */}
        <div className="p-4 rounded-2xl bg-card border border-amber-500/20 bg-amber-500/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">Month Pending</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              ₹{Number(metrics.month_pending || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 font-medium">
              Due: {nextHaptaStr ? nextHaptaStr : `Every ${mandal.due_day || 10}th`}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Row: All-Time Collection Card + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* All-Time Collection Stats */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">All-Time Collection</span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-primary mt-2 tracking-tight">
              ₹{Number(metrics.total_collection || 0).toLocaleString('en-IN')}
            </p>
            <div className="mt-3 p-3 rounded-xl bg-surface-secondary/70 border border-border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-text-secondary">Enrolled Members:</span>
                <span className="font-bold text-text">{metrics.total_members}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Monthly Rate:</span>
                <span className="font-bold text-text">₹{mandal.monthly_amount || 500} / mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Hapta Deadline:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Every {mandal.due_day || 10}th</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => onNavigateTab('contribution')}
              className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View All Contributions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Payments (Takes 2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-text text-sm">Recent Payments</h4>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('contribution')}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              View Full History
            </button>
          </div>

          <div className="flex-1">
            {recent_payments.length === 0 ? (
              <div className="py-8 text-center text-text-secondary text-xs">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {recent_payments.slice(0, 4).map((p) => (
                  <div
                    key={String(p.id || p._id)}
                    className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between text-xs hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-text leading-tight">{p.member_name}</p>
                        <p className="text-text-secondary text-[11px] mt-0.5">
                          {p.month} • <span className="uppercase font-semibold">{p.payment_mode || 'Cash'}</span> • {formatDate(p.payment_date)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      +₹{Number(p.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

