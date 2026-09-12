import React, { useEffect, useState, useCallback } from 'react'
import { LayoutDashboard, Users, Calendar, Settings, ChevronDown, Layers } from 'lucide-react'
import api from '../../lib/api'
import { MANDAL_ENDPOINTS } from '../../utils/endpoints'
import MandalDashboard from './MandalDashboard'
import MandalMembers from './MandalMembers'
import MonthlyContribution from './MonthlyContribution'
import MandalSetup from './MandalSetup'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'contribution', label: 'Contributions', icon: Calendar },
  { id: 'setup', label: 'Setup', icon: Settings },
]

export default function Mandal({ headerLeftContent }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [mandals, setMandals] = useState([])
  const [selectedMandalId, setSelectedMandalId] = useState('')
  const [loadingMandals, setLoadingMandals] = useState(false)

  const fetchMandals = useCallback(async () => {
    setLoadingMandals(true)
    try {
      const res = await api.get(MANDAL_ENDPOINTS.GET_LIST)
      const list = res.data?.data || []
      setMandals(list)
      if (list.length > 0) {
        setSelectedMandalId(prev => {
          if (prev && list.some(m => String(m.id || m._id) === String(prev))) {
            return prev
          }
          return String(list[0].id || list[0]._id)
        })
      }
    } catch {
      setMandals([])
    } finally {
      setLoadingMandals(false)
    }
  }, [])

  useEffect(() => {
    fetchMandals()
  }, [fetchMandals])

  const selectedMandal = mandals.find(m => String(m.id || m._id) === String(selectedMandalId)) || mandals[0] || null

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <MandalDashboard mandalId={selectedMandalId} onNavigateTab={setActiveTab} />
      case 'members':
        return <MandalMembers mandalId={selectedMandalId} mandal={selectedMandal} />
      case 'contribution':
        return <MonthlyContribution mandalId={selectedMandalId} mandal={selectedMandal} />
      case 'setup':
        return (
          <MandalSetup
            selectedMandalId={selectedMandalId}
            onSelectMandal={setSelectedMandalId}
            onMandalsChanged={fetchMandals}
          />
        )
      default:
        return <MandalDashboard mandalId={selectedMandalId} onNavigateTab={setActiveTab} />
    }
  }

  return (
    <div className="space-y-4 text-text animate-slide-up">
      {headerLeftContent && <div>{headerLeftContent}</div>}

      {/* Header bar with Mandal Selector & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text hover:bg-surface-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Mandal Selector (when multiple exist) */}
        {mandals.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold shadow-xs">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span className="text-text-secondary">Active:</span>
              <select
                value={selectedMandalId}
                onChange={(e) => setSelectedMandalId(e.target.value)}
                className="bg-transparent text-text font-bold outline-none cursor-pointer pr-1"
              >
                {mandals.map(m => (
                  <option key={String(m.id || m._id)} value={String(m.id || m._id)} className="bg-surface text-text">
                    {m.name || 'Mandal'} (₹{m.monthly_amount || 500})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div>{renderContent()}</div>
    </div>
  )
}
