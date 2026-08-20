import React, { useCallback, useEffect, useState } from 'react'
import { Briefcase, MapPin, Phone, Globe, Trash2, Search, Edit2, RefreshCw, Plus, Eye, Mail, Instagram, Youtube, Facebook } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import api, { assetUrl, getBusinessesList } from '../lib/api'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import Loader from '../components/common/Loader'
import BusinessForm from '../components/BusinessForm'
import usePagination from '../hooks/usePagination'
import Table from '../components/common/Table'
import Button from '../components/common/Button'
import { toast } from '../lib/toast'
import useDebounce from '../hooks/useDebounce'

export default function Businesses() {
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(10)
  const [loading, setLoading] = useState(false)
  const [search, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewBusiness, setViewBusiness] = useState(null)
  const location = useLocation()

  useEffect(() => {
    if (location.state?.editItem) {
      setSelectedBusiness(location.state.editItem)
      setIsModalOpen(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, navigate, location.pathname])

  const currentPage = Math.min(Math.max(page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const fetchBusinesses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getBusinessesList(getParams({ search: debouncedSearch }))
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
  }, [page, debouncedSearch, getParams, setPaginationData])

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
      toast.success('Business listing deleted successfully')
    } catch (err) {
      toast.error('Failed to delete business listing')
    }
  }

  const handleToggleStatus = async (biz) => {
    const currentStatus = Number(biz.status ?? 1);
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      await api.put(`/businesses/${biz._id || biz.id}`, {
        ...biz,
        status: newStatus
      });
      setBusinesses(prev => prev.map(b => (b._id === biz._id || b.id === biz.id) ? { ...b, status: newStatus } : b));
      toast.success(`Business status updated to ${newStatus === 1 ? 'Active' : 'Inactive'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleEdit = (business) => {
    setSelectedBusiness(business)
    setIsModalOpen(true)
  }

  const handleView = (business) => {
    setViewBusiness(business)
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

      toast.success(`Business listing ${selectedBusiness ? 'updated' : 'created'} successfully`)
      setIsModalOpen(false)
      setSelectedBusiness(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update business listing')
      console.error(err)
    } finally {
      setFormLoading(false)
    }
  }

  const filtered = businesses

  return (
  <div className="space-y-6 text-text">
    {/* Header bar */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-text">Business Directory</h2>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary/60">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 bg-input-bg text-text placeholder-text-secondary/50 border border-border focus:border-primary/50 rounded-xl pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-colors"
          />
        </div>
        <Button
          onClick={handleCreate}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          className="h-10"
        >
          Add Business
        </Button>
      </div>
    </div>

    {/* Main List */}
    <Table
        columns={[
          {
            header: 'Business',
            key: 'business',
            render: (biz) => (
              <div className="flex items-center gap-3">
                {biz.image ? (
                  <img src={biz.image} alt={biz.business_name} className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-surface-secondary border border-border flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-text-secondary" />
                  </div>
                )}
                <span className="font-semibold">{biz.business_name}</span>
              </div>
            )
          },
          {
            header: 'Category',
            key: 'category',
            render: (biz) => (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                {biz.business_category_name || '—'}
              </span>
            )
          },
          {
            header: 'Phone',
            key: 'phone',
            render: (biz) => <span className="font-mono text-text-secondary text-xs">{biz.number}</span>
          },
          {
            header: 'Address',
            key: 'address',
            render: (biz) => <span className="text-text-secondary max-w-[160px] truncate block" title={biz.address}>{biz.address}</span>
          },
          {
            header: 'Website',
            key: 'website',
            render: (biz) => (
              biz.website ? (
                <a href={biz.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-xs truncate max-w-[120px] inline-block">
                  {biz.website.replace(/^https?:\/\//i, '')}
                </a>
              ) : <span className="text-text-secondary text-xs">—</span> 
            )
          },
          {
            header: 'Status',
            key: 'status',
            render: (biz) => (
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Number(biz.status ?? 1) === 1}
                    onChange={() => handleToggleStatus(biz)}
                  />
                  <div className="w-9 h-5 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            )
          },
          {
            header: 'Actions',
            key: 'actions',
            align: 'left',
            render: biz => ( <div className="flex items-center justify-start gap-2">
                <button onClick={() => handleView(biz)} className="p-2 text-text hover:text-black bg-white hover:bg-surface-secondary border border-border rounded-xl transition-all" title="View">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleEdit(biz)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(biz.id)} className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }
        ]}
        data={filtered}
        keyField="id"
        loading={loading}
        emptyState={{
          icon: Briefcase,
          title: 'No businesses found',
          description: 'There are no business directories registered under this search criteria'
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

    <Modal isOpen={isModalOpen} maxWidth="max-w-6xl" title={selectedBusiness ? 'Edit Business Directory' : 'Add New Business Directory'} onClose={() => setIsModalOpen(false)}>
      <BusinessForm business={selectedBusiness} onSubmit={handleSubmit} isLoading={formLoading} onCancel={() => setIsModalOpen(false)} />
    </Modal>

    <Modal isOpen={!!viewBusiness} maxWidth="max-w-xl" title="Business Details" onClose={() => setViewBusiness(null)}>
      {viewBusiness && (
        <div className="space-y-0 text-sm text-text divide-y divide-border">
          <div className="flex items-center gap-4 pb-4">
            {viewBusiness.image ? (
              <img src={viewBusiness.image} alt={viewBusiness.business_name} className="w-16 h-16 rounded-xl object-cover border border-border shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-surface-secondary border border-border flex items-center justify-center shrink-0">
                <Briefcase className="w-7 h-7 text-text-secondary" />
              </div>
            )}
            <div>
              <div className="font-bold text-base text-text">{viewBusiness.business_name}</div>
              <div className="text-xs text-primary font-medium mt-0.5">{viewBusiness.business_category_name || '—'}</div>
            </div>
          </div>
          {[
            ['Phone', viewBusiness.number],
            ['WhatsApp', viewBusiness.whatsapp_number],
            ['Email', viewBusiness.email],
            ['GST Number', viewBusiness.GST_number],
            ['Address', viewBusiness.address],
            ['Website', viewBusiness.website],
            ['Facebook', viewBusiness.facebook],
            ['Instagram', viewBusiness.instagram],
            ['YouTube', viewBusiness.youtube],
            ['About', viewBusiness.about_us],
            ['Status', Number(viewBusiness.status) === 1 ? 'Active' : 'Inactive'],
          ].filter(([, val]) => val).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-3">
              <span className="font-semibold text-text-secondary shrink-0">{label}</span>
              <span className="text-right text-text break-words max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  </div>
)
}



