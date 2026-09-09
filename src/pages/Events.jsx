import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Calendar, Edit2, Image as ImageIcon, Plus, RefreshCw, Search, Trash2, Eye, ImageOff, Filter, X, Bell, Users, Shield, UserCheck } from 'lucide-react'
import api, { assetUrl, getEventsList } from '../lib/api'
import { EVENT_ENDPOINTS, MEMBER_ENDPOINTS } from '../utils/endpoints'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import Loader from '../components/common/Loader'
import { useNavigate } from 'react-router-dom'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import MultiSelect from '../components/common/MultiSelect'
import Button from '../components/common/Button'
import Switch from '../components/common/Switch'
import Table from '../components/common/Table'
import SearchInput from '../components/common/SearchInput'
import FilterPopover from '../components/common/FilterPopover'
import { toast } from '../lib/toast'
import FileDropzone from '../components/common/FileDropzone'
import DateTimePicker from '../components/common/DateTimePicker'
import useDebounce from '../hooks/useDebounce'
import EventRegistrations from './EventRegistration'
import Tooltip from '../components/common/Tooltip'
import { AuthContext } from '../context/AuthContext'
import usePermissions from '../hooks/usePermissions'

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
  remove_image: false,
  send_notification: true,
  target_type: 'all', // 'all' | 'committee' | 'specific'
  target_user_ids: []
}



