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
  CheckCheck
} from 'lucide-react'
import api, { assetUrl, formatDate } from '../../lib/api'
import { MANDAL_ENDPOINTS } from '../../utils/endpoints'
import Table from '../../components/common/Table'
import SearchInput from '../../components/common/SearchInput'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import usePagination from '../../hooks/usePagination'
import useDebounce from '../../hooks/useDebounce'
import { toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import RecordPaymentModal from './RecordPaymentModal'

const MONTH_OPTIONS = [
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

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => {
  const y = String(currentYear - 3 + i)
  return { label: y, value: y }
})

export default function MonthlyContribution({ mandalId, mandal }) {
  const currentMonthStr = new Date().toISOString().slice(0, 7)
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()))
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const selectedMonth = `${selectedYear}-${selectedMonthIndex}`

  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  const [contributions, setContributions] = useState([])
  const [summary, setSummary] = useState(null)
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(15)
  const [loading, setLoading] = useState(false)
  const [bulkPaidLoading, setBulkPaidLoading] = useState(false)

  const [activeContribution, setActiveContribution] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchContributions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(MANDAL_ENDPOINTS.GET_CONTRIBUTIONS, {
        params: getParams({
          mandal_id: mandalId,
          month: selectedMonth,
          status: statusFilter,
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
  }, [mandalId, selectedMonth, statusFilter, debouncedSearch, page, limit, getParams, setPaginationData])

  useEffect(() => {
    fetchContributions()
  }, [fetchContributions])

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
      fetchContributions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark all as paid')
    } finally {
      setBulkPaidLoading(false)
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
      {/* Unified Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-xs">
        {/* Left: Year & Month Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Select */}
          <div className="w-28">
            <Select
              value={selectedYear}
              onChange={(val) => {
                setSelectedYear(val)
                resetPage()
              }}
              options={YEAR_OPTIONS}
            />
          </div>

          {/* Month Select */}
          <div className="w-36">
            <Select
              value={selectedMonthIndex}
              onChange={(val) => {
                setSelectedMonthIndex(val)
                resetPage()
              }}
              options={MONTH_OPTIONS}
            />
          </div>

          {/* Current Month button */}
          <button
            type="button"
            onClick={() => {
              const now = new Date()
              setSelectedYear(String(now.getFullYear()))
              setSelectedMonthIndex(String(now.getMonth() + 1).padStart(2, '0'))
              resetPage()
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              selectedMonth === currentMonthStr
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-surface-secondary text-text-secondary hover:text-text border-border'
            }`}
          >
            Current Month
          </button>
        </div>

        {/* Right: Search + Status Filter + Mark All Paid + Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            onClear={() => { setSearch(''); resetPage(); }}
            placeholder="Search member name or number..."
            wrapperClassName="w-52 sm:w-60"
          />

          <div className="w-32">
            <Select
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); resetPage(); }}
              options={[
                { label: 'All Status', value: 'All' },
                { label: 'Paid', value: 'Paid' },
                { label: 'Pending', value: 'Pending' }
              ]}
            />
          </div>

          {summary?.pending_members > 0 && (
            <button
              type="button"
              onClick={handleMarkAllPaid}
              disabled={bulkPaidLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Mark all pending members as Paid for this month"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{bulkPaidLoading ? 'Marking All...' : 'Mark All Paid'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchContributions}
            className="p-2.5 rounded-xl border border-border bg-input-bg hover:bg-surface-secondary text-text-secondary hover:text-text transition-colors cursor-pointer shadow-xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider">Total</span>
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold text-text mt-1.5">{summary.total_members}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">Paid</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">{summary.paid_members}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">Pending</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1.5">{summary.pending_members}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider">Expected</span>
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg font-bold text-text mt-1.5">₹{Number(summary.expected_amount || 0).toLocaleString('en-IN')}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">Collected</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">₹{Number(summary.collected_amount || 0).toLocaleString('en-IN')}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">Pending Amt</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1.5">₹{Number(summary.pending_amount || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {/* Contributions Table */}
      <Table
        columns={[
          {
            header: 'Member',
            key: 'member',
            render: (c) => {
              const u = c.member_id || {}
              const photo = u.profile_image || u.image
              return (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
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
              <span className="text-xs font-semibold px-2.5 py-1 bg-surface-secondary rounded-lg border border-border">
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
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                c.status === 'Paid'
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
              <div className="flex items-center justify-end gap-1.5">
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
                ) : (
                  <button
                    type="button"
                    onClick={() => handleQuickMarkPaid(c)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer shadow-xs"
                    title="Quick Mark as Paid in Cash"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark Paid</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenPayment(c)}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text bg-surface-secondary hover:bg-border/60 border border-border transition-all cursor-pointer"
                  title="Edit Payment Details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }
        ]}
        data={contributions}
        keyField="id"
        loading={loading}
        emptyState={{
          icon: Calendar,
          title: 'No contribution records',
          description: 'Ensure you have enrolled members into the Mandal from the Members tab.'
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

      {/* Record / Edit Payment Modal */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contribution={activeContribution}
        onSaved={fetchContributions}
      />
    </div>
  )
}
