import React, { useCallback, useContext, useEffect, useState, useMemo } from 'react'
import { Edit2, Trash2, Plus, Search, RefreshCw, Sparkles, Users as UsersIcon, Eye, CheckCircle, XCircle, Phone, Mail, Crown, MapPin, Calendar, Filter, ChevronDown, User, Droplet, X } from 'lucide-react'
import api, { getUsersList, formatDate } from '../lib/api'
import { confirm } from '../lib/confirm'
import { getUserRoleLabel, normalizeRoles, unwrapApiData } from '../lib/roles'
import { hasPermission } from '../lib/permissions'
import { AuthContext } from '../context/AuthContext'
import Modal from '../components/Modal'
import UserForm from '../components/UserForm'
import Select from '../components/common/Select'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import SearchInput from '../components/common/SearchInput'
import FilterPopover from '../components/common/FilterPopover'
import { toast } from '../lib/toast'
import useDebounce from '../hooks/useDebounce'
import usePermissions from '../hooks/usePermissions'

export default function Users() {
  const { user: currentUser } = useContext(AuthContext)
  const permissions = usePermissions('members')
  const [users, setUsers] = useState([])
  const [limit, setLimit] = useState(15)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 400)
  const [filters, setFilters] = useState({
    gender: '',
    status: ''
  })
  const [draftFilters, setDraftFilters] = useState({
    gender: '',
    status: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const filterGender = filters.gender || ''
  const filterStatus = filters.status || ''

  const [roles, setRoles] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedUsers, setSelectedUsers] = useState([])
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingUser, setViewingUser] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [collapsedHeads, setCollapsedHeads] = useState([])

  const toggleExpand = (headId, e) => {
    e.stopPropagation()
    setCollapsedHeads(prev =>
      prev.includes(headId)
        ? prev.filter(id => id !== headId)
        : [...prev, headId]
    )
  }

  const groupedUsers = useMemo(() => {
    // Identify all heads in the list
    const heads = users.filter(u => u.familyHead || u.relation === 'Self')
    const members = users.filter(u => !u.familyHead && u.relation !== 'Self')

    const result = []
    const processedMemberIds = new Set()

    heads.forEach(head => {
      const headId = String(head.id || head._id)
      const headMemberId = String(head.member_id || '')
      const headMembers = members.filter(m => {
        const mHeadId = String(m.family_head?.id || m.family_head?._id || m.family_head_id || '')
        const mParentId = String(m.parent_member_id || '')
        return (mHeadId && (mHeadId === headId || mHeadId === headMemberId)) ||
               (mParentId && (mParentId === headMemberId || mParentId === headId))
      })
      
      result.push({
        ...head,
        isGroupParent: true,
        hasChildren: headMembers.length > 0,
        childrenCount: headMembers.length
      })

      headMembers.forEach(m => {
        result.push({
          ...m,
          isGroupChild: true,
          parentHeadId: headId
        })
        processedMemberIds.add(String(m.id || m._id))
      })
    });

    // Add remaining members who don't have their head in the list
    members.forEach(m => {
      const id = String(m.id || m._id)
      if (!processedMemberIds.has(id)) {
        result.push(m)
      }
    })

    return result
  }, [users])

  const visibleUsers = useMemo(() => {
    return groupedUsers.filter(u => {
      if (u.isGroupChild) {
        return !collapsedHeads.includes(u.parentHeadId)
      }
      return true
    })
  }, [groupedUsers, collapsedHeads])

  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1)
  const currentPage = Math.min(Math.max(Number(pagination.page) || page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getUsersList({ page, limit, search: debouncedSearch, ...filters })
      const rows = res.data?.data || res.data || []
      const pg = res.data?.pagination || {}
      const total = Number(pg.total || 0)
      const pageLimit = Number(pg.limit || limit)
      const totalPages = Number(
        pg.totalPages ||
        pg.total_pages ||
        pg.last_page ||
        (pageLimit > 0 ? Math.ceil(total / pageLimit) : 1)
      )
      const currentPage = Number(pg.page || pg.current_page || page)

      setUsers(Array.isArray(rows) ? rows : [])
      setPagination({
        page: currentPage,
        totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
        total,
        limit: pageLimit,
        hasPrevPage: Boolean(pg.hasPrevPage ?? currentPage > 1),
        hasNextPage: Boolean(pg.hasNextPage ?? currentPage < totalPages)
      })

      if (currentPage !== page) {
        setPage(currentPage)
      }
    } catch (err) {
      setUsers([])
      setPagination({ page, totalPages: 1, total: 0, limit, hasPrevPage: false, hasNextPage: false })
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [filters, page, debouncedSearch, limit])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles', { params: { limit: 150 } })
        setRoles(normalizeRoles(unwrapApiData(res)))
      } catch (err) {
        console.error(err)
      }
    }

    fetchRoles()
  }, [])

  const setSearchQuery = (value) => {
    setSearchValue(value)
    setPage(1)
  }

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault()
  }

  // Create/Update user
  const handleSubmit = async (formData) => {
    setFormLoading(true)
    setError('')
    try {
      if (selectedUser) {
        // Edit
        await api.put(`/users/${selectedUser.id}`, formData)
        toast.success('Member updated successfully')
        fetchUsers() // Refresh list
      } else {
        // Create
        const res = await api.post('/users', formData)
        const created = res.data?.data || res.data || {}
        toast.success('Member created successfully')
        fetchUsers() // Refresh list
      }
      setIsModalOpen(false)
      setSelectedUser(null)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save member')
    } finally {
      setFormLoading(false)
    }
  }

  // Delete user
  const handleDelete = async (userId) => {
    if (!await confirm('Are you sure you want to delete this family member? This action is permanent.')) return
    try {
      await api.delete(`/users/${userId}`)
      await fetchUsers()
      toast.success('Member deleted successfully')
    } catch (err) {
      toast.error('Failed to delete member')
    }
  }

  // Open create modal
  const handleCreate = () => {
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  // Open edit modal
  const handleEdit = (user) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const newSelected = new Set([...selectedUsers, ...users.map(u => u.id)]);
      setSelectedUsers(Array.from(newSelected));
    } else {
      const currentPageIds = users.map(u => u.id);
      setSelectedUsers(selectedUsers.filter(id => !currentPageIds.includes(id)));
    }
  }

  const handleSelectUser = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    )
  }

  const handleBulkUpdateStatus = async (status) => {
    if (!selectedUsers.length) return
    const actionName = status === 1 ? 'activate' : 'deactivate'
    if (!await confirm(`Are you sure you want to ${actionName} ${selectedUsers.length} members?`, { confirmText: status === 1 ? 'Activate' : 'Deactivate', type: status === 1 ? 'primary' : 'danger' })) return
    
    setFormLoading(true)
    try {
      await api.put('/users/bulk-update', { userIds: selectedUsers, status }, { headers: { 'Content-Type': 'application/json' } })
      toast.success(`Members ${actionName}d successfully`)
      setSelectedUsers([])
      fetchUsers()
    } catch (err) {
      toast.error(`Failed to bulk ${actionName} members`)
    } finally {
      setFormLoading(false)
    }
  }

  const handleView = async (user) => {
    setViewingUser(user)
    setIsViewModalOpen(true)
    
    setMembersLoading(true)
    try {
      const headId = user.family_head?.id || user.id
      const res = await api.get(`/users/family/${headId}`)
      setFamilyMembers(res.data?.data || res.data || [])
    } catch (err) {
      console.error('Failed to fetch family members', err)
    } finally {
      setMembersLoading(false)
    }
  }

  const closeViewModal = () => {
    setIsViewModalOpen(false)
    setViewingUser(null)
    setFamilyMembers([])
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilters({
      gender: '',
      status: ''
    })
  }

  

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Family Registry</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            placeholder="Search by name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            wrapperClassName="w-64 sm:w-80"
          />

          <FilterPopover
            isOpen={showFilters}
            onToggle={() => {
              setDraftFilters(filters)
              setShowFilters(!showFilters)
            }}
            onClose={() => setShowFilters(false)}
            activeCount={(filters.gender ? 1 : 0) + (filters.status ? 1 : 0)}
            onClear={() => {
              setDraftFilters({ gender: '', status: '' })
              setFilters({ gender: '', status: '' })
              setPage(1)
              setShowFilters(false)
            }}
            onApply={() => {
              setFilters(draftFilters)
              setPage(1)
              setShowFilters(false)
            }}
          >
            <Select
              label="Gender"
              value={draftFilters.gender || ''}
              onChange={(val) => setDraftFilters(current => ({ ...current, gender: val }))}
              placeholder="All Genders"
              searchable={false}
              options={[
                { label: 'All Genders', value: '' },
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' },
                { label: 'Other', value: 'Other' }
              ]}
            />

            <Select
              label="Status"
              value={draftFilters.status || ''}
              onChange={(val) => setDraftFilters(current => ({ ...current, status: val }))}
              placeholder="All Status"
              searchable={false}
              options={[
                { label: 'All Status', value: '' },
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' }
              ]}
            />
          </FilterPopover>
          
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 bg-surface-secondary border border-border p-1 rounded-xl shadow-sm">
              <span className="text-xs font-semibold text-text-secondary px-2">{selectedUsers.length} selected:</span>
              <button
                onClick={() => handleBulkUpdateStatus(1)}
                disabled={formLoading}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Active
              </button>
              <button
                onClick={() => handleBulkUpdateStatus(0)}
                disabled={formLoading}
                className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Inactive
              </button>
            </div>
          )}
          {!permissions.canAdd && !permissions.isSuperAdmin ? null : (
            <Button
              onClick={handleCreate}
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              className="h-10"
            >
              Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Operation Status alerts */}
      {error && (
        <div className="rounded-xl border border-error-border bg-error-bg p-3 text-sm text-error-text flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-xs font-semibold underline cursor-pointer">Dismiss</button>
        </div>
      )}


      {/* Removed the inline filter panel, moved it into a dropdown below the button */}

      {/* Main Table view */}
      <Table
        columns={[
          {
            key: 'select',
            header: '',
            align: 'left',
            className: 'w-12',
            headerRender: () => (
              <div className="flex items-center justify-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  checked={users.length > 0 && users.every(u => selectedUsers.includes(u.id))}
                  disabled={loading || users.length === 0}
                  onChange={handleSelectAll}
                />
              </div>
            ),
            render: (user) => (
              <div className="flex items-center justify-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleSelectUser(user.id)}
                />
              </div>
            )
          },
          {
            key: 'name',
            header: 'Name',
            className: 'min-w-[240px]',
            render: (user) => {
              const headId = String(user.id || user._id)
              const isCollapsed = collapsedHeads.includes(headId)
              return (
                <div className="flex items-center gap-2" style={{ paddingLeft: user.isGroupChild ? '1.75rem' : '0' }}>
                  {user.isGroupParent && user.hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(headId, e)}
                      className="p-1 hover:bg-surface-secondary rounded-lg transition-colors text-text-secondary hover:text-text cursor-pointer shrink-0"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                    </button>
                  ) : (
                    <div className="w-5.5 shrink-0" />
                  )}
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="font-semibold text-text">{user.name}</span>
                    {user.isGroupParent || user.relation === 'Self' || user.familyHead ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium shrink-0">
                        <span>Family Head</span>
                        <span 
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold shrink-0 select-none"
                          style={{ lineHeight: 0 }}
                        >
                          <span className="translate-y-[-0.5px]">{user.childrenCount ?? 0}</span>
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary border border-border/60 capitalize font-medium shrink-0">
                        {user.relation}
                      </span>
                    )}
                  </div>
                </div>
              )
            }
          },
          {
            key: 'phone',
            header: 'Mobile Number',
            className: 'min-w-[140px] whitespace-nowrap',
            render: (user) => (
              <div className="text-sm font-mono text-text whitespace-nowrap">{user.phone || user.number || '-'}</div>
            )
          },
          {
            key: 'email',
            header: 'Email',
            className: 'min-w-[180px]',
            render: (user) => (
              <div className="text-sm text-text-secondary truncate max-w-[200px]">{user.email || <span className="opacity-50">No Email</span>}</div>
            )
          },
          {
            key: 'gender',
            header: 'Gender',
            render: (user) => (
              <div className="text-sm text-text-secondary">{user.gender || '-'}</div>
            )
          },
          {
            key: 'status',
            header: 'Status',
            render: (user) => (
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Number(user.status ?? 1) === 1}
                    onChange={async (e) => {
                      const newStatus = e.target.checked ? 1 : 0;
                      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
                      try {
                        await api.put(`/users/${user.id}`, { status: newStatus }, { headers: { 'Content-Type': 'application/json' } });
                      } catch (err) {
                        console.error("Failed to update status", err);
                        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: user.status } : u));
                      }
                    }}
                  />
                  <div className="w-9 h-5 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-2 text-sm font-medium text-text-secondary">
                    {Number(user.status ?? 1) === 1 ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            )
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'left',
            render: user=> ( <div className="flex items-center justify-start gap-2">
                <button onClick={() => handleView(user)} className="p-2 text-indigo-500 hover:text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl transition-all" title="View Profile">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {!permissions.canEdit && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => handleEdit(user)} className="p-2 text-primary hover:text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit Profile">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!permissions.canDelete && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => handleDelete(user.id)} className="p-2 text-error-text hover:text-error bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all" title="Delete Member">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          }
        ]}
        data={visibleUsers}
        keyField="id"
        loading={loading}
        rowClassName={(user) => selectedUsers.includes(user.id) ? 'bg-primary/5' : ''}
        emptyState={{
          icon: UsersIcon,
          title: 'No Members found',
          description: 'Try expanding your search criteria or register a new member',
          actionLabel: 'Add Member',
          onAction: handleCreate
        }}
        pagination={{
          currentPage,
          totalPages,
          total: pagination.total,
          pageNumbers,
          loading,
          onPageChange: setPage,
          limit,
          onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1); }
        }}
      />

      {/* Editor Modal overlay */}
      <Modal
        isOpen={isModalOpen}
        title={selectedUser ? 'Edit Member' : 'Add New Member'}
        onClose={handleCloseModal}
        maxWidth="max-w-6xl"
      >
        <UserForm user={selectedUser} roles={roles} onSubmit={handleSubmit} isLoading={formLoading} onCancel={handleCloseModal} />
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        title="Member Details"
        onClose={closeViewModal}
        maxWidth="max-w-4xl"
      >
        {viewingUser && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 p-6 bg-surface-secondary rounded-2xl border border-border items-center md:items-start">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl border-4 border-primary/20 shrink-0 overflow-hidden">
                {viewingUser.image ? (
                  <img src={viewingUser.image} alt={viewingUser.name} className="w-full h-full object-cover" />
                ) : (
                  viewingUser.name ? viewingUser.name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="text-2xl font-black text-text">{viewingUser.name}</h3>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${Number(viewingUser.status ?? 1) === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-secondary text-text-secondary border border-border'}`}>
                    {Number(viewingUser.status ?? 1) === 1 ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 capitalize">
                    Relation: {viewingUser.relation || 'Self'}
                  </span>
                  {viewingUser.is_committee && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Committee Member
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50 text-sm">
                  <div>
                    <p className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-1">Contact</p>
                    <p className="text-text font-medium flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-text-secondary" /> {viewingUser.phone || viewingUser.number}</p>
                    {viewingUser.email && <p className="text-text font-medium mt-1 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-text-secondary" /> {viewingUser.email}</p>}
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-1">Personal</p>
                    <p className="text-text font-medium flex items-center gap-2"><User className="w-3.5 h-3.5 text-text-secondary shrink-0" /> Gender: {viewingUser.gender || '-'}</p>
                    <p className="text-text font-medium mt-1 flex items-center gap-2"><Droplet className="w-3.5 h-3.5 text-red-500 shrink-0" /> Blood Group: {viewingUser.blood_group || '-'}</p>
                    <p className="text-text font-medium mt-1 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-text-secondary shrink-0" /> DOB: {formatDate(viewingUser.dob)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-1">Location</p>
                    <p className="text-text font-medium flex items-center gap-2 mt-1 flex-wrap">
                      <MapPin className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                      <span>{viewingUser.address || '-'}</span>
                      {viewingUser.village && <span className="text-primary font-semibold">({viewingUser.village})</span>}
                      {viewingUser.city_name ? `, City: ${viewingUser.city_name}` : (viewingUser.city_id?.name ? `, City: ${viewingUser.city_id.name}` : (viewingUser.city ? `, City: ${viewingUser.city}` : ''))}
                    </p>
                  </div>
                  {viewingUser.family_head && viewingUser.family_head.name && viewingUser.relation !== 'Self' && (
                    <div className="sm:col-span-2">
                      <p className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-1">Family Head</p>
                      <p className="text-text font-medium bg-surface rounded-lg p-2 border border-border inline-flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" /> {viewingUser.family_head.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-text mb-3">Family Members ({familyMembers.filter(m => m.id !== viewingUser.id).length})</h4>
              {membersLoading ? (
                <div className="py-8 text-center text-text-secondary animate-pulse">Loading members...</div>
              ) : familyMembers.filter(m => m.id !== viewingUser.id).length > 0 ? (
                <div className="overflow-x-auto bg-card border border-border rounded-xl shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-secondary/50 text-text-secondary text-xs uppercase tracking-wider font-semibold border-b border-border">
                        <th className="p-3">Name</th>
                        <th className="p-3">Relation</th>
                        <th className="p-3">Gender</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {familyMembers.filter(m => m.id !== viewingUser.id).map(member => (
                        <tr key={member.id} className="hover:bg-surface-secondary/30 transition-colors text-sm">
                          <td className="p-3 font-medium text-text flex items-center gap-2">
                            {member.relation === 'Self' && <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" title="Family Head" />}
                            {member.name}
                          </td>
                          <td className="p-3 text-text-secondary capitalize">{member.relation}</td>
                          <td className="p-3 text-text-secondary">{member.gender || '-'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${Number(member.status) === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-secondary text-text-secondary'}`}>
                              {Number(member.status) === 1 ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-text-secondary bg-surface-secondary rounded-xl border border-border">
                  No members found under this head.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}




