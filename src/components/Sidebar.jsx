import React, { useContext, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Shield, ChevronDown, Database, Layers, Activity, CalendarDays, Briefcase } from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import { configurationNavigation, coreNavigation, masterNavigation, mediaNavigation, engagementNavigation, activityNavigation, servicesNavigation } from '../config/navigation'
import { hasPermission } from '../lib/permissions'
import { getUserRoleLabel } from '../lib/roles'
import { getCommunitySurname, assetUrl } from '../lib/api'

const LinkItem = ({ to, icon: Icon, label, end }) => {
  const location = useLocation()
  const isDashboardActive = (to === '/admin' || to === '/admin/dashboard') && 
    (location.pathname === '/admin' || location.pathname === '/admin/' || location.pathname === '/admin/dashboard' || location.pathname === '/admin/dashboard/')

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        const active = isActive || isDashboardActive
        return `group flex min-h-10 w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13.5px] tra nsition-all duration-200 ${
          active
            ? 'text-white font-bold shadow-md border-transparent bg-primary'
            : 'border-transparent text-text-secondary/90 font-medium hover:bg-surface-secondary hover:text-text'
        }`
      }}
      title={label}
    >
      {({ isActive }) => {
        const active = isActive || isDashboardActive
        return (
          <>
            <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white font-bold stroke-[2.2]' : 'text-text-secondary group-hover:text-text'}`} />
            <span className="truncate tracking-tight">{label}</span>
            {active && (
              <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-white shadow-sm"></span>
            )}
          </>
        )
      }}
    </NavLink>
  )
}

const SectionLabel = ({ children }) => (
  <div className="px-3 pb-2 pt-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary/60 first:pt-0">
    {children}
  </div>
)

const CollapsibleMenu = ({ label, icon: Icon, children, defaultOpen = false, items = [], basePath }) => {
  const location = useLocation()
  
  // Check if any child item or basePath is active
  const isChildActive = items.some(item => {
    const itemPath = item.to || (item.type ? `/admin/masters/${item.type}` : '')
    if (!itemPath) return false
    return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`)
  }) || (basePath && location.pathname.startsWith(basePath))

  const [isOpen, setIsOpen] = useState(defaultOpen || isChildActive)

  // Automatically keep open whenever a child route is active
  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true)
    }
  }, [isChildActive, location.pathname])

  return (
    <div className="space-y-1.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13.5px] transition-all duration-200 cursor-pointer ${
          isChildActive && !isOpen
            ? 'text-white font-bold shadow-md border-transparent bg-primary'
            : isChildActive
            ? 'border-primary/20 bg-primary/10 text-primary font-semibold'
            : 'border-transparent text-text-secondary/90 font-medium hover:bg-surface-secondary hover:text-text'
        }`}
      >
        {Icon && (
          <Icon 
            className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
              isChildActive && !isOpen ? 'text-white font-bold stroke-[2.2]' : isChildActive ? 'text-primary' : 'text-text-secondary group-hover:text-text'
            }`} 
          />
        )}
        <span className="truncate flex-1 text-left tracking-tight">{label}</span>
        <ChevronDown 
          className={`h-4 w-4 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-primary' : (isChildActive && !isOpen ? 'text-white' : 'text-text-secondary')
          }`} 
        />
      </button>
      
      <div 
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="ml-4 mt-1.5 space-y-1.5 border-l-2 border-primary/25 pl-3 pb-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const visibleMediaNavigation = mediaNavigation.filter((item) => hasPermission(user, item.permission))
  const visibleEngagementNavigation = engagementNavigation.filter((item) => hasPermission(user, item.permission))
  const visibleActivityNavigation = activityNavigation.filter((item) => hasPermission(user, item.permission))
  const visibleServicesNavigation = servicesNavigation.filter((item) => hasPermission(user, item.permission))

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-border bg-surface p-5 shadow-glass-md backdrop-blur-xl">
      <div className="mb-6 w-full flex shrink-0 items-center justify-center pb-6 border-b border-border/60">
        <img 
          src={webTheme.webLogo ? assetUrl(webTheme.webLogo) : "/parivar.png"} 
          alt={webTheme.name || 'Parivar'} 
          className="h-12 w-auto max-w-full object-contain" 
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextSibling.style.display = 'flex';
          }}
        />
        <div className="hidden items-center justify-center">
          <Shield className="h-10 w-10 text-primary" />
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto pr-1 space-y-4 hide-scrollbar">
        <div className="space-y-1">
          {visibleCoreNavigation.map((item) => (
            <LinkItem key={item.to} {...item} />
          ))}
        </div>

        {visibleActivityNavigation.length > 0 && (
          <div className="space-y-1">
            <LinkItem to="/admin/activities" label="Activities" icon={CalendarDays} />
          </div>
        )}

        {visibleServicesNavigation.length > 0 && (
          <div className="space-y-1">
            <LinkItem to="/admin/services" label="Services" icon={Briefcase} />
          </div>
        )}

        {visibleMediaNavigation.length > 0 && (
          <div className="space-y-1">
            <LinkItem to="/admin/media" label="Media & Content" icon={Layers} />
          </div>
        )}

        {visibleEngagementNavigation.length > 0 && (
          <div className="space-y-1">
            <LinkItem to="/admin/engagements" label="Engagements" icon={Activity} />
          </div>
        )}

        {visibleMasterNavigation.length > 0 && (
          <div className="space-y-1">
            <LinkItem to="/admin/masters" label="Masters" icon={Database} />
          </div>
        )}

        {visibleConfigurationNavigation.length > 0 && (
          <div className="space-y-1">
            {/* The old config items usually didn't have a category page. I'll just map the visible items directly */}
            {visibleConfigurationNavigation.map((item) => (
              <LinkItem key={item.to} {...item} />
            ))}
          </div>
        )}
      </nav>

      <div className="mt-5 flex shrink-0 items-center justify-center p-3 border-t border-border/50">
        <div className="text-center">
          <h2 className="font-bold text-sm tracking-tight text-text truncate">
            {`${getCommunitySurname()} Admin`}
          </h2>
          <span className="text-[11px] font-medium text-text-secondary block mt-0.5">Management Panel</span>
        </div>
      </div>
    </aside>
  )
}
