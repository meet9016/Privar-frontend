import React, { useCallback, useEffect, useState, useMemo } from 'react'
import {
  HeartHandshake,
  HeartPulse,
  AlertTriangle,
  IndianRupee,
  LifeBuoy,
  Phone,
  MapPin,
  Calendar,
  Building,
  User,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Upload,
  ShieldCheck,
  CreditCard,
  QrCode,
  Bell,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Send,
  Users,
  Check,
  History,
  X,
  FileDown
} from 'lucide-react'
import api, { assetUrl, formatDate } from '../lib/api'
import { APPEAL_ENDPOINTS, MEMBER_ENDPOINTS } from '../utils/endpoints'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import Table from '../components/common/Table'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import SearchInput from '../components/common/SearchInput'
import FilterPopover from '../components/common/FilterPopover'
import useDebounce from '../hooks/useDebounce'
import usePagination from '../hooks/usePagination'
import { toast } from '../lib/toast'
import usePermissions from '../hooks/usePermissions'

const HELP_TYPE_OPTIONS = [
  { label: 'All Categories', value: '' },
  { label: 'Medical', value: 'Medical' },
  { label: 'Financial', value: 'Financial' },
  { label: 'Emergency', value: 'Emergency' },
  { label: 'Other', value: 'Other' }
]

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Rejected', value: 'Rejected' }
]

const URGENCY_OPTIONS = [
  { label: 'Normal', value: 'Normal' },
  { label: 'Urgent', value: 'Urgent' },
  { label: 'Critical', value: 'Critical' }
]

const INITIAL_FORM = {
  title: '',
  help_type: 'Medical',
  urgency_level: 'Normal',
  contact_name: '',
  contact_phone: '',
  contact_city: '',
  required_amount: '',
  required_help: '',
  description: '',
  patient_name: '',
  hospital_name: '',
  bank_name: '',
  account_number: '',
  ifsc_code: '',
  upi_id: '',
  account_holder_name: ''
}

