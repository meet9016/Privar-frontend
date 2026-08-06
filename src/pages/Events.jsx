import React, { useCallback, useEffect, useState } from 'react'
import { Calendar, Edit2, Image as ImageIcon, Plus, RefreshCw, Search, Trash2, Eye } from 'lucide-react'
import api, { assetUrl, getEventsList } from '../lib/api'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import Loader from '../components/common/Loader'
import { useNavigate } from 'react-router-dom'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import FileDropzone from '../components/common/FileDropzone'

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
  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1)
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
      const res = await getEventsList({ page, limit, search, sort_by: 'start_time', sort_order: 'asc' })
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
  }, [page, search, limit])

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

  const resetForm = () => {
    setSelectedId('')
    setExistingImage('')
    setFormData(defaultForm)
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

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setError('Please fill in all required fields')
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
      setSuccess('Event saved successfully')
      setIsModalOpen(false)
      resetForm()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event')
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
      setSuccess('Event deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event')
    }
  }

  return (
    <div className="space-y-6 animate-slide-up text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Events</h2>

        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button onClick={fetchRows} variant="secondary" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-text-secondary/60" />
            <input
              type="search"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <Button onClick={openCreate} variant="primary" icon={<Plus className="w-4 h-4" />}>
            Add Event
          </Button>
        </div>
      </div>

      {error && <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-2xl text-sm">{error}</div>}
      {success && <div className="bg-success-bg border border-success-border text-success-text p-4 rounded-2xl text-sm">{success}</div>}

      {loading && rows.length === 0 ? (
        <div className="py-20"><Loader text="Loading events..." /></div>
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
              header: 'Event',
              key: 'event',
              render: (row) => (
                <div className="max-w-md">
                  <div className="font-semibold">{row.title || '-'}</div>
                  <div className="text-text-secondary text-sm line-clamp-2">{row.description.slice(0, 50) || '-'}</div>
                </div>
              )
            },
            {
              header: 'Start Date',
              key: 'start_date',
              render: (row) => (
                <div className="text-text-secondary text-sm line-clamp-2 max-w-md">
                  {row.start_time.slice(0, 10).split('-').reverse().join('-') || '-'}
                </div>
              )
            },
            {
              header: 'Location',
              key: 'location',
              render: (row) => row.event_location || '-'
            },
            {
              header: 'Actions',
              key: 'actions',
              align: 'right',
              render: (row) => (
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => navigate(`/admin/event-registrations?event_id=${row._id || row.id}`)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="View Registrations">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
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
          keyField={(row) => row.id || row._id}
          loading={loading}
          emptyState={{
            icon: Calendar,
            title: 'No events found',
            description: 'There are no events registered under this search criteria'
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

      <Modal isOpen={isModalOpen} title={selectedId ? 'Edit Event' : 'Add Event'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4 text-text" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">

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
          </div>


          <div className="grid gap-4 sm:grid-cols-2">
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
            <Input
              type="datetime-local"
              label="Start Time"
              required
              value={formData.start_time}
              onChange={(e) => {
                setFormData({ ...formData, start_time: e.target.value })
                if (fieldErrors.start_time) setFieldErrors({ ...fieldErrors, start_time: null })
              }}
              disabled={saving}
              error={fieldErrors.start_time}
            />
            <Input
              type="datetime-local"
              label="End Time"
              required
              value={formData.end_time}
              onChange={(e) => {
                setFormData({ ...formData, end_time: e.target.value })
                if (fieldErrors.end_time) setFieldErrors({ ...fieldErrors, end_time: null })
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



          <Input
            label="Location Link"
            value={formData.location_link}
            onChange={(e) => setFormData({ ...formData, location_link: e.target.value })}
            disabled={saving}
          />

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
    </div>
  )
}
