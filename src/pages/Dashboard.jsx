import React, { useEffect, useState } from 'react'
import { Users, Briefcase, FileText, ArrowUpRight, Clock, Calendar, Eye, Activity, Shield, TrendingUp, Zap } from 'lucide-react'
import api from '../lib/api'
import Table from '../components/common/Table'
import { useNavigate } from 'react-router-dom'

/* ─── Premium Table Card ─────────────────────────────────── */
function TableCard({ title, routePath, data = [], columns, accent = 'from-primary to-primary/60' }) {
  const navigate = useNavigate()
  const total = data.length

  return (
    <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-glass-md flex flex-col h-full group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glass-lg hover:border-primary/20">
      {/* Accent bar top */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent} opacity-60 group-hover:opacity-100 transition-opacity`} />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-border bg-surface-secondary/20">
        <div className="flex items-center gap-2.5">
          <div className={`w-1.5 h-5 rounded-full bg-gradient-to-b ${accent}`} />
          <h4 className="text-sm font-bold text-text">{title}</h4>
          <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
            {total}
          </span>
        </div>
        <button
          onClick={() => navigate(routePath)}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-white bg-primary/10 hover:bg-primary border border-primary/20 hover:border-primary px-3 py-1.5 rounded-xl transition-all duration-200"
        >
          View all
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <Table
        className="border-none rounded-none shadow-none flex-1"
        maxHeightClass="max-h-[280px] overflow-y-auto"
        stickyHeader={true}
        columns={columns.map(col => ({
          header: col.label,
          key: col.key,
          render: col.render
            ? (row) => col.render(row[col.key], row)
            : col.key === 'image' || col.key === 'student_image'
              ? (row) => row[col.key]
                ? <img src={row[col.key]} alt="" className="w-9 h-9 rounded-lg object-cover border border-border" />
                : <div className="w-9 h-9 rounded-lg bg-surface-secondary border border-border" />
              : (row) => <span className="whitespace-nowrap max-w-[180px] truncate block" title={row[col.key]}>{row[col.key] ?? '—'}</span>
        }))}
        data={data}
        keyField={(row) => row._id ?? row.id}
        emptyState={{ title: 'No records found', description: '' }}
      />
    </div>
  )
}

/* ─── Animated Stat Card ─────────────────────────────────── */
function StatCard({ title, value, icon: Icon, gradient, glowClass, delay = 0 }) {
  return (
    <div
      className={`relative overflow-hidden group bg-card border border-border rounded-2xl p-5 transition-all duration-300 hover:shadow-glass-lg hover:-translate-y-1 cursor-default`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background gradient blob */}
      <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500 blur-xl`} />
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient} opacity-40 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">{title}</p>
          <p className="text-4xl font-black text-text tracking-tight leading-none">{value}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-text-secondary font-medium">records</span>
          </div>
        </div>
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} ${glowClass} text-white shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

