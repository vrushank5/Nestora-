import { useEffect, useState } from 'react'
import { Users, DollarSign, Building2 } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function Analytics() {
  const [summary, setSummary] = useState(null)
  useEffect(() => { apiRequest('/owner/summary').then(response => setSummary(response.data || {})) }, [])
  const data = summary || {}
  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Analytics</h1>
          <p className="owner-subtitle">Detailed insights into your property performance.</p>
        </div>
        <select className="owner-select" style={{ padding: '10px 16px' }}><option>Last 30 Days</option><option>Last 6 Months</option><option>Last 1 Year</option></select>
      </div>

      <div className="owner-stats-grid mb-4" style={{ marginBottom: '24px' }}>
        <div className="owner-stat-card 3d-tilt-card"><div className="stat-icon"><Users size={22} /></div><div className="stat-details"><span className="stat-title">Avg Occupancy</span><div className="stat-value-row"><h3>{data.occupancy ?? '...'}%</h3></div></div></div>
        <div className="owner-stat-card 3d-tilt-card"><div className="stat-icon"><DollarSign size={22} /></div><div className="stat-details"><span className="stat-title">Avg Rent/Bed</span><div className="stat-value-row"><h3>${Number(data.averageRent || 0).toLocaleString('en-US')}</h3></div></div></div>
        <div className="owner-stat-card 3d-tilt-card"><div className="stat-icon"><Building2 size={22} /></div><div className="stat-details"><span className="stat-title">Total Bookings</span><div className="stat-value-row"><h3>{data.bookings ?? '...'}</h3></div></div></div>
      </div>

      <div className="owner-dashboard-content mb-4" style={{ marginBottom: '24px', gridTemplateColumns: '1fr 1fr' }}>
        <div className="dashboard-chart-pane 3d-tilt-card">
          <div className="pane-header"><h3>Revenue Trends</h3></div>
          <div className="mock-chart">
            <div className="css-chart-bars">
              {[0, 0, 0, 0, 0, 0, data.revenue ? 100 : 0].map((h, i) => <div key={i} className="bar" style={{ height: `${h}%` }}></div>)}
            </div>
            <div className="css-chart-labels"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span></div>
          </div>
        </div>
        <div className="dashboard-chart-pane 3d-tilt-card">
          <div className="pane-header"><h3>Occupancy Trends</h3></div>
          <div className="mock-chart">
            <div className="css-chart-bars">
              {[0, 0, 0, 0, 0, 0, data.occupancy || 0].map((h, i) => <div key={i} className="bar active" style={{ height: `${h}%`, background: 'var(--steel)' }}></div>)}
            </div>
            <div className="css-chart-labels"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
