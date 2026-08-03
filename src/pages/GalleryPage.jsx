import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Edit2, Filter, Image as ImageIcon, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
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

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10'

const createPreviewUrl = (file) => URL.createObjectURL(file)

export default function GalleryPage() {
  const [rows, setRows] = useState([])
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [categories, setCategories] = useState([])
  const [filterCategories, setFilterCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selected, setSelected] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [year, setYear] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [existingImages, setExistingImages] = useState([])
  const [newFiles, setNewFiles] = useState([])
  const [filePreviews, setFilePreviews] = useState([])

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
      const params = { page, limit, search }
      if (filterYear) params.year = filterYear
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
  }, [page, search, filterYear, filterCategoryId, limit])

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
      setExistingImages([])
      setNewFiles([])
      setFilePreviews([])
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
    setExistingImages(Array.isArray(row.images) ? row.images : [])
    setNewFiles([])
    setFilePreviews([])
    setIsModalOpen(true)
  }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])
    const previews = files.map((file) => ({ file, url: createPreviewUrl(file) }))
    setNewFiles((current) => [...current, ...files])
    setFilePreviews((current) => [...current, ...previews])
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
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      let categoryIdToSave = categoryId
      let titleCategory = categoryName

      if (!titleCategory) {
        titleCategory = 'General'
      }


      const payload = new FormData()
      payload.append('category', titleCategory)
      if (categoryIdToSave) payload.append('gallery_category_id', categoryIdToSave)
      payload.append('year', year || '')

      existingImages.forEach((image) => payload.append('existing_images', image))
      newFiles.forEach((file) => payload.append('images', file))
      if (newFiles.length === 0 && existingImages.length === 0) {
        return setSaving(false)


      }

      if (selected) {
        await api.put(`/gallery/${selected.id}`, payload)
      } else {
        await api.post('/gallery', payload)
      }

      setSuccess('Gallery saved successfully')
      setIsModalOpen(false)
      setSelected(null)
      await fetchGallery()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save gallery')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!await confirm('Delete gallery item?')) return
    try {
      await api.delete(`/gallery/${row.id}`)
      await fetchGallery()
      setSuccess('Gallery deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete gallery item')
    }
  }


  return (
    <div className="space-y-6 animate-slide-up text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Gallery</h2>

        </div>
        <div className="flex flex-wrap items-center sm:justify-end gap-3 flex-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-secondary hover:bg-surface border-border text-text-secondary hover:text-text'}`}
            title="Toggle Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          <Button onClick={openCreate} variant="primary" icon={<Plus className="w-4 h-4" />}>
            Add Images
          </Button>
        </div>
      </div>

      <div className={`transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[500px] opacity-100 mt-4 overflow-visible z-20 relative' : 'max-h-0 opacity-0 mt-0 overflow-hidden pointer-events-none'}`}>
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-glass-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              icon={<Search className="w-4 h-4" />}
              type="text"
              placeholder="Search gallery..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <DatePicker
              mode="month"
              value={filterYear}
              onChange={(val) => handleFilterYear(val)}
              placeholder="Month & Year"
              className="w-full bg-input-bg text-text border border-border rounded-xl py-2.5 px-3 text-sm outline-none focus:border-primary/50 shadow-sm"
            />
            <Select
              value={filterCategoryId}
              onChange={(val) => handleFilterCategory({ target: { value: val } })}
              options={[{ label: 'All Categories', value: '' }, ...filterCategories.map((item) => ({ label: item.category, value: item.id }))]}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => { fetchGallery(); fetchCategories() }} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </button>
          </div>
        </div>
      </div>

      {error && <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-2xl text-sm">{error}</div>}
      {success && <div className="bg-success-bg border border-success-border text-success-text p-4 rounded-2xl text-sm">{success}</div>}

      {loading && rows.length === 0 ? (
        <div className="py-20"><Loader text="Loading gallery..." /></div>
      ) : (
        <Table
          columns={[
            {
              header: 'Preview',
              key: 'preview',
              render: (row) => row.images?.[0] ? (
                <div className="relative inline-block">
                  <img src={assetUrl(row.images[0])} alt={row.category || 'Gallery'} className="h-12 w-16 rounded-lg object-cover border border-border" />
                  <span className="absolute -top-1.5 -right-2.5 bg-primary text-white text-xs font-semibold rounded-full p-1 w-5 h-5 flex items-center justify-center">
                    {row.images.length}
                  </span>
                </div>
              ) : (
                <span className="text-text-secondary">No image</span>
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
              render: (row) => row.year ? new Date(row.year + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'
            },
            {
              header: 'Images',
              key: 'images',
              align: 'center',
              render: (row) => (
                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-surface border border-border text-xs font-semibold">
                  {row.images?.length || 0}
                </span>
              )
            },
            {
              header: 'Actions',
              key: 'actions',
              align: 'right',
              render: (row) => (
                <div className="flex items-center justify-end gap-2">
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
            description: 'There are no images registered under this search criteria'
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
      )}

      <Modal isOpen={isModalOpen} title={selected ? 'Edit Images' : 'Add Images'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4 text-text">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select
              label="Category"
              required
              value={categoryId}
              onChange={(val) => handleCategorySelect({ target: { value: val } })}
              disabled={saving}
              options={categories.map((item) => ({ label: item.category, value: item.id }))}
            />

            <div>
              <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Month & Year</label>
              <DatePicker
                name="year"
                mode="month"
                value={year}
                onChange={(val) => setYear(val)}
                className={fieldClass}
                disabled={saving}
              />
            </div>
          </div>
        <div className="flex flex-col bg-input-bg border border-border rounded-xl p-3">

            <div>
              <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Gallery Images</label>
              <FileDropzone
                multiple
                accept="image/*"
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
