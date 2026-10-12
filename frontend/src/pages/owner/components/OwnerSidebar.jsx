import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  DoorClosed, 
  BookOpen, 
  CreditCard, 
  CalendarDays, 
  AlertTriangle, 
  Star, 
  Coffee, 
  Sparkles, 
  BarChart3, 
  Bell, 
  UserCircle, 
  Settings, 
  LogOut,
  X
} from 'lucide-react'
import { apiRequest } from '../../../services/api.js'
import NestoraLogo from '../../../components/NestoraLogo.jsx'

const navGroups = [
  {
    title: 'DASHBOARD',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/owner/dashboard' }
    ]
  },
  {
    title: 'PROPERTY',
    items: [
      { id: 'properties', label: 'My Properties', icon: Building2, path: '/owner/properties' },
      { id: 'rooms', label: 'Rooms', icon: DoorClosed, path: '/owner/rooms' },
      { id: 'residents', label: 'Residents', icon: Users, path: '/owner/residents' }
    ]
  },
  {
    title: 'BOOKING',
    items: [
      { id: 'bookings', label: 'Bookings', icon: BookOpen, path: '/owner/bookings' },
      { id: 'payments', label: 'Payments', icon: CreditCard, path: '/owner/payments' },
      { id: 'visits', label: 'Property Visits', icon: CalendarDays, path: '/owner/visits' }
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { id: 'complaints', label: 'Complaints', icon: AlertTriangle, path: '/owner/complaints' },
      { id: 'reviews', label: 'Reviews', icon: Star, path: '/owner/reviews' },
      { id: 'food', label: 'Food & Menu', icon: Coffee, path: '/owner/food' },
      { id: 'amenities', label: 'Amenities', icon: Sparkles, path: '/owner/amenities' }
    ]
  },
  {
    title: 'INSIGHTS',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/owner/analytics' }
    ]
  },
  {
    title: 'ACCOUNT',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell, path: '/owner/notifications' },
      { id: 'profile', label: 'Profile', icon: UserCircle, path: '/owner/profile' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/owner/settings' }
    ]
  }
]

export default function OwnerSidebar({ user, isOpen, setIsOpen, onLogout }) {
  const location = useLocation()
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'O'
  const [summary, setSummary] = useState({})

  useEffect(() => {
    let active = true
    apiRequest('/owner/summary')
      .then(response => {
        if (active) setSummary(response.data || {})
      })
      .catch(() => {
        if (active) setSummary({})
      })
    return () => { active = false }
  }, [])

  const badgeCounts = {
    properties: summary.properties,
    rooms: summary.activeProperties,
    residents: summary.residents,
    bookings: summary.pendingBookings,
    payments: summary.pendingPayments,
    visits: summary.visits,
    complaints: summary.complaints,
    reviews: summary.reviews,
  }

  return (
    <>
      <div className={`owner-sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />
      <aside className={`owner-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="owner-sidebar-header">
          <Link to="/owner/dashboard" className="brand-logo" style={{ textDecoration: 'none' }}>
            <NestoraLogo variant="sidebar" subtitle="OWNER" />
          </Link>
          <button className="mobile-close-btn" onClick={() => setIsOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="owner-profile-pill">
          <span className="owner-profile-initial">{initial}</span>
          <div>
            <strong>{user?.name || 'Property Owner'}</strong>
            <small>{user?.email || 'owner@nestora.com'}</small>
          </div>
        </div>

        <div className="owner-sidebar-content">
          {navGroups.map((group) => (
            <div className="owner-nav-group" key={group.title}>
              <h4 className="owner-nav-title">{group.title}</h4>
              <nav>
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path)
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`owner-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setIsOpen(false)}
                      title={item.label}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                    {badgeCounts[item.id] !== undefined && (
                      <span className={`admin-nav-badge ${['complaints', 'bookings', 'payments'].includes(item.id) ? 'alert' : ''}`}>
                        {badgeCounts[item.id]}
                      </span>
                    )}
                  </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="owner-sidebar-footer">
          <button className="owner-nav-item logout-btn" onClick={onLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
