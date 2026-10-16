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
  Printer,
  FileDown,
  Loader2,
  X
} from 'lucide-react'
import api, { assetUrl, formatDate, getCommunityFullName, getContributionReceiptDownloadUrl, getContributionReceiptLink, getBulkContributionReceiptsDownloadUrl, getBulkContributionReceiptsLink } from '../../lib/api'
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
  const [downloadingId, setDownloadingId] = useState(null)
  const [selectedRows, setSelectedRows] = useState([])
  const [bulkReceiptDownloading, setBulkReceiptDownloading] = useState(false)

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

  // Download Official PDF Receipt (Exact same pattern as Donation Receipt)
  const handleDownloadReceipt = async (payment) => {
    const id = payment.id || payment._id
    if (!id) return

    setDownloadingId(id)
    try {
      // 1. Call Backend API to fetch direct receipt download link
      const res = await getContributionReceiptLink(id)
      const data = res.data?.data || {}
      const downloadUrl = data.download_url || payment.receipt_url || payment.download_url || getContributionReceiptDownloadUrl(id)

      // 2. Direct browser download from the backend link
      const safeMember = (payment.member_name || 'Member').replace(/[^a-zA-Z0-9_\-]/g, '_')
      const fileName = `Mandal_Contribution_Receipt_${safeMember}_${data.receipt_number || id}.pdf`
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', fileName)
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Contribution receipt downloaded successfully')
    } catch (err) {
      console.error('Failed to get contribution receipt link:', err)
      const fallbackUrl = payment.receipt_url || payment.download_url || getContributionReceiptDownloadUrl(id)
      const link = document.createElement('a')
      link.href = fallbackUrl
      link.setAttribute('download', `Mandal_Contribution_Receipt_${id}.pdf`)
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Contribution receipt downloaded')
    } finally {
      setDownloadingId(null)
    }
  }

  // Bulk Download Receipts for selected or all payments
  const handleBulkDownloadReceipts = async (specificIds = null) => {
    setBulkReceiptDownloading(true)
    try {
      const isSelected = Array.isArray(specificIds) && specificIds.length > 0
      const payload = {
        month: month || undefined,
        payment_mode: paymentMode !== 'All' ? paymentMode : undefined,
        search: debouncedSearch
      }
      if (isSelected) {
        payload.ids = specificIds
      }

      const res = await getBulkContributionReceiptsLink(payload)
      const data = res.data?.data || {}
      const downloadUrl = data.download_url || getBulkContributionReceiptsDownloadUrl(payload)

      const safeMonth = (month || 'All').replace(/[^a-zA-Z0-9_\-]/g, '_')
      const fileName = isSelected
        ? `Payment_Receipts_Selected_${specificIds.length}.pdf`
        : `Payment_Receipts_${safeMonth}.pdf`

      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', fileName)
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(isSelected ? `${specificIds.length} receipts downloaded successfully!` : 'All receipts downloaded successfully!')
    } catch (err) {
      console.error('Failed to get bulk receipts link:', err)
      const isSelected = Array.isArray(specificIds) && specificIds.length > 0
      const payload = {
        month: month || undefined,
        payment_mode: paymentMode !== 'All' ? paymentMode : undefined,
        search: debouncedSearch
      }
      if (isSelected) payload.ids = specificIds

      const fallbackUrl = getBulkContributionReceiptsDownloadUrl(payload)
      const fileName = isSelected
        ? `Payment_Receipts_Selected_${specificIds.length}.pdf`
        : `Payment_Receipts_${month || 'All'}.pdf`

      const link = document.createElement('a')
      link.href = fallbackUrl
      link.setAttribute('download', fileName)
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Receipts downloaded')
    } finally {
      setBulkReceiptDownloading(false)
    }
  }

  // Print Receipt in printable window with automated print dialog
  const handlePrintReceipt = (payment) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      const id = payment.id || payment._id
      const fallbackUrl = payment.receipt_url || payment.download_url || getContributionReceiptDownloadUrl(id)
      window.open(`${fallbackUrl}${fallbackUrl.includes('?') ? '&' : '?'}view=true`, '_blank')
      return
    }

    const receiptNo = payment.receipt_number || `MNDL-${(payment.id || payment._id).slice(-6).toUpperCase()}`
    const amt = Number(payment.amount || 0).toLocaleString('en-IN')
    const payDate = payment.payment_date ? formatDate(payment.payment_date) : '-'
    const communityTitle = getCommunityFullName() || 'શ્રી પરિવાર જમાત'
    const mandalTitle = payment.mandal_name || 'મંડળ (Mandal)'

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Mandal Contribution Receipt - ${payment.member_name}</title>
          <style>
            @page { size: A5 landscape; margin: 8mm; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Gujarati", sans-serif;
              padding: 20px;
              color: #1e293b;
              background: #fff;
              margin: 0;
            }
            .receipt-box {
              max-width: 650px;
              margin: 0 auto;
              border: 2px solid #1e3a8a;
              border-radius: 12px;
              padding: 24px;
              background: #ffffff;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .org-title {
              font-size: 20px;
              font-weight: 800;
              color: #1e3a8a;
              margin: 0;
            }
            .subtitle {
              font-size: 13px;
              color: #475569;
              font-weight: 700;
              margin-top: 4px;
            }
            .badge-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 8px 14px;
              margin-bottom: 16px;
              font-size: 13px;
              font-weight: 700;
            }
            .table-box {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
            }
            .table-box td {
              padding: 8px 12px;
              border: 1px solid #e2e8f0;
              font-size: 13.5px;
            }
            .label-cell {
              background: #f8fafc;
              color: #475569;
              font-weight: 700;
              width: 32%;
            }
            .val-cell {
              font-weight: 800;
              color: #0f172a;
            }
            .amount-highlight {
              font-size: 18px;
              color: #16a34a;
              font-weight: 900;
            }
            .badge-mode {
              display: inline-block;
              font-size: 11px;
              padding: 2px 8px;
              border-radius: 4px;
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              color: #1e3a8a;
              margin-left: 10px;
            }
            .message-box {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 12px;
              font-weight: 700;
              color: #1e40af;
              text-align: center;
              margin-bottom: 24px;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 24px;
              padding: 0 20px;
            }
            .sig-col {
              text-align: center;
              width: 160px;
            }
            .sig-line {
              border-top: 1.5px solid #334155;
              padding-top: 4px;
              font-size: 12px;
              font-weight: 800;
              color: #0f172a;
            }
            .sig-sub {
              font-size: 10px;
              color: #64748b;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              margin-top: 18px;
              border-top: 1px solid #f1f5f9;
              padding-top: 8px;
            }
            @media print {
              body { padding: 0; }
              .receipt-box { border: 2px solid #1e3a8a; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div class="org-title">${communityTitle}</div>
              <div class="subtitle">${mandalTitle} - Monthly Contribution Receipt (માસિક ફાળો પહોંચ)</div>
            </div>

            <div class="badge-bar">
              <div><span style="color:#64748b;">Receipt No:</span> <strong style="color:#1e3a8a;">${receiptNo}</strong></div>
              <div><span style="color:#64748b;">Date:</span> <strong>${payDate}</strong></div>
            </div>

            <table class="table-box">
              <tr>
                <td class="label-cell">સભ્યશ્રીનું નામ (Member):</td>
                <td class="val-cell">${payment.member_name} ${payment.member_number ? `<span style="font-size:12px;color:#64748b;">(${payment.member_number})</span>` : ''}</td>
              </tr>
              <tr>
                <td class="label-cell">યોગદાન માસ (Month):</td>
                <td class="val-cell">${payment.month}</td>
              </tr>
              <tr>
                <td class="label-cell">ભરેલ રકમ (Amount):</td>
                <td class="val-cell">
                  <span class="amount-highlight">₹ ${amt} /-</span>
                  <span class="badge-mode">${payment.payment_mode || 'Cash'}</span>
                </td>
              </tr>
              ${payment.notes ? `<tr><td class="label-cell">નોંધ / રિમાર્ક (Notes):</td><td class="val-cell">${payment.notes}</td></tr>` : ''}
              ${payment.transaction_id ? `<tr><td class="label-cell">Transaction ID:</td><td class="val-cell">${payment.transaction_id}</td></tr>` : ''}
            </table>

            <div class="message-box">
              આપના નિયમિત માસિક સહયોગ અને મંડળ પ્રત્યેની નિષ્ઠા બદલ મંડળ કમિટી આપનો હૃદયપૂર્વક આભાર વ્યક્ત કરે છે.
            </div>

            <div class="signatures">
              <div class="sig-col">
                <div style="height:25px;"></div>
                <div class="sig-line">મંડળ સંયોજક / પ્રમુખ</div>
                <div class="sig-sub">(Mandal Head)</div>
              </div>
              <div class="sig-col">
                <div style="height:25px;"></div>
                <div class="sig-line">ખજાનચી / એડમિન</div>
                <div class="sig-sub">(Treasurer / Admin)</div>
              </div>
            </div>

            <div class="footer">
              * આ કમ્પ્યુટરાઈઝ્ડ સત્તાવાર ઈ-પહોંચ છે • Parivar Community Platform
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Selected Rows Bulk Actions */}
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2 h-10 bg-emerald-500/10 border border-emerald-500/30 px-3 rounded-xl animate-fade-in shadow-xs">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {selectedRows.length} selected
              </span>
              <button
                type="button"
                onClick={() => handleBulkDownloadReceipts(selectedRows)}
                disabled={bulkReceiptDownloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Download receipts for selected items as combined PDF"
              >
                {bulkReceiptDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>Download Receipts ({selectedRows.length})</span>
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

          {/* Download All Filtered Receipts as PDF */}
          <button
            type="button"
            onClick={() => handleBulkDownloadReceipts(null)}
            disabled={bulkReceiptDownloading || payments.length === 0}
            className="inline-flex items-center gap-1.5 h-10 px-3 sm:px-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 transition-colors cursor-pointer shadow-xs disabled:opacity-50 text-xs font-bold"
            title="Download all filtered payment receipts as combined PDF"
          >
            {bulkReceiptDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <FileDown className="w-4 h-4 text-emerald-600" />
            )}
            <span className="hidden sm:inline">All Receipts (PDF)</span>
            <span className="sm:hidden">All Receipts</span>
          </button>

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
              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(p)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer shadow-xs"
                  title="Print / View Receipt"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(p)}
                  disabled={downloadingId === (p.id || p._id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Download PDF Receipt (પહોંચ ડાઉનલોડ)"
                >
                  {downloadingId === (p.id || p._id) ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5" />
                  )}
                  <span>Download</span>
                </button>
              </div>
            )
          }
        ]}
        data={payments}
        selectable={true}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
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
