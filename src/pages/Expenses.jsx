import React, { useCallback, useEffect, useState } from 'react'
import {
  IndianRupee,
  Trash2,
  Search,
  Edit2,
  RefreshCw,
  Plus,
  Download,
  CalendarDays,
  User2,
  Paperclip,
  Eye,
  Receipt
} from 'lucide-react'
import api, { getExpensesList, exportExpensesExcel, getCommitteeMembersList, assetUrl } from '../lib/api'
import { confirm } from '../lib/confirm'
import usePagination from '../hooks/usePagination'
import Modal from '../components/Modal'
import FileDropzone from '../components/common/FileDropzone'
import Loader from '../components/common/Loader'
import DatePicker from '../components/DatePicker'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import { toast } from '../lib/toast'

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-shadow'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(10)
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('') // YYYY-MM
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Data for dropdowns
  const [committeeMembers, setCommitteeMembers] = useState([])
  const [expenseCategories, setExpenseCategories] = useState([])

  const [selectedExpense, setSelectedExpense] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [proofImage, setProofImage] = useState(null)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    expense_category_id: '',
    expense_category_name: '',
    committee_member_id: '',
    committee_member_name: '',
    amount: '',
    description: ''
  })
  const [fieldErrors, setFieldErrors] = useState({})

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = getParams({ search: activeSearch })
      if (monthFilter) params.month = monthFilter
      
      const res = await getExpensesList(params)
      const rows = res.data?.data || res.data || []
      const pg = res.data?.pagination || {}
      setExpenses(Array.isArray(rows) ? rows : [])
      setPaginationData(pg)
    } catch (err) {
      setExpenses([])
      setPaginationData({ page: 1, totalPages: 1, total: 0 })
      setError(err.response?.data?.message || 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [activeSearch, page, monthFilter])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [membersRes, categoriesRes] = await Promise.all([
          getCommitteeMembersList({ limit: 100 }),
          api.get('/masters/expense-category')
        ])
        setCommitteeMembers(membersRes.data?.data || [])
        setExpenseCategories(categoriesRes.data?.data || [])
      } catch (err) {
        console.error('Failed to load dropdown data', err)
      }
    }
    fetchDropdowns()
  }, [])

  const handleDelete = async (id) => {
    if (!await confirm('Are you sure you want to delete this expense?')) return
    try {
      await api.delete(`/expenses/${id}`)
      await fetchExpenses()
      toast.success('Expense deleted successfully')
    } catch (err) {
      toast.error('Failed to delete expense')
    }
  }

  const handleEdit = (expense) => {
    setSelectedExpense(expense)
    setFormData({
      date: expense.date ? new Date(expense.date).toISOString().slice(0, 10) : '',
      expense_category_id: expense.expense_category_id || '',
      expense_category_name: expense.expense_category_name || '',
      committee_member_id: expense.committee_member_id || '',
      committee_member_name: expense.committee_member_name || '',
      amount: expense.amount || '',
      description: expense.description || ''
    })
    setProofImage(null)
    setFieldErrors({})
    setFormLoading(false)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedExpense(null)
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      expense_category_id: '',
      expense_category_name: '',
      committee_member_id: '',
      committee_member_name: '',
      amount: '',
      description: ''
    })
    setProofImage(null)
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedExpense(null)
    setProofImage(null)
    setFieldErrors({})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      // Auto-update names when IDs change
      if (name === 'expense_category_id') {
        const cat = expenseCategories.find(c => c.id === value || c._id === value)
        updated.expense_category_name = cat ? cat.name || cat.title || cat.category || '' : ''
      }
      if (name === 'committee_member_id') {
        const member = committeeMembers.find(m => String(m.id || m._id) === String(value))
        updated.committee_member_name = member ? `${member.first_name || ''} ${member.middle_name || ''} ${member.last_name || ''}`.trim() : ''
      }
      
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})

    const errors = {}
    if (!formData.date) errors.date = 'Date is required'
    if (!formData.amount || Number(formData.amount) <= 0) errors.amount = 'Amount is required'
    if (!formData.expense_category_id) errors.expense_category_id = 'Expense Category is required'
    if (!formData.committee_member_id) errors.committee_member_id = 'Committee Member is required'
    if (!proofImage && (!selectedExpense || !selectedExpense.image)) {
      errors.proof = 'Proof / Receipt is required'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFormLoading(true)
    try {
      const payload = new FormData(e.target)
      payload.append('expense_category_name', formData.expense_category_name)
      payload.append('committee_member_name', formData.committee_member_name)
      
      if (proofImage) {
        payload.append('image', proofImage)
      }
      
      if (selectedExpense) {
        await api.put(`/expenses/${selectedExpense.id}`, payload)
        toast.success('Expense updated successfully')
      } else {
        await api.post('/expenses', payload)
        toast.success('Expense added successfully')
      }
      handleCloseModal()
      await fetchExpenses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense')
    } finally {
      setFormLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = {}
      if (activeSearch) params.search = activeSearch
      if (monthFilter) params.month = monthFilter
      
      const response = await exportExpensesExcel(params)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `expenses_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      setError('Failed to export expenses')
    }
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    if (e.target.value === '') {
      setActiveSearch('')
      resetPage()
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setActiveSearch(search)
    resetPage()
  }

  const handleMonthFilterChange = (value) => {
    setMonthFilter(value)
    resetPage()
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
  const currentPage = page

  return (
    <div className="space-y-6 animate-slide-up text-text">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Expenses</h2>
        </div>
        <div className="flex flex-wrap items-center sm:justify-end gap-3 flex-1">
          <div className="w-64 sm:w-72">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-text-secondary/60" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search expenses..."
                className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <Button
            onClick={fetchExpenses}
            variant="secondary"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <div className="w-full sm:w-auto flex-none">
            <DatePicker
              mode="month"
              value={monthFilter}
              onChange={handleMonthFilterChange}
              placeholder="Month"
              className="w-full sm:w-32 bg-input-bg text-text border border-border rounded-xl py-2 px-3 text-sm outline-none focus:border-primary/50 shadow-sm"
            />
          </div>

          <Button
            onClick={handleExport}
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            onClick={handleCreate}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Expense
          </Button>
        </div>
      </div>



      {loading && expenses.length === 0 ? (
        <div className="py-20"><Loader text="Loading expenses..." /></div>
      ) : (
        <Table
          columns={[
            {
              header: 'Date',
              key: 'date',
              render: (expense) => (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <CalendarDays className="w-4 h-4 text-text-secondary/60" />
                  {expense.date ? new Date(expense.date).toLocaleDateString() : '-'}
                </div>
              )
            },
            {
              header: 'Category',
              key: 'category',
              render: (expense) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-secondary border border-border">
                  {expense.expense_category_name || '-'}
                </span>
              )
            },
            {
              header: 'Committee Member',
              key: 'member',
              render: (expense) => expense.committee_member_name ? (
                <div className="flex items-center gap-2">
                  <User2 className="w-4 h-4 text-text-secondary/60" />
                  {expense.committee_member_name}
                </div>
              ) : '-'
            },
            {
              header: 'Description',
              key: 'description',
              render: (expense) => (
                <div className="max-w-xs truncate" title={expense.description}>
                  {expense.description || '-'}
                </div>
              )
            },
            {
              header: 'Proof',
              key: 'proof',
              render: (expense) => expense.image ? (
                <a href={assetUrl(expense.image)} target="_blank" rel="noopener noreferrer" className="relative inline-block hover:opacity-80 transition-opacity max-w-[100px]" title="View Proof">
                  {typeof expense.image === 'string' && expense.image.toLowerCase().endsWith('.pdf') ? (
                     <div className="h-12 w-16 flex justify-center items-center rounded-lg border border-border bg-primary/10 text-primary">
                       <Paperclip className="w-5 h-5" />
                     </div>
                  ) : (
                     <img src={assetUrl(expense.image)} alt="Proof" className="h-12 w-16 rounded-lg object-cover border border-border" />
                  )}
                </a>
              ) : (
                <span className="text-text-secondary/50 text-xs">-</span>
              )
            },
            {
              header: 'Amount',
              key: 'amount',
              align: 'right',
              render: (expense) => (
                <span className="font-semibold text-text tabular-nums">
                  ₹{Number(expense.amount || 0).toLocaleString('en-IN')}
                </span>
              )
            },
            {
              header: 'Actions',
              key: 'actions',
              align: 'right',
              render: (expense) => (
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => handleEdit(expense)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(expense.id)} className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all" title="Delete">
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
            title: 'No expenses found',
            description: 'There are no expense records matching your search criteria'
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
      )}

      <Modal isOpen={isModalOpen} title={selectedExpense ? 'Edit Expense' : 'Add Expense'} onClose={handleCloseModal}>
        <form onSubmit={handleSubmit} className="space-y-4 text-text" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label="Date"
              required
              name="date"
              mode="date"
              value={formData.date}
              onChange={(val) => {
                setFormData(prev => ({ ...prev, date: val }))
                if (fieldErrors.date) setFieldErrors(prev => ({ ...prev, date: null }))
              }}
              disabled={formLoading}
              error={fieldErrors.date}
            />
            <Input
              type="number"
              label="Amount (₹)"
              name="amount"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => {
                handleChange(e)
                if (fieldErrors.amount) setFieldErrors(prev => ({ ...prev, amount: null }))
              }}
              required
              placeholder="0.00"
              disabled={formLoading}
              error={fieldErrors.amount}
            />
            <Select
              label="Expense Category"
              name="expense_category_id"
              required
              value={formData.expense_category_id}
              onChange={(val) => {
                handleChange({ target: { name: 'expense_category_id', value: val } })
                if (fieldErrors.expense_category_id) setFieldErrors(prev => ({ ...prev, expense_category_id: null }))
              }}
              options={[{ label: 'Select Category', value: '' }, ...expenseCategories.map(cat => ({ label: cat.name || cat.title || cat.category || 'Unnamed', value: cat.id || String(cat._id) }))]}
              disabled={formLoading}
              error={fieldErrors.expense_category_id}
            />
            <Select
              label="Committee Member"
              name="committee_member_id"
              required
              value={formData.committee_member_id}
              onChange={(val) => {
                handleChange({ target: { name: 'committee_member_id', value: val } })
                if (fieldErrors.committee_member_id) setFieldErrors(prev => ({ ...prev, committee_member_id: null }))
              }}
              options={[{ label: 'Select Member', value: '' }, ...committeeMembers.map(member => ({ label: `${member.first_name} ${member.middle_name}`, value: member.id || String(member._id) }))]}
              disabled={formLoading}
              error={fieldErrors.committee_member_id}
            />
            <div className="md:col-span-2">
              <Input
                type="textarea"
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Expense description or purpose..."
                rows="3"
                disabled={formLoading}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                Proof / Receipt <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col gap-2">
                <FileDropzone
                  name="image"
                  accept="image/*,application/pdf"
                  error={fieldErrors.proof}
                  onFilesSelected={(files) => {
                    setProofImage(files[0])
                    if (fieldErrors.proof) setFieldErrors(prev => ({ ...prev, proof: null }))
                  }}
                  disabled={formLoading}
                  label="Click or Drag Receipt/Proof"
                  subLabel="Supported: PDF, Images"
                  previews={[
                    ...(proofImage ? [{
                      url: URL.createObjectURL(proofImage),
                      onRemove: () => setProofImage(null)
                    }] : selectedExpense?.image ? [{
                      url: assetUrl(selectedExpense.image),
                      onRemove: () => {}
                    }] : [])
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              onClick={handleCloseModal}
              disabled={formLoading}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formLoading}
              isLoading={formLoading}
              variant="primary"
            >
              {formLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
