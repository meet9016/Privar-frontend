import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Edit2, Trash2, Plus, Search, RefreshCw, Sparkles, Users as UsersIcon, Eye, CheckCircle, XCircle, Phone, Mail, Crown, MapPin, Calendar, Filter } from 'lucide-react'
import api, { getUsersList } from '../lib/api'
import { confirm } from '../lib/confirm'
import { getUserRoleLabel, normalizeRoles, unwrapApiData } from '../lib/roles'
import { hasPermission } from '../lib/permissions'
import { AuthContext } from '../context/AuthContext'
import Modal from '../components/Modal'
import UserForm from '../components/UserForm'
import Select from '../components/common/Select'
import Input from '../components/common/Input'
import Table from '../components/common/Table'
import { toast } from '../lib/toast'

export default function Users() {
  const { user: currentUser } = useContext(AuthContext)
  const [users, setUsers] = useState([])
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchValue] = useState('')
  const [filters, setFiltersValue] = useState({
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

  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1)
  const currentPage = Math.min(Math.max(Number(pagination.page) || page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getUsersList({ page, limit, search: searchQuery, ...filters })
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
  }, [filters, page, searchQuery, limit])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles')
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

  const setFilters = (value) => {
    setFiltersValue((current) => (typeof value === 'function' ? value(current) : value))
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
    <div className="space-y-4 animate-slide-up">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Family Registry</h2>
   
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64 sm:w-80">
            <Input
              icon={<Search className="w-4 h-4" />}
              type="text"
              placeholder="Search by name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-secondary hover:bg-surface border-border text-text-secondary hover:text-text'}`}
            title="Toggle Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 bg-surface-secondary border border-border p-1.5 rounded-xl animate-fade-in shadow-sm">
              <span className="text-xs font-semibold text-text-secondary px-2">{selectedUsers.length} selected:</span>
              <button
                onClick={() => handleBulkUpdateStatus(1)}
                disabled={formLoading}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Active
              </button>
              <button
                onClick={() => handleBulkUpdateStatus(0)}
                disabled={formLoading}
                className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
              >
                <XCircle className="w-3.5 h-3.5" /> Inactive
              </button>
            </div>
          )}
          {hasPermission(currentUser, ['members.add', 'members.create', 'users.manage']) && (
            <button
              onClick={handleCreate}
              className="flex text-white items-center gap-2 bg-primary hover:bg-primary-hover hover:shadow-glow-primary text-text px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300"
            >
              <Plus className="w-4 h-4 text-white font-semibold text-text tracking-tight" /> Add Member
            </button>
          )}
        </div>
      </div>

      {/* Operation Status alerts */}


      {/* Advanced Filter panel */}
      <div className={`transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[500px] opacity-100 mt-4 overflow-visible z-20 relative' : 'max-h-0 opacity-0 mt-0 overflow-hidden pointer-events-none'}`}>
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-glass-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            value={filterGender}
            onChange={(val) => setFilters(current => ({ ...current, gender: val }))}
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
            value={filterStatus}
            onChange={(val) => setFilters(current => ({ ...current, status: val }))}
            placeholder="All Status"
            searchable={false}
            options={[
              { label: 'All Status', value: '' },
              { label: 'Active', value: '1' },
              { label: 'Inactive', value: '0' }
            ]}
          />
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={clearFilters} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
          </button>
        </div>
        </div>
      </div>

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
                {!loading && users.length > 0 ? (
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                    checked={users.length > 0 && users.every(u => selectedUsers.includes(u.id))}
                    onChange={handleSelectAll}
                  />
                ) : (
                  <div className="w-4 h-4 rounded border border-border/40 bg-surface-secondary/40" />
                )}
              </div>
            ),
            render: (row) => (
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
            render: (row) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-semibold text-primary border border-primary/20">
                  {user.first_name ? user.first_name.substring(0, 1) : '-'}
                  {user.last_name ? user.last_name.substring(0, 1) : ''}
                </div>
                <div>
                  <div className="font-semibold text-text">{user.name}</div>
                  <div className="text-sm text-text-secondary mt-0.5 capitalize">{user.relation == 'Self' && "Family Head"}</div>
                </div>
              </div>
            )
          },
          {
            key: 'phone',
            header: 'Mobile Number',
            render: (row) => (
              <div className="text-sm font-mono text-text">{user.phone || user.number || '-'}</div>
            )
          },
          {
            key: 'email',
            header: 'Email',
            render: (row) => (
              <div className="text-sm text-text-secondary">{user.email || <span className="opacity-50">No Email</span>}</div>
            )
          },
          {
            key: 'gender',
            header: 'Gender',
            render: (row) => (
              <div className="text-sm text-text-secondary">{user.gender || '-'}</div>
            )
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
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
            render: row=> ( <div className="flex items-center justify-start gap-2">
                <button onClick={() => handleView(user)} className="p-2 text-indigo-500 hover:text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl transition-all" title="View Profile">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {hasPermission(currentUser, ['members.edit', 'users.edit', 'users.manage']) && (
                  <button onClick={() => handleEdit(user)} className="p-2 text-primary hover:text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit Profile">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {hasPermission(currentUser, ['members.delete', 'users.delete', 'users.manage']) && (
                  <button onClick={() => handleDelete(user.id)} className="p-2 text-error-text hover:text-error bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all" title="Delete Member">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          }
        ]}
        data={users}
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
                    <p className="text-text font-medium flex items-center gap-2">Gender: {viewingUser.gender || '-'}</p>
                    <p className="text-text font-medium mt-1 flex items-center gap-2">Blood Group: {viewingUser.blood_group || '-'}</p>
                    <p className="text-text font-medium mt-1 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-text-secondary" /> DOB: {viewingUser.dob ? new Date(viewingUser.dob).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-1">Location</p>
                    <p className="text-text font-medium flex items-center gap-2 mt-1"><MapPin className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" /> {viewingUser.address || '-'} {viewingUser.city_id ? `, City: ${viewingUser.city_id}` : ''}</p>
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




