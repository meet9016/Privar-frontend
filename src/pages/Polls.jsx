import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  Vote,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  CheckSquare,
  Square,
  BarChart2,
  Users,
  Eye,
  Edit2,
  Trash2,
  X,
  Lock,
  Unlock,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  UserCheck,
  UserX,
  AlertCircle,
  Share2
} from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import usePermissions from '../hooks/usePermissions'
import { toast } from '../lib/toast'
import { confirm } from '../lib/confirm'
import {
  getPollsList,
  createPoll,
  updatePoll,
  deletePoll,
  submitPollVote,
  getPollResults,
  getPollResponses,
  assetUrl
} from '../lib/api'
import Modal from '../components/Modal'
import Loader from '../components/common/Loader'
import useDebounce from '../hooks/useDebounce'
import DatePicker from '../components/DatePicker'
import Select from '../components/common/Select'
import Input from '../components/common/Input'
import SearchInput from '../components/common/SearchInput'
import Button from '../components/common/Button'
import { Sparkles, Smartphone, Check, HelpCircle } from 'lucide-react'

const defaultForm = {
  question: '',
  description: '',
  type: 'single', // 'single' | 'multiple'
  options: ['', ''],
  startDate: '',
  endDate: '',
  status: 'active' // 'draft' | 'active' | 'closed'
}

