import { useState, useEffect, useMemo } from 'react'
import {
  Search, Eye, CheckCircle2, XCircle, Download, AlertTriangle, Clock,
  Calendar, BookOpen, Users, Building2, ShieldCheck, Filter, ArrowUpRight, Check, X
} from 'lucide-react'
import { apiRequest } from '../../services/api.js'

const TABS = ['All', 'Pending', 'Approved', 'Active', 'Completed', 'Cancelled']

export default function Bookings() {
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setFetchError(null)
    apiRequest('/bookings')
      .then(res => {
        if (!active) return
        const list = res.data || (Array.isArray(res) ? res : [])
        setBookings(list)
      })
      .catch(err => {
        if (!active) return
        console.error('Bookings load error:', err)
        setFetchError('Could not load bookings from server. Showing cached data.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const bStatus = (b.status || 'Pending').toLowerCase()
      const matchTab = tab === 'All' || bStatus === tab.toLowerCase()
      const q = search.toLowerCase().trim()

      const bId = String(b.id || b.bookingId || '').toLowerCase()
      const resName = String(b.resident || b.userName || '').toLowerCase()
      const propName = String(b.property || b.propertyName || '').toLowerCase()

      const matchSearch = !q || bId.includes(q) || resName.includes(q) || propName.includes(q)
      return matchTab && matchSearch
    })
  }, [bookings, tab, search])

  // Summary Metrics
  const stats = useMemo(() => {
    const total = bookings.length
    const active = bookings.filter(b => (b.status || '').toLowerCase() === 'active').length
    const pending = bookings.filter(b => (b.status || '').toLowerCase() === 'pending').length
    const totalRevenue = bookings
      .filter(b => (b.payment || '').toLowerCase() === 'paid')
      .reduce((sum, b) => sum + Number(b.amount || 0), 0)

    return { total, active, pending, totalRevenue }
  }, [bookings])

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id)
    try {
      await apiRequest(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      setBookings(prev =>
        prev.map(b =>
          (b.id === id || b.bookingId === id)
            ? { ...b, status: newStatus, payment: newStatus === 'Approved' || newStatus === 'Active' ? 'Paid' : newStatus === 'Cancelled' ? 'Refunded' : b.payment }
            : b
        )
      )
      showToast(`Booking #${id} status updated to ${newStatus}.`)
      setSelectedBooking(prev =>
        prev && (prev.id === id || prev.bookingId === id)
          ? { ...prev, status: newStatus }
          : prev
      )
    } catch (err) {
      console.error('Update status error:', err)
      showToast(`Failed to update booking #${id}: ${err.message}`)
    } finally {
      setUpdatingId(null)
    }
  }

  // Export Bookings CSV
  const exportBookingsCSV = () => {
    if (filtered.length === 0) return alert('No booking records to export.')

    const headers = ['Booking ID', 'Resident Name', 'Property', 'Room Assigned', 'Reservation Date', 'Monthly Rent', 'Payment Status', 'Booking Status']
    const rows = filtered.map(b => [
      b.id || b.bookingId || '',
      b.resident || b.userName || '',
      b.property || b.propertyName || '',
      b.room || '',
      b.date || '',
      `INR ${b.amount || 0}`,
      b.payment || 'Paid',
      b.status || 'Active'
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
    link.download = `Nestora_Bookings_Report_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <span className="admin-page-kicker" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--jade, #10b981)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
            RESERVATION MANAGEMENT
          </span>
          <h1 className="admin-page-title" style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px' }}>Booking &amp; Lease Management</h1>
          <p className="admin-page-subtitle">Track, audit, approve, or resolve resident booking reservations platform-wide.</p>
        </div>
        <button className="primary-button compact-button" onClick={exportBookingsCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={15} /> Export Bookings CSV
        </button>
      </div>

      {toastMsg && (
        <div className="admin-toast-banner" style={{ background: 'rgba(16,185,129,0.15)', color: '#065f46', border: '1px solid #10b981', padding: '10px 16px', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <CheckCircle2 size={18} color="#10b981" /> {toastMsg}
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="admin-stat-card" style={{ borderTop: '3px solid #3b82f6' }}>
          <div className="admin-stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', borderRadius: '12px', padding: '10px' }}>
            <BookOpen size={20} />
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className="admin-stat-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280' }}>TOTAL BOOKINGS</span>
            <h3 className="admin-stat-val" style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.total}</h3>
          </div>
        </div>

        <div className="admin-stat-card" style={{ borderTop: '3px solid #10b981' }}>
          <div className="admin-stat-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '12px', padding: '10px' }}>
            <CheckCircle2 size={20} />
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className="admin-stat-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280' }}>ACTIVE LEASES</span>
            <h3 className="admin-stat-val" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{stats.active}</h3>
          </div>
        </div>

        <div className="admin-stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
          <div className="admin-stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706', borderRadius: '12px', padding: '10px' }}>
            <Clock size={20} />
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className="admin-stat-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280' }}>PENDING APPROVALS</span>
            <h3 className="admin-stat-val" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>{stats.pending}</h3>
          </div>
        </div>

        <div className="admin-stat-card" style={{ borderTop: '3px solid #8b5cf6' }}>
          <div className="admin-stat-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', borderRadius: '12px', padding: '10px' }}>
            <ArrowUpRight size={20} />
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className="admin-stat-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280' }}>GROSS LEASE VALUE</span>
            <h3 className="admin-stat-val" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6' }}>${stats.totalRevenue.toLocaleString('en-US')}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="owner-tabs" style={{ marginBottom: '1rem' }}>
        {TABS.map(t => {
          const count = t === 'All'
            ? bookings.length
            : bookings.filter(b => (b.status || '').toLowerCase() === t.toLowerCase()).length

          return (
            <button key={t} className={`owner-tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t} ({count})
            </button>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-field">
          <Search size={16} />
          <input placeholder="Search by booking ID, resident or property..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          Loading bookings...
        </div>
      )}

      {/* Error banner */}
      {fetchError && !isLoading && (
        <div className="owner-error-banner" style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> {fetchError}
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="owner-table-wrapper" style={{ border: '1px solid #e5e7eb', borderRadius: '10px' }}>
          <table className="owner-data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Resident</th>
                <th>Property</th>
                <th>Room Type</th>
                <th>Move-In Date</th>
                <th>Monthly Rent</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const bId = b.id || b.bookingId
                const status = b.status || 'Pending'
                const payment = b.payment || 'Paid'
                const rentVal = Number(b.amount || 0).toLocaleString('en-US')
                const isUpdating = updatingId === bId

                return (
                  <tr key={bId}>
                    <td><strong>#{bId}</strong></td>
                    <td><strong>{b.resident || b.userName}</strong></td>
                    <td>{b.property || b.propertyName}</td>
                    <td>{b.room || 'Standard'}</td>
                    <td>{b.date || '—'}</td>
                    <td><strong style={{ color: 'var(--jade, #10b981)' }}>${rentVal}/mo</strong></td>
                    <td>
                      <span className={`status-badge ${payment.toLowerCase() === 'paid' ? 'active' : 'pending'}`}>
                        {payment}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${status.toLowerCase() === 'active' || status.toLowerCase() === 'approved' ? 'active' : status.toLowerCase() === 'cancelled' ? 'status-available' : 'pending'}`}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions" style={{ display: 'flex', gap: '6px' }}>
                        <button className="r-icon-btn" title="View Details" onClick={() => setSelectedBooking(b)}>
                          <Eye size={15} />
                        </button>
                        {status.toLowerCase() === 'pending' && (
                          <button
                            className="primary-button compact-button"
                            onClick={() => updateStatus(bId, 'Approved')}
                            disabled={isUpdating}
                            style={{ fontSize: '0.75rem', padding: '4px 8px', opacity: isUpdating ? 0.6 : 1 }}
                          >
                            <Check size={13} /> {isUpdating ? '...' : 'Approve'}
                          </button>
                        )}
                        {(status.toLowerCase() === 'pending' || status.toLowerCase() === 'approved') && (
                          <button
                            className="ghost-button compact-button danger-button"
                            onClick={() => updateStatus(bId, 'Cancelled')}
                            disabled={isUpdating}
                            style={{ fontSize: '0.75rem', padding: '4px 8px', opacity: isUpdating ? 0.6 : 1 }}
                          >
                            <X size={13} /> {isUpdating ? '...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#6b7280' }}>
              {bookings.length === 0 ? 'No bookings have been made yet.' : 'No booking reservations found matching your criteria.'}
            </div>
          )}
        </div>
      )}

      {/* Booking Audit Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setSelectedBooking(null)}>
              <X size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className={`status-badge ${selectedBooking.status?.toLowerCase() === 'active' ? 'active' : 'pending'}`}>
                {selectedBooking.status}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Reservation Record</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Booking #{selectedBooking.id || selectedBooking.bookingId}</h2>
            <p className="muted-copy" style={{ fontSize: '0.85rem' }}>Move-in: {selectedBooking.date || '—'}</p>

            <div style={{ background: 'var(--paper-2, #f9fafb)', borderRadius: '10px', padding: '1.25rem', marginTop: '1rem', border: '1px solid #e5e7eb' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Lease &amp; Resident Audit</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.75rem' }}>RESIDENT</span><strong>{selectedBooking.resident || selectedBooking.userName}</strong></div>
                <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.75rem' }}>PROPERTY</span><strong>{selectedBooking.property || selectedBooking.propertyName}</strong></div>
                <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.75rem' }}>ROOM ASSIGNED</span><strong>{selectedBooking.room || 'Standard Room'}</strong></div>
                <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.75rem' }}>MONTHLY RENT</span><strong style={{ color: '#10b981' }}>${Number(selectedBooking.amount || 0).toLocaleString('en-US')}/mo</strong></div>
                <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.75rem' }}>PAYMENT STATUS</span><strong>{selectedBooking.payment || 'Paid'}</strong></div>
                <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.75rem' }}>TENANCY STATUS</span><strong>{selectedBooking.status}</strong></div>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedBooking.status === 'Pending' && (
                <button
                  className="primary-button compact-button"
                  disabled={updatingId === (selectedBooking.id || selectedBooking.bookingId)}
                  onClick={() => updateStatus(selectedBooking.id || selectedBooking.bookingId, 'Approved')}
                >
                  Approve Booking
                </button>
              )}
              <button className="ghost-button compact-button" onClick={() => setSelectedBooking(null)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
