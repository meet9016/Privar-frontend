import React, { useRef, useState, useEffect } from 'react'
import { Bell, CheckCheck, Newspaper, Calendar, Megaphone } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

const typeIcon = (type) => {
  if (type === 'news') return <Newspaper className="w-4 h-4 text-blue-500" />
  if (type === 'event') return <Calendar className="w-4 h-4 text-green-500" />
  return <Megaphone className="w-4 h-4 text-primary" />
}

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationDropdown({ variant = 'dark', iconColor, badgeColor }) {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => setOpen(v => !v)

  const handleClick = (notif) => {
    if (!notif.is_read) markRead(notif._id)
  }

  const btnClass = variant === 'dark'
    ? 'relative p-2 rounded-xl text-text-secondary hover:text-text hover:bg-surface-secondary border border-border transition-all'
    : 'relative p-2 rounded-lg transition-colors duration-200'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className={btnClass}
        style={variant === 'light' ? { color: iconColor || '#123524' } : {}}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
            style={{ backgroundColor: badgeColor || '#ef4444' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border z-50 overflow-hidden ${
          variant === 'dark'
            ? 'bg-surface border-border'
            : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            variant === 'dark' ? 'border-border' : 'border-gray-100'
          }`}>
            <span className={`font-semibold text-sm ${variant === 'dark' ? 'text-text' : 'text-gray-800'}`}>
              Notifications {unreadCount > 0 && <span className="text-primary">({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 rounded-full border-2 border-primary/25 border-t-primary animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className={`py-10 text-center text-sm ${variant === 'dark' ? 'text-text-secondary' : 'text-gray-400'}`}>
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif._id}
                  onClick={() => handleClick(notif)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b transition-colors ${
                    variant === 'dark'
                      ? `border-border hover:bg-surface-secondary ${!notif.is_read ? 'bg-primary/5' : ''}`
                      : `border-gray-50 hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50' : ''}`
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                    variant === 'dark' ? 'bg-surface-secondary' : 'bg-gray-100'
                  }`}>
                    {typeIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${
                      variant === 'dark' ? 'text-text' : 'text-gray-800'
                    }`}>{notif.title}</p>
                    <p className={`text-xs line-clamp-2 mt-0.5 ${
                      variant === 'dark' ? 'text-text-secondary' : 'text-gray-500'
                    }`}>{notif.body}</p>
                    <p className="text-xs text-primary mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
