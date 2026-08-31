import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Edit2, Plus, RefreshCw, Search, Trash2, Users, Filter, X, Download } from 'lucide-react'
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import api, { getCommitteeMembersList, getCommunitySurname } from '../lib/api'
import { confirm } from '../lib/confirm'
import { normalizeRoles, unwrapApiData } from '../lib/roles'
import { hasPermission } from '../lib/permissions'
import { AuthContext } from '../context/AuthContext'
import Modal from '../components/Modal'
import CommitteeMemberForm from '../components/CommitteeMemberForm'
import Loader from '../components/common/Loader'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import SearchInput from '../components/common/SearchInput'
import Select from '../components/common/Select'
import FilterPopover from '../components/common/FilterPopover'
import { toast } from '../lib/toast'
import useDebounce from '../hooks/useDebounce'
import usePermissions from '../hooks/usePermissions'


const getRoleBadgeColor = (roleName) => {
  if (!roleName) return 'bg-surface-secondary border-border text-text';
  const name = roleName.toLowerCase().trim();
  
  if (name.includes('president') && !name.includes('vice')) {
    return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20';
  }
  if (name.includes('vice president')) {
    return 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20';
  }
  if (name.includes('manager')) {
    return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20';
  }
  if (name.includes('admin')) {
    return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  }
  if (name.includes('userrole') || name.includes('user')) {
    return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20',
    'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/20',
    'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

export default function CommitteeMembers() {
  const { user: currentUser } = useContext(AuthContext)
  const permissions = usePermissions('committee')
  const [members, setMembers] = useState([])
  const [limit, setLimit] = useState(15)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [filters, setFilters] = useState({ status: '', role: '' })
  const [draftFilters, setDraftFilters] = useState({ status: '', role: '' })
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
      const res = await getCommitteeMembersList({ page, limit, search: debouncedSearch, ...filters })
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
  }, [page, debouncedSearch, limit, filters])

  useEffect(() => {
    fetchCommitteeMembers()
  }, [fetchCommitteeMembers])

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles', { params: { limit: 150 } })
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
      if (!err.response?.data?.message) toast.error('Failed to update committee member')
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
      if (!err.response?.data?.message) toast.error('Failed to delete committee member')
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
      if (!err.response?.data?.message) toast.error('Failed to update status for selected members');
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
      if (!err.response?.data?.message) toast.error('Failed to delete selected members');
      await fetchCommitteeMembers();
    }
  };

  const handleExportExcel = async () => {
    try {
      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Committee Members');

      // Define columns
      worksheet.columns = [
        { header: 'NAME', key: 'name', width: 40 },
        { header: 'MOBILE NUMBER', key: 'contact', width: 25 },
        { header: 'EMAIL', key: 'email', width: 35 },
        { header: 'ASSIGNED ROLE', key: 'role', width: 25 },
        { header: 'STATUS', key: 'status', width: 20 }
      ];

      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF818CF8' } // Lighter Indigo
        };
        cell.font = {
          color: { argb: 'FFFFFFFF' }, // White text
          bold: true,
          size: 11
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
      });

      worksheet.autoFilter = 'A1:E1'; // Add filter to all columns

      const getExcelRoleStyle = (roleName) => {
        if (!roleName || roleName === '-') return { bg: 'FFF1F5F9', text: 'FF475569' };
        const name = roleName.toLowerCase().trim();
        
        if (name.includes('president') && !name.includes('vice')) return { bg: 'FFFFE4E6', text: 'FFE11D48' }; // rose
        if (name.includes('vice president')) return { bg: 'FFF5F3FF', text: 'FF7C3AED' }; // violet
        if (name.includes('manager')) return { bg: 'FFDBEAFE', text: 'FF2563EB' }; // blue
        if (name.includes('admin')) return { bg: 'FFD1FAE5', text: 'FF059669' }; // emerald
        if (name.includes('userrole') || name.includes('user')) return { bg: 'FFF1F5F9', text: 'FF475569' }; // slate
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        const styles = [
          { bg: 'FFFEF3C7', text: 'FFD97706' }, // amber
          { bg: 'FFCFFAFE', text: 'FF0891B2' }, // cyan
          { bg: 'FFCCFBF1', text: 'FF0D9488' }, // teal
          { bg: 'FFFCE7F3', text: 'FFDB2777' }, // pink
          { bg: 'FFE0E7FF', text: 'FF4F46E5' }, // indigo
          { bg: 'FFFFEDD5', text: 'FFEA580C' }  // orange
        ];
        return styles[Math.abs(hash) % styles.length];
      };

      // Add data rows
      members.forEach((member) => {
        const roleName = member.role_name || (roles.find(r => String(r.id || r._id) === String(member.role_id))?.name) || '-';
        const statusText = Number(member.status ?? 1) === 1 ? 'Active' : 'Inactive';
        const row = worksheet.addRow({
          name: `${member.first_name || ''} ${member.middle_name || ''} ${member.last_name || ''}`.trim(),
          contact: member.number || '-',
          email: member.email || '-',
          role: roleName,
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

        // Role color
        const roleCell = row.getCell('role');
        const roleStyle = getExcelRoleStyle(roleName);
        roleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: roleStyle.bg } };
        roleCell.font = { color: { argb: roleStyle.text }, bold: true };
        roleCell.alignment = { vertical: 'middle', horizontal: 'center' };

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

      // Generate the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Committee_Members_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel exported successfully');
    } catch (err) {
      toast.error('Failed to export Excel');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight">Committee Members</h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchInput
            placeholder="Search committee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
          <FilterPopover
            isOpen={showFilters}
            onToggle={() => {
              setDraftFilters(filters)
              setShowFilters(!showFilters)
            }}
            onClose={() => setShowFilters(false)}
            activeCount={(filters.status ? 1 : 0) + (filters.role ? 1 : 0)}
            onClear={() => {
              setDraftFilters({ status: '', role: '' })
              setFilters({ status: '', role: '' })
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
              label="Status"
              value={draftFilters.status}
              onChange={(val) => setDraftFilters(current => ({ ...current, status: val }))}
              placeholder="All Status"
              searchable={false}
              options={[
                { label: 'All Status', value: '' },
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' }
              ]}
            />
            <Select
              label="Committee Role"
              value={draftFilters.role}
              onChange={(val) => setDraftFilters(current => ({ ...current, role: val }))}
              placeholder="All Roles"
              searchable={false}
              options={[
                { label: 'All Roles', value: '' },
                ...roles.map(r => ({ label: r.name, value: r.name }))
              ]}
            />
          </FilterPopover>
          <Button onClick={handleExportExcel} variant="secondary" icon={<Download className="w-4 h-4" />} className="h-10 border-primary text-primary hover:bg-primary hover:text-white">
            Export
          </Button>
          {!permissions.canAdd && !permissions.isSuperAdmin ? null : (
            <Button onClick={openCreate} variant="primary" icon={<Plus className="w-4 h-4" />} className="h-10">
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
                  <div className="font-semibold text-text">{member.first_name} {member.middle_name} {member.last_name || ''}</div>
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
            header: 'Email',
            key: 'email',
            render: (member) => <span>{member.email || '-'}</span>
          },
          {
            header: 'Assigned Role',
            key: 'role',
            render: (member) => {
              const roleName = member.role_name || (roles.find(r => String(r.id || r._id) === String(member.role_id))?.name) || '-';
              return (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold text-xs ${getRoleBadgeColor(roleName)}`}>
                  {roleName}
                </span>
              );
            }
          },
          {
            header: 'Status',
            key: 'status',
            render: (member) => (
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Number(member.status ?? 1) === 1}
                    onChange={async () => {
                      const newStatus = Number(member.status ?? 1) === 1 ? 0 : 1;
                      try {
                        await api.put(`/committee-members/${member.id}`, { status: newStatus });
                        toast.success('Status updated successfully');
                        fetchCommitteeMembers();
                      } catch (err) {
                        console.error('Status update failed:', err);
                      }
                    }}
                  />
                  <div className="w-9 h-5 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            )
          },
          {
            header: 'Actions',
            key: 'actions',
            align: 'left',
            render: member=> ( <div className="flex items-center justify-start gap-2">
                {!permissions.canEdit && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => openEdit(member)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!permissions.canDelete && !permissions.isSuperAdmin ? null : (
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
        onBulkStatus={!permissions.canEdit && !permissions.isSuperAdmin ? undefined : handleBulkStatus}
        onBulkDelete={!permissions.canDelete && !permissions.isSuperAdmin ? undefined : handleBulkDelete}
        emptyState={{
          icon: Users,
          title: 'No committee members found',
          description: 'Try adjusting your search criteria or add a new member',
          actionLabel: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : 'Add Member',
          onAction: !permissions.canAdd && !permissions.isSuperAdmin ? undefined : openCreate
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


