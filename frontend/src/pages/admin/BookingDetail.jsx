import { useParams, Link } from 'react'
import { ChevronLeft, CheckCircle2, Clock, Download, QrCode } from 'lucide-react'

export default function BookingDetail() {
  const { id } = useParams()

  const booking = {
    id: id || 'BK-1001',
    resident: 'Riya Shah',
    owner: 'Owner Partner',
    property: 'Nestora Heights',
    room: '302 (Twin Sharing)',
    moveIn: '01 Sep 2026',
    stayDuration: '12 Months',
    amount: '₹8,500/mo',
    deposit: '₹17,000',
    payment: 'Paid via Razorpay UPI',
    status: 'Active',
    date: '25 Aug 2026',
  }

  return (
    <div className="admin-page" style={{ maxWidth: '900px' }}>
      <Link to="/admin/bookings" className="r-back-link"><ChevronLeft size={18} /> Back to Bookings</Link>

      <div className="admin-page-header">
        <div>
          <span className={`status-badge ${booking.status.toLowerCase()}`}>{booking.status}</span>
          <h1 className="admin-page-title">Booking ID: {booking.id}</h1>
          <p className="admin-page-subtitle">Reserved on {booking.date}</p>
        </div>
        <button className="ghost-button compact-button"><Download size={15} /> Download PDF Agreement</button>
      </div>

      <div className="admin-dashboard-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-pane">
            <h3 style={{ marginBottom: '16px' }}>Reservation Summary</h3>
            <div className="r-booking-details">
              <div><span>Resident</span><strong>{booking.resident}</strong></div>
              <div><span>Property Owner</span><strong>{booking.owner}</strong></div>
              <div><span>Property Name</span><strong>{booking.property}</strong></div>
              <div><span>Room Assigned</span><strong>{booking.room}</strong></div>
              <div><span>Move-In Date</span><strong>{booking.moveIn}</strong></div>
              <div><span>Duration</span><strong>{booking.stayDuration}</strong></div>
              <div><span>Monthly Rent</span><strong style={{ color: 'var(--jade)' }}>{booking.amount}</strong></div>
              <div><span>Security Deposit</span><strong>{booking.deposit}</strong></div>
              <div><span>Payment Details</span><strong>{booking.payment}</strong></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-pane" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '14px' }}>Verification QR</h3>
            <QrCode size={90} style={{ margin: '0 auto' }} />
            <p className="muted-copy" style={{ fontSize: '0.8rem', marginTop: '8px' }}>Property Check-in Pass</p>
          </div>
        </div>
      </div>
    </div>
  )
}
