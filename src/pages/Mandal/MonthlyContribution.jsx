import React, { useCallback, useEffect, useState } from 'react'
import {
  Calendar,
  IndianRupee,
  Search,
  CheckCircle2,
  Clock,
  Edit2,
  Users,
  User2,
  Check,
  RefreshCw,
  Printer,
  CheckCheck,
  Filter,
  X,
  CreditCard,
  RotateCcw,
  Download,
  Banknote,
  Building2,
  Layers,
  ChevronDown,
  ChevronRight,
  Eye,
  Bell,
  CalendarDays
} from 'lucide-react'
import { saveAs } from 'file-saver'
import api, { assetUrl, formatDate } from '../../lib/api'
import { MANDAL_ENDPOINTS } from '../../utils/endpoints'
import Table from '../../components/common/Table'
import SearchInput from '../../components/common/SearchInput'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import DatePicker from '../../components/DatePicker'
import FilterPopover from '../../components/common/FilterPopover'
import Modal from '../../components/Modal'
import usePagination from '../../hooks/usePagination'
import useDebounce from '../../hooks/useDebounce'
import usePermissions from '../../hooks/usePermissions'
import { toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import RecordPaymentModal from './RecordPaymentModal'

const MONTH_OPTIONS = [
  { label: 'All Months', value: '' },
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' }
]

const currentYearNum = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => {
  const y = String(currentYearNum - 3 + i)
  return { label: y, value: y }
})

const PAYMENT_MODE_OPTIONS = [
  { label: 'All Payment Modes', value: 'All' },
  { label: 'Cash', value: 'Cash' },
  { label: 'UPI / Online', value: 'Online' },
  { label: 'Bank Transfer', value: 'Bank' },
  { label: 'Cheque', value: 'Cheque' }
]

