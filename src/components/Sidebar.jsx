import React, { useContext, useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import { configurationNavigation, coreNavigation, masterNavigation } from '../config/navigation'
import { hasPermission } from '../lib/permissions'
import { getUserRoleLabel } from '../lib/roles'

const LinkItem = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `group flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'border-primary/20 bg-primary/10 text-primary'
          : 'border-transparent text-text-secondary hover:bg-surface-secondary hover:text-text'
      }`
    }
    title={label}
  >
    {({ isActive }) => (
      <>
        <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-text-secondary group-hover:text-text'}`} />
        <span className="truncate">{label}</span>
        {isActive && (
          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse"></span>
        )}
      </>
    )}
  </NavLink>
)

const SectionLabel = ({ children }) => (
  <div className="px-3 pb-2 pt-5 text-sm font-semibold  tracking-widest text-text-secondary/60 first:pt-0">
    {children}
  </div>
)

export default function Sidebar() {
  const { user } = useContext(AuthContext)
  const [webTheme, setWebTheme] = useState({ webLogo: '', name: '' })
  const roleLabel = user ? getUserRoleLabel(user) : ''
  const visibleCoreNavigation = coreNavigation.filter((item) => hasPermission(user, item.permission))

  useEffect(() => {
    const loadWebTheme = () => {
      setWebTheme({
        webLogo: localStorage.getItem('web_webLogo') || '',
        name: localStorage.getItem('web_name') || ''
      })
    }

    loadWebTheme()
    window.addEventListener('storage', loadWebTheme)
    window.addEventListener('web-theme-updated', loadWebTheme)
    return () => {
      window.removeEventListener('storage', loadWebTheme)
      window.removeEventListener('web-theme-updated', loadWebTheme)
    }
  }, [])
  const visibleMasterNavigation = masterNavigation.filter((item) => hasPermission(user, item.permission))
  const visibleConfigurationNavigation = configurationNavigation.filter((item) => hasPermission(user, item.permission))

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-border bg-surface p-5 shadow-glass-md backdrop-blur-xl">
      <div className="mb-6 flex shrink-0 items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-glow-primary overflow-hidden">
          {webTheme.webLogo ? (
            <img src={webTheme.webLogo} alt={`${webTheme.name || 'Brand'} logo`} className="h-full w-full object-contain" />
          ) : (
            <Shield className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-base tracking-wide bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            {webTheme.name ? `${webTheme.name} Admin` : 'Parivar Admin'}
          </h2>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-1">
          {visibleCoreNavigation.map((item) => (
            <LinkItem key={item.to} {...item} />
          ))}
        </div>

        {visibleMasterNavigation.length > 0 && (
          <>
            <SectionLabel>Masters</SectionLabel>
            <div className="ml-4 space-y-1 border-l border-primary/40 pl-3">
              {visibleMasterNavigation.map((item) => (
                <NavLink
                  key={item.type}
                  to={item.to || `/admin/masters/${item.type}`}
                  end
                  className={({ isActive }) =>
                    `block min-h-8 w-full rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text hover:bg-surface-secondary'
                    }`
                  }
                  title={`${item.label} Master`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </>
        )}

        {visibleConfigurationNavigation.length > 0 && (
          <>
            <SectionLabel>Configuration</SectionLabel>
            <div className="space-y-1">
              {visibleConfigurationNavigation.map((item) => (
                <LinkItem key={item.to} {...item} />
              ))}
            </div>
          </>
        )}
      </nav>

      {user && (
        <div className="mt-5 flex shrink-0 items-center gap-3 rounded-xl border border-border bg-surface-secondary p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-sm font-semibold  text-primary shadow-sm">
            {user.name ? user.name.substring(0, 2) : user.email?.substring(0, 2) || 'AD'}
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-text">{user.name || user.email || 'Administrator'}</h4>
            <p className="text-sm text-text-secondary truncate capitalize">{roleLabel || 'Administrator'}</p>
          </div>
        </div>
      )}
    </aside>
  )
}
