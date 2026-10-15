import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, Search, Bell, BadgeCheck, HelpCircle, User, Settings, Activity, LogOut, ChevronDown
} from 'lucide-react'

import { apiRequest } from '../../../services/api.js'
import ThemeToggle from '../../../components/ThemeToggle.jsx'
import { useNotifications } from '../../../context/useNotifications.js'

export default function AdminNavbar({ user, onToggleSidebar, onLogout }) {
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0)
  const [notificationActionError, setNotificationActionError] = useState('')
  const { notifications, unreadCount, markRead } = useNotifications()
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    let active = true
    apiRequest('/admin/summary')
      .then(res => {
        if (active && res.data) {
          setPendingVerificationsCount(res.data.pendingProperties ?? 0)
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'A'

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifMenu(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/admin/users?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="admin-navbar">
      {/* Left side */}
      <div className="admin-navbar-left">
        <button className="admin-mobile-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>

        {/* Global Search */}
        <form className="admin-search-bar" onSubmit={handleSearchSubmit}>
          <Search size={16} />
          <input
            placeholder="Global Search (Users, Properties, Bookings...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Right side */}
      <div className="admin-navbar-right">
        <ThemeToggle />
        {/* Verification Alert Badge */}
        <Link to="/admin/properties/verification" className="admin-verification-pill" title={`${pendingVerificationsCount} Pending Verifications`}>
          <BadgeCheck size={16} />
          <span>{pendingVerificationsCount} Pending Verifications</span>
        </Link>

        {/* Notifications */}
        <div className="admin-nav-dropdown-wrapper" ref={notifRef}>
          <button
            className="admin-icon-button"
            onClick={() => { setShowNotifMenu(!showNotifMenu); setShowProfileMenu(false) }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="admin-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>

          <AnimatePresence>
            {showNotifMenu && (
              <motion.div
                className="admin-dropdown-menu notif-dropdown"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <div className="admin-dropdown-header">
                  <strong>System Notifications</strong>
                  <Link to="/admin/notifications" onClick={() => setShowNotifMenu(false)}>View all</Link>
                </div>
                <div className="notif-list">
                  {notifications.slice(0, 5).map((notification) => (
                    <Link
                      key={notification.id}
                      to={notification.link || '/admin/notifications'}
                      className={`notif-item ${notification.read ? '' : 'alert'}`}
                      onClick={() => {
                        setShowNotifMenu(false)
                        if (!notification.read) {
                          markRead(notification.id).catch((error) => {
                            setNotificationActionError(error.message || 'Unable to mark as read.')
                          })
                        }
                      }}
                    >
                      <Bell size={15} className={notification.read ? 'notif-icon' : 'notif-icon-alert'} />
                      <div className="notif-content">
                        <p>{notification.title}</p>
                        <small>{notification.message}</small>
                      </div>
                    </Link>
                  ))}
                  {notificationActionError && <div className="notif-action-error" role="alert">{notificationActionError}</div>}
                  {!notifications.length && <div className="notif-empty">No notifications yet.</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Help */}
        <Link to="/admin/faqs" className="admin-icon-button" title="Help & Documentation">
          <HelpCircle size={18} />
        </Link>

        {/* Admin Profile Dropdown */}
        <div className="admin-nav-dropdown-wrapper" ref={profileRef}>
          <button
            className="admin-profile-trigger"
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifMenu(false) }}
          >
            <span className="admin-avatar-sm">{initial}</span>
            <span className="admin-name-text">{user?.name?.split(' ')[0] || 'Admin'}</span>
            <ChevronDown size={14} />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                className="admin-dropdown-menu profile-dropdown"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <div className="admin-dropdown-header">
                  <strong>{user?.name || 'Administrator'}</strong>
                  <small>{user?.email || 'nestora2671@gmail.com'}</small>
                </div>
                <div className="admin-dropdown-links">
                  <Link to="/admin/profile" onClick={() => setShowProfileMenu(false)}>
                    <User size={16} /> Profile
                  </Link>
                  <Link to="/admin/settings" onClick={() => setShowProfileMenu(false)}>
                    <Settings size={16} /> Settings
                  </Link>
                  <Link to="/admin/profile#activity" onClick={() => setShowProfileMenu(false)}>
                    <Activity size={16} /> Activity Log
                  </Link>
                  <button className="dropdown-logout-btn" onClick={onLogout}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
