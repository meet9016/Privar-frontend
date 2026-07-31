import React, { useCallback, useEffect, useState } from 'react'
import {
  HeartHandshake,
  Trash2,
  Search,
  Edit2,
  RefreshCw,
  Plus,
  IndianRupee,
  MapPin,
  CalendarDays,
  User2,
  Copy,
  Landmark,
  FileDown
} from 'lucide-react'
import api, { getDonationsList, getBankDetailsList, exportDonationsExcel } from '../lib/api'
import { confirm } from '../lib/confirm'
import usePagination from '../hooks/usePagination'
import Modal from '../components/Modal'
import Loader from '../components/common/Loader'
import DatePicker from '../components/DatePicker'
import Table from '../components/common/Table'

import { Download } from 'lucide-react'
export default function Donations() {
  const [donations, setDonations] = useState([])
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(10)
  const [loading, setLoading] = useState(false)
  const [bankDetails, setBankDetails] = useState([])

  const [formLoading, setFormLoading] = useState(false)
  const [dateValue, setDateValue] = useState(new Date().toISOString().slice(0, 10))
  const [filters, setFilters] = useState({
    donator_name: '',
    donation_purpose: ''
  })

  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')


  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedDonation, setSelectedDonation] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchDonations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDonationsList(getParams({ search: activeSearch }))
      const rows = res.data?.data || res.data || []
      const pg = res.data?.pagination || {}
      setDonations(Array.isArray(rows) ? rows : [])
      setPaginationData(pg)
    } catch (err) {
      setDonations([])
      setPaginationData({ page: 1, totalPages: 1, total: 0 })
      setError(err.response?.data?.message || 'Failed to load donations')
    } finally {
      setLoading(false)
    }
  }, [activeSearch, page])


  useEffect(() => {
    fetchDonations()
  }, [fetchDonations])

  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        const res = await getBankDetailsList({ limit: 100 })
        setBankDetails(res.data?.data || res.data || [])
      } catch (err) {
        console.error('Failed to load bank details', err)
      }
    }
    fetchBankDetails()
  }, [])

  const handleDelete = async (id) => {
    if (!await confirm('Are you sure you want to delete this donation?')) return
    try {
      await api.delete(`/donations/${id}`)
      await fetchDonations()
      setSuccess('Donation deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to delete donation')
    }
  }

  const handleEdit = (donation) => {
    setSelectedDonation(donation)
    setDateValue(donation.date || new Date().toISOString().slice(0, 10))
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedDonation(null)
    setDateValue(new Date().toISOString().slice(0, 10))
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDonation(null)
  }

  const handleSubmit = async (e) => {

    e.preventDefault()
    setFormLoading(true)
    setError('')
    if (!selectedDonation) {
      if (!e.target.donator_name.value || !e.target.donate_amount.value || !e.target.donation_purpose.value || !e.target.date.value) {
        setError('All fields are required')
        setFormLoading(false)
        return
      }
    }
    if (!e.target.donator_name.value || !e.target.donation_purpose.value || !e.target.date.value) {
      setError('All fields are required')
      setFormLoading(false)
      return
    }
    const formData = new FormData(e.target)

    try {
      if (selectedDonation) {

        await api.put(`/donations/${selectedDonation.id}`, formData)
      } else {

        await api.post('/donations', formData)
      }
      await fetchDonations()
      setSuccess(`Donation ${selectedDonation ? 'updated' : 'created'} successfully`)
      setIsModalOpen(false)
      setSelectedDonation(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save donation')
    } finally {
      setFormLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const applyFilters = () => { setActiveSearch(search); resetPage() }
  const resetFilters = () => { setSearch(''); setActiveSearch(''); resetPage() }


  const currentPage = Math.min(Math.max(page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)

  const totalAmount = donations.reduce((sum, d) => sum + Number(d.donate_amount || 0), 0)

  const handleExport = async () => {
    try {
      const res = await exportDonationsExcel(activeSearch)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'donations.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Failed to export donations')
    }
  }
  return (
    <div className="space-y-6 animate-slide-up text-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Donations</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="w-64 sm:w-72">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-text-secondary/60" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); applyFilters(); }}
                placeholder="Search donator or purpose..."
                className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-primary/50"
              />
            </div>
          </div>
          <button
            onClick={fetchDonations}
            className="flex items-center justify-center p-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-text-secondary hover:text-text transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-glow-primary"
          >
            <Plus className="w-4 h-4" /> Add Donation
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-surface-secondary hover:bg-surface border border-border text-text px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary Card */}
      {donations.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-success-bg border border-success-border rounded-2xl p-4">
            <p className="text-success-text text-sm font-semibold tracking-wider mb-1">Total Collected</p>
            <p className="text-text text-lg font-semibold">{formatAmount(totalAmount)}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-text-secondary text-sm font-semibold tracking-wider mb-1">Total Donors</p>
            <p className="text-text text-lg font-semibold">{donations.length}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 col-span-2 sm:col-span-1">
            <p className="text-text-secondary text-sm font-semibold tracking-wider mb-1">Avg Donation</p>
            <p className="text-text text-lg font-semibold">{formatAmount(totalAmount / donations.length)}</p>
          </div>
        </div>
      )}

      {/* Bank Details Display */}
      {bankDetails.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-glass-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Landmark className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text text-base">Donation Bank Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankDetails.map((bank) => (
              <div key={bank.id} className="p-4 rounded-xl bg-surface border border-border hover:border-primary/40 transition-all flex flex-col justify-between gap-3 relative shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      <h4 className="font-bold text-primary text-sm truncate">{bank.bank_name}</h4>
                    </div>
                    {bank.account_name && (
                      <p className="text-xs text-text-secondary">
                        <span className="font-semibold text-text">Name:</span> {bank.account_name}
                      </p>
                    )}
                    <p className="text-xs text-text-secondary flex items-center gap-1.5">
                      <span className="font-semibold text-text">A/c No:</span> {bank.account_number}
                      {bank.account_number && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(bank.account_number)
                            setSuccess('A/c Number copied!')
                            setTimeout(() => setSuccess(''), 3000)
                          }}
                          className="p-1 hover:bg-surface-secondary rounded text-text-secondary hover:text-primary transition-colors"
                          title="Copy A/c Number"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </p>
                    <p className="text-xs text-text-secondary">
                      <span className="font-semibold text-text">IFSC:</span> {bank.ifsc_code}
                    </p>
                    <p className="text-xs text-text-secondary">
                      <span className="font-semibold text-text">Branch:</span> {bank.branch}
                    </p>
                    {bank.upi_link && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/60 text-xs">
                        <span className="font-semibold text-text">UPI:</span>
                        <span className="truncate font-mono text-primary font-medium">{bank.upi_link}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(bank.upi_link)
                            setSuccess('UPI ID copied!')
                            setTimeout(() => setSuccess(''), 3000)
                          }}
                          className="p-1 hover:bg-surface-secondary rounded text-primary transition-colors ml-auto"
                          title="Copy UPI ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {bank.qr_code && (
                    <div className="w-20 h-20 shrink-0 bg-white rounded-lg p-1 border border-border shadow-sm flex items-center justify-center">
                      <img src={bank.qr_code.startsWith('http') ? bank.qr_code : `http://localhost:5000${bank.qr_code}`} alt="QR Code" className="w-full h-full object-contain rounded" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-2xl text-sm flex items-center gap-2 animate-fade-in shadow-sm">
          <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
          {error}
        </div>
      )}
      {success && (
        <div className="bg-success-bg border border-success-border text-success-text p-4 rounded-2xl text-sm flex items-center gap-2 animate-fade-in shadow-sm">
          <span className="w-2 h-2 rounded-full bg-success animate-ping"></span>
          {success}
        </div>
      )}

      {/* Donation Cards Grid */}
      {loading && donations.length === 0 ? (
        <div className="py-20"><Loader text="Loading donations..." /></div>
      ) : (
        <Table
          columns={[
            {
              header: 'Donator',
              key: 'donator',
              render: (donation) => <span className="font-semibold">{donation.donator_name || '-'}</span>
            },
            {
              header: 'Amount',
              key: 'amount',
              render: (donation) => (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success/10 border border-success/20 text-success font-semibold text-sm">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {Number(donation.donate_amount || 0).toLocaleString('en-IN')}
                </span>
              )
            },
            {
              header: 'Purpose',
              key: 'purpose',
              render: (donation) => (
                <div className="text-text-secondary max-w-xs">
                  <div className="line-clamp-2 italic">"{(donation.donation_purpose || '-').slice(0, 60)}"</div>
                </div>
              )
            },
            {
              header: 'Date',
              key: 'date',
              render: (donation) => (
                <div className="flex items-center gap-1.5 whitespace-nowrap text-text-secondary">
                  <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
                  {donation.date || '-'}
                </div>
              )
            },
            {
              header: 'Status',
              key: 'status',
              render: (donation) => (
                <span className={`inline-flex px-2.5 py-1 rounded-lg border text-sm font-semibold ${Number(donation.status) === 1
                  ? 'bg-success-bg border-success-border text-success-text'
                  : 'bg-surface-secondary border-border text-text-secondary'
                  }`}>
                  {Number(donation.status) === 1 ? 'Active' : 'Inactive'}
                </span>
              )
            },
            {
              header: 'Actions',
              key: 'actions',
              align: 'right',
              render: (donation) => (
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => handleEdit(donation)}
                    className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(donation.id)}
                    className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            }
          ]}
          data={donations}
          keyField="id"
          loading={loading}
          emptyState={{
            icon: Landmark,
            title: 'No donations found',
            description: 'There are no donation records matching your criteria'
          }}
          pagination={{
            currentPage: page,
            totalPages,
            total,
            pageNumbers,
            loading,
            onPageChange: setPage,
            limit,
            onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1); }
          }}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        title={selectedDonation ? 'Edit Donation' : 'Add Donation'}
        onClose={handleCloseModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-text">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Donator Name *</label>
              <input
                type="text"
                name="donator_name"
                defaultValue={selectedDonation?.donator_name || ''}
                required
                placeholder="Enter donator's full name"
                className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Donation Amount (₹) *</label>
              <input
                type="number"
                name="donate_amount"
                defaultValue={selectedDonation?.donate_amount || ''}
                required
                min="0"
                step="1"
                placeholder="Enter amount"
                className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
              />
            </div>
          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Donation Purpose *</label>
              <input
                type="text"
                name="donation_purpose"
                defaultValue={selectedDonation?.donation_purpose || ''}
                required
                placeholder="e.g. Temple renovation, Food drive..."
                className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Date *</label>
              <DatePicker
                name="date"
                mode="date"
                value={dateValue}
                onChange={setDateValue}
                className="w-full bg-input-bg text-text border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
              />
            </div>

          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 bg-surface-secondary hover:bg-surface text-text px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-glow-primary"
            >
              {formLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
