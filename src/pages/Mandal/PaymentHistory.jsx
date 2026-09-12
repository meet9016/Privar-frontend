import React, { useCallback, useEffect, useState } from 'react'
import {
  FileText,
  Search,
  IndianRupee,
  Calendar,
  User2,
  CheckCircle2,
  Download,
  CreditCard,
  RefreshCw,
  Printer
} from 'lucide-react'
import api, { assetUrl, formatDate } from '../../lib/api'
import { MANDAL_ENDPOINTS } from '../../utils/endpoints'
import Table from '../../components/common/Table'
import SearchInput from '../../components/common/SearchInput'
import Select from '../../components/common/Select'
import DatePicker from '../../components/DatePicker'
import Button from '../../components/common/Button'
import usePagination from '../../hooks/usePagination'
import useDebounce from '../../hooks/useDebounce'
import { toast } from '../../lib/toast'

const PAYMENT_MODE_OPTIONS = [
  { label: 'All Modes', value: 'All' },
  { label: 'Cash', value: 'Cash' },
  { label: 'UPI / Online', value: 'Online' },
  { label: 'Bank Transfer', value: 'Bank' },
  { label: 'Cheque', value: 'Cheque' }
]

export default function PaymentHistory() {
  const [payments, setPayments] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(15)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [paymentMode, setPaymentMode] = useState('All')
  const [month, setMonth] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(MANDAL_ENDPOINTS.GET_HISTORY, {
        params: getParams({
          search: debouncedSearch,
          payment_mode: paymentMode,
          month: month,
          start_date: startDate,
          end_date: endDate
        })
      })
      const data = res.data?.data?.data || []
      const tot = res.data?.data?.total_amount || 0
      const pg = res.data?.data?.pagination || {}

      setPayments(data)
      setTotalAmount(tot)
      setPaginationData(pg)
    } catch {
      toast.error('Failed to load payment history')
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, paymentMode, month, startDate, endDate, page, limit, getParams, setPaginationData])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handlePrintReceipt = (payment) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Mandal Contribution Receipt - ${payment.member_name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .receipt-box { max-width: 500px; margin: 0 auto; border: 2px dashed #94a3b8; border-radius: 16px; padding: 30px; }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .row { display: flex; justify-content: space-between; margin: 12px 0; font-size: 14px; }
            .label { color: #64748b; font-weight: 500; }
            .val { font-weight: 700; color: #0f172a; }
            .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; text-align: center; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: 900; color: #16a34a; }
            .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <h2 class="title">PAYMENT RECEIPT</h2>
              <div class="subtitle">Mandal Monthly Contribution</div>
            </div>
            
            <div class="row">
              <span class="label">Receipt No:</span>
              <span class="val">${payment.receipt_number || ('MNDL-' + (payment.id || payment._id).slice(-6).toUpperCase())}</span>
            </div>
            <div class="row">
              <span class="label">Member Name:</span>
              <span class="val">${payment.member_name}</span>
            </div>
            <div class="row">
              <span class="label">Contribution Month:</span>
              <span class="val">${payment.month}</span>
            </div>
            <div class="row">
              <span class="label">Payment Date:</span>
              <span class="val">${payment.payment_date ? formatDate(payment.payment_date) : '-'}</span>
            </div>
            <div class="row">
              <span class="label">Payment Mode:</span>
              <span class="val">${payment.payment_mode || 'Cash'}</span>
            </div>

            <div class="amount-box">
              <div style="font-size: 11px; text-transform: uppercase; color: #15803d; font-weight: 700;">Amount Paid</div>
              <div class="amount">₹${Number(payment.amount || 0).toLocaleString('en-IN')}</div>
            </div>

            ${payment.notes ? `<div class="row"><span class="label">Notes:</span><span class="val">${payment.notes}</span></div>` : ''}

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
      {/* Unified Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchInput
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            onClear={() => { setSearch(''); resetPage(); }}
            placeholder="Search member, receipt, txn..."
            wrapperClassName="w-60 sm:w-72"
          />

          <div className="w-36">
            <DatePicker
              mode="month"
              value={month}
              onChange={(val) => { setMonth(val || ''); resetPage(); }}
              placeholder="All Months"
              className="w-full bg-input-bg text-text border border-border hover:border-primary/40 focus:border-primary rounded-xl py-2 px-3 text-sm outline-none shadow-xs"
            />
          </div>

          <div className="w-36">
            <Select
              value={paymentMode}
              onChange={(val) => { setPaymentMode(val); resetPage(); }}
              options={PAYMENT_MODE_OPTIONS}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchHistory}
            className="p-2.5 rounded-xl border border-border bg-input-bg hover:bg-surface-secondary text-text-secondary hover:text-text transition-colors cursor-pointer shadow-xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">Total Collection Logged</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">₹{Number(totalAmount || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">Total Transactions</p>
            <p className="text-2xl font-black text-text mt-1">{total}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <Table
        columns={[
          {
            header: 'Receipt / Txn',
            key: 'receipt',
            render: (p) => (
              <div>
                <p className="font-mono font-bold text-primary text-xs">
                  {p.receipt_number || ('MNDL-' + (p.id || p._id).slice(-6).toUpperCase())}
                </p>
                <p className="text-[11px] text-text-secondary">{p.transaction_id || '-'}</p>
              </div>
            )
          },
          {
            header: 'Member',
            key: 'member',
            render: (p) => {
              const u = p.member_id || {}
              const photo = u.profile_image || u.image
              return (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                    {photo ? (
                      <img src={assetUrl(photo)} alt={p.member_name} className="w-full h-full object-cover" />
                    ) : (
                      <User2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-text text-sm leading-snug">{p.member_name}</p>
                    <p className="text-xs text-text-secondary">{p.member_number || u.number || '-'}</p>
                  </div>
                </div>
              )
            }
          },
          {
            header: 'Month',
            key: 'month',
            render: (p) => (
              <span className="font-mono text-xs font-semibold px-2 py-1 bg-surface-secondary rounded-lg border border-border">
                {p.month}
              </span>
            )
          },
          {
            header: 'Amount',
            key: 'amount',
            render: (p) => (
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                ₹{Number(p.amount || 0).toLocaleString('en-IN')}
              </span>
            )
          },
          {
            header: 'Payment Date',
            key: 'date',
            render: (p) => (
              <span className="text-xs text-text-secondary">
                {p.payment_date ? formatDate(p.payment_date) : '-'}
              </span>
            )
          },
          {
            header: 'Mode',
            key: 'mode',
            render: (p) => (
              <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-secondary border border-border uppercase">
                {p.payment_mode || 'Cash'}
              </span>
            )
          },
          {
            header: 'Recorded By',
            key: 'by',
            render: (p) => (
              <span className="text-xs text-text-secondary">
                {p.recorded_by_name || 'System Admin'}
              </span>
            )
          },
          {
            header: 'Action',
            key: 'action',
            align: 'right',
            render: (p) => (
              <button
                type="button"
                onClick={() => handlePrintReceipt(p)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer shadow-xs"
                title="Print Receipt"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Receipt</span>
              </button>
            )
          }
        ]}
        data={payments}
        keyField="id"
        loading={loading}
        emptyState={{
          icon: FileText,
          title: 'No payment records found',
          description: 'Payment transactions recorded for monthly contributions will appear here.'
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
