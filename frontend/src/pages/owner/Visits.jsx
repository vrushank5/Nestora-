import { useEffect, useState } from 'react'
import { CalendarDays, Search, Filter } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function Visits() {
  const [visits, setVisits] = useState([])
  useEffect(() => { apiRequest('/owner/visits').then(response => setVisits(response.data || [])) }, [])

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Property Visits</h1>
          <p className="owner-subtitle">Manage upcoming site visits from prospective residents.</p>
        </div>
      </div>

      <div className="owner-list-actions mt-4">
        <div className="owner-search-box">
          <Search size={16} />
          <input type="text" placeholder="Search visits..." />
        </div>
        <button className="ghost-button compact-button"><Filter size={16} /> Filter</button>
      </div>

      <div className="owner-table-wrapper 3d-tilt-card mt-4">
        <table className="owner-data-table">
          <thead>
            <tr>
              <th>Visitor Name</th>
              <th>Property</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visits.map(v => (
              <tr key={v.id}>
                <td><strong>{v.resident}</strong></td>
                <td>{v.property}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-muted" /> {v.date}
                  </div>
                </td>
                <td>{v.time}</td>
                <td>
                  <span className={`status-badge status-${v.status.toLowerCase()}`}>
                    {v.status}
                  </span>
                </td>
                <td>
                  {v.status === 'Pending' ? (
                    <div className="table-actions">
                      <button className="primary-button compact-button">Accept</button>
                      <button className="ghost-button compact-button danger-button">Reject</button>
                    </div>
                  ) : v.status === 'Scheduled' ? (
                    <button className="ghost-button compact-button">Mark Completed</button>
                  ) : (
                    <span className="text-muted">No actions</span>
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