/* ─── Dashboard ──────────────────────────────────────────── */
export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, businesses: 0, posts: 0, events: 0 })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableData, setTableData] = useState({
    users: [], businesses: [], posts: [], committee: [],
    festivals: [], events: [], students: [], donations: [],
    news: [], jobs: [], familyHeads: []
  })

  useEffect(() => {
    let mounted = true

    const fetchDashboard = async () => {
      try {
        const [statsRes, usersRes, businessesRes, postsRes, allUsersRes] = await Promise.all([
          api.get('/stats'),
          api.get('/users?limit=5'),
          api.get('/businesses?limit=5'),
          api.get('/posts?limit=5'),
          api.get('/users?limit=200')
        ])

        if (!mounted) return

        const statsData = statsRes.data?.data || statsRes.data || { users: 0, businesses: 0, posts: 0, events: 0 }
        const users = usersRes.data?.data || usersRes.data || []
        const businesses = businessesRes.data?.data || businessesRes.data || []
        const posts = postsRes.data?.data || postsRes.data || []
        const allUsers = allUsersRes.data?.data || allUsersRes.data || []
        const familyHeads = allUsers.filter(u => u.relation === 'Self')

        setStats(statsData)
        setTableData(prev => ({ ...prev, users, businesses, posts, familyHeads }))
        setRecentActivities([
          ...users.slice(0, 2).map(user => ({
            id: `member-${user._id}`,
            icon: Users,
            text: `${user.name || 'A member'} joined the family directory`,
            time: 'Recent',
            date: user.phone || user.email || 'Member registry',
            color: 'text-blue-500 bg-blue-500/10'
          })),
          ...businesses.slice(0, 1).map(business => ({
            id: `business-${business._id}`,
            icon: Briefcase,
            text: `${business.business_name || 'A business'} listed in directory`,
            time: Number(business.status) === 1 ? 'Active' : 'Inactive',
            date: business.number || 'Business directory',
            color: 'text-emerald-500 bg-emerald-500/10'
          })),
          ...posts.slice(0, 1).map(post => ({
            id: `post-${post._id}`,
            icon: FileText,
            text: `${post.title || 'A post'} published on community board`,
            time: 'Published',
            date: post.cdate || 'Posts board',
            color: 'text-violet-500 bg-violet-500/10'
          }))
        ])
      } catch (error) {
        if (mounted) setRecentActivities([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDashboard()
    return () => { mounted = false }
  }, [])

  const statCards = [
    { title: 'Total Members', value: stats.users, icon: Users, gradient: 'from-indigo-500 to-blue-600', glowClass: 'shadow-glow-primary' },
    { title: 'Businesses', value: stats.businesses, icon: Briefcase, gradient: 'from-emerald-500 to-teal-600', glowClass: 'shadow-glow-success' },
    { title: 'Posts', value: stats.posts, icon: FileText, gradient: 'from-violet-500 to-fuchsia-600', glowClass: 'shadow-glow-primary' },
    { title: 'Events', value: stats.events || 0, icon: Zap, gradient: 'from-amber-500 to-orange-500', glowClass: 'shadow-glow-success' },
  ]

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-border/40 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card border border-border rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-card border border-border rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7 animate-slide-up text-text">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-primary to-primary/40" />
            <h2 className="text-2xl font-black text-text tracking-tight">Dashboard</h2>
          </div>
          <p className="text-sm text-text-secondary ml-4">Welcome back — here's your community at a glance.</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text font-medium shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Clock className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-text-secondary">Live</span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} delay={i * 60} />
        ))}
      </div>

      {/* ── Tables Section ── */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-base font-bold text-text">Recent Records</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <TableCard title="Family Members" data={tableData.users} routePath="/admin/users" accent="from-blue-500 to-indigo-500" columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'number', label: 'Number' },
            { key: 'status', label: 'Status', render: v => (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${Number(v) === 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                {Number(v) === 1 ? 'Approved' : 'Pending'}
              </span>
            )},
          ]} />

          <TableCard title="Business Directory" data={tableData.businesses} routePath="/admin/businesses" accent="from-emerald-500 to-teal-500" columns={[
            { key: 'image', label: 'Logo' },
            { key: 'business_name', label: 'Name' },
            { key: 'business_category_name', label: 'Category' },
            { key: 'status', label: 'Status', render: v => (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${Number(v) === 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                {Number(v) === 1 ? 'Active' : 'Pending'}
              </span>
            )},
          ]} />

          <TableCard title="Posts" data={tableData.posts} routePath="/admin/posts" accent="from-violet-500 to-fuchsia-500" columns={[
            { key: 'image', label: 'Image' },
            { key: 'title', label: 'Title' },
            { key: 'cdate', label: 'Date' },
            { key: 'status', label: 'Status', render: v => (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${Number(v) === 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                {Number(v) === 1 ? 'Published' : 'Draft'}
              </span>
            )},
          ]} />

          <TableCard title="Family Heads" data={tableData.familyHeads} routePath="/admin/users" accent="from-amber-500 to-orange-500" columns={[
            { key: 'name', label: 'Name', render: (v, row) => row.name || `${row.first_name || ''} ${row.last_name || ''}` },
            { key: 'phone', label: 'Phone', render: (v, row) => row.phone || row.number || '-' },
            { key: 'email', label: 'Email' },
            { key: 'status', label: 'Status', render: v => (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${Number(v) === 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-surface-secondary text-text-secondary'}`}>
                {Number(v) === 1 ? 'Active' : 'Inactive'}
              </span>
            )},
          ]} />
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-glass-md">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-surface-secondary/20">
          <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-primary to-primary/40" />
          <h3 className="text-sm font-bold text-text">Recent Activity</h3>
          <span className="text-xs text-text-secondary bg-surface-secondary border border-border px-2 py-0.5 rounded-full">Audit log</span>
        </div>
        <div className="p-6 space-y-4">
          {recentActivities.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-sm text-text-secondary border border-dashed border-border rounded-xl">
              No recent activity yet
            </div>
          ) : recentActivities.map((act, idx) => {
            const Icon = act.icon
            return (
              <div key={act.id} className="flex items-start gap-4 group">
                <div className={`p-2 rounded-xl ${act.color} flex-shrink-0 mt-0.5`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text leading-snug">{act.text}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>{act.time}</span>
                    <span>·</span>
                    <span className="truncate">{act.date}</span>
                  </div>
                </div>
                {idx < recentActivities.length - 1 && (
                  <div className="absolute left-[52px] mt-10 w-px h-4 bg-border" />
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

