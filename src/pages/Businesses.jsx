import React, { useCallback, useEffect, useState } from 'react'
import { Briefcase, MapPin, Phone, Globe, Trash2, Search, Edit2, RefreshCw, Plus, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api, { assetUrl, getBusinessesList } from '../lib/api'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import BusinessForm from '../components/BusinessForm'
import usePagination from '../hooks/usePagination'

const limit = 10

export default function Businesses() {
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const { page, totalPages, total, setPage, setPaginationData, getParams, resetPage } = usePagination(limit)
  const [loading, setLoading] = useState(false)
  const [search, setSearchValue] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const currentPage = Math.min(Math.max(page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const fetchBusinesses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getBusinessesList(getParams({ search }))
      const rows = res.data?.data || res.data || []
      const pg = res.data?.pagination || {}
      setBusinesses(Array.isArray(rows) ? rows : [])
      setPaginationData(pg)
    } catch (err) {
      setBusinesses([])
      setPaginationData({ page: 1, totalPages: 1, total: 0 })
      setError(err.response?.data?.message || 'Failed to load businesses')
    } finally {
      setLoading(false)
    }
  }, [page, search, , getParams, setPaginationData])

  useEffect(() => {
    fetchBusinesses()
  }, [fetchBusinesses])

  const setSearch = (value) => {
    setSearchValue(value)
    resetPage()
  }

  const handleDelete = async (id) => {
    if (!await confirm('Are you sure you want to delete this business listing?')) return
    try {
      await api.delete(`/businesses/${id}`)
      await fetchBusinesses()
      setSuccess('Business listing deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to delete business listing')
    }
  }

  const handleEdit = (business) => {
    setSelectedBusiness(business)
    setIsModalOpen(true)
  }

  const handleView = (business) => {
    navigate(`/businesses/${business.id}`, { state: { business } })
  }

  const handleCreate = () => {
    setSelectedBusiness(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedBusiness(null)
  }
  
  const handleSubmit = async (formData) => {
    setFormLoading(true)
    setError('')
    try {
      const payload = new FormData()

      // Append all text fields
      const textFields = [
        'business_category_id','business_name','number','whatsapp_number',
        'GST_number','email','country_id','state_id','city_id','address',
        'location_link','about_us','website','facebook','instagram',
        'pinterest','youtube','status'
      ]
      textFields.forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          payload.append(key, formData[key])
        }
      })

      // Profile image — multer field name is 'image'
      if (formData.image instanceof File) {
        payload.append('image', formData.image)
      } else {
        payload.append('existing_image', formData.image || '')
      }

      // Gallery images — append as gallery_image_1, gallery_image_2, ...
      const galleryFiles = (formData.gallery_images || []).filter(f => f instanceof File)
      galleryFiles.forEach((file, idx) => {
        payload.append(`gallery_image_${idx + 1}`, file)
      })

      // Keep existing images (URLs that are strings)
      const existingImages = (formData.gallery_images || []).filter(f => typeof f === 'string' && f.trim())
      existingImages.forEach(img => {
        payload.append('existing_images', img)
      })

      let res;
      if (selectedBusiness) {
        res = await api.put(`/businesses/${selectedBusiness.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        res = await api.post('/businesses', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      const savedData = res.data?.data || res.data;
      await fetchBusinesses()

      setSuccess(`Business listing ${selectedBusiness ? 'updated' : 'created'} successfully`)
      setIsModalOpen(false)
      setSelectedBusiness(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update business listing')
      console.error(err)
    } finally {
      setFormLoading(false)
    }
  }

  const filtered = businesses

  return (
  <div className="space-y-6 animate-slide-up text-text">
    {/* Header bar */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-text">Business Directory</h2>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          onClick={fetchBusinesses}
          className="flex items-center justify-center p-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-text-secondary hover:text-text transition-all"
          title="Refresh listings"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-glow-primary"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
       
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-text-secondary/60" />
          <input
            type="search"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50"
          />
        </div>
      </div>
    </div>

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

    {/* Main List */}
    {loading ? (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin"></div>
        <span className="text-text-secondary text-sm">Querying businesses directory...</span>
      </div>
    ) : filtered.length === 0 ? (
      <div className="bg-card border border-border rounded-2xl p-16 text-center shadow-glass-sm flex flex-col items-center justify-center gap-4">
        <Briefcase className="w-12 h-12 text-text-secondary/40 animate-pulse-slow" />
        <div>
          <h4 className="font-semibold text-text">No businesses found</h4>
          <p className="text-text-secondary text-sm mt-1">There are no business directories registered under this search criteria</p>
        </div>
      </div>
    ) : (
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-glass-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-text-secondary text-sm font-semibold tracking-wider">
                <th className="p-4">Business</th>
                <th className="p-4">Category</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Address</th>
                <th className="p-4">Website</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((biz) => (
                <tr key={biz.id} className="hover:bg-surface-secondary/40 text-sm text-text">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {biz.image ? (
                        <img src={biz.image} alt={biz.business_name}
                          className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-surface-secondary border border-border flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4 text-text-secondary" />
                        </div>
                      )}
                      <span className="font-semibold">{biz.business_name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                      {biz.business_category_name || '—'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-text-secondary text-xs">{biz.number}</td>
                  <td className="p-4 text-text-secondary max-w-[160px] truncate">{biz.address}</td>
                  <td className="p-4">
                    {biz.website ? (
                      <a href={biz.website} target="_blank" rel="noopener noreferrer"
                        className="text-primary hover:underline font-mono text-xs truncate max-w-[120px] inline-block">
                        {biz.website.replace(/^https?:\/\//i, '')}
                      </a>
                    ) : <span className="text-text-secondary text-xs">—</span>}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                      Number(biz.status) === 1
                        ? 'bg-success-bg border-success-border text-success-text'
                        : 'bg-surface-secondary text-text-secondary border-border'
                    }`}>
                      {Number(biz.status) === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleView(biz)}
                        className="p-2 text-text hover:text-black bg-white hover:bg-surface-secondary border border-border rounded-xl transition-all"
                        title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleEdit(biz)}
                        className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl"
                        title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(biz.id)}
                        className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl"
                        title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Pagination — identical to Students */}
    {totalPages > 1 && (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border border-border bg-surface-secondary/40 rounded-xl text-sm">
        <span className="text-text-secondary">
          Page {page} of {totalPages} {total ? `(${total} total)` : ''}
        </span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={loading || page <= 1} onClick={() => setPage((c) => Math.max(1, c - 1))}
            className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          {pageNumbers.map((item) => (
            <button key={item} type="button" disabled={loading || item === currentPage} onClick={() => setPage(item)}
              className={`min-w-10 px-3 py-2 rounded-lg border transition-all ${
                item === currentPage
                  ? 'border-primary bg-primary/10 text-primary font-semibold disabled:opacity-100 disabled:cursor-default'
                  : 'border-border bg-card text-text hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed'
              }`}>
              {item}
            </button>
          ))}
          <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
            className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </button>
        </div>
      </div>
    )}

    <Modal
      isOpen={isModalOpen}
      title={selectedBusiness ? 'Edit Business Listing' : 'Add Business Listing'}
      onClose={handleCloseModal}
    >
      <BusinessForm business={selectedBusiness} onSubmit={handleSubmit} isLoading={formLoading} />
    </Modal>
  </div>
)
}
