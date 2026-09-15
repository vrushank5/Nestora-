import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Search, GitCompare, Heart, BookOpen, CreditCard,
  CalendarDays, AlertTriangle, MessageSquare, Star, Bell, User,
  Settings, HelpCircle, LogOut, X, Building2
} from 'lucide-react'

const navGroups = [
  {
    title: 'OVERVIEW',
    items: [{ id: 'dashboard', label: 'Overview', icon: LayoutDashboard, path: '/resident/dashboard' }],
  },
  {
    title: 'DISCOVER',
    items: [
      { id: 'explore', label: 'Explore PGs', icon: Search, path: '/resident/explore' },
      { id: 'compare', label: 'Compare', icon: GitCompare, path: '/resident/compare' },
    ],
  },
  {
    title: 'MY STAY',
    items: [
      { id: 'bookings', label: 'Bookings', icon: BookOpen, path: '/resident/bookings' },
      { id: 'payments', label: 'Payments', icon: CreditCard, path: '/resident/payments' },
      { id: 'visits', label: 'Visits', icon: CalendarDays, path: '/resident/visits' },
      { id: 'complaints', label: 'Complaints', icon: AlertTriangle, path: '/resident/complaints' },
    ],
  },
  {
    title: 'PERSONAL',
    items: [
      { id: 'saved', label: 'Saved', icon: Heart, path: '/resident/saved' },
      { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/resident/messages' },
      { id: 'reviews', label: 'Reviews', icon: Star, path: '/resident/reviews' },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell, path: '/resident/notifications' },
      { id: 'profile', label: 'Profile', icon: User, path: '/resident/profile' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/resident/settings' },
      { id: 'help', label: 'Help & Support', icon: HelpCircle, path: '/resident/help' },
    ],
  },
]

export default function ResidentSidebar({ user, isOpen, setIsOpen, onLogout }) {
  const location = useLocation()
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'R'

  return (
    <aside className={`r-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="r-sidebar-head">
        <div className="brand-logo dashboard-brand">
          <span className="brand-mark"><Building2 size={18} /></span>
          <span>
            <strong>NESTORA</strong>
            <small>RESIDENT</small>
          </span>
        </div>
        <button className="r-sidebar-close" onClick={() => setIsOpen(false)} aria-label="Close sidebar">
          <X size={18} />
        </button>
      </div>

      {/* Profile Card */}
      <div className="sidebar-profile">
        <span className="r-profile-initial">{initial}</span>
        <div>
          <strong>{user?.name || 'Resident'}</strong>
          <small>{user?.email || 'resident@nestora.com'}</small>
        </div>
      </div>

      {/* Navigation */}
      <nav className="r-sidebar-nav" aria-label="Resident navigation">
        {navGroups.map(group => (
          <div key={group.title} className="r-nav-group">
            <span className="r-nav-group-title">{group.title}</span>
            {group.items.map(item => {
              const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`sidebar-nav-item ${active ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                  title={item.label}
                >
                  <item.icon size={17} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <button className="sidebar-nav-item logout-btn r-logout" onClick={onLogout}>
        <LogOut size={17} />
        <span>Logout</span>
      </button>
    </aside>
  )
}
