import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Landmark,
  Users,
  Award,
  Plus,
  Edit2,
  Trash2,
  Download,
  ShieldCheck,
  Building,
  MapPin,
  Globe,
  Phone,
  Mail,
  FileText,
  Printer,
  RefreshCw,
  Upload,
  CreditCard,
  QrCode
} from 'lucide-react'
import api from '../lib/api'
import { toast } from 'sonner'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import Modal from '../components/Modal'
import Button from '../components/common/Button'
import DatePicker from '../components/DatePicker'
import Select from '../components/common/Select'
import SearchInput from '../components/common/SearchInput'
import { confirm } from '../lib/confirm'
import { COMMITTEE_ENDPOINTS } from '../utils/endpoints'
import { normalizeRoles, unwrapApiData } from '../lib/roles'

// Standard Role Badge Color Match with Committee Members module
const getRoleBadgeColor = (roleName) => {
  if (!roleName) return 'bg-surface-secondary border-border text-text'
  const name = roleName.toLowerCase().trim()

  if (name.includes('president') && !name.includes('vice')) {
    return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20'
  }
  if (name.includes('vice president')) {
    return 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20'
  }
  if (name.includes('manager') || name.includes('secretary')) {
    return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20'
  }
  if (name.includes('admin')) {
    return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  }
  if (name.includes('treasurer')) {
    return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20'
  }

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const colors = [
    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20',
    'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/20',
    'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20'
  ]

  return colors[Math.abs(hash) % colors.length]
}

const LEVEL_TABS = [
  { key: 'all', label: 'All Levels', icon: Users },
  { key: 'national', label: 'National', icon: Globe },
  { key: 'state', label: 'State', icon: Landmark },
  { key: 'district', label: 'District', icon: Building },
  { key: 'taluka', label: 'Taluka', icon: MapPin },
  { key: 'village', label: 'Village', icon: Award }
]

