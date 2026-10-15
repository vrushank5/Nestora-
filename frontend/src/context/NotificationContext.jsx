import { useCallback, useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './useAuth.js'
import { getToken } from './authStorage.js'
import { apiRequest } from '../services/api.js'
import { NotificationContext } from './notificationContext.js'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const userId = user?.userId
  const roleId = user?.roleId

  const refresh = useCallback(async () => {
    if (!userId || !roleId) return
    setLoading(true)
    try {
      const response = await apiRequest('/notifications')
      setNotifications(response.data || [])
      setUnreadCount(Number(response.unreadCount) || 0)
      setError('')
    } catch (requestError) {
      setError(requestError.message || 'Unable to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [roleId, userId])

  useEffect(() => {
    if (!userId || !roleId || !getToken()) {
      return undefined
    }

    const initialLoad = window.setTimeout(refresh, 0)
    const interval = window.setInterval(refresh, 30000)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(interval)
    }
  }, [refresh, roleId, userId])

  useEffect(() => {
    const token = getToken()
    if (!userId || !roleId || !token) return undefined
    const socket = io(BACKEND_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
    socket.on('notification:new', (notification) => {
      setNotifications((current) => [
        notification,
        ...current.filter((item) => item.id !== notification.id),
      ].slice(0, 100))
      if (!notification.read) setUnreadCount((count) => count + 1)
    })
    socket.on('notification:read', ({ ids }) => {
      if (ids?.length || !ids) refresh()
    })
    socket.on('connect_error', (connectionError) => {
      if (/authentication required|invalid authentication token|account is inactive/i.test(connectionError.message)) {
        socket.disconnect()
      }
    })
    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [refresh, roleId, userId])

  const markRead = useCallback(async (notificationId) => {
    const current = notifications.find((notification) => notification.id === notificationId)
    if (!current || current.read) return
    const response = await apiRequest(`/notifications/${notificationId}/read`, { method: 'PATCH' })
    setNotifications((current) => current.map((notification) =>
      notification.id === notificationId
        ? { ...notification, read: true, readAt: response.data?.readAt || new Date().toISOString() }
        : notification
    ))
    setUnreadCount((count) => Math.max(0, count - 1))
  }, [notifications])

  const markAllRead = useCallback(async () => {
    await apiRequest('/notifications/read-all', { method: 'PATCH' })
    setNotifications((current) => current.map((notification) => ({
      ...notification,
      read: true,
      readAt: notification.readAt || new Date().toISOString(),
    })))
    setUnreadCount(0)
  }, [])

  const authenticated = Boolean(userId && roleId && getToken())
  const value = useMemo(() => ({
    notifications: authenticated ? notifications : [],
    unreadCount: authenticated ? unreadCount : 0,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
  }), [authenticated, error, loading, markAllRead, markRead, notifications, refresh, unreadCount])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
