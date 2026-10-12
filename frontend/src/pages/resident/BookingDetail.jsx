import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, CheckCircle2, Clock, Download, QrCode, CreditCard,
  ChevronLeft, Printer, ShieldCheck, X, AlertTriangle, Phone, Bed
} from 'lucide-react'
import { apiRequest, getImageUrl } from '../../services/api.js'
import { propertyService } from '../../services/propertyService.js'
import PaymentModal from './components/PaymentModal.jsx'

export default function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [property, setProperty] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toastMsg, setToastMsg] = useState('')

  // Payment Modal
  const [showPayModal, setShowPayModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('UPI (Google Pay)')
  const [isProcessing, setIsProcessing] = useState(false)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  useEffect(() => {
    let active = true
    setIsLoading(true)

    apiRequest('/resident/bookings')
      .then(async (response) => {
        if (!active) return
        const list = response.data || []
        const matched = list.find(b => String(b.bookingId || b.id || b._id) === String(id))

        if (matched) {
          setBooking(matched)

          // Try to load property details
          try {
            const props = await propertyService.getAllProperties()
            const p = props.find(
              item => (matched.propertyId && (item.propertyId === matched.propertyId || item.id === matched.propertyId)) ||
                (matched.property && item.name?.toLowerCase() === matched.property?.toLowerCase())
            )
            if (active && p) setProperty(p)
          } catch {
            // silent fallback
          }
        }
      })
      .catch(err => {
        console.error('Failed to load booking:', err)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [id])

  // Handle Pay Now
  const handleProcessPayment = async () => {
    if (!booking) return
    setIsProcessing(true)

    const bId = booking.bookingId || booking.id
    const amountVal = Number(booking.amount || 9000)
    const propName = booking.property || booking.propertyName || 'Nestora Property'

    try {
      await apiRequest('/resident/payments', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: bId,
          propertyId: booking.propertyId,
          propertyName: propName,
          amount: amountVal,
          method: paymentMethod,
        })
      })

      setBooking(prev => ({ ...prev, payment: 'Paid', status: 'Active' }))
      setShowPayModal(false)
      showToast(`Payment of $${Number(amountVal).toLocaleString('en-US')} confirmed! Your stay is now Active. 🎉`)
    } catch (err) {
      console.error('Payment error:', err)
      showToast(err.message || 'Payment processing failed.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Print Official Receipt
  const printReceipt = () => {
    if (!booking) return
    const printWindow = window.open('', '_blank', 'height=750,width=850')
    if (!printWindow) return alert('Please allow popups.')

    const bId = booking.bookingId || booking.id
    const propName = booking.property || booking.propertyName || property?.name || 'Nestora Property'
    const rentVal = Number(booking.amount || 0).toLocaleString('en-US')
    const depositAmount = booking.securityDeposit ?? property?.securityDeposit
    const depositVal = depositAmount == null ? 'Not specified' : `$${Number(depositAmount).toLocaleString('en-US')}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reservation Dossier - ${bId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #111827; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 800; color: #064e3b; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th { background: #f3f4f6; text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .total { text-align: right; margin-top: 20px; font-size: 16px; font-weight: 800; color: #10b981; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom:20px;">
          <button onclick="window.print()" style="background:#10b981;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-weight:bold;cursor:pointer;">
            Print / Save Receipt PDF
          </button>
        </div>
        <div class="header">
          <div>
            <div class="logo">NESTORA CO-LIVING</div>
            <p style="margin:4px 0 0 0;font-size:12px;color:#6b7280;">Official Tenancy Voucher &amp; Digital Lease Pass</p>
          </div>
          <div style="text-align:right;">
            <div style="font-size:18px;font-weight:bold;">OFFICIAL LEASE DOSSIER</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px;">Booking Ref: ${bId}</div>
          </div>
        </div>
        <p><strong>Resident:</strong> ${booking.resident || 'Verified Resident'}</p>
        <p><strong>Property:</strong> ${propName}</p>
        <p><strong>Room Assigned:</strong> ${booking.room || 'Standard Co-Living Room'}</p>
        <p><strong>Move-in Date:</strong> ${booking.date || 'Scheduled'}</p>
        <table>
          <thead>
            <tr><th>Item</th><th>Description</th><th>Amount</th></tr>
          </thead>
          <tbody>
            <tr><td>Monthly Lease</td><td>Room Accommodation &amp; Common Services</td><td>$${rentVal}</td></tr>
            <tr><td>Refundable Security Deposit</td><td>Recorded separately; not included in monthly rent payment</td><td>${depositVal}</td></tr>
          </tbody>
        </table>
        <div class="total">MONTHLY RENT PAYMENT: $${rentVal} (${booking.payment || 'Pending'})</div>
      </body>
      </html>
    `
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  if (isLoading) {
    return (
      <div className="r-page" style={{ maxWidth: '960px' }}>
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          Loading reservation dossier...
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="r-page" style={{ maxWidth: '960px' }}>
        <Link to="/resident/bookings" className="r-back-link">
          <ChevronLeft size={18} /> Back to My Bookings
        </Link>
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <AlertTriangle size={42} color="#dc2626" style={{ margin: '0 auto 12px' }} />
          <h3>Booking Not Found</h3>
          <p>This reservation record is not associated with your account or has been archived.</p>
          <Link to="/resident/bookings" className="primary-button compact-button">
            View All My Bookings
          </Link>
        </div>
      </div>
    )
  }

  const bId = booking.bookingId || booking.id
  const propName = booking.property || booking.propertyName || property?.name || 'Nestora Heights'
  const propImage = property?.images?.length ? getImageUrl(property.images[0]) : (property?.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80')
  const statusStr = (booking.status || 'Pending').toLowerCase()
  const paymentStr = (booking.payment || 'Pending').toLowerCase()
  const rentVal = Number(booking.amount || 0).toLocaleString('en-US')
  const depositAmount = booking.securityDeposit ?? property?.securityDeposit
  const depositVal = depositAmount == null ? 'Not specified' : `$${Number(depositAmount).toLocaleString('en-US')}`

  // Dynamic Timeline steps
  const isApproved = ['approved', 'active', 'completed'].includes(statusStr)
  const isPaid = paymentStr === 'paid'
  const isActive = statusStr === 'active' || statusStr === 'completed'

  const timelineSteps = [
    { label: 'Booking Application Submitted', done: true, desc: `Created on ${booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-GB') : 'Direct'}` },
    { label: 'Landlord Review & Approval', done: isApproved, desc: isApproved ? 'Verified & Approved by Property Manager' : 'Under landlord review' },
    { label: 'Monthly Rent Payment', done: isPaid, desc: isPaid ? 'Monthly rent payment verified' : 'Monthly rent payment pending; deposit is recorded separately' },
    { label: 'Move-in & Digital Key Handover', done: isActive, desc: isActive ? 'Key issued & room ready' : `Scheduled for ${booking.date || 'Move-in'}` },
    { label: 'Active Tenancy Residency', done: isActive, desc: isActive ? 'Tenancy active' : 'Awaiting check-in' },
  ]

  return (
    <div className="r-page" style={{ maxWidth: '980px' }}>
      {/* Back Link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Link to="/resident/bookings" className="r-back-link" style={{ marginBottom: 0 }}>
          <ChevronLeft size={18} /> Back to All Bookings
        </Link>
        <button
          className="ghost-button compact-button"
          onClick={printReceipt}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Printer size={15} /> Print / Save Voucher
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="r-v8-toast">
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="r-page-header" style={{ marginBottom: '20px' }}>
        <div>
          <span className="r-v8-kicker">
            <ShieldCheck size={14} /> OFFICIAL RESERVATION DOSSIER V8
          </span>
          <h1 className="r-page-title" style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px' }}>
            Reservation #{bId}
          </h1>
          <p className="r-page-subtitle">Move-in Date: <strong>{booking.date || 'Immediate'}</strong> · Created for <strong>{booking.resident || 'Resident'}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className={`status-badge ${statusStr === 'active' || statusStr === 'approved' ? 'active' : statusStr === 'cancelled' ? 'status-available' : 'pending'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            Tenancy: {booking.status || 'Pending'}
          </span>
          <span className={`status-badge ${paymentStr === 'paid' ? 'active' : 'pending'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            {paymentStr === 'paid' ? 'Paid' : 'Payment Pending'}
          </span>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="r-detail-grid" style={{ gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Property Summary Card */}
          <div className="r-v8-amenity-tile" style={{ padding: '18px', gap: '18px', alignItems: 'flex-start' }}>
            <img
              src={propImage}
              alt={propName}
              style={{ width: '130px', height: '100px', objectFit: 'cover', borderRadius: '10px' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="r-v8-badge-verified"><ShieldCheck size={11} /> Verified Co-Living</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 6px' }}>{propName}</h3>
              <p className="muted-copy" style={{ fontSize: '0.85rem' }}>
                <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                {property?.location || `${property?.area || 'Prime Area'}, ${property?.city || 'City'}`}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.85rem' }}>
                <span>Room: <strong>{booking.room || 'Standard Suite'}</strong></span>
                <span style={{ color: 'var(--jade)', fontWeight: 800 }}>${rentVal}/mo</span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="r-v8-booking-card" style={{ position: 'static' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: '14px' }}>
              Lease Terms &amp; Financial Summary
            </h3>
            <div className="r-v8-bill-row">
              <span>Monthly Rent (Exclusive)</span>
              <strong>${rentVal}/month</strong>
            </div>
            <div className="r-v8-bill-row">
              <span>Refundable Security Deposit</span>
              <strong>{depositVal}</strong>
            </div>
            <div className="r-v8-bill-row">
              <span>Maintenance, Utilities &amp; High-Speed WiFi</span>
              <strong style={{ color: '#10b981' }}>Included ($0)</strong>
            </div>
            <div className="r-v8-bill-row">
              <span>Brokerage / Platform Fee</span>
              <strong style={{ color: '#10b981' }}>Zero Brokerage</strong>
            </div>
            <div className="r-v8-bill-total">
              <span>Monthly Rent Payment Status</span>
              <span style={{ color: paymentStr === 'paid' ? '#10b981' : '#d97706', fontWeight: 800 }}>
                {paymentStr === 'paid' ? 'Settled in Full' : `$${rentVal} Due`}
              </span>
            </div>
            <p className="muted-copy" style={{ fontSize: '0.8rem', marginTop: '10px' }}>
              The refundable security deposit is listed separately and is not included in the rent payment amount.
            </p>

            {paymentStr !== 'paid' && statusStr !== 'cancelled' && (
              <button
                className="primary-button"
                onClick={() => setShowPayModal(true)}
                style={{ width: '100%', marginTop: '16px', justifyContent: 'center', background: 'var(--jade)' }}
              >
                <CreditCard size={16} /> Settle Rent Payment Now
              </button>
            )}
          </div>

          {/* Interactive Timeline */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '18px' }}>
              Tenancy Progress Timeline
            </h3>
            <div className="r-timeline">
              {timelineSteps.map((step, i) => (
                <div key={i} className={`r-timeline-step ${step.done ? 'done' : ''}`} style={{ marginBottom: '16px' }}>
                  <div className="r-timeline-dot">
                    {step.done ? <CheckCircle2 size={18} color="var(--jade)" /> : <Clock size={18} color="#9ca3af" />}
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: step.done ? 'var(--ink)' : '#9ca3af' }}>
                      {step.label}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Digital QR Access Pass & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Digital QR Access Pass Card */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
            <span className="r-v8-badge-verified" style={{ marginBottom: '12px' }}>
              <ShieldCheck size={12} /> Digital Check-in Pass
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '8px 0 4px' }}>
              Resident Verification Pass
            </h3>
            <p className="muted-copy" style={{ fontSize: '0.8rem', marginBottom: '18px' }}>
              Scan at property entrance for contactless key reception.
            </p>

            <div style={{ background: 'var(--paper-2)', padding: '20px', borderRadius: '14px', display: 'inline-block', border: '1px dashed var(--line)' }}>
              <QrCode size={110} color="var(--ink)" />
              <div style={{ marginTop: '10px', fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                #{bId}
              </div>
            </div>

            <div style={{ marginTop: '18px', textAlign: 'left', background: 'var(--paper-2)', borderRadius: '10px', padding: '12px', fontSize: '0.82rem' }}>
              <div><span style={{ color: '#6b7280' }}>Resident:</span> <strong>{booking.resident || 'Self'}</strong></div>
              <div style={{ marginTop: '4px' }}><span style={{ color: '#6b7280' }}>Room Assigned:</span> <strong>{booking.room || 'Standard Room'}</strong></div>
              <div style={{ marginTop: '4px' }}><span style={{ color: '#6b7280' }}>Move-in:</span> <strong>{booking.date || 'Immediate'}</strong></div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '16px', padding: '20px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: '14px' }}>Dossier Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {paymentStr !== 'paid' && ['approved', 'active'].includes(statusStr) && (
                <button
                  className="primary-button compact-button"
                  onClick={() => setShowPayModal(true)}
                  style={{ width: '100%', justifyContent: 'center', background: 'var(--jade)' }}
                >
                  <CreditCard size={15} /> Pay Rent Now (${rentVal})
                </button>
              )}

              <button
                className="ghost-button compact-button"
                onClick={printReceipt}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Download size={15} /> Download PDF Receipt
              </button>

              <Link
                to="/resident/payments"
                className="ghost-button compact-button"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                View Financial Statement
              </Link>

              <Link
                to="/resident/visits"
                className="ghost-button compact-button"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Manage Property Visits
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* V8 Professional Payment Checkout Modal (PayPal, Cards, Netbanking, COD) */}
      <PaymentModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        booking={booking}
        onSuccess={async (paymentPayload) => {
          const res = paymentPayload.alreadyCaptured
            ? { message: paymentPayload.message || 'Payment confirmed successfully!' }
            : await apiRequest('/resident/payments', {
              method: 'POST',
              body: JSON.stringify(paymentPayload),
            })
          const isCod = paymentPayload.isCod
          setBooking(prev => ({
            ...prev,
            payment: isCod ? 'Pending' : 'Paid',
            status: isCod ? 'Approved' : 'Active'
          }))
          showToast(res.message || 'Payment confirmed successfully! 🎉')
        }}
      />
    </div>
  )
}
