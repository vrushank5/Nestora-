import { useEffect, useState } from 'react'
import { Search, Filter, AlertTriangle } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  useEffect(() => { apiRequest('/owner/complaints').then(response => setComplaints(response.data || [])) }, [])
  const countByStatus = status => complaints.filter(complaint => complaint.status === status).length

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Complaints</h1>
          <p className="owner-subtitle">Resolve resident issues and track maintenance.</p>
        </div>
      </div>

      <div className="owner-stats-grid">
        <div className="owner-stat-card 3d-tilt-card alert-state">
          <div className="stat-icon"><AlertTriangle size={22} /></div>
          <div className="stat-details">
            <span className="stat-title">Pending</span>
            <div className="stat-value-row"><h3>{countByStatus('Pending')}</h3></div>
          </div>
        </div>
        <div className="owner-stat-card 3d-tilt-card" style={{ borderColor: 'rgba(229, 168, 67, 0.3)' }}>
          <div className="stat-icon" style={{ background: 'rgba(229, 168, 67, 0.1)', color: '#9b6817' }}><AlertTriangle size={22} /></div>
          <div className="stat-details">
            <span className="stat-title">In Progress</span>
            <div className="stat-value-row"><h3>{countByStatus('In Progress')}</h3></div>
          </div>
        </div>
        <div className="owner-stat-card 3d-tilt-card">
          <div className="stat-icon"><AlertTriangle size={22} /></div>
          <div className="stat-details">
            <span className="stat-title">Resolved</span>
            <div className="stat-value-row"><h3>{countByStatus('Resolved')}</h3></div>
          </div>
        </div>
      </div>

      <div className="owner-list-actions mt-4">
        <div className="owner-search-box">
          <Search size={16} />
          <input type="text" placeholder="Search complaints..." />
        </div>
        <button className="ghost-button compact-button"><Filter size={16} /> Filter</button>
      </div>

      <div className="owner-table-wrapper 3d-tilt-card mt-4">
        <table className="owner-data-table">
          <thead>
            <tr>
              <th>Complaint</th>
              <th>Resident / Room</th>
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
                <td>
                  <strong>{c.title}</strong><br />
                  <small className="muted-text">{c.id}</small>
                </td>
                <td>{c.resident} <br /><small className="muted-text">Room {c.room}</small></td>
                <td>{c.category}</td>
                <td>
                  <span className={`status-badge ${c.priority === 'High' ? 'status-available' : 'status-pending'}`}>
                    {c.priority}
                  </span>
                </td>
                <td>{c.date}</td>
                <td>
                  <span className={`status-badge status-${c.status.toLowerCase().replace(' ', '-')}`}>
                    {c.status}
                  </span>
                </td>
                <td>
                  {c.status === 'Pending' ? (
                    <button className="primary-button compact-button">Start Resolution</button>
                  ) : c.status === 'In Progress' ? (
                    <button className="ghost-button compact-button">Resolve</button>
                  ) : (
                    <span className="text-muted">Closed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
