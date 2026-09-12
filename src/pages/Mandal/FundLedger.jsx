import React, { useCallback, useEffect, useState } from 'react'
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  FileText,
  Calendar,
  IndianRupee,
  RefreshCw
} from 'lucide-react'
import api, { formatDate } from '../../lib/api'
import { MANDAL_ENDPOINTS } from '../../utils/endpoints'
import Table from '../../components/common/Table'
import Select from '../../components/common/Select'
import DatePicker from '../../components/DatePicker'
import Button from '../../components/common/Button'
import usePagination from '../../hooks/usePagination'
import { toast } from '../../lib/toast'

export default function FundLedger() {
  const [entries, setEntries] = useState([])
  const [summary, setSummary] = useState(null)
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams } = usePagination(15)
  const [loading, setLoading] = useState(false)

  const [typeFilter, setTypeFilter] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchLedger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(MANDAL_ENDPOINTS.GET_LEDGER, {
        params: getParams({
          type: typeFilter,
          start_date: startDate,
          end_date: endDate
        })
      })
      const data = res.data?.data?.data || []
      const sum = res.data?.data?.summary || null
      const pg = res.data?.data?.pagination || {}

      setEntries(data)
      setSummary(sum)
      setPaginationData(pg)
    } catch {
      toast.error('Failed to load fund ledger')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [typeFilter, startDate, endDate, page, limit, getParams, setPaginationData])

  useEffect(() => {
    fetchLedger()
  }, [fetchLedger])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4 animate-slide-up text-text">
      {/* Unified Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-40">
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { label: 'All Transactions', value: 'All' },
                { label: 'Inflows Only (+)', value: 'Inflow' },
                { label: 'Outflows Only (-)', value: 'Outflow' }
              ]}
            />
          </div>

          <div className="w-36">
            <DatePicker
              mode="date"
              value={startDate}
              onChange={(val) => setStartDate(val || '')}
              placeholder="From Date"
              className="w-full bg-input-bg text-text border border-border hover:border-primary/40 focus:border-primary rounded-xl py-2 px-3 text-sm outline-none shadow-xs"
            />
          </div>

          <div className="w-36">
            <DatePicker
              mode="date"
              value={endDate}
              onChange={(val) => setEndDate(val || '')}
              placeholder="To Date"
              className="w-full bg-input-bg text-text border border-border hover:border-primary/40 focus:border-primary rounded-xl py-2 px-3 text-sm outline-none shadow-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
          >
            Print
          </Button>
          <button
            type="button"
            onClick={fetchLedger}
            className="p-2.5 rounded-xl border border-border bg-input-bg hover:bg-surface-secondary text-text-secondary hover:text-text transition-colors cursor-pointer shadow-xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400">Total Inflow (Collections)</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                +₹{Number(summary.total_inflow || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-rose-700 dark:text-rose-400">Total Outflow (Expenses)</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                -₹{Number(summary.total_outflow || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-primary">Net Running Balance</p>
              <p className={`text-2xl font-black font-mono mt-0.5 ${summary.net_balance >= 0 ? 'text-primary' : 'text-rose-600'}`}>
                ₹{Number(summary.net_balance || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <Table
        columns={[
          {
            header: 'Date',
            key: 'date',
            render: (entry) => (
              <span className="text-xs font-medium text-text-secondary">
                {formatDate(entry.date)}
              </span>
            )
          },
          {
            header: 'Type',
            key: 'type',
            render: (entry) => (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                entry.type === 'INFLOW'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}>
                {entry.type === 'INFLOW' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                {entry.type === 'INFLOW' ? 'Collection (+)' : 'Expense (-)'}
              </span>
            )
          },
          {
            header: 'Title / Description',
            key: 'title',
            render: (entry) => (
              <div>
                <p className="font-bold text-text text-sm leading-snug">{entry.title}</p>
                <p className="text-xs text-text-secondary line-clamp-1">{entry.description || '-'}</p>
              </div>
            )
          },
          {
            header: 'Category / Mode',
            key: 'category',
            render: (entry) => (
              <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-secondary border border-border">
                {entry.category || entry.payment_mode || 'General'}
              </span>
            )
          },
          {
            header: 'Inflow (+)',
            key: 'inflow',
            align: 'right',
            render: (entry) => (
              entry.type === 'INFLOW' ? (
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  +₹{Number(entry.amount || 0).toLocaleString('en-IN')}
                </span>
              ) : <span className="text-text-secondary text-xs">-</span>
            )
          },
          {
            header: 'Outflow (-)',
            key: 'outflow',
            align: 'right',
            render: (entry) => (
              entry.type === 'OUTFLOW' ? (
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                  -₹{Number(entry.amount || 0).toLocaleString('en-IN')}
                </span>
              ) : <span className="text-text-secondary text-xs">-</span>
            )
          },
          {
            header: 'Ref / Receipt',
            key: 'ref',
            align: 'right',
            render: (entry) => (
              <span className="font-mono text-xs text-text-secondary">
                {entry.ref_no || '-'}
              </span>
            )
          }
        ]}
        data={entries}
        keyField="id"
        loading={loading}
        emptyState={{
          icon: Wallet,
          title: 'No ledger transactions',
          description: 'Collections and expenses recorded will generate entries in this fund ledger.'
        }}
        pagination={{
          currentPage: page,
          totalPages,
          total,
          loading,
          onPageChange: setPage,
          limit,
          onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1); }
        }}
      />
    </div>
  )
}
