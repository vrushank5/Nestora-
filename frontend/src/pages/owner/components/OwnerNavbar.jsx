import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Bell, HelpCircle, Menu, UserCircle, Settings, LogOut } from 'lucide-react'
import ThemeToggle from '../../../components/ThemeToggle.jsx'
import { useNotifications } from '../../../context/useNotifications.js'

export default function OwnerNavbar({ user, onMenuClick, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const { unreadCount } = useNotifications()

  return (
    <header className="owner-navbar">
      <div className="owner-navbar-left">
        <button className="owner-mobile-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
        
        <div className="owner-search-box">
          <Search size={16} />
          <input type="text" placeholder="Search properties, residents..." />
        </div>
      </div>

      <div className="owner-navbar-right">
        <ThemeToggle />
        <div className="owner-property-selector">
          <select>
            <option>All Properties</option>
            <option>Nestora Heights</option>
            <option>UrbanNest PG</option>
            <option>Green Valley Co-Living</option>
          </select>
        </div>

        <button className="owner-icon-btn nav-help" title="Help">
          <HelpCircle size={20} />
        </button>
        
        <Link to="/owner/notifications" className="owner-icon-btn nav-bell" title="Notifications">
          <Bell size={20} />
          {unreadCount > 0 && <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </Link>

        <div className="owner-profile-dropdown">
          <button 
            className="owner-profile-btn" 
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="owner-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
            </div>
          </button>

          {profileOpen && (
            <div className="owner-dropdown-menu">
              <div className="dropdown-header">
                <strong>{user?.name || 'Property Owner'}</strong>
                <small>{user?.email || 'owner@example.com'}</small>
              </div>
              <Link to="/owner/profile" onClick={() => setProfileOpen(false)}>
                <UserCircle size={16} /> My Profile
              </Link>
              <Link to="/owner/settings" onClick={() => setProfileOpen(false)}>
                <Settings size={16} /> Settings
              </Link>
              <Link to="/owner/help" onClick={() => setProfileOpen(false)}>
                <HelpCircle size={16} /> Help & Support
              </Link>
              <button className="dropdown-logout" onClick={onLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
