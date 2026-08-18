import React, { useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Search, Sparkles } from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import { masterLabels, routeTitles } from '../config/navigation'
import GoogleTranslate from './GoogleTranslate'
import GlobalSearch from './GlobalSearch'
import { getUserRoleLabel } from '../lib/roles'
import ThemePicker from './ThemePicker'
import NotificationDropdown from './NotificationDropdown'
import { confirm } from '../lib/confirm'

export default function Header() {
  const { logout, user } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const roleLabel = user ? getUserRoleLabel(user) : ''

  const handleLogout = async () => {
    const isConfirmed = await confirm('Are you sure you want to logout?', {
      confirmText: 'Yes',
      cancelText: 'Cancel'
    })
    
    if (isConfirmed) {
      logout()
      navigate('/login')
    }
  }

  const getPageTitle = () => {
    if (routeTitles[location.pathname]) return routeTitles[location.pathname]
    if (location.pathname.startsWith('/masters/')) {
      const type = location.pathname.split('/').pop()
      return `${masterLabels[type] || 'Master'} Master`
    }
    return 'Admin Panel'
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-5 bg-surface border-b border-border shadow-glass-md backdrop-blur-xl">
      {/* Title block */}
      <div className="flex items-center gap-3">
        {/* Dynamic Global Search box */}
        <GlobalSearch />
      </div>

      {/* Control bar */}
      <div className="flex items-center gap-4">
        <ThemePicker />
        <NotificationDropdown variant="dark" />

        {/* Vertical divider */}
        <span className="w-px h-6 bg-border"></span>

        {/* Profile Card & Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col text-right">
            <div className="text-sm font-semibold text-text">{user?.name || 'Administrator'}</div>
            <div className="text-sm text-primary font-semibold tracking-wide flex items-center gap-1 justify-end">
              <Sparkles className="w-3 h-3 text-primary/80" />
              {roleLabel}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-error-text bg-error-bg hover:bg-error/20 border border-error-border hover:border-error/40 hover:shadow-glow-danger transition-all duration-300"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
