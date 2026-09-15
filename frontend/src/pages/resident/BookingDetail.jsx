import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, CheckCircle2, Clock, Download, QrCode } from 'lucide-react'
import { residences } from '../../data/homeData.js'
import { apiRequest } from '../../services/api.js'

const timelineSteps = [
  { label: 'Booking Requested', done: true },
  { label: 'Booking Approved', done: true },
  { label: 'Payment Completed', done: false },
  { label: 'Move-in Scheduled', done: false },
  { label: 'Stay Active', done: false },
]

export default function BookingDetail() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  useEffect(() => { apiRequest('/resident/bookings').then(response => setBooking((response.data || []).find(item => String(item.id || item.bookingId) === String(id)))) }, [id])
  if (!booking) return <div className="r-page"><Link to="/resident/bookings" className="r-back-link">← Back to Bookings</Link><div className="empty-state"><h3>Booking not found</h3><p>This booking is not available in your account.</p></div></div>
  const property = residences.find(r => r.name === booking.propertyName) || residences[0]

  return (
    <div className="r-page" style={{ maxWidth: '900px' }}>
      <Link to="/resident/bookings" className="r-back-link">← Back to Bookings</Link>
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">Booking Details</h1>
          <p className="r-page-subtitle">Booking ID: <strong>{booking.id}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="ghost-button compact-button"><Download size={16} /> Download Receipt</button>
        </div>
      </div>

      <div className="r-detail-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Property Card */}
          <div className="r-pane">
            <h3 style={{ marginBottom: '16px' }}>Property Details</h3>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img src={property.image} alt={property.name} style={{ width: '100px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
              <div>
                <h4>{property.name}</h4>
                <p className="muted-copy"><MapPin size={13} /> {property.location}</p>
                <p className="muted-copy">Room: {booking.room || 'Twin Sharing'}</p>
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="r-pane">
            <h3 style={{ marginBottom: '16px' }}>Booking Summary</h3>
            <div className="r-booking-details">
              <div><span>Move-in Date</span><strong>{booking.checkIn}</strong></div>
              <div><span>Stay Until</span><strong>{booking.checkOut}</strong></div>
              <div><span>Monthly Rent</span><strong>{booking.price}</strong></div>
              <div><span>Security Deposit</span><strong>₹17,000</strong></div>
              <div><span>Booking Status</span><span className={`status-badge ${booking.status?.toLowerCase()}`}>{booking.status}</span></div>
              <div><span>Payment Status</span><span className={`status-badge ${booking.payment === 'Paid' ? 'active' : 'pending'}`}>{booking.payment || 'Pending'}</span></div>
            </div>
          </div>

          {/* Timeline */}
          <div className="r-pane">
            <h3 style={{ marginBottom: '20px' }}>Booking Timeline</h3>
            <div className="r-timeline">
              {timelineSteps.map((step, i) => (
                <div key={i} className={`r-timeline-step ${step.done ? 'done' : ''}`}>
                  <div className="r-timeline-dot">
                    {step.done ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  </div>
                  {i < timelineSteps.length - 1 && <div className={`r-timeline-line ${step.done ? 'done' : ''}`} />}
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* QR / Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="r-pane" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '16px' }}>Booking QR Code</h3>
            <div className="r-qr-placeholder">
              <QrCode size={80} />
              <p className="muted-copy" style={{ fontSize: '0.8rem', marginTop: '8px' }}>Show at property entrance</p>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '12px', fontWeight: 700 }}>{booking.id}</p>
          </div>
          <div className="r-pane">
            <h3 style={{ marginBottom: '12px' }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/resident/payments" className="primary-button">Pay Rent</Link>
              <Link to="/resident/messages" className="ghost-button">Contact Owner</Link>
              <Link to="/resident/visits" className="ghost-button">Schedule Visit</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