export default function Polls() {
  const { user } = useContext(AuthContext)
  const permissions = usePermissions('polls')
  const isAdmin = permissions.isSuperAdmin || permissions.canAdd || permissions.canEdit || permissions.canDelete

  // State
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'vote') // 'manage' | 'vote'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'closed' | 'expired' | 'draft'
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Modals & Drawers
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedPollId, setSelectedPollId] = useState(null)
  const [formData, setFormData] = useState(defaultForm)
  const [formSaving, setFormSaving] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  // Results Modal State
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)
  const [resultsData, setResultsData] = useState(null)
  const [resultsLoading, setResultsLoading] = useState(false)

  // Member-wise Responses Modal State
  const [isResponsesModalOpen, setIsResponsesModalOpen] = useState(false)
  const [selectedResponsePoll, setSelectedResponsePoll] = useState(null)
  const [responsesData, setResponsesData] = useState(null)
  const [responsesLoading, setResponsesLoading] = useState(false)
  const [responseStatusTab, setResponseStatusTab] = useState('all') // 'all' | 'participated' | 'not_participated'
  const [responseOptionFilter, setResponseOptionFilter] = useState('')
  const [responseSearch, setResponseSearch] = useState('')
  const debouncedResponseSearch = useDebounce(responseSearch, 300)
  const [responsePage, setResponsePage] = useState(1)

  // Voting State per Poll
  const [votingSelections, setVotingSelections] = useState({}) // { [pollId]: [optionId, ...] }
  const [votingLoading, setVotingLoading] = useState({}) // { [pollId]: boolean }
  const [isChangingVote, setIsChangingVote] = useState({}) // { [pollId]: boolean }

  // 1. Fetch Polls List
  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      if (debouncedSearch) {
        params.search = debouncedSearch
      }

      const res = await getPollsList(params)
      const list = res.data?.data || []
      setPolls(list)

      // Initialize voting selections from user's existing votes
      const initialSelections = {}
      list.forEach((p) => {
        if (p.hasVoted && Array.isArray(p.userSelectedOptions)) {
          initialSelections[p.id] = p.userSelectedOptions
        }
      })
      setVotingSelections(initialSelections)
    } catch (err) {
      console.error('Failed to fetch polls:', err)
      toast.error('Failed to load polls. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, debouncedSearch])

  useEffect(() => {
    fetchPolls()
  }, [fetchPolls])

  // 2. Open Create Form
  const handleOpenCreateModal = () => {
    setFormData(defaultForm)
    setFormErrors({})
    setIsEditing(false)
    setSelectedPollId(null)
    setIsFormModalOpen(true)
  }

  // 3. Open Edit Form
  const handleOpenEditModal = (poll) => {
    setFormData({
      question: poll.question || '',
      description: poll.description || '',
      type: poll.type || 'single',
      options: (poll.options || []).map((o) => o.text || ''),
      startDate: poll.startDate ? poll.startDate.split('T')[0] : '',
      endDate: poll.endDate ? poll.endDate.split('T')[0] : '',
      status: poll.rawStatus || poll.status || 'active'
    })
    setFormErrors({})
    setIsEditing(true)
    setSelectedPollId(poll.id || poll._id)
    setIsFormModalOpen(true)
  }

  // 4. Form Option Management
  const handleAddOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, '']
    }))
  }

  const handleRemoveOption = (index) => {
    if (formData.options.length <= 2) {
      toast.error('A poll must have at least 2 options.')
      return
    }
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  const handleOptionChange = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.options]
      updated[index] = value
      return { ...prev, options: updated }
    })
  }

  // 5. Form Validation
  const validateForm = () => {
    const errors = {}
    if (!formData.question || !formData.question.trim()) {
      errors.question = 'Poll question is required'
    }

    const cleanedOptions = formData.options.map((o) => o.trim())
    if (cleanedOptions.length < 2) {
      errors.options = 'At least 2 options are required'
    }

    const emptyIdx = cleanedOptions.findIndex((o) => !o)
    if (emptyIdx !== -1) {
      errors.options = `Option ${emptyIdx + 1} cannot be empty`
    }

    // Check for duplicates
    const uniqueOptions = new Set(cleanedOptions.map((o) => o.toLowerCase()))
    if (uniqueOptions.size !== cleanedOptions.length) {
      errors.options = 'Duplicate options are not allowed'
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        errors.endDate = 'End date cannot be earlier than start date'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 6. Submit Create / Edit Poll
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setFormSaving(true)
      const payload = {
        question: formData.question.trim(),
        description: formData.description.trim(),
        type: formData.type,
        options: formData.options.map((o) => o.trim()),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        status: formData.status
      }

      if (isEditing) {
        await updatePoll(selectedPollId, payload)
        toast.success('Poll updated successfully')
      } else {
        await createPoll(payload)
        toast.success('Poll created successfully')
      }

      setIsFormModalOpen(false)
      fetchPolls()
    } catch (err) {
      console.error('Error saving poll:', err)
      const msg = err.response?.data?.message || err.message || 'Failed to save poll'
      toast.error(msg)
    } finally {
      setFormSaving(false)
    }
  }

  // 7. Delete Poll
  const handleDeletePoll = async (poll) => {
    const confirmed = await confirm(`Are you sure you want to delete poll: "${poll.question}"? All submitted votes will also be permanently deleted.`, {
      confirmText: 'Delete Poll',
      type: 'danger'
    })

    if (!confirmed) return

    try {
      await deletePoll(poll.id || poll._id)
      toast.success('Poll deleted successfully')
      fetchPolls()
    } catch (err) {
      console.error('Failed to delete poll:', err)
      toast.error('Failed to delete poll')
    }
  }

  // 8. Toggle Poll Status (Active / Closed)
  const handleToggleStatus = async (poll) => {
    const newStatus = poll.status === 'closed' ? 'active' : 'closed'
    try {
      await updatePoll(poll.id || poll._id, { status: newStatus })
      toast.success(`Poll marked as ${newStatus}`)
      fetchPolls()
    } catch (err) {
      toast.error('Failed to update poll status')
    }
  }

  // 9. View Results Modal
  const handleOpenResults = async (poll) => {
    try {
      setResultsLoading(true)
      setIsResultsModalOpen(true)
      const res = await getPollResults(poll.id || poll._id)
      setResultsData(res.data?.data || null)
    } catch (err) {
      toast.error('Failed to fetch poll results')
      setIsResultsModalOpen(false)
    } finally {
      setResultsLoading(false)
    }
  }

  // 10. View Member-wise Responses Modal
  const handleOpenResponses = (poll) => {
    setSelectedResponsePoll(poll)
    setResponseStatusTab('all')
    setResponseOptionFilter('')
    setResponseSearch('')
    setResponsePage(1)
    setIsResponsesModalOpen(true)
  }

  const fetchResponses = useCallback(async () => {
    if (!selectedResponsePoll) return
    try {
      setResponsesLoading(true)
      const params = {
        page: responsePage,
        limit: 15,
        status: responseStatusTab
      }
      if (responseOptionFilter) {
        params.optionId = responseOptionFilter
      }
      if (debouncedResponseSearch) {
        params.search = debouncedResponseSearch
      }

      const res = await getPollResponses(selectedResponsePoll.id || selectedResponsePoll._id, params)
      setResponsesData(res.data || null)
    } catch (err) {
      console.error('Failed to fetch responses:', err)
      toast.error('Failed to load member responses')
    } finally {
      setResponsesLoading(false)
    }
  }, [selectedResponsePoll, responsePage, responseStatusTab, responseOptionFilter, debouncedResponseSearch])

  useEffect(() => {
    if (isResponsesModalOpen && selectedResponsePoll) {
      fetchResponses()
    }
  }, [isResponsesModalOpen, selectedResponsePoll, fetchResponses])

  // 11. Voting Handlers
  const handleSelectOption = (poll, optionId) => {
    const isSingle = poll.type === 'single'
    const pollId = poll.id || poll._id

    setVotingSelections((prev) => {
      const current = prev[pollId] || []
      if (isSingle) {
        return { ...prev, [pollId]: [String(optionId)] }
      } else {
        const idStr = String(optionId)
        const updated = current.includes(idStr)
          ? current.filter((id) => id !== idStr)
          : [...current, idStr]
        return { ...prev, [pollId]: updated }
      }
    })
  }

  const handleSubmitVote = async (poll) => {
    const pollId = poll.id || poll._id
    const selections = votingSelections[pollId] || []

    if (selections.length === 0) {
      toast.error('Please select at least one option to vote.')
      return
    }

    try {
      setVotingLoading((prev) => ({ ...prev, [pollId]: true }))
      await submitPollVote(pollId, { selectedOptions: selections })
      toast.success('Your vote has been submitted successfully!')

      // Turn off editing mode if active
      setIsChangingVote((prev) => ({ ...prev, [pollId]: false }))
      fetchPolls()
    } catch (err) {
      console.error('Vote submission failed:', err)
      const msg = err.response?.data?.message || err.message || 'Vote submission failed'
      toast.error(msg)
    } finally {
      setVotingLoading((prev) => ({ ...prev, [pollId]: false }))
    }
  }

  const handleStartChangeVote = (pollId) => {
    setIsChangingVote((prev) => ({ ...prev, [pollId]: true }))
  }

  const handleCancelChangeVote = (poll) => {
    const pollId = poll.id || poll._id
    // Reset selection to previous vote
    setVotingSelections((prev) => ({
      ...prev,
      [pollId]: poll.userSelectedOptions || []
    }))
    setIsChangingVote((prev) => ({ ...prev, [pollId]: false }))
  }

  // Format Date Helper
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const formatDateTimeDisplay = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return dateStr
    }
  }

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const config = {
      active: { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Active' },
      draft: { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', label: 'Draft' },
      closed: { bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20', label: 'Closed' },
      expired: { bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', label: 'Expired' }
    }[status] || { bg: 'bg-slate-500/10 text-slate-500 border-slate-500/20', label: status }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Vote className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight flex items-center gap-2">
                Polls & Voting
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary">
                {isAdmin
                  ? 'Create community polls, manage vote configurations, and analyze member engagement in real-time.'
                  : 'Participate in community decisions and make your voice heard by voting on active initiatives.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Admin View Mode Switcher */}
          {isAdmin && (
            <div className="flex items-center p-1 bg-surface-secondary border border-border rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'manage'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
                  }`}
              >
                Manage Polls
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('vote')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'vote'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
                  }`}
              >
                Live Experience
              </button>
            </div>
          )}

          {/* Create Poll Button (Admin Only) */}
          {isAdmin && (
            <Button
              onClick={handleOpenCreateModal}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Poll
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'active', 'closed', 'expired', ...(isAdmin ? ['draft'] : [])].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl capitalize border transition-all ${statusFilter === tab
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface text-text-secondary border-border hover:bg-surface-secondary hover:text-text'
                }`}
            >
              {tab === 'all' ? 'All Polls' : tab}
            </button>
          ))}
        </div>

        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search polls by question..."
          wrapperClassName="relative min-w-[240px]"
        />
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader size="lg" />
          <p className="mt-3 text-xs sm:text-sm text-text-secondary">Loading polls...</p>
        </div>
      ) : polls.length === 0 ? (
        <div className="py-16 px-4 text-center bg-surface border border-dashed border-border rounded-2xl flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Vote className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-text">No polls found</h3>
          <p className="text-xs sm:text-sm text-text-secondary max-w-sm mt-1">
            {search || statusFilter !== 'all'
              ? 'No polls match your selected filters. Try searching for something else.'
              : isAdmin
                ? 'No polls have been created yet. Click "+ Create Poll" to get started.'
                : 'There are currently no active polls for voting. Please check back later!'}
          </p>
          {isAdmin && !search && statusFilter === 'all' && (
            <Button
              onClick={handleOpenCreateModal}
              size="sm"
              className="mt-4"
            >
              + Create First Poll
            </Button>
          )}
        </div>
      ) : activeTab === 'manage' && isAdmin ? (
        /* ====================================================================== */
        /* ADMIN MANAGEMENT TABLE VIEW                                            */
        /* ====================================================================== */
        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/60 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="py-3.5 px-4">Poll Question</th>
                  <th className="py-3.5 px-3">Type</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3 text-center">Votes</th>
                  <th className="py-3.5 px-3">Created</th>
                  <th className="py-3.5 px-3">End Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {polls.map((poll) => {
                  const pollId = poll.id || poll._id
                  const isClosed = poll.status === 'closed' || poll.status === 'expired'

                  return (
                    <tr key={pollId} className="hover:bg-surface-secondary/40 transition-colors">
                      {/* Question & Description */}
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="font-semibold text-text leading-snug line-clamp-2">
                          {poll.question}
                        </div>
                        {poll.description && (
                          <div className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                            {poll.description}
                          </div>
                        )}
                        <div className="text-[11px] text-primary/80 font-medium mt-1">
                          {poll.options?.length || 0} Options available
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${poll.type === 'multiple'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            }`}
                        >
                          {poll.type === 'multiple' ? (
                            <>
                              <CheckSquare className="w-3.5 h-3.5" /> Multiple Select
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Single Select
                            </>
                          )}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <StatusBadge status={poll.status} />
                      </td>

                      {/* Total Votes */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold bg-surface-secondary text-text border border-border">
                          {poll.totalVotes || 0}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-3 text-xs text-text-secondary whitespace-nowrap">
                        {formatDateDisplay(poll.createdAt)}
                      </td>

                      {/* End Date */}
                      <td className="py-3.5 px-3 text-xs whitespace-nowrap">
                        {poll.endDate ? (
                          <span
                            className={
                              new Date() > new Date(poll.endDate)
                                ? 'text-rose-500 font-medium'
                                : 'text-text-secondary'
                            }
                          >
                            {formatDateDisplay(poll.endDate)}
                          </span>
                        ) : (
                          <span className="text-text-secondary/60">No expiry</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Results Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenResults(poll)}
                            className="p-2 text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl transition-all cursor-pointer"
                            title="View Poll Results"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Member-wise Responses Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenResponses(poll)}
                            className="p-2 text-purple-600 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl transition-all cursor-pointer"
                            title="View Member Responses"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>

                          {/* Close/Reopen Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(poll)}
                            className={`p-2 border rounded-xl transition-all cursor-pointer ${isClosed
                              ? 'text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20'
                              : 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20'
                              }`}
                            title={isClosed ? 'Reopen Poll' : 'Close Poll'}
                          >
                            {isClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit Poll */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(poll)}
                            className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all cursor-pointer"
                            title="Edit Poll"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Poll */}
                          <button
                            type="button"
                            onClick={() => handleDeletePoll(poll)}
                            className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all cursor-pointer"
                            title="Delete Poll"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ====================================================================== */
        /* WHATSAPP-STYLE LIVE MEMBER POLLS VIEW                                  */
        /* ====================================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {polls.map((poll) => {
            const pollId = poll.id || poll._id
            const isSingle = poll.type === 'single'
            const selected = votingSelections[pollId] || []
            const hasVoted = Boolean(poll.hasVoted)
            const isEditingVote = Boolean(isChangingVote[pollId])
            const showResultsView = hasVoted && !isEditingVote
            const isPollActive = poll.status === 'active'
            const isSubmitting = Boolean(votingLoading[pollId])

            return (
              <div
                key={pollId}
                className="bg-surface rounded-2xl border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Poll Card Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                        <Vote className="w-4 h-4" />
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                        {isSingle ? 'Single Select' : 'Multiple Select'}
                      </span>
                    </div>

                    <StatusBadge status={poll.status} />
                  </div>

                  {/* Question */}
                  <h3 className="text-base font-bold text-text leading-snug">
                    {poll.question}
                  </h3>

                  {/* Description */}
                  {poll.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {poll.description}
                    </p>
                  )}

                  <div className="text-[11px] text-text-secondary/70 mt-2 flex items-center gap-2">
                    <span>{isSingle ? 'Select one option' : 'Select one or more options'}</span>
                    <span>•</span>
                    <span>{poll.totalVotes || 0} votes</span>
                  </div>
                </div>

                {/* Poll Options (WhatsApp style) */}
                <div className="px-5 py-2 flex-1 space-y-2.5">
                  {poll.options?.map((option) => {
                    const optId = option.id || String(option._id)
                    const isSelected = selected.includes(optId)
                    const percentage = Number(option.percentage || 0)
                    const isUserChoice = (poll.userSelectedOptions || []).includes(optId)

                    if (showResultsView) {
                      /* ---------------------------------------------------- */
                      /* WhatsApp Result Progress Bar View                    */
                      /* ---------------------------------------------------- */
                      return (
                        <div
                          key={optId}
                          className={`relative rounded-xl border p-3 transition-all overflow-hidden ${isUserChoice
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : 'border-border/70 bg-surface-secondary/40'
                            }`}
                        >
                          {/* Animated Background Fill Bar */}
                          <div
                            className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ease-out opacity-20 ${isUserChoice ? 'bg-emerald-500' : 'bg-primary'
                              }`}
                            style={{ width: `${percentage}%` }}
                          />

                          <div className="relative z-10 flex items-center justify-between gap-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-2 font-medium text-text truncate">
                              {isUserChoice && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                              <span className="truncate">{option.text}</span>
                            </div>

                            <div className="shrink-0 flex items-center gap-2 font-bold">
                              <span className="text-text-secondary text-xs">
                                {option.votesCount || 0}
                              </span>
                              <span className="text-text">{percentage}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    /* ---------------------------------------------------- */
                    /* Interactive Voting Radio / Checkbox View             */
                    /* ---------------------------------------------------- */
                    return (
                      <button
                        key={optId}
                        type="button"
                        disabled={!isPollActive}
                        onClick={() => handleSelectOption(poll, optId)}
                        className={`w-full text-left rounded-xl border p-3 transition-all flex items-center gap-3 cursor-pointer ${isSelected
                          ? 'border-primary bg-primary/5 text-primary shadow-sm font-semibold'
                          : 'border-border bg-surface hover:bg-surface-secondary/70 text-text font-normal'
                          } ${!isPollActive ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {isSingle ? (
                          isSelected ? (
                            <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          ) : (
                            <Circle className="w-4.5 h-4.5 text-text-secondary/60 shrink-0" />
                          )
                        ) : isSelected ? (
                          <CheckSquare className="w-4.5 h-4.5 text-primary shrink-0" />
                        ) : (
                          <Square className="w-4.5 h-4.5 text-text-secondary/60 shrink-0" />
                        )}

                        <span className="text-xs sm:text-sm flex-1 leading-snug">
                          {option.text}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Card Footer Actions */}
                <div className="p-5 pt-3 border-t border-border/50 bg-surface-secondary/20 flex flex-col gap-2">
                  {showResultsView ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Voted</span>
                        {poll.userVoteDate && (
                          <span>({formatDateDisplay(poll.userVoteDate)})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Change Vote Button */}
                        {isPollActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartChangeVote(pollId)}
                            className="text-primary hover:text-primary"
                          >
                            Change Vote
                          </Button>
                        )}

                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenResponses(poll)}
                            icon={<Users className="w-3.5 h-3.5" />}
                          >
                            Responses
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {!isPollActive && (
                        <div className="text-xs text-rose-500 font-medium text-center">
                          Voting is closed for this poll.
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {isEditingVote && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelChangeVote(poll)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        )}

                        <Button
                          disabled={!isPollActive || selected.length === 0}
                          isLoading={isSubmitting}
                          onClick={() => handleSubmitVote(poll)}
                          className="flex-1"
                        >
                          {isEditingVote ? 'Update Vote' : 'Vote'}
                        </Button>
                      </div>

                      {poll.endDate && (
                        <div className="text-[11px] text-text-secondary/70 text-center flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Ends on {formatDateDisplay(poll.endDate)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ====================================================================== */}
      {/* 1. CREATE / EDIT POLL MODAL (ADMIN ONLY)                                */}
      {/* ====================================================================== */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={isEditing ? 'Edit Community Poll' : 'Create New Poll'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ------------------------------------------------------------------ */}
            {/* LEFT COLUMN: INTERACTIVE FORM BUILDER (7 Cols)                     */}
            {/* ------------------------------------------------------------------ */}
            <div className="lg:col-span-7 space-y-5">
              {/* Question */}
              <Input
                label="Poll Question"
                required={true}
                value={formData.question}
                onChange={(e) => {
                  setFormData({ ...formData, question: e.target.value })
                  if (formErrors.question) setFormErrors({ ...formErrors, question: undefined })
                }}
                placeholder="e.g. Which activity should we organize for the upcoming festival?"
                error={formErrors.question}
              />

              {/* Description */}
              <Input
                type="textarea"
                label="Description"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide background context or instructions for members..."
              />

              {/* Poll Type Selector */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  Poll Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'single' })}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${formData.type === 'single'
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-surface hover:bg-surface-secondary/60 text-text'
                      }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${formData.type === 'single' ? 'bg-primary text-white' : 'bg-surface-secondary text-text-secondary'
                      }`}>
                      <Circle className={`w-4 h-4 ${formData.type === 'single' ? 'fill-current' : ''}`} />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${formData.type === 'single' ? 'text-primary' : 'text-text'}`}>
                        Single Select
                      </div>
                      <div className="text-[11px] text-text-secondary leading-snug mt-0.5">
                        Radio buttons • 1 choice only
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'multiple' })}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${formData.type === 'multiple'
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-surface hover:bg-surface-secondary/60 text-text'
                      }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${formData.type === 'multiple' ? 'bg-primary text-white' : 'bg-surface-secondary text-text-secondary'
                      }`}>
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${formData.type === 'multiple' ? 'text-primary' : 'text-text'}`}>
                        Multiple Select
                      </div>
                      <div className="text-[11px] text-text-secondary leading-snug mt-0.5">
                        Checkboxes • Select one or more
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Options Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  {/* <label className="block text-sm font-semibold text-text-secondary mb-2 tracking-wider"> */}

                  <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
                    <span>Options List</span>
                  </label>
                  <span className="text-[11px] text-text-secondary">
                    {formData.options.length} options (Min 2)
                  </span>
                </div>

                {/* Quick Presets / Templates */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-surface-secondary/50 border border-border/80">
                  <span className="text-[11px] font-bold text-text-secondary flex items-center gap-1 mr-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Presets:</span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="py-1 px-2.5 text-[11px]"
                    onClick={() => {
                      setFormData({ ...formData, options: ['Yes', 'No'] })
                      setFormErrors({ ...formErrors, options: undefined })
                    }}
                  >
                    Yes / No
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="py-1 px-2.5 text-[11px]"
                    onClick={() => {
                      setFormData({ ...formData, options: ['Agree', 'Neutral', 'Disagree'] })
                      setFormErrors({ ...formErrors, options: undefined })
                    }}
                  >
                    Agree / Disagree
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="py-1 px-2.5 text-[11px]"
                    onClick={() => {
                      setFormData({ ...formData, options: ['Morning', 'Afternoon', 'Evening'] })
                      setFormErrors({ ...formErrors, options: undefined })
                    }}
                  >
                    Time of Day
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="py-1 px-2 text-[11px] text-text-secondary hover:text-rose-500 ml-auto"
                    title="Reset to 2 empty options"
                    onClick={() => {
                      setFormData({ ...formData, options: ['', ''] })
                      setFormErrors({ ...formErrors, options: undefined })
                    }}
                  >
                    Clear
                  </Button>
                </div>

                {/* Options Input List */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {formData.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                      <div className="w-6 h-6 rounded-lg bg-surface-secondary border border-border flex items-center justify-center text-[11px] font-bold text-text-secondary shrink-0">
                        {idx + 1}
                      </div>

                      <div className="relative flex-1">
                        <Input
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddOption()
                            }
                          }}
                          placeholder={`Option ${idx + 1}...`}
                        />
                      </div>

                      <button
                        type="button"
                        disabled={formData.options.length <= 2}
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 rounded-xl text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer shrink-0"
                        title="Remove Option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {formErrors.options && (
                  <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{formErrors.options}</span>
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddOption}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    className="text-primary hover:bg-primary/10"
                  >
                    Add Another Option
                  </Button>
                </div>
              </div>

              {/* Schedule & Timing (Using Common DatePicker) */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Common DatePicker for Start Date */}
                  <div>
                    <DatePicker
                      label="Start Date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={(val) => {
                        setFormData({ ...formData, startDate: val })
                        if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: undefined })
                      }}
                      placeholder="Start date (optional)"
                    />
                  </div>

                  {/* Common DatePicker for End Date */}
                  <div>
                    <DatePicker
                      label="End Date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={(val) => {
                        setFormData({ ...formData, endDate: val })
                        if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: undefined })
                      }}
                      placeholder="Expiry date (optional)"
                      error={formErrors.endDate}
                    />
                  </div>
                </div>
              </div>

              {/* Status (Using Common Select Component) */}
              <div className="">
                <Select
                  label="Poll Status"
                  name="status"
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val })}
                  options={[
                    { value: 'active', label: 'Active (Live & open for voting)' },
                    { value: 'draft', label: 'Draft (Admin only, not visible to members)' },
                    { value: 'closed', label: 'Closed (Archived, voting disabled)' }
                  ]}
                  searchable={false}
                />
              </div>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* RIGHT COLUMN: REAL-TIME WHATSAPP LIVE PREVIEW (5 Cols)             */}
            {/* ------------------------------------------------------------------ */}
            <div className="lg:col-span-5 sticky top-2 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  <span>Live WhatsApp Preview</span>
                </span>
              </div>

              {/* WhatsApp Simulated Phone/Card Frame */}
              <div className="p-4 rounded-2xl bg-surface border-2 border-border/80 shadow-md flex flex-col justify-between min-h-[360px] relative overflow-hidden">
                <div className="space-y-3">
                  {/* WhatsApp Poll Meta */}
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        <Vote className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-text leading-tight">
                          Poll by {user?.first_name || 'Admin'}
                        </div>
                        <div className="text-[10px] text-text-secondary">
                          {formData.type === 'multiple' ? 'Select one or more' : 'Select one'}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-primary/10 text-primary border border-primary/20">
                      {formData.status}
                    </span>
                  </div>

                  {/* Question */}
                  <div>
                    <h4 className="text-sm font-bold text-text leading-snug">
                      {formData.question.trim() || 'Enter your question on the left to preview here...'}
                    </h4>
                    {formData.description && (
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                        {formData.description}
                      </p>
                    )}
                  </div>

                  {/* Options Mockup */}
                  <div className="space-y-2 pt-1">
                    {formData.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/80 bg-surface-secondary/40 text-xs text-text"
                      >
                        {formData.type === 'multiple' ? (
                          <Square className="w-4 h-4 text-text-secondary shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-text-secondary shrink-0" />
                        )}
                        <span className="truncate font-medium">
                          {opt.trim() || `Option ${oIdx + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Footer */}
                <div className="pt-4 border-t border-border/60 mt-4 flex items-center justify-between text-[11px] text-text-secondary">
                  <span>{formData.options.filter((o) => o.trim()).length} options ready</span>
                  <span>{formData.endDate ? `Closes ${formatDateDisplay(formData.endDate)}` : 'No expiry'}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Form Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={(e) => {
                  setFormData((prev) => ({ ...prev, status: 'draft' }))
                  handleFormSubmit(e)
                }}
              >
                Save as Draft
              </Button>

              <Button
                type="submit"
                isLoading={formSaving}
              >
                {isEditing ? 'Save Changes' : 'Publish Poll'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ====================================================================== */}
      {/* 2. DETAILED POLL RESULTS MODAL                                         */}
      {/* ====================================================================== */}
      <Modal
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        title="Poll Results & Statistics"
        maxWidth="max-w-2xl"
      >
        {resultsLoading || !resultsData ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader size="md" />
            <p className="mt-2 text-xs text-text-secondary">Calculating results...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                {resultsData.type === 'multiple' ? 'Multiple Choice' : 'Single Choice'} •{' '}
                <span className="capitalize">{resultsData.status}</span>
              </div>
              <h3 className="text-lg font-bold text-text leading-snug">
                {resultsData.question}
              </h3>
              {resultsData.description && (
                <p className="text-xs text-text-secondary mt-1">{resultsData.description}</p>
              )}
            </div>

            {/* Participation KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-secondary border border-border text-center">
                <div className="text-xs font-semibold text-text-secondary">Total Members</div>
                <div className="text-xl font-bold text-text mt-1">{resultsData.totalMembers || 0}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="text-xs font-semibold text-emerald-600">Participated</div>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {resultsData.totalParticipants || 0}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-xs font-semibold text-amber-600">Not Participated</div>
                <div className="text-xl font-bold text-amber-600 mt-1">
                  {resultsData.totalNotParticipated || 0}
                </div>
              </div>
            </div>

            {/* Option-wise Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Option Votes Breakdown ({resultsData.totalVotes || 0} Total Votes)
              </h4>

              <div className="space-y-2.5">
                {resultsData.options?.map((opt) => {
                  const percentage = Number(opt.percentage || 0)
                  return (
                    <div
                      key={opt.id || opt._id}
                      className="p-3 rounded-xl border border-border bg-surface-secondary/40 relative overflow-hidden"
                    >
                      <div
                        className="absolute top-0 bottom-0 left-0 bg-primary/20 transition-all duration-700"
                        style={{ width: `${percentage}%` }}
                      />

                      <div className="relative z-10 flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-semibold text-text">{opt.text}</span>
                        <div className="flex items-center gap-2 font-bold">
                          <span className="text-text-secondary">{opt.votesCount || 0} votes</span>
                          <span className="text-primary font-black">{percentage}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-text-secondary">
                {resultsData.type === 'multiple'
                  ? '* Percentages indicate proportion of voting members choosing each option.'
                  : ''}
              </span>

              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsResultsModalOpen(false)
                    handleOpenResponses({ id: resultsData.pollId, question: resultsData.question })
                  }}
                  icon={<Users className="w-4 h-4" />}
                >
                  View Member-wise Responses
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ====================================================================== */}
      {/* 3. MEMBER-WISE RESPONSES DRAWER / MODAL (ADMIN ONLY)                   */}
      {/* ====================================================================== */}
      <Modal
        isOpen={isResponsesModalOpen}
        onClose={() => setIsResponsesModalOpen(false)}
        title="Member Voting Responses"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {/* Header Poll Context */}
          <div className="p-3.5 rounded-xl bg-surface-secondary border border-border">
            <div className="text-sm font-semibold text-primary mb-0.5">
              Poll Question
            </div>
            <div className="text-sm sm:text-base font-bold text-text">
              <span className="text-sm font-semibold text-primary mr-1">Que :</span> {selectedResponsePoll?.question}
            </div>
          </div>

          {/* Quick Metrics */}
          {responsesData?.data && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 rounded-xl bg-surface border border-border text-center">
                <div className="text-[11px] font-medium text-text-secondary">Total Members</div>
                <div className="text-base font-bold text-text">
                  {responsesData.data.totalMembers || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="text-[11px] font-semibold text-emerald-600">Participated</div>
                <div className="text-base font-bold text-emerald-600">
                  {responsesData.data.totalParticipants || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-[11px] font-semibold text-amber-600">Not Participated</div>
                <div className="text-base font-bold text-amber-600">
                  {responsesData.data.totalNotParticipated || 0}
                </div>
              </div>
            </div>
          )}

          {/* Filters & Search Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-secondary border border-border rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setResponseStatusTab('all')
                  setResponsePage(1)
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${responseStatusTab === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
                  }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setResponseStatusTab('participated')
                  setResponsePage(1)
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${responseStatusTab === 'participated'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
                  }`}
              >
                Participated
              </button>
              <button
                type="button"
                onClick={() => {
                  setResponseStatusTab('not_participated')
                  setResponsePage(1)
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${responseStatusTab === 'not_participated'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
                  }`}
              >
                Not Participated
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Option Filter Dropdown (visible only when searching participated / all) */}
              {responseStatusTab !== 'not_participated' && selectedResponsePoll?.options && (
                <select
                  value={responseOptionFilter}
                  onChange={(e) => {
                    setResponseOptionFilter(e.target.value)
                    setResponsePage(1)
                  }}
                  className="px-2.5 py-1.5 bg-surface border border-border rounded-xl text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Options</option>
                  {selectedResponsePoll.options.map((opt) => (
                    <option key={opt.id || opt._id} value={opt.id || opt._id}>
                      {opt.text}
                    </option>
                  ))}
                </select>
              )}

              {/* Search Member by Name */}
              <SearchInput
                value={responseSearch}
                onChange={(e) => {
                  setResponseSearch(e.target.value)
                  setResponsePage(1)
                }}
                placeholder="Search member..."
                wrapperClassName="relative min-w-[180px]"
              />
            </div>
          </div>

          {/* Member Responses Table */}
          {responsesLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader size="md" />
              <p className="mt-2 text-xs text-text-secondary">Loading member responses...</p>
            </div>
          ) : !responsesData?.data?.responses || responsesData.data.responses.length === 0 ? (
            <div className="py-10 text-center text-text-secondary text-xs sm:text-sm border border-dashed border-border rounded-xl">
              No member responses match the selected filters.
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-surface">
              <div className="overflow-x-auto max-h-[380px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-secondary border-b border-border z-10">
                    <tr className="text-xs font-bold text-text-secondary uppercase">
                      <th className="py-2.5 px-3">Member</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3">
                        {responseStatusTab === 'not_participated' ? 'Status' : 'Selected Option(s)'}
                      </th>
                      <th className="py-2.5 px-3 text-right">Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs sm:text-sm">
                    {responsesData.data.responses.map((item, idx) => {
                      const member = item.member || {}
                      const hasVoted = Boolean(item.participated)

                      return (
                        <tr key={idx} className="hover:bg-surface-secondary/40 transition-colors">
                          {/* Member Name & Avatar */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              {member.profileImage ? (
                                <img
                                  src={assetUrl(member.profileImage)}
                                  alt={member.name}
                                  className="w-8 h-8 rounded-full object-cover border border-border"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                  {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-text leading-tight">
                                  {member.name}
                                </div>
                                {member.member_id && (
                                  <div className="text-[11px] text-text-secondary">
                                    ID: {member.member_id}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-2.5 px-3 text-xs text-text-secondary whitespace-nowrap">
                            {member.number || '-'}
                          </td>

                          {/* Selected Options */}
                          <td className="py-2.5 px-3">
                            {hasVoted ? (
                              <div className="flex flex-wrap gap-1.5">
                                {item.selectedOptions?.map((opt, oIdx) => (
                                  <span
                                    key={oIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{opt.text}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                <UserX className="w-3 h-3" />
                                <span>Not Voted Yet</span>
                              </span>
                            )}
                          </td>

                          {/* Submitted Date */}
                          <td className="py-2.5 px-3 text-right text-xs text-text-secondary whitespace-nowrap">
                            {item.submittedAt ? formatDateTimeDisplay(item.submittedAt) : '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {responsesData.pagination && (
                <div className="p-3 border-t border-border bg-surface-secondary/30 flex items-center justify-between text-xs text-text-secondary">
                  <div>
                    Showing {(responsePage - 1) * 15 + 1} to{' '}
                    {Math.min(responsePage * 15, responsesData.pagination.total || 0)} of{' '}
                    {responsesData.pagination.total || 0} members
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={responsePage <= 1}
                      onClick={() => setResponsePage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="font-semibold text-text">
                      Page {responsePage} of {responsesData.pagination.totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={responsePage >= (responsesData.pagination.totalPages || 1)}
                      onClick={() => setResponsePage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
