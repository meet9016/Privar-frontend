import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { normalizeRoleId } from '../lib/roles'
import api, { getCommunitySurname, formatDate } from '../lib/api'
import { MEMBER_ENDPOINTS } from '../utils/endpoints'
import Input from './common/Input'
import Select from './common/Select'
import Switch from './common/Switch'
import Button from './common/Button'
import DatePicker from './DatePicker'
import { isValidEmail } from '../lib/validation'
import { Users as UsersIcon, Plus, Trash2, User, ChevronDown, ChevronUp, Edit2, Check } from 'lucide-react'

let cachedMasters = null;
let mastersPromise = null;

const RELATION_GENDER_MAP = {
  Spouse: 'Female',
  Wife: 'Female',
  Husband: 'Male',
  Mother: 'Female',
  Father: 'Male',
  Daughter: 'Female',
  Son: 'Male',
  Sister: 'Female',
  Brother: 'Male',
  Grandmother: 'Female',
  Grandfather: 'Male',
  Aunt: 'Female',
  Uncle: 'Male',
  'Daughter-in-law': 'Female',
  'Son-in-law': 'Male',
  Granddaughter: 'Female',
  Grandson: 'Male'
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ label: bg, value: bg }))

const RELATION_OPTIONS = [
  'Spouse',
  'Son',
  'Daughter',
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'Uncle',
  'Aunt',
  'Daughter-in-law',
  'Son-in-law',
  'Grandson',
  'Granddaughter',
  'Other'
].map(rel => ({ label: rel, value: rel }))

const GENDER_OPTIONS = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
]

export const capitalizeWords = (str) => {
  if (!str) return ''
  return str
    .toString()
    .trim()
    .split(/\s+/)
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
    .join(' ')
}

