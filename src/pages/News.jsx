import React, { useCallback, useEffect, useState } from 'react'
import { FileText, Calendar, Trash2, Clock, Search, RefreshCw, Plus, Edit2 } from 'lucide-react'
import api, { assetUrl, getNewsList } from '../lib/api'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10'
const limit = 10

export default function News() {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit })
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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 1,
    image: null,
    remove_image: false,
    send_notification: false,
  })

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
  }, [page, search])

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
      setSuccess('News announcement deleted and moderated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to delete news announcement')
    }
  }

const openCreate = () => {
  setSelected(null)
  setSelectedId('')  
  setExistingImage('')
  setFormData({ title: '', description: '', status: 1, image: null, remove_image: false, send_notification: false })
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
    setIsModalOpen(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const hasFile = formData.image instanceof FileList
        ? formData.image.length > 0
        : formData.image instanceof File

      const payload = new FormData()
      payload.append('title', formData.title)
      payload.append('description', formData.description)
      payload.append('status', formData.status)
      if (formData.send_notification) payload.append('send_notification', 'true')
      if (hasFile) {
        payload.append('image', formData.image instanceof FileList ? formData.image[0] : formData.image)
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
      setSuccess('Feed News saved successfully')
      setIsModalOpen(false)
      setSelected(null)
      setExistingImage('')  
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save feed News')
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
          <button
            onClick={fetchNews}
            className="flex items-center justify-center p-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-text-secondary hover:text-text transition-all"
            title="Refresh News"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-glow-primary"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
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

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin"></div>
          <span className="text-text-secondary text-sm">Loading News...</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center shadow-glass-sm flex flex-col items-center justify-center gap-4">
          <FileText className="w-12 h-12 text-text-secondary/40 animate-pulse-slow" />
          <div>
            <h4 className="font-semibold text-text">No News found</h4>
            <p className="text-text-secondary text-sm mt-1">There are no News under this search criteria</p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-glass-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-secondary text-text-secondary text-sm font-semibold  tracking-wider">
                  <th className="p-4">Image</th>
                  <th className="p-4">News</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Reporter</th>
                  <th className="p-4 ">Status</th>
                  <th className="p-4 text-right">Action</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-border">

                {rows.map((row) => (
                  <tr key={row.id || row._id} className="hover:bg-surface-secondary/40 text-sm text-text">
                    <td className="p-4 max-w-[120px]">
                      {row.image ? (
                        <img src={assetUrl(row.image)} alt={row.title || 'Event'} className="h-12 w-16 rounded-lg object-cover border border-border" />
                      ) : (
                        <span className="text-text-secondary">No image</span>
                      )}
                    </td>
                    <td className="p-4 max-w-md">
                      <div className="font-semibold">{row.title.slice(0, 20) || '-'}</div>
                    </td>
                    <td className="p-4 max-w-md">
                      <div className="text-text-secondary text-sm line-clamp-2">{row.description.slice(0, 50) || '-'}</div>
                    </td>

                    <td className="p-4 max-w-md">
                      <div className="text-text-secondary text-sm line-clamp-2">{row.date?.slice(0, 10).split('-').reverse().join('-') || '-'}</div>
                    </td>
                    <td className="p-4 max-w-md">{row.reporter_name || '-'}</td>
                    <td className="py-2 px-6">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg border text-sm font-semibold ${Number(row.status ?? 1) === 1 ? 'bg-success-bg border-success-border text-success-text' : 'bg-surface-secondary border-border text-text-secondary'}`}>
                        {Number(row.status ?? 1) === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(row)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(row.id || row._id)} className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-sm text-text-secondary">No News found</td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </div>

      )}

      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border border-border bg-surface-secondary/40 rounded-xl text-sm">
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

      <Modal isOpen={isModalOpen} title={selected ? 'Edit Feed News' : 'Add Feed News'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4 max-h-[76vh] overflow-y-auto pr-1 text-text">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Title *</label>
              <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={fieldClass} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={fieldClass} disabled={saving}>
                <option value={1} className="bg-surface text-text">Active</option>
                <option value={0} className="bg-surface text-text">Pending (Inactive)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Description *</label>
              <textarea rows="4" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={fieldClass} disabled={saving} />
            </div>

            <div className="flex flex-col bg-input-bg border border-border rounded-xl p-3">
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Image</label>

              {/* Preview */}
              {(formData.image instanceof File || (formData.image instanceof FileList && formData.image.length > 0)) ? (
                <div className="relative w-20 h-20 mb-2">
                  <img
                    src={URL.createObjectURL(formData.image instanceof FileList ? formData.image[0] : formData.image)}
                    alt="preview"
                    className="w-20 h-20 rounded-lg object-cover border border-border"
                  />
                  <button type="button" onClick={() => setFormData({ ...formData, image: '', remove_image: false })}
                    className="absolute -top-1.5 -right-1.5 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold" disabled={saving}>×</button>
                </div>
              ) : existingImage && !formData.remove_image ? (
                <div className="relative w-20 h-20 mb-2">
                  <img src={assetUrl(existingImage)} alt="current" className="w-20 h-20 rounded-lg object-cover border border-border" />
                  <button type="button" onClick={() => setFormData({ ...formData, remove_image: true })}
                    className="absolute -top-1.5 -right-1.5 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold" disabled={saving}>×</button>
                </div>
              ) : null}

              <input
                type="file" accept="image/*"
                onChange={(e) => setFormData({ ...formData, image: e.target.files, remove_image: false })}
                className="w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                disabled={saving}
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

          <button type="submit" disabled={saving} className="flex justify-self-end bg-primary hover:bg-primary-hover text-white p-3 rounded-xl font-semibold text-sm tracking-wider  disabled:opacity-50 shadow-glow-primary">
            {saving ? 'Saving...' : 'Save Feed News'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
