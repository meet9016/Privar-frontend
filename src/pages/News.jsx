import React, { useCallback, useEffect, useState } from 'react'
import { FileText, Calendar, Trash2, Clock, Search, RefreshCw, Plus, Edit2, ImageOff, Filter, X } from 'lucide-react'
import api, { assetUrl, getNewsList, formatDate } from '../lib/api'
import { confirm } from '../lib/confirm'
import Loader from '../components/common/Loader'
import Modal from '../components/Modal'
import FileDropzone from '../components/common/FileDropzone'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import SearchInput from '../components/common/SearchInput'
import FilterPopover from '../components/common/FilterPopover'
import { toast } from '../lib/toast'
import useDebounce from '../hooks/useDebounce'
import Tooltip from '../components/common/Tooltip'
import usePermissions from '../hooks/usePermissions'

export default function News() {
  const permissions = usePermissions('news')
  const [rows, setRows] = useState([])
  const [limit, setLimit] = useState(15)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [filters, setFilters] = useState({ status: '', category: '' })
  const [draftFilters, setDraftFilters] = useState({ status: '', category: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selected, setSelected] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [existingImage, setExistingImage] = useState('')
  const [selectedId, setSelectedId] = useState('')

  const emptyNewsForm = {
    title: '',
    description: '',
    status: 1,
    image: null,
    remove_image: false,
    send_notification: false,
  }

  const [formData, setFormData] = useState(emptyNewsForm)
  const [fieldErrors, setFieldErrors] = useState({})

  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1)
  const currentPage = Math.min(Math.max(Number(pagination.page) || page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getNewsList({ page, limit, search: debouncedSearch, ...filters })
      const data = res.data?.data || []
      setRows(Array.isArray(data) ? data : [])
      setPagination({
        page: res.data?.pagination?.page || page,
        totalPages: res.data?.pagination?.totalPages || 1,
        total: res.data?.pagination?.total || 0,
        limit: res.data?.pagination?.limit || limit
      })
    } catch (err) {
      setRows([])
      setError(err.response?.data?.message || 'Failed to load news')
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, filters])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const setSearch = (value) => {
    setSearchValue(value)
    setPage(1)
  }

  const handleDelete = async (rowOrId) => {
    const id = typeof rowOrId === 'object' ? (rowOrId.id || rowOrId._id) : rowOrId
    if (!id) return
    if (!await confirm('Are you sure you want to delete this news announcement?')) return
    try {
      await api.delete(`/news/${id}`)
      await fetchNews()
      toast.success('News deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete news announcement')
    }
  }

  const openCreate = () => {
    setSelected(null)
    setSelectedId('')  
    setExistingImage('')
    setFormData(emptyNewsForm)
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const openEdit = (newsItem) => {
    setSelected(newsItem)
    setSelectedId(newsItem.id || newsItem._id || '') 
    setExistingImage(newsItem.image || '')
    setFormData({
      title: newsItem.title || '',
      description: newsItem.description || '',
      status: Number(newsItem.status ?? 1),
      image: null,
      remove_image: false,
      send_notification: false,
    })
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    const errors = {}
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setSaving(false)
      return
    }
    try {
      const payload = new FormData()
      payload.append('title', formData.title)
      payload.append('description', formData.description)
      payload.append('status', formData.status)
      if (formData.send_notification) payload.append('send_notification', 'true')
      if (formData.image instanceof File) {
        payload.append('image', formData.image)
      }
      if (formData.remove_image) {
        payload.append('remove_image', 'true')
      }
      if (selectedId) {
        await api.put(`/news/${selectedId}`, payload)
      } else {
        await api.post('/news', payload)
      }
      await fetchNews()
      toast.success('Feed News saved successfully')
      setIsModalOpen(false)
      setSelected(null)
      setExistingImage('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save feed News')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (row) => {
    const id = row.id || row._id
    if (!id) return
    const newStatus = Number(row.status) === 1 ? 0 : 1

    // Optimistic UI update
    setRows(prevRows => prevRows.map(item => {
      if ((item.id || item._id) === id) {
        return { ...item, status: newStatus }
      }
      return item
    }))

    try {
      await api.put(`/news/${id}`, { status: newStatus })
      toast.success('Status updated')
    } catch (err) {
      // Revert on error
      setRows(prevRows => prevRows.map(item => {
        if ((item.id || item._id) === id) {
          return { ...item, status: Number(row.status) === 1 ? 1 : 0 }
        }
        return item
      }))
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleBulkStatus = async (selectedIds, newStatus) => {
    if (!selectedIds.length) return;
    try {
      setRows(prev => prev.map(r => selectedIds.includes(String(r.id || r._id)) ? { ...r, status: newStatus } : r));
      await Promise.all(selectedIds.map(id => api.put(`/news/${id}`, { status: newStatus })));
      toast.success(`Selected news marked as ${newStatus === 1 ? 'Active' : 'Inactive'}`);
      await fetchNews();
    } catch (err) {
      toast.error('Failed to update status for selected news');
      await fetchNews();
    }
  };

  const handleBulkDelete = async (selectedIds) => {
    if (!selectedIds.length) return;
    if (!await confirm(`Are you sure you want to delete ${selectedIds.length} selected news?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/news/${id}`)));
      toast.success(`${selectedIds.length} news deleted successfully`);
      await fetchNews();
    } catch (err) {
      toast.error('Failed to delete selected news');
      await fetchNews();
    }
  };

  return (
    <div className="space-y-6 animate-slide-up text-text">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">News Feed</h2>

        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchInput
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
          <FilterPopover
            isOpen={showFilters}
            onToggle={() => {
              setDraftFilters(filters)
              setShowFilters(!showFilters)
            }}
            onClose={() => setShowFilters(false)}
            activeCount={filters.status ? 1 : 0}
            onClear={() => {
              setDraftFilters({ status: '', category: '' })
              setFilters({ status: '', category: '' })
              setPage(1)
              setShowFilters(false)
            }}
            onApply={() => {
              setFilters(draftFilters)
              setPage(1)
              setShowFilters(false)
            }}
          >
            <Select
              label="Status"
              value={draftFilters.status}
              onChange={(val) => setDraftFilters(current => ({ ...current, status: val }))}
              placeholder="All Status"
              searchable={false}
              options={[
                { label: 'All Status', value: '' },
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' }
              ]}
            />
          </FilterPopover>
          {!permissions.canAdd && !permissions.isSuperAdmin ? null : (
            <Button
              onClick={openCreate}
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
            >
              Add News
            </Button>
          )}
        </div>
      </div>



      <Table
        columns={[
          {
            header: 'Image',
            key: 'image',
            render: (row) => row.image ? (
              <img src={assetUrl(row.image)} alt={row.title || 'Event'} className="h-12 w-16 rounded-lg object-cover border border-border" />
            ) : (
                <div className="h-12 w-16 rounded-lg border border-border/60 bg-surface-secondary flex items-center justify-center">
                  <ImageOff className="h-5 w-5 text-text-secondary/40" />
                </div>
            )
          },
          {
            header: 'Title',
            key: 'title',
            render: (row) => (
              <div className="max-w-md">
                <div className="font-semibold">{row.title || '-'}</div>
                {row.description && row.description.length > 50 ? (
                  <Tooltip content={row.description}>
                    <div className="text-text-secondary text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors">{row.description}</div>
                  </Tooltip>
                ) : (
                  <div className="text-text-secondary text-sm line-clamp-2">{row.description || '-'}</div>
                )}
              </div>
            )
          },
          {
            header: 'Post Date',
            key: 'post_date',
            render: (row) => (
              <div className="text-text-secondary text-sm line-clamp-2 max-w-md">
                {formatDate(row.cdate || row.createdAt || row.post_date)}
              </div>
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
                {!permissions.canEdit && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => openEdit(row)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!permissions.canDelete && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => handleDelete(row)} className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          }
        ]}
        data={rows}
        keyField="id"
        loading={loading}
        onBulkStatus={handleBulkStatus}
        onBulkDelete={handleBulkDelete}
        emptyState={{
          icon: FileText,
          title: 'No News found',
          description: 'There are no News under this search criteria',
          actionLabel: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : 'Add News',
          onAction: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : openCreate
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

      <Modal isOpen={isModalOpen} maxWidth="max-w-3xl" title={selected ? 'Edit News' : 'Add News'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-3 text-text">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <Input
              label="Title"
              required
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value })
                if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: null })
              }}
              disabled={saving}
              error={fieldErrors.title}
            />
            <div className="flex flex-col justify-center pt-1">
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                Status
              </label>
              <div className="flex items-center gap-3 py-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Number(formData.status ?? 1) === 1}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
                    disabled={saving}
                  />
                  <div className="w-11 h-6 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
                <span className="text-sm font-semibold text-text">
                  {Number(formData.status ?? 1) === 1 ? 'Approved' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <Input
              type="textarea"
              rows={8}
              label="Description"
              required
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value })
                if (fieldErrors.description) setFieldErrors({ ...fieldErrors, description: null })
              }}
              disabled={saving}
              error={fieldErrors.description}
            />

            <div className="flex flex-col h-full">
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Image</label>

              <FileDropzone
                accept="image/*"
                className="flex-1 flex flex-col min-h-[175px]"
                onFilesSelected={(files) => setFormData({ ...formData, image: files[0] || null, remove_image: false })}
                disabled={saving}
                label="Click or Drag News Image"
                previews={[
                  ...(existingImage && !formData.remove_image ? [{
                    url: assetUrl(existingImage),
                    onRemove: () => setFormData({ ...formData, remove_image: true })
                  }] : []),
                  ...(formData.image instanceof File ? [{
                    url: URL.createObjectURL(formData.image),
                    onRemove: () => setFormData({ ...formData, image: '', remove_image: false })
                  }] : [])
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}