export default function UserForm({ user, roles = [], onSubmit, isLoading, onCancel }) {
  const { user: loggedInUser } = useContext(AuthContext)
  const [countries, setCountries] = useState(cachedMasters ? cachedMasters.countries : [])
  const [states, setStates] = useState(cachedMasters ? cachedMasters.states : [])
  const [cities, setCities] = useState(cachedMasters ? cachedMasters.cities : [])
  const [villages, setVillages] = useState(cachedMasters ? cachedMasters.villages : [])

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    number: '',
    gender: 'Male',
    dob: '',
    anniversary: '',
    blood_group: '',
    relation: 'Self',
    is_committee: false,
    committee_role: '',
    role_id: '',
    country_id: '',
    state_id: '',
    city_id: '',
    village: '',
    address: '',
    status: 1
  })
  const [errors, setErrors] = useState({})

  // Family Members under this Head
  const [members, setMembers] = useState([])
  const [deletedMemberIds, setDeletedMemberIds] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [expandedMemberIndex, setExpandedMemberIndex] = useState(null)
  const [editingMember, setEditingMember] = useState(null)

  useEffect(() => {
    const fetchMasters = async () => {
      if (cachedMasters) {
        setCountries(cachedMasters.countries)
        setStates(cachedMasters.states)
        setCities(cachedMasters.cities)
        setVillages(cachedMasters.villages)
        return
      }

      if (!mastersPromise) {
        mastersPromise = Promise.all([
          api.get(MEMBER_ENDPOINTS.MASTERS_COUNTRY),
          api.get(MEMBER_ENDPOINTS.MASTERS_STATE),
          api.get(MEMBER_ENDPOINTS.MASTERS_CITY),
          api.get(MEMBER_ENDPOINTS.MASTERS_VILLAGE).catch(() => ({ data: { data: [] } }))
        ])
      }

      try {
        const [cRes, sRes, ciRes, vRes] = await mastersPromise
        const countryList = cRes.data?.data || []

        cachedMasters = {
          countries: countryList,
          states: sRes.data?.data || [],
          cities: ciRes.data?.data || [],
          villages: vRes.data?.data || []
        }

        setCountries(cachedMasters.countries)
        setStates(cachedMasters.states)
        setCities(cachedMasters.cities)
        setVillages(cachedMasters.villages)

        // If country not yet selected, default to India
        setFormData(prev => {
          if (!prev.country_id) {
            const india = countryList.find(c => /india/i.test(c.name))
            if (india) {
              return { ...prev, country_id: india._id || india.id }
            }
          }
          return prev
        })
      } catch (err) {
        console.error(err)
      }
    }
    fetchMasters()
  }, [])

  useEffect(() => {
    if (user) {
      let formattedDob = ''
      let formattedAnniversary = ''
      if (user.dob) {
        const d = new Date(user.dob)
        if (!isNaN(d.getTime())) formattedDob = d.toISOString().slice(0, 10)
      }
      if (user.anniversary) {
        const d = new Date(user.anniversary)
        if (!isNaN(d.getTime())) formattedAnniversary = d.toISOString().slice(0, 10)
      }

      setFormData({
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name !== undefined ? user.last_name : (getCommunitySurname() || ''),
        email: user.email || '',
        number: user.number || '',
        gender: user.gender || 'Male',
        dob: formattedDob,
        anniversary: formattedAnniversary,
        blood_group: user.blood_group || '',
        relation: 'Self',
        is_committee: user.is_committee || false,
        committee_role: user.committee_role || '',
        role_id: normalizeRoleId(user.role_id),
        country_id: user.country_id || '',
        state_id: user.state_id || '',
        city_id: user.city_id || '',
        village: user.village || user.village_id || '',
        address: user.address || '',
        status: user.status !== undefined ? Number(user.status) : 1
      })

      // Fetch family members if editing an existing user
      const headId = user.id || user._id
      if (headId) {
        setMembersLoading(true)
        api.get(MEMBER_ENDPOINTS.GET_FAMILY_MEMBERS(headId))
          .then(res => {
            const rawList = res.data?.data || res.data || []
            const childMembers = rawList.filter(m => {
              const mId = String(m.id || m._id)
              return mId !== String(headId) && m.relation !== 'Self'
            }).map(m => {
              let mDob = ''
              let mAnniversary = ''
              if (m.dob) {
                const d = new Date(m.dob)
                if (!isNaN(d.getTime())) mDob = d.toISOString().slice(0, 10)
              }
              if (m.anniversary) {
                const d = new Date(m.anniversary)
                if (!isNaN(d.getTime())) mAnniversary = d.toISOString().slice(0, 10)
              }
              return {
                _id: m.id || m._id,
                first_name: m.first_name || '',
                middle_name: m.middle_name || '',
                last_name: m.last_name || '',
                relation: m.relation || 'Spouse',
                gender: m.gender || 'Male',
                dob: mDob,
                anniversary: mAnniversary,
                blood_group: m.blood_group || '',
                number: m.number || '',
                email: m.email || '',
                status: m.status !== undefined ? Number(m.status) : 1
              }
            })
            setMembers(childMembers)
          })
          .catch(err => console.error('Failed to fetch family members', err))
          .finally(() => setMembersLoading(false))
      }
    } else {
      const india = countries.find(c => /india/i.test(c.name))
      const defaultCommunityName = getCommunitySurname() || ''

      setFormData({
        first_name: '',
        middle_name: '',
        last_name: defaultCommunityName,
        email: '',
        number: '',
        gender: 'Male',
        dob: '',
        anniversary: '',
        blood_group: '',
        relation: 'Self',
        is_committee: false,
        committee_role: '',
        role_id: '',
        country_id: india ? (india._id || india.id) : '',
        state_id: '',
        city_id: '',
        village: '',
        address: '',
        status: 1
      })
      setMembers([])
      setDeletedMemberIds([])
      setExpandedMemberIndex(null)
    }
  }, [user, countries])

  const activeRoles = useMemo(() => roles.filter((role) => Number(role.status ?? 1) === 1), [roles])
  const isEditingSelf = Boolean(user && loggedInUser && [
    user._id,
    user.id,
    user.member_id
  ].some((value) => value && [
    loggedInUser._id,
    loggedInUser.id,
    loggedInUser.member_id
  ].some((current) => current && String(current) === String(value))))
  const canManageRoleFields = Boolean(
    loggedInUser?.role === 'admin' ||
    loggedInUser?.role === 'superadmin' ||
    loggedInUser?.committee_role === 'President' ||
    loggedInUser?.committee_role === 'Admin' ||
    loggedInUser?.is_super_admin ||
    Boolean(loggedInUser?.role_id)
  )

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => {
      const updated = { ...prev }
      if (field === 'first_name' && value.trim()) delete updated.first_name
      if (field === 'middle_name' && value.trim()) delete updated.middle_name
      if (field === 'last_name' && value.trim()) delete updated.last_name
      if (field === 'number' && value.trim().length === 10) delete updated.number
      if (field === 'email') {
        if (value.trim() && !isValidEmail(value)) updated.email = 'Please enter a valid email'
        else delete updated.email
      }
      if (field === 'country_id' && value) delete updated.country_id
      if (field === 'state_id' && value) delete updated.state_id
      if (field === 'city_id' && value) delete updated.city_id
      if (field === 'address' && value.trim()) delete updated.address
      if (field === 'dob' && value) delete updated.dob
      return updated
    })
  }

  // --- Dynamic Family Members Handlers ---
  const handleAddMember = () => {
    // If another member was being edited, commit it first
    let currentMembers = [...members]
    if (expandedMemberIndex !== null && editingMember && currentMembers[expandedMemberIndex]) {
      currentMembers[expandedMemberIndex] = { ...editingMember }
    }

    const defaultLastName = formData.last_name || getCommunitySurname() || ''
    const defaultMiddleName = formData.first_name || ''
    const newIdx = currentMembers.length
    const newMemberObj = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      first_name: '',
      middle_name: defaultMiddleName,
      last_name: defaultLastName,
      relation: 'Spouse',
      gender: 'Female',
      dob: '',
      anniversary: '',
      blood_group: '',
      number: '',
      email: '',
      status: 1
    }

    setMembers([...currentMembers, newMemberObj])
    setExpandedMemberIndex(newIdx)
    setEditingMember({ ...newMemberObj })
  }

  const handleEditingMemberChange = (field, value) => {
    setEditingMember(prev => {
      if (!prev) return prev
      const current = { ...prev, [field]: value }

      // Auto set gender when relationship changes
      if (field === 'relation') {
        const mappedGender = RELATION_GENDER_MAP[value]
        if (mappedGender) {
          current.gender = mappedGender
        }
      }

      return current
    })
  }

  const handleDoneEditing = () => {
    if (expandedMemberIndex !== null && editingMember) {
      const sanitized = {
        ...editingMember,
        first_name: capitalizeWords(editingMember.first_name),
        middle_name: capitalizeWords(editingMember.middle_name),
        last_name: capitalizeWords(editingMember.last_name)
      }
      setMembers(prev => {
        const updated = [...prev]
        if (updated[expandedMemberIndex]) {
          updated[expandedMemberIndex] = sanitized
        }
        return updated
      })
    }
    setExpandedMemberIndex(null)
    setEditingMember(null)
  }

  const handleRemoveMember = (index, e) => {
    if (e) e.stopPropagation()
    const target = members[index]
    if (target?._id) {
      setDeletedMemberIds(prev => [...prev, target._id])
    }
    setMembers(prev => prev.filter((_, i) => i !== index))
    if (expandedMemberIndex === index) {
      setExpandedMemberIndex(null)
      setEditingMember(null)
    } else if (expandedMemberIndex > index) {
      setExpandedMemberIndex(expandedMemberIndex - 1)
    }
  }

  const toggleExpandMember = (index) => {
    if (expandedMemberIndex === index) {
      // Done / collapse current member
      handleDoneEditing()
    } else {
      // Commit previous member if open
      let currentMembers = [...members]
      if (expandedMemberIndex !== null && editingMember && currentMembers[expandedMemberIndex]) {
        currentMembers[expandedMemberIndex] = {
          ...editingMember,
          first_name: capitalizeWords(editingMember.first_name),
          middle_name: capitalizeWords(editingMember.middle_name),
          last_name: capitalizeWords(editingMember.last_name)
        }
        setMembers(currentMembers)
      }
      setExpandedMemberIndex(index)
      setEditingMember(currentMembers[index] ? { ...currentMembers[index] } : null)
    }
  }

  const validate = (membersToValidate = members) => {
    const newErrors = {}
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required'
    if (!formData.middle_name.trim()) newErrors.middle_name = 'Middle name is required'
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required'
    if (!formData.number.trim()) newErrors.number = 'Mobile number is required'
    else if (formData.number.trim().length < 10) newErrors.number = '10 digits required'
    if (formData.email.trim() && !isValidEmail(formData.email)) newErrors.email = 'Valid email required'

    if (!formData.country_id) newErrors.country_id = 'Country is required'
    if (!formData.state_id) newErrors.state_id = 'State is required'
    if (!formData.city_id) newErrors.city_id = 'City is required'
    if (!formData.dob) newErrors.dob = 'Date of Birth is required'

    // Validate family members if any are added
    membersToValidate.forEach((m, idx) => {
      if (!m.first_name || !m.first_name.trim()) {
        newErrors[`member_${idx}_first_name`] = 'Required'
      }
      if (!m.relation) {
        newErrors[`member_${idx}_relation`] = 'Required'
      }
      if (m.number && m.number.trim().length > 0 && m.number.trim().length < 10) {
        newErrors[`member_${idx}_number`] = '10 digits'
      }
    })

    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // First commit any active editing member buffer into effective members array
    let currentMembers = [...members]
    if (expandedMemberIndex !== null && editingMember && currentMembers[expandedMemberIndex]) {
      currentMembers[expandedMemberIndex] = {
        ...editingMember,
        first_name: capitalizeWords(editingMember.first_name),
        middle_name: capitalizeWords(editingMember.middle_name),
        last_name: capitalizeWords(editingMember.last_name)
      }
      setMembers(currentMembers)
    }

    const newErrors = validate(currentMembers)
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // If error belongs to a member, expand that member
      const memberErrKey = Object.keys(newErrors).find(k => k.startsWith('member_'))
      if (memberErrKey) {
        const errIdx = parseInt(memberErrKey.split('_')[1], 10)
        if (!isNaN(errIdx)) {
          setExpandedMemberIndex(errIdx)
          setEditingMember(currentMembers[errIdx] ? { ...currentMembers[errIdx] } : null)
        }
      }
      return
    }

    const payload = {
      ...formData,
      first_name: capitalizeWords(formData.first_name),
      middle_name: capitalizeWords(formData.middle_name),
      last_name: capitalizeWords(formData.last_name),
      familyHead: true,
      relation: 'Self',
      members: currentMembers.map(m => ({
        ...(m._id ? { _id: m._id } : {}),
        first_name: capitalizeWords(m.first_name),
        middle_name: capitalizeWords(m.middle_name),
        last_name: capitalizeWords(m.last_name || formData.last_name),
        relation: m.relation || 'Other',
        gender: m.gender || 'Male',
        dob: m.dob || null,
        anniversary: m.anniversary || null,
        blood_group: m.blood_group || '',
        number: (m.number || '').trim(),
        email: (m.email || '').trim(),
        status: m.status !== undefined ? Number(m.status) : 1
      })),
      deletedMemberIds
    }

    if (!canManageRoleFields || isEditingSelf) {
      delete payload.role_id
      delete payload.committee_role
      delete payload.is_committee
    }

    onSubmit(payload)
  }

  // Formatting options for Select components
  const countryOptions = countries.map(c => ({ label: c.name, value: c._id || c.id }))
  const stateOptions = states.map(s => ({ label: s.name, value: s._id || s.id }))
  const cityOptions = cities.map(c => ({ label: c.name, value: c._id || c.id }))
  const villageOptions = villages.map(v => ({ label: v.name, value: v.name }))
  const roleOptions = [
    { label: 'Select Assigned Role (Optional)', value: '' },
    ...activeRoles.map(r => ({ label: r.name, value: r.id || String(r._id) }))
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-0.5 text-text">
      
      {/* ─── SECTION 1: FAMILY HEAD DETAILS (COMPACT 4 ITEMS PER LINE) ─────────── */}
      <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              <User className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-text uppercase tracking-wide">Family Head Details   </h3>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold">
            Family Head
          </span>
        </div>

        {/* Row 1: Name & Mobile (4 inputs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <Input
            label="First Name"
            placeholder="Head First Name"
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
            disabled={isLoading}
            required={true}
            error={errors.first_name}
          />
          <Input
            label="Middle Name"
            placeholder="Middle Name"
            value={formData.middle_name}
            onChange={(e) => handleChange('middle_name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
            disabled={isLoading}
            required={true}
            error={errors.middle_name}
          />
          <Input
            label="Last Name / Surname"
            placeholder="Surname"
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
            disabled={isLoading}
            required={true}
            error={errors.last_name}
          />
          <Input
            label="Mobile Number"
            type="tel"
            maxLength={10}
            placeholder="10 digit mobile"
            value={formData.number}
            onChange={(e) => handleChange('number', e.target.value.replace(/\D/g, '').slice(0, 10))}
            disabled={isLoading}
            required={true}
            error={errors.number}
          />
        </div>

        {/* Row 2: Email, Blood Group, Gender, Assign Role (4 inputs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <Input
            label="Email Address"
            type="email"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={isLoading}
            required={false}
            error={errors.email}
          />
          <Select
            label="Blood Group"
            value={formData.blood_group}
            onChange={(val) => handleChange('blood_group', val)}
            options={[{ label: 'Select Blood Group', value: '' }, ...BLOOD_GROUPS]}
            disabled={isLoading}
            searchable={true}
          />
          <Select
            label="Gender"
            value={formData.gender}
            onChange={(val) => handleChange('gender', val)}
            options={GENDER_OPTIONS}
            disabled={isLoading}
            searchable={false}
          />
          {canManageRoleFields ? (
            <Select
              label="Assign Role"
              value={formData.role_id}
              onChange={(val) => handleChange('role_id', val)}
              options={roleOptions}
              placeholder="Select Role (Optional)"
              disabled={isLoading}
              searchable={true}
            />
          ) : (
            <div className="hidden md:block" />
          )}
        </div>

        {/* Row 3: Country, State, City, Village (4 inputs in 1 line) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <Select
            label="Country"
            value={formData.country_id}
            onChange={(val) => handleChange('country_id', val)}
            options={countryOptions}
            required={true}
            error={errors.country_id}
            placeholder="Select Country"
            searchable={true}
          />
          <Select
            label="State"
            value={formData.state_id}
            onChange={(val) => handleChange('state_id', val)}
            options={stateOptions}
            required={true}
            error={errors.state_id}
            placeholder="Select State"
            searchable={true}
          />
          <Select
            label="City"
            value={formData.city_id}
            onChange={(val) => handleChange('city_id', val)}
            options={cityOptions}
            required={true}
            error={errors.city_id}
            placeholder="Select City"
            searchable={true}
          />
          {villageOptions.length > 0 ? (
            <Select
              label="Village"
              value={formData.village}
              onChange={(val) => handleChange('village', val)}
              options={[{ label: 'Select Village', value: '' }, ...villageOptions]}
              placeholder="Select Village"
              searchable={true}
              disabled={isLoading}
            />
          ) : (
            <Input
              label="Village"
              value={formData.village}
              onChange={(e) => handleChange('village', e.target.value)}
              placeholder="Enter Village"
              disabled={isLoading}
            />
          )}
        </div>

        {/* Row 4: Date of Birth, Anniversary Date, Address, Status (4 inputs/columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 items-end">
          <DatePicker
            label="Date of Birth"
            required
            value={formData.dob}
            onChange={(val) => handleChange('dob', val)}
            disabled={isLoading}
            placeholder="Select DOB"
            error={errors.dob}
          />
          <DatePicker
            label="Anniversary Date"
            value={formData.anniversary}
            onChange={(val) => handleChange('anniversary', val)}
            disabled={isLoading}
            placeholder="Select Anniversary"
          />
          <Input
            label="Address"
            placeholder="Address (Area, Street)"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            disabled={isLoading}
          />
          <Switch
            label="Status"
            checked={Number(formData.status ?? 1) === 1}
            onChange={(val) => handleChange('status', val ? 1 : 0)}
            disabled={isLoading}
            activeLabel="Active"
            inactiveLabel="Inactive"
          />
        </div>
      </div>

      {/* ─── SECTION 2: DYNAMIC FAMILY MEMBERS (SINGLE-LINE TABLE + SLIDE-DOWN EDIT) ─── */}
      <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold">
              <UsersIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-text uppercase tracking-wide">Family Members</h3>
              <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                {members.length}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddMember}
            className="flex items-center gap-1 py-1 px-2.5 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer shadow-xs font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </Button>
        </div>

        {membersLoading ? (
          <div className="py-6 text-center text-xs text-text-secondary font-medium">
            Loading family members...
          </div>
        ) : members.length === 0 ? (
          <div className="py-6 px-3 rounded-lg border border-dashed border-border/80 text-center bg-surface/30">
            <p className="text-xs font-semibold text-text">No family members added</p>
            <p className="text-[11px] text-text-secondary mt-0.5 mb-2.5">Click Add Member to register spouse, children, or parents under this head</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMember}
              className="inline-flex items-center gap-1 text-xs text-primary border-primary/30 hover:bg-primary/10 py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </Button>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden shadow-xs divide-y divide-border">
            {/* Table Header Row */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3.5 py-2 bg-surface-secondary text-[11px] font-bold text-text-secondary uppercase tracking-wider items-center">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Relation</div>
              <div className="col-span-1">Gender</div>
              <div className="col-span-2">DOB</div>
              <div className="col-span-1 text-center">Blood</div>
              <div className="col-span-1">Mobile</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Member Rows */}
            {members.map((m, idx) => {
              const isExpanded = expandedMemberIndex === idx
              const fNameErr = errors[`member_${idx}_first_name`]
              const relErr = errors[`member_${idx}_relation`]
              const numErr = errors[`member_${idx}_number`]
              const hasRowError = fNameErr || relErr || numErr

              return (
                <div key={m._id || m.id || idx} className="bg-card transition-colors">
                  {/* Single Line Member Row Summary */}
                  <div
                    onClick={() => toggleExpandMember(idx)}
                    className={`grid grid-cols-1 sm:grid-cols-12 gap-2 items-center px-3.5 py-2.5 cursor-pointer hover:bg-surface-secondary/60 transition-colors ${
                      isExpanded ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    } ${hasRowError ? 'bg-error-bg/30 border-l-4 border-l-red-500' : ''}`}
                  >
                    {/* Index */}
                    <div className="col-span-1 flex items-center gap-1.5 sm:justify-center">
                      <span className="w-5 h-5 rounded-full bg-surface-secondary border border-border text-[11px] font-bold text-text flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="col-span-3 min-w-0">
                      <span className="text-xs font-bold text-text truncate block">
                        {[capitalizeWords(m.first_name), capitalizeWords(m.middle_name), capitalizeWords(m.last_name)].filter(Boolean).join(' ') || (
                          <span className="text-text-secondary italic">New Member (Click to edit)</span>
                        )}
                      </span>
                    </div>

                    {/* Relation */}
                    <div className="col-span-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold">
                        {m.relation || 'Relation'}
                      </span>
                    </div>

                    {/* Gender (separate column) */}
                    <div className="col-span-1 text-xs text-text-secondary font-medium">
                      {m.gender || '-'}
                    </div>

                    {/* DOB (separate column) */}
                    <div className="col-span-2 text-xs text-text-secondary font-medium truncate">
                      {m.dob ? formatDate(m.dob) : '-'}
                    </div>

                    {/* Blood Group (separate column) */}
                    <div className="col-span-1 text-center">
                      {m.blood_group ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          {m.blood_group}
                        </span>
                      ) : (
                        <span className="text-text-secondary text-xs">-</span>
                      )}
                    </div>

                    {/* Mobile */}
                    <div className="col-span-1 text-xs text-text font-medium truncate">
                      {m.number || <span className="text-text-secondary">-</span>}
                    </div>

                    {/* Action buttons (matching Users table icon buttons) */}
                    <div className="col-span-1 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleExpandMember(idx)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                          isExpanded
                            ? 'text-white bg-primary border-primary shadow-xs'
                            : 'text-primary hover:text-primary bg-primary/10 hover:bg-primary/20 border-primary/20'
                        }`}
                        title={isExpanded ? 'Done editing' : 'Edit member'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleRemoveMember(idx, e)}
                        className="p-1.5 text-error-text hover:text-error-text bg-error-bg/60 hover:bg-error-bg border border-error-border rounded-xl transition-all cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Slide-Down Inline Edit Form (Accordion) */}
                  {isExpanded && editingMember && (
                    <div className="p-3.5 sm:p-4 bg-surface/50 border-t border-b border-border/80 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          <Edit2 className="w-3 h-3" /> Edit Details for Member #{idx + 1}
                        </span>
                      </div>

                      {/* Row 1: First, Middle, Last, Relation (4 inputs) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        <Input
                          label="First Name"
                          placeholder="First Name"
                          value={editingMember.first_name || ''}
                          onChange={(e) => handleEditingMemberChange('first_name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                          disabled={isLoading}
                          required={true}
                          error={fNameErr}
                        />
                        <Input
                          label="Middle Name"
                          placeholder="Middle Name"
                          value={editingMember.middle_name || ''}
                          onChange={(e) => handleEditingMemberChange('middle_name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                          disabled={isLoading}
                        />
                        <Input
                          label="Last Name / Surname"
                          placeholder="Surname"
                          value={editingMember.last_name || ''}
                          onChange={(e) => handleEditingMemberChange('last_name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                          disabled={isLoading}
                        />
                        <Select
                          label="Relationship with Head"
                          value={editingMember.relation || 'Spouse'}
                          onChange={(val) => handleEditingMemberChange('relation', val)}
                          options={RELATION_OPTIONS}
                          required={true}
                          searchable={true}
                          error={relErr}
                        />
                      </div>

                      {/* Row 2: Gender, DOB, Anniversary, Blood Group (4 inputs) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        <Select
                          label="Gender"
                          value={editingMember.gender || 'Male'}
                          onChange={(val) => handleEditingMemberChange('gender', val)}
                          options={GENDER_OPTIONS}
                          disabled={isLoading}
                        />
                        <DatePicker
                          label="Date of Birth"
                          value={editingMember.dob || ''}
                          onChange={(val) => handleEditingMemberChange('dob', val)}
                          disabled={isLoading}
                          placeholder="Select DOB"
                        />
                        <DatePicker
                          label="Anniversary Date"
                          value={editingMember.anniversary || ''}
                          onChange={(val) => handleEditingMemberChange('anniversary', val)}
                          disabled={isLoading}
                          placeholder="Select Anniversary"
                        />
                        <Select
                          label="Blood Group"
                          value={editingMember.blood_group || ''}
                          onChange={(val) => handleEditingMemberChange('blood_group', val)}
                          options={[{ label: 'Select Blood Group', value: '' }, ...BLOOD_GROUPS]}
                          disabled={isLoading}
                          searchable={true}
                        />
                      </div>

                      {/* Row 3: Mobile, Email, Status, Close/Done (4 items) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 items-end">
                        <Input
                          label="Mobile Number (Optional)"
                          type="tel"
                          maxLength={10}
                          placeholder="10 digit number"
                          value={editingMember.number || ''}
                          onChange={(e) => handleEditingMemberChange('number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          disabled={isLoading}
                          error={numErr}
                        />
                        <Input
                          label="Email Address"
                          type="email"
                          placeholder="email@example.com (Optional)"
                          value={editingMember.email || ''}
                          onChange={(e) => handleEditingMemberChange('email', e.target.value)}
                          disabled={isLoading}
                        />
                        <Switch
                          label="Status"
                          checked={Number(editingMember.status ?? 1) === 1}
                          onChange={(val) => handleEditingMemberChange('status', val ? 1 : 0)}
                          disabled={isLoading}
                          activeLabel="Active"
                          inactiveLabel="Inactive"
                        />
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDoneEditing}
                            className="w-full h-[38px] text-xs font-bold text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Done
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── FORM FOOTER & SUBMIT BUTTON ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-border mt-2">
        <div className="text-xs text-text-secondary font-medium">
          Total: <span className="font-bold text-text">1 Head</span> + <span className="font-bold text-primary">{members.length} Members</span>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            {isLoading ? 'Processing...' : user ? 'Update Family' : 'Save Family'}
          </Button>
        </div>
      </div>
    </form>
  )
}

