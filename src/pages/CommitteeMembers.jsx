import React, { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Edit2, Plus, RefreshCw, Search, Trash2, Users } from 'lucide-react'
import api, { getCommitteeMembersList } from '../lib/api'
import { confirm } from '../lib/confirm'
import { normalizeRoles, unwrapApiData } from '../lib/roles'
import Modal from '../components/Modal'
import CommitteeMemberForm from '../components/CommitteeMemberForm'
import Loader from '../components/common/Loader'
import Button from '../components/common/Button'
import Table from '../components/common/Table'

const limit = 10

export default function CommitteeMembers() {
  const [members, setMembers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
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
      const rows = res.data?.data || res.data || []
      const pg = res.data?.pagination || {}
      setMembers(Array.isArray(rows) ? rows : [])
      setPagination({
        page: Number(pg.page || page),
        totalPages: Number(pg.totalPages || pg.total_pages || pg.last_page || 1),
        total: Number(pg.total || 0),
        limit: Number(pg.limit || limit)
      })
    } catch (err) {
      setMembers([])
      setPagination({ page, totalPages: 1, total: 0, limit })
      setError(err.response?.data?.message || 'Failed to load committee members')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchCommitteeMembers()
  }, [fetchCommitteeMembers])

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles')
        setRoles(normalizeRoles(unwrapApiData(res)))
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load roles')
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
      setSuccess(selected ? 'Committee member updated successfully' : 'Committee member added successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update committee member')
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
      setSuccess('Committee member deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete committee member')
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



  return (
    <div className="space-y-6 animate-slide-up text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Committee Members</h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button onClick={fetchCommitteeMembers} variant="secondary" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-text-secondary/60" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search committee..." className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50" />
          </div>
          <Button onClick={openCreate} variant="primary" icon={<Plus className="w-4 h-4" />}>
            Add Member
          </Button>
        </div>
      </div>

      {error && <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-2xl text-sm">{error}</div>}
      {success && <div className="bg-success-bg border border-success-border text-success-text p-4 rounded-2xl text-sm">{success}</div>}

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
            align: 'right',
            render: (member) => (
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => openEdit(member)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="p-2 text-error bg-error/10 hover:bg-error/20 border border-error/20 rounded-xl transition-all" title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }
        ]}
        data={filtered}
        keyField="id"
        loading={loading}
        emptyState={{
          icon: Users,
          title: 'No committee members found',
          description: 'Try expanding your search criteria or add a new member'
        }}
        pagination={{
          currentPage: page,
          totalPages: pagination.totalPages,
          total: pagination.total,
          pageNumbers,
          loading,
          onPageChange: setPage
        }}
      />

      <Modal isOpen={isModalOpen} title={selected ? 'Edit Committee Member' : 'Add Committee Member'} onClose={() => setIsModalOpen(false)}>
        <CommitteeMemberForm member={selected} onSubmit={handleSubmit} isLoading={saving} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  )
}