export default function AppealsAdminPage({ headerLeftContent }) {
  const permissions = usePermissions('appeals')
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, completed: 0 })

  // Filters & Pagination
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, resetPage } = usePagination(15)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [statusFilter, setStatusFilter] = useState('')
  const [helpTypeFilter, setHelpTypeFilter] = useState('')

  // Filter Popover Draft States
  const [showFilters, setShowFilters] = useState(false)
  const [draftStatusFilter, setDraftStatusFilter] = useState('')
  const [draftHelpTypeFilter, setDraftHelpTypeFilter] = useState('')

  // Modals
  const [detailsModalAppeal, setDetailsModalAppeal] = useState(null)
  const [statusModalAppeal, setStatusModalAppeal] = useState(null)
  const [notifyModalAppeal, setNotifyModalAppeal] = useState(null)
  const [historyModalAppeal, setHistoryModalAppeal] = useState(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingAppeal, setEditingAppeal] = useState(null)

  // Status Action Form
  const [newStatus, setNewStatus] = useState('Approved')
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)

  // Create / Edit Form State
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [appealImages, setAppealImages] = useState([])
  const [appealDocs, setAppealDocs] = useState([])
  const [qrCodeImage, setQrCodeImage] = useState(null)
  const [formSaving, setFormSaving] = useState(false)

  // Notification Modal Form
  const [targetType, setTargetType] = useState('all') // 'all' or 'specific'
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifInstructions, setNotifInstructions] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [memberOptions, setMemberOptions] = useState([])
  const [memberSearchTerm, setMemberSearchTerm] = useState('')
  const [membersLoading, setMembersLoading] = useState(false)
  const [sendingNotification, setSendingNotification] = useState(false)

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await api.get(APPEAL_ENDPOINTS.GET_STATS)
      if (res.data?.data) {
        setStats(res.data.data)
      }
    } catch (_) { }
  }

  // Fetch Appeals List
  const fetchAppeals = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit,
        search: debouncedSearch,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(helpTypeFilter ? { help_type: helpTypeFilter } : {})
      }

      const res = await api.get(APPEAL_ENDPOINTS.GET_APPEALS, { params })
      const list = res.data?.data || []
      setAppeals(Array.isArray(list) ? list : [])
      setPaginationData(res.data?.pagination)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch appeals')
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter, helpTypeFilter, setPaginationData])

  useEffect(() => {
    fetchAppeals()
    fetchStats()
  }, [fetchAppeals])

  // Fetch Members for Targeted Notification
  const fetchMembers = async () => {
    if (memberOptions.length > 0) return
    try {
      setMembersLoading(true)
      const res = await api.get(`${MEMBER_ENDPOINTS.GET_MEMBERS}?limit=2000`)
      const list = res.data?.data || []
      const formatted = list.map(m => ({
        id: String(m.id || m._id),
        name: `${m.first_name || ''} ${m.last_name || m.name || ''}`.trim() || 'Community Member',
        phone: m.number || m.mobile_number || '',
        city: m.city || m.village || '',
        member_id: m.member_id || ''
      })).filter(m => Boolean(m.id))
      setMemberOptions(formatted)
    } catch (err) {
      console.error('Failed to load members for notification:', err)
    } finally {
      setMembersLoading(false)
    }
  }

  // Filter Members in Modal
  const filteredMembers = useMemo(() => {
    if (!memberSearchTerm.trim()) return memberOptions
    const s = memberSearchTerm.toLowerCase()
    return memberOptions.filter(m =>
      m.name.toLowerCase().includes(s) ||
      m.phone.includes(s) ||
      m.city.toLowerCase().includes(s) ||
      String(m.member_id).includes(s)
    )
  }, [memberOptions, memberSearchTerm])

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingAppeal(null)
    setFormData(INITIAL_FORM)
    setAppealImages([])
    setAppealDocs([])
    setQrCodeImage(null)
    setIsFormModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (appeal) => {
    setEditingAppeal(appeal)
    setFormData({
      title: appeal.title || '',
      help_type: appeal.help_type || 'Medical',
      urgency_level: appeal.urgency_level || 'Normal',
      contact_name: appeal.contact_name || '',
      contact_phone: appeal.contact_phone || '',
      contact_city: appeal.contact_city || '',
      required_amount: appeal.required_amount || '',
      required_help: appeal.required_help || '',
      description: appeal.description || '',
      patient_name: appeal.patient_name || '',
      hospital_name: appeal.hospital_name || '',
      bank_name: appeal.bank_name || '',
      account_number: appeal.account_number || '',
      ifsc_code: appeal.ifsc_code || '',
      upi_id: appeal.upi_id || '',
      account_holder_name: appeal.account_holder_name || ''
    })
    setAppealImages([])
    setAppealDocs([])
    setQrCodeImage(null)
    setIsFormModalOpen(true)
  }

  // Submit Create / Edit Form
  const handleSaveAppeal = async (e) => {
    e.preventDefault()
    setFormSaving(true)
    try {
      const payload = new FormData()
      Object.entries(formData).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          payload.append(key, val)
        }
      })

      // Append files
      appealImages.forEach(file => payload.append('appeal_images', file))
      appealDocs.forEach(file => payload.append('documents', file))
      if (qrCodeImage) {
        payload.append('qr_code_image', qrCodeImage)
      }

      if (editingAppeal) {
        await api.put(APPEAL_ENDPOINTS.UPDATE_APPEAL(editingAppeal._id || editingAppeal.id), payload)
        toast.success('Appeal updated successfully')
      } else {
        await api.post(APPEAL_ENDPOINTS.CREATE_APPEAL, payload)
        toast.success('New appeal created successfully')
      }

      setIsFormModalOpen(false)
      fetchAppeals()
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save appeal')
    } finally {
      setFormSaving(false)
    }
  }

  // Open Status Modal
  const handleOpenStatusModal = (appeal) => {
    setStatusModalAppeal(appeal)
    setNewStatus(appeal.status === 'Pending' ? 'Approved' : appeal.status)
    setAdminNotes(appeal.admin_notes || '')
    setRejectionReason(appeal.rejection_reason || '')
  }

  // Submit Status Action
  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    if (!statusModalAppeal) return

    if (newStatus === 'Rejected' && !rejectionReason.trim()) {
      toast.error('Please specify a rejection reason')
      return
    }

    try {
      setStatusSaving(true)
      await api.put(APPEAL_ENDPOINTS.UPDATE_STATUS(statusModalAppeal._id), {
        status: newStatus,
        admin_notes: adminNotes,
        rejection_reason: rejectionReason
      })

      toast.success(`Appeal status updated to ${newStatus}`)
      setStatusModalAppeal(null)
      fetchAppeals()
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update appeal status')
    } finally {
      setStatusSaving(false)
    }
  }

  // Open Broadcast Push Notification Modal
  const handleOpenNotifyModal = (appeal) => {
    setNotifyModalAppeal(appeal)
    setTargetType('all')
    setSelectedUserIds([])
    setNotifTitle(`Emergency Appeal: ${appeal.title}`)
    setNotifMessage(appeal.description?.slice(0, 150) || 'Urgent community appeal requires your assistance.')
    setNotifInstructions(`Please assist directly or contact ${appeal.contact_name} at ${appeal.contact_phone}.`)
    fetchMembers()
  }

  // Send Broadcast Notification
  const handleSendNotification = async (e) => {
    e.preventDefault()
    if (!notifyModalAppeal) return

    if (targetType === 'specific' && selectedUserIds.length === 0) {
      toast.error('Please select at least one recipient member')
      return
    }

    try {
      setSendingNotification(true)
      await api.post(APPEAL_ENDPOINTS.SEND_NOTIFICATION(notifyModalAppeal._id), {
        target_type: targetType,
        target_user_ids: selectedUserIds,
        title: notifTitle,
        message: notifMessage,
        instructions: notifInstructions
      })

      toast.success('Push notification broadcasted successfully!')
      setNotifyModalAppeal(null)
      fetchAppeals()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to broadcast notification')
    } finally {
      setSendingNotification(false)
    }
  }

  // Delete Appeal
  const handleDelete = async (appeal) => {
    const ok = await confirm(`Are you sure you want to delete "${appeal.title}"?`)
    if (!ok) return

    try {
      await api.delete(APPEAL_ENDPOINTS.DELETE_APPEAL(appeal._id))
      toast.success('Appeal deleted successfully')
      fetchAppeals()
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting appeal')
    }
  }

  // Toggle Member Selection in Notification Modal
  const toggleMemberSelection = (id) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    )
  }

  // Select All Filtered Members
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredMembers.map(m => m.id)
    setSelectedUserIds(prev => Array.from(new Set([...prev, ...filteredIds])))
  }

  // Clear Selection
  const handleClearSelection = () => {
    setSelectedUserIds([])
  }

  // Render Status Badge
  const renderStatus = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Approved</span>
          </span>
        )
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending</span>
          </span>
        )
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
            <Check className="w-3.5 h-3.5 text-blue-600" />
            <span>Completed</span>
          </span>
        )
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold text-xs bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Rejected</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg border font-semibold text-xs bg-surface-secondary text-text-secondary border-border">
            <span>{status || '—'}</span>
          </span>
        )
    }
  }

  // Render Category Badge
  const renderType = (type) => {
    switch (type) {
      case 'Medical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold">
            <HeartPulse className="w-3 h-3 text-rose-500" /> Medical
          </span>
        )
      case 'Financial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold">
            <IndianRupee className="w-3 h-3 text-amber-600" /> Financial
          </span>
        )
      case 'Emergency':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-[11px] font-semibold">
            <AlertTriangle className="w-3 h-3 text-red-600" /> Emergency
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold">
            <LifeBuoy className="w-3 h-3 text-blue-600" /> Other
          </span>
        )
    }
  }

  // Table Columns Definition
  const columns = [
    {
      header: 'Appeal',
      key: 'title',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.images?.[0] ? (
            <img
              src={assetUrl(row.images[0])}
              alt={row.title}
              className="w-10 h-10 rounded-xl object-cover border border-border shrink-0 shadow-2xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center shrink-0 text-text-secondary">
              <HeartHandshake className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="space-y-1 max-w-[280px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              {renderType(row.help_type)}
            </div>
            <div className="font-semibold text-text text-sm truncate" title={row.title}>
              {row.title}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Applicant / Contact',
      key: 'contact_name',
      render: (row) => (
        <div className="flex flex-col gap-0.5 text-xs">
          <div className="font-semibold text-text flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-text-secondary shrink-0" />
            <span>{row.contact_name}</span>
          </div>
          <div className="text-text-secondary flex items-center gap-1.5 font-mono">
            <Phone className="w-3.5 h-3.5 text-text-secondary/70 shrink-0" />
            <a href={`tel:${row.contact_phone}`} className="hover:text-primary transition-colors">
              {row.contact_phone}
            </a>
          </div>
          {row.contact_city && (
            <div className="text-text-secondary/80 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-text-secondary/70 shrink-0" />
              <span className="truncate max-w-[150px]">{row.contact_city}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Target Amount',
      key: 'required_amount',
      render: (row) => (
        <div className="space-y-1">
          {Number(row.required_amount) > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success/10 border border-success/20 text-success font-semibold text-xs">
              <IndianRupee className="w-3.5 h-3.5" />
              {Number(row.required_amount).toLocaleString('en-IN')}
            </span>
          ) : (
            <span className="text-text-secondary text-xs">—</span>
          )}
          {Number(row.collected_amount) > 0 && (
            <div className="text-[10px] text-text-secondary font-medium">
              Raised: ₹{Number(row.collected_amount).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <div className="space-y-1">
          {renderStatus(row.status)}
        </div>
      )
    },
    {
      header: 'Submitted On',
      key: 'createdAt',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Calendar className="w-3.5 h-3.5 text-text-secondary/70 shrink-0" />
          <span>{formatDate(row.createdAt)}</span>
        </div>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'left',
      render: (row) => (
        <div className="flex items-center justify-start gap-2">
          {/* View Details */}
          <button
            onClick={() => setDetailsModalAppeal(row)}
            className="p-2 text-text hover:text-black bg-white hover:bg-surface-secondary border border-border rounded-xl transition-all cursor-pointer shadow-xs"
            title="View Appeal Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Review / Status */}
          {!permissions.canEdit && !permissions.isSuperAdmin ? null : (
            <button
              onClick={() => handleOpenStatusModal(row)}
              className="p-2 text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Review & Update Status"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Broadcast Push Notification */}
          {row.status === 'Approved' && (
            <button
              onClick={() => handleOpenNotifyModal(row)}
              className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all cursor-pointer shadow-xs relative"
              title="Broadcast Push Notification to Community"
            >
              <Bell className="w-3.5 h-3.5" />
              {row.notification_count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                  {row.notification_count}
                </span>
              )}
            </button>
          )}

          {/* Notification History */}
          {row.notification_count > 0 && (
            <button
              onClick={() => setHistoryModalAppeal(row)}
              className="p-2 text-purple-600 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl transition-all cursor-pointer shadow-xs"
              title="View Broadcast History"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Edit */}
          {!permissions.canEdit && !permissions.isSuperAdmin ? null : (
            <button
              onClick={() => handleOpenEditModal(row)}
              className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Edit Appeal"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete */}
          {!permissions.canDelete && !permissions.isSuperAdmin ? null : (
            <button
              onClick={() => handleDelete(row)}
              className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all cursor-pointer shadow-xs"
              title="Delete Appeal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-slide-up text-text font-sans">
      {/* Top Header & Search/Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 overflow-x-auto hide-scrollbar">
          {headerLeftContent ? (
            headerLeftContent
          ) : (
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-text">Help Appeals</h2>
              <p className="text-sm text-text-secondary mt-1">
                Manage community medical, financial, and emergency assistance requests
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchInput
            placeholder="Search appeals..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            onClear={() => { setSearch(''); resetPage(); }}
          />

          <FilterPopover
            isOpen={showFilters}
            onToggle={() => {
              setDraftStatusFilter(statusFilter)
              setDraftHelpTypeFilter(helpTypeFilter)
              setShowFilters(!showFilters)
            }}
            onClose={() => setShowFilters(false)}
            activeCount={(statusFilter ? 1 : 0) + (helpTypeFilter ? 1 : 0)}
            onClear={() => {
              setDraftStatusFilter('')
              setDraftHelpTypeFilter('')
              setStatusFilter('')
              setHelpTypeFilter('')
              resetPage()
              setShowFilters(false)
            }}
            onApply={() => {
              setStatusFilter(draftStatusFilter)
              setHelpTypeFilter(draftHelpTypeFilter)
              resetPage()
              setShowFilters(false)
            }}
          >
            <Select
              label="Help Category"
              value={draftHelpTypeFilter}
              onChange={(val) => setDraftHelpTypeFilter(val)}
              placeholder="All Categories"
              searchable={false}
              options={HELP_TYPE_OPTIONS}
            />
            <Select
              label="Review Status"
              value={draftStatusFilter}
              onChange={(val) => setDraftStatusFilter(val)}
              placeholder="All Status"
              searchable={false}
              options={STATUS_OPTIONS}
            />
          </FilterPopover>

          <Button
            onClick={() => { fetchAppeals(); fetchStats(); }}
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            className="h-10"
            title="Refresh List"
          />

          {!permissions.canAdd && !permissions.isSuperAdmin ? null : (
            <Button
              onClick={handleOpenCreateModal}
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              className="h-10"
            >
              Add Appeal
            </Button>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div
          onClick={() => { setStatusFilter(''); resetPage(); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-xs ${!statusFilter ? 'bg-primary/5 border-primary ring-1 ring-primary/20' : 'bg-surface border-border hover:border-primary/40'}`}
        >
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">Total Appeals</span>
          <span className="text-xl font-bold text-text mt-0.5 block">{stats.total}</span>
        </div>

        <div
          onClick={() => { setStatusFilter('Pending'); resetPage(); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-xs ${statusFilter === 'Pending' ? 'bg-amber-100/60 border-amber-400 ring-1 ring-amber-400' : 'bg-amber-50/50 border-amber-200/70 hover:border-amber-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Pending Review</span>
            {stats.pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </div>
          <span className="text-xl font-bold text-amber-950 mt-0.5 block">{stats.pending}</span>
        </div>

        <div
          onClick={() => { setStatusFilter('Approved'); resetPage(); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-xs ${statusFilter === 'Approved' ? 'bg-emerald-100/60 border-emerald-400 ring-1 ring-emerald-400' : 'bg-emerald-50/50 border-emerald-200/70 hover:border-emerald-300'}`}
        >
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Approved / Active</span>
          <span className="text-xl font-bold text-emerald-950 mt-0.5 block">{stats.approved}</span>
        </div>

        <div
          onClick={() => { setStatusFilter('Completed'); resetPage(); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-xs ${statusFilter === 'Completed' ? 'bg-blue-100/60 border-blue-400 ring-1 ring-blue-400' : 'bg-blue-50/50 border-blue-200/70 hover:border-blue-300'}`}
        >
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Completed</span>
          <span className="text-xl font-bold text-blue-950 mt-0.5 block">{stats.completed}</span>
        </div>

        <div
          onClick={() => { setStatusFilter('Rejected'); resetPage(); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-xs ${statusFilter === 'Rejected' ? 'bg-rose-100/60 border-rose-400 ring-1 ring-rose-400' : 'bg-rose-50/50 border-rose-200/70 hover:border-rose-300'}`}
        >
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Rejected</span>
          <span className="text-xl font-bold text-rose-950 mt-0.5 block">{stats.rejected}</span>
        </div>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={appeals}
        keyField="_id"
        loading={loading}
        emptyState={{
          icon: HeartHandshake,
          title: 'No appeals found',
          description: 'There are no help requests registered under this search or filter criteria',
          actionLabel: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : 'Add Appeal',
          onAction: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : handleOpenCreateModal
        }}
        pagination={{
          currentPage: page,
          totalPages,
          total,
          limit,
          loading,
          onPageChange: setPage,
          onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1); }
        }}
      />

      {/* ======================= MODAL 1: VIEW FULL DETAILS ======================= */}
      {detailsModalAppeal && (
        <Modal
          isOpen={Boolean(detailsModalAppeal)}
          onClose={() => setDetailsModalAppeal(null)}
          title="Appeal Details"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-3.5 text-xs text-text">
            {/* Header: Title, Category Badge, Status Badge & Date */}
            <div className="p-3 rounded-xl bg-surface-secondary/40 border border-border space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-bold text-text leading-snug">
                  {detailsModalAppeal.title}
                </h3>
                <span className="text-[11px] text-text-secondary whitespace-nowrap shrink-0">
                  {formatDate(detailsModalAppeal.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {renderType(detailsModalAppeal.help_type)}
                {renderStatus(detailsModalAppeal.status)}
                {detailsModalAppeal.urgency_level && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md border border-border bg-surface text-text-secondary font-medium">
                    {detailsModalAppeal.urgency_level} Urgency
                  </span>
                )}
              </div>
            </div>

            {/* Assistance Needed & Financial Details */}
            <div className="p-3 rounded-xl bg-surface-secondary/40 border border-border space-y-2">
              <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-text-secondary" />
                Assistance & Financials
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-text-secondary block">Assistance Needed</span>
                  <span className="font-medium text-text">{detailsModalAppeal.required_help || '—'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-text-secondary block">Target Amount</span>
                  <span className="font-semibold text-text">
                    {Number(detailsModalAppeal.required_amount) > 0 ? `₹${Number(detailsModalAppeal.required_amount).toLocaleString('en-IN')}` : '—'}
                  </span>
                </div>
                {detailsModalAppeal.collected_amount > 0 && (
                  <div>
                    <span className="text-[11px] text-text-secondary block">Collected Amount</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{Number(detailsModalAppeal.collected_amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact & Beneficiary Info */}
            <div className="p-3 rounded-xl bg-surface-secondary/40 border border-border space-y-2">
              <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-text-secondary" />
                Contact & Beneficiary Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[11px] text-text-secondary block">Contact Person</span>
                  <span className="font-medium text-text">
                    {detailsModalAppeal.contact_name || '—'} {detailsModalAppeal.contact_phone ? `(${detailsModalAppeal.contact_phone})` : ''}
                  </span>
                </div>
                {detailsModalAppeal.contact_alt_phone && (
                  <div>
                    <span className="text-[11px] text-text-secondary block">Alternate Phone</span>
                    <span className="font-medium text-text">{detailsModalAppeal.contact_alt_phone}</span>
                  </div>
                )}
                {(detailsModalAppeal.contact_city || detailsModalAppeal.contact_address) && (
                  <div>
                    <span className="text-[11px] text-text-secondary block">City / Address</span>
                    <span className="font-medium text-text">
                      {[detailsModalAppeal.contact_city, detailsModalAppeal.contact_address].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                {detailsModalAppeal.patient_name && (
                  <div>
                    <span className="text-[11px] text-text-secondary block">Patient Name</span>
                    <span className="font-medium text-text">{detailsModalAppeal.patient_name}</span>
                  </div>
                )}
                {detailsModalAppeal.hospital_name && (
                  <div>
                    <span className="text-[11px] text-text-secondary block">Hospital</span>
                    <span className="font-medium text-text">{detailsModalAppeal.hospital_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Description */}
            {detailsModalAppeal.description && (
              <div className="p-3 rounded-xl bg-surface-secondary/40 border border-border space-y-1.5">
                <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-text-secondary" />
                  Detailed Description
                </span>
                <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">
                  {detailsModalAppeal.description}
                </p>
              </div>
            )}

            {/* Bank & UPI Details */}
            {(detailsModalAppeal.bank_name || detailsModalAppeal.account_number || detailsModalAppeal.upi_id) && (
              <div className="p-3 rounded-xl bg-surface-secondary/40 border border-border space-y-2">
                <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-text-secondary" />
                  Bank & UPI Transfer Details
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {detailsModalAppeal.bank_name && (
                    <div>
                      <span className="text-[11px] text-text-secondary block">Bank</span>
                      <span className="font-medium text-text">{detailsModalAppeal.bank_name}</span>
                    </div>
                  )}
                  {detailsModalAppeal.account_holder_name && (
                    <div>
                      <span className="text-[11px] text-text-secondary block">Account Holder</span>
                      <span className="font-medium text-text">{detailsModalAppeal.account_holder_name}</span>
                    </div>
                  )}
                  {detailsModalAppeal.account_number && (
                    <div>
                      <span className="text-[11px] text-text-secondary block">Account No</span>
                      <span className="font-mono text-text">{detailsModalAppeal.account_number}</span>
                    </div>
                  )}
                  {detailsModalAppeal.ifsc_code && (
                    <div>
                      <span className="text-[11px] text-text-secondary block">IFSC Code</span>
                      <span className="font-mono text-text">{detailsModalAppeal.ifsc_code}</span>
                    </div>
                  )}
                  {detailsModalAppeal.upi_id && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[11px] text-text-secondary block">UPI ID</span>
                      <span className="font-mono text-primary font-medium">{detailsModalAppeal.upi_id}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Images */}
            {detailsModalAppeal.images && detailsModalAppeal.images.length > 0 && (
              <div className="p-3 rounded-xl bg-surface-secondary/40 border border-border space-y-2">
                <span className="text-xs font-semibold text-text block">
                  Attached Photos ({detailsModalAppeal.images.length})
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {detailsModalAppeal.images.map((img, i) => (
                    <a
                      key={i}
                      href={assetUrl(img)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group rounded-lg overflow-hidden border border-border hover:opacity-85 transition-opacity"
                    >
                      <img src={assetUrl(img)} alt="appeal" className="w-16 h-16 object-cover group-hover:scale-105 transition-transform" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {detailsModalAppeal.documents && detailsModalAppeal.documents.length > 0 && (
              <div className="p-3 rounded-xl bg-surface-secondary/40 border border-border space-y-2">
                <span className="text-xs font-semibold text-text block">Attached Documents</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {detailsModalAppeal.documents.map((doc, i) => {
                    const docUrl = typeof doc === 'string' ? doc : doc?.url
                    const docName = typeof doc === 'string' ? (doc.split('/').pop() || 'Document') : (doc?.name || 'Document')
                    if (!docUrl) return null
                    return (
                      <a
                        key={i}
                        href={assetUrl(docUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-surface border border-border rounded-lg text-text hover:text-primary transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-text-secondary" />
                        <span className="max-w-[150px] truncate">{docName}</span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Admin Audit Trail / Remarks */}
            {(detailsModalAppeal.approved_by?.name || detailsModalAppeal.admin_notes || detailsModalAppeal.rejection_reason) && (
              <div className="p-2.5 rounded-lg bg-surface-secondary/50 border border-border space-y-1">
                {detailsModalAppeal.approved_by?.name && (
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Approved by: <strong className="text-text">{detailsModalAppeal.approved_by.name}</strong></span>
                    {detailsModalAppeal.approved_at && <span>{formatDate(detailsModalAppeal.approved_at)}</span>}
                  </div>
                )}
                {detailsModalAppeal.admin_notes && (
                  <p className="text-text">
                    <span className="text-text-secondary">Admin Remarks: </span>
                    {detailsModalAppeal.admin_notes}
                  </p>
                )}
                {detailsModalAppeal.rejection_reason && (
                  <p className="text-rose-600 dark:text-rose-400">
                    <span className="font-semibold">Rejection Reason: </span>
                    {detailsModalAppeal.rejection_reason}
                  </p>
                )}
              </div>
            )}

            {/* Footer Action */}
            <div className="pt-2 border-t border-border flex items-center justify-end">
              <Button variant="outline" size="sm" onClick={() => setDetailsModalAppeal(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================= MODAL 2: STATUS / REVIEW ======================= */}
      {statusModalAppeal && (
        <Modal
          isOpen={Boolean(statusModalAppeal)}
          onClose={() => setStatusModalAppeal(null)}
          title={`Review Appeal: ${statusModalAppeal.title}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4 text-text">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-text">Select Status</label>
              <div className="grid grid-cols-3 gap-2">
                {['Approved', 'Rejected', 'Completed'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${newStatus === st
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                      : 'border-border bg-input-bg text-text-secondary hover:bg-surface-secondary'
                      }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {newStatus === 'Rejected' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-text">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter rejection reason for the applicant..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-text">Admin Internal Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="Internal verification notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button variant="outline" type="button" onClick={() => setStatusModalAppeal(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={statusSaving}>
                {statusSaving ? 'Updating...' : `Mark as ${newStatus}`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================= MODAL 3: BROADCAST PUSH NOTIFICATION ======================= */}
      {notifyModalAppeal && (
        <Modal
          isOpen={Boolean(notifyModalAppeal)}
          onClose={() => setNotifyModalAppeal(null)}
          title={`Broadcast Push Notification: ${notifyModalAppeal.title}`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSendNotification} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 text-text">
            {/* Target Selection Switch */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text uppercase tracking-wider">
                Select Recipients
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetType('all')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${targetType === 'all'
                    ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/20'
                    : 'border-border bg-input-bg text-text-secondary hover:border-primary/40'
                    }`}
                >
                  <Users className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">All Members</div>
                    <div className="text-[10px] opacity-80">Broadcast to all active members</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('specific')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${targetType === 'specific'
                    ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/20'
                    : 'border-border bg-input-bg text-text-secondary hover:border-primary/40'
                    }`}
                >
                  <User className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Specific Members</div>
                    <div className="text-[10px] opacity-80">({selectedUserIds.length} selected)</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Member Selection Box if 'specific' */}
            {targetType === 'specific' && (
              <div className="p-3.5 rounded-xl bg-surface-secondary/40 border border-border space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs font-bold text-text">
                    Select Members ({selectedUserIds.length} selected)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Select All Filtered ({filteredMembers.length})
                    </button>
                    <span className="text-border">|</span>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, city..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                {/* Member Checkbox List */}
                <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-border/40 pr-1">
                  {membersLoading ? (
                    <div className="py-6 text-center text-xs text-text-secondary">Loading members...</div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-text-secondary">No members found</div>
                  ) : (
                    filteredMembers.map(m => {
                      const isChecked = selectedUserIds.includes(m.id)
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${isChecked ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-surface-secondary text-text'}`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleMemberSelection(m.id)}
                              className="rounded border-border text-primary focus:ring-primary/20"
                            />
                            <div className="truncate">
                              <span className="truncate block font-semibold">{m.name}</span>
                              <span className="text-[10px] text-text-secondary block">
                                {m.phone} {m.city ? `• ${m.city}` : ''}
                              </span>
                            </div>
                          </div>
                          {isChecked && <Check className="w-4 h-4 text-primary shrink-0" />}
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* Notification Title */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-text">Notification Title <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Emergency Appeal: ..."
                className="w-full px-3.5 py-2.5 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Notification Message */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-text">Notification Message <span className="text-rose-500">*</span></label>
              <textarea
                rows={3}
                required
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                placeholder="Enter concise push notification text..."
                className="w-full px-3.5 py-2.5 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Additional Guidance / Instructions */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-text">Additional Guidance (Optional)</label>
              <input
                type="text"
                value={notifInstructions}
                onChange={(e) => setNotifInstructions(e.target.value)}
                placeholder="e.g. Please donate directly to the family or hospital."
                className="w-full px-3.5 py-2 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button variant="outline" type="button" onClick={() => setNotifyModalAppeal(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendingNotification}
                icon={<Send className="w-4 h-4" />}
              >
                {sendingNotification ? 'Broadcasting...' : `Broadcast Push Notification`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================= MODAL 4: NOTIFICATION HISTORY ======================= */}
      {historyModalAppeal && (
        <Modal
          isOpen={Boolean(historyModalAppeal)}
          onClose={() => setHistoryModalAppeal(null)}
          title={`Broadcast History: ${historyModalAppeal.title}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-3 max-h-[70vh] overflow-y-auto px-1 text-text">
            {!historyModalAppeal.notifications_sent || historyModalAppeal.notifications_sent.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-secondary">
                No notifications broadcasted yet for this appeal.
              </div>
            ) : (
              historyModalAppeal.notifications_sent.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surface-secondary border border-border space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-primary" />
                      <span>{item.title}</span>
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      {formatDate(item.sent_at)}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">{item.message}</p>

                  {item.instructions && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg font-medium">
                      Note: {item.instructions}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-text-secondary/80 pt-1 border-t border-border/50">
                    <span>Target: <strong>{item.target_type === 'all' ? 'All Members' : 'Specific Members'}</strong></span>
                    {item.sent_by?.name && <span>Sent By: <strong>{item.sent_by.name}</strong></span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* ======================= MODAL 5: ADD / EDIT APPEAL ======================= */}
      {isFormModalOpen && (
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={editingAppeal ? `Edit Appeal: ${editingAppeal.title}` : 'Add New Community Appeal'}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSaveAppeal} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 text-text">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Appeal Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Urgent Medical Assistance for Heart Surgery"
                  className="w-full px-3 py-2 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <Select
                  label="Category / Help Type"
                  value={formData.help_type}
                  onChange={(val) => setFormData({ ...formData, help_type: val })}
                  options={HELP_TYPE_OPTIONS.filter(o => o.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Select
                  label="Urgency Level"
                  value={formData.urgency_level}
                  onChange={(val) => setFormData({ ...formData, urgency_level: val })}
                  options={URGENCY_OPTIONS}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Target Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.required_amount}
                  onChange={(e) => setFormData({ ...formData, required_amount: e.target.value })}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  City / Village
                </label>
                <input
                  type="text"
                  value={formData.contact_city}
                  onChange={(e) => setFormData({ ...formData, contact_city: e.target.value })}
                  placeholder="e.g. Surat, Radhanpur"
                  className="w-full px-3 py-2 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Contact Person Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Full name of applicant or contact person"
                  className="w-full px-3 py-2 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Contact Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {formData.help_type === 'Medical' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-rose-50/40 border border-rose-100 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-rose-950 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    placeholder="Patient full name"
                    className="w-full px-3 py-2 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-950 mb-1">Hospital Name</label>
                  <input
                    type="text"
                    value={formData.hospital_name}
                    onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                    placeholder="Hospital / Clinic name & city"
                    className="w-full px-3 py-2 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-text mb-1">
                Specific Assistance Needed <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.required_help}
                onChange={(e) => setFormData({ ...formData, required_help: e.target.value })}
                placeholder="e.g. ICU treatment expenses, medicine bills, or emergency fund"
                className="w-full px-3 py-2 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text mb-1">
                Detailed Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain the circumstance, background, and reason for the appeal..."
                className="w-full px-3 py-2 text-xs bg-input-bg text-text border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Bank / UPI Section */}
            <div className="p-3 bg-surface-secondary border border-border rounded-xl space-y-2">
              <span className="text-xs font-bold text-text block uppercase tracking-wider">
                Bank & UPI Details (For Direct Community Donations)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-text-secondary mb-0.5">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="e.g. State Bank of India"
                    className="w-full px-2.5 py-1.5 text-xs bg-input-bg text-text border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-secondary mb-0.5">Account Holder Name</label>
                  <input
                    type="text"
                    value={formData.account_holder_name}
                    onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                    placeholder="A/c Holder Name"
                    className="w-full px-2.5 py-1.5 text-xs bg-input-bg text-text border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-secondary mb-0.5">Account Number</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="Account Number"
                    className="w-full px-2.5 py-1.5 text-xs bg-input-bg text-text border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-secondary mb-0.5">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                    placeholder="IFSC Code"
                    className="w-full px-2.5 py-1.5 text-xs bg-input-bg text-text border border-border rounded-lg uppercase"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-text-secondary mb-0.5">UPI ID</label>
                  <input
                    type="text"
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                    placeholder="e.g. name@okhdfcbank"
                    className="w-full px-2.5 py-1.5 text-xs bg-input-bg text-text border border-border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Upload Photos (Multiple)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setAppealImages(Array.from(e.target.files || []))}
                  className="w-full text-xs text-text file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  QR Code Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setQrCodeImage(e.target.files?.[0] || null)}
                  className="w-full text-xs text-text file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button variant="outline" type="button" onClick={() => setIsFormModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formSaving}>
                {formSaving ? 'Saving...' : editingAppeal ? 'Update Appeal' : 'Create Appeal'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
