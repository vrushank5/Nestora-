import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock, CheckCircle2, AlertCircle, Eye, X, Check } from 'lucide-react'
import { getToken } from '../../context/authStorage.js'

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [selected, setSelected] = useState(null)
  useEffect(() => { fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(response => response.json()).then(result => setComplaints(result.data || [])) }, [])

  const stats = [
    { label: 'TOTAL COMPLAINTS', value: complaints.length, icon: AlertTriangle, color: 'var(--steel)' },
    { label: 'PENDING', value: complaints.filter(c => c.status === 'Pending').length, icon: AlertCircle, color: 'var(--terracotta)' },
    { label: 'IN PROGRESS', value: complaints.filter(c => c.status === 'In Progress').length, icon: Clock, color: '#9b6817' },
    { label: 'RESOLVED', value: complaints.filter(c => c.status === 'Resolved').length, icon: CheckCircle2, color: 'var(--jade)' },
  ]

  const updateStatus = (id, status) => {
    setComplaints(complaints.map(c => c.id === id ? { ...c, status } : c))
    setSelected(null)
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Complaint Moderation</h1>
          <p className="admin-page-subtitle">Track, escalate, and resolve resident complaints across properties.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        {stats.map(s => (
          <div key={s.label} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'var(--paper-2)', color: s.color }}><s.icon size={20} /></div>
            <div>
              <span className="admin-stat-label">{s.label}</span>
              <h3 className="admin-stat-val">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="owner-table-wrapper">
        <table className="owner-data-table">
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Resident</th>
              <th>Property</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map(c => (
              <tr key={c.id}>
                <td><strong>{c.id}</strong></td>
                <td>{c.resident}</td>
                <td>{c.property}</td>
                <td><span className="r-amenity-tag">{c.category}</span></td>
                <td>
                  <span className={`status-badge ${c.priority === 'High' ? 'status-available' : 'pending'}`}>
                    {c.priority}
                  </span>
                </td>
                <td>{c.date}</td>
                <td>
                  <span className={`status-badge ${c.status === 'Resolved' ? 'active' : c.status === 'In Progress' ? 'upcoming' : 'pending'}`}>
                    {c.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="r-icon-btn" title="View & Resolve" onClick={() => setSelected(c)}>
                      <Eye size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail & Resolve Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div className="modal-content" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
              <button className="close-modal-btn" onClick={() => setSelected(null)}><X size={18} /></button>
              <h2>Complaint Audit: {selected.id}</h2>
              <p className="muted-copy">{selected.property} · Room {selected.room}</p>

              <div className="r-booking-details" style={{ marginTop: '16px' }}>
                <div><span>Resident</span><strong>{selected.resident}</strong></div>
                <div><span>Category</span><strong>{selected.category}</strong></div>
                <div><span>Priority</span><span className={`status-badge ${selected.priority === 'High' ? 'status-available' : 'pending'}`}>{selected.priority}</span></div>
                <div><span>Status</span><span className={`status-badge ${selected.status === 'Resolved' ? 'active' : 'pending'}`}>{selected.status}</span></div>
              </div>

              <div style={{ marginTop: '16px', padding: '14px', background: 'var(--paper-2)', borderRadius: 'var(--radius)' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>DESCRIPTION</strong>
                <p style={{ marginTop: '6px', color: 'var(--ink)' }}>{selected.desc}</p>
              </div>

              <div className="form-actions" style={{ marginTop: '20px', justifyContent: 'space-between' }}>
                <button className="ghost-button compact-button" onClick={() => updateStatus(selected.id, 'In Progress')}>
                  Mark In Progress
                </button>
                <button className="primary-button compact-button" onClick={() => updateStatus(selected.id, 'Resolved')}>
                  <Check size={14} /> Resolve Complaint
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
