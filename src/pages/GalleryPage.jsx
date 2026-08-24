import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Edit2, Filter, Image as ImageIcon, Plus, RefreshCw, Search, Trash2, X, ImageOff } from 'lucide-react'
import api, { assetUrl, getGalleryList } from '../lib/api'
import { confirm } from '../lib/confirm'
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

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10'

const createPreviewUrl = (file) => URL.createObjectURL(file)

export default function GalleryPage({ headerLeftContent }) {
  const [rows, setRows] = useState([])
  const [limit, setLimit] = useState(15)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [showFilters, setShowFilters] = useState(false)
  const [categories, setCategories] = useState([])
  const [filterCategories, setFilterCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selected, setSelected] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [existingImages, setExistingImages] = useState([])
  const [newFiles, setNewFiles] = useState([])
  const [filePreviews, setFilePreviews] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})

  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1)
  const currentPage = Math.min(Math.max(Number(pagination.page) || page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const emptyState = useMemo(() => ({
    categoryId: '',
    categoryName: '',
    year: '',
    existingImages: [],
    newFiles: [],
    filePreviews: []
  }), [])

  const fetchGallery = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit, search: debouncedSearch }
      if (filterYear) params.year = filterYear
      if (filterMonth) params.month = filterMonth
      if (filterCategoryId) params.gallery_category_id = filterCategoryId
      const res = await getGalleryList(params)
      const data = res.data?.data || res.data || []
      const pg = res.data?.pagination || {}
      setRows(Array.isArray(data) ? data : [])
      setPagination({
        page: Number(pg.page || page),
        totalPages: Number(pg.totalPages || pg.total_pages || pg.last_page || 1),
        total: Number(pg.total || 0),
        limit: Number(pg.limit || limit)
      })
    } catch (err) {
      setRows([])
      setPagination({ page, totalPages: 1, total: 0, limit })
      setError(err.response?.data?.message || 'Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, filterYear, filterMonth, filterCategoryId])

  useEffect(() => {
    fetchGallery()
  }, [fetchGallery])

  useEffect(() => {
    fetchCategories()
  }, [])

  const setSearch = (value) => {
    setSearchValue(value)
    setPage(1)
  }

  const handleFilterYear = (value) => {
    setFilterYear(value)
    setFilterCategoryId('')
    setPage(1)
    fetchFilteredCategories(value)
  }

  const handleFilterCategory = (e) => {
    setFilterCategoryId(e.target.value)
    setPage(1)
  }

  useEffect(() => {
    if (!isModalOpen) {
      setCategoryId('')
      setCategoryName('')
      setYear('')
      setMonth('')
      setExistingImages([])
      setNewFiles([])
      setFilePreviews([])
      setFieldErrors({})
    }
  }, [isModalOpen])

  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [filePreviews])

  const fetchCategories = async () => {
    try {
      const categoryRes = await api.get('/gallery-categories')
      const list = categoryRes.data?.data || []
      setCategories(list)
      setFilterCategories(list)
    } catch (err) {
      // ignore category load failure for now
    }
  }

  const fetchFilteredCategories = async (year) => {
    try {
      if (!year) {
        // No year selected — show all categories in filter
        setFilterCategories(categories)
        return
      }
      // Reuse existing gallery API with year filter to find which categories have data
      const res = await getGalleryList({ year, limit: 999 })
      const data = res.data?.data || []
      // Extract distinct category IDs that have gallery entries for this year
      const categoryIdSet = new Set(
        data.map((item) => item.gallery_category_id).filter((id) => id && id !== '')
      )
      // Filter full categories list to only those with data
      setFilterCategories(categories.filter((cat) => categoryIdSet.has(cat.id)))
    } catch (err) {
      // fallback to full list
      setFilterCategories(categories)
    }
  }

  const openCreate = () => {
    setSelected(null)
    setCategoryId('')
    setCategoryName('')
    setYear('')
    setMonth('')
    setExistingImages([])
    setNewFiles([])
    setFilePreviews([])
    setIsModalOpen(true)
  }

  const openEdit = (row) => {
    setSelected(row)
    setCategoryId(row.gallery_category_id || '')
    setCategoryName(row.category || '')
    setYear(row.year || '')
    setMonth(row.month || '')
    setExistingImages(Array.isArray(row.images) ? row.images : [])
    setNewFiles([])
    setFilePreviews([])
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])
    const previews = files.map((file) => ({ file, url: createPreviewUrl(file) }))
    setNewFiles((current) => [...current, ...files])
    setFilePreviews((current) => [...current, ...previews])
    if (fieldErrors.images) setFieldErrors(prev => ({ ...prev, images: null }))
  }

  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, idx) => idx !== index))
  }

  const removeNewImage = (index) => {
    const removed = filePreviews[index]
    if (removed) URL.revokeObjectURL(removed.url)
    setNewFiles(newFiles.filter((_, idx) => idx !== index))
    setFilePreviews(filePreviews.filter((_, idx) => idx !== index))
  }

  const handleCategorySelect = (event) => {
    const selectedId = event.target.value
    setCategoryId(selectedId)
    const category = categories.find((item) => item.id === selectedId)
    setCategoryName(category?.category || '')
    if (fieldErrors.category) setFieldErrors(prev => ({ ...prev, category: null }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setFormError('')
    setError('')
    setFieldErrors({})
    try {
      let categoryIdToSave = categoryId
      let titleCategory = categoryName

      const errors = {}
      if (!titleCategory) {
        errors.category = 'Category is required'
      }
      if (newFiles.length === 0 && existingImages.length === 0) {
        errors.images = 'At least one gallery image is required'
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setFormError('Please fill in all required fields')
        setSaving(false)
        return
      }

      const payload = new FormData()
      payload.append('category', titleCategory)
      if (categoryIdToSave) payload.append('gallery_category_id', categoryIdToSave)
      payload.append('year', year || '')
      payload.append('month', month || '')

      existingImages.forEach((image) => payload.append('existing_images', image))
      newFiles.forEach((file) => payload.append('images', file))

      if (selected) {
        await api.put(`/gallery/${selected.id}`, payload)
      } else {
        await api.post('/gallery', payload)
      }

      toast.success('Gallery saved successfully')
      setIsModalOpen(false)
      setSelected(null)
      await fetchGallery()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save gallery')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (row) => {
    const id = row.id || row._id
    if (!id) return
    const newStatus = Number(row.status) === 1 ? 0 : 1

    // Optimistic UI update
    setRows(prevRows => prevRows.map(r => {
      if ((r.id || r._id) === id) {
        return { ...r, status: newStatus }
      }
      return r
    }))

    try {
      await api.put(`/gallery/${id}`, { status: newStatus })
      toast.success('Status updated')
    } catch (err) {
      // Revert on failure
      setRows(prevRows => prevRows.map(r => {
        if ((r.id || r._id) === id) {
          return { ...r, status: Number(row.status) === 1 ? 1 : 0 }
        }
        return r
      }))
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleDelete = async (row) => {
    if (!await confirm('Delete gallery item?')) return
    try {
      await api.delete(`/gallery/${row.id || row._id}`)
      await fetchGallery()
      toast.success('Gallery deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete gallery item')
    }
  }

  return (
    <div className="space-y-6 animate-slide-up text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 overflow-x-auto hide-scrollbar">
          {headerLeftContent ? headerLeftContent : (
            <h2 className="text-xl font-semibold text-text">Gallery</h2>
          )}
        </div>
        <div className="flex flex-wrap items-center sm:justify-end gap-3 w-full sm:w-auto">
          <SearchInput
            placeholder="Search gallery..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
          <Button onClick={openCreate} variant="primary" icon={<Plus className="w-4 h-4" />}>
            Add Images
          </Button>
        </div>
      </div>


      <Table
        columns={[
          {
            header: 'Preview',
            key: 'preview',
            render: (row) => row.images?.[0] ? (
              <div className="relative inline-block">
                <img src={assetUrl(row.images[0])} alt={row.category || 'Gallery'} className="h-12 w-16 rounded-lg object-cover border border-border" />
              </div>
            ) : (
              <div className="h-12 w-16 rounded-lg border border-border/60 bg-surface-secondary flex items-center justify-center">
                <ImageOff className="h-5 w-5 text-text-secondary/40" />
              </div>
            )
          },
          {
            header: 'Category',
            key: 'category',
            render: (row) => <span className="font-medium max-w-xs line-clamp-1">{row.category || 'General'}</span>
          },
          {
            header: 'Month/Year',
            key: 'month_year',
            render: (row) => {
              const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              let mText = ''
              if (row.month) {
                const mIdx = parseInt(row.month, 10)
                mText = (!isNaN(mIdx) && monthNames[mIdx]) ? monthNames[mIdx] : row.month
              }
              if (mText && row.year) return `${mText} ${row.year}`
              if (row.year) {
                return row.year.includes('-') ? new Date(row.year + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : row.year
              }
              if (mText) return mText
              return '-'
            }
          },
          {
            header: 'Images',
            key: 'images',
            render: (row) => (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {row.images?.length || 0} Images
              </span>
            )
          },
          {
            header: 'Status',
            key: 'status',
            render: (row) => (
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Number(row.status) === 1}
                    onChange={() => handleToggleStatus(row)}
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
            render: row=> ( <div className="flex items-center justify-start gap-2">
                <button onClick={() => openEdit(row)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(row)} className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }
        ]}
        data={rows}
        keyField="id"
        loading={loading}
        emptyState={{
          icon: ImageIcon,
          title: 'No gallery items found',
          description: 'There are no images registered under this search criteria',
          actionLabel: 'Add Images',
          onAction: openCreate
        }}
        pagination={{
          currentPage: page,
          totalPages: pagination.totalPages,
          total: pagination.total,
          pageNumbers,
          loading,
          onPageChange: setPage,
          limit,
          onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1); }
        }}
      />

      <Modal isOpen={isModalOpen} title={selected ? 'Edit Images' : 'Add Images'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4 text-text" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select
              label="Category"
              required
              value={categoryId}
              onChange={(val) => handleCategorySelect({ target: { value: val } })}
              disabled={saving}
              options={categories.map((item) => ({ label: item.category, value: item.id }))}
              error={fieldErrors.category}
            />

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Date <span className="text-text-secondary font-normal text-xs">(Optional)</span></label>
              <DatePicker
                name="date"
                mode="date"
                placeholder="Select date"
                value={year && month ? `${year}-${month.padStart(2, '0')}` : (year || '')}
                onChange={(val) => {
                  if (val && val.includes('-')) {
                    const parts = val.split('-')
                    setYear(parts[0])
                    setMonth(parts[1] || '')
                  } else {
                    setYear(val || '')
                    setMonth('')
                  }
                }}
                className={fieldClass}
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">Gallery Images <span className="text-red-500">*</span></label>
            <FileDropzone
              multiple
              accept="image/*"
              error={fieldErrors.images}
              onFilesSelected={(files) => {
                const fakeEvent = { target: { files } };
                handleFileChange(fakeEvent);
              }}
              disabled={saving}
              label="Click or Drag Gallery Images"
              subLabel="Upload multiple images. Existing images stay unless removed below."
              previews={[
                ...existingImages.map((image, index) => ({
                  url: assetUrl(image),
                  onRemove: () => removeExistingImage(index)
                })),
                ...filePreviews.map((preview, index) => ({
                  url: preview.url,
                  onRemove: () => removeNewImage(index)
                }))
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}



