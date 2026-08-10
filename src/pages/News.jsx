import React, { useCallback, useEffect, useState } from 'react'
import { FileText, Calendar, Trash2, Clock, Search, RefreshCw, Plus, Edit2 } from 'lucide-react'
import api, { assetUrl, getNewsList } from '../lib/api'
import { confirm } from '../lib/confirm'
import Loader from '../components/common/Loader'
import Modal from '../components/Modal'
import FileDropzone from '../components/common/FileDropzone'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import { toast } from '../lib/toast'

export default function News() {
  const [rows, setRows] = useState([])
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
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
    setLoading(true)
    try {
      const res = await getNewsList({ page, limit, search })
      const rows = res.data?.data || res.data || []
      const pg = res.data?.pagination || {}
      setRows(Array.isArray(rows) ? rows : [])
      setPagination({
        page: Number(pg.page || page),
        totalPages: Number(pg.totalPages || pg.total_pages || pg.last_page || 1),
        total: Number(pg.total || 0),
        limit: Number(pg.limit || limit)
      })
    } catch (err) {
      setRows([])
      setPagination({ page, totalPages: 1, total: 0, limit })
      setError(err.response?.data?.message || 'Failed to load news')
    } finally {
      setLoading(false)
    }
  }, [page, search, limit])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const setSearch = (value) => {
    setSearchValue(value)
    setPage(1)
  }

  const handleDelete = async (id) => {
    if (!await confirm('Are you sure you want to delete this news announcement from the community board?')) return
    try {
      await api.delete(`/news/${id}`)
      await fetchNews()
      toast.success('News announcement deleted and moderated successfully')
    } catch (err) {
      toast.error('Failed to delete news announcement')
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

  return (
    <div className="space-y-6 animate-slide-up text-text">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">News Feed</h2>

        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={fetchNews}
            variant="secondary"
            title="Refresh News"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={openCreate}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Add News
          </Button>
          <div className="relative group flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-secondary/60">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="search"
              placeholder="Search feed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-300"
            />
          </div>
        </div>
      </div>



      {/* Main Grid */}
      {loading && rows.length === 0 ? (
        <div className="py-20"><Loader text="Loading News..." /></div>
      ) : (
        <Table
          columns={[
            {
              header: 'Image',
              key: 'image',
              render: (row) => row.image ? (
                <img src={assetUrl(row.image)} alt={row.title || 'Event'} className="h-12 w-16 rounded-lg object-cover border border-border" />
              ) : (
                <span className="text-text-secondary">No image</span>
              )
            },
            {
              header: 'News',
              key: 'news',
              render: (row) => <div className="font-semibold">{row.title.slice(0, 20) || '-'}</div>
            },
            {
              header: 'Description',
              key: 'description',
              render: (row) => <div className="text-text-secondary text-sm line-clamp-2 max-w-md">{row.description.slice(0, 50) || '-'}</div>
            },
            {
              header: 'Date',
              key: 'date',
              render: (row) => <div className="text-text-secondary text-sm line-clamp-2 max-w-md">{row.date?.slice(0, 10).split('-').reverse().join('-') || '-'}</div>
            },
            {
              header: 'Reporter',
              key: 'reporter',
              render: (row) => <div className="max-w-md">{row.reporter_name || '-'}</div>
            },
            {
              header: 'Status',
              key: 'status',
              render: (row) => (
                <span className={`inline-flex px-2.5 py-1 rounded-lg border text-sm font-semibold ${Number(row.status ?? 1) === 1 ? 'bg-success-bg border-success-border text-success-text' : 'bg-surface-secondary border-border text-text-secondary'}`}>
                  {Number(row.status ?? 1) === 1 ? 'Active' : 'Inactive'}
                </span>
              )
            },
            {
              header: 'Action',
              key: 'action',
              align: 'right',
              render: (row) => (
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => openEdit(row)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(row.id || row._id)} className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            }
          ]}
          data={rows}
          keyField={(row) => row.id || row._id}
          loading={loading}
          emptyState={{
            icon: FileText,
            title: 'No News found',
            description: 'There are no News under this search criteria'
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

      <Modal isOpen={isModalOpen} title={selected ? 'Edit Feed News' : 'Add Feed News'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4 text-text">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Select
              label="Status"
              value={formData.status}
              onChange={(val) => setFormData({ ...formData, status: val })}
              disabled={saving}
              options={[
                { label: 'Active', value: 1 },
                { label: 'Pending (Inactive)', value: 0 }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="textarea"
              rows={4}
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

            <div className="flex flex-col bg-input-bg border border-border rounded-xl p-3">
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Image</label>

              <FileDropzone
                accept="image/*"
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


          {/*NOTIFICATIONS */}
          {!selected && (
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-input-bg border border-border rounded-xl">
              <input
                type="checkbox"
                checked={formData.send_notification}
                onChange={(e) => setFormData({ ...formData, send_notification: e.target.checked })}
                disabled={saving}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-semibold text-text-secondary">Send as Push Notification to all users</span>
            </label>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              isLoading={saving}
              variant="primary"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
