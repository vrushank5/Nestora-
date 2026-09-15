import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BookOpen, MapPin, Download, X } from 'lucide-react'
import { residences } from '../../data/homeData.js'
import { apiRequest } from '../../services/api.js'

const TABS = ['All', 'Upcoming', 'Active', 'Completed', 'Cancelled']

export default function Bookings() {
  const [tab, setTab] = useState('All')
  const [bookings, setBookings] = useState([])
  useEffect(() => { apiRequest('/resident/bookings').then(response => setBookings(response.data || [])) }, [])

  const filtered = tab === 'All' ? bookings : bookings.filter(b => b.status.toLowerCase() === tab.toLowerCase())

  const cancel = (id) => {
    const next = bookings.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b)
    setBookings(next)
  }

  const getImg = (name) => residences.find(r => r.name === name)?.image || residences[0].image

  return (
    <div className="r-page">
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">My Bookings</h1>
          <p className="r-page-subtitle">Manage your booking requests and stay history.</p>
        </div>
        <Link to="/resident/explore" className="primary-button"><BookOpen size={16} /> Find a PG</Link>
      </div>

      <div className="owner-tabs">
        {TABS.map(t => (
          <button key={t} className={`owner-tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={42} />
          <h3>No {tab.toLowerCase()} bookings</h3>
          <p>Explore properties and create your first booking.</p>
          <Link to="/resident/explore" className="primary-button compact-button">Explore PGs</Link>
        </div>
      ) : (
        <div className="booking-list">
          {filtered.map(b => (
            <motion.article key={b.id} className="booking-item-card" whileHover={{ x: 2 }}>
              <img src={getImg(b.propertyName)} alt={b.propertyName} />
              <div className="booking-item-content">
                <div className="booking-item-title-row">
                  <div>
                    <h4>{b.propertyName}</h4>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <span className={`status-badge ${b.status.toLowerCase()}`}>{b.status}</span>
                      <span className={`status-badge ${b.payment === 'Paid' ? 'active' : 'pending'}`}>{b.payment || 'Pending'}</span>
                    </div>
                  </div>
                  <strong>{b.price}</strong>
                </div>
                <div className="booking-item-details">
                  <span><MapPin size={13} /> Ahmedabad</span>
                  <span>Booking ID: {b.id}</span>
                  <span>{b.checkIn} → {b.checkOut}</span>
                </div>
                <div className="table-actions">
                  <Link to={`/resident/bookings/${b.id}`} className="ghost-button compact-button">View Details</Link>
                  {b.payment !== 'Paid' && b.status !== 'Cancelled' && (
                    <Link to="/resident/payments" className="primary-button compact-button">Pay Now</Link>
                  )}
                  <button className="ghost-button compact-button"><Download size={14} /> Receipt</button>
                  {b.status === 'Upcoming' && (
                    <button className="ghost-button compact-button danger-button" onClick={() => cancel(b.id)}>
                      <X size={14} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  )
}
