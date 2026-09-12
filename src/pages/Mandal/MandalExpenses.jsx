import React, { useCallback, useEffect, useState } from 'react'
import {
  Receipt,
  Search,
  Plus,
  IndianRupee,
  Calendar,
  Trash2,
  Edit2,
  ExternalLink,
  Tag,
  RefreshCw
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
import AddMandalExpenseModal from './AddMandalExpenseModal'

const EXPENSE_CATEGORIES = [
  { label: 'All Categories', value: 'All' },
  { label: 'Event', value: 'Event' },
  { label: 'Maintenance', value: 'Maintenance' },
  { label: 'Refreshments', value: 'Refreshments' },
  { label: 'Administrative', value: 'Administrative' },
  { label: 'Social Cause', value: 'Social Cause' },
  { label: 'Other', value: 'Other' }
]

export default function MandalExpenses() {
  const [expenses, setExpenses] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(15)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [category, setCategory] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [selectedExpense, setSelectedExpense] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(MANDAL_ENDPOINTS.GET_EXPENSES, {
        params: getParams({
          search: debouncedSearch,
          category: category,
          start_date: startDate,
          end_date: endDate
        })
      })
      const data = res.data?.data?.data || []
      const tot = res.data?.data?.total_amount || 0
      const pg = res.data?.data?.pagination || {}

      setExpenses(data)
      setTotalAmount(tot)
      setPaginationData(pg)
    } catch {
      toast.error('Failed to load expenses')
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, category, startDate, endDate, page, limit, getParams, setPaginationData])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const handleDelete = async (id) => {
    const isConfirmed = await confirm('Are you sure you want to delete this expense record?', {
      confirmText: 'Delete Expense',
      type: 'danger'
    })
    if (!isConfirmed) return
    try {
      await api.delete(MANDAL_ENDPOINTS.DELETE_EXPENSE(id))
      toast.success('Expense deleted successfully')
      fetchExpenses()
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  const handleEdit = (expense) => {
    setSelectedExpense(expense)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedExpense(null)
    setIsModalOpen(true)
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
            placeholder="Search expense title..."
            wrapperClassName="w-60 sm:w-72"
          />

          <div className="w-44">
            <Select
              value={category}
              onChange={(val) => { setCategory(val); resetPage(); }}
              options={EXPENSE_CATEGORIES}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={handleCreate}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Expense
          </Button>
          <button
            type="button"
            onClick={fetchExpenses}
            className="p-2.5 rounded-xl border border-border bg-input-bg hover:bg-surface-secondary text-text-secondary hover:text-text transition-colors cursor-pointer shadow-xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-rose-700 dark:text-rose-400">Total Mandal Expenses</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
              ₹{Number(totalAmount || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">Total Expense Records</p>
            <p className="text-2xl font-black text-text mt-1">{total}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <Table
        columns={[
          {
            header: 'Title & Category',
            key: 'title',
            render: (exp) => (
              <div>
                <p className="font-bold text-text text-sm leading-snug">{exp.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Tag className="w-3 h-3" />
                    {exp.category}
                  </span>
                  {exp.description && (
                    <span className="text-xs text-text-secondary line-clamp-1">
                      • {exp.description}
                    </span>
                  )}
                </div>
              </div>
            )
          },
          {
            header: 'Amount',
            key: 'amount',
            render: (exp) => (
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
              </span>
            )
          },
          {
            header: 'Expense Date',
            key: 'date',
            render: (exp) => (
              <span className="text-xs text-text-secondary">
                {formatDate(exp.date)}
              </span>
            )
          },
          {
            header: 'Payment Mode',
            key: 'mode',
            render: (exp) => (
              <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-secondary border border-border uppercase">
                {exp.payment_mode || 'Cash'}
              </span>
            )
          },
          {
            header: 'Receipt / Attachment',
            key: 'receipt',
            render: (exp) => {
              if (!exp.receipt_image) return <span className="text-xs text-text-secondary">-</span>
              return (
                <a
                  href={assetUrl(exp.receipt_image)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View
                </a>
              )
            }
          },
          {
            header: 'Action',
            key: 'action',
            align: 'right',
            render: (exp) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => handleEdit(exp)}
                  className="p-1.5 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all cursor-pointer"
                  title="Edit Expense"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(exp.id || exp._id)}
                  className="p-1.5 rounded-lg text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                  title="Delete Expense"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }
        ]}
        data={expenses}
        keyField="id"
        loading={loading}
        emptyState={{
          icon: Receipt,
          title: 'No expense records found',
          description: 'Use the "Add Expense" button to record expenses made from Mandal funds.',
          actionLabel: 'Add Expense',
          onAction: handleCreate
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

      {/* Add / Edit Expense Modal */}
      <AddMandalExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expense={selectedExpense}
        onSaved={fetchExpenses}
      />
    </div>
  )
}
