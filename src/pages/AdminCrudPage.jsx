import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Edit2, Plus, RefreshCw, Search, Trash2, Settings } from 'lucide-react'
import api, { assetUrl } from '../lib/api'
import Loader from '../components/common/Loader'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import usePagination from '../hooks/usePagination'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import DatePicker from '../components/DatePicker'
import Table from '../components/common/Table'
import FileDropzone from '../components/common/FileDropzone'

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10'
export default function AdminCrudPage({ title, subtitle, endpoint, fields, columns, getRowTitle, supportIsOwn }) {
  const emptyForm = useMemo(() => {
    return fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue ?? '' }), {})
  }, [fields])

  const [rows, setRows] = useState([])
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(10)
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
          <Button onClick={fetchRows} variant="secondary" className="!p-2.5" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          {supportIsOwn && (
            <label className="flex items-center gap-2 cursor-pointer bg-surface border border-border px-4 py-2.5 rounded-xl">
              <input
                type="checkbox"
                checked={isOwn}
                onChange={(e) => {
                  setIsOwn(e.target.checked)
                  resetPage()
                }}
                className="rounded text-primary focus:ring-primary/20 bg-input-bg border-border accent-primary"
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
          <Button onClick={openCreate} variant="primary" icon={<Plus className="w-4 h-4" />}>
            Add
          </Button>
        </div>
      </div>

      {error && <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-2xl text-sm">{error}</div>}
      {success && <div className="bg-success-bg border border-success-border text-success-text p-4 rounded-2xl text-sm">{success}</div>}

      {loading && rows.length === 0 ? (
        <div className="py-20"><Loader text="Loading records..." /></div>
      ) : (
        <Table
          columns={[
            ...columns.map(c => ({
              header: c.label,
              key: c.key,
              render: (row) => (
                c.type === 'image' && row[c.key] ? (
                  <img src={assetUrl(row[c.key])} alt={row.title || title} className="h-12 w-16 rounded-lg object-cover border border-border" />
                ) : (
                  <span className="line-clamp-2">{c.render ? c.render(row) : row[c.key] || '-'}</span>
                )
              )
            })),
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
            icon: Settings,
            title: 'No records found',
            description: 'Try expanding your search criteria or add a new record'
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
      )}

      <Modal isOpen={isModalOpen} title={selected ? `Edit ${title}` : `Add ${title}`} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4 text-text">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name}>
                {field.type === 'textarea' ? (
                  <>
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">{field.label}</label>
                    <textarea rows="4" value={formData[field.name] || ''} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} className={fieldClass} disabled={saving} />
                  </>
                ) : field.type === 'select' ? (
                  <Select 
                    label={field.label}
                    value={formData[field.name] ?? ''} 
                    onChange={(val) => setFormData({ ...formData, [field.name]: val })} 
                    disabled={saving}
                    options={field.options}
                  />
                ) : field.type === 'select-remote' ? (
                  <Select 
                    label={field.label}
                    value={formData[field.name] ?? ''} 
                    onChange={(val) => setFormData({ ...formData, [field.name]: val })} 
                    disabled={saving}
                    options={(remoteOptions[field.name] || []).map((option) => ({
                      label: option.name || option.country || option.state || option.city || option.business,
                      value: option.id
                    }))}
                  />
                ) : field.type === 'file' ? (
                  <>
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">{field.label}</label>
                    <div className="flex flex-col bg-input-bg border border-border rounded-xl p-3">
                      <FileDropzone
                        accept={field.accept || 'image/*'}
                        multiple={field.multiple}
                        onFilesSelected={(files) => {
                          const file = field.multiple ? files : files?.[0] || ''
                          setFormData({ ...formData, [field.name]: file })
                          if (!field.multiple && file) {
                            setImagePreview((prev) => ({ ...prev, [field.name]: URL.createObjectURL(file) }))
                            setRemovedImages((prev) => ({ ...prev, [field.name]: false }))
                          }
                        }}
                        disabled={saving}
                        label={`Click or Drag ${field.label}`}
                        previews={[
                          ...(!imagePreview?.[field.name] && selected?.[field.name] && !removedImages[field.name] && !field.multiple ? [{
                            url: assetUrl(selected[field.name]),
                            onRemove: () => {
                              setRemovedImages((prev) => ({ ...prev, [field.name]: true }))
                              setFormData({ ...formData, [field.name]: '' })
                            }
                          }] : []),
                          ...(imagePreview?.[field.name] ? [{
                            url: imagePreview[field.name],
                            onRemove: () => {
                              setImagePreview((prev) => ({ ...prev, [field.name]: null }))
                              setFormData({ ...formData, [field.name]: '' })
                            }
                          }] : [])
                        ]}
                      />
                      {removedImages[field.name] && (
                        <span className="text-xs text-error-text">Image will be removed on save.</span>
                      )}
                    </div>
                  </>
                ) : field.type === 'date' ? (
                  <>
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">{field.label}</label>
                    <DatePicker 
                      value={formData[field.name] || ''} 
                      onChange={(val) => setFormData({ ...formData, [field.name]: val })} 
                      disabled={saving}
                      placeholder="Select Date"
                    />
                  </>
                ) : (
                  <Input 
                    type={field.type || 'text'} 
                    label={field.label}
                    value={formData[field.name] || ''} 
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} 
                    disabled={saving} 
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
