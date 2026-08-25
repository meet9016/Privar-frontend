import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Briefcase, MapPin, Phone, Globe, Trash2, Search, Edit2, RefreshCw, Plus, Eye, Mail, Instagram, Youtube, Facebook, Share2 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import api, { assetUrl, formatDate, getBusinessesList } from '../lib/api'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import Loader from '../components/common/Loader'
import BusinessForm from '../components/BusinessForm'
import usePagination from '../hooks/usePagination'
import Table from '../components/common/Table'
import Button from '../components/common/Button'
import SearchInput from '../components/common/SearchInput'
import { toast } from '../lib/toast'
import useDebounce from '../hooks/useDebounce'
import { AuthContext } from '../context/AuthContext'
import usePermissions from '../hooks/usePermissions'

export default function Businesses({ headerLeftContent }) {
  const navigate = useNavigate()
  const { user: currentUser } = useContext(AuthContext)
  const permissions = usePermissions('businesses')
  const [businesses, setBusinesses] = useState([])
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(15)
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
      setBusinesses(
        (Array.isArray(rows) ? rows : []).map(b => ({
          ...b,
          id: b.id || b._id
        }))
      )
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
      setBusinesses(prev => prev.map(b => b.id === (biz.id || biz._id) ? { ...b, status: newStatus } : b));
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
      <div className="flex-1 overflow-x-auto hide-scrollbar">
        {headerLeftContent ? headerLeftContent : (
          <h2 className="text-xl font-semibold text-text">Business Directory</h2>
        )}
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <SearchInput
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        {!permissions.canAdd && !permissions.isSuperAdmin ? null : (
          <Button
            onClick={handleCreate}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            className="h-10"
          >
            Add Business
          </Button>
        )}
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
            render: (biz) => <span className="text-text-secondary text-xs">{biz.number}</span>
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
                <a href={biz.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs truncate max-w-[120px] inline-block">
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
            render: biz => (
              <div className="flex items-center justify-start gap-2">
                <button onClick={() => handleView(biz)} className="p-2 text-text hover:text-black bg-white hover:bg-surface-secondary border border-border rounded-xl transition-all" title="View">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {!permissions.canEdit && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => handleEdit(biz)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!permissions.canDelete && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => handleDelete(biz.id)} className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
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
          description: 'There are no business directories registered under this search criteria',
          actionLabel: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : 'Add Business',
          onAction: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : handleCreate
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

    <Modal isOpen={!!viewBusiness} maxWidth="max-w-4xl" title="Business Profile Details" onClose={() => setViewBusiness(null)}>
      {viewBusiness && (
        <div className="space-y-6 text-sm text-text">
          {/* Header Banner Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-surface to-surface-secondary border border-primary/20 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {viewBusiness.image ? (
                <img
                  src={viewBusiness.image}
                  alt={viewBusiness.business_name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md shrink-0 bg-white"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white border border-border flex items-center justify-center shrink-0 shadow-md">
                  <Briefcase className="w-10 h-10 text-primary/70" />
                </div>
              )}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="font-bold text-2xl text-text tracking-tight">{viewBusiness.business_name}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                    Number(viewBusiness.status) === 1
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${Number(viewBusiness.status) === 1 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {Number(viewBusiness.status) === 1 ? 'Active Listing' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {viewBusiness.business_category_name && (
                    <span className="inline-flex items-center gap-1.5 font-semibold px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <Briefcase className="w-3.5 h-3.5" />
                      {viewBusiness.business_category_name}
                    </span>
                  )}
                  {viewBusiness.GST_number && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-text-secondary px-3 py-1 rounded-lg bg-surface border border-border">
                      GST: <strong className="text-text font-semibold">{viewBusiness.GST_number}</strong>
                    </span>
                  )}
                  {viewBusiness.createdAt && (
                    <span className="inline-flex items-center gap-1 text-text-secondary/80 px-2.5 py-1 text-xs">
                      Registered: {formatDate(viewBusiness.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left Column (2 cols): Contact, Location, About */}
            <div className="md:col-span-2 space-y-4">
              {/* Contact Information Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" /> Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="bg-surface border border-border/80 rounded-xl p-3 shadow-xs hover:border-primary/30 transition-colors">
                    <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block">Primary Phone</span>
                    {viewBusiness.number ? (
                      <a href={`tel:${viewBusiness.number}`} className="font-semibold text-text text-xs hover:text-primary transition-colors flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-text-secondary shrink-0" />
                        <span className="font-mono truncate">{viewBusiness.number}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-text-secondary/60 italic">—</span>
                    )}
                  </div>

                  <div className="bg-surface border border-border/80 rounded-xl p-3 shadow-xs hover:border-primary/30 transition-colors">
                    <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block">WhatsApp</span>
                    {viewBusiness.whatsapp_number ? (
                      <a
                        href={`https://wa.me/${String(viewBusiness.whatsapp_number).replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs hover:underline flex items-center gap-1.5 mt-0.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-mono truncate">{viewBusiness.whatsapp_number}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-text-secondary/60 italic">—</span>
                    )}
                  </div>

                  <div className="bg-surface border border-border/80 rounded-xl p-3 shadow-xs hover:border-primary/30 transition-colors">
                    <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block">Email Address</span>
                    {viewBusiness.email ? (
                      <a href={`mailto:${viewBusiness.email}`} className="font-semibold text-text text-xs hover:text-primary transition-colors flex items-center gap-1.5 mt-0.5 truncate" title={viewBusiness.email}>
                        <Mail className="w-3 h-3 text-text-secondary shrink-0" />
                        <span className="truncate">{viewBusiness.email}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-text-secondary/60 italic">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Location & Address */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> Location & Address Details
                </h4>
                <div className="bg-surface border border-border/80 rounded-xl p-3.5 space-y-2.5 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-text font-medium text-xs sm:text-sm leading-relaxed">{viewBusiness.address || 'No street address specified'}</p>
                      <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="bg-surface-secondary/50 rounded-lg px-2.5 py-1.5 border border-border/40">
                          <span className="text-[9px] text-text-secondary uppercase block font-semibold">City</span>
                          <span className="font-medium text-text text-xs">{viewBusiness.city_name || viewBusiness.city_id?.name || viewBusiness.city || '—'}</span>
                        </div>
                        <div className="bg-surface-secondary/50 rounded-lg px-2.5 py-1.5 border border-border/40">
                          <span className="text-[9px] text-text-secondary uppercase block font-semibold">State</span>
                          <span className="font-medium text-text text-xs">{viewBusiness.state_name || viewBusiness.state_id?.name || viewBusiness.state || '—'}</span>
                        </div>
                        <div className="bg-surface-secondary/50 rounded-lg px-2.5 py-1.5 border border-border/40">
                          <span className="text-[9px] text-text-secondary uppercase block font-semibold">Country</span>
                          <span className="font-medium text-text text-xs">{viewBusiness.country_name || viewBusiness.country_id?.name || viewBusiness.country || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {viewBusiness.location_link && (
                    <div className="pt-1.5 border-t border-border/60">
                      <a
                        href={viewBusiness.location_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <Globe className="w-3.5 h-3.5" /> View on Google Maps / Navigation Link &rarr;
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* About Us */}
              {viewBusiness.about_us && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">About the Business</h4>
                  <div className="bg-surface border border-border/80 rounded-xl p-3 text-text/90 leading-relaxed whitespace-pre-wrap text-xs max-h-24 overflow-y-auto custom-scrollbar shadow-xs">
                    {viewBusiness.about_us}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (1 col): Owner Profile, Social Handles */}
            <div className="space-y-4">
              {/* Registered Member / Owner Card */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" /> Listed By Member
                </h4>
                <div className="bg-surface border border-border/80 rounded-xl p-3 shadow-xs space-y-2">
                  <div className="flex items-center gap-2.5">
                    {viewBusiness.owner_image ? (
                      <img src={viewBusiness.owner_image} alt={viewBusiness.owner_name} className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                        {(viewBusiness.owner_name || 'M').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-text text-xs truncate">{viewBusiness.owner_name || 'Community Member'}</div>
                      <div className="text-[10px] text-text-secondary">ID: {viewBusiness.member_id || '—'}</div>
                    </div>
                  </div>
                  {(viewBusiness.owner_phone || viewBusiness.owner_email) && (
                    <div className="pt-1.5 border-t border-border/50 space-y-1 text-xs text-text-secondary">
                      {viewBusiness.owner_phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 shrink-0 text-text-secondary" />
                          <span className="font-mono text-text text-[11px]">{viewBusiness.owner_phone}</span>
                        </div>
                      )}
                      {viewBusiness.owner_email && (
                        <div className="flex items-center gap-1.5 truncate" title={viewBusiness.owner_email}>
                          <Mail className="w-3 h-3 shrink-0 text-text-secondary" />
                          <span className="text-text text-[11px] truncate">{viewBusiness.owner_email}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Online & Social Media Links */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" /> Social & Web Links
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {viewBusiness.website ? (
                    <a
                      href={viewBusiness.website.startsWith('http') ? viewBusiness.website : `https://${viewBusiness.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-[11px] font-semibold text-text hover:text-primary transition-all shadow-xs truncate"
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">Website</span>
                    </a>
                  ) : null}

                  {viewBusiness.facebook ? (
                    <a
                      href={viewBusiness.facebook.startsWith('http') ? viewBusiness.facebook : `https://${viewBusiness.facebook}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-[11px] font-semibold text-text hover:text-blue-600 transition-all shadow-xs truncate"
                    >
                      <Facebook className="w-3.5 h-3.5 text-[#1877F2] shrink-0" />
                      <span className="truncate">Facebook</span>
                    </a>
                  ) : null}

                  {viewBusiness.instagram ? (
                    <a
                      href={viewBusiness.instagram.startsWith('http') ? viewBusiness.instagram : `https://${viewBusiness.instagram}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-[11px] font-semibold text-text hover:text-pink-600 transition-all shadow-xs truncate"
                    >
                      <Instagram className="w-3.5 h-3.5 text-[#E4405F] shrink-0" />
                      <span className="truncate">Instagram</span>
                    </a>
                  ) : null}

                  {viewBusiness.youtube ? (
                    <a
                      href={viewBusiness.youtube.startsWith('http') ? viewBusiness.youtube : `https://${viewBusiness.youtube}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-[11px] font-semibold text-text hover:text-red-600 transition-all shadow-xs truncate"
                    >
                      <Youtube className="w-3.5 h-3.5 text-[#CD201F] shrink-0" />
                      <span className="truncate">YouTube</span>
                    </a>
                  ) : null}

                  {viewBusiness.pinterest ? (
                    <a
                      href={viewBusiness.pinterest.startsWith('http') ? viewBusiness.pinterest : `https://${viewBusiness.pinterest}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-[11px] font-semibold text-text hover:text-red-500 transition-all shadow-xs truncate"
                    >
                      <Share2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="truncate">Pinterest</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Images */}
          {Array.isArray(viewBusiness.gallery_images) && viewBusiness.gallery_images.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                Gallery Photos ({viewBusiness.gallery_images.length})
              </h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {viewBusiness.gallery_images.map((img, idx) => (
                  <a
                    key={idx}
                    href={img}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative w-16 h-16 rounded-xl overflow-hidden border border-border bg-surface-secondary hover:border-primary/50 transition-all block shadow-xs shrink-0"
                  >
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="button" variant="primary" onClick={() => setViewBusiness(null)} className="px-5 py-1.5 text-xs">
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  </div>
)
}



