import React, { useCallback, useEffect, useState } from 'react'
import { Calendar, Edit2, Image as ImageIcon, Plus, RefreshCw, Search, Trash2, Eye, ImageOff } from 'lucide-react'
import api, { assetUrl, getEventsList } from '../lib/api'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import Loader from '../components/common/Loader'
import { useNavigate } from 'react-router-dom'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import { toast } from '../lib/toast'
import FileDropzone from '../components/common/FileDropzone'
import DateTimePicker from '../components/common/DateTimePicker'
import useDebounce from '../hooks/useDebounce'
import EventRegistrations from './EventRegistration'

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10'

const defaultForm = {
  title: '',
  description: '',

  event_location: '',
  location_link: '',
  event_category_id: '',
  event_category_name: '',
  entry_type: 'free',
  start_time: '',
  end_time: '',
  image: '',
  country_id: '',
  state_id: '',
  city_id: '',
  remove_image: false
}


export default function Events() {
  const [rows, setRows] = useState([])
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [existingImage, setExistingImage] = useState('')
  const [formData, setFormData] = useState(defaultForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [categories, setCategories] = useState([])
  const [countryList, setCountryList] = useState([])
  const [stateList, setStateList] = useState([])
  const [cityList, setCityList] = useState([])
  const [viewEventDetail, setViewEventDetail] = useState(null)
  const [viewRegistrationsEvent, setViewRegistrationsEvent] = useState(null)
  const [eventRegistrations, setEventRegistrations] = useState([])
  const [registrationsLoading, setRegistrationsLoading] = useState(false)
  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1)

  const handleViewRegistrations = async (eventRow) => {
    setViewRegistrationsEvent(eventRow)
    setRegistrationsLoading(true)
    setEventRegistrations([])
    try {
      const eventId = eventRow.id || eventRow._id
      const res = await api.get(`/event-registrations?event_id=${eventId}&limit=1000`)
      const list = res.data?.data || res.data || []
      setEventRegistrations(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to load event registrations:', err)
      setEventRegistrations([])
    } finally {
      setRegistrationsLoading(false)
    }
  }
  const currentPage = Math.min(Math.max(Number(pagination.page) || page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const endpoint = '/events'
  const toDateTimeLocal = (value) => {
    if (!value) return ''
    return new Date(value).toISOString().slice(0, 16)
  }

  const navigate = useNavigate()


  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getEventsList({ page, limit, search: debouncedSearch, sort_by: 'start_time', sort_order: 'asc' })
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
      setError(err.response?.data?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, limit])

  const fetchCountryList = useCallback(async () => {
    try {
      const res = await api.get('/masters/country')
      const list = res.data?.data || res.data || []
      setCountryList(list)
      return list
    } catch (err) {
      console.error('Failed to load country list:', err)
      return []
    }
  }, [])

  const fetchStateList = useCallback(async () => {
    try {
      const res = await api.get('/masters/state')
      const list = res.data?.data || res.data || []
      setStateList(list)
      return list
    } catch (err) {
      console.error('Failed to load state list:', err)
      return []
    }
  }, [])

  const fetchCityList = useCallback(async () => {
    try {
      const res = await api.get('/masters/city')
      const list = res.data?.data || res.data || []
      setCityList(list)
      return list
    } catch (err) {
      console.error('Failed to load city list:', err)
      return []
    }
  }, [])

  useEffect(() => {
    fetchCountryList()
    fetchStateList()
    fetchCityList()
  }, [fetchCountryList, fetchStateList, fetchCityList])





  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  const setSearch = (value) => {
    setSearchValue(value)
    setPage(1)
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/masters/event-category')
      setCategories(res.data?.data || res.data || [])
    } catch (err) {
      console.error('Failed to load event categories:', err)
      setCategories([])
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const formatDate = (val) => {
    if (!val) return ''
    const d = new Date(val)
    if (isNaN(d.getTime())) return String(val)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (val) => {
    if (!val) return ''
    // If it's an ISO datetime string
    if (typeof val === 'string' && val.includes('T')) {
      const d = new Date(val)
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      }
    }
    // If it's already HH:MM
    return val
  }

  const handleToggleStatus = async (row) => {
    const id = row.id || row._id
    if (!id) return
    const newStatus = Number(row.status) === 1 ? 0 : 1
    try {
      await api.put(`${endpoint}/${id}`, { status: newStatus })
      await fetchRows()
      toast.success('Status updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const resetForm = () => {
    setSelectedId('')
    setExistingImage('')
    setFormData(defaultForm)
    setFieldErrors({})
    setError('')
  }

  const openCreate = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEdit = async (row) => {
    const id = row.id || row._id || ''
    setSelectedId(id)
    setExistingImage(row.image || '')

    setFormData({
      title: row.title || '',
      description: row.description || '',
      event_location: row.event_location || row.venue || '',
      location_link: row.location_link || '',
      event_category_id: row.event_category_id || '',
      event_category_name: row.event_category_name || '',
      entry_type: row.entry_type || 'free',
      country_id: row.country_id || '',
      state_id: row.state_id || '',
      city_id: row.city_id || '',
      start_time: toDateTimeLocal(row.start_time),
      end_time: toDateTimeLocal(row.end_time),
      image: '',
      remove_image: false
    })
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})

    const requiredFields = {
      title: 'Title',
      event_category_id: 'Category',
      description: 'Description',
      start_time: 'Start Time',
      end_time: 'End Time',
      event_location: 'Venue / Location',
      country_id: 'Country',
      state_id: 'State',
      city_id: 'City'
    }

    const nextErrors = {}
    Object.entries(requiredFields).forEach(([fieldName, label]) => {
      if (!formData[fieldName]) {
        nextErrors[fieldName] = `${label} is required`
      }
    })

    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time).getTime()
      const end = new Date(formData.end_time).getTime()
      if (end <= start) {
        nextErrors.end_time = 'End time must be after start time'
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setSaving(false)
      return
    }

    try {
      const payload = new FormData()

      const bodyFields = {
        title: formData.title,
        description: formData.description,
        event_location: formData.event_location,
        location_link: formData.location_link,
        event_category_id: formData.event_category_id,
        event_category_name: formData.event_category_name,
        entry_type: formData.entry_type,
        start_time: formData.start_time,
        end_time: formData.end_time,
        country_id: formData.country_id,
        state_id: formData.state_id,
        city_id: formData.city_id
      }

      Object.entries(bodyFields).forEach(([key, value]) => payload.append(key, value ?? ''))
      if (formData.image instanceof File) {
        payload.append('image', formData.image)
      }
      if (formData.remove_image) {
        payload.append('remove_image', 'true')
      }

      if (selectedId) {
        await api.put(`${endpoint}/${selectedId}`, payload)
      } else {
        await api.post(endpoint, payload)
      }

      await fetchRows()
      toast.success('Event saved successfully')
      setIsModalOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    const id = row.id || row._id || ''
    if (!id) return
    if (!await confirm(`Delete ${row.title || 'this event'}?`)) return
    try {
      await api.delete(`${endpoint}/${id}`)
      await fetchRows()
      toast.success('Event deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event')
    }
  }

  return (
    <div className="space-y-6 text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Events</h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary/60">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-input-bg text-text placeholder-text-secondary/50 border border-border focus:border-primary/50 rounded-xl pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-colors"
            />
          </div>
          <Button onClick={openCreate} variant="primary" icon={<Plus className="w-4 h-4" />} className="h-10">
            Add Event
          </Button>
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
              <div className="max-w-xs">
                <div className="font-semibold text-text truncate" title={row.title}>{row.title}</div>
                <div className="text-xs text-text-secondary line-clamp-1" title={row.description}>{row.description}</div>
              </div>
            )
          },
          {
            header: 'Category',
            key: 'event_category_name',
            render: (row) => (
              <span className="text-text-secondary font-medium truncate max-w-[120px] block" title={row.event_category_name || (categories.find(c => String(c.id) === String(row.event_category_id))?.category_name) || '-'}>
                {row.event_category_name || (categories.find(c => String(c.id) === String(row.event_category_id))?.category_name) || '-'}
              </span>
            )
          },
          {
            header: 'Date & Time',
            key: 'event_date',
            render: (row) => {
              const dateStr = formatDate(row.start_time || row.event_date)
              const startTimeStr = formatTime(row.start_time)
              const endTimeStr = formatTime(row.end_time)
              const timeDisplay = (startTimeStr || endTimeStr) 
                ? `${startTimeStr || ''}${endTimeStr ? ` - ${endTimeStr}` : ''}`
                : ''

              return (
                <div className="text-xs space-y-0.5 whitespace-nowrap" title={`${dateStr} ${timeDisplay}`.trim()}>
                  <div className="flex items-center gap-1 font-medium text-text">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{dateStr || '-'}</span>
                  </div>
                  {timeDisplay && (
                    <div className="text-text-secondary text-[11px]">
                      {timeDisplay}
                    </div>
                  )}
                </div>
              )
            }
          },
          {
            header: 'Registrations',
            key: 'total_registrations',
            render: (row) => (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {row.total_registrations || row.registration_count || 0}
              </span>
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
            render: (row) => ( <div className="flex items-center justify-start gap-2">
                <button
                  onClick={() => handleViewRegistrations(row)}
                  className="p-2 text-text hover:text-black bg-white hover:bg-surface-secondary border border-border rounded-xl transition-all"
                  title="View Registrations"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => openEdit(row)}
                  className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all"
                  title="Edit Event"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(row.id)}
                  className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all"
                  title="Delete Event"
                >
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
          icon: Calendar,
          title: 'No events found',
          description: 'Try expanding your search criteria or create a new event',
          actionLabel: 'Add Event',
          onAction: openCreate
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

      <Modal isOpen={isModalOpen} maxWidth="max-w-5xl" title={selectedId ? 'Edit Event' : 'Add Event'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4 text-text" noValidate>
          {/* Top Section: Left (Title, Category, Description) & Right (Image Upload) */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-4">
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
                label="Category"
                required
                value={formData.event_category_id}
                onChange={(val) => {
                  const selectedOption = categories.find((item) => String(item.id) === String(val)) || {}
                  setFormData({
                    ...formData,
                    event_category_id: val,
                    event_category_name: selectedOption.name || ''
                  })
                  if (fieldErrors.event_category_id) setFieldErrors({ ...fieldErrors, event_category_id: null })
                }}
                disabled={saving}
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
                error={fieldErrors.event_category_id}
              />

              <Input
                type="textarea"
                rows={3}
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
            </div>

            <div className="flex flex-col h-full">
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Image</label>
              <FileDropzone
                accept="image/*"
                onFilesSelected={(files) => setFormData({ ...formData, image: files[0] || '', remove_image: false })}
                disabled={saving}
                label="Click or Drag Event Image"
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

          <div className="grid gap-4 sm:grid-cols-3">
            <DateTimePicker
              label="Start Time"
              required
              value={formData.start_time}
              onChange={(e) => {
                const newStart = e.target.value
                setFormData(prev => {
                  const updated = { ...prev, start_time: newStart }
                  if (prev.end_time && new Date(prev.end_time).getTime() <= new Date(newStart).getTime()) {
                    updated.end_time = ''
                  }
                  return updated
                })
                setFieldErrors(prev => {
                  const updated = { ...prev, start_time: null }
                  if (!formData.end_time || new Date(formData.end_time).getTime() > new Date(newStart).getTime()) {
                    delete updated.end_time
                  }
                  return updated
                })
              }}
              disabled={saving}
              error={fieldErrors.start_time}
            />
            <DateTimePicker
              label="End Time"
              required
              min={formData.start_time || undefined}
              value={formData.end_time}
              onChange={(e) => {
                const newEnd = e.target.value
                setFormData(prev => ({ ...prev, end_time: newEnd }))
                setFieldErrors(prev => {
                  const updated = { ...prev }
                  if (!newEnd) {
                    updated.end_time = 'End Time is required'
                  } else if (formData.start_time && new Date(newEnd).getTime() <= new Date(formData.start_time).getTime()) {
                    updated.end_time = 'End time must be after start time'
                  } else {
                    delete updated.end_time
                  }
                  return updated
                })
              }}
              disabled={saving}
              error={fieldErrors.end_time}
            />
            <Select
              label="Entry Type"
              value={formData.entry_type}
              onChange={(val) => setFormData({ ...formData, entry_type: val })}
              disabled={saving}
              options={[
                { label: 'Free', value: 'free' },
                { label: 'Paid', value: 'paid' }
              ]}
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Venue / Location"
              required
              value={formData.event_location}
              onChange={(e) => {
                setFormData({ ...formData, event_location: e.target.value })
                if (fieldErrors.event_location) setFieldErrors({ ...fieldErrors, event_location: null })
              }}
              disabled={saving}
              error={fieldErrors.event_location}
            />

            <Input
              label="Location Link"
              value={formData.location_link}
              onChange={(e) => setFormData({ ...formData, location_link: e.target.value })}
              disabled={saving}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Country"
              required
              value={formData.country_id}
              onChange={(val) => {
                setFormData({ ...formData, country_id: val })
                if (fieldErrors.country_id) setFieldErrors({ ...fieldErrors, country_id: null })
              }}
              disabled={saving}
              options={countryList.map((c) => ({ label: c.name, value: c.id || c._id }))}
              error={fieldErrors.country_id}
            />
            <Select
              label="State"
              required
              value={formData.state_id}
              onChange={(val) => {
                setFormData({ ...formData, state_id: val })
                if (fieldErrors.state_id) setFieldErrors({ ...fieldErrors, state_id: null })
              }}
              disabled={saving}
              options={stateList.map((s) => ({ label: s.name, value: s.id || s._id }))}
              error={fieldErrors.state_id}
            />
            <Select
              label="City"
              required
              value={formData.city_id}
              onChange={(val) => {
                setFormData({ ...formData, city_id: val })
                if (fieldErrors.city_id) setFieldErrors({ ...fieldErrors, city_id: null })
              }}
              disabled={saving}
              options={cityList.map((c) => ({ label: c.name, value: c.id || c._id }))}
              error={fieldErrors.city_id}
            />
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

      {/* View Event & Registrations Modal */}
      <Modal
        isOpen={!!viewRegistrationsEvent}
        maxWidth="max-w-4xl"
        title={`Event Details & Registrations: ${viewRegistrationsEvent?.title || ''}`}
        onClose={() => setViewRegistrationsEvent(null)}
      >
        {viewRegistrationsEvent && (
          <div className="space-y-5 text-text">
            {/* Event Summary Bar */}
            <div className="p-4 rounded-2xl bg-surface-secondary/40 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {viewRegistrationsEvent.image ? (
                  <img
                    src={assetUrl(viewRegistrationsEvent.image)}
                    alt={viewRegistrationsEvent.title}
                    className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-text">{viewRegistrationsEvent.title}</h3>
                  <p className="text-xs text-text-secondary line-clamp-1">{viewRegistrationsEvent.description || 'No description'}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                    <span>📍 {viewRegistrationsEvent.event_location || viewRegistrationsEvent.venue || '-'}</span>
                    <span>•</span>
                    <span>📅 {formatDate(viewRegistrationsEvent.start_time || viewRegistrationsEvent.event_date)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                <span className="text-xs text-text-secondary">Total Registrations:</span>
                <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                  {eventRegistrations.length}
                </span>
              </div>
            </div>

            {/* Registrations List */}
            <div>
              <h4 className="text-sm font-bold text-text mb-2">Registered Attendees</h4>
              {registrationsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader />
                </div>
              ) : eventRegistrations.length === 0 ? (
                <div className="p-8 text-center bg-surface rounded-xl border border-dashed border-border text-text-secondary text-sm">
                  No attendees have registered for this event yet.
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden bg-white">
                  <div className="overflow-x-auto max-h-72 custom-scrollbar">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-secondary/70 border-b border-border text-xs uppercase text-text-secondary">
                        <tr>
                          <th className="px-4 py-2.5">#</th>
                          <th className="px-4 py-2.5">Name</th>
                          <th className="px-4 py-2.5">Email</th>
                          <th className="px-4 py-2.5">Phone</th>
                          <th className="px-4 py-2.5 text-center">Attendees</th>
                          <th className="px-4 py-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {eventRegistrations.map((reg, idx) => (
                          <tr key={reg.id || reg._id || idx} className="hover:bg-surface-secondary/20 transition-colors">
                            <td className="px-4 py-2.5 text-text-secondary text-xs">{idx + 1}</td>
                            <td className="px-4 py-2.5 font-semibold text-text">{reg.name}</td>
                            <td className="px-4 py-2.5 text-text-secondary text-xs">{reg.email || '-'}</td>
                            <td className="px-4 py-2.5 text-text-secondary text-xs font-mono">{reg.number || '-'}</td>
                            <td className="px-4 py-2.5 text-center font-bold text-primary">{reg.total_attendee ?? 1}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                                reg.status === 'confirmed' ? 'bg-success-bg text-success-text border border-success-border' : 'bg-surface-secondary text-text-secondary'
                              }`}>
                                {reg.status || 'confirmed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button type="button" variant="primary" onClick={() => setViewRegistrationsEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}



