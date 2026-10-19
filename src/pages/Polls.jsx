import React, { useCallback, useEffect, useState } from 'react'
import {
  Vote,
  BarChart2,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Search,
  RefreshCw,
  Filter,
  X,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Layers,
  Check
} from 'lucide-react'
import {
  getPollsList,
  createPoll,
  updatePoll,
  deletePoll,
  getPollResults,
  getPollResponses,
  formatDate
} from '../lib/api'
import { confirm } from '../lib/confirm'
import Loader from '../components/common/Loader'
import Modal from '../components/Modal'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import SearchInput from '../components/common/SearchInput'
import FilterPopover from '../components/common/FilterPopover'
import Tooltip from '../components/common/Tooltip'
import { toast } from '../lib/toast'
import useDebounce from '../hooks/useDebounce'
import usePermissions from '../hooks/usePermissions'

export default function Polls() {
  const permissions = usePermissions('polls')
  const [polls, setPolls] = useState([])
  const [limit, setLimit] = useState(15)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [filters, setFilters] = useState({ status: '', poll_type: '' })
  const [draftFilters, setDraftFilters] = useState({ status: '', poll_type: '' })
  const [showFilters, setShowFilters] = useState(false)

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedPoll, setSelectedPoll] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    poll_type: 'single',
    options: ['', ''],
    end_date: '',
    status: 1,
    is_anonymous: false
  })

  // Results & Analytics modal state
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [resultsData, setResultsData] = useState(null)
  const [activeResultsTab, setActiveResultsTab] = useState('summary') // 'summary' | 'responses'
  const [responses, setResponses] = useState([])
  const [responsesPagination, setResponsesPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [responsesLoading, setResponsesLoading] = useState(false)

  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1)
  const total = Number(pagination.total || 0)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const fetchPolls = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getPollsList({
        page,
        limit,
        search: debouncedSearch,
        ...filters
      })
      const rows = res.data?.data || res.data || []
      const pg = res.data?.pagination || {}
      setPolls(Array.isArray(rows) ? rows : [])
      setPagination({
        page: Number(pg.page) || page,
        totalPages: Number(pg.totalPages) || 1,
        total: Number(pg.total) || (Array.isArray(rows) ? rows.length : 0),
        limit: Number(pg.limit) || limit
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load polls')
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, filters])

  useEffect(() => {
    fetchPolls()
  }, [fetchPolls])

  const openCreateModal = () => {
    setSelectedPoll(null)
    setFormData({
      title: '',
      description: '',
      poll_type: 'single',
      options: ['', ''],
      end_date: '',
      status: 1,
      is_anonymous: false
    })
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (poll) => {
    setSelectedPoll(poll)
    setFormData({
      title: poll.title || '',
      description: poll.description || '',
      poll_type: poll.poll_type || 'single',
      options: poll.options && poll.options.length ? poll.options.map(o => o.text) : ['', ''],
      end_date: poll.end_date ? poll.end_date.split('T')[0] : '',
      status: poll.status !== undefined ? Number(poll.status) : 1,
      is_anonymous: Boolean(poll.is_anonymous)
    })
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }))
  }

  const handleRemoveOption = (index) => {
    if (formData.options.length <= 2) {
      toast.error('A poll must have at least 2 options')
      return
    }
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  const handleOptionChange = (index, value) => {
    setFormData(prev => {
      const next = [...prev.options]
      next[index] = value
      return { ...prev, options: next }
    })
    if (fieldErrors.options) {
      setFieldErrors(prev => ({ ...prev, options: null }))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const errors = {}

    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }

    const cleanOptions = formData.options.map(o => o.trim()).filter(Boolean)
    if (cleanOptions.length < 2) {
      errors.options = 'Please provide at least 2 non-empty options'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        poll_type: formData.poll_type,
        options: cleanOptions,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        status: Number(formData.status),
        is_anonymous: Boolean(formData.is_anonymous)
      }

      if (selectedPoll) {
        await updatePoll(selectedPoll.id || selectedPoll._id, payload)
        toast.success('Poll updated successfully')
      } else {
        await createPoll(payload)
        toast.success('Poll created successfully')
      }

      setIsModalOpen(false)
      fetchPolls()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save poll')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const isConfirmed = await confirm(
      'Are you sure you want to delete this poll? All responses and votes associated with it will be permanently removed.',
      {
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      }
    )

    if (!isConfirmed) return

    try {
      await deletePoll(id)
      toast.success('Poll deleted successfully')
      fetchPolls()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete poll')
    }
  }

  const handleToggleStatus = async (poll) => {
    const newStatus = Number(poll.status) === 1 ? 0 : 1
    try {
      await updatePoll(poll.id || poll._id, { status: newStatus })
      toast.success(newStatus === 1 ? 'Poll activated' : 'Poll closed')
      fetchPolls()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleOpenResults = async (poll) => {
    setSelectedPoll(poll)
    setIsResultsModalOpen(true)
    setActiveResultsTab('summary')
    setResultsLoading(true)

    try {
      const res = await getPollResults(poll.id || poll._id)
      setResultsData(res.data?.data || res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch poll results')
    } finally {
      setResultsLoading(false)
    }
  }

  const fetchResponses = useCallback(async (pollId, pageNum = 1) => {
    setResponsesLoading(true)
    try {
      const res = await getPollResponses(pollId, { page: pageNum, limit: 10 })
      const rows = res.data?.data || res.data || []
      const pg = res.data?.pagination || {}
      setResponses(Array.isArray(rows) ? rows : [])
      setResponsesPagination({
        page: Number(pg.page) || pageNum,
        totalPages: Number(pg.totalPages) || 1,
        total: Number(pg.total) || (Array.isArray(rows) ? rows.length : 0)
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch responses')
    } finally {
      setResponsesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isResultsModalOpen && selectedPoll && activeResultsTab === 'responses') {
      fetchResponses(selectedPoll.id || selectedPoll._id, 1)
    }
  }, [isResultsModalOpen, selectedPoll, activeResultsTab, fetchResponses])

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-surface rounded-2xl border border-border/80 shadow-sm p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Vote className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-text tracking-tight">
                  Polls & Community Voting
                </h1>
                <p className="text-sm text-text-secondary mt-0.5">
                  Engage community members with questions, polls, and live opinion tracking
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <Button
              variant="outline"
              onClick={fetchPolls}
              className="gap-2"
              title="Refresh Polls"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {(!permissions.canAdd && !permissions.isSuperAdmin) ? null : (
              <Button
                variant="primary"
                onClick={openCreateModal}
                className="gap-2 shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                <span>Create Poll</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="mt-6 pt-5 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="max-w-md w-full">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearchValue(e.target.value)
                setPage(1)
              }}
              placeholder="Search polls by question or description..."
            />
          </div>

          <div className="flex items-center gap-3">
            <FilterPopover
              isOpen={showFilters}
              onToggle={() => {
                setDraftFilters(filters)
                setShowFilters(!showFilters)
              }}
              onClose={() => setShowFilters(false)}
              onApply={() => {
                setFilters(draftFilters)
                setPage(1)
                setShowFilters(false)
              }}
              onReset={() => {
                const reset = { status: '', poll_type: '' }
                setDraftFilters(reset)
                setFilters(reset)
                setPage(1)
                setShowFilters(false)
              }}
              activeFilterCount={Object.values(filters).filter(Boolean).length}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                    Status
                  </label>
                  <Select
                    value={draftFilters.status}
                    onChange={(e) => setDraftFilters({ ...draftFilters, status: e.target.value })}
                    options={[
                      { value: '', label: 'All Statuses' },
                      { value: '1', label: 'Active' },
                      { value: '0', label: 'Closed / Inactive' }
                    ]}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                    Poll Type
                  </label>
                  <Select
                    value={draftFilters.poll_type}
                    onChange={(e) => setDraftFilters({ ...draftFilters, poll_type: e.target.value })}
                    options={[
                      { value: '', label: 'All Types' },
                      { value: 'single', label: 'Single Choice' },
                      { value: 'multiple', label: 'Multiple Choice' }
                    ]}
                  />
                </div>
              </div>
            </FilterPopover>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Table
        columns={[
          {
            header: 'Question / Poll Title',
            key: 'title',
            render: (poll) => (
              <div className="max-w-md">
                <div className="font-semibold text-text text-sm hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenResults(poll)}>
                  {poll.title}
                </div>
                {poll.description ? (
                  <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                    {poll.description}
                  </p>
                ) : null}
              </div>
            )
          },
          {
            header: 'Type',
            key: 'poll_type',
            render: (poll) => (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                poll.poll_type === 'multiple'
                  ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                  : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
              }`}>
                {poll.poll_type === 'multiple' ? 'Multiple Choice' : 'Single Choice'}
              </span>
            )
          },
          {
            header: 'Options & Leading Result',
            key: 'options',
            render: (poll) => {
              const opts = poll.options || []
              const totalV = poll.total_votes || 0
              let leading = opts[0]
              opts.forEach(o => {
                if ((o.votes_count || 0) > (leading?.votes_count || 0)) leading = o
              })

              return (
                <div className="space-y-1.5 min-w-[180px]">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>{opts.length} Options</span>
                    {totalV > 0 && leading ? (
                      <span className="font-medium text-emerald-600">
                        Top: {leading.percentage || 0}%
                      </span>
                    ) : null}
                  </div>
                  {totalV > 0 && leading ? (
                    <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(leading.percentage || 0, 100)}%` }}
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-text-secondary/70 italic">No votes yet</div>
                  )}
                </div>
              )
            }
          },
          {
            header: 'Votes',
            key: 'total_votes',
            align: 'center',
            render: (poll) => (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-secondary text-text font-semibold text-xs border border-border/50">
                <Users className="w-3.5 h-3.5 text-text-secondary" />
                <span>{poll.total_votes || 0}</span>
              </div>
            )
          },
          {
            header: 'End Date',
            key: 'end_date',
            render: (poll) => {
              const isExpired = poll.is_expired || (poll.end_date && new Date(poll.end_date) < new Date())
              return (
                <div className="text-xs">
                  {poll.end_date ? (
                    <div>
                      <div className="font-medium text-text">{formatDate(poll.end_date)}</div>
                      {isExpired ? (
                        <span className="text-[10px] text-red-500 font-semibold tracking-wider uppercase">
                          Ended
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-500 font-medium">Ongoing</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-text-secondary">No expiry</span>
                  )}
                </div>
              )
            }
          },
          {
            header: 'Status',
            key: 'status',
            render: (poll) => (
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Number(poll.status) === 1}
                    onChange={() => handleToggleStatus(poll)}
                    disabled={!permissions.canEdit && !permissions.isSuperAdmin}
                  />
                  <div className="w-9 h-5 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            )
          },
          {
            header: 'Actions',
            key: 'actions',
            align: 'right',
            render: (poll) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleOpenResults(poll)}
                  className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all"
                  title="View Poll Results"
                >
                  <BarChart2 className="w-4 h-4" />
                </button>

                {(!permissions.canEdit && !permissions.isSuperAdmin) ? null : (
                  <button
                    onClick={() => openEditModal(poll)}
                    className="p-2 text-text-secondary hover:text-text bg-surface-secondary hover:bg-surface-secondary/80 border border-border/60 rounded-xl transition-all"
                    title="Edit Poll"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {(!permissions.canDelete && !permissions.isSuperAdmin) ? null : (
                  <button
                    onClick={() => handleDelete(poll.id || poll._id)}
                    className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all"
                    title="Delete Poll"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          }
        ]}
        data={polls}
        keyField={(poll) => poll.id || poll._id}
        loading={loading}
        emptyState={{
          icon: Vote,
          title: 'No Polls Found',
          description: search || filters.status ? 'No polls match your active filters' : 'Start by creating your first community poll!',
          actionLabel: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : 'Create Poll',
          onAction: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : openCreateModal
        }}
        pagination={{
          currentPage: page,
          totalPages,
          total,
          pageNumbers,
          loading,
          onPageChange: setPage,
          limit,
          onLimitChange: (newLimit) => {
            setLimit(newLimit)
            setPage(1)
          }
        }}
      />

      {/* Create / Edit Poll Modal */}
      <Modal
        isOpen={isModalOpen}
        maxWidth="max-w-2xl"
        title={selectedPoll ? 'Edit Poll' : 'Create New Poll'}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4 text-text">
          <div>
            <Input
              label="Poll Question / Title"
              required
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value })
                if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: null })
              }}
              placeholder="e.g. Should we organize the annual gathering in December?"
              disabled={saving}
              error={fieldErrors.title}
            />
          </div>

          <div>
            <Input
              type="textarea"
              rows={3}
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide background context or instructions for community members..."
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                Poll Type
              </label>
              <Select
                value={formData.poll_type}
                onChange={(e) => setFormData({ ...formData, poll_type: e.target.value })}
                options={[
                  { value: 'single', label: 'Single Choice (Select 1 option)' },
                  { value: 'multiple', label: 'Multiple Choice (Select multiple)' }
                ]}
                disabled={saving}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                End Date (Optional)
              </label>
              <input
                type="date"
                className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>

          {/* Poll Options Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Voting Options (Minimum 2) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Option
              </button>
            </div>

            {fieldErrors.options ? (
              <p className="text-xs text-red-500 mb-2">{fieldErrors.options}</p>
            ) : null}

            <div className="space-y-2.5">
              {formData.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-surface-secondary flex items-center justify-center text-xs font-semibold text-text-secondary shrink-0">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1} (e.g. Yes, No, Need discussion)`}
                    className="flex-1 bg-surface border border-border rounded-xl px-3.5 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    disabled={saving}
                  />
                  {formData.options.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 text-text-secondary hover:text-red-500 transition-colors"
                      title="Remove Option"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Checkboxes / Switches */}
          <div className="pt-2 flex flex-col sm:flex-row gap-4 border-t border-border/60">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={Number(formData.status) === 1}
                onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
                className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4"
              />
              <span className="text-sm font-medium text-text">Active for voting</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_anonymous}
                onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4"
              />
              <span className="text-sm font-medium text-text">Anonymous Poll (Hide voter identities)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
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
              disabled={saving}
              className="gap-2"
            >
              {saving ? <Loader className="w-4 h-4" /> : null}
              <span>{selectedPoll ? 'Update Poll' : 'Publish Poll'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Results & Voter Analytics Modal */}
      <Modal
        isOpen={isResultsModalOpen}
        maxWidth="max-w-3xl"
        title={resultsData?.title || selectedPoll?.title || 'Poll Results'}
        onClose={() => setIsResultsModalOpen(false)}
      >
        {resultsLoading ? (
          <div className="py-12 flex justify-center">
            <Loader className="w-8 h-8 text-primary" />
          </div>
        ) : (
          <div className="space-y-6 text-text">
            {/* Header info */}
            <div className="bg-surface-secondary/50 rounded-xl p-4 border border-border/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-text">
                    {resultsData?.title || selectedPoll?.title}
                  </h3>
                  {resultsData?.description ? (
                    <p className="text-xs text-text-secondary mt-1">
                      {resultsData.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    <Users className="w-3.5 h-3.5" />
                    <span>{resultsData?.total_votes || 0} Total Votes</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs inside modal */}
            <div className="flex border-b border-border/60">
              <button
                onClick={() => setActiveResultsTab('summary')}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                  activeResultsTab === 'summary'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text'
                }`}
              >
                Results Breakdown
              </button>
              <button
                onClick={() => setActiveResultsTab('responses')}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                  activeResultsTab === 'responses'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text'
                }`}
              >
                Voter Log ({resultsData?.total_votes || 0})
              </button>
            </div>

            {/* Tab 1: Visual Option Breakdown */}
            {activeResultsTab === 'summary' ? (
              <div className="space-y-4">
                {(resultsData?.options || []).map((opt) => {
                  const pct = opt.percentage || 0
                  const isLeading = resultsData?.leading_option?.id === opt.id && opt.votes_count > 0

                  return (
                    <div
                      key={opt.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isLeading
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-border/60 bg-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 font-medium text-sm text-text">
                          {isLeading ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                          )}
                          <span>{opt.text}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-text-secondary">
                            {opt.votes_count} {opt.votes_count === 1 ? 'vote' : 'votes'}
                          </span>
                          <span className="text-sm font-bold text-text w-12 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="w-full bg-surface-secondary rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLeading ? 'bg-emerald-500' : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {/* Tab 2: Individual Voter Responses */}
            {activeResultsTab === 'responses' ? (
              <div>
                {responsesLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader className="w-6 h-6 text-primary" />
                  </div>
                ) : responses.length === 0 ? (
                  <div className="py-8 text-center text-sm text-text-secondary">
                    No individual vote records recorded yet.
                  </div>
                ) : (
                  <div className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/60">
                    {responses.map((resp) => (
                      <div key={resp._id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                        <div>
                          <div className="font-semibold text-text text-sm">
                            {resp.member_name}
                          </div>
                          {resp.member_mobile ? (
                            <div className="text-text-secondary text-xs">{resp.member_mobile}</div>
                          ) : null}
                          <div className="text-text-secondary/70 text-[11px] mt-0.5">
                            {resp.voted_at ? new Date(resp.voted_at).toLocaleString() : '-'}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 justify-end max-w-xs">
                          {(resp.selected_options || []).map((o, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-medium"
                            >
                              {o.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-4 border-t border-border/60">
              <Button variant="outline" onClick={() => setIsResultsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
