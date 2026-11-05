import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Edit2, Plus, Trash2, ImageOff, CopyPlus, Upload, Download, FileSpreadsheet, AlertCircle, X } from 'lucide-react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import api, { assetUrl, formatDate } from '../lib/api'
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
import FilterPopover from '../components/common/FilterPopover'
import { toast } from '../lib/toast'
import { isValidEmail } from '../lib/validation'
import useDebounce from '../hooks/useDebounce'
import { transliterateText } from '../utils/transliterate'

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10'
export default function AdminCrudPage({ title, subtitle, endpoint, fields, columns, getRowTitle, supportIsOwn, hideAdd, hideDelete, hideActions, hideEdit, hideFilter, deleteAction, gridCols, customHeaderActions, customFilters, extraParams, onClearFilters, onApplyFilters, onToggleFilters, extraActiveFiltersCount, headerLeftContent, isRowEditable, isRowDeletable, transformData, rowClassName, customRowActions, selectable = false, allowDuplicate = false, onBulkDuplicate, allowMultipleAdd = false, allowBulkImport = false }) {
  const shouldHideActions = hideActions || (hideEdit && hideDelete)
  const emptyForm = useMemo(() => {
    return fields.reduce((acc, field) => ({
      ...acc,
      [field.name]: field.defaultValue ?? (field.name === 'status' ? 1 : '')
    }), {})
  }, [fields])

  const [rows, setRows] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(15)
  const [loading, setLoading] = useState(false)
  const [search, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [multipleItems, setMultipleItems] = useState([])
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false)
  const [bulkImportFile, setBulkImportFile] = useState(null)
  const [bulkImportLoading, setBulkImportLoading] = useState(false)
  const [bulkImportPreview, setBulkImportPreview] = useState([])
  const [bulkImportError, setBulkImportError] = useState('')
  const [formData, setFormData] = useState(emptyForm)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [remoteOptions, setRemoteOptions] = useState({})
  const [isOwn, setIsOwn] = useState(false)
  const [formError, setFormError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilterStatus, setDraftFilterStatus] = useState('')
  const [appliedFilterStatus, setAppliedFilterStatus] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [removedImages, setRemovedImages] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const params = getParams({ search: debouncedSearch, ...(extraParams || {}) })
      if (supportIsOwn) params.is_own = isOwn
      if (appliedFilterStatus !== '') params.status = appliedFilterStatus
      const res = await api.get(endpoint, { params })
      const data = res.data?.data || res.data || []
      const pg = res.data?.pagination || {}
      const rawData = Array.isArray(data) ? data : []
      const finalData = transformData ? transformData(rawData) : rawData
      setRows(finalData)
      setPaginationData(pg)
    } catch (err) {
      setRows([])
      setPaginationData({ page: 1, totalPages: 1, total: 0 })
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, debouncedSearch, title, supportIsOwn, isOwn, getParams, setPaginationData, extraParams, appliedFilterStatus, transformData])

  useEffect(() => {
    setRows([])
    setLoading(true)
  }, [endpoint])

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

  useEffect(() => {
    if (!isModalOpen) {
      setFieldErrors({})
      setImagePreview(null)
      setRemovedImages({})
    }
  }, [isModalOpen])

  const buildFormData = useCallback((data) => fields.reduce((acc, field) => {
    let val = field.type === 'file'
      ? ''
      : (data[field.name] !== undefined && data[field.name] !== null ? data[field.name] : (data[field.fallback] !== undefined && data[field.fallback] !== null ? data[field.fallback] : (field.defaultValue ?? '')))

    // If field expects name (e.g. location fields), check if explicit name field is available
    if (field.valueKey === 'name') {
      const explicitName = data[`${field.name}_name`]
      if (explicitName) {
        val = explicitName
      } else if (typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val.trim()) && data[`${field.name}_name`]) {
        val = data[`${field.name}_name`]
      }
    }

    // If field expects ID, but val is empty, check ${field.name}_id
    if (field.type === 'select-remote' && field.valueKey !== 'name' && !val && data[`${field.name}_id`]) {
      val = data[`${field.name}_id`]
    }

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
  }, {}), [fields])

  const openCreate = () => {
    setSelected(null)
    setIsDuplicate(false)
    setFormData(emptyForm)
    loadRemoteOptions(fields)
    setFieldErrors({})
    setImagePreview(null)
    setRemovedImages({})
    if (allowMultipleAdd) {
      const today = new Date().toISOString().split('T')[0]
      const gujaratiDays = ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર']
      const todayVar = gujaratiDays[new Date().getDay()]
      setMultipleItems([
        {
          ...emptyForm,
          date: today,
          var: todayVar,
          vaar: todayVar,
          status: 1,
          _tempId: Date.now()
        }
      ])
    } else {
      setMultipleItems([])
    }
    setIsModalOpen(true)
  }

  const openEdit = async (row) => {
    setSelected(row)
    setIsDuplicate(false)
    setMultipleItems([])
    setFieldErrors({})
    setImagePreview(null)
    setRemovedImages({})

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

  const handleDuplicateRow = async (row) => {
    setSelected(null)
    setIsDuplicate(true)
    setMultipleItems([])
    setFieldErrors({})
    setImagePreview(null)
    setRemovedImages({})

    const initialForm = buildFormData(row)
    setFormData(initialForm)
    setIsModalOpen(true)
    loadRemoteOptions(fields)
  }

  const addAnotherItem = () => {
    const gujaratiDays = ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર']
    const lastItem = multipleItems[multipleItems.length - 1]
    let nextDate = new Date().toISOString().split('T')[0]
    if (lastItem && lastItem.date) {
      const d = new Date(lastItem.date)
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + 1)
        nextDate = d.toISOString().split('T')[0]
      }
    }
    const nextVar = gujaratiDays[new Date(nextDate).getDay()]

    setMultipleItems(prev => [
      ...prev,
      {
        ...emptyForm,
        date: nextDate,
        var: nextVar,
        vaar: nextVar,
        author: lastItem?.author || '',
        status: 1,
        _tempId: Date.now() + Math.random()
      }
    ])
  }

  const removeItem = (idx) => {
    if (multipleItems.length <= 1) return
    setMultipleItems(prev => prev.filter((_, i) => i !== idx))
  }

  const updateItemField = (idx, fieldName, value) => {
    setMultipleItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [fieldName]: value }
      if (fieldName === 'date') {
        const gujaratiDays = ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર']
        const d = new Date(value)
        if (!isNaN(d.getTime())) {
          const v = gujaratiDays[d.getDay()]
          updated.var = v
          updated.vaar = v
        }
      }
      return updated
    }))
  }

  const downloadSampleTemplate = async () => {
    try {
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet(title || 'Data')

      const gujaratiDays = ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર']
      const today = new Date().toISOString().split('T')[0]
      const todayVar = gujaratiDays[new Date().getDay()]

      ws.columns = [
        { header: `${title} / Thought*`, key: 'suvichar', width: 45 },
        { header: 'Author / By', key: 'author', width: 22 },
        { header: 'Date (YYYY-MM-DD)', key: 'date', width: 20 },
        { header: 'Day / Var', key: 'var', width: 18 },
        { header: 'Status (1=Active, 0=Inactive)', key: 'status', width: 25 },
      ]

      const headerRow = ws.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } }
      headerRow.height = 24
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

      const sampleRows = [
        {
          suvichar: 'Learn from yesterday, live for today, hope for tomorrow.',
          author: 'Albert Einstein',
          date: today,
          var: todayVar,
          status: 1
        },
        {
          suvichar: 'જેનું મન શુદ્ધ છે, તેનું સમગ્ર જીવન ઉત્સવ છે.',
          author: 'ગાંધીજી',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          var: gujaratiDays[new Date(Date.now() + 86400000).getDay()],
          status: 1
        }
      ]

      sampleRows.forEach(sr => ws.addRow(sr))

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `${title}_Import_Template.xlsx`)
      toast.success('Template downloaded successfully!')
    } catch (err) {
      toast.error('Failed to download template')
    }
  }

  const handleBulkFileChange = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setBulkImportError('Please upload an Excel file (.xlsx or .xls)')
      return
    }

    setBulkImportFile(file)
    setBulkImportError('')
    setBulkImportLoading(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(arrayBuffer)
      const ws = wb.worksheets[0]
      if (!ws) {
        setBulkImportError('No worksheet found in Excel file')
        setBulkImportPreview([])
        setBulkImportLoading(false)
        return
      }

      const headers = []
      ws.getRow(1).eachCell((cell, col) => {
        headers[col] = String(cell.value || '').trim()
      })

      const rows = []
      ws.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return // header
        const obj = {}
        headers.forEach((h, col) => {
          if (!h) return
          let val = row.getCell(col).value
          if (val && typeof val === 'object' && val.text) val = val.text
          if (val instanceof Date) {
            val = val.toISOString().split('T')[0]
          }
          obj[h] = val !== undefined && val !== null ? String(val).trim() : ''
        })

        const textKey = Object.keys(obj).find(k => {
          const l = k.toLowerCase()
          return l.includes('suvichar') || l.includes('thought') || l.includes('quote') || l.includes('description') || l.includes('title')
        })
        const authorKey = Object.keys(obj).find(k => k.toLowerCase().includes('author') || k.toLowerCase().includes('by') || k.toLowerCase().includes('લેખક'))
        const dateKey = Object.keys(obj).find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('તારીખ'))
        const varKey = Object.keys(obj).find(k => k.toLowerCase().includes('var') || k.toLowerCase().includes('vaar') || k.toLowerCase().includes('day') || k.toLowerCase().includes('વાર'))
        const statusKey = Object.keys(obj).find(k => k.toLowerCase().includes('status'))

        const suvicharVal = textKey ? obj[textKey] : Object.values(obj)[0] || ''
        if (suvicharVal && !suvicharVal.startsWith('*')) {
          rows.push({
            suvichar: suvicharVal,
            author: authorKey ? obj[authorKey] : '',
            date: dateKey ? obj[dateKey] : '',
            var: varKey ? obj[varKey] : '',
            status: statusKey ? (obj[statusKey] === '0' || String(obj[statusKey]).toLowerCase() === 'inactive' ? 0 : 1) : 1
          })
        }
      })

      if (rows.length === 0) {
        setBulkImportError('No valid suvichar records found in this file')
      }
      setBulkImportPreview(rows)
    } catch (err) {
      setBulkImportError('Could not read Excel file. Please use the sample template.')
    } finally {
      setBulkImportLoading(false)
    }
  }

  const handleBulkImportSubmit = async () => {
    if (!bulkImportFile) {
      toast.error('Please select an Excel file to upload')
      return
    }

    setBulkImportLoading(true)
    setBulkImportError('')

    try {
      const cleanEndpoint = endpoint.split('?')[0]
      const formData = new FormData()
      formData.append('file', bulkImportFile)

      const token = localStorage.getItem('auth_token')
      const headers = { 'Content-Type': 'multipart/form-data' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      let res
      try {
        res = await api.post(`${cleanEndpoint}/bulk-import`, formData, { headers })
      } catch (postErr) {
        if (bulkImportPreview.length > 0) {
          res = await api.post(`${cleanEndpoint}/bulk-create`, { items: bulkImportPreview })
        } else {
          throw postErr
        }
      }

      toast.success(res.data?.message || 'Suvichars uploaded and saved successfully!')
      setIsBulkImportModalOpen(false)
      setBulkImportFile(null)
      setBulkImportPreview([])
      await fetchRows()
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to upload Excel file'
      setBulkImportError(msg)
      toast.error(msg)
    } finally {
      setBulkImportLoading(false)
    }
  }

  const loadRemoteOptions = async (fieldsList) => {
    const remoteFields = (fieldsList || []).filter((f) => f.type === 'select-remote')
    if (!remoteFields.length) return
    const results = {}
    await Promise.all(remoteFields.map(async (f) => {
      try {
        const res = await api.get(f.source, { params: { limit: 1000 } })
        results[f.name] = res.data?.data || res.data || []
      } catch (e) {
        results[f.name] = []
      }
    }))
    setRemoteOptions((prev) => ({ ...prev, ...results }))

    // Resolve any raw IDs or mismatched values in formData
    setFormData((prevForm) => {
      let changed = false
      const nextForm = { ...prevForm }
      remoteFields.forEach((f) => {
        const curVal = nextForm[f.name]
        const optList = results[f.name] || []
        if (curVal !== undefined && curVal !== null && curVal !== '' && optList.length > 0) {
          const isHex = typeof curVal === 'string' && /^[0-9a-fA-F]{24}$/.test(curVal.trim())
          if (f.valueKey === 'name') {
            if (isHex || !optList.some(o => (o.name || o.title || o.country || o.state || o.city || o.village) === curVal)) {
              const matched = optList.find(o =>
                String(o._id || o.id) === String(curVal) ||
                ((o.name || o.title || o.country || o.state || o.city || o.village) &&
                  String(o.name || o.title || o.country || o.state || o.city || o.village).toLowerCase() === String(curVal).toLowerCase())
              )
              if (matched) {
                const labelName = matched.name || matched.title || matched.country || matched.state || matched.city || matched.village
                if (labelName && labelName !== curVal) {
                  nextForm[f.name] = labelName
                  changed = true
                }
              }
            }
          } else {
            if (!isHex) {
              const matched = optList.find(o =>
                ((o.name || o.title || o.country || o.state || o.city || o.village) &&
                  String(o.name || o.title || o.country || o.state || o.city || o.village).toLowerCase() === String(curVal).toLowerCase()) ||
                String(o._id || o.id) === String(curVal)
              )
              if (matched) {
                const targetId = matched.id || matched._id
                if (targetId && targetId !== curVal) {
                  nextForm[f.name] = targetId
                  changed = true
                }
              }
            }
          }
        }
      })
      return changed ? nextForm : prevForm
    })
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFieldErrors({})

    if (allowMultipleAdd && !selected && !isDuplicate) {
      const emptyItemIndex = multipleItems.findIndex(it => {
        const val = it.suvichar || it.description || it.title || ''
        return !String(val).trim()
      })
      if (emptyItemIndex !== -1) {
        setFormError(`Please enter suvichar for item #${emptyItemIndex + 1}`)
        setSaving(false)
        return
      }

      try {
        const cleanEndpoint = endpoint.split('?')[0]
        const token = localStorage.getItem('auth_token')
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

        try {
          const res = await api.post(`${cleanEndpoint}/bulk-create`, { items: multipleItems }, { headers })
          toast.success(res.data?.message || `${multipleItems.length} record(s) added successfully`)
        } catch (_) {
          try {
            const res2 = await api.post(cleanEndpoint, { items: multipleItems }, { headers })
            toast.success(res2.data?.message || `${multipleItems.length} record(s) added successfully`)
          } catch (__) {
            await Promise.all(multipleItems.map(item => api.post(cleanEndpoint, item, { headers })))
            toast.success(`${multipleItems.length} record(s) added successfully`)
          }
        }

        await fetchRows()
        setIsModalOpen(false)
        setSelected(null)
        setMultipleItems([])
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.response?.data?.error || `Failed to save ${title.toLowerCase()}`
        setFormError(errorMsg)
      } finally {
        setSaving(false)
      }
      return
    }

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
    // Check duplicate name in existing list for masters / crud tables
    const nameField = fields.find(f => f.name === 'name' || f.name === 'category' || f.name === 'business');
    if (nameField && formData[nameField.name]) {
      const enteredName = String(formData[nameField.name]).trim().toLowerCase();
      const duplicateInRows = rows.find(r => {
        const rowId = String(r._id || r.id || '');
        const currentSelectedId = String(selected?._id || selected?.id || '');
        if (selected && rowId === currentSelectedId) return false;

        // If parent_id exists, match in the same parent category/state
        if (formData.parent_id && r.parent_id && String(r.parent_id) !== String(formData.parent_id)) {
          return false;
        }

        const rName = String(r.name || r.category || r.business || r.title || '').trim().toLowerCase();
        return rName === enteredName;
      });

      if (duplicateInRows) {
        setFieldErrors({ [nameField.name]: true });
        setFormError(`"${formData[nameField.name]}" already exists! Duplicate names are not allowed.`);
        setSaving(false);
        return;
      }
    }
    try {
      const hasFiles = fields.some((field) => field.type === 'file' && (
        formData[field.name] instanceof File ||
        formData[field.name] instanceof FileList ||
        Array.isArray(formData[field.name])
      ))

      const rawPayload = hasFiles ? new FormData() : { ...formData }

      let payload = rawPayload;
      if (!hasFiles) {
        payload = {}
        Object.entries(rawPayload).forEach(([key, val]) => {
          const fieldDef = fields.find(f => f.name === key)
          if (fieldDef && fieldDef.type === 'file' && !val) {
            if (removedImages[key]) {
              payload[key] = ''
            }
            return
          }
          payload[key] = (val && typeof val === 'object' && val.value !== undefined) ? val.value : val
        })

        Object.entries(removedImages).forEach(([fieldName, removed]) => {
          if (removed) payload[`remove_${fieldName}`] = 'true'
        })
      }
      if (hasFiles) {
        fields.forEach((field) => {
          const rawVal = formData[field.name]
          const value = (rawVal && typeof rawVal === 'object' && rawVal.value !== undefined) ? rawVal.value : rawVal

          if (field.type === 'file') {
            const files = value instanceof FileList ? Array.from(value) : Array.isArray(value) ? value : value ? [value] : []
            if (files.length > 0) {
              files.forEach((file) => payload.append(field.name, file))
            } else if (removedImages[field.name]) {
              payload.append(field.name, '')
            }
          } else {
            payload.append(field.name, value ?? '')
          }
        })

        Object.entries(removedImages).forEach(([fieldName, removed]) => {
          if (removed) payload.append(`remove_${fieldName}`, 'true')
        })
      }

      // Auto-attach location ID fields if names are present
      ['country', 'state', 'district', 'city', 'village'].forEach(locKey => {
        const locVal = formData[locKey]
        if (locVal) {
          const optList = remoteOptions[locKey] || []
          const found = optList.find(o =>
            (o.name && String(o.name).toLowerCase() === String(locVal).toLowerCase()) ||
            (o.title && String(o.title).toLowerCase() === String(locVal).toLowerCase()) ||
            (o.country && String(o.country).toLowerCase() === String(locVal).toLowerCase()) ||
            (o.state && String(o.state).toLowerCase() === String(locVal).toLowerCase()) ||
            (o.city && String(o.city).toLowerCase() === String(locVal).toLowerCase()) ||
            (o.village && String(o.village).toLowerCase() === String(locVal).toLowerCase()) ||
            String(o._id || o.id) === String(locVal)
          )
          if (found && (found._id || found.id)) {
            const locId = found._id || found.id
            if (hasFiles && payload instanceof FormData) {
              if (!payload.has(`${locKey}_id`)) payload.append(`${locKey}_id`, locId)
            } else if (!hasFiles && typeof payload === 'object') {
              if (!payload[`${locKey}_id`]) payload[`${locKey}_id`] = locId
            }
          }
        }
      })

      const cleanEndpoint = endpoint.split('?')[0];
      const token = localStorage.getItem('auth_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (selected) {
        await api.put(`${cleanEndpoint}/${selected._id || selected.id}`, payload, { headers })
      } else {
        await api.post(cleanEndpoint, payload, { headers })
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
      setSelectedRows([])
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
      setSelectedRows([])
      fetchRows()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete records')
    }
  }

  const handleBulkDuplicate = async (ids) => {
    if (!ids || ids.length === 0) return
    const cleanEndpoint = endpoint.split('?')[0]
    setLoading(true)
    try {
      const res = await api.post(`${cleanEndpoint}/bulk-duplicate`, { ids })
      toast.success(res.data?.message || `${ids.length} record(s) duplicated successfully`)
      setSelectedRows([])
      await fetchRows()
    } catch (err) {
      try {
        await Promise.all(ids.map(id => api.post(`${cleanEndpoint}/${id}/duplicate`)))
        toast.success(`${ids.length} record(s) duplicated successfully`)
        setSelectedRows([])
        await fetchRows()
      } catch (fallbackErr) {
        toast.error(err.response?.data?.message || 'Failed to duplicate selected records')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 overflow-x-auto hide-scrollbar">
          {headerLeftContent ? headerLeftContent : (
            <>
              <h2 className="text-xl font-semibold text-text">{title}</h2>
              {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
            </>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder={`Search ${title.toLowerCase()}...`}
          />
          {!hideFilter && (
            <FilterPopover
              isOpen={showFilters}
              onToggle={() => {
                setDraftFilterStatus(appliedFilterStatus)
                if (onToggleFilters) onToggleFilters()
                setShowFilters(!showFilters)
              }}
              onClose={() => setShowFilters(false)}
              activeCount={(appliedFilterStatus ? 1 : 0) + (extraActiveFiltersCount || 0)}
              onClear={() => {
                setDraftFilterStatus('')
                setAppliedFilterStatus('')
                if (onClearFilters) onClearFilters()
                resetPage()
                setShowFilters(false)
              }}
              onApply={() => {
                setAppliedFilterStatus(draftFilterStatus)
                if (onApplyFilters) onApplyFilters()
                resetPage()
                setShowFilters(false)
              }}
            >
              {customFilters}
              <Select
                label="Status"
                value={draftFilterStatus}
                onChange={(val) => { setDraftFilterStatus(val); }}
                placeholder="All Status"
                searchable={false}
                options={[
                  { label: 'All Status', value: '' },
                  { label: 'Active', value: '1' },
                  { label: 'Inactive', value: '0' }
                ]}
              />
            </FilterPopover>
          )}
          {allowBulkImport && (
            <Button
              type="button"
              onClick={() => {
                setBulkImportFile(null)
                setBulkImportPreview([])
                setBulkImportError('')
                setIsBulkImportModalOpen(true)
              }}
              variant="outline"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              className="h-10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10 font-bold"
            >
              Bulk
            </Button>
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
                (() => {
                  const status = String(row.marital_status || '').trim();
                  const lower = status.toLowerCase();
                  let colorClass = 'bg-surface-secondary text-text-secondary border-border';
                  if (lower.includes('never married') || lower === 'single') {
                    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
                  } else if (lower.includes('divorce') || lower.includes('divorced') || lower.includes('awaiting divorce')) {
                    colorClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
                  } else if (lower.includes('widow') || lower.includes('widowed')) {
                    colorClass = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
                  } else if (lower.includes('married')) {
                    colorClass = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
                  } else if (status) {
                    colorClass = 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
                  }
                  return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border font-semibold text-xs transition-all shadow-2xs ${colorClass}`}>
                      {status || '-'}
                    </span>
                  );
                })()
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
              ) : c.render ? (
                c.render(row)
              ) : (
                (() => {
                  const displayValue = (
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
            render: row => {
              const canEditRow = isRowEditable ? isRowEditable(row) : true
              const canDeleteRow = isRowDeletable ? isRowDeletable(row) : true
              return (
                <div className="flex items-center justify-start gap-2">
                  {customRowActions && customRowActions(row)}
                  {allowDuplicate && (
                    <button
                      type="button"
                      onClick={() => handleDuplicateRow(row)}
                      className="p-2 rounded-xl transition-all border text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 cursor-pointer active:scale-95"
                      title="Duplicate"
                    >
                      <CopyPlus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!hideEdit && (
                    <button
                      onClick={() => canEditRow && openEdit(row)}
                      disabled={!canEditRow}
                      className={`p-2 rounded-xl transition-all border ${canEditRow
                          ? 'text-primary bg-primary/10 hover:bg-primary/20 border-primary/20 cursor-pointer'
                          : 'text-text-secondary/40 bg-surface-secondary/40 border-border/40 cursor-not-allowed opacity-50'
                        }`}
                      title={canEditRow ? 'Edit' : 'System default item cannot be edited'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!hideDelete && (
                    <button
                      onClick={() => canDeleteRow && handleDelete(row)}
                      disabled={!canDeleteRow}
                      className={`p-2 rounded-xl transition-all border ${canDeleteRow
                          ? 'text-error-text bg-error-bg hover:bg-error/20 border-error-border cursor-pointer'
                          : 'text-text-secondary/40 bg-surface-secondary/40 border-border/40 cursor-not-allowed opacity-50'
                        }`}
                      title={canDeleteRow ? 'Delete' : 'System default item cannot be deleted'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            }
          }])
        ]}
        data={rows}
        keyField="id"
        loading={loading}
        rowClassName={rowClassName}
        selectable={selectable || allowDuplicate}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        onBulkDuplicate={allowDuplicate || onBulkDuplicate ? (onBulkDuplicate || handleBulkDuplicate) : undefined}
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
      <Modal isOpen={isModalOpen} maxWidth={allowMultipleAdd && !selected && !isDuplicate ? 'max-w-5xl' : fields.length > 10 ? 'max-w-7xl' : fields.length > 5 ? 'max-w-5xl' : 'max-w-3xl'} title={selected ? `Edit ${title}` : isDuplicate ? `Duplicate ${title}` : (allowMultipleAdd && multipleItems.length > 1) ? `Add Multiple ${title}s (${multipleItems.length})` : `Add ${title}`} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-3.5 text-text" noValidate>
          {allowMultipleAdd && !selected && !isDuplicate ? (
            <div className="space-y-4 max-h-[72vh] overflow-y-auto px-1 custom-scrollbar">
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold">
                  {formError}
                </div>
              )}
              {multipleItems.map((item, idx) => (
                <div key={item._tempId || idx} className="p-4 rounded-2xl bg-surface-secondary/40 border border-border space-y-3.5 relative shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs tracking-wide">
                        #{idx + 1} {title}
                      </span>
                      {item.date && (
                        <span className="text-xs text-text-secondary font-medium">
                          {item.date} {item.var ? `• ${item.var}` : ''}
                        </span>
                      )}
                    </div>
                    {multipleItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove this item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      Suvichar <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={item.suvichar || ''}
                      placeholder="Enter suvichar thought / quote..."
                      onChange={(e) => updateItemField(idx, 'suvichar', e.target.value)}
                      className={`${fieldClass} text-sm`}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        Author / By
                      </label>
                      <input
                        type="text"
                        value={item.author || ''}
                        placeholder="Author name"
                        onChange={(e) => updateItemField(idx, 'author', e.target.value)}
                        className={`${fieldClass} text-sm h-10`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        Date
                      </label>
                      <DatePicker
                        value={item.date || ''}
                        onChange={(val) => updateItemField(idx, 'date', val)}
                        placeholder="Select Date"
                      />
                    </div>

                    <div>
                      <Select
                        label="Day"
                        value={item.var || ''}
                        onChange={(val) => updateItemField(idx, 'var', val)}
                        options={[
                          { value: 'રવિવાર', label: 'રવિવાર (Sunday)' },
                          { value: 'સોમવાર', label: 'સોમવાર (Monday)' },
                          { value: 'મંગળવાર', label: 'મંગળવાર (Tuesday)' },
                          { value: 'બુધવાર', label: 'બુધવાર (Wednesday)' },
                          { value: 'ગુરુવાર', label: 'ગુરુવાર (Thursday)' },
                          { value: 'શુક્રવાર', label: 'શુક્રવાર (Friday)' },
                          { value: 'શનિવાર', label: 'શનિવાર (Saturday)' }
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        Status
                      </label>
                      <div className="flex items-center gap-3 pt-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={Number(item.status ?? 1) === 1}
                            onChange={(e) => updateItemField(idx, 'status', e.target.checked ? 1 : 0)}
                          />
                          <div className="w-9 h-5 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                        <span className="text-xs font-semibold text-text">
                          {Number(item.status ?? 1) === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* + Add Another Suvichar Button */}
              <button
                type="button"
                onClick={addAnotherItem}
                className="w-full py-3 px-4 border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl flex items-center justify-center gap-2 text-primary font-bold text-sm transition-all cursor-pointer group active:scale-[0.99]"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>+ Add Another {title}</span>
              </button>
            </div>
          ) : (
          <div className={`grid grid-cols-1 ${gridCols || (fields.length > 10 ? 'sm:grid-cols-2 md:grid-cols-4' : fields.length > 4 ? 'sm:grid-cols-2 md:grid-cols-3' : 'md:grid-cols-2')} gap-3.5`} style={{ overflow: 'visible' }}>
            {fields.map((field, fieldIdx) => {
              const isFullRow = field.type === 'textarea' || (field.type === 'file' && field.multiple);
              const colSpanClass = field.className || (isFullRow
                ? (gridCols ? 'md:col-span-2' : fields.length > 10 ? 'sm:col-span-2 md:col-span-4' : fields.length > 4 ? 'sm:col-span-2 md:col-span-3' : 'md:col-span-2')
                : '');
              const isHidden = field.type === 'hidden';
              if (isHidden) return null;
              return (
                <div key={field.name} className={colSpanClass} style={{ zIndex: fields.length - fieldIdx, position: 'relative' }}>
                  {field.type === 'textarea' ? (
                    <>
                      <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        required={field.required}
                        rows={field.rows || 2}
                        value={formData[field.name] || ''}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.name]: e.target.value })
                          if (fieldErrors[field.name]) setFieldErrors({ ...fieldErrors, [field.name]: false })
                        }}
                        onBlur={async (e) => {
                          if (field.transliterate && e.target.value && /[a-zA-Z]/.test(e.target.value)) {
                            try {
                              const converted = await transliterateText(e.target.value, field.transliterate)
                              if (converted && converted !== e.target.value) {
                                setFormData(prev => ({ ...prev, [field.name]: converted }))
                              }
                            } catch (err) {
                              console.error('Transliteration failed:', err)
                            }
                          }
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
                    (() => {
                      const countryList = remoteOptions['country'] || []
                      const stateList = remoteOptions['state'] || []
                      const districtList = remoteOptions['district'] || []
                      const cityList = remoteOptions['city'] || []

                      const selectedCountryObj = countryList.find(c =>
                        String(c.name || c.country || '').toLowerCase() === String(formData.country || '').toLowerCase() ||
                        String(c._id || c.id) === String(formData.country || '')
                      )
                      const selectedCountryId = selectedCountryObj ? String(selectedCountryObj._id || selectedCountryObj.id || '') : ''
                      const selectedCountryName = selectedCountryObj ? String(selectedCountryObj.name || selectedCountryObj.country || '').toLowerCase() : String(formData.country || '').toLowerCase()

                      const selectedStateObj = stateList.find(s =>
                        String(s.name || s.state || '').toLowerCase() === String(formData.state || '').toLowerCase() ||
                        String(s._id || s.id) === String(formData.state || '')
                      )
                      const selectedStateId = selectedStateObj ? String(selectedStateObj._id || selectedStateObj.id || '') : ''
                      const selectedStateName = selectedStateObj ? String(selectedStateObj.name || selectedStateObj.state || '').toLowerCase() : String(formData.state || '').toLowerCase()

                      const selectedDistrictObj = districtList.find(d =>
                        String(d.name || d.district || '').toLowerCase() === String(formData.district || '').toLowerCase() ||
                        String(d._id || d.id) === String(formData.district || '')
                      )
                      const selectedDistrictId = selectedDistrictObj ? String(selectedDistrictObj._id || selectedDistrictObj.id || '') : ''
                      const selectedDistrictName = selectedDistrictObj ? String(selectedDistrictObj.name || selectedDistrictObj.district || '').toLowerCase() : String(formData.district || '').toLowerCase()

                      const selectedCityObj = cityList.find(c =>
                        String(c.name || c.city || '').toLowerCase() === String(formData.city || '').toLowerCase() ||
                        String(c._id || c.id) === String(formData.city || '')
                      )
                      const selectedCityId = selectedCityObj ? String(selectedCityObj._id || selectedCityObj.id || '') : ''
                      const selectedCityName = selectedCityObj ? String(selectedCityObj.name || selectedCityObj.city || '').toLowerCase() : String(formData.city || '').toLowerCase()

                      const isStateField = field.name === 'state'
                      const isDistrictField = field.name === 'district'
                      const isCityField = field.name === 'city'
                      const isVillageField = field.name === 'village'

                      const isParentMissing =
                        (isStateField && !formData.country) ||
                        (isDistrictField && !formData.state) ||
                        (isCityField && !formData.district) ||
                        (isVillageField && !formData.city)

                      const placeholderText = `Select ${field.label || 'an option'}`

                      return (
                        <Select
                          label={field.label}
                          required={field.required}
                          searchable={true}
                          creatable={!isParentMissing}
                          createPrompt={`Add ${field.label}`}
                          placeholder={placeholderText}
                          value={formData[field.name] ?? ''}
                          onChange={(val) => {
                            const next = { ...formData, [field.name]: val }
                            if (field.name === 'country') {
                              next.state = ''
                              next.district = ''
                              next.city = ''
                              next.village = ''
                            } else if (field.name === 'state') {
                              next.district = ''
                              next.city = ''
                              next.village = ''
                            } else if (field.name === 'district') {
                              next.city = ''
                              next.village = ''
                            } else if (field.name === 'city') {
                              next.village = ''
                            }
                            setFormData(next)
                            if (fieldErrors[field.name]) setFieldErrors({ ...fieldErrors, [field.name]: false })
                          }}
                          onCreateOption={async (newVal) => {
                            const trimmed = newVal.trim()
                            if (!trimmed) return
                            const newObj = {
                              name: trimmed,
                              _id: trimmed,
                              id: trimmed,
                              country_id: selectedCountryId || undefined,
                              state_id: selectedStateId || undefined,
                              district_id: selectedDistrictId || undefined,
                              city_id: selectedCityId || undefined,
                              parent_id: selectedDistrictId || selectedStateId || selectedCountryId || undefined,
                              status: 1
                            }
                            setRemoteOptions(prev => ({
                              ...prev,
                              [field.name]: [...(prev[field.name] || []), newObj]
                            }))
                            const formVal = field.valueKey === 'name' ? trimmed : trimmed
                            setFormData(prev => ({ ...prev, [field.name]: formVal }))
                            if (field.source) {
                              try {
                                await api.post(field.source, {
                                  name: trimmed,
                                  city: trimmed,
                                  district: trimmed,
                                  state: trimmed,
                                  country: trimmed,
                                  country_id: selectedCountryId || undefined,
                                  state_id: selectedStateId || undefined,
                                  district_id: selectedDistrictId || undefined,
                                  city_id: selectedCityId || undefined,
                                  parent_id: selectedDistrictId || selectedStateId || selectedCountryId || undefined,
                                  status: 1
                                })
                              } catch (err) {
                                console.error(`Failed to create ${field.name}:`, err)
                              }
                            }
                          }}
                          disabled={saving || field.disabled}
                          options={(remoteOptions[field.name] || [])
                            .filter((option) => {
                              const optVal = field.valueKey ? option[field.valueKey] : (option.id || option._id || option.name)
                              const optId = String(option._id || option.id || '')
                              const curFormVal = String(formData[field.name] || '').trim()

                              // If option matches current form value by ID or Name, always retain it so it is pre-selected and selectable
                              if (curFormVal && (curFormVal === String(optVal) || (optId && curFormVal === optId) || (option.name && curFormVal.toLowerCase() === option.name.toLowerCase()))) {
                                return true
                              }

                              if (field.name === 'state') {
                                // If countryList is empty (e.g. country is hidden field), show all states
                                if (!countryList.length && formData.country) return true
                                const parent = String(option.country_id || option.parent_id || option.country || '')
                                const optCountry = String(option.country || '').toLowerCase()
                                const formCountryName = String(formData.country || '').toLowerCase()
                                const matches =
                                  !parent ||
                                  (formData.country && selectedCountryId && parent === selectedCountryId) ||
                                  (formData.country && selectedCountryName && parent.toLowerCase() === selectedCountryName) ||
                                  (formData.country && selectedCountryName && optCountry === selectedCountryName) ||
                                  (formData.country && formCountryName && parent.toLowerCase() === formCountryName) ||
                                  (formData.country && formCountryName && optCountry === formCountryName) ||
                                  (!formData.country && !parent)
                                if (!matches) return false
                              }

                              if (field.name === 'district') {
                                if (!formData.state) return false
                                const parent = String(option.state_id || option.parent_id || option.state || '')
                                const optState = String(option.state || '').toLowerCase()
                                const matches =
                                  !parent ||
                                  (selectedStateId && parent === selectedStateId) ||
                                  (selectedStateName && parent.toLowerCase() === selectedStateName) ||
                                  (selectedStateName && optState === selectedStateName) ||
                                  (formData.state && parent.toLowerCase() === String(formData.state).toLowerCase())
                                if (!matches) return false
                              }

                              if (field.name === 'city') {
                                if (!formData.district) return false
                                const cDistrictId = String(option.district_id || option.parent_id || '')
                                const cName = String(option.name || option.city || '').toLowerCase()
                                const matches =
                                  (selectedDistrictId && cDistrictId === selectedDistrictId) ||
                                  (selectedDistrictName && cName === selectedDistrictName) ||
                                  (selectedDistrictName && cName.includes(selectedDistrictName)) ||
                                  (selectedDistrictName && String(option.district || '').toLowerCase() === selectedDistrictName) ||
                                  (selectedDistrictId && String(option.district_id || '') === selectedDistrictId)
                                if (!matches) return false
                              }

                              if (field.name === 'village') {
                                if (!formData.city) return false
                                const parent = String(option.city_id || option.parent_id || option.city || '')
                                const optCity = String(option.city || '').toLowerCase()
                                const matches =
                                  !parent ||
                                  (selectedCityId && parent === selectedCityId) ||
                                  (selectedCityName && parent.toLowerCase() === selectedCityName) ||
                                  (selectedCityName && optCity === selectedCityName) ||
                                  (formData.city && parent.toLowerCase() === String(formData.city).toLowerCase()) ||
                                  (selectedDistrictId && String(option.district_id || '') === selectedDistrictId)
                                if (!matches) return false
                              }
                              return true
                            })
                            .map((option) => {
                              const label = field.labelKey ? option[field.labelKey] : (option.name || option.country || option.state || option.city || option.village || option.business || 'Unnamed')
                              const val = field.valueKey ? option[field.valueKey] : (option.id || option._id || option.name)
                              return {
                                label: label || 'Unnamed',
                                value: val,
                                _id: option._id || option.id,
                                id: option.id || option._id,
                                name: option.name || label,
                                _raw: option
                              }
                            })}
                          error={fieldErrors[field.name] ? `${field.label} is required` : undefined}
                        />
                      )
                    })()
                  ) : field.type === 'file' ? (
                    <div className="flex flex-col h-full">
                      <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <FileDropzone
                        className="flex-1"
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
                          const updates = { [field.name]: val }
                          if (field.name === 'date' && (fields.some(f => f.name === 'vaar') || fields.some(f => f.name === 'var'))) {
                            const gujaratiDays = ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર']
                            const d = new Date(val)
                            if (!isNaN(d.getTime())) {
                              const dayName = gujaratiDays[d.getDay()]
                              updates.var = dayName
                              updates.vaar = dayName
                            }
                          }
                          setFormData({ ...formData, ...updates })
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
                          // Keep email as is
                        } else if (nameLower === 'ifsc_code' || nameLower.includes('gst')) {
                          val = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15)
                        } else if (nameLower.includes('mobile') || nameLower.includes('whatsapp') || nameLower.includes('phone') || nameLower.includes('contact')) {
                          val = val.replace(/\D/g, '').slice(0, 10)
                        } else if (nameLower.includes('account_number') || nameLower.includes('pincode') || nameLower.includes('zip')) {
                          val = val.replace(/\D/g, '').slice(0, 20)
                        } else if (nameLower.includes('salary') || nameLower.includes('amount') || nameLower.includes('percentage') || nameLower.includes('height') || nameLower.includes('weight')) {
                          val = val.replace(/[^0-9.]/g, '')
                        } else if (title && title.toLowerCase().includes('blood group')) {
                          val = val.replace(/[^a-zA-Z\s+-]/g, '')
                        }

                        setFormData({ ...formData, [field.name]: val })
                        if (fieldErrors[field.name]) setFieldErrors({ ...fieldErrors, [field.name]: false })
                      }}
                      onBlur={async (e) => {
                        if (field.transliterate && e.target.value && /[a-zA-Z]/.test(e.target.value)) {
                          try {
                            const converted = await transliterateText(e.target.value, field.transliterate)
                            if (converted && converted !== e.target.value) {
                              setFormData(prev => ({ ...prev, [field.name]: converted }))
                            }
                          } catch (err) {
                            console.error('Transliteration failed:', err)
                          }
                        }
                      }}
                      disabled={saving || field.disabled}
                      error={fieldErrors[field.name] ? `${field.label} is required` : undefined}
                    />
                  )}
                </div>
              );
            })}
          </div>
          )}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {saving ? 'Saving...' : (allowMultipleAdd && !selected && !isDuplicate && multipleItems.length > 1) ? `Save All (${multipleItems.length}) ${title}s` : selected ? 'Save Changes' : `Add ${title}`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── BULK EXCEL IMPORT MODAL ────────────────────────── */}
      {allowBulkImport && (
        <Modal
          isOpen={isBulkImportModalOpen}
          maxWidth="max-w-2xl"
          title={`Bulk Upload ${title} (Excel)`}
          onClose={() => {
            if (!bulkImportLoading) setIsBulkImportModalOpen(false)
          }}
        >
          <div className="space-y-4 text-text">
            {/* Top Info & Download Template */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20">
              <div>
                <p className="text-xs font-bold text-text">Excel Sheet Template</p>
                <p className="text-xs text-text-secondary mt-0.5">Download our sample Excel template with predefined columns.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadSampleTemplate}
                icon={<Download className="w-3.5 h-3.5 text-primary" />}
                className="shrink-0 text-xs font-semibold h-8"
              >
                Download Sample
              </Button>
            </div>

            {/* File Dropzone */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Upload Excel File (.xlsx, .xls) <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  bulkImportFile
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-border hover:border-primary/50 bg-surface-secondary/40'
                }`}
                onClick={() => document.getElementById('admin-bulk-file-input')?.click()}
              >
                <input
                  id="admin-bulk-file-input"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleBulkFileChange(f)
                  }}
                  disabled={bulkImportLoading}
                />

                {bulkImportFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-text truncate max-w-xs">{bulkImportFile.name}</p>
                      <p className="text-xs text-text-secondary">{(bulkImportFile.size / 1024).toFixed(1)} KB • Ready to import</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setBulkImportFile(null)
                        setBulkImportPreview([])
                        setBulkImportError('')
                      }}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors ml-2"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">Click to choose Excel sheet or drag and drop</p>
                      <p className="text-xs text-text-secondary mt-0.5">Supports .xlsx, .xls files</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {bulkImportError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bulkImportError}</span>
              </div>
            )}

            {/* Preview Section */}
            {bulkImportPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text">
                    Preview ({bulkImportPreview.length} {title.toLowerCase()}{bulkImportPreview.length > 1 ? 's' : ''} found):
                  </span>
                  <span className="text-[11px] text-text-secondary font-medium">Showing first {Math.min(bulkImportPreview.length, 3)} rows</span>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border divide-y divide-border text-xs custom-scrollbar">
                  {bulkImportPreview.slice(0, 3).map((row, idx) => (
                    <div key={idx} className="p-2.5 bg-surface-secondary/30 space-y-1">
                      <p className="font-semibold text-text line-clamp-2">"{row.suvichar}"</p>
                      <div className="flex items-center gap-3 text-text-secondary text-[11px]">
                        {row.author && <span>✍️ {row.author}</span>}
                        {row.date && <span>📅 {row.date}</span>}
                        {row.var && <span>• {row.var}</span>}
                      </div>
                    </div>
                  ))}
                  {bulkImportPreview.length > 3 && (
                    <div className="p-2 text-center text-text-secondary font-semibold text-xs bg-surface-secondary/50">
                      + {bulkImportPreview.length - 3} more {title.toLowerCase()}s in file
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkImportModalOpen(false)}
                disabled={bulkImportLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleBulkImportSubmit}
                isLoading={bulkImportLoading}
                disabled={!bulkImportFile || bulkImportLoading}
                icon={<Upload className="w-4 h-4" />}
              >
                {bulkImportLoading ? 'Importing...' : bulkImportPreview.length > 0 ? `Add (${bulkImportPreview.length}) ${title}s` : `Add ${title}s`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

