import React, { useContext, useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import Input from './common/Input'
import Select from './common/Select'
import Button from './common/Button'
import { isValidEmail } from '../lib/validation'
import api, { getUsersList } from '../lib/api'
import { User as UserIcon, Phone, Mail, ShieldCheck } from 'lucide-react'

export default function CommitteeMemberForm({ member, roles = [], onSubmit, isLoading, onCancel }) {
  const { user: loggedInUser } = useContext(AuthContext)
  const [userList, setUserList] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [userPage, setUserPage] = useState(1)
  const [hasMoreUsers, setHasMoreUsers] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedUserObj, setSelectedUserObj] = useState(null)

  const PAGE_LIMIT = 20
  const loadingMoreRef = useRef(false)
  const searchTimeoutRef = useRef(null)

  const [formData, setFormData] = useState({
    user_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    number: '',
    email: '',
    password: '',
    role_id: '',
    status: 1,
    image: ''
  })
  const [errors, setErrors] = useState({})

  // Fetch community users for dropdown selection (page 1 or pagination)
  const fetchUsers = useCallback(async (pageNum = 1, search = '', isAppend = false) => {
    if (isAppend) {
      setLoadingMore(true)
      loadingMoreRef.current = true
    } else {
      setLoadingUsers(true)
    }

    try {
      const params = {
        page: pageNum,
        limit: PAGE_LIMIT,
        flat: 'true'
      }
      if (search && search.trim()) {
        params.search = search.trim()
      }

      const res = await getUsersList(params)
      const raw = res.data?.data || res.data?.members || res.data || []
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
      const pg = res.data?.pagination || {}

      const totalPages = Number(pg.totalPages || pg.total_pages || 1)
      const currentPage = Number(pg.page || pageNum)

      const hasNext = Boolean(
        pg.hasNextPage !== undefined
          ? pg.hasNextPage
          : (totalPages > 1 ? currentPage < totalPages : list.length >= PAGE_LIMIT)
      )

      setHasMoreUsers(hasNext)
      setUserPage(currentPage)

      if (isAppend) {
        setUserList(prev => {
          const existingIds = new Set(prev.map(u => String(u._id || u.id || u.member_id)))
          const filteredNew = list.filter(u => !existingIds.has(String(u._id || u.id || u.member_id)))
          return [...prev, ...filteredNew]
        })
      } else {
        setUserList(list)
      }
    } catch (err) {
      console.error('Failed to load user list for committee selection:', err)
      if (!isAppend) {
        setUserList([])
        setHasMoreUsers(false)
      }
    } finally {
      setLoadingUsers(false)
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }, [])

  // Initial load: fetch first 20 members
  useEffect(() => {
    if (!member) {
      fetchUsers(1, '', false)
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [member, fetchUsers])

  // Infinite scroll: fetch next 20 members on scroll
  const handleLoadMore = useCallback(() => {
    if (loadingUsers || loadingMore || loadingMoreRef.current || !hasMoreUsers) return
    const nextPage = userPage + 1
    fetchUsers(nextPage, searchQuery, true)
  }, [loadingUsers, loadingMore, hasMoreUsers, userPage, searchQuery, fetchUsers])

  const currentSearchRef = useRef('')

  // Search members with debounce
  const handleSearchChange = useCallback((term) => {
    const cleanTerm = (term || '').trim()
    if (currentSearchRef.current === cleanTerm) {
      return
    }
    currentSearchRef.current = cleanTerm
    setSearchQuery(cleanTerm)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchUsers(1, cleanTerm, false)
    }, 300)
  }, [fetchUsers])

  // Initialize or populate form
  useEffect(() => {
    if (member) {
      const existingId = member.user_id || member.member_id || member._id || member.id || ''
      setSelectedUserId(existingId)
      setSelectedUserObj(member)
      setFormData({
        user_id: existingId,
        first_name: member.first_name || '',
        middle_name: member.middle_name || '',
        last_name: member.last_name || '',
        number: member.number || member.phone || '',
        email: member.email || '',
        password: '',
        role_id: member.role_id?._id || member.role_id || '',
        status: member.status !== undefined ? Number(member.status) : 1,
        image: member.image || ''
      })
    } else {
      setSelectedUserId('')
      setSelectedUserObj(null)
      setFormData({
        user_id: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        number: '',
        email: '',
        password: '',
        role_id: '',
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
      (selectedUserObj && String(selectedUserObj._id || selectedUserObj.id || selectedUserObj.member_id) === String(userId) ? selectedUserObj : null)

    if (found) {
      setSelectedUserObj(found)
      const userEmail = found.email ? String(found.email).trim() : ''
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
      if (field === 'role_id' && value) delete updated.role_id
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

    onSubmit(payload)
  }

  // User Dropdown Options with Full Name, Phone, and Avatar
  const userOptions = useMemo(() => {
    const options = [
      { label: loadingUsers && userList.length === 0 ? 'Loading members...' : 'Select a Member...', value: '' }
    ]

    const listToRender = [...userList]
    if (selectedUserObj) {
      const selectedId = String(selectedUserObj._id || selectedUserObj.id || selectedUserObj.member_id)
      const exists = listToRender.some(u => String(u._id || u.id || u.member_id) === selectedId)
      if (!exists && selectedId) {
        listToRender.unshift(selectedUserObj)
      }
    }

    listToRender.forEach(u => {
      const id = String(u._id || u.id || u.member_id)
      const fullName = [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ')
      const phone = u.number || u.phone || ''
      const village = u.village || u.city || ''
      const sub = [phone, village].filter(Boolean).join(' • ')
      const initials = (u.first_name?.[0] || '') + (u.last_name?.[0] || '')

      options.push({
        label: fullName || 'Unnamed Member',
        value: id,
        sublabel: sub || undefined,
        searchKey: [fullName, phone, village, u.email].filter(Boolean).join(' '),
        image: u.image || u.profile_image || undefined,
        imagePlaceholder: !u.image && !u.profile_image ? initials.toUpperCase() || 'U' : undefined
      })
    })
    return options
  }, [userList, loadingUsers, selectedUserObj])

  const roleOptions = useMemo(() => [
    { label: 'Select Assigned Role', value: '' },
    ...roles.map(r => ({ label: r.name, value: r.id || String(r._id) }))
  ], [roles])

  const fullNameDisplay = [formData.first_name, formData.middle_name, formData.last_name].filter(Boolean).join(' ')

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
            options={userOptions}
            searchable={true}
            placeholder="Search and select community member..."
            error={errors.user_id}
            disabled={isLoading || (loadingUsers && userList.length === 0)}
            onLoadMore={handleLoadMore}
            hasMore={hasMoreUsers}
            isLoadingMore={loadingMore}
            onSearchChange={handleSearchChange}
            loading={loadingUsers}
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
