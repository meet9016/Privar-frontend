import React, { useEffect, useState } from 'react'
import { Users, Briefcase, FileText, Shield,  Calendar, Clock, Plus ,Eye } from 'lucide-react'
import api from '../lib/api'


import { useNavigate } from 'react-router-dom'

function TableCard({ title, routePath,data = [],columns }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1)
  const PER_PAGE = 10
  const total = data.length
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  const rows = data.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-glass-md">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-text">{title}</h4>
          <span className="text-xs text-text-secondary bg-surface-secondary border border-border px-2.5 py-1 rounded-full font-medium">
            {total}
          </span>
        </div>
        <button onClick={()=>navigate(routePath)} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-2 py-1 rounded-xl text-sm  transition-all shadow-glow-primary">

          View
          <Eye className="w-4 text-white" />
        </button>
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="bg-surface-secondary border-b border-border">
              {columns.map(col => (
                <th key={col.key} className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-text-secondary">
                  No records found
                </td>
              </tr>
            ) : rows.map((row, i) => (
              <tr key={row._id ?? row.id ?? i} className="hover:bg-surface-secondary/50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className={`px-2 py-2 text-text align-middle ${col.render || col.key === 'image' ? '' : 'whitespace-nowrap max-w-[220px] truncate'}`}>
                    {col.render
                      ? col.render(row[col.key], row)
                      : col.key === 'image' || col.key === 'student_image'
                        ? row[col.key]
                          ? <img src={row[col.key]} alt="" className="w-9 h-9 rounded-lg object-cover border border-border" />
                          : <div className="w-12 h-12 rounded-lg bg-surface-secondary border border-border" />
                        : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-secondary/40 text-xs text-text-secondary">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-surface-secondary disabled:opacity-40 transition-colors font-medium"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-surface-secondary disabled:opacity-40 transition-colors font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, businesses: 0, posts: 0, events: 0 })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableData, setTableData] = useState({
    users: [], businesses: [], posts: [], committee: [],
    festivals: [], events: [], students: [], donations: [],
    news: [], jobs: []
  })

  useEffect(() => {
    let mounted = true

    const fetchDashboard = async () => {
      try {
        const [statsRes, usersRes, businessesRes, postsRes] = await Promise.all([
          api.get('/stats'),
          api.get('/users?limit=5'),
          api.get('/businesses?limit=5'),
          api.get('/posts?limit=5')
        ])

        if (!mounted) return

        const statsData = statsRes.data?.data || statsRes.data || { users: 0, businesses: 0, posts: 0, events: 0 }
        const users = usersRes.data?.data || usersRes.data || []
        const businesses = businessesRes.data?.data || businessesRes.data || []
        const posts = postsRes.data?.data || postsRes.data || []

        setStats(statsData)
        setTableData(prev => ({ ...prev, users, businesses, posts }))
        setRecentActivities([
          ...users.slice(0, 2).map(user => ({
            id: `member-${user._id}`,
            text: `${user.name || 'A member'} is registered in the family directory`,
            time: 'Recent',
            date: user.phone || user.email || 'Member registry'
          })),
          ...businesses.slice(0, 1).map(business => ({
            id: `business-${business._id}`,
            text: `${business.business_name || 'A business'} is listed in the business directory`,
            time: Number(business.status) === 1 ? 'Active' : 'Inactive',
            date: business.number || 'Business directory'
          })),
          ...posts.slice(0, 1).map(post => ({
            id: `post-${post._id}`,
            text: `${post.title || 'A post'} is visible on the community board`,
            time: 'Published',
            date: post.cdate || 'Posts board'
          }))
        ])
      } catch (error) {
        if (mounted) setRecentActivities([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDashboard()

    return () => {
      mounted = false
    }
  }, [])

  const statCards = [
    {
      title: 'Total Members',
      value: stats.users,
      icon: Users,
      color: 'from-indigo-500 to-blue-600',
      shadow: 'shadow-glow-primary',
      sparkColor: 'var(--color-primary)'
    },
    {
      title: 'Business Directories',
      value: stats.businesses,
      icon: Briefcase,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-glow-success',
      sparkColor: 'var(--color-success)'
    },
    {
      title: 'Posts',
      value: stats.posts,
      icon: FileText,
      color: 'from-violet-500 to-fuchsia-600',
      shadow: 'shadow-glow-primary',
      sparkColor: 'var(--color-info)'
    },
    {
      title: 'Events',
      value: stats.events,
      icon: Shield,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-glow-success',
      sparkColor: 'var(--color-warning)'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-border/40 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-card border border-border rounded-2xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-card border border-border rounded-2xl animate-pulse"></div>
          <div className="h-96 bg-card border border-border rounded-2xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-slide-up text-text">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text tracking-tight">Dashboard</h2>

        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-secondary border border-border text-sm text-text font-medium shadow-sm">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>Last Sync: Just now</span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={i}
              className="relative overflow-hidden group bg-card border border-border hover:border-text-secondary/20 rounded-2xl p-6 transition-all duration-300 hover:shadow-glass-md hover:-translate-y-0.5"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-secondary tracking-wider  group-hover:text-text transition-colors">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${card.color} ${card.shadow} text-white transition-transform duration-300 group-hover:scale-105`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Stat Value */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-text tracking-tight">
                  {card.value}
                </span>
                <span className="text-sm font-semibold text-text-secondary">records</span>
              </div>


              {/* Overlay glow strip */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} opacity-30 group-hover:opacity-100 transition-opacity duration-300`}></div>
            </div>
          )
        })}
      </div>

      {/* Activity Section */}

      {/* ── Data Tables ─────────────────────────────────────────── */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-text tracking-tight">Recent Records</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Users */}
          <TableCard title="Family Members" data={tableData.users} routePath={'/admin/users'} columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'number', label: 'Number' },
            {
              key: 'status', label: 'Status', render: v => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${Number(v) === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-600'}`}>
                  {Number(v) === 1 ? 'Approved' : 'Pending'}
                </span>
              )
            },
          ]} />

          {/* Businesses */}
          <TableCard title="Business Directory" routePath={'/admin/businesses'} data={tableData.businesses} columns={[
            { key: 'image', label: 'Image' },
            { key: 'business_name', label: 'Name' },
            { key: 'business_category_name', label: 'Category' },
            { key: 'number', label: 'Contact' },
            {
              key: 'status', label: 'Status', render: v => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${Number(v) === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-600'}`}>
                  {Number(v) === 1 ? 'Approved' : 'Pending'}
                </span>
              )
            },
          ]} />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Posts */}
          <TableCard title="Posts" data={tableData.posts} routePath={'/admin/posts'} columns={[
            { key: 'image', label: 'Image' },
            { key: 'title', label: 'Title' },
            { key: 'cdate', label: 'Date' },
            {
              key: 'status', label: 'Status', render: v => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${Number(v) === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-600'}`}>
                  {Number(v) === 1 ? 'Approved' : 'Pending'}
                </span>
              )
            },
          ]} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 ">


        {/* Recent activities section */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-glass-md flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text tracking-wide flex items-center gap-2">
              Recent Activity
            </h3>
            <p className="text-sm text-text-secondary">System actions audit logs</p>
          </div>

          <div className="flex-1 space-y-5">
            {recentActivities.length === 0 ? (
              <div className="h-full min-h-40 flex items-center justify-center text-center text-sm text-text-secondary border border-dashed border-border rounded-2xl">
                No recent records available yet
              </div>
            ) : recentActivities.map((act) => (
              <div key={act.id} className="flex gap-3 text-sm leading-relaxed group">
                {/* Visual line bullet */}
                <div className="flex flex-col items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface group-hover:scale-110 transition-transform shadow-glow-primary"></span>
                  <span className="w-px h-full bg-border mt-2 group-last:hidden"></span>
                </div>
                {/* Text content */}
                <div className="flex-1 pb-1">
                  <p className="text-text font-medium transition-colors">
                    {act.text}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{act.time}</span>
                    <span>•</span>
                    <Calendar className="w-3 h-3" />
                    <span>{act.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
