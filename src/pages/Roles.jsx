import React, { useEffect, useMemo, useState } from 'react'
import { Edit2, Plus, RefreshCw, Search, ShieldCheck, Trash2 } from 'lucide-react'
import api from '../lib/api'
import { confirm } from '../lib/confirm'
import { buildPermissionGroups, normalizeRoles, unwrapApiData } from '../lib/roles'
import Modal from '../components/Modal'
import Loader from '../components/common/Loader'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import Checkbox from '../components/common/Checkbox'

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10'
const emptyRoleForm = { name: '', description: '', status: 1, permissions: [] }
const limit = 10

export default function Roles() {
  const [roles, setRoles] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [permissionConfig, setPermissionConfig] = useState({ actions: [], modules: [] })
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState(emptyRoleForm)

  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1)
  const currentPage = Math.min(Math.max(Number(pagination.page) || page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const handleSearch = (value) => {
    setSearch(value)
    setPage(1)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        api.get('/roles', { params: { page, limit, search } }),
        api.get('/permissions')
      ])
      const data = rolesRes.data?.data || rolesRes.data || []
      const pg = rolesRes.data?.pagination || {}
      setRoles(normalizeRoles(Array.isArray(data) ? data : []))
      setPagination({
        page: Number(pg.page || page),
        totalPages: Number(pg.totalPages || pg.total_pages || pg.last_page || 1),
        total: Number(pg.total || 0),
        limit: Number(pg.limit || limit)
      })
      setPermissionConfig(buildPermissionGroups(unwrapApiData(permissionsRes, { actions: [], modules: [], permissions: [] })))
      setError('')
    } catch (err) {
      setRoles([])
      setPagination({ page, totalPages: 1, total: 0, limit })
      setError(err.response?.data?.message || 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [page, search])

  const openCreate = () => {
    setSelected(null)
    setFormData(emptyRoleForm)
    setIsModalOpen(true)
  }

  const openEdit = (role) => {
    setSelected(role)
    setFormData({
      name: role.name || '',
      description: role.description || '',
      status: Number(role.status ?? 1),
      permissions: Array.isArray(role.permissions) ? role.permissions : []
    })
    setIsModalOpen(true)
  }

  const togglePermission = (key) => {
    setFormData((current) => ({
      ...current,
      permissions: current.permissions.includes(key)
        ? current.permissions.filter((item) => item !== key)
        : [...current.permissions, key]
    }))
  }

  const toggleModule = (module) => {
    const keys = module.permissions.map((permission) => permission.key)
    const hasAll = keys.every((key) => formData.permissions.includes(key))
    setFormData((current) => ({
      ...current,
      permissions: hasAll
        ? current.permissions.filter((key) => !keys.includes(key))
        : [...new Set([...current.permissions, ...keys])]
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!formData.name.trim()) {
      setError('Role name is required')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (selected) {
        await api.put(`/roles/${selected.id}`, formData)
      } else {
        await api.post('/roles', formData)
      }
      await fetchAll()
      setSuccess('Role saved successfully')
      setIsModalOpen(false)
      setSelected(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (role) => {
    if (!await confirm(`Delete ${role.name}?`)) return
    try {
      await api.delete(`/roles/${role.id}`)
      setRoles(roles.filter((item) => item.id !== role.id))
      setSuccess('Role deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete role')
    }
  }

  const setSearchValue = (value) => {
    setSearch(value)
    setPage(1)
  }

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => JSON.stringify(role).toLowerCase().includes(search.toLowerCase()))
  }, [roles, search])
  const permissionGridStyle = {
    gridTemplateColumns: `minmax(150px, 1fr) repeat(${permissionConfig.actions.length}, minmax(64px, 72px))`
  }

  return (
    <div className="space-y-6 animate-slide-up text-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Roles</h2>

        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button onClick={fetchAll} variant="secondary" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-text-secondary/60" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search roles..." className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50" />
          </div>
          <Button onClick={openCreate} variant="primary" icon={<Plus className="w-4 h-4" />}>
            Add Role
          </Button>
        </div>
      </div>

      {error && <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-2xl text-sm">{error}</div>}
      {success && <div className="bg-success-bg border border-success-border text-success-text p-4 rounded-2xl text-sm">{success}</div>}

      <Table
        columns={[
          {
            header: 'Role Name',
            key: 'name',
            render: (role) => (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-text">{role.name}</div>
                  {role.description && <div className="mt-0.5 text-sm text-text-secondary">{role.description}</div>}
                </div>
              </div>
            )
          },
          {
            header: 'Permissions',
            key: 'permissions',
            render: (role) => <span>{role.permission_count || 0} selected</span>
          },
          {
            header: 'Status',
            key: 'status',
            render: (role) => <span>{Number(role.status ?? 1) === 1 ? 'Active' : 'Inactive'}</span>
          },
          {
            header: 'Actions',
            key: 'actions',
            align: 'right',
            render: (role) => (
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => openEdit(role)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(role)} className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl transition-all" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }
        ]}
        data={filteredRoles}
        keyField="id"
        loading={loading}
        emptyState={{
          icon: ShieldCheck,
          title: 'No roles found',
          description: 'Try expanding your search criteria or add a new role'
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

      <Modal isOpen={isModalOpen} title={selected ? 'Edit Role' : 'Add Role'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-5 text-text">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Role Name"
              required
              placeholder="Enter Role Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={saving}
            />
            <Input
              label="Description"
              placeholder="Short role description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={saving}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(val) => setFormData({ ...formData, status: val })}
              disabled={saving}
              options={[
                { label: 'Active', value: 1 },
                { label: 'Inactive', value: 0 }
              ]}
            />
          </div>

          <div>
            <div className="grid gap-2 border-b border-border pb-2 text-sm  font-semibold text-text-secondary" style={permissionGridStyle}>
              <div>Permission</div>
              {permissionConfig.actions.map((action) => <div key={action.key} className="text-center">{action.label}</div>)}
            </div>
            <div className="divide-y divide-border">
              {permissionConfig.modules.map((module) => {
                const allChecked = module.permissions.every((p) => formData.permissions.includes(p.key))
                const someChecked = module.permissions.some((p) => formData.permissions.includes(p.key))
                return (
                  <div key={module.key} className="grid gap-2 py-3 items-center" style={permissionGridStyle}>
                    <Checkbox
                      checked={allChecked}
                      indeterminate={!allChecked && someChecked}
                      onChange={() => toggleModule(module)}
                      label={<span className="font-semibold text-text">{module.label}</span>}
                    />
                    {permissionConfig.actions.map((action) => {
                      const permission = module.permissions.find((item) => item.action === action.key)
                      return permission ? (
                        <div key={permission.key} className="flex justify-center">
                          <Checkbox
                            checked={formData.permissions.includes(permission.key)}
                            onChange={() => togglePermission(permission.key)}
                          />
                        </div>
                      ) : (
                        <div key={`${module.key}-${action.key}`} />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
