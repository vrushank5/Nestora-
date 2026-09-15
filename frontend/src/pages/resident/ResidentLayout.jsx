import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import ResidentSidebar from './components/ResidentSidebar.jsx'

export default function ResidentLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="r-layout">
      <div
        className={`r-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <ResidentSidebar
        user={user}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={logout}
      />
      <main className="r-main">
        <Outlet />
      </main>
    </div>
  )
}
