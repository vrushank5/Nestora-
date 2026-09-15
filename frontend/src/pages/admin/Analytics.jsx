import { useEffect, useState } from 'react'
import { TrendingUp, Users, Building2, BookOpen, DollarSign, Bed } from 'lucide-react'
import { getToken } from '../../context/authStorage.js'

export default function Analytics() {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/summary`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(response => { if (!response.ok) throw new Error('Unable to load analytics'); return response.json() })
      .then(result => setSummary(result.data || {}))
      .catch(() => setSummary({}))
  }, [])

  const data = summary || {}
  const occupancy = data.totalBeds ? Math.round((data.occupiedBeds / data.totalBeds) * 100) : 0
  const verificationTotal = data.verifiedProperties + data.pendingReviews + data.rejectedListings || 0
  const verificationPercent = verificationTotal ? Math.round((data.verifiedProperties / verificationTotal) * 100) : 0

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Platform Analytics</h1>
          <p className="admin-page-subtitle">Deep insights into user growth, revenue, property verification, and occupancy.</p>
        </div>
      </div>

      {/* Metrics breakdown */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(10,111,91,0.1)', color: 'var(--jade)' }}><Users size={20} /></div>
          <div><span className="admin-stat-label">ACTIVE RESIDENTS</span><h3 className="admin-stat-val">{data.residents ?? '...'}</h3></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(49,86,108,0.1)', color: 'var(--steel)' }}><Building2 size={20} /></div>
          <div><span className="admin-stat-label">PROPERTIES LISTED</span><h3 className="admin-stat-val">{data.properties ?? '...'} Active</h3></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(229,168,67,0.1)', color: '#9b6817' }}><BookOpen size={20} /></div>
          <div><span className="admin-stat-label">TOTAL BOOKINGS</span><h3 className="admin-stat-val">{data.bookings ?? '...'}</h3></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(10,111,91,0.1)', color: 'var(--jade)' }}><DollarSign size={20} /></div>
          <div><span className="admin-stat-label">PAID REVENUE</span><h3 className="admin-stat-val">₹{Number(data.revenue || 0).toLocaleString('en-IN')}</h3></div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="admin-dashboard-grid">
        <div className="admin-pane">
          <h3>Occupancy Distribution</h3>
          <div style={{ marginTop: '16px' }}>
            <div className="progress-row" style={{ marginBottom: '12px' }}>
              <div><span>Total Beds Registered</span><strong>{data.totalBeds ?? '...'} Beds</strong></div>
              <div className="progress-track"><i style={{ width: '100%' }} /></div>
            </div>
            <div className="progress-row" style={{ marginBottom: '12px' }}>
              <div><span>Occupied Beds</span><strong>{data.occupiedBeds ?? '...'} Beds ({occupancy}%)</strong></div>
              <div className="progress-track"><i style={{ width: `${occupancy}%`, background: 'var(--jade)' }} /></div>
            </div>
            <div className="progress-row">
              <div><span>Available Beds</span><strong>{data.availableBeds ?? '...'} Beds ({100 - occupancy}%)</strong></div>
              <div className="progress-track"><i style={{ width: `${100 - occupancy}%`, background: 'var(--saffron)' }} /></div>
            </div>
          </div>
        </div>

        <div className="admin-pane">
          <h3>Verification Health</h3>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="settings-row"><span>Verified Properties</span><strong>{data.verifiedProperties ?? '...'} ({verificationPercent}%)</strong></div>
            <div className="settings-row"><span>Pending Review</span><strong>{data.pendingReviews ?? '...'}</strong></div>
            <div className="settings-row"><span>Rejected Listings</span><strong>{data.rejectedListings ?? '...'}</strong></div>
          </div>
        </div>
      </div>
    </div>
  )
}