export default function MonthlyContribution({ mandalId, mandal, mandals = [] }) {
  const { isSuperAdmin } = usePermissions('mandal')
  const currentMonthStr = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  // Active Filters
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr)
  const [statusFilter, setStatusFilter] = useState('All')
  const [paymentModeFilter, setPaymentModeFilter] = useState('All')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  // Filter Popover State
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState({
    month: currentMonthStr,
    status: 'All',
    payment_mode: 'All'
  })

  // Selection & Bulk Action State
  const [selectedRows, setSelectedRows] = useState([])
  const [isBulkPayModalOpen, setIsBulkPayModalOpen] = useState(false)
  const [bulkPaymentData, setBulkPaymentData] = useState({
    payment_mode: 'Cash',
    payment_date: new Date().toISOString().slice(0, 10)
  })
  const [bulkPaidLoading, setBulkPaidLoading] = useState(false)

  // Table Data & Summary
  const [contributions, setContributions] = useState([])
  const [summary, setSummary] = useState(null)
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(15)
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // Single Edit Modal
  const [activeContribution, setActiveContribution] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAllMandalsModalOpen, setIsAllMandalsModalOpen] = useState(false)
  const [isMandalsExpanded, setIsMandalsExpanded] = useState(false)

  // Active filter count
  const activeFilterCount = [
    selectedMonth !== currentMonthStr,
    statusFilter !== 'All',
    paymentModeFilter !== 'All'
  ].filter(Boolean).length

  const fetchContributions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(MANDAL_ENDPOINTS.GET_CONTRIBUTIONS, {
        params: getParams({
          mandal_id: mandalId,
          month: selectedMonth,
          status: statusFilter,
          payment_mode: paymentModeFilter !== 'All' ? paymentModeFilter : undefined,
          search: debouncedSearch
        })
      })
      const data = res.data?.data?.data || []
      const sum = res.data?.data?.summary || null
      const pg = res.data?.data?.pagination || {}

      setContributions(data)
      setSummary(sum)
      setPaginationData(pg)
    } catch {
      toast.error('Failed to load monthly contributions')
      setContributions([])
    } finally {
      setLoading(false)
    }
  }, [mandalId, selectedMonth, statusFilter, paymentModeFilter, debouncedSearch, page, limit, getParams, setPaginationData])

  useEffect(() => {
    fetchContributions()
  }, [fetchContributions])

  // Filter Popover handlers
  const handleOpenFilter = () => {
    setDraftFilters({
      month: selectedMonth,
      status: statusFilter,
      payment_mode: paymentModeFilter
    })
    setIsFilterOpen(prev => !prev)
  }

  const handleApplyFilter = () => {
    setSelectedMonth(draftFilters.month || currentMonthStr)
    setStatusFilter(draftFilters.status || 'All')
    setPaymentModeFilter(draftFilters.payment_mode || 'All')
    setIsFilterOpen(false)
    setSelectedRows([])
    resetPage()
  }

  const handleClearFilter = () => {
    setDraftFilters({
      month: currentMonthStr,
      status: 'All',
      payment_mode: 'All'
    })
    setSelectedMonth(currentMonthStr)
    setStatusFilter('All')
    setPaymentModeFilter('All')
    setIsFilterOpen(false)
    setSelectedRows([])
    resetPage()
  }

  const handleOpenPayment = (contrib) => {
    setActiveContribution(contrib)
    setIsModalOpen(true)
  }

  const handleQuickMarkPaid = async (contrib) => {
    try {
      await api.put(MANDAL_ENDPOINTS.UPDATE_CONTRIBUTION(contrib.id || contrib._id), {
        status: 'Paid',
        amount: contrib.expected_amount || mandal?.monthly_amount || 500,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_mode: 'Cash'
      })
      toast.success(`Marked as Paid for ${contrib.member_name}`)
      fetchContributions()
    } catch {
      toast.error('Failed to update status')
    }
  }

  // Bulk Mark Paid for Selected Members
  const handleOpenBulkPaySelected = () => {
    if (selectedRows.length === 0) {
      toast.info('Please select one or more members using checkboxes first.')
      return
    }
    setBulkPaymentData({
      payment_mode: 'Cash',
      payment_date: new Date().toISOString().slice(0, 10)
    })
    setIsBulkPayModalOpen(true)
  }

  const handleConfirmBulkPaySelected = async (e) => {
    e.preventDefault()
    if (selectedRows.length === 0) return

    setBulkPaidLoading(true)
    try {
      const res = await api.post(MANDAL_ENDPOINTS.BULK_MARK_PAID, {
        mandal_id: mandalId,
        contribution_ids: selectedRows,
        payment_mode: bulkPaymentData.payment_mode,
        payment_date: bulkPaymentData.payment_date
      })
      toast.success(res.data?.message || `Marked ${selectedRows.length} member(s) as Paid`)
      setIsBulkPayModalOpen(false)
      setSelectedRows([])
      fetchContributions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark selected members as paid')
    } finally {
      setBulkPaidLoading(false)
    }
  }

  // Bulk Mark All Pending in Month
  const handleMarkAllPaid = async () => {
    const isConfirmed = await confirm(
      `Are you sure you want to mark ALL pending members as Paid for ${selectedMonth}?`,
      {
        confirmText: 'Mark All Paid',
        type: 'info'
      }
    )
    if (!isConfirmed) return
    setBulkPaidLoading(true)
    try {
      const res = await api.post(MANDAL_ENDPOINTS.BULK_MARK_PAID, {
        month: selectedMonth,
        mandal_id: mandalId,
        payment_mode: 'Cash',
        payment_date: new Date().toISOString().slice(0, 10)
      })
      toast.success(res.data?.message || 'All pending members marked as Paid')
      setSelectedRows([])
      fetchContributions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark all as paid')
    } finally {
      setBulkPaidLoading(false)
    }
  }

  // Send Pending Reminder Notification
  const [reminderLoading, setReminderLoading] = useState(false)
  const handleSendReminders = async () => {
    const isConfirmed = await confirm(
      `શું તમે ${selectedMonth} મહિનામાં જેમનું યોગદાન બાકી છે તે તમામ સભ્યોને મોબાઈલ એપમાં પેન્ડિંગ રકમનું નોટિફિકેશન મોકલવા માંગો છો?`,
      {
        confirmText: 'હા, નોટિફિકેશન મોકલો',
        type: 'warning'
      }
    )
    if (!isConfirmed) return

    setReminderLoading(true)
    try {
      const res = await api.post(MANDAL_ENDPOINTS.SEND_REMINDERS, {
        month: selectedMonth,
        mandal_id: mandalId
      })
      toast.success(res.data?.message || 'નોટિફિકેશન સફળતાપૂર્વક મોકલવામાં આવ્યું છે!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send pending notifications')
    } finally {
      setReminderLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      setExportLoading(true)
      const params = {
        mandal_id: mandalId,
        month: selectedMonth,
        status: statusFilter,
        payment_mode: paymentModeFilter !== 'All' ? paymentModeFilter : undefined,
        search: debouncedSearch
      }
      if (selectedRows.length > 0) {
        params.ids = selectedRows.join(',')
      }

      const response = await api.get(MANDAL_ENDPOINTS.EXPORT_CONTRIBUTIONS, {
        params,
        responseType: 'blob'
      })

      if (response.data?.type === 'application/json') {
        const text = await response.data.text()
        const json = JSON.parse(text)
        toast.error(json.message || 'Failed to download contributions')
        return
      }

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const safeMandalName = (mandal?.name || 'Mandal').replace(/[^a-zA-Z0-9]/g, '_')
      saveAs(blob, `Contributions_${safeMandalName}_${selectedMonth}.xlsx`)
      toast.success('Contributions downloaded successfully')
    } catch (err) {
      console.error('Error downloading contributions:', err)
      toast.error(err.response?.data?.message || 'Failed to download contributions')
    } finally {
      setExportLoading(false)
    }
  }

  const handlePrintReceipt = (c) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const mandalTitle = mandal?.name || 'Mandal'
    const receiptNo = c.receipt_number || `MNDL-${(c.id || c._id).slice(-6).toUpperCase()}`

    printWindow.document.write(`
      <html>
        <head>
          <title>Mandal Contribution Receipt - ${c.member_name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .receipt-box { max-width: 480px; margin: 0 auto; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 28px; }
            .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 13px; }
            .label { color: #64748b; font-weight: 500; }
            .val { font-weight: 700; color: #0f172a; }
            .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; text-align: center; margin: 18px 0; }
            .amount { font-size: 24px; font-weight: 900; color: #16a34a; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <h2 class="title">${mandalTitle}</h2>
              <div class="subtitle">Monthly Contribution Receipt</div>
            </div>
            
            <div class="row">
              <span class="label">Receipt No:</span>
              <span class="val">${receiptNo}</span>
            </div>
            <div class="row">
              <span class="label">Member Name:</span>
              <span class="val">${c.member_name}</span>
            </div>
            <div class="row">
              <span class="label">Contribution Month:</span>
              <span class="val">${c.month}</span>
            </div>
            <div class="row">
              <span class="label">Payment Date:</span>
              <span class="val">${c.payment_date ? formatDate(c.payment_date) : '-'}</span>
            </div>
            <div class="row">
              <span class="label">Payment Mode:</span>
              <span class="val">${c.payment_mode || 'Cash'}</span>
            </div>

            <div class="amount-box">
              <div style="font-size: 11px; text-transform: uppercase; color: #15803d; font-weight: 700;">Amount Paid</div>
              <div class="amount">₹${Number(c.amount || c.expected_amount || 500).toLocaleString('en-IN')}</div>
            </div>

            ${c.notes ? `<div class="row"><span class="label">Notes:</span><span class="val">${c.notes}</span></div>` : ''}

            <div class="footer">
              <p>Thank you for your active participation & support!</p>
              <p>Parivar Community Platform</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="space-y-4 animate-slide-up text-text">
      {/* Unified Action & Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-xs">
        {/* Left Side: Search + Quick Month Display */}
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchInput
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            onClear={() => { setSearch(''); resetPage(); }}
            placeholder="Search member name or number..."
            wrapperClassName="w-56 sm:w-72"
          />

          <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-surface-secondary/70 border border-border text-xs font-semibold shadow-xs">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span className="text-text-secondary">Month:</span>
            <span className="font-bold text-text">{selectedMonth}</span>
          </div>
        </div>

        {/* Right Side: Selection Actions + Filter Popover + Mark All + Refresh */}
        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          {/* Selected Count & Mark Paid Button */}
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2 h-10 bg-emerald-500/10 border border-emerald-500/30 px-3 rounded-xl animate-fade-in shadow-xs">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {selectedRows.length} selected
              </span>
              <button
                type="button"
                onClick={handleOpenBulkPaySelected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Paid</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRows([])}
                className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-surface transition-colors cursor-pointer"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Filter Popover */}
          <FilterPopover
            isOpen={isFilterOpen}
            onToggle={handleOpenFilter}
            onClose={() => setIsFilterOpen(false)}
            activeCount={activeFilterCount}
            onClear={handleClearFilter}
            onApply={handleApplyFilter}
            title="Filter Contributions"
            width="w-[320px]"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Contribution Month
                </label>
                <DatePicker
                  mode="month"
                  value={draftFilters.month}
                  onChange={(val) => setDraftFilters(prev => ({ ...prev, month: val }))}
                  placeholder="Select Month"
                  className="w-full bg-input-bg text-text border border-border rounded-xl py-2 px-3 text-sm outline-none focus:border-primary/50 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Payment Status
                </label>
                <Select
                  value={draftFilters.status}
                  onChange={(val) => setDraftFilters(prev => ({ ...prev, status: val }))}
                  options={[
                    { label: 'All Status', value: 'All' },
                    { label: 'Paid', value: 'Paid' },
                    { label: 'Pending', value: 'Pending' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Payment Mode
                </label>
                <Select
                  value={draftFilters.payment_mode}
                  onChange={(val) => setDraftFilters(prev => ({ ...prev, payment_mode: val }))}
                  options={PAYMENT_MODE_OPTIONS}
                />
              </div>
            </div>
          </FilterPopover>

          {/* Send Pending Reminders Notification Button */}
          {isSuperAdmin && summary?.pending_members > 0 && (
            <button
              type="button"
              onClick={handleSendReminders}
              disabled={reminderLoading}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="જેમનું પેન્ડિંગ છે તે તમામ સભ્યોને મોબાઈલ એપમાં નોટિફિકેશન મોકલો"
            >
              <Bell className={`w-4 h-4 ${reminderLoading ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{reminderLoading ? 'મોકલી રહ્યા છીએ...' : 'Send Reminder'}</span>
              <span className="sm:hidden">Reminder</span>
            </button>
          )}

          {/* Mark All Paid (for entire month when pending members exist) */}
          {isSuperAdmin && summary?.pending_members > 0 && selectedRows.length === 0 && (
            <button
              type="button"
              onClick={handleMarkAllPaid}
              disabled={bulkPaidLoading}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Mark all pending members as Paid for this month"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">{bulkPaidLoading ? 'Marking...' : 'Mark All Paid'}</span>
              <span className="sm:hidden">All Paid</span>
            </button>
          )}

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={exportLoading}
            className="inline-flex items-center gap-1.5 h-10 px-3 sm:px-3.5 rounded-xl border border-border bg-input-bg hover:bg-surface-secondary text-text-secondary hover:text-text transition-colors cursor-pointer shadow-xs disabled:opacity-50 text-xs font-semibold"
            title="Download contributions Excel"
          >
            <Download className={`w-4 h-4 ${exportLoading ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">{exportLoading ? 'Downloading...' : 'Download'}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchContributions}
            className="h-10 w-10 flex items-center justify-center rounded-xl border border-border bg-input-bg hover:bg-surface-secondary text-text-secondary hover:text-text transition-colors cursor-pointer shadow-xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Financial Summary Cards & Payment Breakdown */}
      {summary && !isSuperAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider block">Monthly Fee</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-primary mt-1">₹{summary.expected_amount || mandal?.monthly_amount || 500}</p>
            <p className="text-[11px] text-text-secondary mt-0.5 font-medium">Rate per month</p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider block">Status ({selectedMonth})</span>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                summary.paid_members > 0
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400'
              }`}>
                {summary.paid_members > 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {summary.paid_members > 0 ? 'Paid' : 'Pending'}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary mt-1 font-medium">{summary.paid_members > 0 ? 'Payment verified' : 'Due for this month'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-xs">
            <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider block">Paid Amount</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">₹{Number(summary.collected_amount || 0).toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-text-secondary mt-0.5 font-medium">Amount recorded</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-xs">
            <span className="text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider block">Pending Due</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">₹{Number(summary.pending_amount || 0).toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-text-secondary mt-0.5 font-medium">Balance due</p>
          </div>
        </div>
      )}

      {summary && isSuperAdmin && (
        <div className="space-y-3">
          {/* Row 1: Cash vs Bank/Online Breakdown & All-Mandals Grand Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Cash Collection (Active Mandal) */}
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-200/70 dark:border-emerald-900/50 bg-gradient-to-br from-white to-emerald-50/70 dark:from-card dark:to-emerald-950/20 p-5 shadow-sm transition-all duration-300 hover:shadow-md">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Cash Collection
                  </span>

                  {/* Amount */}
                  <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                    ₹{Number(summary.cash_collected || 0).toLocaleString("en-IN")}
                  </p>

                  <p className="mt-1 text-xs text-text-secondary">
                    Total cash collected
                  </p>
                </div>

                {/* Icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/10">
                  <Banknote className="h-6 w-6" />
                </div>
              </div>

              {/* Footer Details */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-200/60 dark:border-emerald-900/40 pt-4">
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 px-2.5 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                    Monthly Rate
                  </span>
                  <span className="text-xs font-bold text-text">
                    ₹{mandal?.monthly_amount || summary?.mandal_monthly_amount || 500}/mo
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{selectedMonth}</span>
                </div>
              </div>
            </div>

            {/* Bank / Online Collection (Active Mandal) */}
            <div className="group relative overflow-hidden rounded-2xl border border-blue-200/70 dark:border-blue-900/50 bg-gradient-to-br from-white to-blue-50/70 dark:from-card dark:to-blue-950/20 p-5 shadow-sm transition-all duration-300 hover:shadow-md">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Bank / Online Transfer
                    </span>
                  </div>

                  {/* Amount */}
                  <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400 tabular-nums">
                    ₹{Number(summary.bank_online_collected || 0).toLocaleString("en-IN")}
                  </p>

                  <p className="mt-1 text-xs text-text-secondary">
                    Total amount collected
                  </p>
                </div>

                {/* Icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/10">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>

              {/* Footer Details */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-blue-200/60 dark:border-blue-900/40 pt-4">
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 px-2.5 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                    Monthly Rate
                  </span>
                  <span className="text-xs font-bold text-text">
                    ₹{mandal?.monthly_amount || summary?.mandal_monthly_amount || 500}/mo
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{selectedMonth}</span>
                </div>
              </div>
            </div>

            {/* Grand Total All Mandals (Clean, Responsive & Scalable for any number of mandals) */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-emerald-500/10 border border-primary/25 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Layers className="w-5 h-5" />
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                      All Mandals Grand Total ({selectedMonth})
                    </span>
                    <p className="text-[11px] text-text-secondary font-medium">
                      Total {summary.mandals_breakdown?.length || 0} Mandals
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                    ₹{Number(summary.grand_total_collected ?? summary.collected_amount ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Combined Grand Cash & Bank Breakdown */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-surface-secondary/70 border border-border/70 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase font-bold block">Total Cash</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{Number(summary.grand_cash_collected ?? summary.cash_collected ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-l border-border/70 pl-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase font-bold block">Total Bank / Online</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                      ₹{Number(summary.grand_bank_online_collected ?? summary.bank_online_collected ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button: View Full Breakdown Modal */}
              {Array.isArray(summary.mandals_breakdown) && summary.mandals_breakdown.length > 0 && (
                <div className="pt-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-text-secondary font-medium truncate">
                    Showing across {summary.mandals_breakdown.length} mandals
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAllMandalsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View All Mandals ({summary.mandals_breakdown.length})</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Active Mandal Status & Amount Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider">Total Members</span>
                <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-bold text-text mt-1">{summary.total_members}</p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">Paid Members</span>
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{summary.paid_members}</p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">Pending Members</span>
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{summary.pending_members}</p>
            </div>

            <div className="p-3 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider">Expected</span>
                <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-lg font-bold text-text mt-1">₹{Number(summary.expected_amount || 0).toLocaleString('en-IN')}</p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">Collected</span>
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{Number(summary.collected_amount || 0).toLocaleString('en-IN')}</p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">Pending Amt</span>
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">₹{Number(summary.pending_amount || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contributions Table with Row Selection */}
      <Table
        selectable={isSuperAdmin}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        keyField="id"
        columns={[
          {
            header: 'Member',
            key: 'member',
            render: (c) => {
              const u = c.member_id || {}
              const photo = u.profile_image || u.image
              return (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                    {photo ? (
                      <img src={assetUrl(photo)} alt={c.member_name} className="w-full h-full object-cover" />
                    ) : (
                      <User2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-text text-sm leading-snug">{c.member_name}</p>
                    <p className="text-xs text-text-secondary">{c.member_number || u.number || '-'}</p>
                  </div>
                </div>
              )
            }
          },
          {
            header: 'Month',
            key: 'month',
            render: (c) => (
              <span className="text-xs font-semibold px-2 py-0.5 bg-surface-secondary rounded-lg border border-border">
                {c.month}
              </span>
            )
          },
          {
            header: 'Expected',
            key: 'expected',
            render: (c) => (
              <span className="text-xs sm:text-sm font-medium text-text-secondary">
                ₹{Number(c.expected_amount || mandal?.monthly_amount || 500).toLocaleString('en-IN')}
              </span>
            )
          },
          {
            header: 'Paid Amount',
            key: 'amount',
            render: (c) => (
              <span className={`text-xs sm:text-sm font-bold ${c.status === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-secondary'}`}>
                ₹{Number(c.amount || 0).toLocaleString('en-IN')}
              </span>
            )
          },
          {
            header: 'Payment Date',
            key: 'date',
            render: (c) => (
              <span className="text-xs text-text-secondary">
                {c.payment_date ? formatDate(c.payment_date) : '-'}
              </span>
            )
          },
          {
            header: 'Mode',
            key: 'mode',
            render: (c) => (
              c.status === 'Paid' ? (
                <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-secondary border border-border uppercase">
                  {c.payment_mode || 'Cash'}
                </span>
              ) : <span className="text-xs text-text-secondary">-</span>
            )
          },
          {
            header: 'Status',
            key: 'status',
            render: (c) => (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${c.status === 'Paid'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400'
                }`}>
                {c.status === 'Paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {c.status}
              </span>
            )
          },
          {
            header: 'Action',
            key: 'action',
            align: 'right',
            render: (c) => (
              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                {c.status === 'Paid' ? (
                  <button
                    type="button"
                    onClick={() => handlePrintReceipt(c)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer shadow-xs"
                    title="Print / View Receipt"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>
                ) : isSuperAdmin ? (
                  <button
                    type="button"
                    onClick={() => handleQuickMarkPaid(c)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer shadow-xs"
                    title="Quick Mark as Paid in Cash"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark Paid</span>
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    Pending
                  </span>
                )}
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => handleOpenPayment(c)}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-text bg-surface-secondary hover:bg-border/60 border border-border transition-all cursor-pointer"
                    title="Edit Payment Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          }
        ]}
        data={contributions}
        loading={loading}
        emptyState={{
          icon: Calendar,
          title: 'No contribution records found',
          description: 'Ensure you have enrolled members into this Mandal or check your filter criteria.'
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

      {/* Bulk Mark Paid for Selected Members Modal */}
      {isBulkPayModalOpen && (
        <Modal
          isOpen={isBulkPayModalOpen}
          onClose={() => setIsBulkPayModalOpen(false)}
          title={`Mark Paid for ${selectedRows.length} Selected Member(s)`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmBulkPaySelected} className="space-y-4 text-text">
            <div className="p-3 bg-surface-secondary/70 rounded-xl border border-border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-text-secondary">Selected Members:</span>
                <span className="font-bold text-text">{selectedRows.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Contribution Month:</span>
                <span className="font-bold text-primary">{selectedMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Amount to Record:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{Number(selectedRows.length * (mandal?.monthly_amount || 500)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1.5 block font-semibold">Payment Mode <span className="text-red-500">*</span></label>
              <Select
                value={bulkPaymentData.payment_mode}
                onChange={(val) => setBulkPaymentData({ ...bulkPaymentData, payment_mode: val })}
                options={[
                  { label: 'Cash', value: 'Cash' },
                  { label: 'UPI / Online', value: 'Online' },
                  { label: 'Bank Transfer', value: 'Bank' },
                  { label: 'Cheque', value: 'Cheque' }
                ]}
                disabled={bulkPaidLoading}
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1.5 block font-semibold">Payment Date <span className="text-red-500">*</span></label>
              <DatePicker
                mode="date"
                value={bulkPaymentData.payment_date}
                onChange={(val) => setBulkPaymentData({ ...bulkPaymentData, payment_date: val })}
                disabled={bulkPaidLoading}
                className="w-full bg-input-bg text-text border border-border rounded-xl py-2 px-3 text-sm outline-none focus:border-primary/50"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsBulkPayModalOpen(false)}
                disabled={bulkPaidLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={bulkPaidLoading}
                disabled={bulkPaidLoading}
                icon={<Check className="w-4 h-4" />}
              >
                {bulkPaidLoading ? 'Recording...' : `Confirm & Mark Paid (${selectedRows.length})`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record / Edit Single Payment Modal */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contribution={activeContribution}
        onSaved={fetchContributions}
      />

      {/* All Mandals Collection Breakdown Modal (Scalable for 2, 10, 50+ mandals) */}
      <Modal
        isOpen={isAllMandalsModalOpen}
        onClose={() => setIsAllMandalsModalOpen(false)}
        title={`All Mandals Collection Breakdown (${selectedMonth})`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Header Summary Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-card to-emerald-500/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                Total Mandals: {summary?.mandals_breakdown?.length || 0}
              </span>
              <p className="text-2xl font-black text-primary mt-0.5">
                ₹{Number(summary?.grand_total_collected ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-text-secondary">Grand Collection for {selectedMonth}</p>
            </div>
            <div className="flex items-center gap-3 text-xs bg-card/90 p-2.5 rounded-xl border border-border">
              <div>
                <span className="text-text-secondary block text-[10px] uppercase font-bold">Total Cash</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  ₹{Number(summary?.grand_cash_collected ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-border">|</span>
              <div>
                <span className="text-text-secondary block text-[10px] uppercase font-bold">Total Bank</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                  ₹{Number(summary?.grand_bank_online_collected ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Mandals List Table / Cards (Scrollable up to 50+ mandals) */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {Array.isArray(summary?.mandals_breakdown) && summary.mandals_breakdown.length > 0 ? (
              summary.mandals_breakdown.map((m, idx) => {
                const matchedMandal = Array.isArray(mandals) ? mandals.find(item => String(item._id || item.id) === String(m.mandal_id)) : null
                const monthlyRate = m.monthly_amount ?? matchedMandal?.monthly_amount ?? 500
                return (
                  <div
                    key={String(m.mandal_id)}
                    className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-surface-secondary text-text-secondary font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-text">{m.name || 'Mandal'}</h4>
                          <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-extrabold text-[10px]">
                            ₹{Number(monthlyRate).toLocaleString('en-IN')} / mo
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                          Collection Month: <strong className="text-text font-semibold">{selectedMonth}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold block">
                          Cash: ₹{Number(m.cash_collected || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold block">
                          Bank: ₹{Number(m.bank_collected || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="pl-3 border-l border-border text-right min-w-[90px]">
                        <span className="text-[10px] text-text-secondary uppercase font-bold block">Total</span>
                        <span className="text-base font-extrabold text-primary">
                          ₹{Number(m.total_collected || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-8 text-center text-text-secondary text-xs">
                No mandal collection recorded for this month.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsAllMandalsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

