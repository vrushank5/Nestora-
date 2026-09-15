import { useEffect, useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function Bookings() {
  const [activeTab, setActiveTab] = useState('pending')
  const [bookings, setBookings] = useState([])
  useEffect(() => { apiRequest('/owner/bookings').then(response => setBookings(response.data || [])) }, [])

  const filteredBookings = activeTab === 'all' ? bookings : bookings.filter(b => b.status.toLowerCase() === activeTab)

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Bookings</h1>
          <p className="owner-subtitle">Manage incoming booking requests and agreements.</p>
        </div>
      </div>

      <div className="owner-tabs">
        {['All', 'Pending', 'Approved', 'Cancelled'].map(tab => (
          <button
            key={tab}
            className={`owner-tab-btn ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.toLowerCase())}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="owner-list-actions mt-4">
        <div className="owner-search-box">
          <Search size={16} />
          <input type="text" placeholder="Search bookings by ID or Name..." />
        </div>
        <button className="ghost-button compact-button"><Filter size={16} /> Filter</button>
      </div>

      <div className="owner-table-wrapper 3d-tilt-card mt-4">
        <table className="owner-data-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Resident</th>
              <th>Property / Room</th>
              <th>Move-in Date</th>
              <th>Amount (₹)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? filteredBookings.map(b => (
              <tr key={b.id}>
                <td><strong>{b.id}</strong></td>
                <td>{b.resident}</td>
                <td>{b.property} <br /><small className="muted-text">Room {b.room}</small></td>
                <td>{b.date}</td>
                <td>{b.amount}</td>
                <td>
                  <span className={`status-badge status-${b.status.toLowerCase()}`}>
                    {b.status}
                  </span>
                </td>
                <td>
                  {b.status === 'Pending' ? (
                    <div className="table-actions">
                      <button className="primary-button compact-button">Approve</button>
                      <button className="ghost-button compact-button danger-button">Reject</button>
                    </div>
                  ) : (
                    <button className="ghost-button compact-button">View</button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="text-center py-8 text-muted">No {activeTab} bookings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
