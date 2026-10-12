import { useEffect, useState } from 'react'
import { Search, Filter, MoreVertical, CheckCircle2, Clock } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function Residents() {
  const [residents, setResidents] = useState([])
  useEffect(() => { apiRequest('/owner/residents').then(response => setResidents(response.data || [])) }, [])

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Residents</h1>
          <p className="owner-subtitle">Manage your tenants and their occupancy.</p>
        </div>
      </div>

      <div className="owner-list-actions">
        <div className="owner-search-box">
          <Search size={16} />
          <input type="text" placeholder="Search residents..." />
        </div>
        <button className="ghost-button compact-button"><Filter size={16} /> Filter</button>
      </div>

      <div className="owner-table-wrapper 3d-tilt-card">
        <table className="owner-data-table">
          <thead>
            <tr>
              <th>Resident</th>
              <th>Property / Room</th>
              <th>Move-in Date</th>
              <th>Rent ($)</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {residents.map(res => (
              <tr key={res.id}>
                <td>
                  <div className="resident-cell">
                    <div className="owner-avatar sm">{res.name.charAt(0)}</div>
                    <strong>{res.name}</strong>
                  </div>
                </td>
                <td>
                  <span>{res.property}</span><br />
                  <small className="muted-text">Room {res.room}</small>
                </td>
                <td>{res.moveIn}</td>
                <td>{res.rent}</td>
                <td>
                  <span className={`status-badge payment-${res.payment.toLowerCase()}`}>
                    {res.payment === 'Paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />} {res.payment}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${res.status.toLowerCase()}`}>
                    {res.status}
                  </span>
                </td>
                <td>
                  <button className="icon-btn"><MoreVertical size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
