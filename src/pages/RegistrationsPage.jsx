import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users,
  Eye,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  ExternalLink,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Layers,
  Check,
  X,
  MessageSquare,
  Sparkles,
  Info,
  ChevronDown,
  User,
  Heart,
  Baby,
  ShieldCheck,
  Building,
  CreditCard,
  FileCheck,
  ArrowRight,
  Clock,
  Home,
  Filter,
  UserPlus
} from 'lucide-react'
import api, { formatDate, assetUrl } from '../lib/api'
import { REGISTRATION_ENDPOINTS } from '../utils/endpoints'
import Table from '../components/common/Table'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import SearchInput from '../components/common/SearchInput'
import FilterPopover from '../components/common/FilterPopover'
import Modal from '../components/Modal'
import { toast } from '../lib/toast'
import useDebounce from '../hooks/useDebounce'
import ImagePreviewModal from '../components/common/ImagePreviewModal'
import { getRelationDisplay } from '../components/UserForm'

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 })
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [filters, setFilters] = useState({ status: '', step: '' })
  const [draftFilters, setDraftFilters] = useState({ status: '', step: '' })
  const [showFilters, setShowFilters] = useState(false)

  // View & Preview modals
  const [selectedReg, setSelectedReg] = useState(null)
  const [regDetails, setRegDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [activeTab, setActiveTab] = useState('personal') // 'personal' | 'family' | 'address' | 'occupation' | 'documents'

  // Action Modals
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const [correctionModalOpen, setCorrectionModalOpen] = useState(false)
  const [correctionRemarks, setCorrectionRemarks] = useState('')
  const [correctionFields, setCorrectionFields] = useState([])

  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1)
  const currentPage = Math.min(Math.max(Number(pagination.page) || page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const fetchRegistrations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(REGISTRATION_ENDPOINTS.GET_LIST, {
        params: {
          page,
          limit,
          search: debouncedSearch,
          status: filters.status,
          step: filters.step
        }
      })
      const payload = res?.data?.data || res?.data || {}
      const list = payload.registrations || (Array.isArray(payload) ? payload : [])
      setRegistrations(list)
      setPagination(payload.pagination || { page: 1, totalPages: 1, total: list.length, limit: 15 })
    } catch (err) {
      console.error('Failed to fetch registrations', err)
      toast.error('Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, filters])

  useEffect(() => {
    fetchRegistrations()
  }, [fetchRegistrations])

  const openViewModal = async (row) => {
    const rawUser = row || {}
    setSelectedReg(rawUser)
    setRegDetails({ user: rawUser, family_members: [] })
    setIsViewModalOpen(true)
    setActiveTab('personal')

    const targetId = rawUser._id || rawUser.id
    if (!targetId) return

    setDetailsLoading(true)
    try {
      const res = await api.get(REGISTRATION_ENDPOINTS.GET_DETAILS(targetId))
      const payload = res?.data?.data || res?.data || {}
      const targetUser = payload.user || payload.registration || payload
      const familyMembers = payload.family_members || payload.step2 || targetUser?.family_members || targetUser?.step2 || []

      if (targetUser) {
        setRegDetails({
          user: targetUser,
          family_members: Array.isArray(familyMembers) ? familyMembers : [],
          step1: payload.step1 || targetUser.step1 || [],
          step2: payload.step2 || targetUser.step2 || [],
          step3: payload.step3 || targetUser.step3 || [],
          step4: payload.step4 || targetUser.step4 || [],
          step5: payload.step5 || targetUser.step5 || []
        })
      } else {
        setRegDetails({ user: rawUser, family_members: [] })
      }
    } catch (err) {
      console.error('Failed to load full registration details', err)
      setRegDetails({ user: rawUser, family_members: [] })
    } finally {
      setDetailsLoading(false)
    }
  }

  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [approveTargetUser, setApproveTargetUser] = useState(null)

  const openApproveModal = (row) => {
    setApproveTargetUser(row)
    setApproveModalOpen(true)
  }

  const handleApprove = async () => {
    const targetId = approveTargetUser?._id || approveTargetUser?.id || selectedReg?._id || selectedReg?.id
    if (!targetId) return

    setActionLoading(true)
    try {
      await api.post(REGISTRATION_ENDPOINTS.APPROVE(targetId))
      toast.success('Registration Approved Successfully!')
      setApproveModalOpen(false)
      setIsViewModalOpen(false)
      fetchRegistrations()
    } catch (err) {
      console.error('Failed to approve registration', err)
      toast.error(err.response?.data?.message || 'Failed to approve registration')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter rejection reason')
      return
    }
    const targetId = selectedReg?._id || selectedReg?.id
    if (!targetId) return

    setActionLoading(true)
    try {
      await api.post(REGISTRATION_ENDPOINTS.REJECT(targetId), {
        reason: rejectReason
      })
      toast.success('Registration marked as Rejected')
      setRejectModalOpen(false)
      setIsViewModalOpen(false)
      setRejectReason('')
      fetchRegistrations()
    } catch (err) {
      console.error('Failed to reject registration', err)
      toast.error(err.response?.data?.message || 'Failed to reject registration')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestCorrection = async () => {
    if (!correctionRemarks.trim()) {
      toast.error('Please provide instructions on what the user needs to correct')
      return
    }
    const targetId = selectedReg?._id || selectedReg?.id
    if (!targetId) return

    setActionLoading(true)
    try {
      await api.post(REGISTRATION_ENDPOINTS.REQUEST_CORRECTION(targetId), {
        remarks: correctionRemarks,
        fields_to_correct: correctionFields
      })
      toast.success('Correction request sent to applicant!')
      setCorrectionModalOpen(false)
      setIsViewModalOpen(false)
      setCorrectionRemarks('')
      setCorrectionFields([])
      fetchRegistrations()
    } catch (err) {
      console.error('Failed to request correction', err)
      toast.error(err.response?.data?.message || 'Failed to request correction')
    } finally {
      setActionLoading(false)
    }
  }

  // Toggle is removed - no status toggle on registrations page anymore

  // Safe cleaner for hex MongoDB ObjectIds or raw strings in location
  const cleanLocationName = (val) => {
    if (!val) return ''
    const str = String(val).trim()
    if (/^[0-9a-fA-F]{24}$/.test(str)) {
      return ''
    }
    return str
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Rejected
          </span>
        )
      case 'needs_correction':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Correction Req.
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            In Progress
          </span>
        )
      case 'pending_review':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Pending Review
          </span>
        )
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Applicant Name',
      className: 'min-w-[240px]',
      render: (row) => {
        const photo = row.profile_image || row.image
        const fullName = `${row.first_name || ''} ${row.middle_name || ''} ${row.last_name || ''}`.trim() || 'Applicant'
        const initials = (row.first_name ? row.first_name[0] : (row.name ? row.name[0] : 'U')).toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <div
              onClick={(e) => {
                if (photo) {
                  e.stopPropagation()
                  setPreviewImage({ url: assetUrl(photo), title: fullName })
                }
              }}
              className={`w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0 overflow-hidden ${photo ? 'cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all' : ''}`}
              title={photo ? "Click to view photo" : ""}
            >
              {photo ? (
                <img src={assetUrl(photo)} alt="" className="w-full h-full object-cover block" />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="font-semibold text-text capitalize text-sm hover:text-primary transition-colors cursor-pointer" onClick={() => openViewModal(row)}>
                {fullName}
              </div>
              <div className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                <span>ID: <b className="text-text font-mono">{row.member_id || '-'}</b></span>
                {row.peta_jati && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20">
                    {row.peta_jati}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'contact',
      header: 'Contact Info',
      className: 'min-w-[180px]',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <div className="text-sm font-mono font-medium text-text flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-text-secondary opacity-70 shrink-0" />
            <span>{row.number || row.phone || '-'}</span>
          </div>
          <div className="text-xs text-text-secondary truncate max-w-[190px] flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-text-secondary opacity-70 shrink-0" />
            <span>{row.email || <span className="opacity-50 italic">No Email</span>}</span>
          </div>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location & Patti',
      className: 'min-w-[190px]',
      render: (row) => {
        const villageClean = cleanLocationName(row.village_name || row.village)
        const cityClean = cleanLocationName(row.city_name || row.city_id || row.city)
        const place = [villageClean, cityClean].filter(Boolean).join(' / ')
        const patti = cleanLocationName(row.patti_name || row.patti_para_pargana)

        return (
          <div className="flex flex-col gap-1 text-xs">
            {place ? (
              <div className="font-semibold text-text flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate max-w-[180px]">{place}</span>
              </div>
            ) : (
              <span className="text-text-secondary opacity-50 flex items-center gap-1"><MapPin className="w-3 h-3 opacity-40" /> Not Provided</span>
            )}
            {patti && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-secondary text-text-secondary border border-border w-fit truncate max-w-[180px]">
                {patti}
              </span>
            )}
          </div>
        )
      }
    },
    {
      key: 'step',
      header: 'Progress Step',
      className: 'min-w-[150px]',
      render: (row) => {
        const stepNum = row.registration_step || 1
        return (
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md text-[11px] inline-flex items-center gap-1">
                <Layers className="w-3 h-3" /> Step {stepNum} of 5
              </span>
            </div>
            <div className="text-[11px] text-text-secondary font-medium">
              {row.family_members_count > 0 ? (
                <span className="text-primary font-bold">+{row.family_members_count} family members</span>
              ) : (
                <span>Head of Family only</span>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'left',
      className: 'w-[120px]',
      render: (row) => {
        const stepsComplete = (row.current_step || row.registration_step || 1) >= 5
        const isApproved = row.is_approved || row.registration_status === 'approved'
        return (
          <div className="flex items-center justify-start gap-2">
            <button
              type="button"
              onClick={() => openViewModal(row)}
              className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all cursor-pointer"
              title="View Details (5 Steps)"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            {!isApproved && stepsComplete && (
              <button
                type="button"
                onClick={() => openApproveModal(row)}
                className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all cursor-pointer"
                title="Approve (All 5 Steps Complete)"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            {!isApproved && !stepsComplete && (
              <span
                className="p-2 text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] font-bold leading-none"
                title={`Step ${row.current_step || row.registration_step || 1} of 5 - Incomplete`}
              >
                {row.current_step || row.registration_step || 1}/5
              </span>
            )}
            {isApproved && (
              <span className="p-2 text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl" title="Approved">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        )
      }
    }
  ]

  const userObj = regDetails?.user || selectedReg || {}
  const familyList = regDetails?.family_members || []
  const docs = userObj.documents || {}

  const activeFiltersCount = (filters.status ? 1 : 0) + (filters.step ? 1 : 0)

  return (
    <div className="space-y-6 text-text">
      {/* Header bar matching other pages */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
            New Member Registrations
          </h1>
          <p className="text-sm font-medium text-text-secondary mt-1 tracking-tight">
            Review, verify and approve multi-step mobile registration requests
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchInput
            placeholder="Search registrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            wrapperClassName="relative w-full sm:w-[240px]"
          />

          <FilterPopover
            isOpen={showFilters}
            onToggle={() => {
              setDraftFilters(filters)
              setShowFilters(!showFilters)
            }}
            onClose={() => setShowFilters(false)}
            activeCount={activeFiltersCount}
            onClear={() => {
              setDraftFilters({ status: '', step: '' })
              setFilters({ status: '', step: '' })
              setPage(1)
              setShowFilters(false)
            }}
            onApply={() => {
              setFilters(draftFilters)
              setPage(1)
              setShowFilters(false)
            }}
          >
            <div className="space-y-4">
              <Select
                label="Application Status"
                value={draftFilters.status}
                onChange={(val) => setDraftFilters(c => ({ ...c, status: val }))}
                placeholder="All Statuses"
                searchable={false}
                options={[
                  { label: 'All Statuses', value: '' },
                  { label: 'Pending Review', value: 'pending_review' },
                  { label: 'Needs Correction', value: 'needs_correction' },
                  { label: 'In Progress', value: 'in_progress' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Rejected', value: 'rejected' }
                ]}
              />

              <Select
                label="Progress Step"
                value={draftFilters.step}
                onChange={(val) => setDraftFilters(c => ({ ...c, step: val }))}
                placeholder="All Steps"
                searchable={false}
                options={[
                  { label: 'All Steps', value: '' },
                  { label: 'Step 1 (Personal)', value: '1' },
                  { label: 'Step 2 (Family)', value: '2' },
                  { label: 'Step 3 (Address)', value: '3' },
                  { label: 'Step 4 (Occupation)', value: '4' },
                  { label: 'Step 5 (Documents)', value: '5' }
                ]}
              />
            </div>
          </FilterPopover>

          <Button
            variant="outline"
            onClick={fetchRegistrations}
            disabled={loading}
            className="h-10 text-xs font-bold"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={registrations}
        loading={loading}
        pagination={{
          currentPage: page,
          totalPages: pagination.totalPages || 1,
          total: pagination.total || 0,
          limit: limit,
          pageNumbers,
          onPageChange: setPage,
          onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1); }
        }}
      />

      {/* ========================================================================= */}
      {/* FULL REGISTRATION DETAILS MODAL (PREMIUM 5-STEP TABBED VIEW)             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Member Registration Application Details"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-5">
          {/* Top Applicant Header Banner */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-surface-secondary border border-border shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  onClick={() => {
                    const img = userObj.profile_image || userObj.image
                    if (img) setPreviewImage({ url: assetUrl(img), title: `${userObj.first_name} ${userObj.last_name}` })
                  }}
                  className="w-16 h-16 rounded-2xl bg-surface border-2 border-primary/20 overflow-hidden shrink-0 shadow-sm flex items-center justify-center font-bold text-xl text-primary cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                  title="Click to zoom photo"
                >
                  {userObj.profile_image || userObj.image ? (
                    <img src={assetUrl(userObj.profile_image || userObj.image)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (userObj.first_name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="text-lg font-black text-text capitalize">
                    {`${userObj.first_name || ''} ${userObj.middle_name || ''} ${userObj.last_name || ''}`.trim() || 'Applicant'}
                  </div>
                  <div className="text-xs text-text-secondary flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="flex items-center gap-1 font-mono font-medium text-text">
                      <Phone className="w-3.5 h-3.5 text-primary" /> {userObj.number || userObj.phone || '-'}
                    </span>
                    <span>• ID: <b className="font-mono text-text">{userObj.member_id || '-'}</b></span>
                    {userObj.peta_jati && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20 text-[10px]">
                        {userObj.peta_jati}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                {getStatusBadge(userObj.registration_status || (userObj.status === 1 ? 'approved' : 'pending_review'))}
                <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Step {userObj.registration_step || 1} of 5 Completed
                </span>
              </div>
            </div>
          </div>

          {/* If correction remarks or rejection reason exist */}
          {userObj.correction_remarks && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Correction Remarks (सुधार हेतु निर्देश):</div>
                <p className="mt-0.5 font-medium leading-relaxed">{userObj.correction_remarks}</p>
              </div>
            </div>
          )}

          {userObj.rejection_reason && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3 shadow-xs">
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Rejection Reason:</div>
                <p className="mt-0.5 font-medium leading-relaxed">{userObj.rejection_reason}</p>
              </div>
            </div>
          )}

          {/* Step Navigation Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-secondary/70 border border-border rounded-xl overflow-x-auto text-xs font-semibold">
            {[
              { key: 'personal', icon: User, label: '1. Personal Info' },
              { key: 'family', icon: Users, label: `2. Family (${familyList.length})` },
              { key: 'address', icon: Home, label: '3. Address' },
              { key: 'occupation', icon: Briefcase, label: '4. Occupation' },
              { key: 'documents', icon: FileCheck, label: '5. Documents' }
            ].map(t => {
              const Icon = t.icon
              const isActive = activeTab === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${isActive
                    ? 'bg-primary text-white shadow-xs font-bold'
                    : 'text-text-secondary hover:text-text hover:bg-surface'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* TAB 1: Personal Info */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Father / Husband Name</span>
                <p className="font-bold text-text text-sm">{userObj.father_husband_name || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Gender</span>
                <p className="font-bold text-text text-sm">{userObj.gender || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Date of Birth</span>
                <p className="font-bold text-text text-sm">{formatDate(userObj.dob) || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Blood Group</span>
                <p className="font-bold text-text text-sm text-rose-600 dark:text-rose-400">{userObj.blood_group || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Marital Status</span>
                <p className="font-bold text-text text-sm">{userObj.marital_status || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Patti / Para / Pargana</span>
                <p className="font-bold text-text text-sm">{cleanLocationName(userObj.patti_para_pargana) || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Sub Caste / Peta Jati</span>
                <p className="font-bold text-text text-sm">{userObj.peta_jati || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Email Address</span>
                <p className="font-bold text-text text-sm font-mono">{userObj.email || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Member Sequence ID</span>
                <p className="font-bold text-primary text-sm font-mono">{userObj.member_id || '-'}</p>
              </div>
            </div>
          )}

          {/* TAB 2: Family Details */}
          {activeTab === 'family' && (
            <div className="space-y-4">
              {familyList.length === 0 ? (
                <div className="p-10 text-center bg-surface-secondary/40 rounded-2xl border border-dashed border-border text-text-secondary text-xs space-y-2">
                  <Users className="w-8 h-8 mx-auto text-text-secondary/50" />
                  <p className="font-semibold text-text">No Additional Family Members Added</p>
                  <p className="text-[11px]">This application is registered for the primary Family Head only.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {familyList.map((m, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 text-primary font-black flex items-center justify-center text-sm shrink-0">
                        {m.first_name ? m.first_name[0] : idx + 1}
                      </div>
                      <div className="flex-1 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-text text-sm capitalize">
                            {`${m.first_name || ''} ${m.middle_name || ''} ${m.last_name || ''}`.trim()}
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold shrink-0">
                            {getRelationDisplay(m.relation) || m.relation || 'Member'}
                          </span>
                        </div>
                        <div className="text-text-secondary text-[11px] flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <span>Gender: <b className="text-text">{m.gender || '-'}</b></span>
                          {m.dob && <span>• DOB: <b className="text-text">{formatDate(m.dob)}</b></span>}
                          {m.blood_group && <span>• Blood: <b className="text-rose-600">{m.blood_group}</b></span>}
                        </div>
                        {m.number && (
                          <div className="text-text font-mono text-[11px] flex items-center gap-1.5 pt-0.5">
                            <Phone className="w-3 h-3 text-text-secondary" /> {m.number}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Address */}
          {activeTab === 'address' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs col-span-1 sm:col-span-2 md:col-span-3 space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Full Residential Address</span>
                <p className="font-bold text-text text-sm leading-relaxed">{userObj.address || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Village / Native Place</span>
                <p className="font-bold text-text text-sm">{cleanLocationName(userObj.village) || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Pincode</span>
                <p className="font-bold text-text text-sm font-mono">{userObj.pincode || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">City / Taluka</span>
                <p className="font-bold text-text text-sm">{cleanLocationName(userObj.city_id || userObj.city) || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">District</span>
                <p className="font-bold text-text text-sm">{cleanLocationName(userObj.district_id || userObj.district) || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">State</span>
                <p className="font-bold text-text text-sm">{cleanLocationName(userObj.state_id || userObj.state) || '-'}</p>
              </div>
            </div>
          )}

          {/* TAB 4: Occupation & Business */}
          {activeTab === 'occupation' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Occupation Type</span>
                <p className="font-bold text-text text-sm">{userObj.occupation || userObj.occupation_type || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Business / Company Name</span>
                <p className="font-bold text-text text-sm">{userObj.occupation_details?.business_name || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Business Category / Type</span>
                <p className="font-bold text-text text-sm">{userObj.occupation_details?.business_type || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Business Contact Phone</span>
                <p className="font-bold text-text text-sm font-mono">{userObj.occupation_details?.business_mobile || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Business Email</span>
                <p className="font-bold text-text text-sm font-mono">{userObj.occupation_details?.business_email || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">GST / Tax Number</span>
                <p className="font-bold text-text text-sm font-mono">{userObj.occupation_details?.gst_number || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs col-span-1 sm:col-span-2 space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Office / Business Address</span>
                <p className="font-bold text-text text-sm leading-relaxed">{userObj.occupation_details?.business_address || '-'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">Website URL</span>
                <p className="font-bold text-primary text-sm truncate">{userObj.occupation_details?.website || '-'}</p>
              </div>
            </div>
          )}

          {/* TAB 5: Uploaded Documents */}
          {activeTab === 'documents' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Aadhaar Card', url: docs.aadhaar_card, icon: CreditCard },
                { label: 'PAN Card', url: docs.pan_card, icon: ShieldCheck },
                { label: 'Voter ID', url: docs.voter_id, icon: FileCheck },
                { label: 'Driving License', url: docs.driving_license, icon: FileText },
                { label: 'Passport / Other Document', url: docs.passport, icon: Building }
              ].map((doc, idx) => {
                const hasDoc = Boolean(doc.url)
                const isUrl = hasDoc && (String(doc.url).startsWith('http') || String(doc.url).startsWith('/uploads') || String(doc.url).startsWith('blob:'))
                const isPdf = isUrl && String(doc.url).toLowerCase().endsWith('.pdf')
                const Icon = doc.icon

                return (
                  <div key={idx} className="p-4 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between gap-3.5 hover:border-primary/40 transition-all">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${hasDoc ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface-secondary text-text-secondary'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-text text-xs">{doc.label}</div>
                        <span className={`text-[11px] font-semibold mt-0.5 inline-flex items-center gap-1 ${hasDoc ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-secondary/60'}`}>
                          {hasDoc ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {hasDoc ? (isUrl ? (isPdf ? 'PDF Uploaded' : 'Image Uploaded') : 'Attached / Number') : 'Not Uploaded'}
                        </span>
                        {hasDoc && !isUrl && (
                          <p className="text-[11px] font-mono font-bold text-primary mt-1.5 truncate bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                            {doc.url}
                          </p>
                        )}
                      </div>
                    </div>

                    {hasDoc && isUrl ? (
                      <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                        {isPdf ? (
                          <a
                            href={assetUrl(doc.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View PDF Document
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: assetUrl(doc.url), title: doc.label })}
                            className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Preview Document
                          </button>
                        )}
                      </div>
                    ) : !hasDoc ? (
                      <div className="py-2 text-[11px] text-text-secondary/50 italic border-t border-border/40">
                        No document attached
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}

          {/* Bottom Sticky Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCorrectionModalOpen(true)}
                className="text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 border-amber-500/30 text-xs font-bold cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                Request Correction (गलत डेटा सुधारने हेतु)
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejectModalOpen(true)}
                className="text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 border-rose-500/30 text-xs font-bold cursor-pointer"
              >
                <X className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                Reject Application
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => openApproveModal(userObj)}
                disabled={actionLoading || userObj.registration_status === 'approved' || userObj.status === 1}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4 mr-1.5" />
                {userObj.registration_status === 'approved' || userObj.status === 1 ? 'Approved' : 'Approve Registration'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* APPROVE CONFIRMATION POPUP MODAL                                         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Member Registration"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-text">
              Confirm Member Approval?
            </h3>
            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
              Are you sure you want to approve <b className="text-text">{approveTargetUser?.first_name || approveTargetUser?.name || 'this member'}</b>? 
              This will activate their profile in the Directory and enable all member features for their family.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-secondary/70 border border-border text-left text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-text-secondary">Applicant:</span>
              <span className="font-bold text-text">{`${approveTargetUser?.first_name || ''} ${approveTargetUser?.last_name || ''}`.trim() || approveTargetUser?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Mobile:</span>
              <span className="font-mono font-bold text-text">{approveTargetUser?.number || approveTargetUser?.phone || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Progress:</span>
              <span className="font-bold text-primary">Step {approveTargetUser?.registration_step || 1} of 5 Completed</span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
              Yes, Approve Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* REJECT MODAL                                                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Member Application"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Please enter the reason for rejecting this application. The applicant will see this reason in their application status.
          </p>
          <Input
            label="Rejection Reason"
            placeholder="e.g. Incomplete details, invalid patti/samaj verification, duplicate application"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleReject}
              disabled={actionLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer font-bold"
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* REQUEST CORRECTION MODAL                                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        title="Request Correction from Member (गलत जानकारी सुधारने हेतु)"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Specify what details or documents the member submitted incorrectly so they can log in to their mobile app and re-submit the required steps.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text">Remarks / Instructions for User</label>
            <textarea
              rows={3}
              value={correctionRemarks}
              onChange={(e) => setCorrectionRemarks(e.target.value)}
              placeholder="e.g. Profile photo clear nahi hai, kripya sahi photo upload karein ya address aur pincode update karein."
              className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCorrectionModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleRequestCorrection}
              disabled={actionLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
            >
              Send Correction Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Zoom / Pan Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage.url}
          title={previewImage.title}
        />
      )}
    </div>
  )
}
