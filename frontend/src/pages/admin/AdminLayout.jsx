import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import AdminSidebar from './components/AdminSidebar.jsx'
import AdminNavbar from './components/AdminNavbar.jsx'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="admin-layout">
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <AdminSidebar
        user={user}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={logout}
      />
      <div className="admin-body">
        <AdminNavbar
          user={user}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={logout}
        />
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
