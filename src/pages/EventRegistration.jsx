import React, { useCallback, useEffect, useState } from 'react'
import { Eye, RefreshCw, Search, Download, Ticket } from 'lucide-react'
import api, { getEventsList } from '../lib/api'
import Modal from '../components/Modal'
import Loader from '../components/common/Loader'
import Table from '../components/common/Table'
import { toast } from '../lib/toast'

export default function EventRegistrations() {
    const [rows, setRows] = useState([])
    const [limit, setLimit] = useState(10)
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 })
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [search, setSearchValue] = useState('')
    const [error, setError] = useState('')
    const [selectedReg, setSelectedReg] = useState(null)
    const [events, setEvents] = useState([])
    const [filterEventId, setFilterEventId] = useState('')

    const totalPages = Math.max(Number(pagination.totalPages) || 1, 1)
    const currentPage = Math.min(Math.max(Number(pagination.page) || page || 1, 1), totalPages)
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

    const setSearch = (value) => { setSearchValue(value); setPage(1) }
    const setFilterEvent = (value) => { setFilterEventId(value); setPage(1) }

    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const eventId = params.get('event_id')
        if (eventId) setFilterEventId(eventId)
        setInitialized(true)
    }, [])

    const fetchEvents = useCallback(async () => {
        try {
            const res = await getEventsList({ limit: 100 })
            setEvents(res.data?.data || res.data || [])
        } catch { setEvents([]) }
    }, [])

    const fetchRows = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const params = { page, limit, search }
            if (filterEventId) params.event_id = filterEventId
            const res = await api.get('/event-registrations', { params })
            const data = res.data?.data || []
            const pg = res.data?.pagination || {}
            setRows(Array.isArray(data) ? data : [])
            setPagination({
                page: Number(pg.page || page),
                totalPages: Number(pg.totalPages || pg.total_pages || 1),
                total: Number(pg.total || 0),
                limit: Number(pg.limit || limit)
            })
        } catch (err) {
            setRows([])
            setError(err.response?.data?.message || 'Failed to load registrations')
        } finally {
            setLoading(false)
        }
    }, [page, search, filterEventId, limit])

    useEffect(() => { fetchEvents() }, [fetchEvents])
    useEffect(() => { fetchRows() }, [fetchRows])
    useEffect(() => {
        if (!initialized) return
        fetchRows()
    }, [fetchRows, initialized])

const handleDownload = async () => {
  try {
    const params = new URLSearchParams({ search })
    if (filterEventId) params.append('event_id', filterEventId)
    const res = await api.get(`/event-registrations/download?${params.toString()}`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'event-registrations.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  } catch {
    setError('Failed to download registrations')
  }
}

    return (
        <div className="space-y-6 animate-slide-up text-text">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold text-text">Event Registrations</h2>
                <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                    <button onClick={fetchRows} className="p-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-text-secondary hover:text-text transition-all" title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    {/* Event filter */}
                    <select
                        value={filterEventId}
                        onChange={(e) => setFilterEvent(e.target.value)}
                        className="bg-input-bg text-text border border-border rounded-xl py-2.5 px-3 text-sm outline-none focus:border-primary/50 sm:w-48"
                    >
                        {events.map((ev) => (
                            <option key={ev._id || ev.id} value={ev._id || ev.id}>
                                {ev.event_name || ev.title}
                            </option>
                        ))}
                    </select>
                    {/* Search */}
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-text-secondary/60" />
                        <input
                            type="search"
                            placeholder="Search registrations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50"
                        />
                    </div>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-surface-secondary hover:bg-surface border border-border text-text px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        title="Export to CSV"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>



            {loading && rows.length === 0 ? (
                <div className="py-20"><Loader text="Loading registrations..." /></div>
            ) : (
                <Table
                    columns={[
                        {
                            header: 'Name',
                            key: 'name',
                            render: (row) => <span className="font-semibold">{row.name || '-'}</span>
                        },
                        {
                            header: 'Email',
                            key: 'email',
                            render: (row) => <span className="text-text-secondary">{row.email || '-'}</span>
                        },
                        {
                            header: 'Number',
                            key: 'number',
                            render: (row) => <span className="text-text-secondary">{row.number || '-'}</span>
                        },
                        {
                            header: 'Event',
                            key: 'event',
                            render: (row) => row.event_name || '-'
                        },
                        {
                            header: 'Attendees',
                            key: 'attendees',
                            render: (row) => row.total_attendee ?? 1
                        },
                        {
                            header: 'Status',
                            key: 'status',
                            render: (row) => (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                                    ${row.status === 'confirmed' ? 'bg-success-bg text-success-text border border-success-border' : ''}
                                    ${row.status === 'cancelled' ? 'bg-error-bg text-error-text border border-error-border' : ''}
                                    ${row.status === 'waitlisted' ? 'bg-warning-bg text-warning-text border border-warning-border' : ''}
                                `}>
                                    {row.status || 'confirmed'}
                                </span>
                            )
                        },
                        {
                            header: 'Actions',
                            key: 'actions',
                            align: 'right',
                            render: (row) => (
                                <button
                                    onClick={() => setSelectedReg(row)}
                                    className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all"
                                    title="View"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                </button>
                            )
                        }
                    ]}
                    data={rows}
                    keyField={(row) => row._id || row.id}
                    loading={loading}
                    emptyState={{
                        icon: Ticket,
                        title: 'No registrations found',
                        description: 'There are no event registrations matching your criteria'
                    }}
                    pagination={{
                        currentPage: page,
                        totalPages: pagination.totalPages,
                        total: pagination.total,
                        pageNumbers,
                        loading,
                        onPageChange: setPage,
                        limit,
                        onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1); }
                    }}
                />
            )}

            {/* View Modal */}
            <Modal isOpen={!!selectedReg} title="Registration Details" onClose={() => setSelectedReg(null)}>
                {selectedReg && (
                    <div className="space-y-4 text-sm text-text">
                        {[
                            ['Name', selectedReg.name],
                            ['Email', selectedReg.email],
                            ['Phone', selectedReg.number],
                            ['Event', selectedReg.event_name],
                            ['Entry Type', selectedReg.entry_type],
                            ['Total Attendees', selectedReg.total_attendee],
                            ['Status', selectedReg.status],
                            ['Registered By (User)', selectedReg.user?.name || 'Guest'],
                            ['Registered On', selectedReg.createdAt ? new Date(selectedReg.createdAt).toLocaleString('en-IN') : '-'],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                                <span className="font-semibold text-text-secondary">{label}</span>
                                <span className="text-right">{value || '-'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    )
}