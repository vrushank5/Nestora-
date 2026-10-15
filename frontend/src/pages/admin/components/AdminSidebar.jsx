import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCheck, ShieldAlert, Building2, BadgeCheck,
  DoorOpen, BookOpen, CreditCard, CalendarDays, AlertTriangle, Star,
  Bell, FileText, HelpCircle, TrendingUp, BarChart3, Settings, User, LogOut, X
} from 'lucide-react'
import { apiRequest } from '../../../services/api.js'
import NestoraLogo from '../../../components/NestoraLogo.jsx'
import { useNotifications } from '../../../context/useNotifications.js'

const adminNavGroups = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    ],
  },
  {
    title: 'USERS',
    items: [
      { id: 'users', label: 'All Users', icon: Users, path: '/admin/users' },
      { id: 'residents', label: 'Residents', icon: UserCheck, path: '/admin/residents' },
      { id: 'owners', label: 'Owners', icon: ShieldAlert, path: '/admin/owners' },
    ],
  },
  {
    title: 'PROPERTY MANAGEMENT',
    items: [
      { id: 'properties', label: 'Properties', icon: Building2, path: '/admin/properties' },
      { id: 'verification', label: 'Verification Requests', icon: BadgeCheck, path: '/admin/properties/verification' },
      { id: 'rooms', label: 'Rooms', icon: DoorOpen, path: '/admin/rooms' },
    ],
  },
  {
    title: 'TRANSACTIONS',
    items: [
      { id: 'bookings', label: 'Bookings', icon: BookOpen, path: '/admin/bookings' },
      { id: 'payments', label: 'Payments', icon: CreditCard, path: '/admin/payments' },
      { id: 'visits', label: 'Property Visits', icon: CalendarDays, path: '/admin/visits' },
    ],
  },
  {
    title: 'COMMUNITY',
    items: [
      { id: 'complaints', label: 'Complaints', icon: AlertTriangle, path: '/admin/complaints', badge: '27', alert: true },
      { id: 'reviews', label: 'Reviews', icon: Star, path: '/admin/reviews' },
      { id: 'notifications', label: 'Notifications', icon: Bell, path: '/admin/notifications' },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { id: 'blogs', label: 'Blogs', icon: FileText, path: '/admin/blogs' },
      { id: 'faqs', label: 'FAQs', icon: HelpCircle, path: '/admin/faqs' },
    ],
  },
  {
    title: 'INSIGHTS',
    items: [
      { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/admin/analytics' },
      { id: 'reports', label: 'Reports', icon: BarChart3, path: '/admin/reports' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
      { id: 'profile', label: 'Admin Profile', icon: User, path: '/admin/profile' },
    ],
  },
]

export default function AdminSidebar({ user, isOpen, setIsOpen, onLogout }) {
  const location = useLocation()
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'A'
  const [summary, setSummary] = useState({})
  const { unreadCount } = useNotifications()

  useEffect(() => {
    let active = true
    apiRequest('/admin/summary')
      .then(response => {
        if (active) setSummary(response.data || {})
      })
      .catch(() => {
        if (active) setSummary({})
      })
    return () => { active = false }
  }, [])

  const badgeCounts = {
    verification: summary.pendingProperties,
    complaints: summary.complaints,
    bookings: summary.bookings,
    payments: summary.pendingPayments,
    visits: summary.visits,
    reviews: summary.pendingReviews,
    notifications: unreadCount,
  }

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Sidebar Header */}
      <div className="admin-sidebar-head">
        <Link to="/admin/dashboard" className="brand-logo admin-brand" style={{ textDecoration: 'none' }}>
          <NestoraLogo variant="sidebar" subtitle="ADMIN PANEL" />
        </Link>
        <button className="admin-sidebar-close" onClick={() => setIsOpen(false)} aria-label="Close sidebar">
          <X size={18} />
        </button>
      </div>

      {/* Admin Profile Pill */}
      <div className="admin-profile-pill">
        <span className="admin-avatar-initial">{initial}</span>
        <div className="admin-user-info">
          <strong>{user?.name || 'Administrator'}</strong>
          <small>{user?.email || 'admin@nestora.com'}</small>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="admin-sidebar-nav" aria-label="Admin Navigation">
        {adminNavGroups.map(group => (
          <div key={group.title} className="admin-nav-group">
            <span className="admin-nav-group-title">{group.title}</span>
            {group.items.map(item => {
              const active = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path))
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`admin-nav-item ${active ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                  title={item.label}
                >
                  <item.icon size={17} />
                  <span>{item.label}</span>
                  {(badgeCounts[item.id] !== undefined || item.badge) && (
                    <span className={`admin-nav-badge ${item.alert ? 'alert' : ''}`}>
                      {badgeCounts[item.id] ?? item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer Logout */}
      <button className="admin-nav-item admin-logout-btn" onClick={onLogout}>
        <LogOut size={17} />
        <span>Logout</span>
      </button>
    </aside>
  )
}
