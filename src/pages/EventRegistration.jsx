import React, { useCallback, useEffect, useState } from 'react'
import { Eye, RefreshCw, Search, X ,Download} from 'lucide-react'
import api, { getEventsList } from '../lib/api'
import Modal from '../components/Modal'

const limit = 10


export default function EventRegistrations() {
    const [rows, setRows] = useState([])
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit })
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
    }, [page, search, filterEventId])

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
        <div className="space-y-6 animate-slide-up select-none text-text">
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

            {error && <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-2xl text-sm">{error}</div>}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
                    <span className="text-text-secondary text-sm">Loading registrations...</span>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-glass-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-surface-secondary text-text-secondary text-sm font-semibold tracking-wider">
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Number</th>
                                    <th className="p-4">Event</th>
                                    <th className="p-4">Attendees</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {rows.map((row) => (
                                    <tr key={row._id || row.id} className="hover:bg-surface-secondary/40 text-sm text-text">
                                        <td className="p-4 font-semibold">{row.name || '-'}</td>
                                        <td className="p-4 text-text-secondary">{row.email || '-'}</td>
                                        <td className="p-4 text-text-secondary">{row.number || '-'}</td>
                                        <td className="p-4">{row.event_name || '-'}</td>
                                        <td className="p-4">{row.total_attendee ?? 1}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                        ${row.status === 'confirmed' ? 'bg-success-bg text-success-text border border-success-border' : ''}
                        ${row.status === 'cancelled' ? 'bg-error-bg text-error-text border border-error-border' : ''}
                        ${row.status === 'waitlisted' ? 'bg-warning-bg text-warning-text border border-warning-border' : ''}
                      `}>
                                                {row.status || 'confirmed'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setSelectedReg(row)}
                                                className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl"
                                                title="View"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-sm text-text-secondary">No registrations found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border bg-surface-secondary/40 text-sm">
                            <span className="text-text-secondary">
                                Page {pagination.page} of {pagination.totalPages} {pagination.total ? `(${pagination.total} total)` : ''}
                            </span>
                            <div className="flex items-center gap-2">
                                <button type="button" disabled={loading || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                                {pageNumbers.map((item) => (
                                    <button
                                        key={item} type="button"
                                        disabled={loading || item === currentPage}
                                        onClick={() => setPage(item)}
                                        className={`min-w-10 px-3 py-2 rounded-lg border transition-all ${item === currentPage ? 'border-primary bg-primary/10 text-primary font-semibold disabled:opacity-100 disabled:cursor-default' : 'border-border bg-card text-text hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed'}`}
                                    >{item}</button>
                                ))}
                                <button type="button" disabled={loading || page >= pagination.totalPages} onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                            </div>
                        </div>
                    )}
                </div>
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