export default function TrustPage() {
  // Main Navigation Tabs
  const [activeTab, setActiveTab] = useState('committee_members') // 'committee_members' | 'trusts_list' | 'trust_profile'
  const [levelFilter, setLevelFilter] = useState('all')

  // Multiple Trusts State
  const [trustsList, setTrustsList] = useState([])
  const [selectedTrustId, setSelectedTrustId] = useState('')
  const [trustsLoading, setTrustsLoading] = useState(false)

  // Trust Form Modal State (Add / Edit Trust)
  const [isTrustModalOpen, setIsTrustModalOpen] = useState(false)
  const [trustModalMode, setTrustModalMode] = useState('add') // 'add' | 'edit'
  const [trustForm, setTrustForm] = useState({})
  const [trustErrors, setTrustErrors] = useState({})
  const [trustSaving, setTrustSaving] = useState(false)
  const [trustDeleteTarget, setTrustDeleteTarget] = useState(null)
  const [isDeletingTrust, setIsDeletingTrust] = useState(false)

  const clearTrustError = (key) => {
    setTrustErrors(prev => {
      if (!prev[key]) return prev
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
  }

  // Roles State (for Designation / Role dropdown from system)
  const [rolesList, setRolesList] = useState([])

  // Members State
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, national: 0, state: 0, district: 0, taluka: 0, village: 0, active: 0, completed: 0 })

  // Location Masters
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [talukas, setTalukas] = useState([])
  const [villages, setVillages] = useState([])

  // Location Filters in Member list
  const [filterState, setFilterState] = useState('')
  const [filterDistrict, setFilterDistrict] = useState('')
  const [filterStatus, setFilterStatus] = useState('active') // 'all' | 'active' | 'completed' | 'replaced'

  // Member Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [memberForm, setMemberForm] = useState({})
  const [memberErrors, setMemberErrors] = useState({})
  const [memberSaving, setMemberSaving] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

  const clearMemberError = (key) => {
    setMemberErrors(prev => {
      if (!prev[key]) return prev
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
  }

  // ID Card Modal State
  const [idCardMember, setIdCardMember] = useState(null)
  const [isIdCardOpen, setIsIdCardOpen] = useState(false)
  const cardPrintRef = useRef(null)

  // Delete Member Confirm
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Active Selected Trust Object
  const currentTrust = useMemo(() => {
    if (!trustsList || trustsList.length === 0) return null
    if (selectedTrustId && selectedTrustId !== 'all') {
      return trustsList.find(t => String(t._id || t.id) === String(selectedTrustId)) || trustsList[0]
    }
    return trustsList[0] || null
  }, [trustsList, selectedTrustId])

  // Load Initial Data
  useEffect(() => {
    fetchTrusts()
    fetchRoles()
    fetchMasters()
  }, [])

  // Refetch members & stats whenever filters or selected trust change
  useEffect(() => {
    fetchMembers()
    fetchStats()
  }, [selectedTrustId, levelFilter, filterState, filterDistrict, filterStatus])

  // ── FETCH TRUSTS LIST ──────────────────────────────────────────
  const fetchTrusts = async () => {
    try {
      setTrustsLoading(true)
      const res = await api.get('/trust/list')
      const data = res.data?.data || res.data || []
      const list = Array.isArray(data) ? data : []
      setTrustsList(list)

      if (list.length > 0 && !selectedTrustId) {
        setSelectedTrustId(String(list[0]._id || list[0].id))
      }
    } catch (err) {
      console.error('Error fetching trusts list:', err)
      toast.error(err.response?.data?.message || 'Failed to load trusts')
    } finally {
      setTrustsLoading(false)
    }
  }

  // ── FETCH SYSTEM ROLES (DESIGNATION / ROLE DROPDOWN - TRUST ROLES ONLY) ───
  const fetchRoles = async () => {
    try {
      const res = await api.get(COMMITTEE_ENDPOINTS.GET_ROLES, { params: { limit: 200, role_type: 'trust' } })
      const raw = unwrapApiData(res)
      const normalized = normalizeRoles(raw)
      // Strictly confine to trust roles only
      const trustRoles = normalized.filter((r) => r.role_type === 'trust' || r.is_trust_role === true)
      setRolesList(trustRoles)
    } catch (err) {
      console.warn('Failed to load roles list:', err.message)
    }
  }

  // ── FETCH STATS ────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const params = {}
      if (selectedTrustId && selectedTrustId !== 'all') {
        params.trust_id = selectedTrustId
      }
      const res = await api.get('/trust/stats', { params })
      const data = res.data?.data || res.data
      if (data) setStats(data)
    } catch (err) {
      console.error('Error fetching trust stats:', err)
    }
  }

  // ── FETCH LOCATION MASTERS ─────────────────────────────────────
  const fetchMasters = async () => {
    try {
      const [sRes, dRes, tRes, vRes] = await Promise.allSettled([
        api.get('/masters/state?limit=500'),
        api.get('/masters/district?limit=1000'),
        api.get('/masters/taluka?limit=1000'),
        api.get('/masters/village?limit=1000')
      ])

      if (sRes.status === 'fulfilled') setStates(sRes.value.data?.data || sRes.value.data || [])
      if (dRes.status === 'fulfilled') setDistricts(dRes.value.data?.data || dRes.value.data || [])
      if (tRes.status === 'fulfilled') setTalukas(tRes.value.data?.data || tRes.value.data || [])
      if (vRes.status === 'fulfilled') setVillages(vRes.value.data?.data || vRes.value.data || [])
    } catch (e) {
      console.error('Failed to load location masters', e)
    }
  }

  // ── FETCH MEMBERS ──────────────────────────────────────────────
  const fetchMembers = async () => {
    try {
      setMembersLoading(true)
      const params = { limit: 300 }
      if (selectedTrustId && selectedTrustId !== 'all') {
        params.trust_id = selectedTrustId
      }
      if (levelFilter && levelFilter !== 'all') params.level = levelFilter
      if (filterState) params.state_id = filterState
      if (filterDistrict) params.district_id = filterDistrict
      if (filterStatus && filterStatus !== 'all') params.tenure_status = filterStatus

      const res = await api.get('/trust/members', { params })
      const data = res.data?.data || res.data || []
      setMembers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching members:', err)
      toast.error(err.response?.data?.message || 'Failed to load committee members')
    } finally {
      setMembersLoading(false)
    }
  }

  // Filtered location options based on parent selection in form
  const availableDistrictsForForm = useMemo(() => {
    if (!memberForm.state_id) return districts
    return districts.filter(d => String(d.state_id || d.parent_id || '') === String(memberForm.state_id))
  }, [districts, memberForm.state_id])

  const availableTalukasForForm = useMemo(() => {
    if (!memberForm.district_id) return talukas
    return talukas.filter(t => String(t.district_id || t.parent_id || '') === String(memberForm.district_id))
  }, [talukas, memberForm.district_id])

  const availableVillagesForForm = useMemo(() => {
    if (!memberForm.taluka_id) return villages
    return villages.filter(v => String(v.taluka_id || v.parent_id || '') === String(memberForm.taluka_id))
  }, [villages, memberForm.taluka_id])

  // Filtered districts for list filters
  const filterDistrictsList = useMemo(() => {
    if (!filterState) return districts
    return districts.filter(d => String(d.state_id || d.parent_id || '') === String(filterState))
  }, [districts, filterState])

  // Filtered members by search query
  const displayedMembers = useMemo(() => {
    if (!search.trim()) return members
    const s = search.toLowerCase()
    return members.filter(m =>
      (m.name || '').toLowerCase().includes(s) ||
      (m.designation || '').toLowerCase().includes(s) ||
      (m.mobile || '').toLowerCase().includes(s) ||
      (m.card_number || '').toLowerCase().includes(s) ||
      (m.district_name || '').toLowerCase().includes(s) ||
      (m.village_name || '').toLowerCase().includes(s) ||
      (m.taluka_name || '').toLowerCase().includes(s) ||
      (m.trust_name || '').toLowerCase().includes(s) ||
      (m.address || '').toLowerCase().includes(s)
    )
  }, [members, search])

  // Designation / Role options built from system roles (Trust roles only)
  const roleDropdownOptions = useMemo(() => {
    const list = rolesList.map(r => ({ label: r.name, value: r.name, id: r.id }))
    if (memberForm.designation && !list.some(r => r.value === memberForm.designation)) {
      list.unshift({ label: memberForm.designation, value: memberForm.designation, id: '' })
    }
    const placeholder = list.length > 0 ? 'Select Trust Role / Designation' : 'No Trust Roles found (Create in Roles module)'
    return [{ label: placeholder, value: '' }, ...list]
  }, [rolesList, memberForm.designation])

  // Trust options for selector
  const trustDropdownOptions = useMemo(() => {
    return trustsList.map(t => ({
      label: t.trust_name + (t.registration_number ? ` (${t.registration_number})` : ''),
      value: String(t._id || t.id)
    }))
  }, [trustsList])

  // ── OPEN ADD / EDIT TRUST MODAL ────────────────────────────────
  const openAddTrust = () => {
    setTrustModalMode('add')
    setTrustErrors({})
    setTrustForm({
      trust_name: '',
      registration_number: '',
      registration_date: new Date().toISOString().split('T')[0],
      trust_type: 'Charitable & Social Welfare Trust',
      jurisdiction: 'national',
      jurisdiction_label: 'National (All India)',
      purpose: '',
      head_office_address: '',
      contact_number: '',
      contact_email: '',
      website: '',
      bank_name: '',
      account_name: '',
      account_number: '',
      ifsc_code: '',
      branch: '',
      upi_id: '',
      qr_code: '',
      qrFile: null,
      qrPreview: '',
      is_verified: true,
      status: 1
    })
    setIsTrustModalOpen(true)
  }

  const openEditTrust = (t) => {
    const target = t || currentTrust
    if (!target) return
    setTrustModalMode('edit')
    setTrustErrors({})
    setTrustForm({
      ...target,
      registration_date: target.registration_date ? new Date(target.registration_date).toISOString().split('T')[0] : '',
      bank_name: target.bank_name || '',
      account_name: target.account_name || '',
      account_number: target.account_number || '',
      ifsc_code: target.ifsc_code || '',
      branch: target.branch || '',
      upi_id: target.upi_id || '',
      qr_code: target.qr_code || '',
      qrPreview: target.qr_code || '',
      qrFile: null
    })
    setIsTrustModalOpen(true)
  }

  // ── SAVE TRUST (CREATE OR UPDATE) ──────────────────────────────
  const handleSaveTrust = async (e) => {
    e.preventDefault()

    const errors = {}
    if (!trustForm.trust_name?.trim()) {
      errors.trust_name = 'Trust Full Name is required'
    }
    if (!trustForm.registration_number?.trim()) {
      errors.registration_number = 'Registration Number is required'
    }

    if (Object.keys(errors).length > 0) {
      setTrustErrors(errors)
      return
    }

    setTrustErrors({})

    try {
      setTrustSaving(true)
      const formData = new FormData()

      Object.entries(trustForm).forEach(([key, val]) => {
        if (key === 'logoFile' && val) {
          formData.append('logo', val)
        } else if (key === 'certFile' && val) {
          formData.append('certificate_doc', val)
        } else if (key === 'qrFile' && val) {
          formData.append('qr_code', val)
        } else if (val !== undefined && val !== null && key !== 'logo' && key !== 'certificate_doc' && key !== 'qr_code' && key !== 'qrPreview') {
          formData.append(key, val)
        }
      })

      let res
      if (trustModalMode === 'edit' && trustForm._id) {
        res = await api.put(`/trust/${trustForm._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success(res?.data?.message || 'Trust updated successfully!')
      } else {
        res = await api.post('/trust', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success(res?.data?.message || 'New Trust added successfully!')
      }

      const savedDoc = res.data?.data || res.data
      setIsTrustModalOpen(false)
      await fetchTrusts()
      if (savedDoc?._id) {
        setSelectedTrustId(String(savedDoc._id))
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to save trust')
    } finally {
      setTrustSaving(false)
    }
  }

  // ── DELETE TRUST ───────────────────────────────────────────────
  const handleDeleteTrust = async (target) => {
    const t = target || trustDeleteTarget
    if (!t) return

    const isConfirmed = await confirm(`Are you sure you want to delete "${t.trust_name}"? All associated committee members will also be deleted.`, {
      title: 'Delete Trust',
      confirmText: 'Yes, Delete Trust',
      type: 'danger'
    })
    if (!isConfirmed) return

    try {
      setIsDeletingTrust(true)
      const res = await api.delete(`/trust/${t._id}`)
      toast.success(res?.data?.message || 'Trust deleted successfully')
      setTrustDeleteTarget(null)
      await fetchTrusts()
      setSelectedTrustId('')
      fetchMembers()
      fetchStats()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to delete trust')
    } finally {
      setIsDeletingTrust(false)
    }
  }

  // ── OPEN ADD / EDIT MEMBER MODAL ───────────────────────────────
  const openAddMember = () => {
    setSelectedMember(null)
    setMemberErrors({})
    const activeTId = selectedTrustId && selectedTrustId !== 'all'
      ? selectedTrustId
      : (trustsList[0]?._id ? String(trustsList[0]._id) : '')

    const activeTObj = trustsList.find(t => String(t._id || t.id) === String(activeTId))

    setMemberForm({
      trust_id: activeTId,
      trust_name: activeTObj?.trust_name || '',
      level: levelFilter !== 'all' ? levelFilter : 'national',
      role_id: '',
      designation: '',
      state_id: '',
      state_name: '',
      district_id: '',
      district_name: '',
      taluka_id: '',
      taluka_name: '',
      village_id: '',
      village_name: '',
      address: '',
      blood_group: '',
      term_start: new Date().toISOString().split('T')[0],
      term_end: '',
      tenure_status: 'active',
      is_mobile_public: true,
      is_verified: true,
      membersList: [
        {
          id: Date.now(),
          name: '',
          member_id: '',
          mobile: '',
          photo: '',
          photoFile: null,
          photoPreview: ''
        }
      ]
    })
    setIsMemberModalOpen(true)
  }

  const openEditMember = (m) => {
    setSelectedMember(m)
    setMemberErrors({})
    setMemberForm({
      ...m,
      address: m.address || '',
      trust_id: m.trust_id?._id || m.trust_id || selectedTrustId,
      trust_name: m.trust_id?.trust_name || m.trust_name || '',
      role_id: m.role_id?._id || m.role_id || '',
      designation: m.designation || '',
      term_start: m.term_start ? new Date(m.term_start).toISOString().split('T')[0] : '',
      term_end: m.term_end ? new Date(m.term_end).toISOString().split('T')[0] : '',
      membersList: [
        {
          id: m._id,
          name: m.name || '',
          member_id: m.member_id || '',
          mobile: m.mobile || '',
          photo: m.photo || '',
          photoFile: null,
          photoPreview: m.photo || ''
        }
      ]
    })
    setIsMemberModalOpen(true)
  }

  // ── SAVE MEMBER ────────────────────────────────────────────────
  const handleSaveMember = async (e) => {
    e.preventDefault()

    const errors = {}

    // Compulsory field validations
    if (!memberForm.trust_id) {
      errors.trust_id = 'Trust / Organization is required'
    }
    if (!memberForm.designation?.trim()) {
      errors.designation = 'Designation / Role is required'
    }
    if (!memberForm.level) {
      errors.level = 'Organization Hierarchy Level is required'
    } else if (memberForm.level !== 'national') {
      if (!memberForm.state_id) {
        errors.state_id = 'State is required'
      }
      if (['district', 'taluka', 'village'].includes(memberForm.level) && !memberForm.district_id) {
        errors.district_id = 'District is required'
      }
      if (['taluka', 'village'].includes(memberForm.level) && !memberForm.taluka_id) {
        errors.taluka_id = 'Taluka is required'
      }
      if (memberForm.level === 'village' && !memberForm.village_id) {
        errors.village_id = 'Village is required'
      }
    }

    const currentMembersList = selectedMember?._id
      ? [memberForm.membersList?.[0] || memberForm]
      : (memberForm.membersList && memberForm.membersList.length > 0
        ? memberForm.membersList
        : [{
          name: memberForm.name || '',
          member_id: memberForm.member_id || '',
          mobile: memberForm.mobile || '',
          photoFile: memberForm.photoFile,
          photo: memberForm.photo || ''
        }])

    currentMembersList.forEach((item, idx) => {
      if (!item.name?.trim()) {
        errors[`name_${idx}`] = 'Full Name is required'
      }
      if (!item.mobile?.trim()) {
        errors[`mobile_${idx}`] = 'Mobile Number is required'
      }
    })

    if (Object.keys(errors).length > 0) {
      setMemberErrors(errors)
      return
    }

    setMemberErrors({})

    try {
      setMemberSaving(true)
      const formData = new FormData()

      // Common organization fields
      const commonFields = [
        'trust_id', 'trust_name', 'level', 'designation', 'role_id',
        'state_id', 'state_name', 'district_id', 'district_name',
        'taluka_id', 'taluka_name', 'village_id', 'village_name',
        'address', 'blood_group', 'term_start', 'term_end',
        'tenure_status', 'is_mobile_public', 'is_verified', 'notes'
      ]

      commonFields.forEach(k => {
        if (memberForm[k] !== undefined && memberForm[k] !== null) {
          formData.append(k, memberForm[k])
        }
      })

      // Edit Mode (single member)
      if (selectedMember?._id) {
        const single = currentMembersList[0]

        formData.append('name', single.name.trim())
        formData.append('member_id', single.member_id ? String(single.member_id).trim() : '')
        formData.append('mobile', single.mobile.trim())

        if (single.photoFile) {
          formData.append('photo', single.photoFile)
        } else if (single.photo) {
          formData.append('photo', single.photo)
        }

        const res = await api.put(`/trust/members/${selectedMember._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success(res?.data?.message || 'Committee member updated successfully!')
      } else {
        // Add Mode (Multiple members supported)
        const list = currentMembersList

        // Attach files and JSON array for bulk/multiple members
        const membersData = []
        list.forEach((item, idx) => {
          const photoKey = `photo_${idx}`
          if (item.photoFile) {
            formData.append(photoKey, item.photoFile)
          }
          membersData.push({
            name: item.name.trim(),
            member_id: item.member_id ? String(item.member_id).trim() : '',
            mobile: item.mobile.trim(),
            photoKey: item.photoFile ? photoKey : undefined,
            photo: item.photo || ''
          })
        })

        // Also add primary member fields for single-member backward compatibility
        formData.append('name', list[0].name.trim())
        formData.append('member_id', list[0].member_id ? String(list[0].member_id).trim() : '')
        formData.append('mobile', list[0].mobile.trim())
        if (list[0].photoFile) {
          formData.append('photo', list[0].photoFile)
        }

        formData.append('members', JSON.stringify(membersData))

        const res = await api.post('/trust/members', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success(
          res?.data?.message ||
          (list.length > 1
            ? `${list.length} Committee members added successfully!`
            : 'Committee member added successfully!')
        )
      }

      setIsMemberModalOpen(false)
      fetchMembers()
      fetchStats()
      fetchTrusts()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to save member')
    } finally {
      setMemberSaving(false)
    }
  }

  // ── DELETE MEMBER ──────────────────────────────────────────────
  const handleDeleteMember = async (target) => {
    const m = target || deleteTarget
    const memberId = m?._id || m?.id
    if (!memberId) return

    const isConfirmed = await confirm(`Are you sure you want to delete "${m.name || 'this member'}" (${m.designation || 'Committee Member'}) from the organization?`, {
      title: 'Delete Committee Member',
      confirmText: 'Yes, Delete',
      type: 'danger'
    })
    if (!isConfirmed) return

    try {
      setIsDeleting(true)
      const res = await api.delete(`/trust/members/${memberId}`)
      toast.success(res?.data?.message || 'Committee member deleted successfully')
      setDeleteTarget(null)
      fetchMembers()
      fetchStats()
      fetchTrusts()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to delete member')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── ID CARD MODAL ──────────────────────────────────────────────
  const openIdCard = (m) => {
    setIdCardMember(m)
    setIsIdCardOpen(true)
  }

  const handlePrintIdCard = () => {
    window.print()
  }

  // ── EXPORT EXCEL ───────────────────────────────────────────────
  const handleExportExcel = async () => {
    try {
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Trust Committee Members')

      ws.columns = [
        { header: 'Card No', key: 'card_number', width: 16 },
        { header: 'Trust Name', key: 'trust_name', width: 28 },
        { header: 'Full Name', key: 'name', width: 28 },
        { header: 'Designation / Role', key: 'designation', width: 24 },
        { header: 'Level', key: 'level_label', width: 20 },
        { header: 'State', key: 'state_name', width: 18 },
        { header: 'District', key: 'district_name', width: 18 },
        { header: 'Taluka', key: 'taluka_name', width: 18 },
        { header: 'Village', key: 'village_name', width: 18 },
        { header: 'Address', key: 'address', width: 28 },
        { header: 'Mobile Number', key: 'mobile', width: 18 },
        { header: 'Term Start', key: 'term_start', width: 14 },
        { header: 'Term End', key: 'term_end', width: 14 },
        { header: 'Status', key: 'tenure_status', width: 14 }
      ]

      const headerRow = ws.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } }
      headerRow.height = 26
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

      displayedMembers.forEach(m => {
        ws.addRow({
          card_number: m.card_number || '-',
          trust_name: m.trust?.trust_name || m.trust_name || currentTrust?.trust_name || '-',
          name: m.name || '-',
          designation: m.designation || '-',
          level_label: m.level_label || m.level,
          state_name: m.state_name || '-',
          district_name: m.district_name || '-',
          taluka_name: m.taluka_name || '-',
          village_name: m.village_name || '-',
          address: m.address || '-',
          mobile: m.mobile || '-',
          term_start: m.term_start ? new Date(m.term_start).toISOString().split('T')[0] : '-',
          term_end: m.term_end ? new Date(m.term_end).toISOString().split('T')[0] : '-',
          tenure_status: m.tenure_status || 'active'
        })
      })

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `Trust_Committee_Members_${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Excel exported successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export Excel')
    }
  }

  // Level Badge Colors
  const getLevelBadgeClass = (lvl) => {
    switch (lvl) {
      case 'national':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 font-semibold'
      case 'state':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 font-semibold'
      case 'district':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25 font-semibold'
      case 'taluka':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-semibold'
      case 'village':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25 font-semibold'
      default:
        return 'bg-surface-secondary text-text-secondary border-border'
    }
  }

  // Member Trust for ID Card
  const idCardTrust = useMemo(() => {
    if (!idCardMember) return currentTrust || {}
    return (
      idCardMember.trust ||
      trustsList.find(t => String(t._id || t.id) === String(idCardMember.trust_id?._id || idCardMember.trust_id)) ||
      currentTrust ||
      {}
    )
  }, [idCardMember, trustsList, currentTrust])

  return (
    <div className="space-y-5 text-text">
      {/* ── TOP HEADER (Standard Project UI Layout) ───────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <span>Trust & Organization</span>
            {currentTrust && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-primary-bg text-primary border border-primary-border">
                {currentTrust.trust_name}
              </span>
            )}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage trusts and multi-tier organizational committee members
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Trust Switcher Dropdown (when multiple trusts exist) */}
          {trustsList.length > 1 && (
            <div className="w-56">
              <Select
                value={selectedTrustId}
                onChange={(val) => setSelectedTrustId(val)}
                options={[
                  { label: 'All Registered Trusts', value: 'all' },
                  ...trustDropdownOptions
                ]}
                placeholder="Switch Trust"
              />
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={openAddTrust}
            icon={<Plus className="w-4 h-4 text-primary" />}
            className="h-10 text-xs font-semibold"
          >
            Add Trust
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleExportExcel}
            icon={<Download className="w-4 h-4 text-emerald-600" />}
            className="h-10 text-xs font-semibold"
          >
            Export
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={openAddMember}
            icon={<Plus className="w-4 h-4" />}
            className="h-10 text-xs font-semibold whitespace-nowrap"
          >
            Add Member
          </Button>
        </div>
      </div>

      {/* ── MAIN TABS (Standard Project Styling) ──────────────────── */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('committee_members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'committee_members'
            ? 'bg-primary text-white shadow-xs'
            : 'bg-surface hover:bg-surface-secondary text-text-secondary hover:text-text'
            }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Committee Members ({displayedMembers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trusts_list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'trusts_list'
            ? 'bg-primary text-white shadow-xs'
            : 'bg-surface hover:bg-surface-secondary text-text-secondary hover:text-text'
            }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>All Registered Trusts ({trustsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trust_profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'trust_profile'
            ? 'bg-primary text-white shadow-xs'
            : 'bg-surface hover:bg-surface-secondary text-text-secondary hover:text-text'
            }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Trust Details</span>
        </button>
      </div>

      {/* ── TAB CONTENT 1: COMMITTEE MEMBERS ───────────────────────── */}
      {activeTab === 'committee_members' && (
        <div className="space-y-4">
          {/* Level Filter Tabs (Clean, standard project pill bar) */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {LEVEL_TABS.map(tab => {
              const Icon = tab.icon
              const isActive = levelFilter === tab.key
              const count = tab.key === 'all'
                ? stats.total
                : (stats[tab.key] || 0)
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setLevelFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${isActive
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface border-border text-text-secondary hover:bg-surface-secondary hover:text-text'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-surface-secondary text-text-secondary'
                      }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Search & Location Filters Bar */}
          <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* SearchInput */}
              <SearchInput
                placeholder="Search committee members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
                wrapperClassName="w-full"
              />

              {/* State Filter (if not national) */}
              {levelFilter !== 'national' ? (
                <Select
                  value={filterState}
                  onChange={(val) => {
                    setFilterState(val)
                    setFilterDistrict('')
                  }}
                  placeholder="All States"
                  options={[{ label: 'All States', value: '' }, ...states.map(s => ({ label: s.name || s.state, value: String(s._id || s.id) }))]}
                />
              ) : <div />}

              {/* District Filter (if district, taluka, village, all) */}
              {['all', 'district', 'taluka', 'village'].includes(levelFilter) ? (
                <Select
                  value={filterDistrict}
                  onChange={(val) => setFilterDistrict(val)}
                  placeholder="All Districts"
                  options={[{ label: 'All Districts', value: '' }, ...filterDistrictsList.map(d => ({ label: d.name || d.district, value: String(d._id || d.id) }))]}
                />
              ) : <div />}

              {/* Status Filter */}
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                placeholder="All Status"
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Replaced', value: 'replaced' },
                  { label: 'All Statuses', value: 'all' }
                ]}
              />
            </div>
          </div>

          {/* Committee Members Table */}
          <div className="rounded-xl bg-card border border-border shadow-xs overflow-hidden">
            {membersLoading ? (
              <div className="p-12 text-center text-text-secondary space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="text-xs font-semibold">Loading committee members...</p>
              </div>
            ) : displayedMembers.length === 0 ? (
              <div className="p-12 text-center text-text-secondary space-y-3">
                <Users className="w-10 h-10 mx-auto text-primary/40" />
                <p className="text-base font-bold text-text">No Committee Members Found</p>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  No committee members found in this trust or level. Click below to add a member.
                </p>
                <Button type="button" variant="primary" size="sm" onClick={openAddMember} icon={<Plus className="w-3.5 h-3.5" />}>
                  Add Member
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface border-b border-border text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                    <tr>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Role & Level</th>
                      <th className="py-3 px-4">Trust Organization</th>
                      <th className="py-3 px-4">Jurisdiction Area</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Tenure Period</th>
                      <th className="py-3 px-4 text-center">ID Card</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {displayedMembers.map(m => {
                      const levelClass = getLevelBadgeClass(m.level)
                      const roleClass = getRoleBadgeColor(m.designation)
                      const memberTrustName = m.trust?.trust_name || m.trust_name || currentTrust?.trust_name || 'Trust'
                      return (
                        <tr key={m._id} className="hover:bg-surface-secondary/40 transition-colors">
                          {/* Name & Photo */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-surface-secondary border border-border shrink-0 overflow-hidden flex items-center justify-center font-semibold text-text-secondary">
                                {m.photo ? (
                                  <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{m.name.charAt(0)}</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-text text-sm">{m.name}</span>
                                  {m.is_verified && (
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Verified Member" />
                                  )}
                                </div>
                                <span className="text-[11px] text-text-secondary">
                                  {m.card_number}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Designation & Level */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${roleClass}`}>
                                {m.designation}
                              </span>
                              <div>
                                <span className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] border ${levelClass}`}>
                                  {m.level_label || m.level}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Trust Organization */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 font-medium text-text max-w-[200px] truncate" title={memberTrustName}>
                                <Landmark className="w-3.5 h-3.5 text-primary shrink-0" />
                                {memberTrustName}
                              </span>
                            </div>
                          </td>

                          {/* Jurisdiction Area */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5 text-text-secondary text-xs">
                              {m.level === 'national' ? (
                                <span className="font-medium text-amber-600 dark:text-amber-400">
                                  All India (National)
                                </span>
                              ) : (
                                <>
                                  {m.village_name && <p className="font-semibold text-text">{m.village_name}</p>}
                                  <p>{[m.taluka_name, m.district_name, m.state_name].filter(Boolean).join(', ')}</p>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-text font-medium text-xs">
                                <Phone className="w-3 h-3 text-text-secondary" />
                                <span>{m.mobile}</span>
                              </div>
                              <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium ${m.is_mobile_public
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-amber-500/10 text-amber-600'
                                }`}>
                                {m.is_mobile_public ? 'Public' : 'Private'}
                              </span>
                            </div>
                          </td>

                          {/* Tenure Term */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5 text-xs">
                              <p className="text-text font-medium">
                                {m.term_start ? new Date(m.term_start).toLocaleDateString() : '-'}
                              </p>
                              <span className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold ${m.tenure_status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-600'
                                : m.tenure_status === 'completed'
                                  ? 'bg-surface-secondary text-text-secondary'
                                  : 'bg-red-500/10 text-red-600'
                                }`}>
                                {m.tenure_status === 'active' ? 'Active' : m.tenure_status === 'completed' ? 'Completed' : 'Replaced'}
                              </span>
                            </div>
                          </td>

                          {/* ID Card Button */}
                          <td className="py-3 px-4 text-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openIdCard(m)}
                              icon={<Award className="w-3.5 h-3.5 text-primary" />}
                              className="h-8 px-2.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary hover:text-white transition-all shadow-2xs"
                            >
                              ID Card
                            </Button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditMember(m)}
                                className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                title="Edit Member"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMember(m)}
                                className="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Delete Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 2: ALL REGISTERED TRUSTS ────────────────── */}
      {activeTab === 'trusts_list' && (
        <div className="rounded-xl bg-card border border-border shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-text">Registered Trusts</h3>
              <p className="text-xs text-text-secondary">Manage organizations and their committee structures.</p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={openAddTrust}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Trust
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface border-b border-border text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                <tr>
                  <th className="py-3 px-4">Trust Name</th>
                  <th className="py-3 px-4">Registration No</th>
                  <th className="py-3 px-4">Jurisdiction</th>
                  <th className="py-3 px-4">Members</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {trustsList.map(t => {
                  const isSelected = String(t._id || t.id) === String(selectedTrustId)
                  return (
                    <tr key={t._id} className={`hover:bg-surface-secondary/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-surface-secondary border border-border shrink-0 overflow-hidden flex items-center justify-center font-semibold text-primary">
                            {t.logo ? (
                              <img src={t.logo} alt={t.trust_name} className="w-full h-full object-cover" />
                            ) : (
                              <Landmark className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-text text-sm">{t.trust_name}</span>
                              {isSelected && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary text-white">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-text-secondary line-clamp-1">{t.trust_type || 'Charitable Trust'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-text">{t.registration_number}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/25">
                          {t.jurisdiction_label || t.jurisdiction || 'National'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-primary text-sm">
                          {t.members_count || 0}
                        </span>
                        <span className="text-text-secondary text-[11px] ml-1">members</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-text-secondary text-xs">
                          {t.contact_number && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {t.contact_number}</p>}
                          {t.contact_email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {t.contact_email}</p>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant={isSelected ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setSelectedTrustId(String(t._id || t.id))
                              setActiveTab('committee_members')
                            }}
                            className="h-8 text-xs font-semibold"
                          >
                            {isSelected ? 'View Members' : 'Select'}
                          </Button>
                          <button
                            type="button"
                            onClick={() => openEditTrust(t)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Edit Trust"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTrust(t)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete Trust"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {trustsList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-secondary">
                      <Landmark className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
                      <p className="text-sm font-semibold text-text">No trusts registered yet</p>
                      <p className="text-xs text-text-secondary mt-1">Click "Add Trust" to create a new trust.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 3: TRUST DETAILS ─────────────────────────── */}
      {activeTab === 'trust_profile' && (
        <div className="rounded-xl bg-card border border-border shadow-xs p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-base font-bold text-text">{currentTrust?.trust_name}</h3>
              <p className="text-xs text-text-secondary">Official registration details and purpose of the trust.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openEditTrust(currentTrust)}
              icon={<Edit2 className="w-3.5 h-3.5 text-primary" />}
            >
              Edit Details
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
              <span className="text-[11px] font-semibold text-text-secondary uppercase">Registration Number</span>
              <p className="text-sm font-semibold text-text">{currentTrust?.registration_number || '-'}</p>
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
              <span className="text-[11px] font-semibold text-text-secondary uppercase">Registration Date</span>
              <p className="text-sm font-semibold text-text">
                {currentTrust?.registration_date ? new Date(currentTrust.registration_date).toLocaleDateString() : '-'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
              <span className="text-[11px] font-semibold text-text-secondary uppercase">Jurisdiction</span>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {currentTrust?.jurisdiction_label || 'National (All India)'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border space-y-1 md:col-span-2">
              <span className="text-[11px] font-semibold text-text-secondary uppercase">Head Office Address</span>
              <p className="text-xs font-medium text-text leading-relaxed">
                {currentTrust?.head_office_address || 'Not specified'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
              <span className="text-[11px] font-semibold text-text-secondary uppercase">Contact Information</span>
              <p className="text-xs font-semibold text-text">{currentTrust?.contact_number || '-'}</p>
              <p className="text-xs text-text-secondary">{currentTrust?.contact_email || '-'}</p>
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border space-y-1 md:col-span-3">
              <span className="text-[11px] font-semibold text-text-secondary uppercase">Purpose & Objectives</span>
              <p className="text-xs text-text leading-relaxed">
                {currentTrust?.purpose || 'No description provided.'}
              </p>
            </div>

            {/* Bank & Donation Details Section in Profile */}
            {(currentTrust?.bank_name || currentTrust?.account_number || currentTrust?.upi_id) && (
              <div className="p-4 rounded-xl bg-surface border border-border space-y-3 md:col-span-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-text uppercase tracking-wide">
                      Official Bank & Donation Details
                    </span>
                  </div>
                  {currentTrust?.upi_id && (
                    <span className="text-xs font-semibold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                      UPI: {currentTrust.upi_id}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-text-secondary uppercase">Bank Name</span>
                    <p className="font-semibold text-text text-sm">{currentTrust?.bank_name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-text-secondary uppercase">Account Name</span>
                    <p className="font-semibold text-text">{currentTrust?.account_name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-text-secondary uppercase">Account Number</span>
                    <p className="font-mono font-bold text-text text-sm">{currentTrust?.account_number || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-text-secondary uppercase">IFSC Code</span>
                    <p className="font-mono font-bold text-primary">{currentTrust?.ifsc_code || '-'}</p>
                  </div>
                  {currentTrust?.branch && (
                    <div>
                      <span className="text-[10px] font-semibold text-text-secondary uppercase">Branch</span>
                      <p className="font-medium text-text">{currentTrust.branch}</p>
                    </div>
                  )}
                  {currentTrust?.qr_code && (
                    <div className="sm:col-span-2 flex items-center gap-3 pt-1">
                      <div className="w-14 h-14 rounded-lg bg-surface-secondary border border-border overflow-hidden shrink-0">
                        <img src={currentTrust.qr_code} alt="QR Code" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-text-secondary uppercase">Donation QR Code</span>
                        <p className="text-xs text-text-secondary">Scan to pay directly to trust account</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── IDENTITY CARD MODAL (Clean, Non-Clipping Official ID Card) ───── */}
      {isIdCardOpen && idCardMember && (
        <Modal
          isOpen={isIdCardOpen}
          onClose={() => setIsIdCardOpen(false)}
          title="Committee Member Identity Card"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            {/* Printable ID Card Container */}
            <div className="flex justify-center p-1 sm:p-2">
              <div
                ref={cardPrintRef}
                id="printable-id-card"
                className="w-[330px] rounded-2xl overflow-hidden bg-white text-slate-800 shadow-xl border border-slate-200/90 relative select-none flex flex-col justify-between"
              >
                {/* ── SINGLE-SIDED OFFICIAL ID CARD ── */}
                <div className="flex flex-col justify-between h-full">
                  {/* Top Branded Navy Header */}
                  <div className="relative bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-3.5 py-2.5 text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-white p-0.5 shrink-0 shadow-sm flex items-center justify-center">
                        {idCardTrust?.logo ? (
                          <img src={idCardTrust.logo} alt="Trust Logo" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <Landmark className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold tracking-wide text-white leading-tight uppercase truncate" title={idCardTrust?.trust_name}>
                          {idCardTrust?.trust_name || 'Shree Chaudhary Parivar Trust'}
                        </h4>
                        <p className="text-[10px] font-normal text-slate-300 tracking-wider pt-0.5">
                          REG. NO: {idCardTrust?.registration_number || 'E/12345/GUJ'}
                        </p>
                      </div>
                    </div>

                    {/* Accent Strip & Level Badge */}
                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/10 text-[9px]">
                      <span className="font-medium text-amber-300 tracking-wider uppercase">
                        Identity Card
                      </span>
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[9px] uppercase tracking-wider bg-amber-400 text-slate-950 shadow-2xs">
                        {idCardMember.level_label || `${idCardMember.level} Level`}
                      </span>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500" />
                  </div>

                  {/* Member Profile Section */}
                  <div className="px-3.5 py-2.5 space-y-2">
                    {/* Photo with clean ring */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-xl p-0.5 bg-gradient-to-b from-blue-600/30 to-slate-300 shadow-sm">
                          <div className="w-full h-full rounded-[10px] overflow-hidden bg-slate-100 flex items-center justify-center">
                            {idCardMember.photo ? (
                              <img
                                src={idCardMember.photo}
                                alt={idCardMember.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-7 h-7 text-slate-400" />
                            )}
                          </div>
                        </div>
                        {idCardMember.is_verified && (
                          <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white shadow-xs" title="Verified Member">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name, Designation, and Card No */}
                    <div className="text-center space-y-0.5">
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                        {idCardMember.name}
                      </h3>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                          {idCardMember.designation}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-500 tracking-wide">
                        ID: <span className="text-slate-800 font-semibold">{idCardMember.card_number}</span>
                      </p>
                    </div>

                    {/* Details Grid */}
                    <div className="rounded-xl bg-slate-50/90 border border-slate-200/80 px-2.5 py-2 text-[11px] space-y-1">
                      {idCardMember.state_name && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 font-medium">State</span>
                          <span className="font-semibold text-slate-800">{idCardMember.state_name}</span>
                        </div>
                      )}
                      {idCardMember.district_name && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 font-medium">District</span>
                          <span className="font-semibold text-slate-800">{idCardMember.district_name}</span>
                        </div>
                      )}
                      {(idCardMember.taluka_name || idCardMember.village_name) && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 font-medium">Area / Village</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={[idCardMember.village_name, idCardMember.taluka_name].filter(Boolean).join(', ')}>
                            {[idCardMember.village_name, idCardMember.taluka_name].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {idCardMember.address && (
                        <div className="flex justify-between items-start gap-2 pt-0.5 border-t border-slate-200/60 text-[11px]">
                          <span className="text-slate-500 font-medium shrink-0">Address</span>
                          <span className="font-semibold text-slate-800 text-right leading-tight break-words max-w-[180px]">
                            {idCardMember.address}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-0.5 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-500 font-medium">Contact</span>
                        <span className="font-semibold text-slate-800">
                          {idCardMember.is_mobile_public ? idCardMember.mobile : '●●●●●●●●●●'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">Valid From</span>
                        <span className="font-semibold text-slate-700">
                          {idCardMember.term_start ? new Date(idCardMember.term_start).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Security Strip */}
                  <div className="px-3.5 py-1.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[9px] text-slate-500">
                    <span className="tracking-wider font-semibold">SECURE VERIFIED</span>
                    <span className="font-semibold text-slate-700">OFFICIAL MEMBER</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print / Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-[11px] text-text-secondary font-medium">Card No: {idCardMember.card_number}</span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsIdCardOpen(false)}>
                  Close
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handlePrintIdCard}
                  icon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print ID Card
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── ADD / EDIT COMMITTEE MEMBER MODAL ───────────────────────── */}
      {isMemberModalOpen && (
        <Modal
          isOpen={isMemberModalOpen}
          onClose={() => {
            setIsMemberModalOpen(false)
            setMemberErrors({})
          }}
          title={selectedMember ? 'Edit Committee Member' : (memberForm.membersList?.length > 1 ? `Add Committee Members (${memberForm.membersList.length})` : 'Add Committee Member')}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSaveMember} noValidate className="space-y-4 text-text">
            {/* Trust and Designation / Role side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Trust / Organization <span className="text-red-500">*</span>
                </label>
                <Select
                  value={memberForm.trust_id || ''}
                  error={Boolean(memberErrors.trust_id)}
                  onChange={(val) => {
                    clearMemberError('trust_id')
                    const tObj = trustsList.find(t => String(t._id || t.id) === String(val))
                    setMemberForm(prev => ({
                      ...prev,
                      trust_id: val,
                      trust_name: tObj?.trust_name || ''
                    }))
                  }}
                  options={trustDropdownOptions}
                  placeholder="Select Trust / Organization"
                />
                {memberErrors.trust_id && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">{memberErrors.trust_id}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Designation / Role <span className="text-red-500">*</span>
                </label>
                <Select
                  value={memberForm.designation || ''}
                  error={Boolean(memberErrors.designation)}
                  onChange={(val) => {
                    clearMemberError('designation')
                    const foundRole = rolesList.find(r => r.name === val || String(r.id) === String(val))
                    setMemberForm(prev => ({
                      ...prev,
                      role_id: foundRole ? foundRole.id : '',
                      designation: foundRole ? foundRole.name : val
                    }))
                  }}
                  options={roleDropdownOptions}
                  placeholder="Select Designation / Role"
                />
                {memberErrors.designation && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">{memberErrors.designation}</p>
                )}
              </div>
            </div>

            {/* Hierarchy Level Selector */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Organization Hierarchy Level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { key: 'national', label: 'National' },
                  { key: 'state', label: 'State' },
                  { key: 'district', label: 'District' },
                  { key: 'taluka', label: 'Taluka' },
                  { key: 'village', label: 'Village' }
                ].map(lvl => (
                  <button
                    key={lvl.key}
                    type="button"
                    onClick={() => {
                      setMemberErrors(prev => {
                        const copy = { ...prev }
                        delete copy.level
                        delete copy.state_id
                        delete copy.district_id
                        delete copy.taluka_id
                        delete copy.village_id
                        return copy
                      })
                      setMemberForm(prev => ({
                        ...prev,
                        level: lvl.key,
                        district_id: lvl.key === 'state' ? '' : prev.district_id,
                        taluka_id: ['state', 'district'].includes(lvl.key) ? '' : prev.taluka_id,
                        village_id: lvl.key !== 'village' ? '' : prev.village_id
                      }))
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs text-center transition-all cursor-pointer font-medium ${memberForm.level === lvl.key
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : memberErrors.level
                        ? 'border-red-500/70 bg-surface text-text-secondary hover:text-text'
                        : 'border-border bg-surface text-text-secondary hover:text-text'
                      }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
              {memberErrors.level && (
                <p className="text-[11px] text-red-500 font-medium mt-1">{memberErrors.level}</p>
              )}
            </div>

            {/* Cascading Location Selectors based on Level */}
            {memberForm.level !== 'national' && (
              <div className="p-3.5 rounded-xl bg-surface-secondary/40 border border-border space-y-3">
                <p className="text-xs font-semibold text-primary">Jurisdiction Area Assignment:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* State */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={memberForm.state_id || ''}
                      error={Boolean(memberErrors.state_id)}
                      onChange={(val) => {
                        clearMemberError('state_id')
                        const sObj = states.find(s => String(s._id || s.id) === String(val))
                        setMemberForm(prev => ({
                          ...prev,
                          state_id: val,
                          state_name: sObj?.name || sObj?.state || '',
                          district_id: '',
                          district_name: '',
                          taluka_id: '',
                          taluka_name: '',
                          village_id: '',
                          village_name: ''
                        }))
                      }}
                      placeholder="Select State"
                      options={states.map(s => ({ label: s.name || s.state, value: String(s._id || s.id) }))}
                    />
                    {memberErrors.state_id && (
                      <p className="text-[11px] text-red-500 font-medium mt-1">{memberErrors.state_id}</p>
                    )}
                  </div>

                  {/* District */}
                  {['district', 'taluka', 'village'].includes(memberForm.level) && (
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={memberForm.district_id || ''}
                        error={Boolean(memberErrors.district_id)}
                        onChange={(val) => {
                          clearMemberError('district_id')
                          const dObj = districts.find(d => String(d._id || d.id) === String(val))
                          setMemberForm(prev => ({
                            ...prev,
                            district_id: val,
                            district_name: dObj?.name || dObj?.district || '',
                            taluka_id: '',
                            taluka_name: '',
                            village_id: '',
                            village_name: ''
                          }))
                        }}
                        placeholder="Select District"
                        options={availableDistrictsForForm.map(d => ({ label: d.name || d.district, value: String(d._id || d.id) }))}
                      />
                      {memberErrors.district_id && (
                        <p className="text-[11px] text-red-500 font-medium mt-1">{memberErrors.district_id}</p>
                      )}
                    </div>
                  )}

                  {/* Taluka */}
                  {['taluka', 'village'].includes(memberForm.level) && (
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Taluka <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={memberForm.taluka_id || ''}
                        error={Boolean(memberErrors.taluka_id)}
                        onChange={(val) => {
                          clearMemberError('taluka_id')
                          const tObj = talukas.find(t => String(t._id || t.id) === String(val))
                          setMemberForm(prev => ({
                            ...prev,
                            taluka_id: val,
                            taluka_name: tObj?.name || tObj?.taluka || '',
                            village_id: '',
                            village_name: ''
                          }))
                        }}
                        placeholder="Select Taluka"
                        options={availableTalukasForForm.map(t => ({ label: t.name || t.taluka, value: String(t._id || t.id) }))}
                      />
                      {memberErrors.taluka_id && (
                        <p className="text-[11px] text-red-500 font-medium mt-1">{memberErrors.taluka_id}</p>
                      )}
                    </div>
                  )}

                  {/* Village */}
                  {memberForm.level === 'village' && (
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Village <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={memberForm.village_id || ''}
                        error={Boolean(memberErrors.village_id)}
                        onChange={(val) => {
                          clearMemberError('village_id')
                          const vObj = villages.find(v => String(v._id || v.id) === String(val))
                          setMemberForm(prev => ({
                            ...prev,
                            village_id: val,
                            village_name: vObj?.name || vObj?.village || ''
                          }))
                        }}
                        placeholder="Select Village"
                        options={availableVillagesForForm.map(v => ({ label: v.name || v.village, value: String(v._id || v.id) }))}
                      />
                      {memberErrors.village_id && (
                        <p className="text-[11px] text-red-500 font-medium mt-1">{memberErrors.village_id}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Residential / Office Address */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Address
              </label>
              <textarea
                rows={2}
                value={memberForm.address || ''}
                onChange={(e) => setMemberForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter complete residential / office address..."
                className="w-full p-2.5 rounded-lg bg-surface border border-border text-xs text-text focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Term / Tenure & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Term Start Date</label>
                <DatePicker
                  value={memberForm.term_start || ''}
                  onChange={(val) => {
                    setMemberForm(prev => {
                      const updated = { ...prev, term_start: val }
                      if (val && prev.term_end) {
                        const start = new Date(val).getTime()
                        const end = new Date(prev.term_end).getTime()
                        if (!isNaN(start) && !isNaN(end) && end < start) {
                          updated.term_end = ''
                        }
                      }
                      return updated
                    })
                  }}
                  placeholder="Start Date"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Term End Date</label>
                <DatePicker
                  value={memberForm.term_end || ''}
                  minDate={memberForm.term_start || undefined}
                  onChange={(val) => setMemberForm(prev => ({ ...prev, term_end: val }))}
                  placeholder="End Date"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Tenure Status</label>
                <Select
                  value={memberForm.tenure_status || 'active'}
                  onChange={(val) => setMemberForm(prev => ({ ...prev, tenure_status: val }))}
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Replaced', value: 'replaced' }
                  ]}
                />
              </div>
            </div>

            {/* Privacy & Verification Options */}
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={memberForm.is_mobile_public !== false}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, is_mobile_public: e.target.checked }))}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span>Make Mobile Number Public</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={memberForm.is_verified !== false}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, is_verified: e.target.checked }))}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span>Verified Committee Member</span>
              </label>
            </div>

            {/* ── MULTIPLE MEMBERS SECTION (Image, Full Name, Member ID, Mobile) ── */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{selectedMember ? 'Member Information' : `Committee Members (${memberForm.membersList?.length || 1})`}</span>
                </label>
                {!selectedMember && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMemberForm(prev => ({
                        ...prev,
                        membersList: [
                          ...(prev.membersList || []),
                          {
                            id: Date.now() + Math.random(),
                            name: '',
                            member_id: '',
                            mobile: '',
                            photo: '',
                            photoFile: null,
                            photoPreview: ''
                          }
                        ]
                      }))
                    }}
                    icon={<Plus className="w-3.5 h-3.5 text-primary" />}
                    className="h-8 text-xs font-semibold"
                  >
                    Add Another Member
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {(memberForm.membersList || []).map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="p-3.5 rounded-xl bg-surface-secondary/40 border border-border space-y-3 relative transition-all"
                  >
                    {!selectedMember && (memberForm.membersList?.length || 1) > 1 && (
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span>Member #{idx + 1}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setMemberErrors(prev => {
                              const updated = {}
                              Object.keys(prev).forEach(k => {
                                const match = k.match(/^(name|mobile)_(\d+)$/)
                                if (match) {
                                  const [_, field, indexStr] = match
                                  const errorIdx = parseInt(indexStr, 10)
                                  if (errorIdx < idx) {
                                    updated[k] = prev[k]
                                  } else if (errorIdx > idx) {
                                    updated[`${field}_${errorIdx - 1}`] = prev[k]
                                  }
                                } else {
                                  updated[k] = prev[k]
                                }
                              })
                              return updated
                            })
                            setMemberForm(prev => ({
                              ...prev,
                              membersList: prev.membersList.filter((_, i) => i !== idx)
                            }))
                          }}
                          className="text-text-secondary hover:text-red-500 p-1 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                      {/* Image / Photo Upload */}
                      <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-surface border border-border">
                        <div className="w-14 h-14 rounded-lg bg-surface-secondary border border-border overflow-hidden flex items-center justify-center mb-1.5">
                          {m.photoPreview || m.photo ? (
                            <img
                              src={m.photoPreview || m.photo}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Upload className="w-5 h-5 text-primary/60" />
                          )}
                        </div>
                        <label className="cursor-pointer text-[10.5px] font-semibold text-primary hover:underline">
                          <span>{m.photoPreview || m.photo ? 'Change Image' : 'Upload Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const newPreview = URL.createObjectURL(file)
                                setMemberForm(prev => ({
                                  ...prev,
                                  membersList: (prev.membersList || []).map((item, i) =>
                                    i === idx
                                      ? { ...item, photoFile: file, photoPreview: newPreview }
                                      : item
                                  )
                                }))
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Member Details: Full Name, Member ID, Mobile */}
                      <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-xs font-semibold text-text-secondary mb-1">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={m.name || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              clearMemberError(`name_${idx}`)
                              setMemberForm(prev => ({
                                ...prev,
                                membersList: (prev.membersList || []).map((item, i) =>
                                  i === idx ? { ...item, name: val } : item
                                )
                              }))
                            }}
                            placeholder="e.g. Ramesh Chaudhary"
                            className={`w-full h-9 px-3 rounded-lg bg-surface border ${memberErrors[`name_${idx}`] ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
                              } text-xs text-text focus:outline-none`}
                          />
                          {memberErrors[`name_${idx}`] && (
                            <p className="text-[11px] text-red-500 font-medium mt-1">{memberErrors[`name_${idx}`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-text-secondary mb-1">
                            Member ID / Registration
                          </label>
                          <input
                            type="text"
                            value={m.member_id || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              setMemberForm(prev => ({
                                ...prev,
                                membersList: (prev.membersList || []).map((item, i) =>
                                  i === idx ? { ...item, member_id: val } : item
                                )
                              }))
                            }}
                            placeholder="e.g. M-1042"
                            className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-xs text-text focus:outline-none focus:border-primary/50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-text-secondary mb-1">
                            Mobile Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={m.mobile || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              clearMemberError(`mobile_${idx}`)
                              setMemberForm(prev => ({
                                ...prev,
                                membersList: (prev.membersList || []).map((item, i) =>
                                  i === idx ? { ...item, mobile: val } : item
                                )
                              }))
                            }}
                            placeholder="+91 98765 43210"
                            className={`w-full h-9 px-3 rounded-lg bg-surface border ${memberErrors[`mobile_${idx}`] ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
                              } text-xs text-text focus:outline-none`}
                          />
                          {memberErrors[`mobile_${idx}`] && (
                            <p className="text-[11px] text-red-500 font-medium mt-1">{memberErrors[`mobile_${idx}`]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsMemberModalOpen(false)
                  setMemberErrors({})
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={memberSaving}>
                {selectedMember ? 'Save Changes' : (memberForm.membersList?.length > 1 ? `Add ${memberForm.membersList.length} Members` : 'Add Member')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── ADD / EDIT TRUST MODAL ───────────────────────────────── */}
      {isTrustModalOpen && (
        <Modal
          isOpen={isTrustModalOpen}
          onClose={() => {
            setIsTrustModalOpen(false)
            setTrustErrors({})
          }}
          title={trustModalMode === 'add' ? 'Add New Trust' : 'Edit Trust Details'}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveTrust} noValidate className="space-y-4 text-text">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Trust Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={trustForm.trust_name || ''}
                  onChange={(e) => {
                    clearTrustError('trust_name')
                    setTrustForm(prev => ({ ...prev, trust_name: e.target.value }))
                  }}
                  placeholder="e.g. Shree Chaudhary Parivar Charitable Trust"
                  className={`w-full h-10 px-3 rounded-lg bg-surface border ${trustErrors.trust_name ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
                    } text-xs text-text focus:outline-none`}
                />
                {trustErrors.trust_name && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">{trustErrors.trust_name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={trustForm.registration_number || ''}
                  onChange={(e) => {
                    clearTrustError('registration_number')
                    setTrustForm(prev => ({ ...prev, registration_number: e.target.value }))
                  }}
                  placeholder="e.g. E/12345/GUJ"
                  className={`w-full h-10 px-3 rounded-lg bg-surface border ${trustErrors.registration_number ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
                    } text-xs text-text focus:outline-none`}
                />
                {trustErrors.registration_number && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">{trustErrors.registration_number}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Registration Date
                </label>
                <DatePicker
                  value={trustForm.registration_date ? new Date(trustForm.registration_date).toISOString().split('T')[0] : ''}
                  onChange={(val) => setTrustForm(prev => ({ ...prev, registration_date: val }))}
                  placeholder="Select Date"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Trust Classification
                </label>
                <input
                  type="text"
                  value={trustForm.trust_type || ''}
                  onChange={(e) => setTrustForm(prev => ({ ...prev, trust_type: e.target.value }))}
                  placeholder="e.g. Charitable & Social Welfare Trust"
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Head Office Address
                </label>
                <textarea
                  rows={2}
                  value={trustForm.head_office_address || ''}
                  onChange={(e) => setTrustForm(prev => ({ ...prev, head_office_address: e.target.value }))}
                  placeholder="Full office address with state and city"
                  className="w-full p-3 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Purpose & Objectives
                </label>
                <textarea
                  rows={3}
                  value={trustForm.purpose || ''}
                  onChange={(e) => setTrustForm(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Core social and community welfare objectives..."
                  className="w-full p-3 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={trustForm.contact_number || ''}
                  onChange={(e) => setTrustForm(prev => ({ ...prev, contact_number: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Contact Email</label>
                <input
                  type="email"
                  value={trustForm.contact_email || ''}
                  onChange={(e) => setTrustForm(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="trust@chaudharyparivar.org"
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* ── BANK & DONATION DETAILS ── */}
              <div className="sm:col-span-2 pt-3 border-t border-border space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-bold text-text uppercase tracking-wide">
                    Bank & Donation Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={trustForm.bank_name || ''}
                      onChange={(e) => setTrustForm(prev => ({ ...prev, bank_name: e.target.value }))}
                      placeholder="e.g. State Bank of India"
                      className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={trustForm.account_name || ''}
                      onChange={(e) => setTrustForm(prev => ({ ...prev, account_name: e.target.value }))}
                      placeholder="e.g. Shree Chaudhary Parivar Trust"
                      className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={trustForm.account_number || ''}
                      onChange={(e) => setTrustForm(prev => ({ ...prev, account_number: e.target.value }))}
                      placeholder="e.g. 123456789012"
                      className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:border-primary/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={trustForm.ifsc_code || ''}
                      onChange={(e) => setTrustForm(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                      placeholder="e.g. SBIN0001234"
                      className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:border-primary/50 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={trustForm.branch || ''}
                      onChange={(e) => setTrustForm(prev => ({ ...prev, branch: e.target.value }))}
                      placeholder="e.g. Gandhinagar Main Branch"
                      className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      UPI ID / Payment Link
                    </label>
                    <input
                      type="text"
                      value={trustForm.upi_id || ''}
                      onChange={(e) => setTrustForm(prev => ({ ...prev, upi_id: e.target.value }))}
                      placeholder="e.g. trust@sbi"
                      className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Donation QR Code Upload */}
                  <div className="sm:col-span-2 flex items-center gap-4 p-3 rounded-xl bg-surface-secondary/40 border border-border">
                    <div className="w-16 h-16 rounded-lg bg-surface border border-border overflow-hidden flex items-center justify-center shrink-0">
                      {trustForm.qrPreview || trustForm.qr_code ? (
                        <img
                          src={trustForm.qrPreview || trustForm.qr_code}
                          alt="QR Code"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <QrCode className="w-7 h-7 text-primary/60" />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text mb-0.5">
                        Payment / Donation QR Code
                      </label>
                      <p className="text-[11px] text-text-secondary mb-1.5">
                        Upload bank UPI or QR code image for trust donations.
                      </p>
                      <label className="cursor-pointer text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{trustForm.qrPreview || trustForm.qr_code ? 'Change QR Image' : 'Upload QR Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setTrustForm(prev => ({
                                ...prev,
                                qrFile: file,
                                qrPreview: URL.createObjectURL(file)
                              }))
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsTrustModalOpen(false)
                  setTrustErrors({})
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={trustSaving}>
                {trustModalMode === 'add' ? 'Add Trust' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
