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

export default function OwnerSidebar({ isOpen, setIsOpen, onLogout }) {
  const location = useLocation()

  return (
    <>
      <div className={`owner-sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />
      <aside className={`owner-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="owner-sidebar-header">
          <div className="brand-logo">
            <span className="brand-mark"><Building2 size={18} /></span>
            <span>
              <strong>NESTORA</strong>
              <small>Smart PG Management</small>
            </span>
          </div>
          <button className="mobile-close-btn" onClick={() => setIsOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
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
