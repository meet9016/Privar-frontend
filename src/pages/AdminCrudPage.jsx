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
import { toast } from '../lib/toast'
import { isValidEmail } from '../lib/validation'

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10'
export default function AdminCrudPage({ title, subtitle, endpoint, fields, columns, getRowTitle, supportIsOwn, hideAdd, hideDelete, deleteAction }) {
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
  const [formError, setFormError] = useState('')

  const [imagePreview, setImagePreview] = useState(null)
  const [removedImages, setRemovedImages] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})

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
    setFormError('')
    setError('')
    setFieldErrors({})
    setIsModalOpen(true)

    setImagePreview(null)
    setRemovedImages({})
  }

  const openEdit = async (row) => {
    setSelected(row)
    setError('')
    setIsModalOpen(true)
    setImagePreview(null)
    setRemovedImages({})

    const buildFormData = (data) => fields.reduce((acc, field) => {
      let val = field.type === 'file' ? '' : data[field.name] ?? data[field.fallback] ?? field.defaultValue ?? ''
      // For 'name' field on birthday/user records: compose from first_name + last_name if name is empty
      if (field.name === 'name' && !val && (data.first_name || data.last_name)) {
        val = [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(' ')
      }
      // Format ISO dates to YYYY-MM-DD for date fields
      if (field.type === 'date' && val && typeof val === 'string' && val.includes('T')) {
        const d = new Date(val)
        if (!isNaN(d.getTime())) val = d.toISOString().slice(0, 10)
      }
      return { ...acc, [field.name]: val }
    }, {})

    // Set initial values from the row list data immediately
    setFormData(buildFormData(row))

    const cleanEndpoint = endpoint.split('?')[0]
    try {
      // Fetch fresh, absolute latest data from the backend by ID
      const res = await api.get(`${cleanEndpoint}/${row._id || row.id}`)
      const freshData = res.data?.data || res.data
      if (freshData) {
        setSelected(freshData)
        setFormData(buildFormData(freshData))
      }
    } catch (err) {
      console.error("Failed to fetch fresh row data:", err)
      // Fallback: keep the initial local row data in the form
    }
    setFormError('')
    setFieldErrors({})
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
    setFormError('')
    setFieldErrors({})

    // Validate required fields
    const missing = {}
    const missingRequired = fields.filter(f => {
      const val = formData[f.name]
      const isEmpty = val === undefined || val === null || String(val).trim() === ''
      if (f.required && f.type !== 'file' && isEmpty) {
        missing[f.name] = true
        return true
      }
      return false
    })

    let invalidEmailField = null
    fields.forEach(f => {
      const isEmail = f.type === 'email' || f.name.toLowerCase().includes('email')
      const val = formData[f.name]
      if (isEmail && val && String(val).trim() && !isValidEmail(String(val))) {
        missing[f.name] = true
        if (!invalidEmailField) invalidEmailField = f.label
      }
    })

    if (missingRequired.length > 0) {
      setFieldErrors(missing)
      setFormError(`${missingRequired[0].label} is required`)
      setSaving(false)
      return
    }
    if (invalidEmailField) {
      setFieldErrors(missing)
      setFormError(`Please enter a valid email address for ${invalidEmailField} (e.g. user@gmail.com)`)
      setSaving(false)
      return
    }
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


      const cleanEndpoint = endpoint.split('?')[0];
      if (selected) {
        await api.put(`${cleanEndpoint}/${selected._id || selected.id}`, payload)
      } else {
        await api.post(cleanEndpoint, payload)
      }
      await fetchRows()
      toast.success(`${title} saved successfully`)
      setIsModalOpen(false)
      setSelected(null)
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || `Failed to save ${title.toLowerCase()}`
      setFormError(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!await confirm(`Delete ${getRowTitle?.(row) || row.title || row.name || 'this record'}?`)) return
    try {
      const cleanEndpoint = endpoint.split('?')[0];
      if (deleteAction === 'clear-dob') {
        // Birthday: clear DOB only, not delete user
        await api.put(`${cleanEndpoint}/${row._id || row.id}`, { dob: null, anniversary: null })
      } else {
        await api.delete(`${cleanEndpoint}/${row._id || row.id}`)
      }
      await fetchRows()
      toast.success(`${title} deleted successfully`)
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to delete ${title.toLowerCase()}`)
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
          {!hideAdd && (
            <Button onClick={openCreate} variant="primary" icon={<Plus className="w-4 h-4" />}>
              Add
            </Button>
          )}
        </div>
      </div>

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
                  <span className="line-clamp-2">
                    {c.render ? c.render(row) : (
                      row[c.key + '_name'] ||
                      row[c.key?.replace(/_id$/, '_name')] ||
                      (remoteOptions[c.key] || remoteOptions['parent_id'] || []).find(opt => String(opt.id || opt._id) === String(row[c.key]))?.name ||
                      (remoteOptions[c.key] || remoteOptions['parent_id'] || []).find(opt => String(opt.id || opt._id) === String(row[c.key]))?.country ||
                      (remoteOptions[c.key] || remoteOptions['parent_id'] || []).find(opt => String(opt.id || opt._id) === String(row[c.key]))?.state ||
                      (remoteOptions[c.key] || remoteOptions['parent_id'] || []).find(opt => String(opt.id || opt._id) === String(row[c.key]))?.city ||
                      row[c.key] || '-'
                    )}
                  </span>
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
                  {!hideDelete && (
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
        <form onSubmit={handleSave} className="space-y-4 text-text" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ overflow: 'visible' }}>
            {fields.map((field, fieldIdx) => (
              <div key={field.name} style={{ zIndex: fields.length - fieldIdx, position: 'relative' }}>
                {field.type === 'textarea' ? (
                  <>
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <textarea 
                      required={field.required} 
                      rows="4" 
                      value={formData[field.name] || ''} 
                      onChange={(e) => {
                        setFormData({ ...formData, [field.name]: e.target.value })
                        if (fieldErrors[field.name]) setFieldErrors({ ...fieldErrors, [field.name]: false })
                      }} 
                      className={`${fieldClass} ${fieldErrors[field.name] ? 'border-red-500' : ''}`} 
                      disabled={saving || field.disabled} 
                    />
                    {fieldErrors[field.name] && <p className="text-red-500 text-xs mt-1 font-semibold">{field.label} is required</p>}
                  </>
                ) : field.type === 'select' ? (
                  <Select 
                    label={field.label}
                    required={field.required}
                    value={formData[field.name] ?? ''} 
                    onChange={(val) => {
                      setFormData({ ...formData, [field.name]: val })
                      if (fieldErrors[field.name]) setFieldErrors({ ...fieldErrors, [field.name]: false })
                    }} 
                    disabled={saving}
                    options={field.options}
                    placeholder={field.name === 'status' ? 'Select Status' : 'Select an option'}
                    error={fieldErrors[field.name] ? `${field.label} is required` : undefined}
                  />
                ) : field.type === 'select-remote' ? (
                  <Select 
                    label={field.label}
                    required={field.required}
                    value={formData[field.name] ?? ''} 
                    onChange={(val) => {
                      setFormData({ ...formData, [field.name]: val })
                      if (fieldErrors[field.name]) setFieldErrors({ ...fieldErrors, [field.name]: false })
                    }} 
                    disabled={saving}
                    options={(remoteOptions[field.name] || []).map((option) => ({
                      label: option.name || option.country || option.state || option.city || option.business || 'Unnamed',
                      value: option.id || option._id
                    }))}
                    error={fieldErrors[field.name] ? `${field.label} is required` : undefined}
                  />
                ) : field.type === 'file' ? (
                  <>
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex flex-col bg-input-bg border border-border rounded-xl p-3">
                      <FileDropzone
                        accept={field.accept || 'image/*'}
                        multiple={field.multiple}
                        error={fieldErrors[field.name] ? `${field.label} is required` : undefined}
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
                          ...(imagePreview?.[field.name] ? [{
                            url: imagePreview[field.name],
                            onRemove: () => {
                              setImagePreview((prev) => ({ ...prev, [field.name]: null }))
                              setFormData((prev) => ({ ...prev, [field.name]: '' }))
                            }
                          }] : (selected?.[field.name] || formData[field.name]) && !removedImages[field.name] && !field.multiple ? [{
                            url: assetUrl(selected?.[field.name] || formData[field.name]),
                            onRemove: () => {
                              setRemovedImages((prev) => ({ ...prev, [field.name]: true }))
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
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <DatePicker 
                      value={formData[field.name] || ''} 
                      onChange={(val) => {
                        setFormData({ ...formData, [field.name]: val })
                        if (fieldErrors[field.name]) setFieldErrors({ ...fieldErrors, [field.name]: false })
                      }} 
                      disabled={saving}
                      required={field.required}
                      placeholder="Select Date"
                      error={fieldErrors[field.name] ? `${field.label} is required` : undefined}
                    />
                  </>
                ) : (
                  <Input 
                    type={field.type || 'text'} 
                    label={field.label}
                    required={field.required}
                    value={formData[field.name] || ''} 
                    onChange={(e) => {
                      let val = e.target.value
                      const fieldType = (field.type || 'text').toLowerCase()
                      const nameLower = field.name.toLowerCase()

                      if (fieldType === 'email') {
                        // Keep email characters
                      } else if (nameLower === 'ifsc_code' || nameLower.includes('gst')) {
                        val = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15)
                      } else if (nameLower.includes('mobile') || nameLower.includes('whatsapp') || nameLower.includes('phone') || nameLower === 'number') {
                        val = val.replace(/\D/g, '').slice(0, 10)
                      } else if (nameLower.includes('account_number') || nameLower.includes('pincode') || nameLower.includes('zip')) {
                        val = val.replace(/\D/g, '').slice(0, 20)
                      } else if (nameLower.includes('salary') || nameLower.includes('amount') || nameLower.includes('percentage') || nameLower.includes('height') || nameLower.includes('weight')) {
                        val = val.replace(/[^0-9.]/g, '')
                      } else {
                        // For name, country, state, city, village, taluka, district, title, full_name, etc. -> Alphabets & spaces ONLY!
                        if (nameLower.includes('name') || nameLower.includes('title') || nameLower.includes('country') || nameLower.includes('state') || nameLower.includes('city') || nameLower.includes('district') || nameLower.includes('taluka') || nameLower.includes('village') || nameLower.includes('gotra') || nameLower.includes('occupation') || nameLower.includes('complexion') || nameLower.includes('education')) {
                          val = val.replace(/[^a-zA-Z\s]/g, '')
                          if (nameLower.includes('full_name') || nameLower === 'name') {
                            val = val.slice(0, 30)
                          }
                        }
                      }

                      setFormData({ ...formData, [field.name]: val })
                      if (fieldErrors[field.name]) setFieldErrors({ ...fieldErrors, [field.name]: false })
                    }} 
                    disabled={saving || field.disabled} 
                    error={fieldErrors[field.name] ? `${field.label} is required` : undefined}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="pb-32" />
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
