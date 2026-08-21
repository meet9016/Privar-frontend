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
  Receipt,
  Filter,
  X
} from 'lucide-react'
import api, { getExpensesList, exportExpensesExcel, getCommitteeMembersList, assetUrl, formatDate } from '../lib/api'
import usePagination from '../hooks/usePagination'
import usePermissions from '../hooks/usePermissions'
import Modal from '../components/Modal'
import FileDropzone from '../components/common/FileDropzone'
import Loader from '../components/common/Loader'
import DatePicker from '../components/DatePicker'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import SearchInput from '../components/common/SearchInput'
import { toast } from '../lib/toast'
import useDebounce from '../hooks/useDebounce'

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-shadow'

export default function Expenses() {
  const permissions = usePermissions('expenses')
  const [expenses, setExpenses] = useState([])
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(15)
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [filters, setFilters] = useState({ month: '', category: '' })
  const [draftFilters, setDraftFilters] = useState({ month: '', category: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Data for dropdowns
  const [committeeMembers, setCommitteeMembers] = useState([])
  const [expenseCategories, setExpenseCategories] = useState([])

  const [selectedExpense, setSelectedExpense] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [proofImage, setProofImage] = useState(null)

  const [removeImage, setRemoveImage] = useState(false)

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
    setError('')
    try {
      const params = getParams({ search: debouncedSearch })
      if (filters.month) params.month = filters.month
      if (filters.category) params.category = filters.category
      
      const res = await getExpensesList(params)
      const data = res.data?.data || []
      const pagination = res.data?.pagination || {}
      setExpenses(data)
      setPaginationData(pagination)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, filters, page, getParams, setPaginationData])

  const fetchDropdownData = async () => {
    try {
      const [membersRes, categoriesRes] = await Promise.all([
        getCommitteeMembersList({ limit: 1000 }),
        api.get('/masters/expense-category', { params: { limit: 1000 } })
      ])
      
      setCommitteeMembers(membersRes.data?.data || membersRes.data || [])
      setExpenseCategories(categoriesRes.data?.data || categoriesRes.data || [])
    } catch (err) {
      console.error('Failed to load dropdown options', err)
    }
  }

  useEffect(() => {
    fetchDropdownData()
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const handleDelete = async (id) => {
    if (!await confirm('Are you sure you want to delete this expense record?')) return
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
    setRemoveImage(false)
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
    setRemoveImage(false)
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedExpense(null)
    setProofImage(null)
    setRemoveImage(false)
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
    if (!proofImage && (!selectedExpense || !selectedExpense.image || removeImage)) {
      errors.proof = 'Proof / Receipt is required'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFormLoading(true)
    try {
      const payload = new FormData()
      payload.append('date', formData.date)
      payload.append('amount', formData.amount)
      payload.append('expense_category_id', formData.expense_category_id)
      payload.append('expense_category_name', formData.expense_category_name)
      payload.append('committee_member_id', formData.committee_member_id)
      payload.append('committee_member_name', formData.committee_member_name)
      payload.append('description', formData.description || '')
      
      if (proofImage) {
        payload.append('image', proofImage)
      }
      if (removeImage) {
        payload.append('remove_image', 'true')
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
      if (debouncedSearch) params.search = debouncedSearch
      if (filters.month) params.month = filters.month
      if (filters.category) params.category = filters.category
      
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
    resetPage()
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
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
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            onClear={() => {
              setSearch('')
              setPage(1)
            }}
            placeholder="Search expenses..."
            wrapperClassName="w-64 sm:w-72"
          />
          <div className="relative z-30">
            <button
              type="button"
              onClick={() => {
                setDraftFilters(filters)
                setShowFilters(!showFilters)
              }}
              className={`flex items-center justify-center h-10 px-3 rounded-xl border transition-all cursor-pointer ${showFilters || filters.category || filters.month ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-secondary hover:bg-surface border-border text-text-secondary hover:text-text'}`}
              title="Toggle Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            {showFilters && (
              <>
                <div 
                  className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-40 transition-opacity" 
                  onClick={() => setShowFilters(false)} 
                />
                <div className="absolute right-0 top-full mt-2 w-[320px] bg-surface border border-border rounded-2xl p-4 shadow-xl z-50 animate-fade-in space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-bold uppercase tracking-wider text-text">Filters</span>
                    <button 
                      type="button" 
                      onClick={() => setShowFilters(false)}
                      className="p-1 rounded-lg text-text-secondary hover:bg-surface-secondary cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Select
                      value={draftFilters.category}
                      onChange={(val) => { setDraftFilters(current => ({ ...current, category: val })); }}
                      placeholder="All Categories"
                      searchable={false}
                      options={[
                        { label: 'All Categories', value: '' },
                        ...expenseCategories.map(c => ({ label: c.name || c.category || c.title || c.category_name, value: c.id || c._id }))
                      ]}
                    />
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-text-secondary">Month</label>
                      <DatePicker
                        mode="month"
                        value={draftFilters.month}
                        onChange={(val) => { setDraftFilters(current => ({ ...current, month: val })); }}
                        placeholder="Select Month"
                        className="w-full bg-input-bg text-text border border-border rounded-xl py-2 px-3 text-sm outline-none focus:border-primary/50 shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3 gap-2">
                    <button 
                      type="button" 
                      onClick={() => { 
                        setDraftFilters({ category: '', month: '' }); 
                        setFilters({ category: '', month: '' }); 
                        resetPage(); 
                        setShowFilters(false); 
                      }} 
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-secondary hover:bg-surface border border-border text-text-secondary hover:text-text transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Clear
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { 
                        setFilters(draftFilters); 
                        resetPage(); 
                        setShowFilters(false); 
                      }} 
                      className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-primary hover:bg-primary-hover text-white transition-colors cursor-pointer shadow-xs"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <Button
            onClick={handleExport}
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          {!permissions.canAdd && !permissions.isSuperAdmin ? null : (
            <Button
              onClick={handleCreate}
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Expense
            </Button>
          )}
        </div>
      </div>



      <Table
        columns={[
          {
            header: 'Date',
            key: 'date',
            render: (expense) => (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <CalendarDays className="w-4 h-4 text-text-secondary/60" />
                {formatDate(expense.date)}
              </div>
            )
          },
          {
            header: 'Category',
            key: 'category',
            render: (expense) => {
              const name = expense.expense_category_name || '';
              const colors = [
                'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
                'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
                'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
                'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
                'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
                'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800',
                'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
                'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
              ];
              let hash = 0;
              for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
              const colorClass = name ? colors[Math.abs(hash) % colors.length] : 'bg-surface-secondary text-text-secondary border-border';

              return (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
                  {name || '-'}
                </span>
              );
            }
          },
          {
            header: 'Committee Member',
            key: 'member',
            render: (expense) => {
              if (!expense.committee_member_name) return '-';
              const member = committeeMembers.find(m => String(m.id || m._id) === String(expense.committee_member_id));
              return (
                <div className="flex items-center gap-2">
                  {member?.image ? (
                    <img src={assetUrl(member.image)} alt={expense.committee_member_name} className="w-6 h-6 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <User2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <span className="truncate max-w-[150px]" title={expense.committee_member_name}>{expense.committee_member_name}</span>
                </div>
              );
            }
          },
          {
            header: 'Description',
            key: 'description',
            render: (expense) => (
              <div className="max-w-[200px] truncate" title={expense.description}>
                {expense.description || '-'}
              </div>
            )
          },
          {
            header: 'Amount',
            key: 'amount',
            align: 'left',
            render: (expense) => (
              <span className="font-semibold text-text tabular-nums">
                ₹{Number(expense.amount || 0).toLocaleString('en-IN')}
              </span>
            )
          },
          {
            header: 'Actions',
            key: 'actions',
            align: 'left',
            render: expense => ( <div className="flex items-center justify-start gap-1.5">
                {!permissions.canEdit && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => handleEdit(expense)} className="p-1.5 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-all" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!permissions.canDelete && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-lg transition-all" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
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
          description: 'There are no expense records matching your search criteria',
          actionLabel: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : 'Add Expense',
          onAction: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : handleCreate
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
                    }] : selectedExpense?.image && !removeImage ? [{
                      url: assetUrl(selectedExpense.image),
                      onRemove: () => setRemoveImage(true)
                    }] : [])
                  ]}
                />
                {removeImage && (
                  <span className="text-xs text-error-text font-medium">Receipt image will be removed on save.</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button
              type="button"
              onClick={handleCloseModal}
              disabled={formLoading}
              variant="outline"
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





