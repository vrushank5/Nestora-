import { LogOut } from 'lucide-react'
import NestoraLogo from './NestoraLogo.jsx'

function DashboardShell({ label, user, navItems, activeTab, onTabChange, onLogout, children }) {
  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-top">
          <div className="brand-logo dashboard-brand">
            <NestoraLogo variant="sidebar" subtitle={label} />
          </div>

          <div className="sidebar-profile">
            <span>{(user?.name || 'N').charAt(0).toUpperCase()}</span>
            <div>
              <strong>{user?.name || 'Nestora Member'}</strong>
              <small>{user?.email || 'Signed in account'}</small>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label={`${label} navigation`}>
            {navItems.map(({ id, label: itemLabel, icon: Icon }) => (
              <button
                className={`sidebar-nav-item ${activeTab === id ? 'active' : ''}`}
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
              >
                <Icon size={18} />
                {itemLabel}
              </button>
            ))}
          </nav>
        </div>

        <button className="sidebar-nav-item logout-btn" type="button" onClick={onLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="dashboard-main">{children}</main>
    </div>
  )
}

export default DashboardShell
