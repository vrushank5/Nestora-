import { useState, useEffect, useMemo } from 'react'
import {
  DollarSign, CheckCircle2, Clock, XCircle, CreditCard, Download, Search,
  AlertTriangle, Printer, FileText, ArrowUpRight, ShieldCheck, X
} from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function Payments() {
  const [search, setSearch] = useState('')
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState({ revenue: 0, successful: 0, pending: 0, failed: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setFetchError(null)
    apiRequest('/payments')
      .then(res => {
        if (!active) return
        const list = res.data || (Array.isArray(res) ? res : [])
        setPayments(list)

        // Use backend-computed summary if available, otherwise compute locally
        if (res.summary && res.summary.revenue !== undefined) {
          setSummary(res.summary)
        } else {
          const paid = list.filter(p => (p.status || '').toLowerCase() === 'paid')
          const pending = list.filter(p => (p.status || '').toLowerCase() === 'pending')
          const failed = list.filter(p => (p.status || '').toLowerCase() === 'failed')
          const rev = paid.reduce((tot, p) => tot + Number(p.amount || 0), 0)
          setSummary({ revenue: rev, successful: paid.length, pending: pending.length, failed: failed.length })
        }
      })
      .catch(err => {
        if (!active) return
        console.error('Payments load error:', err)
        setFetchError('Could not load payment records from server.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return payments

    return payments.filter(p => {
      const txnId = String(p.id || p.transactionId || '').toLowerCase()
      const resName = String(p.resident || '').toLowerCase()
      const propName = String(p.property || '').toLowerCase()
      const statusStr = String(p.status || '').toLowerCase()

      return txnId.includes(q) || resName.includes(q) || propName.includes(q) || statusStr.includes(q)
    })
  }, [payments, search])

  // Export Financial CSV
  const exportFinancialCSV = () => {
    if (filtered.length === 0) return alert('No payment records to export.')

    const headers = ['Transaction ID', 'Resident Name', 'Property', 'Booking Reference', 'Amount (INR)', 'Payment Method', 'Transaction Date', 'Status']
    const rows = filtered.map(p => [
      p.id || p.transactionId || '',
      p.resident || '',
      p.property || '',
      p.booking || '',
      p.amount || 0,
      p.method || 'Online Gateway',
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
    link.download = `Nestora_Financial_Payments_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print Invoice Document
  const printInvoiceDocument = (p) => {
    const printWindow = window.open('', '_blank', 'height=750,width=850')
    if (!printWindow) return alert('Please allow popups to generate Tax Invoice.')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${p.id || p.transactionId}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 30px; color: #111827; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 800; color: #064e3b; }
          .invoice-title { font-size: 20px; font-weight: 700; color: #111827; text-align: right; }
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
            <p style="margin:4px 0 0 0;font-size:12px;color:#6b7280;">Enterprise Housing &amp; Property Network</p>
          </div>
          <div class="invoice-title">
            OFFICIAL TAX INVOICE
            <div style="font-size:12px;font-weight:normal;color:#6b7280;margin-top:4px;">Ref: ${p.id || p.transactionId}</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <strong>BILLED TO:</strong><br />
            Name: ${p.resident || 'N/A'}<br />
            Property: ${p.property || 'N/A'}<br />
            Booking Ref: ${p.booking || 'N/A'}
          </div>
          <div>
            <strong>PAYMENT DETAILS:</strong><br />
            Date: ${p.date || '—'}<br />
            Method: ${p.method || 'UPI/Netbanking'}<br />
            Status: <span style="color:#059669;font-weight:bold;">${p.status || 'Paid'}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr><th>Item Description</th><th>Qty</th><th>Amount (INR)</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Monthly Accommodation Lease &amp; Services (${p.property || 'Nestora Property'})</td>
              <td>1 Month</td>
              <td>${Number(p.amount || 0).toLocaleString('en-US')}</td>
            </tr>
          </tbody>
        </table>

        <div class="total">
          TOTAL PAID: ${Number(p.amount || 0).toLocaleString('en-US')}
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
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <span className="admin-page-kicker" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--jade, #10b981)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
            FINANCIAL INTELLIGENCE
          </span>
          <h1 className="admin-page-title" style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px' }}>Financial &amp; Payment Management</h1>
          <p className="admin-page-subtitle">Track platform transaction volume, gateway statuses, and downloadable invoices.</p>
        </div>
        <button className="primary-button compact-button" onClick={exportFinancialCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={15} /> Export Financial CSV
        </button>
      </div>

      {/* Financial Overview Stats */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="admin-stat-card" style={{ borderTop: '3px solid #10b981' }}>
          <div className="admin-stat-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '12px', padding: '10px' }}>
            <DollarSign size={20} />
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className="admin-stat-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280' }}>TOTAL REVENUE</span>
            <h3 className="admin-stat-val" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
              ${Number(summary.revenue || 0).toLocaleString('en-US')}
            </h3>
          </div>
        </div>

        <div className="admin-stat-card" style={{ borderTop: '3px solid #3b82f6' }}>
          <div className="admin-stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', borderRadius: '12px', padding: '10px' }}>
            <CheckCircle2 size={20} />
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className="admin-stat-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280' }}>SUCCESSFUL PAYMENTS</span>
            <h3 className="admin-stat-val" style={{ fontSize: '1.6rem', fontWeight: 800 }}>{summary.successful}</h3>
          </div>
        </div>

        <div className="admin-stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
          <div className="admin-stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706', borderRadius: '12px', padding: '10px' }}>
            <Clock size={20} />
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className="admin-stat-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280' }}>PENDING SETTLEMENTS</span>
            <h3 className="admin-stat-val" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>{summary.pending}</h3>
          </div>
        </div>

        <div className="admin-stat-card" style={{ borderTop: '3px solid #ef4444' }}>
          <div className="admin-stat-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: '12px', padding: '10px' }}>
            <XCircle size={20} />
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className="admin-stat-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280' }}>FAILED / DISPUTED</span>
            <h3 className="admin-stat-val" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444' }}>{summary.failed}</h3>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="admin-filter-bar">
        <div className="admin-search-field">
          <Search size={16} />
          <input
            placeholder="Search by transaction ID, resident or property..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          Loading payment records...
        </div>
      )}

      {/* Error state */}
      {fetchError && !isLoading && (
        <div className="owner-error-banner" style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> {fetchError}
        </div>
      )}

      {/* Payments Table */}
      {!isLoading && (
        <div className="owner-table-wrapper" style={{ border: '1px solid #e5e7eb', borderRadius: '10px' }}>
          <table className="owner-data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Resident</th>
                <th>Property</th>
                <th>Booking Ref</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const txnId = p.id || p.transactionId
                const status = (p.status || 'Paid').toLowerCase()
                const amountVal = Number(p.amount || 0).toLocaleString('en-US')

                return (
                  <tr key={txnId}>
                    <td><strong>{txnId}</strong></td>
                    <td><strong>{p.resident}</strong></td>
                    <td>{p.property}</td>
                    <td><span style={{ fontSize: '0.8rem', color: '#4b5563' }}>#{p.booking || 'N/A'}</span></td>
                    <td><strong style={{ color: 'var(--jade, #10b981)' }}>${amountVal}</strong></td>
                    <td>
                      <span className="r-amenity-tag" style={{ background: '#f3f4f6', color: '#374151', fontSize: '0.78rem', padding: '3px 8px', borderRadius: '6px' }}>
                        {p.method || 'UPI'}
                      </span>
                    </td>
                    <td>{p.date || '—'}</td>
                    <td>
                      <span className={`status-badge ${status === 'paid' ? 'active' : status === 'failed' ? 'status-available' : 'pending'}`}>
                        {p.status || 'Paid'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="ghost-button compact-button"
                        title="Download Tax Invoice"
                        onClick={() => printInvoiceDocument(p)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <Printer size={13} color="#3b82f6" /> Tax Invoice
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#6b7280' }}>
              {payments.length === 0 ? 'No payment transactions recorded yet.' : 'No payment records found matching your search.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
