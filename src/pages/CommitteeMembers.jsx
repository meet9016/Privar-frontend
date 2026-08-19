import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Edit2, Plus, RefreshCw, Search, Trash2, Users, Filter } from 'lucide-react'
import api, { getCommitteeMembersList } from '../lib/api'
import { confirm } from '../lib/confirm'
import { normalizeRoles, unwrapApiData } from '../lib/roles'
import { hasPermission } from '../lib/permissions'
import { AuthContext } from '../context/AuthContext'
import Modal from '../components/Modal'
import CommitteeMemberForm from '../components/CommitteeMemberForm'
import Loader from '../components/common/Loader'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import { toast } from '../lib/toast'


export default function CommitteeMembers() {
  const { user: currentUser } = useContext(AuthContext)
  const [members, setMembers] = useState([])
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [roles, setRoles] = useState([])
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.state?.editItem) {
      setSelected(location.state.editItem)
      setIsModalOpen(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, navigate, location.pathname])

  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1)
  const currentPage = Math.min(Math.max(Number(pagination.page) || page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const fetchCommitteeMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCommitteeMembersList({ page, limit, search })
      const rawData = res.data?.data || res.data?.members || res.data || []
      const rows = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : [])
      const pg = res.data?.pagination || res.data?.data?.pagination || {}
      setMembers(rows)
      setPagination({
        page: Number(pg.page || page || 1),
        totalPages: Number(pg.totalPages || pg.total_pages || pg.last_page || 1),
        total: Number(pg.total || rows.length || 0),
        limit: Number(pg.limit || limit || 10)
      })
    } catch (err) {
      setMembers([])
      setPagination({ page, totalPages: 1, total: 0, limit })
      setError(err.response?.data?.message || 'Failed to load committee members')
    } finally {
      setLoading(false)
    }
  }, [page, search, limit])

  useEffect(() => {
    fetchCommitteeMembers()
  }, [fetchCommitteeMembers])

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles')
        setRoles(normalizeRoles(unwrapApiData(res)))
      } catch (err) {
        console.warn('Could not load roles list:', err.message)
      }
    }
    fetchRoles()
  }, [])

  const setSearch = (value) => {
    setSearchValue(value)
    setPage(1)
  }

  const handleSubmit = async (formData) => {
    setSaving(true)
    try {
      if (selected) {
        await api.put(`/committee-members/${selected.id}`, formData)
      } else {
        await api.post('/committee-members', formData)
      }
      await fetchCommitteeMembers()
      setSelected(null)
      setIsModalOpen(false)
      toast.success(selected ? 'Committee member updated successfully' : 'Committee member added successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update committee member')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!await confirm('Are you sure you want to delete this committee member?')) {
      return
    }

    setSaving(true)
    try {
      await api.delete(`/committee-members/${id}`)
      await fetchCommitteeMembers()
      toast.success('Committee member deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete committee member')
    } finally {
      setSaving(false)
    }
  }

  const filtered = members

  const openCreate = () => {
    setSelected(null)
    setIsModalOpen(true)
  }

  const openEdit = (member) => {
    setSelected(member)
    setIsModalOpen(true)
  }

  const handleBulkStatus = async (selectedIds, newStatus) => {
    if (!selectedIds.length) return;
    try {
      await Promise.all(selectedIds.map(id => api.put(`/committee-members/${id}`, { status: newStatus })));
      toast.success(`Selected members marked as ${newStatus === 1 ? 'Active' : 'Inactive'}`);
      await fetchCommitteeMembers();
    } catch (err) {
      toast.error('Failed to update status for selected members');
      await fetchCommitteeMembers();
    }
  };

  const handleBulkDelete = async (selectedIds) => {
    if (!selectedIds.length) return;
    if (!await confirm(`Are you sure you want to delete ${selectedIds.length} selected members?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/committee-members/${id}`)));
      toast.success(`${selectedIds.length} members deleted successfully`);
      await fetchCommitteeMembers();
    } catch (err) {
      toast.error('Failed to delete selected members');
      await fetchCommitteeMembers();
    }
  };

  return (
    <div className="space-y-6 animate-slide-up text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Committee Members</h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative group flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-secondary/60">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search committee..."
              className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border focus:border-primary/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          {hasPermission(currentUser, ['committee.add', 'members.add', 'users.manage']) && (
            <Button onClick={openCreate} variant="primary" icon={<Plus className="w-4 h-4" />}>
              Add Member
            </Button>
          )}
        </div>
      </div>



      <Table
        columns={[
          {
            header: 'Name',
            key: 'name',
            render: (member) => (
              <div className="flex items-center gap-3">
                {member.image ? (
                  <img src={member.image} alt="" className="h-9 w-9 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-surface-secondary flex items-center justify-center text-sm font-semibold text-text-secondary">{member.first_name?.slice(0, 1) || 'CM'}</div>
                )}
                <div>
                  <div className="font-semibold text-text">{member.first_name} {member.middle_name} {member.last_name}</div>
                  <div className="text-sm text-text-secondary">{member.designation}</div>
                </div>
              </div>
            )
          },
          {
            header: 'Contact',
            key: 'contact',
            render: (member) => <span>{member.number || '-'}</span>
          },
          {
            header: 'Designation',
            key: 'designation',
            render: (member) => (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-medium">
                {member.designation || 'Committee'}
              </span>
            )
          },
          {
            header: 'Assigned Role',
            key: 'role',
            render: (member) => (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-secondary border border-border text-text font-semibold text-xs">
                {member.role_name || (roles.find(r => String(r.id || r._id) === String(member.role_id))?.name) || '-'}
              </span>
            )
          },
          {
            header: 'Status',
            key: 'status',
            render: (member) => (
              <span className={`inline-flex px-2.5 py-1 rounded-lg border text-sm font-semibold ${Number(member.status ?? 1) === 1 ? 'bg-success-bg border-success-border text-success-text' : 'bg-surface-secondary border-border text-text-secondary'}`}>
                {Number(member.status ?? 1) === 1 ? 'Active' : 'Inactive'}
              </span>
            )
          },
          {
            header: 'Actions',
            key: 'actions',
            align: 'left',
            render: member=> ( <div className="flex items-center justify-start gap-2">
                {hasPermission(currentUser, ['committee.edit', 'members.edit', 'users.manage']) && (
                  <button onClick={() => openEdit(member)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {hasPermission(currentUser, ['committee.delete', 'members.delete', 'users.manage']) && (
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-2 text-error bg-error/10 hover:bg-error/20 border border-error/20 rounded-xl transition-all" title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          }
        ]}
        data={filtered}
        keyField="id"
        loading={loading}
        onBulkStatus={hasPermission(currentUser, ['committee.edit', 'members.edit', 'users.manage']) ? handleBulkStatus : undefined}
        onBulkDelete={hasPermission(currentUser, ['committee.delete', 'members.delete', 'users.manage']) ? handleBulkDelete : undefined}
        emptyState={{
          icon: Users,
          title: 'No committee members found',
          description: 'Try adjusting your search criteria or add a new member',
          actionLabel: 'Add Member',
          onAction: hasPermission(currentUser, ['committee.add', 'members.add', 'users.manage']) ? openCreate : undefined
        }}
        pagination={{
          currentPage: page,
          totalPages: pagination.totalPages,
          total: pagination.total,
          pageNumbers,
          loading,
          onPageChange: setPage,
          limit,
          onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1); }
        }}
      />

      <Modal isOpen={isModalOpen} maxWidth="max-w-5xl" title={selected ? 'Edit Committee Member' : 'Add Committee Member'} onClose={() => setIsModalOpen(false)}>
        <CommitteeMemberForm member={selected} roles={roles} onSubmit={handleSubmit} isLoading={saving} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  )
}


