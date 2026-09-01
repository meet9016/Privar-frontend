import React, { useContext, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Shield, Database, Layers, Activity, CalendarDays, Briefcase } from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import { configurationNavigation, coreNavigation, masterNavigation, mediaNavigation, engagementNavigation, activityNavigation, servicesNavigation } from '../config/navigation'
import { hasPermission } from '../lib/permissions'
import { getCommunitySurname, getCommunityFullName, getSubdomainTenant, assetUrl } from '../lib/api'

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
        return `group flex min-h-10 w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13.5px] transition-all duration-200 ${
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

export default function Sidebar() {
  const { user } = useContext(AuthContext)
  const [webTheme, setWebTheme] = useState({ webLogo: '', name: '' })
  const visibleCoreNavigation = coreNavigation.filter((item) => hasPermission(user, item.permission))

  useEffect(() => {
    const loadWebTheme = () => {
      const currentSubdomain = getSubdomainTenant()
      let name = localStorage.getItem('web_name') || ''
      if (currentSubdomain && name && !name.toLowerCase().includes(currentSubdomain.toLowerCase())) {
        name = `${currentSubdomain.charAt(0).toUpperCase() + currentSubdomain.slice(1)} Parivar`
        localStorage.setItem('web_name', name)
      }

      setWebTheme({
        webLogo: localStorage.getItem('web_logo') || localStorage.getItem('web_webLogo') || '',
        name: name || getCommunityFullName()
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
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col justify-between border-r border-border bg-surface px-3 py-4 shadow-glass transition-all duration-300">
      
      {/* Brand Web Logo Section at Top of Sidebar */}
      <div className="mb-4 flex shrink-0 items-center justify-center p-3 border-b border-border/50">
        <img 
          src={webTheme.webLogo ? assetUrl(webTheme.webLogo) : "/parivar.png"} 
          alt={getCommunityFullName()} 
          className="h-11 w-auto max-w-full object-contain" 
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'flex';
            }
          }}
        />
        <div className="hidden items-center justify-center">
          <Shield className="h-9 w-9 text-primary" />
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-1">
        {visibleCoreNavigation.map((item) => (
          <LinkItem key={item.to} {...item} />
        ))}

        {visibleServicesNavigation.length > 0 && (
          <div className="space-y-1">
            <LinkItem to="/admin/services" label="Services" icon={Briefcase} />
          </div>
        )}

        {visibleActivityNavigation.length > 0 && (
          <div className="space-y-1">
            <LinkItem to="/admin/activities" label="Activities" icon={CalendarDays} />
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
            {visibleConfigurationNavigation.map((item) => (
              <LinkItem key={item.to} {...item} />
            ))}
          </div>
        )}
      </nav>

      <div className="mt-5 flex shrink-0 items-center justify-center p-3 border-t border-border/50">
        <div className="text-center w-full px-2">
          <h2 className="font-bold text-sm tracking-tight text-text truncate">
            {getCommunityFullName()}
          </h2>
          <span className="text-[11px] font-medium text-text-secondary block mt-0.5">Admin Panel</span>
        </div>
      </div>
    </aside>
  )
}
