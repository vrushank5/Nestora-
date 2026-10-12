import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen, MapPin, Download, X, CheckCircle2, Clock, CreditCard,
  AlertTriangle, ArrowUpRight, Search, Eye, ShieldCheck, Printer, Check
} from 'lucide-react'
import { apiRequest, getImageUrl } from '../../services/api.js'
import { propertyService } from '../../services/propertyService.js'
import PaymentModal from './components/PaymentModal.jsx'

const TABS = ['All', 'Pending', 'Approved', 'Active', 'Completed', 'Cancelled']

export default function Bookings() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [bookings, setBookings] = useState([])
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [toastMsg, setToastMsg] = useState('')

  // Payment Modal State
  const [payingBooking, setPayingBooking] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('UPI (Google Pay)')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  // Load Bookings and Properties
  const loadData = () => {
    setIsLoading(true)
    setFetchError(null)

    Promise.all([
      apiRequest('/resident/bookings').then(res => res.data || []).catch(() => []),
      propertyService.getAllProperties().catch(() => [])
    ])
      .then(([bookingsData, propsData]) => {
        setBookings(bookingsData)
        setProperties(propsData)
      })
      .catch(err => {
        console.error('Bookings load error:', err)
        setFetchError('Could not load bookings from server.')
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Helper to get property image
  const getPropertyImg = (booking) => {
    const matched = properties.find(
      p => (booking.propertyId && (p.propertyId === booking.propertyId || p.id === booking.propertyId)) ||
        (booking.property && p.name?.toLowerCase() === booking.property?.toLowerCase()) ||
        (booking.propertyName && p.name?.toLowerCase() === booking.propertyName?.toLowerCase())
    )
    if (matched && matched.images?.length > 0) {
      return getImageUrl(matched.images[0])
    }
    return matched?.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
  }

  // Filtering
  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const bStatus = (b.status || 'Pending').toLowerCase()
      const matchTab = tab === 'All' || bStatus === tab.toLowerCase()
      const q = search.toLowerCase().trim()

      const bId = String(b.bookingId || b.id || '').toLowerCase()
      const propName = String(b.property || b.propertyName || '').toLowerCase()
      const roomStr = String(b.room || b.roomType || '').toLowerCase()

      const matchSearch = !q || bId.includes(q) || propName.includes(q) || roomStr.includes(q)
      return matchTab && matchSearch
    })
  }, [bookings, tab, search])

  // Summary Metrics
  const stats = useMemo(() => {
    const total = bookings.length
    const active = bookings.filter(b => ['active', 'approved'].includes((b.status || '').toLowerCase())).length
    const pending = bookings.filter(b => (b.status || '').toLowerCase() === 'pending').length
    const paidRevenue = bookings
      .filter(b => (b.payment || '').toLowerCase() === 'paid')
      .reduce((sum, b) => sum + Number(b.amount || 0), 0)

    return { total, active, pending, paidRevenue }
  }, [bookings])

  // Cancel Booking
  const handleCancelBooking = async (bId) => {
    if (!window.confirm(`Are you sure you want to cancel booking #${bId}?`)) return

    setCancellingId(bId)
    try {
      await apiRequest(`/resident/bookings/${bId}/cancel`, { method: 'PATCH' })
      setBookings(prev =>
        prev.map(b => (b.bookingId === bId || b.id === bId ? { ...b, status: 'Cancelled', payment: b.payment === 'Paid' ? 'Refunded' : b.payment } : b))
      )
      showToast(`Booking #${bId} has been cancelled.`)
    } catch (err) {
      console.error('Cancel booking error:', err)
      showToast(err.message || 'Failed to cancel booking.')
    } finally {
      setCancellingId(null)
    }
  }

  // Process Instant Payment
  const handleProcessPayment = async () => {
    if (!payingBooking) return
    setIsProcessingPayment(true)

    const bId = payingBooking.bookingId || payingBooking.id
    const amountVal = Number(payingBooking.amount || 9000)
    const propName = payingBooking.property || payingBooking.propertyName || 'Nestora Property'

    try {
      await apiRequest('/resident/payments', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: bId,
          propertyId: payingBooking.propertyId,
          propertyName: propName,
          amount: amountVal,
          method: paymentMethod,
        })
      })

      // Update local bookings state
      setBookings(prev =>
        prev.map(b =>
          (b.bookingId === bId || b.id === bId)
            ? { ...b, payment: 'Paid', status: 'Active' }
            : b
        )
      )

      showToast(`Payment of $${Number(amountVal).toLocaleString('en-US')} successful for Booking #${bId}! 🎉`)
      setPayingBooking(null)
    } catch (err) {
      console.error('Payment processing failed:', err)
      showToast(err.message || 'Payment processing failed. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Print Official Receipt
  const printBookingReceipt = (b) => {
    const printWindow = window.open('', '_blank', 'height=750,width=850')
    if (!printWindow) return alert('Please allow popups to view receipt.')

    const bId = b.bookingId || b.id
    const propName = b.property || b.propertyName || 'Nestora Property'
    const rentAmount = Number(b.amount || 0).toLocaleString('en-US')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reservation Receipt - ${bId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #111827; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 800; color: #064e3b; }
          .receipt-title { font-size: 20px; font-weight: 700; text-align: right; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th { background: #f3f4f6; text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .total { text-align: right; margin-top: 20px; font-size: 16px; font-weight: 800; color: #10b981; }
          .no-print { margin-bottom: 20px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()" style="background:#10b981;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-weight:bold;cursor:pointer;">
            Print / Save Receipt PDF
          </button>
        </div>
        <div class="header">
          <div>
            <div class="logo">NESTORA CO-LIVING</div>
            <p style="margin:4px 0 0 0;font-size:12px;color:#6b7280;">Official Tenancy &amp; Lease Confirmation</p>
          </div>
          <div class="receipt-title">
            BOOKING CONFIRMATION
            <div style="font-size:12px;font-weight:normal;color:#6b7280;margin-top:4px;">Booking ID: ${bId}</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <strong>RESIDENT &amp; PROPERTY:</strong><br />
            Property: ${propName}<br />
            Room: ${b.room || 'Standard Sharing Room'}<br />
            Resident: ${b.resident || 'Nestora Resident'}
          </div>
          <div>
            <strong>RESERVATION DETAILS:</strong><br />
            Move-in Date: ${b.date || 'Scheduled'}<br />
            Payment Status: <span style="color:#059669;font-weight:bold;">${b.payment || 'Paid'}</span><br />
            Tenancy Status: <span style="font-weight:bold;">${b.status || 'Active'}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr><th>Description</th><th>Period</th><th>Amount (USD)</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Accommodation Lease Reservation (${propName})</td>
              <td>1 Month</td>
              <td>$${rentAmount}</td>
            </tr>
          </tbody>
        </table>

        <div class="total">
          TOTAL AMOUNT: $${rentAmount}
        </div>

        <div style="margin-top:40px;font-size:12px;color:#9ca3af;text-align:center;">
          Thank you for choosing Nestora Co-Living - Official System Generated Voucher
        </div>
      </body>
      </html>
    `
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <div className="r-page">
      {/* V8 Page Header */}
      <div className="r-page-header">
        <div>
          <span className="r-v8-kicker">
            <BookOpen size={14} /> RESIDENT LEASE &amp; RESERVATION HUB V8
          </span>
          <h1 className="r-page-title" style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px' }}>
            My Bookings &amp; Leases
          </h1>
          <p className="r-page-subtitle">Track your room reservations, verify lease documents, and settle pending payments.</p>
        </div>
        <Link to="/resident/explore" className="primary-button compact-button" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={15} /> Find New PG
        </Link>
      </div>

      {/* Toast Banner */}
      {toastMsg && (
        <div className="r-v8-toast">
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* V8 KPI Metric Cards */}
      <div className="r-v8-kpis" style={{ marginBottom: '1.25rem' }}>
        <div className="r-v8-kpi-card" style={{ borderTop: '3px solid #3b82f6' }}>
          <div className="r-v8-kpi-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <span className="r-v8-kpi-label">TOTAL BOOKINGS</span>
            <div className="r-v8-kpi-val">{stats.total}</div>
          </div>
        </div>

        <div className="r-v8-kpi-card" style={{ borderTop: '3px solid #10b981' }}>
          <div className="r-v8-kpi-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="r-v8-kpi-label">ACTIVE LEASES</span>
            <div className="r-v8-kpi-val" style={{ color: '#10b981' }}>{stats.active}</div>
          </div>
        </div>

        <div className="r-v8-kpi-card" style={{ borderTop: '3px solid #f59e0b' }}>
          <div className="r-v8-kpi-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
            <Clock size={20} />
          </div>
          <div>
            <span className="r-v8-kpi-label">PENDING APPROVALS</span>
            <div className="r-v8-kpi-val" style={{ color: '#d97706' }}>{stats.pending}</div>
          </div>
        </div>

        <div className="r-v8-kpi-card" style={{ borderTop: '3px solid #8b5cf6' }}>
          <div className="r-v8-kpi-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <span className="r-v8-kpi-label">SETTLED LEASE VALUE</span>
            <div className="r-v8-kpi-val" style={{ color: '#8b5cf6' }}>
              ${stats.paidRevenue.toLocaleString('en-US')}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="owner-tabs" style={{ marginBottom: '1rem' }}>
        {TABS.map(t => {
          const count = t === 'All'
            ? bookings.length
            : bookings.filter(b => (b.status || '').toLowerCase() === t.toLowerCase()).length

          return (
            <button
              key={t}
              className={`owner-tab-btn ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t} ({count})
            </button>
          )
        })}
      </div>

      {/* Search Filter Bar */}
      <div className="admin-filter-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="admin-search-field">
          <Search size={16} />
          <input
            placeholder="Search by booking ID, property name or room..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          Loading your bookings...
        </div>
      )}

      {fetchError && !isLoading && (
        <div className="owner-error-banner" style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> {fetchError}
        </div>
      )}

      {/* Bookings List */}
      {!isLoading && (
        filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '3.5rem 1rem' }}>
            <BookOpen size={48} color="var(--jade)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No {tab.toLowerCase()} bookings found</h3>
            <p className="muted-copy" style={{ marginBottom: '18px' }}>
              {bookings.length === 0
                ? "You haven't reserved any co-living rooms yet. Explore our verified listings!"
                : "No booking reservations match your active filter."}
            </p>
            <Link to="/resident/explore" className="primary-button compact-button">
              Explore Available PGs
            </Link>
          </div>
        ) : (
          <div className="booking-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filtered.map(b => {
              const bId = b.bookingId || b.id
              const propName = b.property || b.propertyName || 'Nestora Heights'
              const roomType = b.room || b.roomType || 'Standard Sharing Room'
              const statusStr = (b.status || 'Pending').toLowerCase()
              const paymentStr = (b.payment || 'Pending').toLowerCase()
              const amountVal = Number(b.amount || 0).toLocaleString('en-US')
              const isCancelling = cancellingId === bId

              return (
                <motion.article
                  key={bId}
                  className="booking-item-card"
                  whileHover={{ y: -2 }}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: '14px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    background: 'var(--white)',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={getPropertyImg(b)}
                    alt={propName}
                    style={{ width: '150px', height: '120px', objectFit: 'cover' }}
                  />
                  <div className="booking-item-content" style={{ flex: 1, padding: '16px' }}>
                    <div className="booking-item-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{propName}</h4>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700 }}>#{bId}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <span className={`status-badge ${statusStr === 'active' || statusStr === 'approved' ? 'active' : statusStr === 'cancelled' ? 'status-available' : 'pending'}`}>
                            {b.status || 'Pending'}
                          </span>
                          <span className={`status-badge ${paymentStr === 'paid' ? 'active' : paymentStr === 'refunded' ? 'status-available' : 'pending'}`}>
                            {paymentStr === 'paid' ? 'Paid' : paymentStr === 'refunded' ? 'Refunded' : 'Payment Pending'}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--jade)' }}>
                          ${amountVal}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>/ month</span>
                      </div>
                    </div>

                    <div className="booking-item-details" style={{ display: 'flex', gap: '16px', margin: '10px 0', fontSize: '0.85rem', color: '#4b5563' }}>
                      <span><MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} /> Move-in: <strong>{b.date || 'Immediate'}</strong></span>
                      <span>Room: <strong>{roomType}</strong></span>
                      <span>Resident: <strong>{b.resident || 'Self'}</strong></span>
                    </div>

                    <div className="table-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                      <Link to={`/resident/bookings/${bId}`} className="ghost-button compact-button" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={14} /> View Details
                      </Link>

                      {paymentStr !== 'paid' && ['approved', 'active'].includes(statusStr) && (
                        <button
                          className="primary-button compact-button"
                          onClick={() => setPayingBooking(b)}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--jade)' }}
                        >
                          <CreditCard size={14} /> Pay Rent Now
                        </button>
                      )}

                      <button
                        className="ghost-button compact-button"
                        onClick={() => printBookingReceipt(b)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Printer size={14} /> Receipt
                      </button>

                      {statusStr !== 'cancelled' && statusStr !== 'completed' && (
                        <button
                          className="ghost-button compact-button danger-button"
                          disabled={isCancelling}
                          onClick={() => handleCancelBooking(bId)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: isCancelling ? 0.6 : 1 }}
                        >
                          <X size={14} /> {isCancelling ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )
      )}

      {/* V8 Professional Payment Checkout Modal (PayPal, Cards, Netbanking, COD) */}
      <PaymentModal
        isOpen={Boolean(payingBooking)}
        onClose={() => setPayingBooking(null)}
        booking={payingBooking}
        onSuccess={async (paymentPayload) => {
          const res = paymentPayload.alreadyCaptured
            ? { message: paymentPayload.message || 'Payment confirmed successfully!' }
            : await apiRequest('/resident/payments', {
              method: 'POST',
              body: JSON.stringify(paymentPayload),
            })
          const isCod = paymentPayload.isCod
          const bId = paymentPayload.bookingId
          setBookings(prev =>
            prev.map(b =>
              (b.bookingId === bId || b.id === bId)
                ? { ...b, payment: isCod ? 'Pending' : 'Paid', status: isCod ? 'Approved' : 'Active' }
                : b
            )
          )
          showToast(res.message || 'Payment confirmed successfully! 🎉')
        }}
      />
    </div>
  )
}
