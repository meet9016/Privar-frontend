import React, { useEffect, useState, useCallback, useRef } from 'react'
import { LayoutDashboard, Users, Calendar, Settings, ChevronDown, Layers, Check } from 'lucide-react'
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

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

  // Click outside listener for custom dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      {/* Unified Header Bar: Primary category tabs on left + Sub-tabs & Mandal selector on right */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
        {headerLeftContent && (
          <div className="flex items-center">
            {headerLeftContent}
          </div>
        )}

        {/* Right side: Sub Navigation Tabs + Custom Active Mandal Selector */}
        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 bg-surface-secondary/70 p-1 rounded-xl border border-border/60">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text hover:bg-surface'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Custom Modern Mandal Selector Dropdown */}
          {mandals.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                  isDropdownOpen
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-text-secondary whitespace-nowrap">Active:</span>
                <span className="font-bold text-text max-w-[160px] truncate">
                  {selectedMandal?.name || 'Mandal'}
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-extrabold text-[10px]">
                  ₹{selectedMandal?.monthly_amount || 500}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Popup Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-fade-in">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-text-secondary uppercase tracking-wider border-b border-border/60 mb-1">
                    Select Community Mandal
                  </div>
                  {mandals.map(m => {
                    const mId = String(m.id || m._id)
                    const isSelected = String(selectedMandalId) === mId
                    return (
                      <button
                        key={mId}
                        type="button"
                        onClick={() => {
                          setSelectedMandalId(mId)
                          setIsDropdownOpen(false)
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 border border-primary/20 text-primary'
                            : 'hover:bg-surface-secondary text-text'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-primary' : 'text-text'}`}>
                            {m.name || 'Mandal'}
                          </p>
                          <p className="text-[11px] text-text-secondary">
                            ₹{m.monthly_amount || 500} / month • Due: {m.due_day || 10}th
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div>{renderContent()}</div>
    </div>
  )
}
