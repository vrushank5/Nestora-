import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, UserX, UserCheck, Shield, Trash2, Eye, Download, X, AlertCircle } from 'lucide-react'
import { getToken } from '../../context/authStorage.js'

export default function Users() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmModal, setConfirmModal] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(response => { if (!response.ok) throw new Error('Unable to load users'); return response.json() })
      .then(result => setUsers(result.data || []))
      .catch(error => console.error(error))
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase()
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q) || u.id.toLowerCase().includes(q)
      const matchRole = roleFilter === 'All' || u.role === roleFilter
      const matchStatus = statusFilter === 'All' || u.status === statusFilter
      return matchSearch && matchRole && matchStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) setSelectedIds([])
    else setSelectedIds(filteredUsers.map(u => u.id))
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleAction = (user, action) => {
    setConfirmModal({ user, action })
  }

  const executeAction = () => {
    if (!confirmModal) return
    const { user, action } = confirmModal
    if (action === 'suspend') {
      setUsers(users.map(u => u.id === user.id ? { ...u, status: u.status === 'Suspended' ? 'Active' : 'Suspended' } : u))
    } else if (action === 'delete') {
      setUsers(users.filter(u => u.id !== user.id))
    }
    setConfirmModal(null)
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">Monitor and manage all residents, owners, and administrators.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="ghost-button compact-button" onClick={() => alert('Exporting user CSV report...')}>
            <Download size={15} /> Export Users CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-field">
          <Search size={16} />
          <input
            placeholder="Search by name, email, phone or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
        <div className="admin-filter-controls">
          <div className="filter-item">
            <label>Role</label>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option>All</option><option>Resident</option><option>Owner</option><option>Admin</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All</option><option>Active</option><option>Pending Verification</option><option>Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="admin-bulk-bar">
          <span>{selectedIds.length} users selected</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="ghost-button compact-button danger-button" onClick={() => setUsers(users.filter(u => !selectedIds.includes(u.id)))}>
              <Trash2 size={14} /> Bulk Delete
            </button>
            <button className="ghost-button compact-button" onClick={() => setSelectedIds([])}>Clear Selection</button>
          </div>
        </div>
      )}

      {/* Users Data Table */}
      <div className="owner-table-wrapper">
        <table className="owner-data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>User</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Verification</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted">
                  No users found matching current filters.
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(u.id)}
                      onChange={() => toggleSelect(u.id)}
                    />
                  </td>
                  <td>
                    <div className="resident-cell">
                      <div className="admin-avatar-sm">{u.name.charAt(0)}</div>
                      <div>
                        <strong>{u.name}</strong>
                        <small className="muted-copy" style={{ display: 'block' }}>{u.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-role-pill ${u.role.toLowerCase()}`}>{u.role}</span>
                  </td>
                  <td>{u.phone}</td>
                  <td>
                    {u.verified ? (
                      <span className="status-badge active"><Shield size={12} /> Verified</span>
                    ) : (
                      <span className="status-badge pending">Pending</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${u.status === 'Active' ? 'active' : u.status === 'Suspended' ? 'status-available' : 'pending'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>{u.joined}</td>
                  <td>
                    <div className="table-actions">
                      <button className="r-icon-btn" title="View Profile" onClick={() => navigate(`/admin/users/${u.id}`)}>
                        <Eye size={15} />
                      </button>
                      <button
                        className="r-icon-btn"
                        title={u.status === 'Suspended' ? 'Activate' : 'Suspend'}
                        onClick={() => handleAction(u, 'suspend')}
                      >
                        {u.status === 'Suspended' ? <UserCheck size={15} color="var(--jade)" /> : <UserX size={15} color="var(--terracotta)" />}
                      </button>
                      <button className="r-icon-btn" title="Delete User" onClick={() => handleAction(u, 'delete')}>
                        <Trash2 size={15} color="var(--terracotta)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmModal(null)}>
            <motion.div className="modal-content" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <button className="close-modal-btn" onClick={() => setConfirmModal(null)}><X size={18} /></button>
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <AlertCircle size={44} color="var(--terracotta)" style={{ margin: '0 auto 12px' }} />
                <h3>Confirm {confirmModal.action === 'suspend' ? 'Status Change' : 'User Deletion'}</h3>
                <p className="muted-copy" style={{ marginTop: '8px' }}>
                  Are you sure you want to {confirmModal.action} <strong>{confirmModal.user.name}</strong> ({confirmModal.user.email})?
                </p>
              </div>
              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button className="ghost-button compact-button" onClick={() => setConfirmModal(null)}>Cancel</button>
                <button className="primary-button compact-button danger-button" onClick={executeAction}>Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
