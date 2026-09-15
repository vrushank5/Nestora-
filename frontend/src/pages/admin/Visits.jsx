import { useState, useEffect } from 'react'
import { Search, CalendarDays } from 'lucide-react'
import { getToken } from '../../context/authStorage.js'

export default function Visits() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [visits, setVisits] = useState([])
  useEffect(() => { fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/visits`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(response => response.json()).then(result => setVisits(result.data || [])) }, [])

  const filtered = visits.filter(v => {
    const matchStatus = statusFilter === 'All' || v.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q || v.resident.toLowerCase().includes(q) || v.property.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Property Visit Audit</h1>
          <p className="admin-page-subtitle">Monitor scheduled in-person site visits requested by prospective residents.</p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search-field">
          <Search size={16} />
          <input placeholder="Search resident or property..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="admin-filter-controls">
          <div className="filter-item">
            <label>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All</option><option>Requested</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="owner-table-wrapper">
        <table className="owner-data-table">
          <thead>
            <tr>
              <th>Visit ID</th>
              <th>Resident</th>
              <th>Property</th>
              <th>Owner Partner</th>
              <th>Scheduled Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id}>
                <td><strong>{v.id}</strong></td>
                <td>{v.resident}</td>
                <td>{v.property}</td>
                <td>{v.owner}</td>
                <td><CalendarDays size={13} /> {v.date}</td>
                <td>{v.time}</td>
                <td>
                  <span className={`status-badge ${v.status === 'Confirmed' || v.status === 'Completed' ? 'active' : v.status === 'Cancelled' ? 'status-available' : 'pending'}`}>
                    {v.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
