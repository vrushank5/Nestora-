import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Download, Clock, Check, CheckCircle2, ArrowUpRight, Search,
  AlertTriangle, Printer, ShieldCheck, X, DollarSign, Wallet
} from 'lucide-react'
import { apiRequest } from '../../services/api.js'
import PaymentModal from './components/PaymentModal.jsx'

const TABS = ['All', 'Paid', 'Pending', 'Failed']

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [bookings, setBookings] = useState([])
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [toastMsg, setToastMsg] = useState('')

  // Checkout Modal State
  const [payingTarget, setPayingTarget] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('UPI (Google Pay)')
  const [isProcessing, setIsProcessing] = useState(false)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  // Load Payments & Bookings
  const loadFinancialData = () => {
    setIsLoading(true)
    setFetchError(null)

    Promise.all([
      apiRequest('/resident/payments').then(res => res.data || []).catch(() => []),
      apiRequest('/resident/bookings').then(res => res.data || []).catch(() => [])
    ])
      .then(([paymentsData, bookingsData]) => {
        setPayments(paymentsData)
        setBookings(bookingsData)
      })
      .catch(err => {
        console.error('Failed to load financial records:', err)
        setFetchError('Could not load payment records from server.')
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadFinancialData()
  }, [])

  // Calculate unpaid bookings (pending rent dues)
  const pendingBookings = useMemo(() => {
    return bookings.filter(
      b => (b.payment || 'Pending').toLowerCase() === 'pending' &&
        ['approved', 'active'].includes((b.status || '').toLowerCase())
    )
  }, [bookings])

  // Summary Metrics
  const summary = useMemo(() => {
    const paidList = payments.filter(p => (p.status || '').toLowerCase() === 'paid')
    const pendingList = payments.filter(p => (p.status || '').toLowerCase() === 'pending')

    const totalPaid = paidList.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const totalPendingRent = pendingBookings.reduce((sum, b) => sum + Number(b.amount || 0), 0) +
      pendingList.reduce((sum, p) => sum + Number(p.amount || 0), 0)

    const zeroBrokerageSavings = Math.round(totalPaid * 0.15) || 12000

    return {
      totalPaid,
      totalPendingRent,
      successfulCount: paidList.length,
      zeroBrokerageSavings,
    }
  }, [payments, pendingBookings])

  // Filtering
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const pStatus = (p.status || 'Pending').toLowerCase()
      const matchTab = tab === 'All' || pStatus === tab.toLowerCase()
      const q = search.toLowerCase().trim()

      const txnId = String(p.transactionId || p.id || '').toLowerCase()
      const propName = String(p.property || '').toLowerCase()
      const bRef = String(p.booking || p.bookingId || '').toLowerCase()

      const matchSearch = !q || txnId.includes(q) || propName.includes(q) || bRef.includes(q)
      return matchTab && matchSearch
    })
  }, [payments, tab, search])

  // Process Payment
  const handleProcessPayment = async () => {
    if (!payingTarget) return
    setIsProcessing(true)

    const bId = payingTarget.bookingId || payingTarget.id || payingTarget.booking
    const amountVal = Number(payingTarget.amount || 9000)
    const propName = payingTarget.property || payingTarget.propertyName || 'Nestora Co-Living'

    try {
      const res = await apiRequest('/resident/payments', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: bId,
          propertyId: payingTarget.propertyId,
          propertyName: propName,
          amount: amountVal,
          method: paymentMethod,
        })
      })

      // Update state
      if (res.data) {
        setPayments(prev => [res.data, ...prev])
      }
      setBookings(prev =>
        prev.map(b => (b.bookingId === bId || b.id === bId ? { ...b, payment: 'Paid', status: 'Active' } : b))
      )

      setPayingTarget(null)
      showToast(`Payment of $${Number(amountVal).toLocaleString('en-US')} confirmed successfully! 🎉`)
    } catch (err) {
      console.error('Payment processing failed:', err)
      showToast(err.message || 'Payment processing failed.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Export Financial CSV
  const exportCSV = () => {
    if (payments.length === 0) return alert('No payment records to export.')

    const headers = ['Transaction ID', 'Property', 'Booking Reference', 'Amount ($)', 'Payment Method', 'Date', 'Status']
    const rows = payments.map(p => [
      p.transactionId || p.id || '',
      p.property || '',
      p.booking || p.bookingId || 'N/A',
      p.amount || 0,
      p.method || 'UPI',
      p.date || '',
      p.status || 'Paid'
    ])

    const formatCSVCell = (val) => {
      const str = String(val ?? '')
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const csvContent = [
      headers.map(formatCSVCell).join(','),
      ...rows.map(r => r.map(formatCSVCell).join(','))
    ].join('\r\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Nestora_Resident_Statement_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print Official Tax Invoice
  const printTaxInvoice = (p) => {
    const printWindow = window.open('', '_blank', 'height=750,width=850')
    if (!printWindow) return alert('Please allow popups to generate Tax Invoice.')

    const txnId = p.transactionId || p.id
    const amountVal = Number(p.amount || 0).toLocaleString('en-US')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${txnId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #111827; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 800; color: #064e3b; }
          .invoice-title { font-size: 20px; font-weight: 700; text-align: right; }
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
            Print / Save Invoice PDF
          </button>
        </div>
        <div class="header">
          <div>
            <div class="logo">NESTORA CO-LIVING</div>
            <p style="margin:4px 0 0 0;font-size:12px;color:#6b7280;">Automated Resident Settlement System</p>
          </div>
          <div class="invoice-title">
            OFFICIAL TAX INVOICE
            <div style="font-size:12px;font-weight:normal;color:#6b7280;margin-top:4px;">Ref: ${txnId}</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <strong>BILLED TO:</strong><br />
            Resident: ${p.resident || 'Resident'}<br />
            Property: ${p.property || 'Nestora Property'}<br />
            Booking Ref: ${p.booking || p.bookingId || 'N/A'}
          </div>
          <div>
            <strong>PAYMENT DETAILS:</strong><br />
            Date: ${p.date || 'Today'}<br />
            Method: ${p.method || 'PayPal'}<br />
            Status: <span style="color:#059669;font-weight:bold;">${p.status || 'Paid'}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr><th>Description</th><th>Period</th><th>Amount (USD)</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Monthly Accommodation Lease (${p.property || 'Nestora Living'})</td>
              <td>1 Month</td>
              <td>$${amountVal}</td>
            </tr>
          </tbody>
        </table>

        <div class="total">
          TOTAL PAID: $${amountVal}
        </div>

        <div style="margin-top:40px;font-size:12px;color:#9ca3af;text-align:center;">
          Thank you for staying with Nestora • Automated System Receipt
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
            <Wallet size={14} /> RESIDENT FINANCIAL &amp; PAYMENT HUB V8
          </span>
          <h1 className="r-page-title" style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px' }}>
            Payments &amp; Financial Ledger
          </h1>
          <p className="r-page-subtitle">Track rent settlements, settle outstanding dues, and generate tax invoices.</p>
        </div>
        <button
          className="primary-button compact-button"
          onClick={exportCSV}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Download size={15} /> Export Statement CSV
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="r-v8-toast">
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* V8 Financial KPI Cards */}
      <div className="r-v8-kpis" style={{ marginBottom: '1.25rem' }}>
        <div className="r-v8-kpi-card" style={{ borderTop: '3px solid #10b981' }}>
          <div className="r-v8-kpi-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="r-v8-kpi-label">TOTAL SETTLED</span>
            <div className="r-v8-kpi-val" style={{ color: '#10b981' }}>
              ${summary.totalPaid.toLocaleString('en-US')}
            </div>
          </div>
        </div>

        <div className="r-v8-kpi-card" style={{ borderTop: '3px solid #f59e0b' }}>
          <div className="r-v8-kpi-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
            <Clock size={20} />
          </div>
          <div>
            <span className="r-v8-kpi-label">PENDING RENT DUES</span>
            <div className="r-v8-kpi-val" style={{ color: summary.totalPendingRent > 0 ? '#d97706' : '#10b981' }}>
              ${summary.totalPendingRent.toLocaleString('en-US')}
            </div>
          </div>
        </div>

        <div className="r-v8-kpi-card" style={{ borderTop: '3px solid #3b82f6' }}>
          <div className="r-v8-kpi-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <span className="r-v8-kpi-label">TRANSACTIONS RECORDED</span>
            <div className="r-v8-kpi-val">{payments.length}</div>
          </div>
        </div>

        <div className="r-v8-kpi-card" style={{ borderTop: '3px solid #8b5cf6' }}>
          <div className="r-v8-kpi-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="r-v8-kpi-label">ZERO BROKERAGE SAVINGS</span>
            <div className="r-v8-kpi-val" style={{ color: '#8b5cf6' }}>
              ${summary.zeroBrokerageSavings.toLocaleString('en-US')}
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Pending Dues Alert Banner */}
      {pendingBookings.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))',
            border: '1.5px solid #f59e0b',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#f59e0b', color: '#fff', padding: '10px', borderRadius: '10px' }}>
              <Clock size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '1rem', color: '#92400e', display: 'block' }}>
                Pending Lease Payment Required
              </strong>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#78350f' }}>
                You have {pendingBookings.length} booking(s) awaiting payment settlement for room confirmation.
              </p>
            </div>
          </div>
          <button
            className="primary-button compact-button"
            onClick={() => setPayingTarget(pendingBookings[0])}
            style={{ background: '#d97706', borderColor: '#d97706' }}
          >
            Pay Due Rent (${Number(pendingBookings[0].amount || 0).toLocaleString('en-US')})
          </button>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="owner-tabs" style={{ marginBottom: '1rem' }}>
        {TABS.map(t => {
          const count = t === 'All'
            ? payments.length
            : payments.filter(p => (p.status || '').toLowerCase() === t.toLowerCase()).length

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

      {/* Search Bar */}
      <div className="admin-filter-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="admin-search-field">
          <Search size={16} />
          <input
            placeholder="Search by transaction ID, property name or booking ref..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          Loading your financial transactions...
        </div>
      )}

      {fetchError && !isLoading && (
        <div className="owner-error-banner" style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> {fetchError}
        </div>
      )}

      {/* Transactions Table */}
      {!isLoading && (
        filteredPayments.length === 0 ? (
          <div className="empty-state" style={{ padding: '3.5rem 1rem' }}>
            <Wallet size={48} color="var(--jade)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No {tab.toLowerCase()} payment transactions</h3>
            <p className="muted-copy" style={{ marginBottom: '18px' }}>
              {payments.length === 0
                ? "You haven't made any payments yet. Reserved bookings will appear here once settled."
                : "No payment records match your active search filter."}
            </p>
            {pendingBookings.length > 0 && (
              <button
                className="primary-button compact-button"
                onClick={() => setPayingTarget(pendingBookings[0])}
              >
                Settle Pending Rent Now
              </button>
            )}
          </div>
        ) : (
          <div className="owner-table-wrapper" style={{ border: '1px solid var(--line)', borderRadius: '12px' }}>
            <table className="owner-data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Property</th>
                  <th>Booking Ref</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(p => {
                  const txnId = p.transactionId || p.id
                  const statusStr = (p.status || 'Paid').toLowerCase()
                  const amountVal = Number(p.amount || 0).toLocaleString('en-US')

                  return (
                    <tr key={txnId}>
                      <td><strong>#{txnId}</strong></td>
                      <td><strong>{p.property || 'Nestora Property'}</strong></td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                          #{p.booking || p.bookingId || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--jade)', fontSize: '1rem' }}>
                          ${amountVal}
                        </strong>
                      </td>
                      <td>
                        <span className="r-amenity-tag" style={{ background: '#f3f4f6', color: '#374151', fontSize: '0.78rem', padding: '3px 8px', borderRadius: '6px' }}>
                          {p.method || 'Online UPI'}
                        </span>
                      </td>
                      <td>{p.date || '—'}</td>
                      <td>
                        <span className={`status-badge ${statusStr === 'paid' ? 'active' : statusStr === 'failed' ? 'status-available' : 'pending'}`}>
                          {statusStr === 'paid' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <Check size={13} /> Paid
                            </span>
                          ) : p.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        {statusStr === 'paid' ? (
                          <button
                            className="ghost-button compact-button"
                            title="Download Tax Invoice"
                            onClick={() => printTaxInvoice(p)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            <Printer size={13} color="#3b82f6" /> Tax Invoice
                          </button>
                        ) : (
                          <button
                            className="primary-button compact-button"
                            onClick={() => setPayingTarget(p)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            <ArrowUpRight size={13} /> Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* V8 Professional Payment Checkout Modal (PayPal, Cards, Netbanking, COD) */}
      <PaymentModal
        isOpen={Boolean(payingTarget)}
        onClose={() => setPayingTarget(null)}
        booking={payingTarget}
        onSuccess={async (paymentPayload) => {
          const res = await apiRequest('/resident/payments', {
            method: 'POST',
            body: JSON.stringify(paymentPayload),
          })
          if (res.data) {
            setPayments(prev => [res.data, ...prev])
          }
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
