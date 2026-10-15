import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, HelpCircle, LogOut, Menu, Search, Settings, User } from 'lucide-react'
import ThemeToggle from '../../../components/ThemeToggle.jsx'
import { useNotifications } from '../../../context/useNotifications.js'

export default function ResidentNavbar({ user, onMenuClick, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'R'

  const handleSearch = (event) => {
    event.preventDefault()
    navigate(`/resident/explore${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`)
    setProfileOpen(false)
  }

  return (
    <header className="resident-topbar">
      <div className="resident-topbar-start">
        <button
          className="resident-topbar-menu"
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <form className="resident-topbar-search" onSubmit={handleSearch} role="search">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Search properties"
            placeholder="Search properties..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>
      </div>

      <div className="resident-topbar-actions">
        <ThemeToggle />
        <Link
          to="/resident/help"
          className="resident-topbar-icon"
          title="Help & Support"
          aria-label="Help and support"
        >
          <HelpCircle size={19} />
        </Link>
        <Link
          to="/resident/notifications"
          className="resident-topbar-icon resident-topbar-notifications"
          title="Notifications"
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="resident-topbar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </Link>

        <div className="resident-topbar-profile">
          <button
            className="resident-topbar-avatar"
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
          >
            {initial}
          </button>
          {profileOpen && (
            <div className="resident-topbar-profile-menu">
              <div className="resident-topbar-profile-details">
                <strong>{user?.name || 'Resident'}</strong>
                <small>{user?.email || ''}</small>
              </div>
              <Link to="/resident/profile" onClick={() => setProfileOpen(false)}>
                <User size={16} /> My Profile
              </Link>
              <Link to="/resident/settings" onClick={() => setProfileOpen(false)}>
                <Settings size={16} /> Settings
              </Link>
              <button type="button" onClick={onLogout}>
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
