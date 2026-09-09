import React, { useCallback, useContext, useEffect, useState, useMemo, useRef } from 'react'
import { Edit2, Trash2, Plus, Search, RefreshCw, Sparkles, Users as UsersIcon, Eye, CheckCircle, XCircle, Phone, Mail, Crown, MapPin, Calendar, Filter, ChevronDown, User, Droplet, X, Download, Network, List, Heart, Baby, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react'
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import api, { getUsersList, formatDate, assetUrl } from '../lib/api'
import { MEMBER_ENDPOINTS } from '../utils/endpoints'
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
import ImagePreviewModal from '../components/common/ImagePreviewModal'

export default function Users() {
  const { user: currentUser } = useContext(AuthContext)
  const permissions = usePermissions('members')
  const [users, setUsers] = useState([])
  const [previewImage, setImagePreview] = useState(null)
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
  const [editTargetMemberId, setEditTargetMemberId] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedUsers, setSelectedUsers] = useState([])
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingUser, setViewingUser] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [collapsedHeads, setCollapsedHeads] = useState([])
  const [viewTab, setViewTab] = useState('chart') // 'chart' | 'details'
  const [treeZoom, setTreeZoom] = useState(1)
  const [treePan, setTreePan] = useState({ x: 0, y: 0 })
  const [isTreeDragging, setIsTreeDragging] = useState(false)
  const treeDragStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 })

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
        const res = await api.get(MEMBER_ENDPOINTS.GET_ROLES, { params: { limit: 150 } })
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
        await api.put(MEMBER_ENDPOINTS.UPDATE_MEMBER(selectedUser.id), formData)
        toast.success('Member updated successfully')
        fetchUsers() // Refresh list
      } else {
        // Create
        const res = await api.post(MEMBER_ENDPOINTS.CREATE_MEMBER, formData)
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
      await api.delete(MEMBER_ENDPOINTS.DELETE_MEMBER(userId))
      await fetchUsers()
      toast.success('Member deleted successfully')
    } catch (err) {
      toast.error('Failed to delete member')
    }
  }

  // Open create modal
  const handleCreate = () => {
    setSelectedUser(null)
    setEditTargetMemberId(null)
    setIsModalOpen(true)
  }

  // Open edit modal
  const handleEdit = async (user) => {
    const isHead = user.isGroupParent || user.relation === 'Self' || user.familyHead
    if (isHead) {
      setSelectedUser(user)
      setEditTargetMemberId(null)
      setIsModalOpen(true)
    } else {
      // Member under head: find parent head
      const headId = user.parentHeadId || user.family_head?.id || user.family_head?._id || user.family_head_id || user.parent_member_id
      let headUser = users.find(u => String(u.id || u._id) === String(headId) || (u.member_id && u.member_id === user.parent_member_id))
      
      if (!headUser && headId) {
        try {
          // Fetch head user details if not found in current table page
          const res = await api.get(MEMBER_ENDPOINTS.GET_MEMBER(headId))
          headUser = res.data?.data || res.data
        } catch (e) {
          console.error('Could not fetch head user', e)
        }
      }

      if (headUser) {
        setSelectedUser(headUser)
        setEditTargetMemberId(user.id || user._id)
        setIsModalOpen(true)
      } else {
        // Fallback if no head found
        setSelectedUser(user)
        setEditTargetMemberId(null)
        setIsModalOpen(true)
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
    setEditTargetMemberId(null)
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const newSelected = new Set([...selectedUsers, ...users.map(u => String(u.id || u._id))]);
      setSelectedUsers(Array.from(newSelected));
    } else {
      const currentPageIds = users.map(u => String(u.id || u._id));
      setSelectedUsers(selectedUsers.filter(id => !currentPageIds.includes(id)));
    }
  }

  const handleSelectUser = (id) => {
    const targetIdStr = String(id);
    const isCurrentlySelected = selectedUsers.some(uid => String(uid) === targetIdStr);
    
    // Find target user in user list
    const targetUser = users.find(u => String(u.id || u._id) === targetIdStr);
    const isHead = targetUser && (targetUser.familyHead || targetUser.relation === 'Self');
    
    // If user is a head, find all family members under this head
    let relatedIds = [targetIdStr];
    if (isHead) {
      const headMemberId = String(targetUser.member_id || '');
      const childMembers = users.filter(m => {
        if (String(m.id || m._id) === targetIdStr) return false;
        const mHeadId = String(m.family_head?.id || m.family_head?._id || m.family_head_id || '');
        const mParentId = String(m.parent_member_id || '');
        return (mHeadId && (mHeadId === targetIdStr || mHeadId === headMemberId)) ||
               (mParentId && (mParentId === headMemberId || mParentId === targetIdStr));
      });
      childMembers.forEach(m => {
        relatedIds.push(String(m.id || m._id));
      });
    }

    if (isCurrentlySelected) {
      // Deselect user and their family members if head
      setSelectedUsers(prev => prev.filter(uid => !relatedIds.includes(String(uid))));
    } else {
      // Select user and their family members if head
      const newSet = new Set([...selectedUsers.map(String), ...relatedIds]);
      setSelectedUsers(Array.from(newSet));
    }
  }

  const handleBulkUpdateStatus = async (status) => {
    if (!selectedUsers.length) return
    const actionName = status === 1 ? 'activate' : 'deactivate'
    if (!await confirm(`Are you sure you want to ${actionName} ${selectedUsers.length} members?`, { confirmText: status === 1 ? 'Activate' : 'Deactivate', type: status === 1 ? 'primary' : 'danger' })) return
    
    setFormLoading(true)
    try {
      await api.put(MEMBER_ENDPOINTS.BULK_UPDATE_STATUS, { userIds: selectedUsers, status }, { headers: { 'Content-Type': 'application/json' } })
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
    setViewTab('chart')
    setTreeZoom(1)
    setTreePan({ x: 0, y: 0 })
    setIsViewModalOpen(true)
    
    setMembersLoading(true)
    try {
      const headId = user.parentHeadId || user.family_head?.id || user.family_head?._id || user.family_head_id || user.parent_member_id || user.id || user._id
      const res = await api.get(MEMBER_ENDPOINTS.GET_FAMILY_MEMBERS(headId))
      setFamilyMembers(res.data?.data || res.data || [])
    } catch (err) {
      console.error('Failed to fetch family members', err)
    } finally {
      setMembersLoading(false)
    }
  }

  // Auto-focus and scroll to target member card in tree modal
  useEffect(() => {
    if (isViewModalOpen && viewingUser && viewTab === 'chart') {
      const timer = setTimeout(() => {
        const el = document.getElementById('focused-tree-node')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        }
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [isViewModalOpen, viewingUser, viewTab, familyMembers])

  const closeViewModal = () => {
    setIsViewModalOpen(false)
    setViewingUser(null)
    setFamilyMembers([])
    setTreeZoom(1)
    setTreePan({ x: 0, y: 0 })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilters({
      gender: '',
      status: ''
    })
  }

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Family Registry');

      worksheet.columns = [
        { header: 'NAME', key: 'name', width: 40 },
        { header: 'RELATION', key: 'relation', width: 25 },
        { header: 'MOBILE NUMBER', key: 'phone', width: 25 },
        { header: 'EMAIL', key: 'email', width: 35 },
        { header: 'GENDER', key: 'gender', width: 20 },
        { header: 'STATUS', key: 'status', width: 20 }
      ];

      // Style header
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF818CF8' } }; // Lighter Indigo
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
      });

      worksheet.autoFilter = 'A1:F1'; // Add filter to all columns

      groupedUsers.forEach(user => {
        const isHead = user.isGroupParent || user.relation === 'Self' || user.familyHead;
        const statusText = Number(user.status ?? 1) === 1 ? 'Active' : 'Inactive';
        const row = worksheet.addRow({
          name: user.name || '-',
          relation: isHead ? 'Family Head' : (user.relation || '-'),
          phone: user.phone || user.number || '-',
          email: user.email || '-',
          gender: user.gender || '-',
          status: statusText
        });

        // Formatting and borders for all cells in the row
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
          
          // Default alignment for data rows
          if (colNumber > 1) {
             cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
             cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
        });

        // Indent children
        if (user.isGroupChild) {
          row.getCell('name').alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };
        } else if (isHead) {
          row.getCell('name').font = { bold: true };
          row.getCell('relation').font = { bold: true };
        }

        // Status color
        const statusCell = row.getCell('status');
        if (statusText === 'Active') {
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4EA' } }; // Light green
          statusCell.font = { color: { argb: 'FF137333' }, bold: true };
        } else {
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE8E6' } }; // Light red
          statusCell.font = { color: { argb: 'FFC5221F' }, bold: true };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Family_Registry_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel exported successfully');
    } catch (err) {
      toast.error('Failed to export Excel');
      console.error(err);
    }
  };

  

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight">Family Registry</h2>
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
          <Button onClick={handleExportExcel} variant="secondary" icon={<Download className="w-4 h-4" />} className="h-10 border-primary text-primary hover:bg-primary hover:text-white">
            Export
          </Button>
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
                  checked={users.length > 0 && users.every(u => selectedUsers.map(String).includes(String(u.id || u._id)))}
                  disabled={loading || users.length === 0}
                  onChange={handleSelectAll}
                />
              </div>
            ),
            render: (user) => {
              const uId = String(user.id || user._id);
              return (
                <div className="flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                    checked={selectedUsers.map(String).includes(uId)}
                    onChange={() => handleSelectUser(uId)}
                  />
                </div>
              );
            }
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
                  <div className="flex items-center gap-2.5 whitespace-nowrap">
                    <div 
                      onClick={(e) => {
                        const imgSrc = user.image || user.profile_image ? assetUrl(user.image || user.profile_image) : ''
                        if (imgSrc) {
                          e.stopPropagation();
                          setImagePreview({ url: imgSrc, title: `${user.name} (${user.relation || 'Member'})` });
                        }
                      }}
                      style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }}
                      className={`w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0 overflow-hidden shadow-xs ${user.image || user.profile_image ? 'cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all' : ''}`}
                      title={user.image || user.profile_image ? "Click to view photo (Zoom/Pan)" : ""}
                    >
                      {user.image || user.profile_image ? (
                        <img src={assetUrl(user.image || user.profile_image)} alt={user.name} className="w-full h-full object-cover block" />
                      ) : (
                        (user.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="font-semibold text-text capitalize">{user.name}</span>
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
                        {user.relation === 'Spouse' ? 'Wife' : user.relation}
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
                        await api.put(MEMBER_ENDPOINTS.UPDATE_MEMBER(user.id), { status: newStatus }, { headers: { 'Content-Type': 'application/json' } });
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
          actionLabel: (permissions.canAdd || permissions.isSuperAdmin) ? 'Add Member' : undefined,
          onAction: (permissions.canAdd || permissions.isSuperAdmin) ? handleCreate : undefined
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
        <UserForm user={selectedUser} targetMemberId={editTargetMemberId} roles={roles} onSubmit={handleSubmit} isLoading={formLoading} onCancel={handleCloseModal} />
      </Modal>

      {/* View Details & Family Tree Modal */}
      <Modal
        isOpen={isViewModalOpen}
        title="Family & Member Details"
        onClose={closeViewModal}
        maxWidth="max-w-5xl"
      >
        {viewingUser && (
          <div className="space-y-4">
            {/* View Mode Tabs */}
            {/* View Mode Tabs & Zoom Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
              <div className="flex items-center gap-2 bg-surface-secondary/80 p-1 rounded-2xl border border-border/60">
                <button
                  type="button"
                  onClick={() => setViewTab('chart')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewTab === 'chart'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>Family Tree Chart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('details')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewTab === 'details'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Profile & Members List</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Interactive Zoom & Pan Controls for Family Tree */}
                {viewTab === 'chart' && (
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary bg-surface-secondary/70 border border-border px-2.5 py-1 rounded-full select-none">
                      <Move className="w-3 h-3 text-primary" /> Drag to move
                    </span>
                    <div className="flex items-center gap-1 bg-surface-secondary border border-border/80 px-2 py-1 rounded-2xl shadow-xs">
                      <button
                        type="button"
                        onClick={() => setTreeZoom(z => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
                        className="p-1.5 hover:bg-surface rounded-xl text-text-secondary hover:text-text cursor-pointer transition-colors"
                        title="Zoom Out (-)"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTreeZoom(1); setTreePan({ x: 0, y: 0 }); }}
                        className="px-2 py-0.5 text-[11px] font-bold text-text-secondary hover:text-primary hover:bg-surface rounded-lg cursor-pointer transition-colors"
                        title="Reset View (100%)"
                      >
                        {Math.round(treeZoom * 100)}%
                      </button>
                      <button
                        type="button"
                        onClick={() => setTreeZoom(z => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
                        className="p-1.5 hover:bg-surface rounded-xl text-text-secondary hover:text-text cursor-pointer transition-colors"
                        title="Zoom In (+)"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTreeZoom(1); setTreePan({ x: 0, y: 0 }); }}
                        className="p-1.5 hover:bg-surface rounded-xl text-text-secondary hover:text-text cursor-pointer transition-colors"
                        title="Reset Pan & Zoom"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-xs text-text-secondary font-medium">
                  Family Total: <span className="font-bold text-primary">{Math.max(1, familyMembers.length)} Members</span>
                </div>
              </div>
            </div>

            {/* TAB 1: VISUAL FAMILY TREE CHART (MATCHING REFERENCE DIAGRAM) */}
            {viewTab === 'chart' && (
              <div className="py-2">
                {membersLoading ? (
                  <div className="py-20 text-center text-xs text-text-secondary font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
                    Loading family tree...
                  </div>
                ) : (() => {
                  const allList = familyMembers.length > 0 ? familyMembers : [viewingUser]
                  const head = allList.find(m => m.relation === 'Self' || m.familyHead || String(m.id || m._id) === String(viewingUser.family_head?.id || viewingUser.id)) || viewingUser
                  const others = allList.filter(m => String(m.id || m._id) !== String(head.id || head._id) && m.relation !== 'Self')
                  
                  // Categorize relatives
                  const grandfather = others.find(m => m.relation === 'Grandfather')
                  const grandmother = others.find(m => m.relation === 'Grandmother')

                  const father = others.find(m => m.relation === 'Father')
                  const mother = others.find(m => m.relation === 'Mother')

                  const uncles = others.filter(m => m.relation === 'Uncle')
                  const aunts = others.filter(m => m.relation === 'Aunt')

                  const spouses = others.filter(m => ['Spouse', 'Wife', 'Husband'].includes(m.relation))
                  const spouse = spouses[0] || null

                  const brothers = others.filter(m => m.relation === 'Brother')
                  const sisters = others.filter(m => m.relation === 'Sister')
                  const cousins = others.filter(m => m.relation === 'Cousin')
                  const nephews = others.filter(m => m.relation === 'Nephew')
                  const nieces = others.filter(m => m.relation === 'Niece')

                  const sons = others.filter(m => m.relation === 'Son')
                  const daughters = others.filter(m => m.relation === 'Daughter')
                  const sonsInLaw = others.filter(m => m.relation === 'Son-in-law')
                  const daughtersInLaw = others.filter(m => m.relation === 'Daughter-in-law')
                  const otherChildren = others.filter(m => ['Child'].includes(m.relation))
                  const allChildren = [...sons, ...daughters, ...sonsInLaw, ...daughtersInLaw, ...otherChildren]

                  const grandsons = others.filter(m => m.relation === 'Grandson')
                  const granddaughters = others.filter(m => m.relation === 'Granddaughter')
                  const allGrandchildren = [...grandsons, ...granddaughters]
                  
                  // Uncategorized / Remaining members
                  const processedIds = new Set([
                    head?.id || head?._id,
                    grandfather?.id || grandfather?._id,
                    grandmother?.id || grandmother?._id,
                    father?.id || father?._id,
                    mother?.id || mother?._id,
                    ...uncles.map(u => u.id || u._id),
                    ...aunts.map(a => a.id || a._id),
                    ...spouses.map(s => s.id || s._id),
                    ...brothers.map(b => b.id || b._id),
                    ...sisters.map(s => s.id || s._id),
                    ...cousins.map(c => c.id || c._id),
                    ...nephews.map(n => n.id || n._id),
                    ...nieces.map(n => n.id || n._id),
                    ...allChildren.map(c => c.id || c._id),
                    ...allGrandchildren.map(g => g.id || g._id)
                  ].filter(Boolean).map(String))

                  const extraMembers = others.filter(m => !processedIds.has(String(m.id || m._id)))

                  const formatTitleCase = (str) => {
                    if (!str) return ''
                    return str
                      .toString()
                      .trim()
                      .replace(/[_-]+/g, ' ')
                      .split(/\s+/)
                      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                      .join(' ')
                  }

                  // ─── EDRAWMAX TREE NODE CARD ─────────────────────────────
                  const EdrawCard = ({ member, roleLabel, isHead = false }) => {
                    if (!member) return null
                    const fullName = member.name || [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ') || roleLabel
                    let displayRole = isHead ? 'Head (Self)' : (roleLabel || member.relation || 'Member')
                    if (displayRole && displayRole.toLowerCase() === 'spouse') {
                      displayRole = member.gender === 'Male' ? 'Husband' : 'Wife'
                    }
                    const imageSrc = member.image || member.profile_image ? assetUrl(member.image || member.profile_image) : ''

                    const isFocused = Boolean(
                      viewingUser && member && (
                        String(viewingUser.id || viewingUser._id) === String(member.id || member._id) ||
                        (viewingUser.member_id && member.member_id && String(viewingUser.member_id) === String(member.member_id)) ||
                        (viewingUser.name && (viewingUser.name.toLowerCase() === (member.name || '').toLowerCase() || viewingUser.name.toLowerCase() === fullName.toLowerCase()))
                      )
                    )

                    return (
                      <div className="flex flex-col items-center">
                        <div 
                          id={isFocused ? 'focused-tree-node' : undefined}
                          className={`w-36 sm:w-40 bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 flex flex-col items-center select-none relative ${
                            isFocused
                              ? 'border-emerald-500 ring-4 ring-emerald-500/40 shadow-xl scale-105 z-30'
                              : isHead 
                                ? 'border-amber-400 dark:border-amber-500/80 shadow-md ring-2 ring-amber-400/30' 
                                : 'border-slate-400/80 dark:border-slate-500/80 shadow-xs'
                          } p-2.5 hover:shadow-md`}>
                          
                          {/* Focused Viewing Badge (Emerald) */}
                          {isFocused && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg z-30 animate-bounce whitespace-nowrap ring-2 ring-white dark:ring-slate-900">
                              <Eye className="w-2.5 h-2.5 fill-white" />
                              <span>Viewing</span>
                            </div>
                          )}

                          {/* Head Badge (Crown) - Yellow / Golden */}
                          {isHead && !isFocused && (
                            <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md z-10 border border-yellow-300">
                              <Crown className="w-3 h-3 text-yellow-100 fill-yellow-200" />
                              <span>Head</span>
                            </div>
                          )}

                          {/* Photo Box */}
                          <div 
                            className={`w-full h-24 sm:h-28 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 ${imageSrc ? 'cursor-pointer group/photo' : ''}`}
                            onClick={(e) => {
                              if (imageSrc) {
                                e.stopPropagation();
                                setImagePreview({ url: imageSrc, title: `${fullName} (${displayRole})` });
                              }
                            }}
                            title={imageSrc ? 'Click to preview photo (Zoom/Pan)' : ''}
                          >
                            {imageSrc ? (
                              <div className="relative w-full h-full">
                                <img src={imageSrc} alt={fullName} className="w-full h-full object-cover rounded-xl block group-hover/photo:scale-105 transition-transform duration-200" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                                  <Eye className="w-5 h-5 text-white drop-shadow-md" />
                                </div>
                              </div>
                            ) : (
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                                isHead ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                              } shrink-0`}>
                                <User className="w-7 h-7" />
                              </div>
                            )}
                          </div>

                          {/* Name (Title Case) */}
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 text-center mt-2 truncate w-full block" title={fullName}>
                            {formatTitleCase(fullName)}
                          </span>

                          {/* Role Badge (Title Case) */}
                          <div className={`w-full py-0.5 px-2 text-[10px] font-semibold rounded-xl text-center border truncate mt-1 ${
                            isHead 
                              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50 font-bold' 
                              : 'bg-blue-50/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-blue-100 dark:border-slate-700'
                          }`}>
                            {formatTitleCase(displayRole)}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // ─── UNIFIED RECURSIVE GENEALOGICAL TREE NODE (100% MATHEMATICAL ALIGNMENT) ───
                  const renderTreeNode = ({
                    member1,
                    member2 = null,
                    label1,
                    label2 = null,
                    isHead1 = false,
                    isHead2 = false,
                    spouseBadge = 'Married',
                    children = [],
                    childrenBadge = null
                  }) => {
                    const validChildren = (children || []).filter(Boolean)
                    const hasChildren = validChildren.length > 0

                    return (
                      <div className="flex flex-col items-center">
                        {/* Node Header (Single Member or Married Couple) */}
                        <div className="flex items-center justify-center relative">
                          <EdrawCard member={member1} roleLabel={label1} isHead={isHead1} />

                          {member2 && (
                            <>
                              {/* Horizontal spouse bridge with pill badge */}
                              <div className="w-12 sm:w-16 h-[2.5px] bg-[#3B5998] relative flex items-center justify-center shrink-0">
                                <span className="px-2.5 py-0.5 rounded-full bg-[#3B5998] text-white font-semibold text-[9px] shadow-sm select-none z-20">
                                  {spouseBadge}
                                </span>
                              </div>
                              <EdrawCard member={member2} roleLabel={label2} isHead={isHead2} />
                            </>
                          )}
                        </div>

                        {/* Downward Connector & Children Row with generous generation clearance */}
                        {hasChildren && (
                          <div className="flex flex-col items-center w-full">
                            {/* Stem dropping from exact bottom center of couple/card */}
                            <div className="w-[2.5px] h-10 bg-[#3B5998]" />

                            {/* Children Row with Spanning Horizontal Bar */}
                            <div className="flex items-start justify-center relative pt-0">
                              {/* Children Badge pill */}
                              {childrenBadge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                  <span className="px-3.5 py-0.5 rounded-full bg-[#3B5998] text-white font-bold text-[10px] shadow-sm select-none">
                                    {childrenBadge}
                                  </span>
                                </div>
                              )}

                              {validChildren.map((childNode, idx) => (
                                <div key={idx} className="relative flex flex-col items-center px-6 sm:px-10">
                                  {/* Horizontal line starting at 50% of first child, ending at 50% of last child */}
                                  {validChildren.length > 1 && (
                                    <div 
                                      className="absolute top-0 h-[2.5px] bg-[#3B5998]"
                                      style={{
                                        left: idx === 0 ? '50%' : '0%',
                                        right: idx === validChildren.length - 1 ? '50%' : '0%'
                                      }}
                                    />
                                  )}

                                  {/* Vertical stem dropping from horizontal bar into top center of child node with directional arrowhead */}
                                  <div className="flex flex-col items-center">
                                    <div className="w-[2.5px] h-8 bg-[#3B5998]" />
                                    <div className="w-0 h-0 border-l-[4.5px] border-l-transparent border-r-[4.5px] border-r-transparent border-t-[6px] border-t-[#3B5998] -mt-[0.5px]" />
                                  </div>

                                  {/* Child Node */}
                                  {childNode}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }

                  // ─── BUILD GENEALOGICAL SUB-TREES FROM BOTTOM TO TOP ──────────────────

                  // 1. Grandchildren Level (Level 5) - Grandson / Granddaughter (Beta ka Beta / Beti)
                  const grandchildNodes = allGrandchildren.map(g => (
                    renderTreeNode({
                      member1: g,
                      label1: g.relation
                    })
                  ))

                  // 2. Head's Children Level (Level 4)
                  const pairedChildNodes = []
                  const usedChildIds = new Set()
                  let attachedGrandchildren = false

                  // First: Sons (Beta) + Daughters-in-law (Bahu) -> Grandchildren (Grandson/Granddaughter) attach UNDER SONS!
                  sons.forEach((s, idx) => {
                    const sId = String(s.id || s._id)
                    usedChildIds.add(sId)
                    const dil = daughtersInLaw[idx]
                    const childGrandchildren = !attachedGrandchildren && grandchildNodes.length > 0 ? grandchildNodes : []
                    if (childGrandchildren.length > 0) attachedGrandchildren = true

                    if (dil) {
                      const dilId = String(dil.id || dil._id)
                      usedChildIds.add(dilId)
                      pairedChildNodes.push(
                        renderTreeNode({
                          member1: s,
                          member2: dil,
                          label1: 'Son',
                          label2: 'Daughter In Law',
                          spouseBadge: 'Married',
                          children: childGrandchildren,
                          childrenBadge: childGrandchildren.length > 0 ? 'Children' : null
                        })
                      )
                    } else {
                      pairedChildNodes.push(
                        renderTreeNode({
                          member1: s,
                          label1: 'Son',
                          children: childGrandchildren,
                          childrenBadge: childGrandchildren.length > 0 ? 'Children' : null
                        })
                      )
                    }
                  })

                  // Second: Daughters (Beti) -> Direct child cards in lineage chart (No Son-in-law)
                  daughters.forEach(d => {
                    const dId = String(d.id || d._id)
                    usedChildIds.add(dId)
                    pairedChildNodes.push(
                      renderTreeNode({
                        member1: d,
                        label1: 'Daughter'
                      })
                    )
                  })

                  // Other direct children (excluding in-laws)
                  otherChildren.forEach(c => {
                    const cId = String(c.id || c._id)
                    if (!usedChildIds.has(cId)) {
                      pairedChildNodes.push(
                        renderTreeNode({
                          member1: c,
                          label1: c.relation || 'Child'
                        })
                      )
                    }
                  })

                  // Fallback: If grandchildren exist but no sons were present, attach directly
                  if (!attachedGrandchildren && grandchildNodes.length > 0) {
                    pairedChildNodes.push(...grandchildNodes)
                  }

                  // 3. Head Couple (Me + Wife / Husband) (Level 3)
                  const headCoupleNode = renderTreeNode({
                    member1: head,
                    member2: spouse,
                    label1: 'Head (Self)',
                    label2: spouse ? (['Spouse', 'wife', 'Wife'].includes(spouse.relation) ? (spouse.gender === 'Male' ? 'Husband' : 'Wife') : (spouse.relation || 'Wife')) : null,
                    isHead1: true,
                    spouseBadge: 'Married',
                    children: pairedChildNodes,
                    childrenBadge: pairedChildNodes.length > 0 ? 'Children' : null
                  })

                  // 4. Sibling Children (Nephews / Nieces under Brother / Sister) (Level 4 under Level 3)
                  const siblingChildren = [...nephews, ...nieces]
                  const nephewNieceNodes = siblingChildren.map(c => (
                    renderTreeNode({
                      member1: c,
                      label1: c.relation
                    })
                  ))

                  const sisterNodes = sisters.map((s, idx) => (
                    renderTreeNode({
                      member1: s,
                      label1: 'Sister',
                      children: idx === 0 && brothers.length === 0 && nephewNieceNodes.length > 0 ? nephewNieceNodes : [],
                      childrenBadge: idx === 0 && brothers.length === 0 && nephewNieceNodes.length > 0 ? 'Children' : null
                    })
                  ))

                  const brotherNodes = brothers.map((b, idx) => (
                    renderTreeNode({
                      member1: b,
                      label1: 'Brother',
                      children: idx === 0 && nephewNieceNodes.length > 0 ? nephewNieceNodes : [],
                      childrenBadge: idx === 0 && nephewNieceNodes.length > 0 ? 'Children' : null
                    })
                  ))

                  // 5. Siblings + Head Node Array under Parents (Level 3)
                  const siblingsAndHeadNodes = [
                    ...sisterNodes,
                    headCoupleNode,
                    ...brotherNodes
                  ]

                  // 6. Uncle & Aunt Couple + Cousins (Level 2 & Level 3)
                  const cousinNodes = cousins.map(c => (
                    renderTreeNode({
                      member1: c,
                      label1: 'Cousin'
                    })
                  ))

                  const uncleAuntNodes = []
                  const maxUncles = Math.max(uncles.length, aunts.length)
                  for (let i = 0; i < maxUncles; i++) {
                    const u = uncles[i]
                    const a = aunts[i]
                    const attachCousins = i === 0 && cousinNodes.length > 0 ? cousinNodes : []
                    if (u && a) {
                      uncleAuntNodes.push(
                        renderTreeNode({
                          member1: u,
                          member2: a,
                          label1: 'Uncle',
                          label2: 'Aunt',
                          spouseBadge: 'Married',
                          children: attachCousins,
                          childrenBadge: attachCousins.length > 0 ? 'Children' : null
                        })
                      )
                    } else if (u) {
                      uncleAuntNodes.push(
                        renderTreeNode({
                          member1: u,
                          label1: 'Uncle',
                          children: attachCousins,
                          childrenBadge: attachCousins.length > 0 ? 'Children' : null
                        })
                      )
                    } else if (a) {
                      uncleAuntNodes.push(
                        renderTreeNode({
                          member1: a,
                          label1: 'Aunt',
                          children: attachCousins,
                          childrenBadge: attachCousins.length > 0 ? 'Children' : null
                        })
                      )
                    }
                  }
                  if (uncleAuntNodes.length === 0 && cousinNodes.length > 0) {
                    uncleAuntNodes.push(...cousinNodes)
                  }

                  // 7. Parents Generation Tree (Father + Mother) (Level 2)
                  const hasParents = Boolean(father || mother)
                  const parentsNode = hasParents
                    ? renderTreeNode({
                        member1: father || mother,
                        member2: father && mother ? mother : null,
                        label1: father ? 'Father' : 'Mother',
                        label2: father && mother ? 'Mother' : null,
                        spouseBadge: 'Married',
                        children: siblingsAndHeadNodes
                      })
                    : null

                  // 8. Grandparents Generation Tree (Level 1)
                  const hasGrandparents = Boolean(grandfather || grandmother)
                  
                  const grandparentsChildrenNodes = [
                    parentsNode || (hasGrandparents ? siblingsAndHeadNodes : null),
                    ...uncleAuntNodes
                  ].flat().filter(Boolean)

                  const fullTree = hasGrandparents ? (
                    renderTreeNode({
                      member1: grandfather || grandmother,
                      member2: grandfather && grandmother ? grandmother : null,
                      label1: grandfather ? 'Grandfather' : 'Grandmother',
                      label2: grandfather && grandmother ? 'Grandmother' : null,
                      spouseBadge: 'Married',
                      children: grandparentsChildrenNodes
                    })
                  ) : hasParents ? (
                    uncleAuntNodes.length > 0 ? (
                      <div className="flex items-start justify-center relative">
                        {[parentsNode, ...uncleAuntNodes].filter(Boolean).map((node, idx, arr) => (
                          <div key={idx} className="relative flex flex-col items-center px-4 sm:px-8">
                            {arr.length > 1 && (
                              <div
                                className="absolute top-0 h-[2.5px] bg-[#3B5998]"
                                style={{
                                  left: idx === 0 ? '50%' : '0%',
                                  right: idx === arr.length - 1 ? '50%' : '0%'
                                }}
                              />
                            )}
                            <div className="flex flex-col items-center">
                              <div className="w-[2.5px] h-6 bg-[#3B5998]" />
                              <div className="w-0 h-0 border-l-[4.5px] border-l-transparent border-r-[4.5px] border-r-transparent border-t-[6px] border-t-[#3B5998] -mt-[0.5px]" />
                            </div>
                            {node}
                          </div>
                        ))}
                      </div>
                    ) : parentsNode
                  ) : uncleAuntNodes.length > 0 ? (
                    <div className="flex items-start justify-center relative">
                      {[headCoupleNode, ...sisterNodes, ...brotherNodes, ...uncleAuntNodes].filter(Boolean).map((node, idx, arr) => (
                        <div key={idx} className="relative flex flex-col items-center px-4 sm:px-8">
                          {arr.length > 1 && (
                            <div
                              className="absolute top-0 h-[2.5px] bg-[#3B5998]"
                              style={{
                                left: idx === 0 ? '50%' : '0%',
                                right: idx === arr.length - 1 ? '50%' : '0%'
                              }}
                            />
                          )}
                          <div className="flex flex-col items-center">
                            <div className="w-[2.5px] h-6 bg-[#3B5998]" />
                            <div className="w-0 h-0 border-l-[4.5px] border-l-transparent border-r-[4.5px] border-r-transparent border-t-[6px] border-t-[#3B5998] -mt-[0.5px]" />
                          </div>
                          {node}
                        </div>
                      ))}
                    </div>
                  ) : (
                    (brothers.length > 0 || sisters.length > 0)
                      ? (
                        <div className="flex items-start justify-center relative">
                          {siblingsAndHeadNodes.filter(Boolean).map((node, idx, arr) => (
                            <div key={idx} className="relative flex flex-col items-center px-4 sm:px-8">
                              {arr.length > 1 && (
                                <div
                                  className="absolute top-0 h-[2.5px] bg-[#3B5998]"
                                  style={{
                                    left: idx === 0 ? '50%' : '0%',
                                    right: idx === arr.length - 1 ? '50%' : '0%'
                                  }}
                                />
                              )}
                              <div className="flex flex-col items-center">
                                <div className="w-[2.5px] h-6 bg-[#3B5998]" />
                                <div className="w-0 h-0 border-l-[4.5px] border-l-transparent border-r-[4.5px] border-r-transparent border-t-[6px] border-t-[#3B5998] -mt-[0.5px]" />
                              </div>
                              {node}
                            </div>
                          ))}
                        </div>
                      )
                      : headCoupleNode
                  )

                  const handleTreeMouseDown = (e) => {
                    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.group\\/photo')) return
                    if (e.button !== 0) return
                    e.preventDefault()
                    setIsTreeDragging(true)
                    treeDragStartRef.current = {
                      x: e.clientX,
                      y: e.clientY,
                      startPanX: treePan.x,
                      startPanY: treePan.y
                    }
                  }

                  const handleTreeMouseMove = (e) => {
                    if (!isTreeDragging) return
                    e.preventDefault()
                    const deltaX = e.clientX - treeDragStartRef.current.x
                    const deltaY = e.clientY - treeDragStartRef.current.y
                    setTreePan({
                      x: treeDragStartRef.current.startPanX + deltaX,
                      y: treeDragStartRef.current.startPanY + deltaY
                    })
                  }

                  const handleTreeMouseUp = () => {
                    if (isTreeDragging) {
                      setIsTreeDragging(false)
                    }
                  }

                  const handleTreeTouchStart = (e) => {
                    if (e.touches.length === 1) {
                      const t = e.touches[0]
                      setIsTreeDragging(true)
                      treeDragStartRef.current = {
                        x: t.clientX,
                        y: t.clientY,
                        startPanX: treePan.x,
                        startPanY: treePan.y
                      }
                    }
                  }

                  const handleTreeTouchMove = (e) => {
                    if (!isTreeDragging || e.touches.length !== 1) return
                    const t = e.touches[0]
                    const deltaX = t.clientX - treeDragStartRef.current.x
                    const deltaY = t.clientY - treeDragStartRef.current.y
                    setTreePan({
                      x: treeDragStartRef.current.startPanX + deltaX,
                      y: treeDragStartRef.current.startPanY + deltaY
                    })
                  }

                  return (
                    <div 
                      className={`bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-8 overflow-hidden min-h-[500px] max-h-[75vh] flex flex-col items-center justify-start relative select-none ${
                        isTreeDragging ? 'cursor-grabbing' : 'cursor-grab'
                      }`}
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                      }}
                      onMouseDown={handleTreeMouseDown}
                      onMouseMove={handleTreeMouseMove}
                      onMouseUp={handleTreeMouseUp}
                      onMouseLeave={handleTreeMouseUp}
                      onTouchStart={handleTreeTouchStart}
                      onTouchMove={handleTreeTouchMove}
                      onTouchEnd={handleTreeMouseUp}
                    >
                      {/* Main Dynamic Tree with Zoom & Pan Transform */}
                      <div 
                        className="min-w-max py-4 flex flex-col items-center origin-top pointer-events-auto"
                        style={{ 
                          transform: `translate(${treePan.x}px, ${treePan.y}px) scale(${treeZoom})`,
                          transition: isTreeDragging ? 'none' : 'transform 150ms cubic-bezier(0.2, 0, 0, 1)'
                        }}
                      >
                        {fullTree}
                      </div>

                      {/* Extra / Unlinked Members (if any) */}
                      {extraMembers.length > 0 && (
                        <div 
                          className="mt-8 pt-6 border-t border-border/70 w-full flex flex-col items-center origin-top pointer-events-auto"
                          style={{ 
                            transform: `translate(${treePan.x}px, ${treePan.y}px) scale(${treeZoom})`,
                            transition: isTreeDragging ? 'none' : 'transform 150ms cubic-bezier(0.2, 0, 0, 1)'
                          }}
                        >
                          <span className="text-[11px] font-bold text-text-secondary bg-surface-secondary px-3.5 py-1 rounded-full border border-border mb-4">
                            Other Relatives ({extraMembers.length})
                          </span>
                          <div className="flex flex-wrap items-center justify-center gap-4">
                            {extraMembers.map(m => (
                              <EdrawCard key={m.id || m._id} member={m} roleLabel={m.relation} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* TAB 2: COMPLETE FAMILY MEMBERS LIST (FULL TABLE) */}
            {viewTab === 'details' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                      <UsersIcon className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-sm font-bold text-text uppercase tracking-wide">
                      Complete Family List ({(() => {
                        const list = [
                          ...(familyMembers.some(m => m.relation === 'Self' || m.familyHead) ? [] : (viewingUser ? [viewingUser] : [])),
                          ...familyMembers
                        ]
                        const uniqueList = []
                        const seen = new Set()
                        list.forEach(m => {
                          const id = String(m.id || m._id)
                          if (id && !seen.has(id)) {
                            seen.add(id)
                            uniqueList.push(m)
                          }
                        })
                        return uniqueList.length
                      })()})
                    </h4>
                  </div>
                </div>

                {membersLoading ? (
                  <div className="py-12 text-center text-text-secondary animate-pulse text-sm">
                    Loading family members...
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-card border border-border rounded-2xl shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-secondary/70 text-text-secondary text-[11px] uppercase tracking-wider font-bold border-b border-border">
                          <th className="p-3.5 text-center w-12">#</th>
                          <th className="p-3.5">Member Name</th>
                          <th className="p-3.5">Relationship</th>
                          <th className="p-3.5">Gender</th>
                          <th className="p-3.5">Mobile Number</th>
                          <th className="p-3.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(() => {
                          const list = [
                            ...(familyMembers.some(m => m.relation === 'Self' || m.familyHead) ? [] : (viewingUser ? [viewingUser] : [])),
                            ...familyMembers
                          ]
                          const uniqueList = []
                          const seen = new Set()
                          list.forEach(m => {
                            const id = String(m.id || m._id)
                            if (id && !seen.has(id)) {
                              seen.add(id)
                              uniqueList.push(m)
                            }
                          })

                          // Sort so Head is on top
                          uniqueList.sort((a, b) => {
                            const aIsHead = a.relation === 'Self' || a.familyHead
                            const bIsHead = b.relation === 'Self' || b.familyHead
                            if (aIsHead && !bIsHead) return -1
                            if (!aIsHead && bIsHead) return 1
                            return 0
                          })

                          return uniqueList.map((member, idx) => {
                            const isCurrentViewing = viewingUser && (
                              String(member.id || member._id) === String(viewingUser.id || viewingUser._id) ||
                              (viewingUser.member_id && member.member_id && String(viewingUser.member_id) === String(member.member_id)) ||
                              (viewingUser.name && viewingUser.name.toLowerCase() === (member.name || '').toLowerCase())
                            )

                            const isHeadMember = member.relation === 'Self' || member.familyHead

                            return (
                              <tr 
                                key={member.id || member._id || idx} 
                                className={`transition-all text-sm ${
                                  isCurrentViewing 
                                    ? 'bg-primary/10 border-l-4 border-l-primary font-semibold' 
                                    : 'hover:bg-surface-secondary/40'
                                }`}
                              >
                                <td className="p-3.5 text-xs text-text-secondary font-mono text-center">{idx + 1}</td>
                                <td className="p-3.5 font-medium text-text">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      onClick={(e) => {
                                        const imgSrc = member.image || member.profile_image ? assetUrl(member.image || member.profile_image) : ''
                                        if (imgSrc) {
                                          e.stopPropagation();
                                          setImagePreview({ url: imgSrc, title: `${member.name || 'Member'} (${member.relation || 'Member'})` });
                                        }
                                      }}
                                      style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }}
                                      className={`w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden shadow-xs ${member.image || member.profile_image ? 'cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all' : ''}`}
                                      title={member.image || member.profile_image ? "Click to view photo (Zoom/Pan)" : ""}
                                    >
                                      {member.image || member.profile_image ? (
                                        <img src={assetUrl(member.image || member.profile_image)} alt={member.name} className="w-full h-full object-cover block" />
                                      ) : (
                                        (member.name || 'M').charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="capitalize font-semibold text-text">
                                        {member.name || [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ')}
                                      </span>
                                      {isCurrentViewing && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                                          Viewing
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3.5 text-text-secondary capitalize">
                                  {isHeadMember ? (
                                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold">
                                      Head (Self)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-surface-secondary text-text border border-border/60 text-xs font-medium">
                                      {member.relation === 'Spouse' ? 'Wife' : member.relation}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5 text-text-secondary">{member.gender || '-'}</td>
                                <td className="p-3.5 text-text-secondary font-mono text-xs">{member.number || member.phone || '-'}</td>
                                <td className="p-3.5 text-center">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${Number(member.status ?? 1) === 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-surface-secondary text-text-secondary'}`}>
                                    {Number(member.status ?? 1) === 1 ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                              </tr>
                            )
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Interactive Isolated Image Preview Popup with Zoom & Pan */}
      <ImagePreviewModal
        isOpen={Boolean(previewImage)}
        imageUrl={previewImage?.url}
        title={previewImage?.title || 'Member Photo'}
        onClose={() => setImagePreview(null)}
      />
    </div>
  )
}




