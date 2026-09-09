import React, { useCallback, useEffect, useState } from 'react'
import { FileText, Calendar, Trash2, Clock, Search, RefreshCw, Plus, Edit2, ImageOff, Filter, X, Bell, Users, Shield, UserCheck } from 'lucide-react'
import api, { assetUrl, getNewsList, formatDate } from '../lib/api'
import { NEWS_ENDPOINTS, MEMBER_ENDPOINTS } from '../utils/endpoints'
import { confirm } from '../lib/confirm'
import Loader from '../components/common/Loader'
import Modal from '../components/Modal'
import FileDropzone from '../components/common/FileDropzone'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import MultiSelect from '../components/common/MultiSelect'
import DateTimePicker from '../components/common/DateTimePicker'
import Button from '../components/common/Button'
import Switch from '../components/common/Switch'
import Table from '../components/common/Table'
import SearchInput from '../components/common/SearchInput'
import FilterPopover from '../components/common/FilterPopover'
import { toast } from '../lib/toast'
import useDebounce from '../hooks/useDebounce'
import Tooltip from '../components/common/Tooltip'
import usePermissions from '../hooks/usePermissions'

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

export default function News({ headerLeftContent }) {
  const permissions = usePermissions('news')
  const [rows, setRows] = useState([])
  const [limit, setLimit] = useState(15)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [filters, setFilters] = useState({ status: '', category: '' })
  const [draftFilters, setDraftFilters] = useState({ status: '', category: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selected, setSelected] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [existingImage, setExistingImage] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [memberOptions, setMemberOptions] = useState([])

  const emptyNewsForm = {
    title: '',
    description: '',
    date: toDateTimeLocal(new Date()),
    status: 1,
    image: null,
    remove_image: false,
    send_notification: true,
    target_type: 'all', // 'all' | 'committee' | 'specific'
    target_user_ids: [],
  }

  const [formData, setFormData] = useState(emptyNewsForm)
  const [fieldErrors, setFieldErrors] = useState({})



  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1)
  const currentPage = Math.min(Math.max(Number(pagination.page) || page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getNewsList({ page, limit, search: debouncedSearch, ...filters })
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
      setError(err.response?.data?.message || 'Failed to load news')
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

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const setSearch = (value) => {
    setSearchValue(value)
    setPage(1)
  }

  const handleDelete = async (rowOrId) => {
    const id = typeof rowOrId === 'object' ? (rowOrId.id || rowOrId._id) : rowOrId
    if (!id) return
    if (!await confirm('Are you sure you want to delete this news announcement?')) return
    try {
      await api.delete(NEWS_ENDPOINTS.DELETE_NEWS(id))
      await fetchNews()
      toast.success('News deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete news announcement')
    }
  }

  const openCreate = () => {
    setSelected(null)
    setSelectedId('')  
    setExistingImage('')
    setFormData(emptyNewsForm)
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const openEdit = (newsItem) => {
    setSelected(newsItem)
    setSelectedId(newsItem.id || newsItem._id || '') 
    setExistingImage(newsItem.image || '')
    setFormData({
      title: newsItem.title || '',
      description: newsItem.description || '',
      date: toDateTimeLocal(newsItem.date || newsItem.createdAt || new Date()),
      status: Number(newsItem.status ?? 1),
      image: null,
      remove_image: false,
      send_notification: newsItem.send_notification !== false,
      target_type: newsItem.target_type || 'all',
      target_user_ids: Array.isArray(newsItem.target_users) ? newsItem.target_users.map(String) : [],
    })
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    const errors = {}
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    }
    if (formData.send_notification && formData.target_type === 'specific' && (!formData.target_user_ids || !formData.target_user_ids.length)) {
      errors.target_user_ids = 'Please select at least one member to receive the notification'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setSaving(false)
      return
    }
    try {
      const payload = new FormData()
      payload.append('title', formData.title)
      payload.append('description', formData.description)
      payload.append('status', formData.status)
      if (formData.date) {
        payload.append('date', formData.date)
      }
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
        await api.put(NEWS_ENDPOINTS.UPDATE_NEWS(selectedId), payload)
      } else {
        await api.post(NEWS_ENDPOINTS.CREATE_NEWS, payload)
      }
      await fetchNews()
      toast.success('Feed News saved successfully')
      setIsModalOpen(false)
      setSelected(null)
      setExistingImage('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save feed News')
    } finally {
      setSaving(false)
    }
  }



  const handleToggleStatus = async (row) => {
    const id = row.id || row._id
    if (!id) return
    const newStatus = Number(row.status) === 1 ? 0 : 1

    // Optimistic UI update
    setRows(prevRows => prevRows.map(item => {
      if ((item.id || item._id) === id) {
        return { ...item, status: newStatus }
      }
      return item
    }))

    try {
      await api.put(NEWS_ENDPOINTS.UPDATE_NEWS(id), { status: newStatus })
      toast.success('Status updated')
    } catch (err) {
      // Revert on error
      setRows(prevRows => prevRows.map(item => {
        if ((item.id || item._id) === id) {
          return { ...item, status: Number(row.status) === 1 ? 1 : 0 }
        }
        return item
      }))
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleBulkStatus = async (selectedIds, newStatus) => {
    if (!selectedIds.length) return;
    try {
      setRows(prev => prev.map(r => selectedIds.includes(String(r.id || r._id)) ? { ...r, status: newStatus } : r));
      await Promise.all(selectedIds.map(id => api.put(`/news/${id}`, { status: newStatus })));
      toast.success(`Selected news marked as ${newStatus === 1 ? 'Active' : 'Inactive'}`);
      await fetchNews();
    } catch (err) {
      toast.error('Failed to update status for selected news');
      await fetchNews();
    }
  };

  const handleBulkDelete = async (selectedIds) => {
    if (!selectedIds.length) return;
    if (!await confirm(`Are you sure you want to delete ${selectedIds.length} selected news?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/news/${id}`)));
      toast.success(`${selectedIds.length} news deleted successfully`);
      await fetchNews();
    } catch (err) {
      toast.error('Failed to delete selected news');
      await fetchNews();
    }
  };

  return (
    <div className="space-y-6 animate-slide-up text-text">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 overflow-x-auto hide-scrollbar">
          {headerLeftContent ? headerLeftContent : (
            <h2 className="text-2xl font-bold text-text tracking-tight">News Feed</h2>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchInput
            placeholder="Search news..."
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
            activeCount={filters.status ? 1 : 0}
            onClear={() => {
              setDraftFilters({ status: '', category: '' })
              setFilters({ status: '', category: '' })
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
            <Button
              onClick={openCreate}
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
            >
              Add News
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
              <div className="max-w-md">
                <div className="font-semibold">{row.title || '-'}</div>
                {row.description && row.description.length > 50 ? (
                  <Tooltip content={row.description}>
                    <div className="text-text-secondary text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors">{row.description}</div>
                  </Tooltip>
                ) : (
                  <div className="text-text-secondary text-sm line-clamp-2">{row.description || '-'}</div>
                )}
              </div>
            )
          },
          {
            header: 'Post Date',
            key: 'post_date',
            render: (row) => (
              <div className="text-text-secondary text-sm line-clamp-2 max-w-md">
                {formatDate(row.cdate || row.createdAt || row.post_date)}
              </div>
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
            render: row=> ( <div className="flex items-center justify-start gap-2">
                {!permissions.canEdit && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => openEdit(row)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!permissions.canDelete && !permissions.isSuperAdmin ? null : (
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
        onBulkStatus={handleBulkStatus}
        onBulkDelete={handleBulkDelete}
        emptyState={{
          icon: FileText,
          title: 'No News found',
          description: 'There are no News under this search criteria',
          actionLabel: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : 'Add News',
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

      <Modal isOpen={isModalOpen} maxWidth="max-w-3xl" title={selected ? 'Edit News' : 'Add News'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-3 text-text">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
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
            <DateTimePicker
              label="Date & Time"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              disabled={saving}
            />
            <Switch
              label="Status"
              checked={Number(formData.status ?? 1) === 1}
              onChange={(val) => setFormData({ ...formData, status: val ? 1 : 0 })}
              disabled={saving}
              activeLabel="Approved"
              inactiveLabel="Inactive"
            />
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <Input
              type="textarea"
              rows={8}
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

            <div className="flex flex-col h-full">
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Image</label>

              <FileDropzone
                accept="image/*"
                className="flex-1 flex flex-col min-h-[175px]"
                onFilesSelected={(files) => setFormData({ ...formData, image: files[0] || null, remove_image: false })}
                disabled={saving}
                label="Click or Drag News Image"
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


          <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}



