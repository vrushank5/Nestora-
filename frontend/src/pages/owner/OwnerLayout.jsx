import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import OwnerSidebar from './components/OwnerSidebar.jsx'
import OwnerNavbar from './components/OwnerNavbar.jsx'

export default function OwnerLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="owner-layout">
      <OwnerSidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        onLogout={logout} 
      />
      <div className="owner-main-content">
        <OwnerNavbar 
          user={user} 
          onMenuClick={() => setSidebarOpen(true)} 
          onLogout={logout}
        />
        <main className="owner-page-container">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