export default function Events({ headerLeftContent }) {
  const { user: currentUser } = useContext(AuthContext)
  const permissions = usePermissions('events')
  const [rows, setRows] = useState([])
  const [limit, setLimit] = useState(15)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [filters, setFilters] = useState({ status: '', event_category_id: '' })
  const [draftFilters, setDraftFilters] = useState({ status: '', event_category_id: '' })
  const [showFilters, setShowFilters] = useState(false)
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
  const [memberOptions, setMemberOptions] = useState([])
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
      const res = await api.get(`${EVENT_ENDPOINTS.GET_REGISTRATIONS}?event_id=${eventId}&limit=1000`)
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
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    const y = d.getFullYear()
    const m = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const h = pad(d.getHours())
    const min = pad(d.getMinutes())
    return `${y}-${m}-${day}T${h}:${min}`
  }

  const navigate = useNavigate()


  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getEventsList({ page, limit, search: debouncedSearch, ...filters })
      const data = res.data?.data || []
      setRows(Array.isArray(data) ? data : [])
      setPagination({
        page: res.data?.pagination?.page || page,
        totalPages: res.data?.pagination?.totalPages || 1,
        total: res.data?.pagination?.total || 0,
        limit: res.data?.pagination?.limit || limit
      })
    } catch (err) {
      setRows([])
      setError(err.response?.data?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, filters])

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get(`${MEMBER_ENDPOINTS.GET_MEMBERS}?limit=1000`)
      const list = res.data?.data || []
      
      const heads = list.filter(m => m.familyHead || m.relation === 'Self')
      const nonHeads = list.filter(m => !m.familyHead && m.relation !== 'Self')

      const processedIds = new Set()
      const hierarchicalList = []

      heads.forEach(head => {
        const headId = String(head.id || head._id)
        const headMemberId = String(head.member_id || '')
        
        const children = nonHeads.filter(c => {
          const cHeadId = String(c.family_head?.id || c.family_head?._id || c.family_head_id || '')
          const cParentId = String(c.parent_member_id || '')
          return (cHeadId && (cHeadId === headId || cHeadId === headMemberId)) ||
                 (cParentId && (cParentId === headMemberId || cParentId === headId))
        })

        const childIds = children.map(c => String(c.id || c._id))
        const headName = [head.first_name, head.middle_name, head.last_name].filter(Boolean).join(' ') || head.number || 'Unnamed'
        const headSubtext = [head.member_id ? `ID: ${head.member_id}` : '', head.number].filter(Boolean).join(' • ')

        hierarchicalList.push({
          value: headId,
          label: headName,
          subtext: head.member_id ? `ID: ${head.member_id}` : '',
          is_head: true,
          is_child: false,
          child_ids: childIds,
          relation: 'Family Head'
        })
        processedIds.add(headId)

        // Add children directly under the head
        children.forEach(c => {
          const cId = String(c.id || c._id)
          const cName = [c.first_name, c.middle_name, c.last_name].filter(Boolean).join(' ') || c.number || 'Unnamed'

          hierarchicalList.push({
            value: cId,
            label: cName,
            subtext: c.member_id ? `ID: ${c.member_id}` : '',
            is_head: false,
            is_child: true,
            parent_head_id: headId,
            relation: c.relation || 'Member',
            child_ids: []
          })
          processedIds.add(cId)
        })
      })

      // Add remaining members not linked to any head
      list.forEach(m => {
        const mId = String(m.id || m._id)
        if (!processedIds.has(mId)) {
          const mName = [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ') || m.number || 'Unnamed'
          hierarchicalList.push({
            value: mId,
            label: mName,
            subtext: m.member_id ? `ID: ${m.member_id}` : '',
            is_head: false,
            is_child: false,
            relation: m.relation || 'Member',
            child_ids: []
          })
        }
      })

      setMemberOptions(hierarchicalList)
    } catch (err) {
      console.error('Failed to load member options for notification targeting', err)
    }
  }, [])

  const fetchCountryList = useCallback(async () => {
    try {
      const res = await api.get(MEMBER_ENDPOINTS.MASTERS_COUNTRY)
      const list = res.data?.data || res.data || []
      setCountryList(list)
      // Find India and store its ID for default selection
      const india = list.find(c => /india/i.test(c.name))
      if (india) {
        const indiaId = india.id || india._id
        setFormData(prev => ({ ...prev, country_id: prev.country_id || indiaId }))
        // store india id on defaultForm reference
        defaultForm.country_id = indiaId
      }
      return list
    } catch (err) {
      console.error('Failed to load country list:', err)
      return []
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStateList = useCallback(async () => {
    try {
      const res = await api.get(MEMBER_ENDPOINTS.MASTERS_STATE)
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
      const res = await api.get(MEMBER_ENDPOINTS.MASTERS_CITY)
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
    fetchMembers()
  }, [fetchCountryList, fetchStateList, fetchCityList, fetchMembers])





  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const setSearch = (value) => {
    setSearchValue(value)
    setPage(1)
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get(EVENT_ENDPOINTS.GET_CATEGORIES)
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
    if (!val) return '-'
    try {
      const str = String(val).trim()
      if (!str) return '-'
      if (str.includes('/')) {
        const parts = str.split('/')
        if (parts.length === 3) {
          return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`
        }
      }
      const d = new Date(val)
      if (isNaN(d.getTime())) return String(val)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return String(val || '-')
    }
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
      await api.put(EVENT_ENDPOINTS.UPDATE_EVENT(id), { status: newStatus })
      await fetchEvents()
      toast.success('Status updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleBulkStatus = async (selectedIds, newStatus) => {
    if (!selectedIds.length) return;
    try {
      await api.put(EVENT_ENDPOINTS.BULK_STATUS, { eventIds: selectedIds, status: newStatus });
      toast.success(`Selected events marked as ${newStatus === 1 ? 'Approved' : 'Inactive'}`);
      await fetchEvents();
    } catch (err) {
      toast.error('Failed to update status for selected events');
    }
  };

  const handleBulkDelete = async (selectedIds) => {
    if (!selectedIds.length) return;
    if (!await confirm(`Are you sure you want to delete ${selectedIds.length} selected events?`)) return;
    try {
      await api.delete(EVENT_ENDPOINTS.BULK_DELETE, { data: { eventIds: selectedIds } });
      toast.success(`${selectedIds.length} events deleted successfully`);
      await fetchEvents();
    } catch (err) {
      toast.error('Failed to delete selected events');
    }
  };

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
      remove_image: false,
      send_notification: row.send_notification !== false,
      target_type: row.target_type || 'all',
      target_user_ids: Array.isArray(row.target_users) ? row.target_users.map(String) : []
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

    if (formData.send_notification && formData.target_type === 'specific' && (!formData.target_user_ids || !formData.target_user_ids.length)) {
      nextErrors.target_user_ids = 'Please select at least one member to receive the notification'
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
      
      if (formData.send_notification) {
        payload.append('send_notification', 'true')
        payload.append('target_type', formData.target_type || 'all')
        if (formData.target_type === 'specific') {
          payload.append('target_user_ids', JSON.stringify(formData.target_user_ids))
        }
      } else {
        payload.append('send_notification', 'false')
      }

      if (formData.image instanceof File) {
        payload.append('image', formData.image)
      }
      if (formData.remove_image) {
        payload.append('remove_image', 'true')
      }

      if (selectedId) {
        await api.put(EVENT_ENDPOINTS.UPDATE_EVENT(selectedId), payload)
      } else {
        await api.post(EVENT_ENDPOINTS.CREATE_EVENT, payload)
      }

      await fetchEvents()
      toast.success('Event saved successfully')
      setIsModalOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }


  const handleDelete = async (rowOrId) => {
    const id = typeof rowOrId === 'object' ? (rowOrId?.id || rowOrId?._id || '') : (rowOrId || '')
    if (!id) return
    const title = typeof rowOrId === 'object' && rowOrId?.title ? rowOrId.title : 'this event'
    if (!await confirm(`Delete ${title}?`)) return
    try {
      await api.delete(EVENT_ENDPOINTS.DELETE_EVENT(id))
      await fetchEvents()
      toast.success('Event deleted successfully')
    } catch (err) {
      try {
        await api.delete(EVENT_ENDPOINTS.BULK_DELETE, { data: { eventIds: [id] } })
        await fetchEvents()
        toast.success('Event deleted successfully')
      } catch (bulkErr) {
        toast.error(err.response?.data?.message || bulkErr.response?.data?.message || 'Failed to delete event')
      }
    }
  }

  return (
    <div className="space-y-6 text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 overflow-x-auto hide-scrollbar">
          {headerLeftContent ? headerLeftContent : (
            <h2 className="text-2xl font-bold text-text tracking-tight">Events</h2>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchInput
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
          <FilterPopover
            isOpen={showFilters}
            onToggle={() => {
              setDraftFilters(filters)
              setShowFilters(!showFilters)
            }}
            onClose={() => setShowFilters(false)}
            activeCount={(filters.status ? 1 : 0) + (filters.event_category_id ? 1 : 0)}
            onClear={() => {
              setDraftFilters({ status: '', event_category_id: '' })
              setFilters({ status: '', event_category_id: '' })
              setPage(1)
              setShowFilters(false)
            }}
            onApply={() => {
              setFilters(draftFilters)
              setPage(1)
              setShowFilters(false)
            }}
          >
            <Select
              label="Event Category"
              value={draftFilters.event_category_id}
              onChange={(val) => setDraftFilters(current => ({ ...current, event_category_id: val }))}
              placeholder="All Categories"
              searchable={false}
              options={[
                { label: 'All Categories', value: '' },
                ...categories.map(c => ({ label: c.name || c.category || c.title || c.category_name, value: c.id || c._id }))
              ]}
            />
            <Select
              label="Status"
              value={draftFilters.status}
              onChange={(val) => setDraftFilters(current => ({ ...current, status: val }))}
              placeholder="All Status"
              searchable={false}
              options={[
                { label: 'All Status', value: '' },
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' }
              ]}
            />
          </FilterPopover>
          {!permissions.canAdd && !permissions.isSuperAdmin ? null : (
            <Button onClick={openCreate} variant="primary" icon={<Plus className="w-4 h-4" />} className="h-10">
              Add Event
            </Button>
          )}
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
                <div className="font-semibold text-text truncate">{row.title}</div>
                {row.description && row.description.length > 30 ? (
                  <Tooltip content={row.description}>
                    <div className="text-xs text-text-secondary line-clamp-1 cursor-pointer hover:text-primary transition-colors">{row.description}</div>
                  </Tooltip>
                ) : (
                  <div className="text-xs text-text-secondary line-clamp-1">{row.description}</div>
                )}
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
                {!permissions.canEdit && !permissions.isSuperAdmin ? null : (
                  <button
                    onClick={() => openEdit(row)}
                    className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all"
                    title="Edit Event"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!permissions.canDelete && !permissions.isSuperAdmin ? null : (
                  <button
                    onClick={() => handleDelete(row)}
                    className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all"
                    title="Delete Event"
                  >
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
        onBulkStatus={!permissions.canEdit && !permissions.isSuperAdmin ? undefined : handleBulkStatus}
        onBulkDelete={!permissions.canDelete && !permissions.isSuperAdmin ? undefined : handleBulkDelete}
        emptyState={{
          icon: Calendar,
          title: 'No events found',
          description: 'Try expanding your search criteria or create a new event',
          actionLabel: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : 'Add Event',
          onAction: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : openCreate
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
                className="flex-1 flex flex-col min-h-[230px]"
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

          {/* Notification Options Box */}
          <div className="p-4 rounded-2xl bg-surface-secondary/40 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Bell size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text">Push Notification</h4>
                  <p className="text-xs text-text-secondary">Notify members on their mobile app and dashboard</p>
                </div>
              </div>
              <Switch
                checked={!!formData.send_notification}
                onChange={(val) => setFormData({ ...formData, send_notification: val })}
                disabled={saving}
                showText={false}
              />
            </div>

            {formData.send_notification && (
              <div className="pt-2 border-t border-border/70 space-y-3 animate-fade-in">
                <label className="block text-xs font-bold text-text uppercase tracking-wider">
                  Target Audience
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, target_type: 'all' })}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      formData.target_type === 'all'
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                        : 'border-border bg-input-bg text-text-secondary hover:border-primary/40'
                    }`}
                  >
                    <Users size={16} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight">All Members</div>
                      <div className="text-[10px] opacity-75 truncate">Broadcast to everyone</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, target_type: 'committee' })}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      formData.target_type === 'committee'
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                        : 'border-border bg-input-bg text-text-secondary hover:border-primary/40'
                    }`}
                  >
                    <Shield size={16} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight">Committee Only</div>
                      <div className="text-[10px] opacity-75 truncate">Trustees & Committee</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, target_type: 'specific' })}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      formData.target_type === 'specific'
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                        : 'border-border bg-input-bg text-text-secondary hover:border-primary/40'
                    }`}
                  >
                    <UserCheck size={16} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight">Specific Members</div>
                      <div className="text-[10px] opacity-75 truncate">Select recipients</div>
                    </div>
                  </button>
                </div>

                {formData.target_type === 'specific' && (
                  <div className="mt-2 animate-fade-in">
                    <MultiSelect
                      label="Select Members"
                      required
                      options={memberOptions}
                      values={formData.target_user_ids}
                      onChange={(selectedIds) => {
                        setFormData({ ...formData, target_user_ids: selectedIds });
                        if (fieldErrors.target_user_ids) {
                          setFieldErrors({ ...fieldErrors, target_user_ids: null });
                        }
                      }}
                      error={fieldErrors.target_user_ids}
                      placeholder="Search and pick members..."
                      disabled={saving}
                    />
                  </div>
                )}
              </div>
            )}
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



