import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import api from '../lib/api'
import { getSocket, joinRoom } from '../lib/socket'
import { AuthContext } from './AuthContext'

export const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const { user, token } = useContext(AuthContext)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const socketRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await api.get('/notifications', { params: { limit: 30 } })
      const data = res.data?.data || []
      setNotifications(Array.isArray(data) ? data : [])
      setUnreadCount(res.data?.pagination?.unread || 0)
    } catch (_) {}
    finally { setLoading(false) }
  }, [token])

  // Socket connection
  useEffect(() => {
    if (!token) return

    const socket = getSocket()
    socketRef.current = socket

    // Join broadcast room + user-specific room
    const userId = user?._id || user?.id || user?.member_id
    joinRoom(userId)

    const handleNewNotif = (notif) => {
      setNotifications(prev => [{ ...notif, is_read: false }, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    socket.on('new_notification', handleNewNotif)
    return () => socket.off('new_notification', handleNewNotif)
  }, [token, user])

  // Initial fetch when logged in
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (_) {}
  }

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (_) {}
  }

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
