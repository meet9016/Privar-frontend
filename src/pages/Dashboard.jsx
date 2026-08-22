import React, { useEffect, useState } from 'react'
import { Users, Briefcase, FileText, ArrowUpRight, Clock, Calendar, Eye, Activity, Shield, TrendingUp, Zap, Phone, Mail, Crown, UserPlus, FileEdit, Settings, CreditCard, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import Table from '../components/common/Table'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Select from '../components/common/Select'

/* ─── Premium Table Card ─────────────────────────────────── */
function TableCard({ title, routePath, data = [], columns }) {
  const navigate = useNavigate()
  
  return (
    <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h4 className="text-base font-bold text-text">{title}</h4>
        <button
          onClick={() => navigate(routePath)}
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          View all
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[250px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-secondary/20 text-text-secondary text-xs font-bold uppercase tracking-wider">
              {columns.map((col, i) => (
                <th key={i} className="px-5 py-3 border-b border-border">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-5 py-8 text-center text-sm text-text-secondary">No records found</td></tr>
            ) : data.map((row, i) => (
              <tr key={row._id || i} className="hover:bg-surface-secondary/10 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className="px-5 py-3.5 text-sm text-text">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Animated Stat Card ─────────────────────────────────── */
function StatCard({ title, value, growth, icon: Icon, colorClass, gradientClass, delay = 0 }) {
  const isPositive = growth >= 0;
  
  return (
    <div
      className="bg-white dark:bg-card border border-border rounded-xl p-5 shadow-sm flex items-start gap-4 transition-all duration-300 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${gradientClass} text-white shadow-sm flex-shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-secondary mb-1">{title}</p>
        <p className="text-3xl font-bold text-text leading-tight mb-2">{value}</p>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {growth !== undefined ? (
             <span className={`flex items-center ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
               <TrendingUp className={`w-3.5 h-3.5 mr-0.5 ${isPositive ? '' : 'rotate-180'}`} />
               {isPositive ? '+' : '-'}{Math.abs(growth)}%
             </span>
          ) : (
            <span className="text-text-secondary">—</span>
          )}
          <span className="text-text-secondary font-medium ml-1">vs last month</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Dashboard ──────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [membersFilter, setMembersFilter] = useState('last_6_months')
  const [activityFilter, setActivityFilter] = useState('last_6_months')
  const [businessFilter, setBusinessFilter] = useState('last_6_months')

  useEffect(() => {
    let mounted = true
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard', {
          params: { membersRange: membersFilter, activityRange: activityFilter, businessRange: businessFilter }
        })
        if (mounted) {
          setData(res.data?.data || res.data)
          setLoading(false)
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error)
        if (mounted) setLoading(false)
      }
    }
    fetchDashboard()
    return () => { mounted = false }
  }, [membersFilter, activityFilter, businessFilter])

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-8 w-48 bg-border/40 rounded-xl mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card border border-border rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="h-80 bg-card border border-border rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-center text-text-secondary">Failed to load dashboard</div>

  const { kpis, charts, tables, recentActivity, atAGlance, activitySummaryTotals } = data

  const statCards = [
    { title: 'Total Members', value: kpis?.users?.total || 0, growth: kpis?.users?.growth || 0, icon: Users, gradientClass: 'from-violet-500 to-indigo-500' },
    { title: 'Businesses', value: kpis?.businesses?.total || 0, growth: kpis?.businesses?.growth || 0, icon: Briefcase, gradientClass: 'from-emerald-400 to-teal-500' },
    { title: 'Posts', value: kpis?.posts?.total || 0, growth: kpis?.posts?.growth || 0, icon: FileText, gradientClass: 'from-blue-400 to-blue-500' },
    { title: 'Events', value: kpis?.events?.total || 0, growth: kpis?.events?.growth || 0, icon: Calendar, gradientClass: 'from-amber-400 to-orange-500' },
  ]

  const COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <div className="space-y-6 animate-slide-up text-text max-w-[1600px] mx-auto pb-10">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight mb-1">Dashboard</h2>
          <p className="text-sm text-text-secondary">Here's an overview of your community.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-sm font-semibold shadow-sm text-emerald-600 dark:text-emerald-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} delay={i * 50} />
        ))}
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Members Overview */}
        <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col h-[340px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2 z-10">
            <h4 className="text-sm font-bold text-text">Members Overview</h4>
            <div className="relative w-[130px]">
              <Select 
                value={membersFilter}
                onChange={setMembersFilter}
                searchable={false}
                options={[
                  { value: 'last_1_month', label: 'Last 1 Month' },
                  { value: 'last_3_months', label: 'Last 3 Months' },
                  { value: 'last_6_months', label: 'Last 6 Months' },
                  { value: 'this_year', label: 'This Year' }
                ]}
              />
            </div>
          </div>
          <div className="flex-1 -ml-6 z-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.members || []} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} ticks={[0, 6, 12, 18, 24]} domain={[0, 24]} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', fontSize: '12px' }} />
                <Line type="monotone" dataKey="members" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#fff', strokeWidth: 1.5, stroke: '#8b5cf6' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Businesses by Category */}
        <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-text">Businesses by Category</h4>
            <div className="relative w-[130px]">
              <Select 
                value={businessFilter}
                onChange={setBusinessFilter}
                searchable={false}
                options={[
                  { value: 'this_month', label: 'This Month' },
                  { value: 'last_1_month', label: 'Last 1 Month' },
                  { value: 'last_3_months', label: 'Last 3 Months' },
                  { value: 'last_6_months', label: 'Last 6 Months' },
                  { value: 'this_year', label: 'This Year' }
                ]}
              />
            </div>
          </div>
          <div className="h-[140px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.businessCategories || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {(charts?.businessCategories || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
              <span className="text-2xl font-bold text-text">{(charts?.businessCategories || []).reduce((a,b)=>a+b.value,0)}</span>
              <span className="text-[10px] text-text-secondary font-medium -mt-1">Total</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-auto pt-2">
            {(charts?.businessCategories || []).slice(0, 3).map((cat, i) => (
               <div key={i} className="flex items-center justify-between text-[11px]">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }} />
                   <span className="text-text font-medium truncate max-w-[140px]">{cat.name}</span>
                 </div>
                 <span className="text-text-secondary whitespace-nowrap">{cat.value} ({Math.round(cat.value/(charts?.businessCategories.reduce((a,b)=>a+b.value,0)||1)*100)}%)</span>
               </div>
            ))}
            {(charts?.businessCategories || []).length > 3 && (
               <div className="text-[11px] text-text-secondary font-bold  leading-none -mt-1">
                  + {(charts?.businessCategories || []).length - 3} more categories
               </div>
            )}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-text">Activity Summary</h4>
            <div className="relative w-[130px]">
              <Select 
                value={activityFilter}
                onChange={setActivityFilter}
                searchable={false}
                options={[
                  { value: 'last_1_month', label: 'Last 1 Month' },
                  { value: 'last_3_months', label: 'Last 3 Months' },
                  { value: 'last_6_months', label: 'Last 6 Months' },
                  { value: 'this_year', label: 'This Year' }
                ]}
              />
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3">
             {/* Mini Chart 1 - Total Posts (Purple) */}
             <div className="border border-border rounded-xl p-3 flex flex-col justify-between relative overflow-hidden bg-white">
                <div className="z-10">
                  <p className="text-[11px] text-violet-500 font-medium mb-1">Total Posts</p>
                  <p className="text-3xl font-semibold text-text">{activitySummaryTotals?.posts?.total || 0}</p>
                  <div className={`flex items-center mt-1 text-[9px] font-bold ${activitySummaryTotals?.posts?.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    <TrendingUp className={`w-2.5 h-2.5 mr-0.5 ${activitySummaryTotals?.posts?.growth >= 0 ? '' : 'rotate-180'}`} /> 
                    {activitySummaryTotals?.posts?.growth >= 0 ? '+' : '-'}{Math.abs(activitySummaryTotals?.posts?.growth || 0)}%
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 left-8 h-12 opacity-80 pointer-events-none z-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts?.activity || []} margin={{top:5, right:0, left:0, bottom:0}}>
                        <defs>
                          <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                       <Area type="monotone" dataKey="posts" stroke="#8b5cf6" fill="url(#colorPosts)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>
             
             {/* Mini Chart 2 - Total Events (Orange) */}
             <div className="border border-border rounded-xl p-3 flex flex-col justify-between relative overflow-hidden bg-white">
                <div className="z-10">
                  <p className="text-[11px] text-orange-500 font-medium mb-1">Total Events</p>
                  <p className="text-3xl font-semibold text-text">{activitySummaryTotals?.events?.total || 0}</p>
                  <div className={`flex items-center mt-1 text-[9px] font-bold ${activitySummaryTotals?.events?.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    <TrendingUp className={`w-2.5 h-2.5 mr-0.5 ${activitySummaryTotals?.events?.growth >= 0 ? '' : 'rotate-180'}`} /> 
                    {activitySummaryTotals?.events?.growth >= 0 ? '+' : '-'}{Math.abs(activitySummaryTotals?.events?.growth || 0)}%
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 left-8 h-12 opacity-80 pointer-events-none z-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts?.activity || []} margin={{top:5, right:0, left:0, bottom:0}}>
                        <defs>
                          <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                       <Area type="monotone" dataKey="events" stroke="#f97316" fill="url(#colorEvents)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Mini Chart 3 - New Members (Blue) */}
             <div className="border border-border rounded-xl p-3 flex flex-col justify-between relative overflow-hidden bg-white">
                <div className="z-10">
                  <p className="text-[11px] text-blue-500 font-medium mb-1">New Members</p>
                  <p className="text-3xl font-semibold text-text">{activitySummaryTotals?.members?.total || 0}</p>
                  <div className={`flex items-center mt-1 text-[9px] font-bold ${activitySummaryTotals?.members?.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    <TrendingUp className={`w-2.5 h-2.5 mr-0.5 ${activitySummaryTotals?.members?.growth >= 0 ? '' : 'rotate-180'}`} /> 
                    {activitySummaryTotals?.members?.growth >= 0 ? '+' : '-'}{Math.abs(activitySummaryTotals?.members?.growth || 0)}%
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 left-8 h-12 opacity-80 pointer-events-none z-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts?.activity || []} margin={{top:5, right:0, left:0, bottom:0}}>
                        <defs>
                          <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                       <Area type="monotone" dataKey="members" stroke="#3b82f6" fill="url(#colorMembers)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Mini Chart 4 - Active Businesses (Green) */}
             <div className="border border-border rounded-xl p-3 flex flex-col justify-between relative overflow-hidden bg-white">
                <div className="z-10">
                  <p className="text-[11px] text-emerald-600 font-medium mb-1">Active Businesses</p>
                  <p className="text-3xl font-semibold text-text">{activitySummaryTotals?.businesses?.total || 0}</p>
                  <div className={`flex items-center mt-1 text-[9px] font-bold ${activitySummaryTotals?.businesses?.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    <TrendingUp className={`w-2.5 h-2.5 mr-0.5 ${activitySummaryTotals?.businesses?.growth >= 0 ? '' : 'rotate-180'}`} /> 
                    {activitySummaryTotals?.businesses?.growth >= 0 ? '+' : '-'}{Math.abs(activitySummaryTotals?.businesses?.growth || 0)}%
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 left-8 h-12 opacity-80 pointer-events-none z-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts?.activity || []} margin={{top:5, right:0, left:0, bottom:0}}>
                        <defs>
                          <linearGradient id="colorBiz" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                       <Area type="monotone" dataKey="businesses" stroke="#10b981" fill="url(#colorBiz)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* ── Tables Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <TableCard title="Recent Members" data={tables?.recentMembers} routePath="/admin/users" columns={[
          { key: 'name', label: 'Name', render: (v, r) => (
            <div className="flex items-center gap-2">
               {r.image ? <img src={r.image} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center text-[10px] font-bold"><Users className="w-3 h-3"/></div>}
               <span className="font-semibold">{v}</span>
            </div>
          )},
          { key: 'email', label: 'Email', render: (v) => <span className="text-xs truncate max-w-[100px] block">{v||'-'}</span> },
          { key: 'status', label: 'Status', render: v => (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${v === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{v}</span>
          )},
        ]} />

        <TableCard title="Recent Events" data={tables?.recentEvents} routePath="/admin/events" columns={[
          { key: 'title', label: 'Event Name', render: (v, r) => (
            <div className="flex items-center gap-2">
               {r.image ? <img src={r.image} className="w-8 h-6 rounded object-cover" /> : <div className="w-8 h-6 rounded bg-orange-100 text-orange-600 flex items-center justify-center"><Calendar className="w-3 h-3"/></div>}
               <span className="font-semibold truncate max-w-[120px] block text-xs">{v}</span>
            </div>
          )},
          { key: 'date', label: 'Date', render: (v) => <span className="text-xs truncate block max-w-[90px]">{v ? new Date(v).toISOString().split('T')[0] : '-'}</span> },
          { key: 'status', label: 'Status', render: v => (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${v === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{v}</span>
          )},
        ]} />

        <TableCard title="Recent Posts" data={tables?.recentPosts} routePath="/admin/posts" columns={[
          { key: 'title', label: 'Title', render: (v, r) => (
             <div className="flex items-center gap-2">
               {r.image ? <img src={r.image} className="w-8 h-6 rounded object-cover" /> : <div className="w-8 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center"><FileText className="w-3 h-3"/></div>}
               <span className="font-semibold truncate max-w-[110px] block text-xs">{v}</span>
             </div>
          )},
          { key: 'date', label: 'Date', render: (v) => <span className="text-xs">{v ? new Date(v).toISOString().split('T')[0] : '-'}</span> },
          { key: 'status', label: 'Status', render: v => (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${v === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-secondary text-text-secondary'}`}>{v}</span>
          )},
        ]} />
      </div>

      {/* ── Bottom Section Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Recent Activity Timeline */}
        <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm flex flex-col h-96">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h4 className="text-sm font-bold text-text">Recent Activity</h4>
            <span className="text-xs text-primary font-semibold cursor-pointer">View all</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 pb-0">
              <div className="relative pl-3 border-l-2 border-border/60 pb-5 space-y-6">
                {(recentActivity || []).slice(0, 3).map((act, i) => (
                   <div key={i} className="relative">
                      <div className={`absolute -left-[22px] p-1.5 rounded-full border-[3px] border-card ${act.type === 'member' ? 'bg-violet-500' : act.type === 'business' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                         {act.type === 'member' ? <Users className="w-3 h-3 text-white"/> : act.type === 'business' ? <Briefcase className="w-3 h-3 text-white"/> : <FileText className="w-3 h-3 text-white"/>}
                      </div>
                      <div className="pl-4">
                         <p className="text-sm text-text font-medium leading-snug max-w-xs">{act.title}</p>
                         <p className="text-xs text-text-secondary mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(act.time).toLocaleString(undefined, {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'})}</p>
                      </div>
                   </div>
                ))}
                {(recentActivity || []).length > 3 && (
                   <div className="relative text-center mt-4 pt-4 border-t border-border/50">
                      <span className="text-xs font-semibold text-primary cursor-pointer hover:underline">... View all recent activity</span>
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm flex flex-col h-96">
          <div className="flex items-center px-5 py-4 border-b border-border">
            <h4 className="text-sm font-bold text-text">Quick Shortcuts</h4>
          </div>
          <div className="p-5 grid grid-cols-4 gap-4 flex-1 content-start">
             <div onClick={()=>navigate('/admin/users')} className="flex flex-col items-center justify-center p-3 border border-violet-100 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors cursor-pointer group text-center gap-2 h-[110px]">
                <div className="p-2 rounded-lg text-violet-600 group-hover:scale-110 transition-transform"><UserPlus className="w-6 h-6"/></div>
                <span className="text-[11px] font-bold text-violet-600 leading-tight">Add<br/>Member</span>
             </div>
             
             <div onClick={()=>navigate('/admin/businesses')} className="flex flex-col items-center justify-center p-3 border border-emerald-100 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer group text-center gap-2 h-[110px]">
                <div className="p-2 rounded-lg text-emerald-600 group-hover:scale-110 transition-transform"><Briefcase className="w-6 h-6"/></div>
                <span className="text-[11px] font-bold text-emerald-600 leading-tight">Add<br/>Business</span>
             </div>
             
             <div onClick={()=>navigate('/admin/posts')} className="flex flex-col items-center justify-center p-3 border border-blue-100 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer group text-center gap-2 h-[110px]">
                <div className="p-2 rounded-lg text-blue-600 group-hover:scale-110 transition-transform"><FileEdit className="w-6 h-6"/></div>
                <span className="text-[11px] font-bold text-blue-600 leading-tight">Create<br/>Post</span>
             </div>
             
             <div onClick={()=>navigate('/admin/events')} className="flex flex-col items-center justify-center p-3 border border-orange-100 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors cursor-pointer group text-center gap-2 h-[110px]">
                <div className="p-2 rounded-lg text-orange-500 group-hover:scale-110 transition-transform"><Calendar className="w-6 h-6"/></div>
                <span className="text-[11px] font-bold text-orange-500 leading-tight">Create<br/>Event</span>
             </div>
             
             <div onClick={()=>navigate('/admin/roles')} className="flex flex-col items-center justify-center p-3 border border-violet-100 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors cursor-pointer group text-center gap-2 h-[110px]">
                <div className="p-2 rounded-lg text-violet-600 group-hover:scale-110 transition-transform"><Shield className="w-6 h-6"/></div>
                <span className="text-[11px] font-bold text-violet-600 leading-tight">Manage<br/>Roles</span>
             </div>
             
             <div onClick={()=>navigate('/admin/reports')} className="flex flex-col items-center justify-center p-3 border border-blue-100 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer group text-center gap-2 h-[110px]">
                <div className="p-2 rounded-lg text-blue-600 group-hover:scale-110 transition-transform"><FileText className="w-6 h-6"/></div>
                <span className="text-[11px] font-bold text-blue-600 leading-tight">View<br/>Reports</span>
             </div>
             
             <div onClick={()=>navigate('/admin/users')} className="flex flex-col items-center justify-center p-3 border border-emerald-100 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer group text-center gap-2 h-[110px]">
                <div className="p-2 rounded-lg text-emerald-600 group-hover:scale-110 transition-transform"><Users className="w-6 h-6"/></div>
                <span className="text-[11px] font-bold text-emerald-600 leading-tight">Manage<br/>Users</span>
             </div>
             
             <div onClick={()=>navigate('/admin/settings')} className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-500/10 transition-colors cursor-pointer group text-center gap-2 h-[110px]">
                <div className="p-2 rounded-lg text-slate-700 dark:text-slate-400 group-hover:scale-110 transition-transform"><Settings className="w-6 h-6"/></div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 leading-tight">Settings</span>
             </div>
          </div>
        </div>

        {/* At a Glance */}
        <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm flex flex-col h-96">
          <div className="flex items-center px-5 py-4 border-b border-border">
            <h4 className="text-sm font-bold text-text">At a Glance</h4>
          </div>
          <div className="p-5 flex flex-col gap-4">
             <div className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-secondary/50 transition-colors cursor-pointer">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600"><Users className="w-4 h-4"/></div>
                 <div>
                   <p className="text-sm font-bold text-text">Active Members</p>
                   <p className="text-xs text-text-secondary">Last 30 days</p>
                 </div>
               </div>
               <span className="text-lg font-black">{atAGlance?.activeMembers || 0}</span>
             </div>
             
             <div className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-secondary/50 transition-colors cursor-pointer">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"><Briefcase className="w-4 h-4"/></div>
                 <div>
                   <p className="text-sm font-bold text-text">Active Businesses</p>
                   <p className="text-xs text-text-secondary">Last 30 days</p>
                 </div>
               </div>
               <span className="text-lg font-black">{atAGlance?.activeBusinesses || 0}</span>
             </div>
             
             <div className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-secondary/50 transition-colors cursor-pointer">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600"><FileText className="w-4 h-4"/></div>
                 <div>
                   <p className="text-sm font-bold text-text">Posts This Month</p>
                   <p className="text-xs text-text-secondary">This month</p>
                 </div>
               </div>
               <span className="text-lg font-black">{atAGlance?.postsThisMonth || 0}</span>
             </div>
             
             <div className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-secondary/50 transition-colors cursor-pointer">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600"><Calendar className="w-4 h-4"/></div>
                 <div>
                   <p className="text-sm font-bold text-text">Upcoming Events</p>
                   <p className="text-xs text-text-secondary">Next 30 days</p>
                 </div>
               </div>
               <span className="text-lg font-black">{atAGlance?.upcomingEvents || 0}</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}
