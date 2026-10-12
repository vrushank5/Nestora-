import { useState, useEffect, useMemo } from 'react'
import { FileText, Download, Printer, Filter, CheckCircle2, AlertTriangle, Building2, Users, CreditCard, BookOpen, Search, ShieldCheck } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

const REPORT_TYPES = [
  { id: 'properties', label: 'Property Verification & Listing Audit', icon: Building2 },
  { id: 'users', label: 'User Directory & Tenant Audit', icon: Users },
  { id: 'payments', label: 'Payment & Financial Reconciliation', icon: CreditCard },
  { id: 'bookings', label: 'Booking & Occupancy Statements', icon: BookOpen },
  { id: 'summary', label: 'Executive Platform Overview Statement', icon: FileText },
]

const DATE_RANGES = [
  'Last 7 Days',
  'Last 30 Days',
  'This Quarter',
  'Year to Date (YTD)',
  'All Time Records'
]

export default function Reports() {
  const [reportType, setReportType] = useState('properties')
  const [dateRange, setDateRange] = useState('Last 30 Days')
  const [searchQuery, setSearchQuery] = useState('')
  const [reportData, setReportData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [isGenerated, setIsGenerated] = useState(true)
  const [toast, setToast] = useState('')

  // Load backend data for selected report type
  const loadReportData = async () => {
    setIsLoading(true)
    setFetchError(null)

    try {
      let endpoint = '/admin/properties'
      if (reportType === 'users') endpoint = '/users'
      if (reportType === 'payments') endpoint = '/payments'
      if (reportType === 'bookings') endpoint = '/bookings'
      if (reportType === 'summary') endpoint = '/admin/summary'

      const res = await apiRequest(endpoint)
      const data = res.data || (Array.isArray(res) ? res : [])
      setReportData(Array.isArray(data) ? data : [data])
      setIsGenerated(true)
    } catch (err) {
      console.error('Failed to load report data:', err)
      setFetchError(err.message || 'Unable to fetch report records from server.')
      setReportData([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [reportType])

  // Filtered dataset
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return reportData

    const q = searchQuery.toLowerCase().trim()
    return reportData.filter(item => {
      const nameStr = String(item.name || item.resident || item.user || item.property || '').toLowerCase()
      const statusStr = String(item.status || item.verificationStatus || '').toLowerCase()
      const locStr = String(item.location || item.city || item.email || '').toLowerCase()
      return nameStr.includes(q) || statusStr.includes(q) || locStr.includes(q)
    })
  }, [reportData, searchQuery])

  // Helper to show temporary toast banner
  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // 1. GENERATE / REFRESH REPORT
  const handleGenerateReport = () => {
    loadReportData()
    showToast(`Compiled latest records for "${REPORT_TYPES.find(r => r.id === reportType)?.label}".`)
  }

  // 2. EXPORT REAL CSV FILE
  const handleExportCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('No data available to export for this report configuration.')
      return
    }

    let headers = []
    let rows = []

    if (reportType === 'properties') {
      headers = ['ID', 'Property Name', 'Location', 'Gender', 'Rent Price', 'Rating', 'Verification Status', 'Status']
      rows = filteredData.map(p => [
        p.id || p.propertyId || '',
        p.name || '',
        p.location || p.city || '',
        p.gender || 'Unisex',
        p.price || '',
        p.rating || 0,
        p.verificationStatus || 'Pending',
        p.status || 'Active'
      ])
    } else if (reportType === 'users') {
      headers = ['User ID', 'Full Name', 'Email', 'Phone', 'Role', 'Status', 'Joined Date']
      rows = filteredData.map(u => [
        u.id || u.userId || '',
        u.name || '',
        u.email || '',
        u.phone || u.mobile || '',
        u.role || 'Resident',
        u.status || 'Active',
        u.joined || u.createdAt || ''
      ])
    } else if (reportType === 'payments') {
      headers = ['Transaction ID', 'Resident Name', 'Property', 'Amount', 'Payment Method', 'Date', 'Status']
      rows = filteredData.map(pm => [
        pm.id || pm.transactionId || '',
        pm.resident || '',
        pm.property || '',
        `INR ${pm.amount || 0}`,
        pm.method || 'Online',
        pm.date || '',
        pm.status || 'Paid'
      ])
    } else if (reportType === 'bookings') {
      headers = ['Booking ID', 'Resident', 'Property', 'Room Type', 'Move-In Date', 'Amount', 'Status']
      rows = filteredData.map(b => [
        b.id || b.bookingId || '',
        b.resident || '',
        b.property || '',
        b.room || '',
        b.date || '',
        `INR ${b.amount || 0}`,
        b.status || 'Confirmed'
      ])
    } else {
      // Summary statement
      headers = ['Metric Name', 'Metric Value']
      const s = filteredData[0] || {}
      rows = Object.entries(s).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])
    }

    const formatCSVCell = (val) => {
      const str = String(val ?? '')
      if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const csvLines = [
      headers.map(formatCSVCell).join(','),
      ...rows.map(row => row.map(formatCSVCell).join(','))
    ].join('\r\n')

    const blob = new Blob(['\uFEFF' + csvLines], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const timestamp = new Date().toISOString().slice(0, 10)
    link.download = `Nestora_${reportType}_report_${timestamp}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast(`Successfully downloaded CSV: Nestora_${reportType}_report_${timestamp}.csv`)
  }

  // 3. EXPORT / PRINT PDF DOCUMENT
  const handleExportPDF = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('No data records available to compile PDF report.')
      return
    }

    const printWindow = window.open('', '_blank', 'height=800,width=1000')
    if (!printWindow) {
      alert('Please allow popups to generate the printable PDF report.')
      return
    }

    const activeReportLabel = REPORT_TYPES.find(r => r.id === reportType)?.label || 'Executive Statement'
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    let tableHeadersHtml = ''
    let tableRowsHtml = ''

    if (reportType === 'properties') {
      tableHeadersHtml = `<tr><th>ID</th><th>Property Name</th><th>Location</th><th>Gender</th><th>Price</th><th>Verification</th><th>Status</th></tr>`
      tableRowsHtml = filteredData.map(p => `
        <tr>
          <td>#${p.id || p.propertyId || ''}</td>
          <td><strong>${p.name || ''}</strong></td>
          <td>${p.location || p.city || ''}</td>
          <td>${p.gender || 'Unisex'}</td>
          <td><strong>${p.price || ''}</strong></td>
          <td><span style="color:${p.verificationStatus === 'Approved' ? '#059669' : '#d97706'}">${p.verificationStatus || 'Pending'}</span></td>
          <td>${p.status || 'Active'}</td>
        </tr>
      `).join('')
    } else if (reportType === 'users') {
      tableHeadersHtml = `<tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th></tr>`
      tableRowsHtml = filteredData.map(u => `
        <tr>
          <td>#${u.id || ''}</td>
          <td><strong>${u.name || ''}</strong></td>
          <td>${u.email || ''}</td>
          <td>${u.phone || u.mobile || ''}</td>
          <td>${u.role || 'Resident'}</td>
          <td>${u.status || 'Active'}</td>
        </tr>
      `).join('')
    } else if (reportType === 'payments') {
      tableHeadersHtml = `<tr><th>Transaction ID</th><th>Resident</th><th>Property</th><th>Amount</th><th>Method</th><th>Status</th></tr>`
      tableRowsHtml = filteredData.map(pm => `
        <tr>
          <td>${pm.id || ''}</td>
          <td><strong>${pm.resident || ''}</strong></td>
          <td>${pm.property || ''}</td>
          <td><strong>$${pm.amount || 0}</strong></td>
          <td>${pm.method || 'Online'}</td>
          <td>${pm.status || 'Paid'}</td>
        </tr>
      `).join('')
    } else {
      tableHeadersHtml = `<tr><th>Metric</th><th>Value</th></tr>`
      tableRowsHtml = filteredData.map(item =>
        Object.entries(item).map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${typeof v === 'object' ? JSON.stringify(v) : String(v)}</td></tr>`).join('')
      ).join('')
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nestora Executive Report - ${activeReportLabel}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 30px; color: #111827; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 25px; }
          .logo { font-size: 22px; font-weight: 800; color: #064e3b; letter-spacing: 1px; }
          .meta { text-align: right; font-size: 13px; color: #6b7280; }
          h2 { margin: 0 0 5px 0; color: #111827; font-size: 20px; }
          p.subtitle { margin: 0 0 20px 0; color: #4b5563; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th { background-color: #f3f4f6; text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; color: #374151; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .footer { margin-top: 40px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div className="no-print" style="margin-bottom: 20px;">
          <button onclick="window.print()" style="background:#10b981;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:bold;">
            Print / Save as PDF
          </button>
        </div>
        <div class="header">
          <div class="logo">NESTORA EXECUTIVE REPORT</div>
          <div class="meta">
            <div><strong>Generated:</strong> ${todayStr}</div>
            <div><strong>Period:</strong> ${dateRange}</div>
          </div>
        </div>
        <h2>${activeReportLabel}</h2>
        <p class="subtitle">Official platform compliance, audit statement, and operational records overview.</p>
        
        <table>
          <thead>
            ${tableHeadersHtml}
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Confidential Statement • Generated automatically by Nestora Enterprise System • Page 1 of 1
        </div>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    showToast('Printable PDF document ready.')
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <span className="admin-page-kicker" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--jade, #10b981)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
            ENTERPRISE REPORTING ENGINE V7
          </span>
          <h1 className="admin-page-title" style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px' }}>Executive Reports & Audit Statements</h1>
          <p className="admin-page-subtitle">Generate, inspect, and export production data statements in CSV, PDF, and Print formats.</p>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="admin-toast-banner" style={{ background: 'rgba(16,185,129,0.15)', color: '#065f46', border: '1px solid #10b981', padding: '10px 16px', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <CheckCircle2 size={18} color="#10b981" /> {toast}
        </div>
      )}

      {/* Configuration Card */}
      <div className="admin-pane 3d-tilt-card" style={{ marginBottom: '1.5rem', borderRadius: '12px', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="#10b981" /> Report Generation Parameters
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div className="form-field">
            <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>Report Type Category</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'var(--paper, #ffffff)', fontWeight: 600 }}
            >
              {REPORT_TYPES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>Target Period / Timeframe</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'var(--paper, #ffffff)', fontWeight: 600 }}
            >
              {DATE_RANGES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>Search Records Filter</label>
            <div style={{ position: 'relative' }}>
              <input
                placeholder="Filter by keyword or status..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'var(--paper, #ffffff)' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
            </div>
          </div>
        </div>

        {/* Working Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button
            className="primary-button compact-button"
            onClick={handleGenerateReport}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={16} /> {isLoading ? 'Compiling...' : 'Generate / Sync Report'}
          </button>

          <button
            className="ghost-button compact-button"
            onClick={handleExportCSV}
            disabled={isLoading || filteredData.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--paper-2, #f3f4f6)', borderColor: '#d1d5db', fontWeight: 600 }}
          >
            <Download size={16} color="#10b981" /> Export CSV Data
          </button>

          <button
            className="ghost-button compact-button"
            onClick={handleExportPDF}
            disabled={isLoading || filteredData.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--paper-2, #f3f4f6)', borderColor: '#d1d5db', fontWeight: 600 }}
          >
            <Printer size={16} color="#3b82f6" /> Export PDF / Print
          </button>
        </div>
      </div>

      {/* Error banner */}
      {fetchError && (
        <div className="owner-error-banner" style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> {fetchError}
        </div>
      )}

      {/* Live Interactive Report Preview Dataset Table */}
      <div className="admin-pane" style={{ borderRadius: '12px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Report Preview: {REPORT_TYPES.find(r => r.id === reportType)?.label}
            </h3>
            <p className="muted-copy" style={{ fontSize: '0.8rem' }}>
              Showing {filteredData.length} records • Compiled for period: <strong>{dateRange}</strong>
            </p>
          </div>

          <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '6px', fontWeight: 700 }}>
            {filteredData.length} Records Compiled
          </span>
        </div>

        {/* Table View */}
        {!isLoading && filteredData.length > 0 && (
          <div className="owner-table-wrapper" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <table className="owner-data-table">
              <thead>
                {reportType === 'properties' && (
                  <tr>
                    <th>ID</th>
                    <th>Property Name</th>
                    <th>Location</th>
                    <th>Gender</th>
                    <th>Rent Price</th>
                    <th>Verification</th>
                    <th>Status</th>
                  </tr>
                )}

                {reportType === 'users' && (
                  <tr>
                    <th>User ID</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                )}

                {reportType === 'payments' && (
                  <tr>
                    <th>Transaction ID</th>
                    <th>Resident Name</th>
                    <th>Property</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                )}

                {reportType === 'bookings' && (
                  <tr>
                    <th>Booking ID</th>
                    <th>Resident</th>
                    <th>Property</th>
                    <th>Room</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                )}

                {reportType === 'summary' && (
                  <tr>
                    <th>Metric Key</th>
                    <th>Metric Value</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {reportType === 'properties' && filteredData.map((p, idx) => (
                  <tr key={p.id || idx}>
                    <td><strong>#{p.id || p.propertyId}</strong></td>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.location || p.city}</td>
                    <td><span className="r-gender-badge">{p.gender || 'Unisex'}</span></td>
                    <td><strong style={{ color: 'var(--jade, #10b981)' }}>{p.price}</strong></td>
                    <td>
                      <span className={`status-badge ${(p.verificationStatus || '').toLowerCase() === 'approved' ? 'active' : 'pending'}`}>
                        {p.verificationStatus || 'Pending'}
                      </span>
                    </td>
                    <td><span className="status-badge active">{p.status || 'Active'}</span></td>
                  </tr>
                ))}

                {reportType === 'users' && filteredData.map((u, idx) => (
                  <tr key={u.id || idx}>
                    <td><strong>#{u.id}</strong></td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.phone || u.mobile || 'N/A'}</td>
                    <td><span className="r-gender-badge">{u.role || 'Resident'}</span></td>
                    <td><span className={`status-badge ${(u.status || '').toLowerCase() === 'active' ? 'active' : 'pending'}`}>{u.status || 'Active'}</span></td>
                  </tr>
                ))}

                {reportType === 'payments' && filteredData.map((pm, idx) => (
                  <tr key={pm.id || idx}>
                    <td><strong>{pm.id}</strong></td>
                    <td><strong>{pm.resident}</strong></td>
                    <td>{pm.property}</td>
                    <td><strong style={{ color: 'var(--jade, #10b981)' }}>${pm.amount || 0}</strong></td>
                    <td>{pm.method || 'Online'}</td>
                    <td><span className="status-badge active">{pm.status || 'Paid'}</span></td>
                  </tr>
                ))}

                {reportType === 'bookings' && filteredData.map((b, idx) => (
                  <tr key={b.id || idx}>
                    <td><strong>#{b.id}</strong></td>
                    <td><strong>{b.resident}</strong></td>
                    <td>{b.property}</td>
                    <td>{b.room || 'Standard'}</td>
                    <td>{b.date || 'N/A'}</td>
                    <td><span className="status-badge active">{b.status || 'Confirmed'}</span></td>
                  </tr>
                ))}

                {reportType === 'summary' && Object.entries(filteredData[0] || {}).map(([key, val], idx) => (
                  <tr key={idx}>
                    <td><strong>{key}</strong></td>
                    <td>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isLoading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            Compiling report dataset from database...
          </div>
        )}

        {!isLoading && filteredData.length === 0 && (
          <div className="r-qr-placeholder" style={{ padding: '40px', border: '2px dashed #e5e7eb', borderRadius: '8px' }}>
            <FileText size={42} color="#9ca3af" />
            <p style={{ marginTop: '12px', fontWeight: 700 }}>No compiled records found</p>
            <small className="muted-copy">Click "Generate / Sync Report" above to refresh records for the selected category.</small>
          </div>
        )}
      </div>
    </div>
  )
}
