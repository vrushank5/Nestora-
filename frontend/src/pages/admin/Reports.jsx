import { useState } from 'react'
import { FileText, Download } from 'lucide-react'

const reportTypes = [
  'User Growth & Retention Report',
  'Property Verification & Listing Audit',
  'Booking & Occupancy Analytics Report',
  'Payment & Financial Reconciliation Report',
  'Revenue & Commission Statement',
  'Complaint Escalation & Service SLA Report',
  'Review & Rating Moderation Report',
  'Beds & Room Capacity Report',
]

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(reportTypes[0])

  return (
    <div className="admin-page" style={{ maxWidth: '900px' }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Executive Reports</h1>
          <p className="admin-page-subtitle">Generate and export downloadable data statements and platform audits.</p>
        </div>
      </div>

      <div className="admin-pane" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Report Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-field">
            <label>Select Report Type</label>
            <select value={selectedReport} onChange={e => setSelectedReport(e.target.value)}>
              {reportTypes.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Date Range</label>
            <select><option>Last 30 Days</option><option>This Quarter</option><option>Year to Date</option></select>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '20px' }}>
          <button className="primary-button compact-button" onClick={() => alert(`Generating ${selectedReport}...`)}>
            <FileText size={15} /> Generate Report
          </button>
          <button className="ghost-button compact-button" onClick={() => alert('Exporting PDF file...')}>
            <Download size={15} /> Export PDF
          </button>
          <button className="ghost-button compact-button" onClick={() => alert('Exporting CSV file...')}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      <div className="admin-pane">
        <h3 style={{ marginBottom: '14px' }}>Report Preview: {selectedReport}</h3>
        <div className="r-qr-placeholder" style={{ padding: '40px' }}>
          <FileText size={48} color="var(--jade)" />
          <p style={{ marginTop: '12px', fontWeight: 700 }}>Report dataset ready for generation</p>
          <small className="muted-copy">Click "Generate Report" above to compile raw database records into visual export format.</small>
        </div>
      </div>
    </div>
  )
}
