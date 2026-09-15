import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck,
  BookOpen,
  Building2,
  LayoutDashboard,
  Server,
  Settings,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react'
import DashboardShell from '../components/DashboardShell.jsx'
import { useAuth } from '../context/useAuth.js'
import { residences } from '../data/homeData.js'

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'properties', label: 'Listings', icon: Building2 },
  { id: 'bookings', label: 'Bookings', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const defaultUsers = [
  { id: 'u-1', name: 'Riya Shah', email: 'riya@example.com', role: 'Resident', status: 'Active', date: '25 Aug 2026' },
  { id: 'u-2', name: 'Aarav Mehta', email: 'aarav@example.com', role: 'Resident', status: 'Active', date: '24 Aug 2026' },
  { id: 'u-3', name: 'Kabir Patel', email: 'kabir@example.com', role: 'Resident', status: 'Active', date: '10 Jul 2026' },
  { id: 'u-4', name: 'Owner Partner', email: 'owner@example.com', role: 'Owner', status: 'Active', date: '01 Jun 2026' },
  { id: 'u-5', name: 'Inactive User', email: 'inactive@example.com', role: 'Resident', status: 'Inactive', date: '12 May 2026' },
]

const defaultBookings = [
  { id: 'b-101', propertyName: 'Nestora Heights', residentName: 'Riya Shah', ownerName: 'Owner Partner', rent: 'Rs.8,500/mo', status: 'Upcoming' },
  { id: 'b-102', propertyName: 'Urban Living PG', residentName: 'Aarav Mehta', ownerName: 'Owner Partner', rent: 'Rs.7,500/mo', status: 'Active' },
  { id: 'b-103', propertyName: 'Nestora Central', residentName: 'Kabir Patel', ownerName: 'Owner Partner', rent: 'Rs.8,200/mo', status: 'Completed' },
]

function AdminDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [userList, setUserList] = useState(defaultUsers)
  const [systemProperties, setSystemProperties] = useState(() => residences.map((property) => ({ ...property, owner: 'Owner Partner', status: 'Approved' })))
  const [allBookings] = useState(defaultBookings)
  const [toast, setToast] = useState(null)

  const notify = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 2800)
  }

  const activeUsers = useMemo(() => userList.filter((item) => item.status === 'Active').length, [userList])

  const toggleUserStatus = (userId) => {
    setUserList((current) => current.map((item) => {
      if (item.id !== userId) return item
      const status = item.status === 'Active' ? 'Inactive' : 'Active'
      notify(`User marked ${status.toLowerCase()}.`, 'info')
      return { ...item, status }
    }))
  }

  const togglePropertyStatus = (propertyId) => {
    setSystemProperties((current) => current.map((item) => {
      if (item.id !== propertyId) return item
      const status = item.status === 'Approved' ? 'Unpublished' : 'Approved'
      notify(`Listing marked ${status.toLowerCase()}.`, 'info')
      return { ...item, status }
    }))
  }

  return (
    <DashboardShell label="ADMIN" user={user} navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout}>
      <Toast toast={toast} />

      {activeTab === 'overview' ? (
        <DashboardSection title="Admin control room" subtitle="A compact operational view of users, listings, booking records, and role access screens.">
          <div className="dashboard-stats-grid">
            <StatCard label="Users shown" value={userList.length} icon={Users} />
            <StatCard label="Active users" value={activeUsers} icon={UserCheck} />
            <StatCard label="Listings shown" value={systemProperties.length} icon={Building2} />
            <StatCard label="Booking records" value={allBookings.length} icon={BookOpen} />
          </div>

          <div className="dashboard-inner-grid">
            <div className="dashboard-pane">
              <h3>Operational notes</h3>
              <div className="activity-feed">
                <Activity text="Authentication and role APIs are available from the existing backend." />
                <Activity text="Property and booking screens use the current frontend data model." />
                <Activity text="Public registration exposes only resident and owner roles." />
              </div>
            </div>
            <div className="dashboard-pane">
              <h3>Role mix</h3>
              <Progress label="Residents" value="60%" />
              <Progress label="Owners" value="20%" />
              <Progress label="Admins" value="20%" />
            </div>
          </div>
        </DashboardSection>
      ) : null}

      {activeTab === 'users' ? (
        <DashboardSection title="Users" subtitle="Audit visible user records and toggle local account status labels.">
          <DataTable
            columns={['Name', 'Email', 'Role', 'Created', 'Status', 'Action']}
            rows={userList.map((item) => [
              item.name,
              item.email,
              item.role,
              item.date,
              <span className={`status-badge ${item.status === 'Active' ? 'active' : 'cancelled'}`}>{item.status}</span>,
              <button className="ghost-button compact-button" type="button" onClick={() => toggleUserStatus(item.id)}>
                {item.status === 'Active' ? <><UserX size={13} /> Block</> : <><UserCheck size={13} /> Activate</>}
              </button>,
            ])}
          />
        </DashboardSection>
      ) : null}

      {activeTab === 'properties' ? (
        <DashboardSection title="Listings" subtitle="Review the residences visible across the frontend experience.">
          <DataTable
            columns={['Listing', 'Area', 'Owner', 'Rent', 'Rating', 'Status', 'Action']}
            rows={systemProperties.map((item) => [
              item.name,
              item.location,
              item.owner,
              item.price,
              item.rating,
              <span className={`status-badge ${item.status === 'Approved' ? 'active' : 'cancelled'}`}>{item.status}</span>,
              <button className="ghost-button compact-button" type="button" onClick={() => togglePropertyStatus(item.id)}>
                {item.status === 'Approved' ? 'Unpublish' : 'Approve'}
              </button>,
            ])}
          />
        </DashboardSection>
      ) : null}

      {activeTab === 'bookings' ? (
        <DashboardSection title="Bookings" subtitle="A read-only view of booking records represented in the admin UI.">
          <DataTable
            columns={['Booking ID', 'Resident', 'Property', 'Owner', 'Rent', 'Status']}
            rows={allBookings.map((item) => [
              item.id,
              item.residentName,
              item.propertyName,
              item.ownerName,
              item.rent,
              <span className={`status-badge ${item.status.toLowerCase()}`}>{item.status}</span>,
            ])}
          />
        </DashboardSection>
      ) : null}

      {activeTab === 'settings' ? (
        <DashboardSection title="Admin settings" subtitle="Interface preferences for the admin workspace.">
          <div className="settings-list">
            <div className="settings-note"><Server size={18} /><span>Backend base URL is controlled by <code>VITE_API_URL</code> or defaults to localhost:5000.</span></div>
            <label className="settings-row"><span>Highlight inactive accounts</span><input type="checkbox" defaultChecked /></label>
            <label className="settings-row"><span>Show listing status badges</span><input type="checkbox" defaultChecked /></label>
            <button className="primary-button compact-button" type="button" onClick={() => notify('Admin preferences saved.')}>Save preferences</button>
          </div>
        </DashboardSection>
      ) : null}
    </DashboardShell>
  )
}

function DashboardSection({ title, subtitle, children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <header className="dashboard-header">
        <div className="dashboard-title"><h2>{title}</h2><p>{subtitle}</p></div>
      </header>
      {children}
    </motion.section>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="dashboard-stat-card">
      <span className="stat-icon-wrapper"><Icon size={20} /></span>
      <div className="stat-info"><span>{label}</span><h3>{value}</h3></div>
    </div>
  )
}

function DataTable({ columns, rows }) {
  return (
    <div className="profile-card table-card">
      <table>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Activity({ text }) {
  return (
    <div className="activity-item">
      <span className="activity-dot" />
      <div className="activity-desc"><p>{text}</p><span>Current interface state</span></div>
    </div>
  )
}

function Progress({ label, value }) {
  return (
    <div className="progress-row">
      <div><span>{label}</span><strong>{value}</strong></div>
      <span className="progress-track"><i style={{ width: value }} /></span>
    </div>
  )
}

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div className={`toast-alert ${toast.type || 'success'}`} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
          <BadgeCheck size={16} />
          <span>{toast.message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default AdminDashboard
