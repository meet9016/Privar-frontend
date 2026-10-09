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

      const mappedList = list.map(r => {
        const s1 = (r.step1 && r.step1[0]) || {}
        const s2 = r.step2 || []
        const s3 = (r.step3 && r.step3[0]) || {}
        const s4 = (r.step4 && r.step4[0]) || {}
        const s5 = (r.step5 && r.step5[0]) || {}

        let cStep = 1
        if (s5 && Object.keys(s5).length > 0) cStep = 5
        else if (s4 && Object.keys(s4).length > 0) cStep = 4
        else if (s3 && Object.keys(s3).length > 0) cStep = 3
        else if (s2 && s2.length > 0) cStep = 2
        else if (s1 && Object.keys(s1).length > 0) cStep = 1

        return {
          ...r,
          ...s1,
          ...s3,
          ...s4,
          documents: s5,
          occupation_details: s4,
          family_members_count: s2.length,
          family_members: s2,
          current_step: r.current_step || cStep,
          registration_step: r.registration_step || cStep,
          status: r.status || 'in_progress',
          is_approved: r.is_approved || false
        }
      })

      setRegistrations(mappedList)
      setPagination(payload.pagination || { page: 1, totalPages: 1, total: mappedList.length, limit: 15 })
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
        const targetS1 = (targetUser.step1 && targetUser.step1[0]) || {}
        const targetS2 = Array.isArray(familyMembers) ? familyMembers : []
        const targetS3 = (targetUser.step3 && targetUser.step3[0]) || {}
        const targetS4 = (targetUser.step4 && targetUser.step4[0]) || {}
        const targetS5 = (targetUser.step5 && targetUser.step5[0]) || {}

        const mappedTargetUser = {
          ...targetUser,
          ...targetS1,
          ...targetS3,
          ...targetS4,
          documents: targetS5,
          occupation_details: targetS4,
          family_members_count: targetS2.length,
          family_members: targetS2
        }

        setRegDetails({
          user: mappedTargetUser,
          family_members: targetS2,
          step1: targetUser.step1 || [],
          step2: targetS2,
          step3: targetUser.step3 || [],
          step4: targetUser.step4 || [],
          step5: targetUser.step5 || []
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
      await api.post(REGISTRATION_ENDPOINTS.UPDATE_STATUS(targetId), {
        status: 'approved'
      })
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
      await api.post(REGISTRATION_ENDPOINTS.UPDATE_STATUS(targetId), {
        status: 'rejected',
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
      await api.post(REGISTRATION_ENDPOINTS.UPDATE_STATUS(targetId), {
        status: 'needs_correction',
        reason: correctionRemarks,
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

  const getStatusBadge = (status, row) => {
    const isResubmitted = row?.is_resubmitted || row?.status_check || status === 'resubmitted' || status === 'resubmit'
    if (isResubmitted && status !== 'approved' && status !== 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25">
          <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          Resubmitted
        </span>
      )
    }

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
      case 'resubmit':
      case 'resubmitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25">
            <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Resubmitted
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
      header: 'Location',
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
          </div>
        )
      }
    },
    {
      key: 'patti',
      header: 'Patti/Para/Pargana',
      className: 'min-w-[180px]',
      render: (row) => {
        const patti = cleanLocationName(row.patti_name || row.patti_para_pargana)

        return (
          <div className="flex flex-col gap-1 text-xs">
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
      key: 'status',
      header: 'Status',
      className: 'min-w-[140px]',
      render: (row) => {
        const isApproved = row.is_approved || row.registration_status === 'approved' || row.status === 'approved'
        const currentStatus = isApproved ? 'approved' : (row.status || 'in_progress')
        return getStatusBadge(currentStatus, row)
      }
    },
    {
      key: 'step',
      header: 'Progress Step',
      className: 'min-w-[140px]',
      render: (row) => {
        const stepNum = row.registration_step || row.current_step || 1
        return (
          <div className="text-xs space-y-1">
            <span className="inline-flex items-center gap-1 font-semibold text-text">
              <Layers className="w-3 h-3 text-primary" /> Step {stepNum} of 5
            </span>
            <div className="text-[11px] text-text-secondary font-medium">
              {row.family_members_count > 0 ? (
                <span className="text-primary font-bold">+{row.family_members_count} family members</span>
              ) : (
                <span>Head only</span>
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
                className="p-2 text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold leading-none"
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
                  { label: 'Resubmitted', value: 'resubmitted' },
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
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {/* Sleek, Clean Profile Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-surface-secondary/40 border border-border/80">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Profile Image / Initials Avatar */}
              <div
                onClick={() => {
                  const img = userObj.profile_image || userObj.image
                  if (img) setPreviewImage({ url: assetUrl(img), title: `${userObj.first_name} ${userObj.last_name}` })
                }}
                className="relative group w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white dark:bg-surface border border-border shadow-xs overflow-hidden shrink-0 flex items-center justify-center font-bold text-lg text-primary cursor-pointer"
                title="Click to zoom photo"
              >
                {userObj.profile_image || userObj.image ? (
                  <img src={assetUrl(userObj.profile_image || userObj.image)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  (userObj.first_name || 'U').charAt(0).toUpperCase()
                )}
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Applicant Info */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-text capitalize truncate tracking-tight">
                    {`${userObj.first_name || ''} ${userObj.middle_name || ''} ${userObj.last_name || ''}`.trim() || 'Applicant'}
                  </h3>
                  {userObj.peta_jati && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20 text-[10px]">
                      {userObj.peta_jati}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                  <span className="inline-flex items-center gap-1.5 font-medium bg-white dark:bg-surface px-2.5 py-0.5 rounded-md border border-border/80 text-text">
                    <Phone className="w-3 h-3 text-primary" /> {userObj.number || userObj.phone || '-'}
                  </span>
                  {userObj.member_id && (
                    <span className="inline-flex items-center gap-1.5 font-medium bg-white dark:bg-surface px-2.5 py-0.5 rounded-md border border-border/80 text-text">
                      ID: <b className="font-mono text-primary font-bold">{userObj.member_id}</b>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status & Progress Step Badges */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-border/50 shrink-0">
              {getStatusBadge(userObj.registration_status || (userObj.status === 1 ? 'approved' : userObj.status || 'pending_review'), userObj)}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary bg-white dark:bg-surface border border-border/80 px-2.5 py-0.5 rounded-full">
                <Layers className="w-3 h-3 text-primary" /> Step {userObj.registration_step || userObj.current_step || 1} of 5
              </span>
            </div>
          </div>

          {/* Remarks Alert if any */}
          {userObj.correction_remarks && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">Correction Remarks:</span>
                <p className="font-medium leading-relaxed opacity-95">{userObj.correction_remarks}</p>
              </div>
            </div>
          )}

          {userObj.rejection_reason && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5 shadow-xs">
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">Rejection Reason:</span>
                <p className="font-medium leading-relaxed opacity-95">{userObj.rejection_reason}</p>
              </div>
            </div>
          )}

          {/* Segmented Tab Navigation Bar */}
          <div className="flex items-center gap-1 p-1 bg-surface-secondary/60 border border-border/80 rounded-xl overflow-x-auto no-scrollbar select-none">
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
                  className={`flex items-center gap-2 py-2 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${isActive
                    ? 'bg-white dark:bg-surface text-primary shadow-xs border border-border'
                    : 'text-text-secondary hover:text-text hover:bg-surface/50 border border-transparent'
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'opacity-60'}`} />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* TAB CONTENT (Stable Layout, Ultra-Modern Card Style) */}
          <div className="min-h-[280px]">
            {/* TAB 1: Personal Info */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {[
                  { label: 'Full Name', value: `${userObj.first_name || ''} ${userObj.middle_name || ''} ${userObj.last_name || ''}`.trim() },
                  { label: 'Gender', value: userObj.gender },
                  { label: 'Date of Birth', value: formatDate(userObj.dob) },
                  { label: 'Blood Group', value: userObj.blood_group, highlight: 'text-rose-600 dark:text-rose-400 font-black' },
                  { label: 'Marital Status', value: userObj.marital_status },
                  { label: 'Patti / Para / Pargana', value: cleanLocationName(userObj.patti_para_pargana) },
                  { label: 'Sub Caste / Peta Jati', value: userObj.peta_jati },
                  { label: 'Email Address', value: userObj.email, isMono: true },
                  { label: 'Member Sequence ID', value: userObj.member_id, isMono: true, highlight: 'text-primary' }
                ].filter(item => item.value).map((item, idx) => (
                  <div key={idx} className="p-3.5 sm:p-4 rounded-xl bg-surface-secondary/35 hover:bg-surface-secondary/60 border border-border/60 transition-colors">
                    <span className="text-text-secondary text-xs font-semibold block mb-1">{item.label}</span>
                    <p className={`text-[14px] font-bold text-text leading-snug break-words ${item.isMono ? 'font-mono text-[13px]' : ''} ${item.highlight || ''}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: Family Details */}
            {activeTab === 'family' && (
              <div className="space-y-4">
                {familyList.length === 0 ? (
                  <div className="p-10 text-center bg-surface-secondary/30 rounded-2xl border border-dashed border-border/80 text-text-secondary space-y-2">
                    <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-1">
                      <Users className="w-6 h-6 text-text-secondary/60" />
                    </div>
                    <p className="font-bold text-text text-[15px]">No Additional Family Members</p>
                    <p className="text-[13px] opacity-80 max-w-sm mx-auto">Registered as the primary Family Head only.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {familyList.map((m, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-surface-secondary/30 hover:bg-surface-secondary/50 border border-border/70 shadow-sm transition-colors flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black flex items-center justify-center text-base shrink-0">
                          {m.first_name ? m.first_name[0] : (m.name ? m.name[0] : idx + 1)}
                        </div>
                        <div className="flex-1 text-[13px] space-y-1.5 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-bold text-text text-[14px] capitalize truncate">
                              {m.name ? m.name : `${m.first_name || ''} ${m.middle_name || ''} ${m.last_name || ''}`.trim() || 'Family Member'}
                            </div>
                            <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold shrink-0">
                              {getRelationDisplay(m.relation) || m.relation || 'Member'}
                            </span>
                          </div>
                          <div className="text-text-secondary text-[12px] flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>Gender: <b className="text-text font-semibold">{m.gender || '-'}</b></span>
                            {m.dob && <span>• DOB: <b className="text-text font-semibold">{formatDate(m.dob)}</b></span>}
                            {m.age && !m.dob && <span>• Age: <b className="text-text font-semibold">{m.age} Yrs</b></span>}
                            {m.blood_group && <span>• Blood: <b className="text-rose-600 font-bold">{m.blood_group}</b></span>}
                          </div>
                          {(m.number || m.mobile) && (
                            <div className="text-text font-mono text-[12px] font-medium flex items-center gap-1.5 pt-0.5">
                              <Phone className="w-3.5 h-3.5 text-primary" /> {m.number || m.mobile}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {userObj.address && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-surface-secondary/35 hover:bg-surface-secondary/60 border border-border/60 transition-colors col-span-1 sm:col-span-2 md:col-span-3">
                    <span className="text-text-secondary text-xs font-semibold block mb-1">Full Residential Address</span>
                    <p className="font-bold text-text text-[14px] leading-relaxed">{userObj.address}</p>
                  </div>
                )}
                {Boolean(userObj.village || userObj.village_name) && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-surface-secondary/35 hover:bg-surface-secondary/60 border border-border/60 transition-colors">
                    <span className="text-text-secondary text-xs font-semibold block mb-1">Village / Native Place</span>
                    <p className="font-bold text-text text-[14px] leading-snug">{cleanLocationName(userObj.village_name || userObj.village)}</p>
                  </div>
                )}
                {userObj.pincode && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-surface-secondary/35 hover:bg-surface-secondary/60 border border-border/60 transition-colors">
                    <span className="text-text-secondary text-xs font-semibold block mb-1">Pincode</span>
                    <p className="font-bold text-text text-[14px] font-mono leading-snug">{userObj.pincode}</p>
                  </div>
                )}
                {Boolean(userObj.city_name || userObj.city || cleanLocationName(userObj.city_id)) && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-surface-secondary/35 hover:bg-surface-secondary/60 border border-border/60 transition-colors">
                    <span className="text-text-secondary text-xs font-semibold block mb-1">City / Taluka</span>
                    <p className="font-bold text-text text-[14px] leading-snug">{cleanLocationName(userObj.city_name || userObj.city || userObj.city_id)}</p>
                  </div>
                )}
                {Boolean(userObj.district_name || userObj.district || cleanLocationName(userObj.district_id)) && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-surface-secondary/35 hover:bg-surface-secondary/60 border border-border/60 transition-colors">
                    <span className="text-text-secondary text-xs font-semibold block mb-1">District</span>
                    <p className="font-bold text-text text-[14px] leading-snug">{cleanLocationName(userObj.district_name || userObj.district || userObj.district_id)}</p>
                  </div>
                )}
                {Boolean(userObj.state_name || userObj.state || cleanLocationName(userObj.state_id)) && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-surface-secondary/35 hover:bg-surface-secondary/60 border border-border/60 transition-colors">
                    <span className="text-text-secondary text-xs font-semibold block mb-1">State</span>
                    <p className="font-bold text-text text-[14px] leading-snug">{cleanLocationName(userObj.state_name || userObj.state || userObj.state_id)}</p>
                  </div>
                )}
                {Boolean(userObj.country_name || userObj.country || cleanLocationName(userObj.country_id)) && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-surface-secondary/35 hover:bg-surface-secondary/60 border border-border/60 transition-colors">
                    <span className="text-text-secondary text-xs font-semibold block mb-1">Country</span>
                    <p className="font-bold text-text text-[14px] leading-snug">{cleanLocationName(userObj.country_name || userObj.country || userObj.country_id)}</p>
                  </div>
                )}
                {(!userObj.address && !userObj.village && !userObj.pincode && !userObj.city && !userObj.district && !userObj.state && !userObj.country) && (
                  <div className="col-span-full p-8 text-center text-text-secondary italic bg-surface-secondary/20 rounded-xl border border-dashed border-border">No address details provided</div>
                )}
              </div>
            )}

            {/* TAB 4: Occupation & Business */}
            {activeTab === 'occupation' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {[
                  { label: 'Occupation Type', value: userObj.occupation || userObj.occupation_type },
                  { label: 'Business / Company Name', value: userObj.occupation_details?.business_name },
                  { label: 'Business Category / Type', value: userObj.occupation_details?.business_type },
                  { label: 'Business Contact Phone', value: userObj.occupation_details?.business_mobile, isMono: true },
                  { label: 'Business Email', value: userObj.occupation_details?.business_email, isMono: true },
                  { label: 'GST / Tax Number', value: userObj.occupation_details?.gst_number, isMono: true },
                  { label: 'Website URL', value: userObj.occupation_details?.website, highlight: 'text-primary' },
                  { label: 'Office / Business Address', value: userObj.occupation_details?.business_address, fullSpan: true }
                ].filter(item => item.value).map((item, idx) => (
                  <div key={idx} className={`p-3.5 sm:p-4 rounded-xl bg-surface-secondary/35 hover:bg-surface-secondary/60 border border-border/60 transition-colors ${item.fullSpan ? 'col-span-1 sm:col-span-2 md:col-span-3' : ''}`}>
                    <span className="text-text-secondary text-xs font-semibold block mb-1">{item.label}</span>
                    <p className={`text-[14px] font-bold text-text leading-relaxed break-words ${item.isMono ? 'font-mono text-[13px]' : ''} ${item.highlight || ''}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
                {(!userObj.occupation && !userObj.occupation_type && (!userObj.occupation_details || Object.keys(userObj.occupation_details).length === 0)) && (
                  <div className="col-span-full p-8 text-center text-text-secondary italic bg-surface-secondary/20 rounded-xl border border-dashed border-border">No occupation details provided</div>
                )}
              </div>
            )}

            {/* TAB 5: Uploaded Documents (Modern Card Preview with Image/PDF preview) */}
            {activeTab === 'documents' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Aadhaar Card (Front)', url: docs.aadhaar_card || docs.aadhaar_front, icon: CreditCard },
                  { label: 'Aadhaar Card (Back)', url: docs.aadhaar_back || docs.aadhar_back, icon: CreditCard },
                  { label: 'PAN Card', url: docs.pan_card, icon: ShieldCheck },
                  { label: 'Voter ID', url: docs.voter_id, icon: FileCheck },
                  { label: 'Driving License', url: docs.driving_license, icon: FileText },
                  { label: 'Passport / Other Document', url: docs.passport, icon: Building }
                ].filter(doc => doc.url).map((doc, idx) => {
                  const hasDoc = Boolean(doc.url)
                  const isUrl = hasDoc && (String(doc.url).startsWith('http') || String(doc.url).startsWith('/uploads') || String(doc.url).startsWith('blob:'))
                  const isPdf = isUrl && String(doc.url).toLowerCase().endsWith('.pdf')
                  const Icon = doc.icon

                  return (
                    <div key={idx} className="group relative rounded-2xl bg-surface-secondary/30 hover:bg-surface-secondary/50 border border-border/70 hover:border-primary/40 shadow-sm transition-all duration-200 overflow-hidden flex flex-col justify-between">
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-text text-[13px]">{doc.label}</span>
                          </div>

                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> {isUrl ? (isPdf ? 'PDF' : 'IMAGE') : 'ATTACHED'}
                          </span>
                        </div>

                        {/* Image Preview Thumbnail or PDF Icon Banner */}
                        {isUrl && !isPdf ? (
                          <div
                            onClick={() => setPreviewImage({ url: assetUrl(doc.url), title: doc.label })}
                            className="relative h-28 rounded-xl overflow-hidden bg-black/5 border border-border/60 cursor-pointer group/thumb"
                          >
                            <img src={assetUrl(doc.url)} alt={doc.label} className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-bold transition-opacity">
                              <Eye className="w-4 h-4" /> View Zoom
                            </div>
                          </div>
                        ) : isUrl && isPdf ? (
                          <div className="h-28 rounded-xl bg-red-500/5 border border-red-500/20 flex flex-col items-center justify-center gap-1.5 text-red-600 dark:text-red-400">
                            <FileText className="w-8 h-8" />
                            <span className="text-xs font-bold">PDF Document File</span>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/15 font-mono text-[12px] font-bold text-primary truncate">
                            {doc.url}
                          </div>
                        )}
                      </div>

                      {isUrl && (
                        <div className="px-4 pb-4 pt-1">
                          {isPdf ? (
                            <a
                              href={assetUrl(doc.url)}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-surface hover:bg-primary hover:text-white border border-border text-text font-bold text-[12px] flex items-center justify-center gap-2 transition-all shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open Full PDF
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ url: assetUrl(doc.url), title: doc.label })}
                              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-surface hover:bg-primary hover:text-white border border-border text-text font-bold text-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5" /> Fullscreen Preview
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {!Object.values(docs).some(Boolean) && (
                  <div className="col-span-full p-10 text-center text-text-secondary italic bg-surface-secondary/20 rounded-xl border border-dashed border-border">No documents uploaded</div>
                )}
              </div>
            )}
          </div>

          {/* Modal Action Buttons Footer */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
              className="text-[13px] font-bold px-5 py-2 rounded-xl border-border/80 hover:bg-surface-secondary transition-all"
            >
              Close
            </Button>

            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(true)}
              className="text-rose-600 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-[13px] font-bold cursor-pointer transition-all px-5 py-2 rounded-xl"
            >
              <X className="w-4 h-4 mr-1.5" />
              Reject
            </Button>

            <Button
              variant="primary"
              onClick={() => openApproveModal(userObj)}
              disabled={actionLoading || userObj.registration_status === 'approved' || userObj.status === 1}
              className="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 text-white text-[13px] font-bold cursor-pointer shadow-md hover:shadow-lg transition-all px-6 py-2 rounded-xl disabled:opacity-50"
            >
              <Check className="w-4 h-4 mr-1.5" />
              {userObj.registration_status === 'approved' || userObj.status === 1 ? 'Approved' : 'Approve Registration'}
            </Button>
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
