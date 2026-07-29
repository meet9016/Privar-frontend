import React, { useCallback, useEffect, useState } from 'react'
import { Edit2, Trash2, Plus, Search, RefreshCw, Sparkles, Users as UsersIcon } from 'lucide-react'
import api, { getUsersList } from '../lib/api'
import { confirm } from '../lib/confirm'
import { getUserRoleLabel, normalizeRoles, unwrapApiData } from '../lib/roles'
import Modal from '../components/Modal'
import UserForm from '../components/UserForm'

const limit = 10

export default function Users() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchValue] = useState('')
  const [filters, setFiltersValue] = useState({
    gender: '',
    blood_group: '',
    is_committee: ''
  })

  const filterGender = filters.gender || ''
  const filterBloodGroup = filters.blood_group || ''
  const filterCommittee = filters.is_committee || ''

  const [roles, setRoles] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
  }, [filters, page, searchQuery])

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
        // Update
        const res = await api.put(`/users/${selectedUser.id}`, formData)
        const updated = res.data?.data || res.data || {}
        setSuccess('Member updated successfully')
        fetchUsers() // Refresh list
      } else {
        // Create
        const res = await api.post('/users', formData)
        const created = res.data?.data || res.data || {}
        setSuccess('Member created successfully')
        fetchUsers() // Refresh list
      }
      setIsModalOpen(false)
      setSelectedUser(null)
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save member')
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
      setSuccess('Member deleted successfully')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError('Failed to delete member')
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

  const clearFilters = () => {
    setSearchQuery('')
    setFilters({
      gender: '',
      blood_group: '',
      is_committee: ''
    })
  }

  

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Family Registry</h2>
   
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={clearFilters}
            className="flex items-center justify-center p-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-text-secondary hover:text-text transition-all"
            title="Reset Grid"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCreate}
            className="flex text-white items-center gap-2 bg-primary hover:bg-primary-hover hover:shadow-glow-primary text-text px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300"
          >
            <Plus className="w-4 h-4 text-white font-semibold text-text tracking-tight" /> Add Member
          </button>
        </div>
      </div>

      {/* Operation Status alerts */}
      {error && (
        <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-2xl text-sm flex items-center gap-2 animate-fade-in shadow-sm">
          <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
          {error}
        </div>
      )}
      {success && (
        <div className="bg-success-bg border border-success-border text-success-text p-4 rounded-2xl text-sm flex items-center gap-2 animate-fade-in shadow-sm">
          <span className="w-2 h-2 rounded-full bg-success animate-ping"></span>
          {success}
        </div>
      )}

      {/* Advanced Filter panel */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-glass-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-secondary">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-input-bg text-input-text placeholder-text-secondary border border-input-border hover:border-border focus:border-primary/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-300"
            />
          </div>

          {/* Gender filter */}
          <div>
            <select
              value={filterGender}
              onChange={(e) => setFilters(current => ({ ...current, gender: e.target.value }))}
              className="w-full bg-input-bg text-text border border-input-border rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-primary/50 transition-all cursor-pointer"
            >
              <option value="" className="bg-surface text-text">All Genders</option>
              <option value="Male" className="bg-surface text-text">Male</option>
              <option value="Female" className="bg-surface text-text">Female</option>
              <option value="Other" className="bg-surface text-text">Other</option>
            </select>
          </div>

          {/* Blood group filter */}
          <div>
            <select
              value={filterBloodGroup}
              onChange={(e) => setFilters(current => ({ ...current, blood_group: e.target.value }))}
              className="w-full bg-input-bg text-text border border-input-border rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-primary/50 transition-all cursor-pointer"
            >
              <option value="" className="bg-surface text-text">All Blood Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                <option key={bg} value={bg} className="bg-surface text-text">{bg}</option>
              ))}
            </select>
          </div>

          {/* Committee filter */}
          <div>
            <select
              value={filterCommittee}
              onChange={(e) => setFilters(current => ({ ...current, is_committee: e.target.value }))}
              className="w-full bg-input-bg text-text border border-input-border rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-primary/50 transition-all cursor-pointer"
            >
              <option value="" className="bg-surface text-text">All Roles</option>
              <option value="true" className="bg-surface text-text">Committee Only</option>
              <option value="false" className="bg-surface text-text">General Members</option>
            </select>
          </div>
        </form>
      </div>

      {/* Main Table view */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin"></div>
          <span className="text-text-secondary text-sm">Querying members data...</span>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-glass-sm">
          {users.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-4">
              <UsersIcon className="w-12 h-12 text-text-secondary" />
              <div>
                <h4 className="font-semibold text-text">No Memers found</h4>
                <p className="text-text-secondary text-sm mt-1">Try expanding your search criteria or register a new member</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary text-text-secondary text-sm font-semibold  tracking-wider">
                    <th className="p-4">Name</th>
                    <th className="p-4">Contact Info</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(user => {
                    const roleLabel = getUserRoleLabel(user)

                    return (
                    <tr key={user.id} className="hover:bg-surface-secondary text-sm text-text-secondary transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-semibold text-primary border border-primary/20 ">
                            {user.first_name ? user.first_name.substring(0, 1) : '-'}
                            {user.last_name ? user.last_name.substring(0, 1) : ''}
                          </div>
                          <div>
                            <div className="font-semibold text-text">{user.name}</div>
                            <div className="text-sm text-text-secondary mt-0.5 capitalize">{user.relation == 'Self' && "Family Head"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>{user.email || <span className="text-text-secondary">No Email</span>}</div>
                        <div className="text-sm text-text-secondary mt-0.5 font-mono">{user.phone || user.number}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">

                    <span className={`inline-flex px-2.5 py-1 rounded-lg border text-sm font-semibold ${Number(user.status ?? 1) === 1 ? 'bg-success-bg border-success-border text-success-text' : 'bg-surface-secondary border-border text-text-secondary'}`}>
                      {Number(user.status ?? 1) === 1 ? 'Active' : 'Inactive'}
                    </span>
                  
                      
                        </div>
                      </td>
                      <td className="p-4">
                        {user.is_committee ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span>{roleLabel}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-secondary text-text-secondary font-medium text-sm">
                            {roleLabel}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(user)} className="p-2 text-primary hover:text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit Profile">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="p-2 text-error-text hover:text-error bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all" title="Delete Member">
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
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border bg-surface-secondary/40 text-sm">
            <span className="text-text-secondary">
              Page {currentPage} of {totalPages} {pagination.total ? `(${pagination.total} total)` : ''}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={loading || currentPage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              {pageNumbers.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={loading || item === currentPage}
                  onClick={() => setPage(item)}
                  className={`min-w-10 px-3 py-2 rounded-lg border ${
                    item === currentPage
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-card text-text hover:bg-surface-secondary'
                  } disabled:cursor-not-allowed`}
                >
                  {item}
                </button>
              ))}
              <button type="button" disabled={loading || currentPage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
      </div>
      )}

      {/* Editor Modal overlay */}
      <Modal
        isOpen={isModalOpen}
        title={selectedUser ? 'Modify Member Profile' : 'Register New Member'}
        onClose={handleCloseModal}
      >
        <UserForm user={selectedUser} roles={roles} onSubmit={handleSubmit} isLoading={formLoading} />
      </Modal>
    </div>
  )
}
