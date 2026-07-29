import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Edit2, Image as ImageIcon, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import api, { assetUrl } from '../lib/api'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import usePagination from '../hooks/usePagination'

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10'
const limit = 10

export default function AdminCrudPage({ title, subtitle, endpoint, fields, columns, getRowTitle, supportIsOwn }) {
  const emptyForm = useMemo(() => {
    return fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue ?? '' }), {})
  }, [fields])

  const [rows, setRows] = useState([])
  const { page, totalPages, total, setPage, setPaginationData, getParams, resetPage } = usePagination(limit)
  const [loading, setLoading] = useState(false)
  const [search, setSearchValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selected, setSelected] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [remoteOptions, setRemoteOptions] = useState({})
  const [isOwn, setIsOwn] = useState(false)

  const [imagePreview, setImagePreview] = useState(null)
  const [removedImages, setRemovedImages] = useState({})

  const currentPage = Math.min(Math.max(page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const params = getParams({ search })
      if (supportIsOwn) params.is_own = isOwn
      const res = await api.get(endpoint, { params })
      const data = res.data?.data || res.data || []
      const pg = res.data?.pagination || {}
      setRows(Array.isArray(data) ? data : [])
      setPaginationData(pg)
    } catch (err) {
      setRows([])
      setPaginationData({ page: 1, totalPages: 1, total: 0 })
      setError(err.response?.data?.message || `Failed to load ${title.toLowerCase()}`)
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, search, title])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  const setSearch = (value) => {
    setSearchValue(value)
    resetPage()
  }

  useEffect(() => {
    setFormData(emptyForm)
  }, [emptyForm])

  const openCreate = () => {
    setSelected(null)
    setFormData(emptyForm)
    loadRemoteOptions(fields)
    setIsModalOpen(true)

    setImagePreview(null)
    setRemovedImages({})
  }

  const openEdit = async (row) => {
    setSelected(row)
    setIsModalOpen(true)
    setImagePreview(null)
    setRemovedImages({})

    // Set initial values from the row list data immediately
    setFormData(fields.reduce((acc, field) => ({
      ...acc,
      [field.name]: field.type === 'file' ? '' : row[field.name] ?? row[field.fallback] ?? field.defaultValue ?? ''
    }), {}))

    try {
      // Fetch fresh, absolute latest data from the backend by ID
      const res = await api.get(`${endpoint}/${row._id || row.id}`)
      const freshData = res.data?.data || res.data
      if (freshData) {
        setFormData(fields.reduce((acc, field) => ({
          ...acc,
          [field.name]: field.type === 'file' ? '' : freshData[field.name] ?? freshData[field.fallback] ?? field.defaultValue ?? ''
        }), {}))
      }
    } catch (err) {
      console.error("Failed to fetch fresh row data:", err)
      // Fallback: keep the initial local row data in the form
    }
    loadRemoteOptions(fields)
  }

  const loadRemoteOptions = async (fieldsList) => {
    const remoteFields = (fieldsList || []).filter((f) => f.type === 'select-remote')
    if (!remoteFields.length) return
    const results = {}
    await Promise.all(remoteFields.map(async (f) => {
      try {
        const res = await api.get(f.source)
        results[f.name] = res.data?.data || res.data || []
      } catch (e) {
        results[f.name] = []
      }
    }))
    setRemoteOptions((prev) => ({ ...prev, ...results }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const hasFiles = fields.some((field) => field.type === 'file' && (
        formData[field.name] instanceof File ||
        formData[field.name] instanceof FileList ||
        Array.isArray(formData[field.name])
      ))

      const payload = hasFiles ? new FormData() : { ...formData }
      if (!hasFiles) {
        Object.entries(removedImages).forEach(([fieldName, removed]) => {
          if (removed) payload[`remove_${fieldName}`] = 'true'
        })
      }
      if (hasFiles) {
        fields.forEach((field) => {
          const value = formData[field.name]
          if (field.type === 'file') {
            const files = value instanceof FileList ? Array.from(value) : Array.isArray(value) ? value : value ? [value] : []
            files.forEach((file) => payload.append(field.name, file))
          } else {
            payload.append(field.name, value ?? '')
          }
        })

        Object.entries(removedImages).forEach(([fieldName, removed]) => {
          if (removed) payload.append(`remove_${fieldName}`, 'true')
        })
      }


      if (selected) {
        await api.put(`${endpoint}/${selected._id || selected.id}`, payload)
      } else {
        await api.post(endpoint, payload)
      }
      await fetchRows()
      setSuccess(`${title} saved successfully`)
      setIsModalOpen(false)
      setSelected(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || `Failed to save ${title.toLowerCase()}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!await confirm(`Delete ${getRowTitle?.(row) || row.title || row.name || 'this record'}?`)) return
    try {
      await api.delete(`${endpoint}/${row._id || row.id}`)
      await fetchRows()
      setSuccess(`${title} deleted successfully`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || `Failed to delete ${title.toLowerCase()}`)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">{title}</h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={fetchRows} className="p-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-text-secondary hover:text-text transition-all" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          {supportIsOwn && (
            <label className="flex items-center gap-2 cursor-pointer bg-surface border border-border px-4 py-2.5 rounded-xl">
              <input
                type="checkbox"
                checked={isOwn}
                onChange={(e) => {
                  setIsOwn(e.target.checked)
                  resetPage()
                }}
                className="rounded text-primary focus:ring-primary/20 bg-input-bg border-border"
              />
              <span className="text-sm font-medium text-text-secondary">My Records</span>
            </label>
          )}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-text-secondary/60" />
            <input
              type="search"
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-glow-primary">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {error && <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-2xl text-sm">{error}</div>}
      {success && <div className="bg-success-bg border border-success-border text-success-text p-4 rounded-2xl text-sm">{success}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin"></div>
          <span className="text-text-secondary text-sm">Loading records...</span>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-glass-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-secondary text-text-secondary text-sm font-semibold  tracking-wider">
                  {columns.map((column) => <th key={column.key} className="p-4">{column.label}</th>)}
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-secondary/40 text-sm text-text">
                    {columns.map((column) => (
                      <td key={column.key} className="p-4 max-w-md">
                        {column.type === 'image' && row[column.key] ? (
                          <img src={assetUrl(row[column.key])} alt={row.title || title} className="h-12 w-16 rounded-lg object-cover border border-border" />
                        ) : (
                          <span className="line-clamp-2">{column.render ? column.render(row) : row[column.key] || '-'}</span>
                        )}
                      </td>
                    ))}
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
                    <td colSpan={columns.length + 1} className="p-12 text-center text-sm text-text-secondary">No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border bg-surface-secondary/40 text-sm">
              <span className="text-text-secondary">
                Page {page} of {totalPages} {total ? `(${total} total)` : ''}
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
                <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} title={selected ? `Edit ${title}` : `Add ${title}`} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4 max-h-[76vh] overflow-y-auto pr-1 text-text">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm  font-semibold text-text-secondary mb-1.5">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea rows="4" value={formData[field.name] || ''} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} className={fieldClass} disabled={saving} />
                ) : field.type === 'select' ? (
                  <select value={formData[field.name] ?? ''} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} className={fieldClass} disabled={saving}>
                    <option value="" className="bg-surface text-text">Select {field.label}</option>
                    {field.options.map((option) => <option key={option.value} value={option.value} className="bg-surface text-text">{option.label}</option>)}
                  </select>
                ) : field.type === 'select-remote' ? (
                  <select value={formData[field.name] ?? ''} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} className={fieldClass} disabled={saving}>
                    <option value="" className="bg-surface text-text">Select {field.label}</option>
                    {(remoteOptions[field.name] || []).map((option) => (
                      <option key={option.id} value={option.id} className="bg-surface text-text">{option.name || option.country || option.state || option.city || option.business}</option>
                    ))}
                  </select>
                ) : field.type === 'file' ? (
                  <div className="flex flex-col bg-input-bg border border-border rounded-xl p-3">
                        {imagePreview?.[field.name] && (
                      <div className="relative w-fit">
                        <img src={imagePreview[field.name]} alt="Preview" className="h-20 w-28 rounded-lg object-cover border border-border" />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview((prev) => ({ ...prev, [field.name]: null }))
                            setFormData({ ...formData, [field.name]: '' })
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold"
                        >
                          X
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept={field.accept || 'image/*'}
                      multiple={field.multiple}
                      onChange={(e) => {
                        const file = field.multiple ? e.target.files : e.target.files?.[0] || ''
                        setFormData({ ...formData, [field.name]: file })
                        if (!field.multiple && file) {
                          setImagePreview((prev) => ({ ...prev, [field.name]: URL.createObjectURL(file) }))
                          setRemovedImages((prev) => ({ ...prev, [field.name]: false }))
                        }
                      }}
                      className="w-full text-sm text-text file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                      disabled={saving}
                    />
                    {/* New file preview */}
                
                    {/* Existing image from server */}
                    {!imagePreview?.[field.name] && selected?.[field.name] && !removedImages[field.name] && !field.multiple && (
                      <div className="flex items-center gap-3">
                        <img src={assetUrl(selected[field.name])} alt="Current" className="h-16 w-20 rounded-lg object-cover border border-border" />
                        <div className="flex flex-col gap-1">
                          <a href={assetUrl(selected[field.name])} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline font-semibold">
                            View Current
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setRemovedImages((prev) => ({ ...prev, [field.name]: true }))
                              setFormData({ ...formData, [field.name]: '' })
                            }}
                            className="flex items-center gap-1 text-xs text-error-text hover:underline"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    )}
                    {removedImages[field.name] && (
                      <span className="text-xs text-error-text">Image will be removed on save.</span>
                    )}
                  </div>
                ) : (
                  <input type={field.type || 'text'} value={formData[field.name] || ''} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} className={fieldClass} disabled={saving} />
                )}
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving} className="flex justify-self-end bg-primary hover:bg-primary-hover text-white p-3 rounded-xl font-semibold text-sm tracking-wider  disabled:opacity-50 shadow-glow-primary">
            {saving ? 'Saving...' : 'Save Record'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
