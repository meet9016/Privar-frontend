import React, { useEffect, useState } from 'react'
import { Users, Calendar, TrendingUp, Clock, CheckCircle2, AlertCircle, Plus, IndianRupee, ArrowRight } from 'lucide-react'
import api, { formatDate } from '../../lib/api'
import { MANDAL_ENDPOINTS } from '../../utils/endpoints'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'

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

  return (
    <div className="space-y-4 animate-slide-up text-text">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-text">{mandal.name || 'Member Collection'}</h3>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Head: <span className="font-semibold text-text">{mandal.mandal_head_name || 'Not assigned'}</span>
            {' • '}Monthly Amount: <span className="font-semibold text-primary">₹{mandal.monthly_amount || 500} / member</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => onNavigateTab('contribution')} icon={<Plus className="w-4 h-4" />}>
            Monthly Contributions
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigateTab('members')} icon={<Users className="w-4 h-4" />}>
            Manage Members
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div onClick={() => onNavigateTab('members')} className="p-4 rounded-2xl bg-card border border-border hover:border-primary/40 cursor-pointer shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-semibold">Total Members</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text">{metrics.total_members}</p>
          <p className="text-xs text-text-secondary mt-1">Enrolled in Mandal</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-semibold">Month Expected</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text">₹{Number(metrics.month_expected || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-text-secondary mt-1">{metrics.current_month}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold">Month Collected</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{Number(metrics.month_collected || 0).toLocaleString('en-IN')}</p>
          <div className="mt-2 w-full bg-surface rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">{pct}% collected</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-700 dark:text-amber-400 text-xs font-semibold">Month Pending</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">₹{Number(metrics.month_pending || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 font-semibold mt-1">Pending this month</p>
        </div>
      </div>

      {/* All-time Summary + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Collection Stats */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-semibold text-text-secondary">All-Time Collection</span>
            <p className="text-2xl font-bold text-primary mt-1">₹{Number(metrics.total_collection || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={() => onNavigateTab('contribution')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              <span>View Monthly Contributions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Payments (Takes 2 cols) */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-text text-sm">Recent Payments</h4>
            </div>
            <button onClick={() => onNavigateTab('contribution')} className="text-xs font-semibold text-primary hover:underline cursor-pointer">
              View All
            </button>
          </div>
          {recent_payments.length === 0 ? (
            <p className="py-6 text-center text-text-secondary text-xs">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {recent_payments.slice(0, 4).map((p) => (
                <div key={String(p.id || p._id)} className="p-2.5 rounded-xl bg-surface border border-border flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-text">{p.member_name}</p>
                    <p className="text-text-secondary text-[11px]">{p.month} • {p.payment_mode || 'Cash'} • {formatDate(p.payment_date)}</p>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+₹{Number(p.amount || 0).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
