import { useEffect, useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function Bookings() {
  const [activeTab, setActiveTab] = useState('pending')
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const loadBookings = () => {
    setError('')
    apiRequest('/owner/bookings')
      .then(response => setBookings(response.data || []))
      .catch(err => setError(err.message || 'Unable to load bookings.'))
  }

  useEffect(() => { loadBookings() }, [])

  const updateBookingStatus = async (booking, status) => {
    const id = booking.bookingId || booking.id || booking._id
    setUpdatingId(id)
    setError('')
    try {
      const response = await apiRequest(`/owner/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setBookings(current => current.map(item =>
        (item.bookingId || item.id || item._id) === id ? response.data : item
      ))
    } catch (err) {
      setError(err.message || 'Unable to update booking.')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredBookings = activeTab === 'all' ? bookings : bookings.filter(b => b.status.toLowerCase() === activeTab)

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Bookings</h1>
          <p className="owner-subtitle">Manage incoming booking requests and agreements.</p>
        </div>
      </div>

      {error && <div className="owner-error-banner" role="alert">{error}</div>}

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
              <th>Amount ($)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? filteredBookings.map(b => {
              const bookingId = b.bookingId || b.id || b._id
              const status = b.status || 'Pending'
              const isUpdating = updatingId === bookingId
              return (
                <tr key={bookingId}>
                  <td><strong>{bookingId}</strong></td>
                  <td>{b.resident || b.residentName || 'Resident'}</td>
                  <td>{b.property || b.propertyName || 'Property'} <br /><small className="muted-text">Room {b.room || b.roomType || 'N/A'}</small></td>
                  <td>{b.date || b.moveInDate || '—'}</td>
                  <td>{b.amount ?? 0}</td>
                  <td>
                    <span className={`status-badge status-${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </td>
                  <td>
                    {status.toLowerCase() === 'pending' ? (
                      <div className="table-actions">
                        <button type="button" className="primary-button compact-button" disabled={isUpdating} onClick={() => updateBookingStatus(b, 'Approved')}>Approve</button>
                        <button type="button" className="ghost-button compact-button danger-button" disabled={isUpdating} onClick={() => updateBookingStatus(b, 'Cancelled')}>Reject</button>
                      </div>
                    ) : (
                      <button className="ghost-button compact-button">View</button>
                    )}
                  </td>
                </tr>
              )
            }) : (
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
