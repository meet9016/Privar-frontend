import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import Input from './common/Input'
import Select from './common/Select'
import Button from './common/Button'
import { isValidEmail } from '../lib/validation'
import api, { getUsersList } from '../lib/api'
import { User as UserIcon,  ShieldCheck } from 'lucide-react'

export default function CommitteeMemberForm({ member, roles = [], onSubmit, isLoading, onCancel }) {
  const [userList, setUserList] = useState([])
  const [userPage, setUserPage] = useState(1)
  const [hasMoreUsers, setHasMoreUsers] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false)
  const [selectedUserObj, setSelectedUserObj] = useState(null)
  const searchTimerRef = useRef(null)
  const searchQueryRef = useRef('')
  const isFetchingRef = useRef(false)
  const defaultUsersRef = useRef({ list: [], hasMore: false })
  const [stateList, setStateList] = useState([])
  const [districtList, setDistrictList] = useState([])
  const [cityList, setCityList] = useState([])
  const [villageList, setVillageList] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')

  const [formData, setFormData] = useState({
    user_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    number: '',
    email: '',
    password: '',
    role_id: '',
    state: '',
    state_id: '',
    district: '',
    district_id: '',
    city: '',
    city_id: '',
    village: '',
    village_id: '',
    status: 1,
    image: ''
  })
  const [errors, setErrors] = useState({})

  // Fetch initial community users (first 20) for dropdown selection
  useEffect(() => {
    let isMounted = true
    const fetchFirstBatch = async () => {
      setLoadingUsers(true)
      try {
        const res = await getUsersList({ page: 1, limit: 20, flat: 'true' })
        const raw = res.data?.data || res.data?.members || res.data || []
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
        const pagination = res.data?.pagination
        const hasMore = pagination ? pagination.page < pagination.totalPages : list.length === 20
        if (isMounted) {
          setUserList(list)
          setUserPage(1)
          setHasMoreUsers(hasMore)
          defaultUsersRef.current = { list, hasMore }
        }
      } catch (err) {
        console.error('Failed to load initial user list for committee selection:', err)
      } finally {
        if (isMounted) setLoadingUsers(false)
      }
    }
    fetchFirstBatch()
    return () => { isMounted = false }
  }, [])

  // Cleanup search timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [])

  // Debounced backend search for community members: only queries backend when 3 or more chars are typed
  const handleUserSearch = useCallback((searchTerm) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }

    const query = (searchTerm || '').trim()

    // If query has less than 3 characters, do not search backend
    if (query.length < 3) {
      setLoadingUsers(false)
      // If previous search was active (>= 3 chars), restore default initial list
      if (searchQueryRef.current !== '') {
        searchQueryRef.current = ''
        setUserList(defaultUsersRef.current.list || [])
        setUserPage(1)
        setHasMoreUsers(defaultUsersRef.current.hasMore ?? false)
      }
      return
    }

    searchQueryRef.current = query
    setLoadingUsers(true)
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await getUsersList({
          page: 1,
          limit: 20,
          search: query,
          flat: 'true'
        })
        const raw = res.data?.data || res.data?.members || res.data || []
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
        const pagination = res.data?.pagination
        const hasMore = pagination ? pagination.page < pagination.totalPages : list.length === 20

        setUserList(list)
        setUserPage(1)
        setHasMoreUsers(hasMore)
      } catch (err) {
        console.error('Failed to search members:', err)
      } finally {
        setLoadingUsers(false)
      }
    }, 300)
  }, [])

  // Infinite scroll: fetch next 20 community members when user scrolls dropdown to bottom
  const handleLoadMoreUsers = useCallback(async () => {
    if (loadingUsers || loadingMoreUsers || !hasMoreUsers || isFetchingRef.current) {
      return
    }

    isFetchingRef.current = true
    setLoadingMoreUsers(true)
    const nextPage = userPage + 1

    try {
      const res = await getUsersList({
        page: nextPage,
        limit: 20,
        search: searchQueryRef.current && searchQueryRef.current.length >= 3 ? searchQueryRef.current : undefined,
        flat: 'true'
      })
      const raw = res.data?.data || res.data?.members || res.data || []
      const newItems = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])

      if (newItems.length === 0) {
        setHasMoreUsers(false)
      } else {
        const pagination = res.data?.pagination
        const hasMore = pagination ? pagination.page < pagination.totalPages : newItems.length === 20
        setHasMoreUsers(hasMore)
        setUserPage(nextPage)
        setUserList(prev => {
          const existingIds = new Set(prev.map(u => String(u._id || u.id || u.member_id)))
          const unique = newItems.filter(u => !existingIds.has(String(u._id || u.id || u.member_id)))
          return [...prev, ...unique]
        })
      }
    } catch (err) {
      console.error('Failed to load more members on scroll:', err)
    } finally {
      setLoadingMoreUsers(false)
      isFetchingRef.current = false
    }
  }, [loadingUsers, loadingMoreUsers, hasMoreUsers, userPage])

  // Fetch location masters for dropdown selection
  useEffect(() => {
    let isMounted = true
    const fetchLocationMasters = async () => {
      try {
        const [statesRes, distRes, citiesRes, villRes] = await Promise.all([
          api.get('/masters/state', { params: { limit: 200 } }).catch(() => ({ data: [] })),
          api.get('/masters/district', { params: { limit: 200 } }).catch(() => ({ data: [] })),
          api.get('/masters/city', { params: { limit: 200 } }).catch(() => ({ data: [] })),
          api.get('/masters/village', { params: { limit: 200 } }).catch(() => ({ data: [] }))
        ])
        if (isMounted) {
          const s = statesRes.data?.data || statesRes.data || []
          setStateList(Array.isArray(s) ? s : [])
          const d = distRes.data?.data || distRes.data || []
          setDistrictList(Array.isArray(d) ? d : [])
          const c = citiesRes.data?.data || citiesRes.data || []
          setCityList(Array.isArray(c) ? c : [])
          const v = villRes.data?.data || villRes.data || []
          setVillageList(Array.isArray(v) ? v : [])
        }
      } catch (err) {
        console.warn('Failed to load location masters for committee selection:', err)
      }
    }
    fetchLocationMasters()
    return () => { isMounted = false }
  }, [])

  // Initialize or populate form
  useEffect(() => {
    if (member) {
      const existingId = member.user_id || member.member_id || member._id || member.id || ''
      setSelectedUserId(existingId)
      setFormData({
        user_id: existingId,
        first_name: member.first_name || '',
        middle_name: member.middle_name || '',
        last_name: member.last_name || '',
        number: member.number || member.phone || '',
        email: member.email || '',
        password: '',
        role_id: member.role_id?._id || member.role_id || '',
        state: member.state || member.state_name || '',
        state_id: member.state_id || '',
        district: member.district || member.district_name || '',
        district_id: member.district_id || '',
        city: member.city || member.city_name || '',
        city_id: member.city_id || '',
        village: member.village || member.village_name || '',
        village_id: member.village_id || '',
        status: member.status !== undefined ? Number(member.status) : 1,
        image: member.image || ''
      })
    } else {
      setSelectedUserId('')
      setFormData({
        user_id: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        number: '',
        email: '',
        password: '',
        role_id: '',
        state: '',
        state_id: '',
        district: '',
        district_id: '',
        city: '',
        city_id: '',
        village: '',
        village_id: '',
        status: 1,
        image: ''
      })
    }
    setErrors({})
  }, [member])

  // When a user is selected from dropdown, populate their details
  const handleUserSelect = (userId) => {
    setSelectedUserId(userId)
    setErrors(prev => {
      const u = { ...prev }
      delete u.user_id
      return u
    })

    if (!userId) {
      setSelectedUserObj(null)
      setFormData(prev => ({
        ...prev,
        user_id: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        number: '',
        image: ''
      }))
      return
    }

    const found = userList.find(u => String(u._id || u.id || u.member_id) === String(userId)) ||
      selectedUserObj
    if (found) {
      setSelectedUserObj(found)
      const userEmail = found.email
        ? String(found.email).trim()
        : (found.occupation_details?.business_email ? String(found.occupation_details.business_email).trim() : '')
      setFormData(prev => ({
        ...prev,
        user_id: String(found._id || found.id || found.member_id),
        first_name: found.first_name || '',
        middle_name: found.middle_name || '',
        last_name: found.last_name || '',
        number: found.number || found.phone || '',
        email: userEmail || prev.email || '',
        image: found.image || found.profile_image || ''
      }))
      if (userEmail) {
        setErrors(prev => {
          const u = { ...prev }
          delete u.email
          return u
        })
      }
    }
  }

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => {
      const updated = { ...prev }
      if (field === 'email') {
        if (!value || !value.trim()) updated.email = 'Email address is required for committee login'
        else if (!isValidEmail(value.trim())) updated.email = 'Please enter a valid email address (e.g. user@gmail.com)'
        else delete updated.email
      }
      if (field === 'role_id') {
        if (value) delete updated.role_id
        // Clear irrelevant jurisdiction fields when role changes
        const roleObj = roles.find(r => String(r.id || r._id) === String(value))
        const rName = (roleObj?.name || '').toLowerCase()
        const isStateRole = rName.includes('state') || rName.includes('rajya')
        const isDistrictRole = rName.includes('district') || rName.includes('jilla') || rName.includes('zilla')
        const isCityRole = rName.includes('city') || rName.includes('shahar')
        const isVillageRole = rName.includes('village') || rName.includes('gam') || rName.includes('gaam')

        setFormData(prev => ({
          ...prev,
          role_id: value,
          state_id: isStateRole || isDistrictRole || isCityRole || isVillageRole ? prev.state_id : '',
          state: isStateRole || isDistrictRole || isCityRole || isVillageRole ? prev.state : '',
          district_id: isDistrictRole ? prev.district_id : '',
          district: isDistrictRole ? prev.district : '',
          city_id: isCityRole ? prev.city_id : '',
          city: isCityRole ? prev.city : '',
          village: isVillageRole ? prev.village : '',
          village_id: isVillageRole ? prev.village_id : ''
        }))
      }
      if (field === 'status' && value !== '') delete updated.status
      return updated
    })
  }

  const validate = () => {
    const nextErrors = {}
    if (!member && !selectedUserId && !formData.first_name) {
      nextErrors.user_id = 'Please select a member'
    }
    if (!formData.email || !formData.email.trim()) {
      nextErrors.email = 'Email address is required for committee login'
    } else if (!isValidEmail(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address (e.g. user@gmail.com)'
    }
    if (!formData.role_id) {
      nextErrors.role_id = 'Please assign a role'
    }
    if (formData.status === '' || formData.status === undefined) {
      nextErrors.status = 'Status is required'
    }

    // Role-specific jurisdiction validation
    if (roleScopeType === 'city' && !formData.city_id && !formData.city) {
      nextErrors.city_id = 'Please select assigned City for City role'
    }
    if (roleScopeType === 'district' && !formData.district_id && !formData.district) {
      nextErrors.district_id = 'Please select assigned District for District role'
    }
    if (roleScopeType === 'state' && !formData.state_id && !formData.state) {
      nextErrors.state_id = 'Please select assigned State for State role'
    }
    if (roleScopeType === 'village' && !formData.village && !formData.village_id) {
      nextErrors.village = 'Please select assigned Village for Village role'
    }

    return nextErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const payload = new FormData()
    payload.append('first_name', formData.first_name)
    payload.append('middle_name', formData.middle_name)
    payload.append('last_name', formData.last_name)
    payload.append('number', formData.number)
    payload.append('email', formData.email || '')
    if (formData.password) {
      payload.append('password', formData.password)
    }
    if (formData.role_id) {
      payload.append('role_id', formData.role_id)
    }
    payload.append('status', formData.status)
    if (formData.image) {
      payload.append('image', formData.image)
    }
    if (selectedUserId) {
      payload.append('user_id', selectedUserId)
    }
    payload.append('state', formData.state || '')
    payload.append('state_id', formData.state_id || '')
    payload.append('district', formData.district || '')
    payload.append('district_id', formData.district_id || '')
    payload.append('city', formData.city || '')
    payload.append('city_id', formData.city_id || '')
    payload.append('village', formData.village || '')
    payload.append('village_id', formData.village_id || '')

    onSubmit(payload)
  }

  // User Dropdown Options with Full Name, Phone, and Avatar
  const userOptions = useMemo(() => {
    const options = [
      { label: loadingUsers ? 'Loading members...' : 'Select a Member...', value: '' }
    ]

    const map = new Map()
    if (selectedUserObj) {
      const selId = String(selectedUserObj._id || selectedUserObj.id || selectedUserObj.member_id)
      map.set(selId, selectedUserObj)
    }
    userList.forEach(u => {
      const id = String(u._id || u.id || u.member_id)
      if (!map.has(id)) {
        map.set(id, u)
      }
    })

    map.forEach(u => {
      const id = String(u._id || u.id || u.member_id)
      const fullName = [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ')
      const phone = u.number || u.phone || ''
      const village = u.village || u.city || ''
      const relation = u.relation && u.relation !== 'Self' ? `(${u.relation}${u.family_head?.name ? ` of ${u.family_head.name}` : ''})` : ''
      const memberNo = u.member_id ? `#${u.member_id}` : ''
      const sub = [memberNo, phone, village, relation].filter(Boolean).join(' • ')
      const initials = (u.first_name?.[0] || '') + (u.last_name?.[0] || '')

      options.push({
        label: fullName || 'Unnamed Member',
        value: id,
        sublabel: sub || undefined,
        image: u.image || u.profile_image || undefined,
        imagePlaceholder: !u.image && !u.profile_image ? initials.toUpperCase() || 'U' : undefined
      })
    })
    return options
  }, [userList, selectedUserObj, loadingUsers])

  const roleOptions = useMemo(() => [
    { label: 'Select Assigned Role', value: '' },
    ...roles.map(r => ({ label: r.name, value: r.id || String(r._id) }))
  ], [roles])

  const selectedRoleObj = useMemo(() => {
    return roles.find(item => String(item.id || item._id) === String(formData.role_id))
  }, [roles, formData.role_id])

  const selectedRoleName = useMemo(() => {
    return (selectedRoleObj?.name || '').toLowerCase().trim()
  }, [selectedRoleObj])

  // Detect scope type based on role name containing keywords
  const roleScopeType = useMemo(() => {
    if (!selectedRoleName) return null
    if (selectedRoleName.includes('city') || selectedRoleName.includes('shahar')) return 'city'
    if (selectedRoleName.includes('district') || selectedRoleName.includes('jilla') || selectedRoleName.includes('zilla')) return 'district'
    if (selectedRoleName.includes('state') || selectedRoleName.includes('rajya')) return 'state'
    if (selectedRoleName.includes('village') || selectedRoleName.includes('gam') || selectedRoleName.includes('gaam')) return 'village'
    return 'custom'
  }, [selectedRoleName])

  const stateOptions = useMemo(() => [
    { label: 'Select State (Optional)', value: '' },
    ...stateList.map(s => ({ label: s.name || s.state, value: String(s.id || s._id) }))
  ], [stateList])

  const districtOptions = useMemo(() => [
    { label: 'Select District (Optional)', value: '' },
    ...districtList.map(d => ({ label: d.name || d.district, value: String(d.id || d._id) }))
  ], [districtList])

  const cityOptions = useMemo(() => [
    { label: 'Select City (Optional)', value: '' },
    ...cityList.map(c => ({ label: c.name || c.city, value: String(c.id || c._id) }))
  ], [cityList])

  const villageOptions = useMemo(() => {
    const opts = [{ label: 'Select Village (Optional)', value: '' }]
    const existing = new Set()
    villageList.forEach(v => {
      if (v.name) {
        opts.push({ label: v.name, value: v.name })
        existing.add(v.name.toLowerCase().trim())
      }
    })
    if (formData.village && !existing.has(formData.village.toLowerCase().trim())) {
      opts.push({ label: formData.village, value: formData.village })
    }
    return opts
  }, [villageList, formData.village])

  const handleStateChange = (val) => {
    const matched = stateList.find(s => String(s.id || s._id) === String(val) || s.name === val)
    setFormData(prev => ({
      ...prev,
      state_id: matched ? String(matched.id || matched._id) : '',
      state: matched?.name || matched?.state || val || ''
    }))
  }

  const handleDistrictChange = (val) => {
    const matched = districtList.find(d => String(d.id || d._id) === String(val) || d.name === val)
    setFormData(prev => ({
      ...prev,
      district_id: matched ? String(matched.id || matched._id) : '',
      district: matched?.name || matched?.district || val || ''
    }))
  }

  const handleCityChange = (val) => {
    const matched = cityList.find(c => String(c.id || c._id) === String(val) || c.name === val)
    setFormData(prev => ({
      ...prev,
      city_id: matched ? String(matched.id || matched._id) : '',
      city: matched?.name || matched?.city || val || ''
    }))
  }

  const handleVillageChange = (val) => {
    const matched = villageList.find(v => v.name === val || String(v._id || v.id) === String(val))
    setFormData(prev => ({
      ...prev,
      village: matched?.name || val || '',
      village_id: matched ? String(matched._id || matched.id) : ''
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-text">
      {/* Step 1: Select User from Dropdown */}
      {!member ? (
        <div className="bg-surface-secondary/40 border border-border/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
            <UserIcon className="w-4 h-4" />
            <span>Select Community Member *</span>
          </div>
          <Select
            label=""
            value={selectedUserId}
            onChange={handleUserSelect}
            onSearch={handleUserSearch}
            loading={loadingUsers}
            onLoadMore={handleLoadMoreUsers}
            hasMore={hasMoreUsers}
            loadingMore={loadingMoreUsers}
            options={userOptions}
            searchable={true}
            placeholder="Search member (type at least 3 characters)..."
            error={errors.user_id}
            disabled={isLoading}
          />
        </div>
      ) : null}

      {/* Step 2: Assign Role & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <Select
          label="Assign Role"
          required
          value={formData.role_id}
          onChange={(val) => handleFieldChange('role_id', val)}
          disabled={isLoading}
          options={roleOptions}
          error={errors.role_id}
          placeholder="Select Assigned Role"
        />
        <Select
          label="Status"
          required
          placement="down"
          value={formData.status}
          onChange={(val) => handleFieldChange('status', val)}
          disabled={isLoading}
          error={errors.status}
          placeholder="Select Status"
          options={[
            { label: 'Active', value: 1 },
            { label: 'Inactive', value: 0 }
          ]}
        />
      </div>

      {/* Step 3: Jurisdiction Scope (Smart conditional based on Role Name) */}
      {roleScopeType && roleScopeType !== 'none' && (
        <div className="bg-surface-secondary/20 border border-border/60 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text uppercase tracking-wide">
              Assigned Jurisdiction Area (કાર્યક્ષેત્ર)
            </span>
            {selectedRoleObj?.name && (
              <span className="text-[11px] font-semibold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                {selectedRoleObj.name}
              </span>
            )}
          </div>

          {/* If City Role -> Only Show City Selector */}
          {roleScopeType === 'city' && (
            <div>
              <Select
                label="Assigned City (શહેર) *"
                required
                value={formData.city_id}
                onChange={handleCityChange}
                disabled={isLoading}
                searchable={true}
                options={cityOptions}
                placeholder="Select City"
                error={errors.city_id}
              />
              <p className="text-[11px] text-text-secondary mt-1">
                આ સભ્ય આ શહેર હેઠળ આવતા તમામ ગામ અને પરિવારોનું સંચાલન કરી શકશે.
              </p>
            </div>
          )}

          {/* If District Role -> Only Show District Selector */}
          {roleScopeType === 'district' && (
            <div>
              <Select
                label="Assigned District (જિલ્લો) *"
                required
                value={formData.district_id}
                onChange={handleDistrictChange}
                disabled={isLoading}
                searchable={true}
                options={districtOptions}
                placeholder="Select District"
                error={errors.district_id}
              />
              <p className="text-[11px] text-text-secondary mt-1">
                આ સભ્ય આ જિલ્લા હેઠળ આવતા તમામ તાલુકા, શહેર અને ગામનું સંચાલન કરી શકશે.
              </p>
            </div>
          )}

          {/* If State Role -> Only Show State Selector */}
          {roleScopeType === 'state' && (
            <div>
              <Select
                label="Assigned State (રાજ્ય) *"
                required
                value={formData.state_id}
                onChange={handleStateChange}
                disabled={isLoading}
                searchable={true}
                options={stateOptions}
                placeholder="Select State"
                error={errors.state_id}
              />
              <p className="text-[11px] text-text-secondary mt-1">
                આ સભ્ય સમગ્ર રાજ્ય સ્તરના તમામ પરિવારો અને સભ્યોનું સંચાલન કરી શકશે.
              </p>
            </div>
          )}

          {/* If Village Role -> Only Show Village Selector */}
          {roleScopeType === 'village' && (
            <div>
              <Select
                label="Assigned Village (ગામ) *"
                required
                value={formData.village}
                onChange={handleVillageChange}
                disabled={isLoading}
                searchable={true}
                options={villageOptions}
                placeholder="Select Village"
                error={errors.village}
              />
              <p className="text-[11px] text-text-secondary mt-1">
                આ સભ્ય ફક્ત પોતાના નિયુક્ત ગામના પરિવારોનું સંચાલન કરી શકશે.
              </p>
            </div>
          )}

          {/* Fallback for General / Custom roles: Show clean 2x2 grid */}
          {roleScopeType === 'custom' && (
            <div className="space-y-3">
              <p className="text-[11px] text-text-secondary">
                Select jurisdiction if this role is location restricted (optional):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <Select
                  label="Assigned State (રાજ્ય)"
                  value={formData.state_id}
                  onChange={handleStateChange}
                  disabled={isLoading}
                  searchable={true}
                  options={stateOptions}
                  placeholder="Select State"
                />
                <Select
                  label="Assigned District (જિલ્લો)"
                  value={formData.district_id}
                  onChange={handleDistrictChange}
                  disabled={isLoading}
                  searchable={true}
                  options={districtOptions}
                  placeholder="Select District"
                />
                <Select
                  label="Assigned City (શહેર)"
                  value={formData.city_id}
                  onChange={handleCityChange}
                  disabled={isLoading}
                  searchable={true}
                  options={cityOptions}
                  placeholder="Select City"
                />
                <Select
                  label="Assigned Village (ગામ)"
                  value={formData.village}
                  onChange={handleVillageChange}
                  disabled={isLoading}
                  searchable={true}
                  options={villageOptions}
                  placeholder="Select Village"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Login Credentials (Email & Password) */}
      <div className="bg-surface-secondary/20 border border-border/60 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-text uppercase tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Login Credentials</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Input
            label="Email Address"
            required={true}
            type="email"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            disabled={isLoading}
            error={errors.email}
          />
          <Input
            label={member ? "Password (Leave blank to keep)" : "Password"}
            type="password"
            placeholder={member ? "Enter password to update" : "Enter login password"}
            value={formData.password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            disabled={isLoading}
            error={errors.password}
          />
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pt-3 border-t border-border mt-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
