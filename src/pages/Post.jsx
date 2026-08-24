import React, { useCallback, useEffect, useState } from 'react'
import { FileText, Calendar, Trash2, Clock, Search, RefreshCw, Plus, Edit2, ImageOff, Filter, X } from 'lucide-react'
import api, { assetUrl, getPostsList, formatDate } from '../lib/api'
import { confirm } from '../lib/confirm'
import Loader from '../components/common/Loader'
import Modal from '../components/Modal'
import FileDropzone from '../components/common/FileDropzone'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import SearchInput from '../components/common/SearchInput'
import FilterPopover from '../components/common/FilterPopover'
import DateTimePicker from '../components/common/DateTimePicker'
import { toast } from '../lib/toast'
import useDebounce from '../hooks/useDebounce'
import usePermissions from '../hooks/usePermissions'
import Tooltip from '../components/common/Tooltip'

export default function Post({ headerLeftContent }) {
  const permissions = usePermissions('posts')
  const [posts, setPosts] = useState([])
  const [limit, setLimit] = useState(15)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filters, setFilters] = useState({ status: '' })
  const [draftFilters, setDraftFilters] = useState({ status: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const emptyPostForm = {
    title: '',
    description: '',
    status: 1,
    image: null,
    remove_image: false
  }
  const [formData, setFormData] = useState(emptyPostForm)
  const [fieldErrors, setFieldErrors] = useState({})

  const [existingImage, setExistingImage] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1)
  const total = Number(pagination.total || 0)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getPostsList({ page, limit, search: debouncedSearch, ...filters })
      const rows = res.data?.data || res.data || []
      const pg = res.data?.pagination || {}
      setPosts(Array.isArray(rows) ? rows : [])
      setPagination({
        page: Number(pg.page || page),
        totalPages: Number(pg.totalPages || pg.total_pages || pg.last_page || 1),
        total: Number(pg.total || 0),
        limit: Number(pg.limit || limit)
      })
    } catch (err) {
      setPosts([])
      setPagination({ page, totalPages: 1, total: 0, limit })
      setError(err.response?.data?.message || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, limit, filters])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleDelete = async (id) => {
    if (!await confirm('Are you sure you want to delete this post from the community board?')) return
    try {
      await api.delete(`/posts/${id}`)
      await fetchPosts()
      toast.success('Post deleted and moderated successfully')
    } catch (err) {
      toast.error('Failed to delete post')
    }
  }

  const openCreate = () => {
    setSelected(null)
    setSelectedId('')
    setExistingImage('')
    setFormData(emptyPostForm)
    setFieldErrors({})
    setError('')
    setIsModalOpen(true)
  }

  const handleEdit = (post) => {
    setSelected(post)
    setSelectedId(post.id || post._id || '')
    setExistingImage(post.image || '')
    setFormData({
      title: post.title || '',
      description: post.description || '',
      status: Number(post.status ?? 1),
      image: null,
      remove_image: false
    })
    setFieldErrors({})
    setError('')
    setIsModalOpen(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setFieldErrors({})
    try {
      const payload = new FormData()
      const errors = {}
      if (!formData.title.trim()) {
        errors.title = 'Title is required'
      }
      if (!formData.description.trim()) {
        errors.description = 'Description is required'
      }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setSaving(false)
        return
      }
      payload.append('title', formData.title)
      payload.append('description', formData.description)
      payload.append('status', formData.status)
      if (formData.image instanceof File) payload.append('image', formData.image)
      if (formData.remove_image) payload.append('remove_image', 'true')
      if (selectedId) {
        await api.put(`/posts/${selectedId}`, payload)
      } else {
        await api.post('/posts', payload)
      }
      await fetchPosts()
      toast.success('Post saved successfully')
      setIsModalOpen(false)
      setSelected(null)
      setExistingImage('')
      setSelectedId('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (post) => {
    const id = post.id || post._id
    if (!id) return
    const newStatus = Number(post.status) === 1 ? 0 : 1

    // Optimistic UI update
    setPosts(prevPosts => prevPosts.map(item => {
      if ((item.id || item._id) === id) {
        return { ...item, status: newStatus }
      }
      return item
    }))

    try {
      await api.put(`/posts/${id}`, { status: newStatus })
      toast.success('Status updated')
    } catch (err) {
      // Revert on error
      setPosts(prevPosts => prevPosts.map(item => {
        if ((item.id || item._id) === id) {
          return { ...item, status: Number(post.status) === 1 ? 1 : 0 }
        } 
        return item
      }))
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleBulkStatus = async (selectedIds, newStatus) => {
    if (!selectedIds.length) return;
    try {
      setPosts(prev => prev.map(r => selectedIds.includes(String(r.id || r._id)) ? { ...r, status: newStatus } : r));
      await Promise.all(selectedIds.map(id => api.put(`/posts/${id}`, { status: newStatus })));
      toast.success(`Selected posts marked as ${newStatus === 1 ? 'Approved' : 'Inactive'}`);
      await fetchPosts();
    } catch (err) {
      toast.error('Failed to update status for selected posts');
      await fetchPosts();
    }
  };

  const handleBulkDelete = async (selectedIds) => {
    if (!selectedIds.length) return;
    if (!await confirm(`Are you sure you want to delete ${selectedIds.length} selected posts?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/posts/${id}`)));
      toast.success(`${selectedIds.length} posts deleted successfully`);
      await fetchPosts();
    } catch (err) {
      toast.error('Failed to delete selected posts');
      await fetchPosts();
    }
  };

  return (
    <div className="space-y-6 animate-slide-up text-text">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 overflow-x-auto hide-scrollbar">
          {headerLeftContent ? headerLeftContent : (
            <h2 className="text-xl font-semibold text-text">Post Moderator</h2>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchInput
            placeholder="Search posts..."
            value={search}
            onChange={(e) => { setSearchValue(e.target.value); setPage(1); }}
            onClear={() => { setSearchValue(''); setPage(1); }}
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
              setDraftFilters({ status: '' })
              setFilters({ status: '' })
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
              Add Post
            </Button>
          )}
        </div>
      </div>

      <Table
        columns={[
          {
            header: 'Image',
            key: 'image',
            render: (post) => (
              post.image ? (
                <img src={assetUrl(post.image)} alt={post.title} className="h-12 w-16 rounded-lg object-cover border border-border" />
              ) : (
                <div className="h-12 w-16 rounded-lg border border-border/60 bg-surface-secondary flex items-center justify-center">
                  <ImageOff className="h-5 w-5 text-text-secondary/40" />
                </div>
              )
            )
          },
          {
            header: 'Title',
            key: 'title',
            render: (post) => <div className="font-semibold">{post.title || '-'}</div>
          },
          {
            header: 'Description',
            key: 'description',
            render: (post) => (
              post.description && post.description.length > 50 ? (
                <Tooltip content={post.description}>
                  <div className="text-text-secondary text-sm line-clamp-2 max-w-xs cursor-pointer hover:text-primary transition-colors">
                    {post.description}
                  </div>
                </Tooltip>
              ) : (
                <div className="text-text-secondary text-sm line-clamp-2 max-w-xs">
                  {post.description || '-'}
                </div>
              )
            )
          },
          {
            header: 'Post Date',
            key: 'date',
            render: (post) => (
              <div className="text-text-secondary text-sm">
                {formatDate(post.cdate || post.createdAt || post.date)}
              </div>
            )
          },
          {
            header: 'Status',
            key: 'status',
            render: (post) => (
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Number(post.status) === 1}
                    onChange={() => handleToggleStatus(post)}
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
            render: post=> ( <div className="flex items-center justify-start gap-2">
                {!permissions.canEdit && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => handleEdit(post)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!permissions.canDelete && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => handleDelete(post.id || post._id)} className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          }
        ]}
        data={posts}
        keyField={(post) => post.id || post._id}
        loading={loading}
        onBulkStatus={handleBulkStatus}
        onBulkDelete={handleBulkDelete}
        emptyState={{
          icon: FileText,
          title: 'No posts found',
          description: 'There are no Post under this search',
          actionLabel: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : 'Add Post',
          onAction: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : openCreate
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

      <Modal isOpen={isModalOpen} maxWidth="max-w-3xl" title={selected ? 'Edit Post' : 'Add Post'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4 text-text">
          <div>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
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
                label="Click or Drag Post Image"
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

          {/* Status moved to bottom */}
          <div className="flex items-center gap-3 pt-1">
            <label className="block text-sm font-semibold text-text-secondary">
              Status:
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={Number(formData.status ?? 1) === 1}
                onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
                disabled={saving}
              />
              <div className="w-11 h-6 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
            <span className="text-sm font-semibold text-text">
              {Number(formData.status ?? 1) === 1 ? 'Approved' : 'Inactive'}
            </span>
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



