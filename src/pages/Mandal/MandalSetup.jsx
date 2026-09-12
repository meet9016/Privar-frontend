import React, { useEffect, useState, useCallback } from 'react'
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Users,
  Calendar,
  IndianRupee,
  Layers,
  Save,
  X,
  User2,
  Check
} from 'lucide-react'
import api from '../../lib/api'
import { MANDAL_ENDPOINTS, MEMBER_ENDPOINTS } from '../../utils/endpoints'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import DatePicker from '../../components/DatePicker'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'

export default function MandalSetup({ selectedMandalId, onSelectMandal, onMandalsChanged }) {
  const [mandals, setMandals] = useState([])
  const [loading, setLoading] = useState(true)
  const [membersList, setMembersList] = useState([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
  const [activeMandalId, setActiveMandalId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    monthly_amount: 500,
    start_date: new Date().toISOString().slice(0, 10),
    mandal_head_id: '',
    status: 1,
    description: '',
    rules: ''
  })
  const [errors, setErrors] = useState({})

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [mandalsRes, usersRes] = await Promise.all([
        api.get(MANDAL_ENDPOINTS.GET_LIST),
        api.get(MEMBER_ENDPOINTS.GET_MEMBERS, { params: { limit: 1500 } })
      ])
      const mList = mandalsRes.data?.data || []
      setMandals(mList)
      const uList = usersRes.data?.data || usersRes.data || []
      setMembersList(Array.isArray(uList) ? uList : [])
    } catch {
      toast.error('Failed to load Mandals data')
      setMandals([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const handleOpenCreate = () => {
    setModalMode('create')
    setActiveMandalId(null)
    setFormData({
      name: '',
      monthly_amount: 500,
      start_date: new Date().toISOString().slice(0, 10),
      mandal_head_id: '',
      status: 1,
      description: '',
      rules: ''
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const handleOpenEdit = (m) => {
    setModalMode('edit')
    setActiveMandalId(m.id || m._id)
    setFormData({
      name: m.name || '',
      monthly_amount: m.monthly_amount !== undefined ? m.monthly_amount : 500,
      start_date: m.start_date ? new Date(m.start_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      mandal_head_id: m.mandal_head_id?._id || m.mandal_head_id || '',
      status: m.status !== undefined ? Number(m.status) : 1,
      description: m.description || '',
      rules: m.rules || ''
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const handleDelete = async (mandalId) => {
    if (mandals.length <= 1) {
      toast.error('Cannot delete the only existing Mandal. Create another Mandal first.')
      return
    }
    const isConfirmed = await confirm('Are you sure you want to delete this Mandal and its records?', {
      confirmText: 'Delete Mandal',
      type: 'danger'
    })
    if (!isConfirmed) return

    try {
      await api.delete(MANDAL_ENDPOINTS.DELETE_MANDAL(mandalId))
      toast.success('Mandal deleted successfully')
      fetchAllData()
      if (onMandalsChanged) onMandalsChanged()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete Mandal')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Mandal Name is required'
    if (!formData.monthly_amount || Number(formData.monthly_amount) < 0) {
      newErrors.monthly_amount = 'Valid monthly amount is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    try {
      if (modalMode === 'create') {
        const res = await api.post(MANDAL_ENDPOINTS.CREATE_MANDAL, formData)
        toast.success('Mandal created successfully')
        if (res.data?.data?._id && onSelectMandal) {
          onSelectMandal(String(res.data.data._id))
        }
      } else {
        await api.put(MANDAL_ENDPOINTS.UPDATE_SETUP, { ...formData, mandal_id: activeMandalId })
        toast.success('Mandal settings updated')
      }
      setIsModalOpen(false)
      fetchAllData()
      if (onMandalsChanged) onMandalsChanged()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save Mandal')
    } finally {
      setSaving(false)
    }
  }

  const memberOptions = [
    { label: 'None / Select Mandal Head', value: '' },
    ...membersList.map(u => ({
      label: `${u.first_name || ''} ${u.middle_name || ''} ${u.last_name || ''} (${u.number || u.member_id || 'Member'})`.trim(),
      value: u.id || u._id
    }))
  ]

  if (loading) {
    return <div className="py-12"><Loader size="lg" text="Loading Mandals..." /></div>
  }

  return (
    <div className="space-y-5 animate-slide-up text-text">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-text">Mandal Setup & Management</h3>
            <p className="text-xs text-text-secondary">
              Create and manage multiple community Mandals with custom fixed monthly dues.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          icon={<Plus className="w-4 h-4" />}
        >
          Create New Mandal
        </Button>
      </div>

      {/* Mandals Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mandals.map((m) => {
          const id = String(m.id || m._id)
          const isSelected = String(selectedMandalId) === id
          const headName = m.mandal_head_name || (m.mandal_head_id ? `${m.mandal_head_id.first_name || ''} ${m.mandal_head_id.last_name || ''}`.trim() : 'Not assigned')

          return (
            <div
              key={id}
              className={`p-5 rounded-2xl bg-card border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-base text-text leading-snug">{m.name}</h4>
                    <span className="inline-block mt-1 text-xs font-bold text-primary">
                      ₹{m.monthly_amount || 500} / month
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    m.status === 1
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                  }`}>
                    {m.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-text-secondary pt-3 border-t border-border/60">
                  <div className="flex items-center gap-2">
                    <User2 className="w-3.5 h-3.5 shrink-0 text-text-secondary" />
                    <span>Head: <strong className="text-text font-semibold">{headName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 shrink-0 text-text-secondary" />
                    <span>Enrolled Members: <strong className="text-primary font-bold">{m.members_count || (m.members || []).length}</strong></span>
                  </div>
                  {m.description && (
                    <p className="text-[11px] text-text-secondary line-clamp-2 mt-2 pt-2 border-t border-border/40">
                      {m.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                {isSelected ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                    <Check className="w-3.5 h-3.5" />
                    Active View
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectMandal) onSelectMandal(id)
                      toast.success(`Switched active view to ${m.name}`)
                    }}
                    className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    Select & View
                  </button>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(m)}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-text bg-surface-secondary hover:bg-border/60 border border-border transition-all cursor-pointer"
                    title="Edit Mandal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {mandals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(id)}
                      className="p-1.5 rounded-lg text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                      title="Delete Mandal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create / Edit Mandal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-card border border-border rounded-3xl w-full max-w-xl shadow-glass-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-text">
                  {modalMode === 'create' ? 'Create New Mandal' : 'Edit Mandal Settings'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text bg-surface-secondary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <Input
                type="text"
                label="Mandal Name"
                name="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (errors.name) setErrors({ ...errors, name: null })
                }}
                required
                placeholder="e.g. Shree Parivar Yuvak Mandal, Mahila Mandal..."
                error={errors.name}
                disabled={saving}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Monthly Fixed Amount (₹)"
                  name="monthly_amount"
                  value={formData.monthly_amount}
                  onChange={(e) => {
                    setFormData({ ...formData, monthly_amount: e.target.value })
                    if (errors.monthly_amount) setErrors({ ...errors, monthly_amount: null })
                  }}
                  required
                  min="0"
                  placeholder="500"
                  error={errors.monthly_amount}
                  disabled={saving}
                />

                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block font-semibold">Start Date <span className="text-red-500">*</span></label>
                  <DatePicker
                    mode="date"
                    value={formData.start_date}
                    onChange={(val) => setFormData({ ...formData, start_date: val })}
                    disabled={saving}
                    className="w-full bg-input-bg text-text border border-border hover:border-primary/40 focus:border-primary rounded-xl py-2 px-3 text-sm outline-none shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Mandal Head (Leader)"
                  value={formData.mandal_head_id}
                  onChange={(val) => setFormData({ ...formData, mandal_head_id: val })}
                  options={memberOptions}
                  disabled={saving}
                />

                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: Number(val) })}
                  options={[
                    { label: 'Active', value: 1 },
                    { label: 'Inactive', value: 0 }
                  ]}
                  disabled={saving}
                />
              </div>

              <Input
                type="textarea"
                label="Description & Purpose (Optional)"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief notes, rules or purpose of this mandal..."
                rows="3"
                disabled={saving}
              />

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                  disabled={saving}
                  icon={<Save className="w-4 h-4" />}
                >
                  {saving ? 'Saving...' : modalMode === 'create' ? 'Create Mandal' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
