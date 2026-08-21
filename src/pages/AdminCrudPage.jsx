import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Edit2, Plus, RefreshCw, Search, Trash2, Settings, ImageOff, Filter, X } from 'lucide-react'
import api, { assetUrl, formatDate } from '../lib/api'
import Loader from '../components/common/Loader'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import usePagination from '../hooks/usePagination'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import DatePicker from '../components/DatePicker'
import Tooltip from '../components/common/Tooltip'
import Table from '../components/common/Table'
import FileDropzone from '../components/common/FileDropzone'
import SearchInput from '../components/common/SearchInput'
import { toast } from '../lib/toast'
import { isValidEmail } from '../lib/validation'
import useDebounce from '../hooks/useDebounce'

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10'
export default function AdminCrudPage({ title, subtitle, endpoint, fields, columns, getRowTitle, supportIsOwn, hideAdd, hideDelete, hideActions, hideEdit, hideFilter, deleteAction, gridCols, customHeaderActions, customFilters, extraParams }) {
  const shouldHideActions = hideActions || (hideEdit && hideDelete)
  const emptyForm = useMemo(() => {
    return fields.reduce((acc, field) => ({ 
      ...acc, 
      [field.name]: field.defaultValue ?? (field.name === 'status' ? 1 : '')
    }), {})
  }, [fields])

  const [rows, setRows] = useState([])
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(15)
  const [loading, setLoading] = useState(false)
  const [search, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selected, setSelected] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [remoteOptions, setRemoteOptions] = useState({})
  const [isOwn, setIsOwn] = useState(false)
  const [formError, setFormError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  const [imagePreview, setImagePreview] = useState(null)
  const [removedImages, setRemovedImages] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})

  const currentPage = Math.min(Math.max(page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const params = getParams({ search: debouncedSearch, ...(extraParams || {}) })
      if (supportIsOwn) params.is_own = isOwn
      if (filterStatus !== '') params.status = filterStatus
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
  }, [endpoint, page, debouncedSearch, title, supportIsOwn, isOwn, getParams, setPaginationData, extraParams, filterStatus])

  useEffect(() => {
    fetchRows()
  }, [fetchRows, endpoint])

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
    setFormError('')
    setFieldErrors({})
    setImagePreview(null)
    setRemovedImages({})

    const buildFormData = (data) => fields.reduce((acc, field) => {
      let val = field.type === 'file' 
        ? '' 
        : (data[field.name] !== undefined && data[field.name] !== null ? data[field.name] : (data[field.fallback] !== undefined && data[field.fallback] !== null ? data[field.fallback] : (field.defaultValue ?? '')))
      
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
    const initialForm = buildFormData(row)
    setFormData(initialForm)
    setIsModalOpen(true)

    const cleanEndpoint = endpoint.split('?')[0]
    const rowId = row._id || row.id
    if (rowId) {
      try {
        const res = await api.get(`${cleanEndpoint}/${rowId}`)
        const freshData = res.data?.data || res.data
        if (freshData) {
          setSelected(freshData)
          setFormData(buildFormData(freshData))
        }
      } catch (err) {
        console.error("Failed to fetch fresh row data:", err)
      }
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
      const missingNames = missingRequired.map(f => f.label).join(', ')
      setFormError(
        missingRequired.length === 1
          ? `${missingRequired[0].label} is required`
          : `Please fill all required fields: ${missingNames}`
      )
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

  const handleToggleStatus = async (row) => {
    const id = row._id || row.id
    if (!id) return
    const newStatus = Number(row.status) === 1 ? 0 : 1

    // Optimistic UI update
    setRows(prevRows => prevRows.map(r => {
      if ((r._id || r.id) === id) {
        return { ...r, status: newStatus }
      }
      return r
    }))

    try {
      const cleanEndpoint = endpoint.split('?')[0];
      await api.put(`${cleanEndpoint}/${id}`, { status: newStatus })
      toast.success('Status updated')
    } catch (err) {
      // Revert on error
      setRows(prevRows => prevRows.map(r => {
        if ((r._id || r.id) === id) {
          return { ...r, status: Number(row.status) === 1 ? 1 : 0 }
        }
        return r
      }))
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleBulkStatus = async (ids, newStatus) => {
    const cleanEndpoint = endpoint.split('?')[0]
    try {
      await Promise.all(ids.map(id => api.put(`${cleanEndpoint}/${id}`, { status: newStatus })))
      toast.success(`${ids.length} record(s) status updated`)
      fetchRows()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleBulkDelete = async (ids) => {
    if (!await confirm(`Delete ${ids.length} selected record(s)?`)) return
    const cleanEndpoint = endpoint.split('?')[0]
    try {
      await Promise.all(ids.map(id => api.delete(`${cleanEndpoint}/${id}`)))
      toast.success(`${ids.length} record(s) deleted`)
      fetchRows()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete records')
    }
  }

  return (
    <div className="space-y-6 text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">{title}</h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
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
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder={`Search ${title.toLowerCase()}...`}
          />
          {!hideFilter && (
            <div className="relative z-20">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center h-10 px-3 rounded-xl border transition-all cursor-pointer ${showFilters ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-secondary hover:bg-surface border-border text-text-secondary hover:text-text'}`}
                title="Toggle Filters"
              >
                <Filter className="w-4 h-4" />
              </button>
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-[240px] bg-surface border border-border rounded-2xl p-4 shadow-glass-sm animate-fade-in space-y-4">
                  <div className="flex flex-col gap-3">
                    {customFilters}
                    <Select
                      value={filterStatus}
                      onChange={(val) => { setFilterStatus(val); resetPage(); }}
                      placeholder="All Status"
                      searchable={false}
                      options={[
                        { label: 'All Status', value: '' },
                        { label: 'Active', value: '1' },
                        { label: 'Inactive', value: '0' }
                      ]}
                    />
                  </div>
                  <div className="flex justify-end border-t border-border pt-3">
                    <button type="button" onClick={() => { setFilterStatus(''); resetPage(); }} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer">
                      <RefreshCw className="w-3.5 h-3.5" /> Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {customHeaderActions}
          {!hideAdd && (
            <Button onClick={openCreate} variant="primary" icon={<Plus className="w-4 h-4" />} className="h-10">
              Add {title}
            </Button>
          )}
        </div>
      </div>

      <Table
        columns={[
          ...columns.map(c => ({
            header: c.label,
            key: c.key,
            render: (row) => (
              c.key === 'status' ? (
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={Number(row.status ?? 1) === 1 || String(row.status).toLowerCase() === 'active' || String(row.status).toLowerCase() === 'approved'}
                      onChange={() => handleToggleStatus(row)}
                    />
                    <div className="w-9 h-5 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              ) : c.key === 'marital_status' ? (
                <span className="inline-flex px-2.5 py-1 rounded-lg bg-surface-secondary border border-border text-text-secondary font-medium text-xs">
                  {row.marital_status || '-'}
                </span>
              ) : c.type === 'image' ? (
                row[c.key] ? (
                  <img src={assetUrl(row[c.key])} alt={row.title || title} className="h-8 w-11 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="h-8 w-11 rounded-lg border border-border/60 bg-surface-secondary flex items-center justify-center">
                    <ImageOff className="h-4 w-4 text-text-secondary/40" />
                  </div>
                )
              ) : c.type === 'date' || c.key.includes('date') || c.key === 'dob' || c.key === 'anniversary' ? (
                <span>{c.render ? c.render(row) : formatDate(row[c.key])}</span>
              ) : (
                (() => {
                  const displayValue = c.render ? c.render(row) : (
                    row[c.key + '_name'] ||
                    row[c.key?.replace(/_id$/, '_name')] ||
                    (remoteOptions[c.key] || remoteOptions['parent_id'] || []).find(opt => String(opt.id || opt._id) === String(row[c.key]))?.name ||
                    (remoteOptions[c.key] || remoteOptions['parent_id'] || []).find(opt => String(opt.id || opt._id) === String(row[c.key]))?.country ||
                    (remoteOptions[c.key] || remoteOptions['parent_id'] || []).find(opt => String(opt.id || opt._id) === String(row[c.key]))?.state ||
                    (remoteOptions[c.key] || remoteOptions['parent_id'] || []).find(opt => String(opt.id || opt._id) === String(row[c.key]))?.city ||
                    row[c.key] || '-'
                  );
                  const rawString = typeof displayValue === 'string' ? displayValue : (typeof row[c.key] === 'string' ? row[c.key] : '');
                  const hasLongText = rawString && rawString.length > 25;
                  
                  if (hasLongText && rawString !== '-') {
                    return (
                      <Tooltip content={rawString}>
                        <span className="block max-w-[260px] truncate hover:text-primary transition-colors">
                          {displayValue}
                        </span>
                      </Tooltip>
                    );
                  }

                  return (
                    <span className="block max-w-[260px] truncate">
                      {displayValue}
                    </span>
                  );
                })()
              )
            )
          })),
          ...(shouldHideActions ? [] : [{
            header: 'Actions',
            key: 'actions',
            align: 'left',
            render: row=> ( <div className="flex items-center justify-start gap-2">
                {!hideEdit && (
                  <button onClick={() => openEdit(row)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!hideDelete && (
                  <button onClick={() => handleDelete(row)} className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          }])
        ]}
        data={rows}
        keyField="id"
        loading={loading}
        onBulkStatus={columns.some(c => c.key === 'status') ? handleBulkStatus : undefined}
        onBulkDelete={!hideDelete ? handleBulkDelete : undefined}
        emptyState={{
          title: `No ${title} found`,
          description: `Try expanding your search criteria or add a new ${title.toLowerCase()}`,
          actionLabel: `Add ${title}`,
          onAction: hideAdd ? undefined : openCreate
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

      <Modal isOpen={isModalOpen} maxWidth={fields.length > 10 ? 'max-w-7xl' : fields.length > 5 ? 'max-w-5xl' : 'max-w-3xl'} title={selected ? `Edit ${title}` : `Add ${title}`} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-3.5 text-text" noValidate>
          <div className={`grid grid-cols-1 ${gridCols || (fields.some(f => f.className) ? 'md:grid-cols-2' : fields.length > 10 ? 'sm:grid-cols-2 md:grid-cols-4' : fields.length > 4 ? 'sm:grid-cols-2 md:grid-cols-3' : 'md:grid-cols-2')} gap-3.5`} style={{ overflow: 'visible' }}>
            {fields.map((field, fieldIdx) => {
              const isFullRow = field.type === 'textarea' || (field.type === 'file' && field.multiple);
              const colSpanClass = field.className || (isFullRow 
                ? (gridCols ? 'md:col-span-2' : fields.length > 10 ? 'sm:col-span-2 md:col-span-4' : fields.length > 4 ? 'sm:col-span-2 md:col-span-3' : 'md:col-span-2')
                : '');
              
              return (
              <div key={field.name} className={colSpanClass} style={{ zIndex: fields.length - fieldIdx, position: 'relative' }}>
                {field.type === 'textarea' ? (
                  <>
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <textarea 
                      required={field.required} 
                      rows="2" 
                      value={formData[field.name] || ''} 
                      placeholder={field.placeholder || `Enter ${field.label}`}
                      onChange={(e) => {
                        setFormData({ ...formData, [field.name]: e.target.value })
                        if (fieldErrors[field.name]) setFieldErrors({ ...fieldErrors, [field.name]: false })
                      }} 
                      className={`${fieldClass} ${fieldErrors[field.name] ? 'border-red-500' : ''}`} 
                      disabled={saving || field.disabled} 
                    />
                    {fieldErrors[field.name] && <p className="text-red-500 text-xs mt-1 font-semibold">{field.label} is required</p>}
                  </>
                ) : (field.name === 'status' || field.type === 'switch') ? (
                  <div className="flex flex-col justify-center h-full pt-1">
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                      {field.label || 'Status'}
                    </label>
                    <div className="flex items-center gap-3 py-1">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={Number(formData[field.name] ?? 1) === 1}
                          onChange={(e) => {
                            const newStatus = e.target.checked ? 1 : 0;
                            setFormData({ ...formData, [field.name]: newStatus });
                            if (fieldErrors[field.name]) setFieldErrors({ ...fieldErrors, [field.name]: false });
                          }}
                          disabled={saving || field.disabled}
                        />
                        <div className="w-11 h-6 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                      <span className="text-sm font-semibold text-text">
                        {Number(formData[field.name] ?? 1) === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ) : field.type === 'select' ? (
                  <Select 
                    label={field.label}
                    required={field.required}
                    placement={field.name === 'status' ? 'down' : 'auto'}
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
                  <div className="flex flex-col">
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <FileDropzone
                      accept={field.accept || 'image/*'}
                      multiple={field.multiple}
                      error={fieldErrors[field.name] ? `${field.label} is required` : undefined}
                      onFilesSelected={(files) => {
                        if (field.multiple) {
                          const current = Array.isArray(formData[field.name]) ? formData[field.name] : []
                          setFormData({ ...formData, [field.name]: [...current, ...files] })
                        } else {
                          const file = files?.[0] || ''
                          setFormData({ ...formData, [field.name]: file })
                          if (file) {
                            setImagePreview((prev) => ({ ...prev, [field.name]: URL.createObjectURL(file) }))
                            setRemovedImages((prev) => ({ ...prev, [field.name]: false }))
                          }
                        }
                      }}
                      disabled={saving}
                      label={`Click or Drag ${field.label}`}
                      previews={(() => {
                        if (field.multiple) {
                          const existingUrls = Array.isArray(selected?.[field.name]) ? selected[field.name] : (selected?.[field.name] ? [selected[field.name]] : [])
                          const newFiles = Array.isArray(formData[field.name]) ? formData[field.name] : (formData[field.name] ? [formData[field.name]] : [])
                          const previews = []
                          
                          existingUrls.forEach((url, idx) => {
                            if (!removedImages[`${field.name}_${idx}`]) {
                              previews.push({
                                url: assetUrl(url),
                                onRemove: () => setRemovedImages(prev => ({ ...prev, [`${field.name}_${idx}`]: true }))
                              })
                            }
                          })
                          
                          newFiles.forEach((file, idx) => {
                            if (file instanceof File) {
                              previews.push({
                                url: URL.createObjectURL(file),
                                onRemove: () => {
                                  const newArr = [...newFiles]
                                  newArr.splice(idx, 1)
                                  setFormData(prev => ({ ...prev, [field.name]: newArr }))
                                }
                              })
                            }
                          })
                          return previews
                        } else {
                          return [
                            ...(imagePreview?.[field.name] ? [{
                              url: imagePreview[field.name],
                              onRemove: () => {
                                setImagePreview((prev) => ({ ...prev, [field.name]: null }))
                                setFormData((prev) => ({ ...prev, [field.name]: '' }))
                              }
                            }] : (selected?.[field.name] || formData[field.name]) && !removedImages[field.name] ? [{
                              url: assetUrl(selected?.[field.name] || formData[field.name]),
                              onRemove: () => {
                                setRemovedImages((prev) => ({ ...prev, [field.name]: true }))
                              }
                            }] : [])
                          ]
                        }
                      })()}
                    />
                    {removedImages[field.name] && !field.multiple && (
                      <span className="text-xs text-error-text mt-1">Image will be removed on save.</span>
                    )}
                  </div>
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
                    placeholder={field.placeholder || `Enter ${field.label}`}
                    value={formData[field.name] || ''} 
                    onChange={(e) => {
                      let val = e.target.value
                      const fieldType = (field.type || 'text').toLowerCase()
                      const nameLower = field.name.toLowerCase()

                      if (fieldType === 'email') {
                        // Keep email characters
                      } else if (nameLower === 'ifsc_code' || nameLower.includes('gst')) {
                        val = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15)
                      } else if (nameLower.includes('mobile') || nameLower.includes('whatsapp') || nameLower.includes('phone') || nameLower.includes('contact') || nameLower.includes('number')) {
                        val = val.replace(/\D/g, '').slice(0, 10)
                      } else if (nameLower.includes('account_number') || nameLower.includes('pincode') || nameLower.includes('zip')) {
                        val = val.replace(/\D/g, '').slice(0, 20)
                      } else if (nameLower.includes('salary') || nameLower.includes('amount') || nameLower.includes('percentage') || nameLower.includes('height') || nameLower.includes('weight')) {
                        val = val.replace(/[^0-9.]/g, '')
                      } else {
                        // For name, country, state, city, village, taluka, district, title, full_name, etc. -> Alphabets & spaces ONLY!
                        if (nameLower.includes('name') || nameLower.includes('title') || nameLower.includes('country') || nameLower.includes('state') || nameLower.includes('city') || nameLower.includes('district') || nameLower.includes('taluka') || nameLower.includes('village') || nameLower.includes('gotra') || nameLower.includes('occupation') || nameLower.includes('complexion') || nameLower.includes('education')) {
                          if (title && title.toLowerCase().includes('blood group')) {
                            val = val.replace(/[^a-zA-Z\s+-]/g, '')
                          } else if (nameLower.includes('title')) {
                            val = val.replace(/[^a-zA-Z0-9\s.,/#+-]/g, '')
                          } else {
                            val = val.replace(/[^a-zA-Z\s]/g, '')
                          }
                          
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
              );
            })}
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

