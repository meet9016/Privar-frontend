import React, { useCallback, useEffect, useState } from 'react'
import { Users, Search, UserCheck, UserMinus, User2, MapPin, Phone, RefreshCw, UserPlus, CheckSquare, Square } from 'lucide-react'
import api, { assetUrl } from '../../lib/api'
import { MANDAL_ENDPOINTS } from '../../utils/endpoints'
import Table from '../../components/common/Table'
import SearchInput from '../../components/common/SearchInput'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import usePagination from '../../hooks/usePagination'
import useDebounce from '../../hooks/useDebounce'
import { toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'

export default function MandalMembers({ mandalId, mandal }) {
  const [members, setMembers] = useState([])
  const [totalMandalMembers, setTotalMandalMembers] = useState(0)
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(15)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [filterType, setFilterType] = useState('all')
  const [selectedIds, setSelectedIds] = useState([])
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(MANDAL_ENDPOINTS.GET_MEMBERS, {
        params: getParams({
          mandal_id: mandalId,
          search: debouncedSearch,
          filter_type: filterType
        })
      })
      setMembers(res.data?.data?.data || [])
      setTotalMandalMembers(res.data?.data?.total_mandal_members || 0)
      setPaginationData(res.data?.data?.pagination || {})
    } catch {
      toast.error('Failed to load members')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [mandalId, debouncedSearch, filterType, page, limit, getParams, setPaginationData])

  useEffect(() => {
    fetchMembers()
    setSelectedIds([])
  }, [fetchMembers])

  const handleToggle = async (memberId) => {
    setActionLoadingId(memberId)
    try {
      const res = await api.post(MANDAL_ENDPOINTS.TOGGLE_MEMBER, {
        member_id: memberId,
        mandal_id: mandalId
      })
      const isEnrolled = res.data?.data?.is_mandal_member
      toast.success(isEnrolled ? 'Member enrolled in Mandal' : 'Member removed from Mandal')
      fetchMembers()
    } catch {
      toast.error('Failed to update member status')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return
    const isConfirmed = await confirm(
      `Are you sure you want to ${action === 'add' ? 'enroll' : 'remove'} ${selectedIds.length} selected member(s)?`,
      {
        confirmText: action === 'add' ? 'Enroll' : 'Remove',
        type: action === 'add' ? 'info' : 'danger'
      }
    )
    if (!isConfirmed) return

    setBulkLoading(true)
    try {
      await api.post(MANDAL_ENDPOINTS.BULK_MEMBERS, {
        member_ids: selectedIds,
        action,
        mandal_id: mandalId
      })
      toast.success(`Successfully ${action === 'add' ? 'enrolled' : 'removed'} ${selectedIds.length} members`)
      setSelectedIds([])
      fetchMembers()
    } catch {
      toast.error('Failed to update selected members')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleEnrollAll = async () => {
    const isConfirmed = await confirm(
      `Are you sure you want to enroll ALL registered community members into ${mandal?.name || 'Mandal'}?`,
      {
        confirmText: 'Enroll All',
        type: 'info'
      }
    )
    if (!isConfirmed) return
    setBulkLoading(true)
    try {
      const res = await api.post(MANDAL_ENDPOINTS.BULK_MEMBERS, {
        action: 'enroll_all',
        mandal_id: mandalId
      })
      toast.success(res.data?.message || 'All members enrolled successfully')
      setSelectedIds([])
      fetchMembers()
    } catch {
      try {
        const allUsersRes = await api.get(MANDAL_ENDPOINTS.GET_MEMBERS, {
          params: { mandal_id: mandalId, limit: 5000, filter_type: 'all' }
        })
        const allIds = (allUsersRes.data?.data?.data || []).map(m => m.id || m._id)
        if (allIds.length > 0) {
          await api.post(MANDAL_ENDPOINTS.BULK_MEMBERS, {
            action: 'add',
            member_ids: allIds,
            mandal_id: mandalId
          })
          toast.success(`Successfully enrolled all ${allIds.length} members into Mandal`)
          setSelectedIds([])
          fetchMembers()
        } else {
          toast.error('No members found to enroll')
        }
      } catch (innerErr) {
        toast.error(innerErr.response?.data?.message || 'Failed to enroll all members')
      }
    } finally {
      setBulkLoading(false)
    }
  }

  const isAllPageSelected = members.length > 0 && members.every(m => selectedIds.includes(m.id || m._id))

  const toggleSelectAll = () => {
    if (isAllPageSelected) {
      const pageIds = members.map(m => m.id || m._id)
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)))
    } else {
      const pageIds = members.map(m => m.id || m._id)
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  return (
    <div className="space-y-4 animate-slide-up text-text">
      {/* Unified Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Users className="w-4 h-4" />
            <span>Enrolled: <strong className="font-bold text-sm">{totalMandalMembers}</strong></span>
          </div>

          <button
            type="button"
            onClick={handleEnrollAll}
            disabled={bulkLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Enroll all community members into this Mandal at once"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{bulkLoading ? 'Enrolling All...' : 'Enroll All Members'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SearchInput
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
            onClear={() => { setSearch(''); resetPage() }}
            placeholder="Search member, phone, village..."
            wrapperClassName="w-60 sm:w-72"
          />
          <div className="w-44">
            <Select
              value={filterType}
              onChange={(val) => { setFilterType(val); resetPage() }}
              options={[
                { label: 'All Members', value: 'all' },
                { label: 'Enrolled in Mandal', value: 'mandal_only' },
                { label: 'Not in Mandal', value: 'non_mandal' }
              ]}
            />
          </div>

          <button
            type="button"
            onClick={fetchMembers}
            className="p-2.5 rounded-xl border border-border bg-input-bg hover:bg-surface-secondary text-text-secondary hover:text-text transition-colors cursor-pointer shadow-xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in">
          <span className="font-semibold text-primary">
            {selectedIds.length} member(s) selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleBulkAction('add')}
              disabled={bulkLoading}
              icon={<UserCheck className="w-4 h-4" />}
            >
              Enroll Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('remove')}
              disabled={bulkLoading}
              icon={<UserMinus className="w-4 h-4 text-rose-500" />}
            >
              Remove Selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* Members Table */}
      <Table
        columns={[
          {
            header: (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="p-1 rounded hover:bg-surface-secondary cursor-pointer transition-colors text-text-secondary hover:text-primary"
                  title={isAllPageSelected ? "Deselect page" : "Select all on page"}
                >
                  {isAllPageSelected ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <span>Member</span>
              </div>
            ),
            key: 'member',
            render: (member) => {
              const id = member.id || member._id
              const isSelected = selectedIds.includes(id)
              const photo = member.profile_image || member.image
              return (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSelectOne(id)}
                    className="p-1 rounded hover:bg-surface-secondary cursor-pointer transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-text-secondary" />
                    )}
                  </button>
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                    {photo ? (
                      <img src={assetUrl(photo)} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <User2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-text text-sm leading-snug">{member.name || member.full_name || '-'}</p>
                    <p className="text-xs text-text-secondary">{member.member_id || member.id_number || member.number || '-'}</p>
                  </div>
                </div>
              )
            }
          },
          {
            header: 'Contact',
            key: 'contact',
            render: (member) => {
              const phoneNum = member.number || member.mobile || member.phone
              return (
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <Phone className="w-3.5 h-3.5 shrink-0 text-text-secondary" />
                  <span className="font-medium text-text">{phoneNum || '-'}</span>
                </div>
              )
            }
          },
          {
            header: 'Village / Native',
            key: 'village',
            render: (member) => {
              const villageName = member.village || member.village_name || member.village_id || member.address
              return (
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-text-secondary" />
                  <span className="font-medium text-text">{villageName || '-'}</span>
                </div>
              )
            }
          },
          {
            header: 'Status',
            key: 'status',
            render: (member) => (
              member.is_mandal_member ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <UserCheck className="w-3.5 h-3.5" /> Enrolled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-secondary border border-border text-text-secondary">
                  Not Enrolled
                </span>
              )
            )
          },
          {
            header: 'Action',
            key: 'action',
            align: 'right',
            render: (member) => {
              const isEnrolled = Boolean(member.is_mandal_member)
              const id = member.id || member._id
              const isActionLoading = actionLoadingId === id
              return (
                <button
                  type="button"
                  onClick={() => handleToggle(id)}
                  disabled={isActionLoading}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                    isEnrolled
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/30'
                  }`}
                >
                  {isEnrolled ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>{isActionLoading ? 'Removing...' : 'Remove'}</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isActionLoading ? 'Enrolling...' : 'Enroll in Mandal'}</span>
                    </>
                  )}
                </button>
              )
            }
          }
        ]}
        data={members}
        keyField="id"
        loading={loading}
        emptyState={{
          icon: Users,
          title: 'No members found',
          description: 'Try adjusting your search criteria or filter options.'
        }}
        pagination={{
          currentPage: page,
          totalPages,
          total,
          loading,
          onPageChange: setPage,
          limit,
          onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1); }
        }}
      />
    </div>
  )
}
