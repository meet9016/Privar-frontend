import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Edit2, Image as ImageIcon, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import api, { assetUrl, getGalleryList } from '../lib/api'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
// import PageHeader from '../components/PageHeader'
import DatePicker from '../components/DatePicker'

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10'
const limit = 12

const createPreviewUrl = (file) => URL.createObjectURL(file)

export default function GalleryPage() {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
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
  }, [page, search, filterYear, filterCategoryId])

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
    <div className="space-y-6 animate-slide-up select-none text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Gallery</h2>

        </div>
        <div className="flex flex-wrap items-center sm:justify-end gap-3 flex-1">
          <button onClick={() => { fetchGallery(); fetchCategories() }} className="p-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-text-secondary hover:text-text transition-all" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="relative w-full sm:w-64 sm:flex-none">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-text-secondary/60" />
            <input
              type="search"
              placeholder="Search gallery..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50 shadow-sm"
            />
          </div>
          <div className="w-full sm:w-auto flex-none">
            <DatePicker
              mode="month"
              value={filterYear}
              onChange={(val) => handleFilterYear(val)}
              placeholder="Month & Year"
              className="w-full sm:w-40 bg-input-bg text-text border border-border rounded-xl py-2.5 px-3 text-sm outline-none focus:border-primary/50 shadow-sm"
            />
          </div>
          <select
            value={filterCategoryId}
            onChange={handleFilterCategory}
            className="w-full sm:w-auto bg-input-bg text-text border border-border rounded-xl py-2.5 px-3 text-sm outline-none focus:border-primary/50 shadow-sm"
          >
            <option value="" className="bg-surface text-text">All Categories</option>
            {filterCategories.map((item) => (
              <option key={item.id} value={item.id} className="bg-surface text-text">{item.category}</option>
            ))}
          </select>
          <button onClick={openCreate} className="w-full sm:w-auto flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-glow-primary">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {error && <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-2xl text-sm">{error}</div>}
      {success && <div className="bg-success-bg border border-success-border text-success-text p-4 rounded-2xl text-sm">{success}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin"></div>
          <span className="text-text-secondary text-sm">Loading gallery...</span>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-glass-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-secondary text-text-secondary text-sm font-semibold  tracking-wider">
                  <th className="p-4">Preview</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Month/Year</th>
                  <th className="p-4 text-center">Images</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-secondary/40 text-sm text-text border-b border-border/50 last:border-0 group">
                    <td className="p-4 max-w-[100px]">
                      {row.images?.[0] ? (
                        <div className="relative inline-block">
                          <img src={assetUrl(row.images[0])} alt={row.category || 'Gallery'} className="h-12 w-16 rounded-lg object-cover border border-border" />
                          <span className="absolute -top-1.5 -right-2.5 bg-primary text-white text-xs font-semibold rounded-full p-1 w-5 h-5 flex items-center justify-center">
                            {row.images.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-secondary">No image</span>
                      )}
                    </td>
                    <td className="p-4 font-medium max-w-xs line-clamp-1">{row.category || 'General'}</td>
                    <td className="p-4">
                      {row.year ? new Date(row.year + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-surface border border-border text-xs font-semibold">
                        {row.images?.length || 0}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(row)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(row)} className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-sm text-text-secondary">No gallery items found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border bg-surface-secondary/40 text-sm">
              <span className="text-text-secondary">
                Page {pagination.page} of {pagination.totalPages} {pagination.total ? `(${pagination.total} total)` : ''}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 disabled:cursor-not-allowed">
                  Previous
                </button>
                {pageNumbers.map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={loading || item === currentPage}
                    onClick={() => setPage(item)}
                    className={`min-w-10 px-3 py-2 rounded-lg border transition-all ${item === currentPage
                      ? 'border-primary bg-primary/10 text-primary font-semibold disabled:opacity-100 disabled:cursor-default'
                      : 'border-border bg-card text-text hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                  >
                    {item}
                  </button>
                ))}
                <button type="button" disabled={loading || page >= pagination.totalPages} onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))} className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} title={selected ? 'Edit Images' : 'Add Images'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4 max-h-[76vh] overflow-y-auto pr-1 text-text">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Category <span className='text-red-500'>*</span></label>
              <select value={categoryId} onChange={handleCategorySelect} className={fieldClass} disabled={saving}>
                <option value="" className="bg-surface text-text">Select Category</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id} className="bg-surface text-text">{item.category}</option>
                ))}
              </select>
            </div>

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
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="w-full text-sm text-text file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                disabled={saving}
              />
              <p className="my-2 text-sm text-text-secondary">Upload multiple images. Existing images stay unless removed below.</p>
            </div>

            {(existingImages.length > 0 || filePreviews.length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-10 gap-2 sm:gap-3 [&>div]:max-w-[100px]">
                {existingImages.map((image, index) => (
                  <div key={`existing-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-surface-secondary">
                    <img src={assetUrl(image)} alt={`Existing ${index + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeExistingImage(index)} className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {filePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-surface-secondary">
                    <img src={preview.url} alt={`New ${index + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeNewImage(index)} className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={saving} className="flex justify-self-end bg-primary hover:bg-primary-hover text-white py-3 px-3 rounded-xl font-semibold text-sm tracking-wider  disabled:opacity-50 shadow-glow-primary">
            {saving ? 'Saving...' : 'Save Gallery'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
