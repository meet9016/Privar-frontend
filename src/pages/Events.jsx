import React, { useCallback, useEffect, useState } from 'react'
import { Edit2, Image as ImageIcon, Plus, RefreshCw, Search, Trash2 ,Eye } from 'lucide-react'
import api, { assetUrl, getEventsList } from '../lib/api'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import { useNavigate } from 'react-router-dom'

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10'
const limit = 10

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
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit })
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
  }, [page, search])

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
    setIsModalOpen(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const hasFile = formData.image instanceof FileList ? formData.image.length > 0 : formData.image instanceof File
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
      if (hasFile) {
        payload.append('image', formData.image instanceof FileList ? formData.image[0] : formData.image)
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
    <div className="space-y-6 animate-slide-up select-none text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Events</h2>

        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={fetchRows} className="p-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-text-secondary hover:text-text transition-all" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
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
          <span className="text-text-secondary text-sm">Loading events...</span>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-glass-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-secondary text-text-secondary text-sm font-semibold  tracking-wider">
                  <th className="p-4">Image</th>
                  <th className="p-4">Event</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">Location</th>
                  <th className="p-4 text-right">Actions</th>
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
                      <div className="font-semibold">{row.title || '-'}</div>
                      <div className="text-text-secondary text-sm line-clamp-2">{row.description.slice(0, 50) || '-'}</div>
                    </td>

                    <td className="p-4 max-w-md">
                      <div className="text-text-secondary text-sm line-clamp-2">{row.start_time.slice(0, 10).split('-').reverse().join('-') || '-'}</div>
                    </td>
                    <td className="p-4">{row.event_location || '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/admin/event-registrations?event_id=${row._id || row.id}`)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl" title="View Registrations">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
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
                    <td colSpan={5} className="p-12 text-center text-sm text-text-secondary">No events found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border bg-surface-secondary/40 text-sm">
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
        </div>
      )}

      <Modal isOpen={isModalOpen} title={selectedId ? 'Edit Event' : 'Add Event'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4 max-h-[76vh] overflow-y-auto pr-1 text-text">
          <div className="grid gap-4 sm:grid-cols-2">

            <div>
              <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Title</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={fieldClass} disabled={saving} />
            </div>

            <div>
              <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Category</label>
              <select
                value={formData.event_category_id}
                onChange={(e) => {
                  const selectedOption = categories.find((item) => String(item.id) === String(e.target.value)) || {}
                  setFormData({
                    ...formData,
                    event_category_id: e.target.value,
                    event_category_name: selectedOption.name || ''
                  })
                }}
                className={fieldClass}
                disabled={saving}
              >
                <option value="" className="bg-surface text-text">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.id} className="bg-surface text-text">{category.name}</option>
                ))}
              </select>
            </div>
          </div>


          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Description</label>
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


          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Start Time</label>
              <input type="datetime-local" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className={fieldClass} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm  font-semibold text-text-secondary mb-1.5">End Time</label>
              <input type="datetime-local" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className={fieldClass} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Entry Type</label>
              <select value={formData.entry_type} onChange={(e) => setFormData({ ...formData, entry_type: e.target.value })} className={fieldClass} disabled={saving}>
                <option value="free" className="bg-surface text-text">Free</option>
                <option value="paid" className="bg-surface text-text">Paid</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">Venue / Location</label>
            <input type="text" value={formData.event_location} onChange={(e) => setFormData({ ...formData, event_location: e.target.value })} className={fieldClass} disabled={saving} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Country</label>
              <select
                value={formData.country_id}
                onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                className={fieldClass} disabled={saving}
              >
                <option value="">Select Country</option>
                {countryList.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">State</label>
              <select
                value={formData.state_id}
                onChange={(e) => setFormData({ ...formData, state_id: e.target.value })}
                className={fieldClass} disabled={saving}
              >
                <option value="">Select State</option>
                {stateList.map((s) => (
                  <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">City</label>
              <select
                value={formData.city_id}
                onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                className={fieldClass} disabled={saving}
              >
                <option value="">Select City</option>
                {cityList.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>



          <div>
            <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Location Link</label>
            <input type="text" value={formData.location_link} onChange={(e) => setFormData({ ...formData, location_link: e.target.value })} className={fieldClass} disabled={saving} />
          </div>



          <button type="submit" disabled={saving} className="flex justify-self-end  bg-primary hover:bg-primary-hover text-white py-3 px-3 rounded-xl font-semibold text-sm tracking-wider  disabled:opacity-50 shadow-glow-primary">
            {saving ? 'Saving...' : 'Save Event'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
