import React, { useCallback, useEffect, useState } from 'react'
import { FileText, Calendar, Trash2, Clock, Search, RefreshCw, Plus, Edit2 } from 'lucide-react'
import api, { assetUrl, getPostsList } from '../lib/api'
import { confirm } from '../lib/confirm'
import Loader from '../components/common/Loader'
import Modal from '../components/Modal'
import FileDropzone from '../components/common/FileDropzone'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Table from '../components/common/Table'

export default function Post() {
  const [posts, setPosts] = useState([])
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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
      const res = await getPostsList({ page, limit, search })
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
  }, [page, search, limit])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleDelete = async (id) => {
    if (!await confirm('Are you sure you want to delete this post from the community board?')) return
    try {
      await api.delete(`/posts/${id}`)
      await fetchPosts()
      setSuccess('Post deleted and moderated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to delete post')
    }
  }

  const openCreate = () => {
    setSelected(null)
    setSelectedId('')
    setExistingImage('')
    setFormData(emptyPostForm)
    setFieldErrors({})
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
    setIsModalOpen(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
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
        setError('Please fill in all required fields')
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
      setSuccess('Post saved successfully')
      setIsModalOpen(false)
      setSelected(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save post')
    } finally {
      setSaving(false)
      setExistingImage('')
      setSelectedId('')
    }
  }

  return (
    <div className="space-y-6 animate-slide-up text-text">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Post Moderator</h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={fetchPosts}
            variant="secondary"
            title="Refresh posts"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={openCreate}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Post
          </Button>
          <div className="relative group flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-secondary/60">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="search"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => { setSearchValue(e.target.value); setPage(1); }}
              className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-2xl text-sm flex items-center gap-2 animate-fade-in shadow-sm">
          <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
          {error}
        </div>
      )}
      {success && (
        <div className="bg-success-bg border border-success-border text-success-text p-4 rounded-2xl text-sm flex items-center gap-2 animate-fade-in shadow-sm">
          <span className="w-2 h-2 rounded-full bg-success animate-ping"></span>
          {success}
        </div>
      )}

      {/* Main Grid */}
      {loading && posts.length === 0 ? (
        <div className="py-20"><Loader text="Loading posts..." /></div>
      ) : (
        <Table
          columns={[
            {
              header: 'Image',
              key: 'image',
              render: (post) => (
                post.image ? (
                  <img src={assetUrl(post.image)} alt={post.title} className="h-12 w-16 rounded-lg object-cover border border-border" />
                ) : (
                  <span className="text-text-secondary">No image</span>
                )
              )
            },
            {
              header: 'Title',
              key: 'title',
              render: (post) => <div className="font-semibold max-w-[200px] truncate" title={post.title}>{(post.title || '-').slice(0, 30)}</div>
            },
            {
              header: 'Description',
              key: 'description',
              render: (post) => <div className="text-text-secondary line-clamp-2 max-w-[250px]" title={post.description}>{(post.description || '-').slice(0, 60)}</div>
            },
            {
              header: 'Date',
              key: 'cdate',
              render: (post) => <div className="text-text-secondary whitespace-nowrap">{post.cdate?.slice(0, 10).split('-').reverse().join('-') || '-'}</div>
            },
            {
              header: 'Status',
              key: 'status',
              render: (post) => (
                <span className={`inline-flex px-2.5 py-1 rounded-lg border text-sm font-semibold ${Number(post.status ?? 1) === 1 ? 'bg-success-bg border-success-border text-success-text' : 'bg-surface-secondary border-border text-text-secondary'}`}>
                  {Number(post.status ?? 1) === 1 ? 'Approved' : 'Inactive'}
                </span>
              )
            },
            {
              header: 'Actions',
              key: 'actions',
              align: 'right',
              render: (post) => (
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => handleEdit(post)} className="p-2 text-primary hover:text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit Post">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(post.id || post._id)} className="p-2 text-error-text hover:text-error bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all" title="Delete Post">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            }
          ]}
          data={posts}
          keyField="id"
          emptyState={{
            icon: FileText,
            title: 'No posts found',
            description: 'There are no Post under this search'
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

      <Modal isOpen={isModalOpen} title={selected ? 'Edit Post' : 'Add Post'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4 text-text">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              label="Status"
              value={formData.status}
              onChange={(val) => setFormData({ ...formData, status: val })}
              disabled={saving}
              options={[
                { label: 'Approved', value: 1 },
                { label: 'Pending (Inactive)', value: 0 }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    onRemove: () => setFormData({ ...formData, image: null, remove_image: false })
                  }] : [])
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              isLoading={saving}
              variant="primary"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
