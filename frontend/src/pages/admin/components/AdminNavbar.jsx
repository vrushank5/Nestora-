import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, Search, Bell, BadgeCheck, HelpCircle, User, Settings, Activity, LogOut, ChevronDown, CheckCircle2, AlertTriangle
} from 'lucide-react'

const sampleNotifications = [
  { id: 1, text: '18 properties waiting for verification', time: '10 mins ago', type: 'verification', alert: true },
  { id: 2, text: '12 new booking issues reported', time: '1 hour ago', type: 'booking', alert: false },
  { id: 3, text: '5 unresolved high-priority complaints', time: '2 hours ago', type: 'complaint', alert: true },
]

export default function AdminNavbar({ user, onToggleSidebar, onLogout }) {
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const notifRef = useRef(null)
  const profileRef = useRef(null)

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
        {/* Verification Alert Badge */}
        <Link to="/admin/properties/verification" className="admin-verification-pill" title="18 Pending Verifications">
          <BadgeCheck size={16} />
          <span>18 Pending Verifications</span>
        </Link>

        {/* Notifications */}
        <div className="admin-nav-dropdown-wrapper" ref={notifRef}>
          <button
            className="admin-icon-button"
            onClick={() => { setShowNotifMenu(!showNotifMenu); setShowProfileMenu(false) }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="admin-bell-badge">3</span>
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
                  {sampleNotifications.map(n => (
                    <div key={n.id} className={`notif-item ${n.alert ? 'alert' : ''}`}>
                      {n.alert ? <AlertTriangle size={15} className="notif-icon-alert" /> : <CheckCircle2 size={15} className="notif-icon" />}
                      <div className="notif-content">
                        <p>{n.text}</p>
                        <small>{n.time}</small>
                      </div>
                    </div>
                  ))}
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
