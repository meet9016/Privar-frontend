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
  Eye
} from 'lucide-react'
import api, { getExpensesList, exportExpensesExcel, getCommitteeMembersList, assetUrl } from '../lib/api'
import { confirm } from '../lib/confirm'
import usePagination from '../hooks/usePagination'
import Modal from '../components/Modal'
import DatePicker from '../components/DatePicker'

const limit = 10
const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-shadow'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const { page, totalPages, total, setPage, setPaginationData, getParams, resetPage } = usePagination(limit)
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

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    expense_category_id: '',
    expense_category_name: '',
    committee_member_id: '',
    committee_member_name: '',
    amount: '',
    description: ''
  })

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
      setSuccess('Expense deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to delete expense')
    }
  }

  const handleEdit = (expense) => {
    setSelectedExpense(expense)
    setFormData({
      date: expense.date || '',
      expense_category_id: expense.expense_category_id || '',
      expense_category_name: expense.expense_category_name || '',
      committee_member_id: expense.committee_member_id || '',
      committee_member_name: expense.committee_member_name || '',
      amount: expense.amount || '',
      description: expense.description || ''
    })
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
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedExpense(null)
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
    if (!formData.date || !formData.amount) {
      setError('Date and Amount are required.')
      setTimeout(() => setError(''), 3000)
      return
    }

    setFormLoading(true)
    setError('')
    try {
      const payload = new FormData(e.target)
      payload.append('expense_category_name', formData.expense_category_name)
      payload.append('committee_member_name', formData.committee_member_name)
      
      if (selectedExpense) {
        await api.put(`/expenses/${selectedExpense.id}`, payload)
        setSuccess('Expense updated successfully')
      } else {
        await api.post('/expenses', payload)
        setSuccess('Expense added successfully')
      }
      handleCloseModal()
      await fetchExpenses()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense')
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
          <button
            onClick={fetchExpenses}
            className="p-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-text-secondary hover:text-text transition-all shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <div className="w-full sm:w-auto flex-none">
            <DatePicker
              mode="month"
              value={monthFilter}
              onChange={handleMonthFilterChange}
              placeholder="Month"
              className="w-full sm:w-32 bg-input-bg text-text border border-border rounded-xl py-2 px-3 text-sm outline-none focus:border-primary/50 shadow-sm"
            />
          </div>

          <button
            onClick={handleExport}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border text-text-secondary hover:text-text transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleCreate}
            className="w-full sm:w-auto flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-glow-primary"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-glass-sm p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-text-secondary/60" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search expenses by description or category..."
              className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50 transition-shadow"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-surface-secondary hover:bg-surface border border-border text-text font-medium rounded-xl text-sm transition-all shadow-sm"
          >
            Search
          </button>
        </form>
      </div>

      {error && <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-2xl text-sm font-medium animate-fade-in">{error}</div>}
      {success && <div className="bg-success-bg border border-success-border text-success-text p-4 rounded-2xl text-sm font-medium animate-fade-in">{success}</div>}

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-glass-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50 text-text-secondary text-sm font-semibold tracking-wider">
                <th className="p-4 py-3">Date</th>
                <th className="p-4 py-3">Category</th>
                <th className="p-4 py-3">Committee Member</th>
                <th className="p-4 py-3">Description</th>
                <th className="p-4 py-3">Proof</th>
                <th className="p-4 py-3 text-right">Amount</th>
                <th className="p-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-sm text-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin"></div>
                      <span>Loading expenses...</span>
                    </div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-sm text-text-secondary">No expenses found</td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-surface-secondary/40 transition-colors text-sm text-text group">
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-text-secondary/60" />
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-secondary border border-border">
                        {expense.expense_category_name || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      {expense.committee_member_name ? (
                        <div className="flex items-center gap-2">
                          <User2 className="w-4 h-4 text-text-secondary/60" />
                          {expense.committee_member_name}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="p-4 max-w-xs truncate" title={expense.description}>
                      {expense.description || '-'}
                    </td>
                    <td className="p-4 max-w-[100px]">
                      {expense.image ? (
                        <a href={assetUrl(expense.image)} target="_blank" rel="noopener noreferrer" className="relative inline-block hover:opacity-80 transition-opacity" title="View Proof">
                          {expense.image.toLowerCase().endsWith('.pdf') ? (
                             <div className="h-12 w-16 flex justify-center items-center rounded-lg border border-border bg-primary/10 text-primary">
                               <Paperclip className="w-5 h-5" />
                             </div>
                          ) : (
                             <img src={assetUrl(expense.image)} alt="Proof" className="h-12 w-16 rounded-lg object-cover border border-border" />
                          )}
                        </a>
                      ) : (
                        <span className="text-text-secondary/50 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold text-text tabular-nums">
                        ₹{expense.amount.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(expense)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border bg-surface-secondary/40 text-sm">
            <span className="text-text-secondary">
              Page {page} of {totalPages} {total ? `(${total} total)` : ''}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 hover:bg-surface transition-colors">
                Previous
              </button>
              {pageNumbers.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={loading || item === currentPage}
                  onClick={() => setPage(item)}
                  className={`min-w-[40px] px-3 py-2 rounded-lg border transition-all ${
                    item === currentPage
                      ? 'border-primary bg-primary/10 text-primary font-semibold disabled:opacity-100 disabled:cursor-default shadow-sm'
                      : 'border-border bg-card text-text hover:bg-surface-secondary disabled:opacity-50'
                  }`}
                >
                  {item}
                </button>
              ))}
              <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 hover:bg-surface transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} title={selectedExpense ? 'Edit Expense' : 'Add Expense'} onClose={handleCloseModal}>
        <form onSubmit={handleSubmit} className="space-y-4 text-text">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Date <span className="text-red-500">*</span></label>
              <DatePicker
                name="date"
                mode="date"
                value={formData.date}
                onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
                className={fieldClass}
                disabled={formLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Amount (₹) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="amount"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                required
                placeholder="0.00"
                className={fieldClass}
                disabled={formLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Expense Category</label>
              <select
                name="expense_category_id"
                value={formData.expense_category_id}
                onChange={handleChange}
                className={fieldClass}
                disabled={formLoading}
              >
                <option value="" className="bg-surface text-text">Select Category</option>
                {expenseCategories.map(cat => (
                  <option key={cat.id || cat._id} value={cat.id || String(cat._id)} className="bg-surface text-text">
                    {cat.name || cat.title || cat.category || 'Unnamed'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Committee Member</label>
              <select
                name="committee_member_id"
                value={formData.committee_member_id}
                onChange={handleChange}
                className={fieldClass}
                disabled={formLoading}
              >
                <option value="" className="bg-surface text-text">Select Member</option>
                {committeeMembers.map(member => (
                  <option key={member.id || member._id} value={member.id || String(member._id)} className="bg-surface text-text">
                    {member.first_name} {member.middle_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Expense description or purpose..."
                rows="3"
                className={`${fieldClass} resize-none`}
                disabled={formLoading}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Proof / Receipt (Optional)</label>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  name="image"
                  accept="image/*,application/pdf"
                  className="w-full text-sm text-text file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer bg-input-bg border border-border rounded-xl px-3 py-2 outline-none focus:border-primary/50"
                  disabled={formLoading}
                />
                {selectedExpense?.image && (
                  <p className="text-xs text-text-secondary">
                    Current file: <a href={assetUrl(selectedExpense.image)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1"><Paperclip className="w-3 h-3" /> View attached proof</a>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={formLoading}
              className="px-5 py-2.5 rounded-xl border border-border bg-surface-secondary text-text font-medium hover:bg-surface transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all shadow-glow-primary disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
