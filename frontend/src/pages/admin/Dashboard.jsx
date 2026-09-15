import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, ShieldAlert, Building2, TrendingUp, DollarSign, BadgeCheck,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Shield, CheckCircle2, Server, MapPin, Star,
  Eye, Check, X, Bell
} from 'lucide-react'
import { residences } from '../../data/homeData.js'
import { getToken } from '../../context/authStorage.js'

const statCards = [
  { id: 'users', label: 'TOTAL USERS', value: '2,480', change: '+12%', positive: true, icon: Users, color: 'var(--jade)', bg: 'rgba(10,111,91,0.1)' },
  { id: 'residents', label: 'ACTIVE RESIDENTS', value: '1,820', change: '+8%', positive: true, icon: UserCheck, color: 'var(--steel)', bg: 'rgba(49,86,108,0.1)' },
  { id: 'owners', label: 'PROPERTY OWNERS', value: '186', change: '+15%', positive: true, icon: ShieldAlert, color: '#9b6817', bg: 'rgba(229,168,67,0.1)' },
  { id: 'properties', label: 'TOTAL PROPERTIES', value: '324', change: '+5%', positive: true, icon: Building2, color: 'var(--jade)', bg: 'rgba(10,111,91,0.1)' },
  { id: 'occupancy', label: 'OCCUPANCY', value: '87%', change: '+3%', positive: true, icon: TrendingUp, color: 'var(--jade)', bg: 'rgba(10,111,91,0.1)' },
  { id: 'revenue', label: 'MONTHLY REVENUE', value: '₹24,85,000', change: '+14%', positive: true, icon: DollarSign, color: 'var(--jade)', bg: 'rgba(10,111,91,0.1)' },
  { id: 'verifications', label: 'PENDING VERIFICATIONS', value: '18', change: '-4%', positive: false, alert: true, icon: BadgeCheck, color: 'var(--terracotta)', bg: 'rgba(200,93,71,0.1)' },
  { id: 'complaints', label: 'OPEN COMPLAINTS', value: '27', change: '-2%', positive: false, alert: true, icon: AlertTriangle, color: 'var(--terracotta)', bg: 'rgba(200,93,71,0.1)' },
]

const alertCenterItems = [
  { id: 1, text: '18 Properties waiting for verification', tag: 'High Priority', path: '/admin/properties/verification' },
  { id: 2, text: '27 Unresolved complaints requiring attention', tag: 'Action Needed', path: '/admin/complaints' },
  { id: 3, text: '6 Reported reviews flagged by users', tag: 'Moderation', path: '/admin/reviews' },
  { id: 4, text: '12 Payment issues reported in last 24h', tag: 'Financial', path: '/admin/payments' },
]

const smartAlerts = [
  '⚠ Occupancy dropped below 60% at Green Home Co-Living.',
  '⚠ Property "Urban Living PG" has unusually high complaints this week.',
  '⚠ Multiple residents reported water supply issues in Bodakdev region.',
  '⚠ Payment failure rate increased by 1.2% in Surat region.',
]

const platformHealth = [
  { service: 'API Backend Server', status: 'Operational', color: 'var(--jade)' },
  { service: 'PostgreSQL Database', status: 'Operational', color: 'var(--jade)' },
  { service: 'Razorpay Payment Gateway', status: 'Operational', color: 'var(--jade)' },
  { service: 'Email Notification Service', status: 'Operational', color: 'var(--jade)' },
  { service: 'Cloudinary Image CDN', status: 'Operational', color: 'var(--jade)' },
]

const cityStats = [
  { city: 'Ahmedabad', properties: 124, residents: '1,240', occupancy: '89%', revenue: '₹14.2L' },
  { city: 'Surat', properties: 72, residents: '680', occupancy: '84%', revenue: '₹6.8L' },
  { city: 'Vadodara', properties: 45, residents: '390', occupancy: '82%', revenue: '₹3.85L' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [chartRange, setChartRange] = useState('30 Days')
  const [summary, setSummary] = useState({})

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/summary`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(response => response.json())
      .then(result => setSummary(result.data || {}))
  }, [])

  const dynamicStatCards = statCards.map(card => ({
    ...card,
    value: card.id === 'users' ? summary.totalUsers ?? '...' : card.id === 'residents' ? summary.residents ?? '...' : card.id === 'owners' ? summary.owners ?? '...' : card.id === 'properties' ? summary.properties ?? '...' : card.id === 'verifications' ? summary.pendingProperties ?? '...' : card.value,
  }))

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <span className="admin-page-kicker"><Shield size={14} /> SYSTEM OVERVIEW</span>
          <h1 className="admin-page-title">Good Morning, Admin</h1>
          <p className="admin-page-subtitle">Here's an overview of what's happening across the Nestora platform.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/admin/properties/verification" className="primary-button compact-button">
            <BadgeCheck size={16} /> Review Verifications (18)
          </Link>
        </div>
      </div>

      {/* 8 Stats Grid with subtle 3D hover */}
      <div className="admin-stats-grid">
        {dynamicStatCards.map(s => (
          <motion.div
            key={s.id}
            className={`admin-stat-card 3d-tilt-card ${s.alert ? 'alert-card' : ''}`}
            whileHover={{ y: -4, boxShadow: '0 16px 32px rgba(18,34,31,0.12)' }}
          >
            <div className="admin-stat-icon" style={{ background: s.bg, color: s.color }}>
              <s.icon size={20} />
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">{s.label}</span>
              <h3 className="admin-stat-val">{s.value}</h3>
              <span className={`admin-stat-trend ${s.positive ? 'up' : 'down'}`}>
                {s.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {s.change} vs prev month
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alert Center */}
      <div className="admin-pane alert-center-pane" style={{ marginBottom: '24px' }}>
        <div className="admin-pane-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="alert-icon-ring"><AlertTriangle size={18} /></div>
            <div>
              <h3>Alert Center</h3>
              <p className="muted-copy" style={{ fontSize: '0.82rem' }}>Priority items requiring administrative review</p>
            </div>
          </div>
          <Link to="/admin/properties/verification" className="admin-link">View All Alerts →</Link>
        </div>
        <div className="admin-alerts-grid">
          {alertCenterItems.map(item => (
            <div key={item.id} className="admin-alert-item">
              <div>
                <span className="admin-alert-tag">{item.tag}</span>
                <p>⚠ {item.text}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="primary-button compact-button" onClick={() => navigate(item.path)}>Review Now</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Charts & Smart Alerts */}
      <div className="admin-dashboard-grid" style={{ marginBottom: '24px' }}>
        {/* Left: Charts */}
        <div className="admin-pane">
          <div className="admin-pane-header">
            <div>
              <h3>Platform Overview</h3>
              <p className="muted-copy" style={{ fontSize: '0.82rem' }}>User & Revenue Growth trends</p>
            </div>
            <div className="admin-range-selector">
              {['7 Days', '30 Days', '3 Months', '6 Months', '1 Year'].map(r => (
                <button
                  key={r}
                  className={`admin-range-btn ${chartRange === r ? 'active' : ''}`}
                  onClick={() => setChartRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Visual */}
          <div className="admin-chart-mock">
            <div className="chart-legend">
              <span><i style={{ background: 'var(--jade)' }} /> Revenue (₹ Lakhs)</span>
              <span><i style={{ background: 'var(--steel)' }} /> New Users</span>
              <span><i style={{ background: 'var(--saffron)' }} /> Bookings</span>
            </div>
            <div className="css-bar-chart">
              {[
                { label: 'Jan', val1: 65, val2: 45, val3: 35 },
                { label: 'Feb', val1: 72, val2: 50, val3: 42 },
                { label: 'Mar', val1: 80, val2: 60, val3: 50 },
                { label: 'Apr', val1: 88, val2: 65, val3: 58 },
                { label: 'May', val1: 95, val2: 75, val3: 68 },
                { label: 'Jun', val1: 100, val2: 85, val3: 78 },
              ].map(bar => (
                <div key={bar.label} className="bar-group">
                  <div className="bar-stack">
                    <div className="b1" style={{ height: `${bar.val1}%` }} title={`Revenue: ₹${bar.val1}L`} />
                    <div className="b2" style={{ height: `${bar.val2}%` }} title={`Users: ${bar.val2}`} />
                  </div>
                  <span>{bar.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Smart Alerts & Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Smart Alerts */}
          <div className="admin-pane">
            <h3 style={{ marginBottom: '14px' }}>Smart System Alerts</h3>
            <div className="smart-alerts-list">
              {smartAlerts.map((sa, i) => (
                <div key={i} className="smart-alert-card">
                  <p>{sa}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Health */}
          <div className="admin-pane">
            <h3 style={{ marginBottom: '14px' }}>Platform Health</h3>
            <div className="platform-health-list">
              {platformHealth.map(h => (
                <div key={h.service} className="health-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server size={14} color="var(--muted)" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{h.service}</span>
                  </div>
                  <span className="health-status-badge">
                    <i style={{ background: h.color }} /> {h.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* City-wise Analytics & Verification Queue */}
      <div className="admin-dashboard-grid">
        {/* City-wise Analytics */}
        <div className="admin-pane">
          <div className="admin-pane-header">
            <h3>City-Wise Analytics</h3>
            <Link to="/admin/analytics" className="admin-link">Full Report →</Link>
          </div>
          <div className="owner-table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
            <table className="owner-data-table">
              <thead>
                <tr>
                  <th>City</th>
                  <th>Properties</th>
                  <th>Residents</th>
                  <th>Occupancy</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {cityStats.map(c => (
                  <tr key={c.city}>
                    <td><strong><MapPin size={13} /> {c.city}</strong></td>
                    <td>{c.properties}</td>
                    <td>{c.residents}</td>
                    <td><span className="status-badge active">{c.occupancy}</span></td>
                    <td><strong>{c.revenue}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Queue Preview */}
        <div className="admin-pane">
          <div className="admin-pane-header">
            <h3>Pending Verifications Queue</h3>
            <Link to="/admin/properties/verification" className="admin-link">View All (18) →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {residences.slice(0, 3).map(p => (
              <div key={p.id} className="admin-queue-card">
                <img src={p.image} alt={p.name} />
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>{p.name}</strong>
                  <small className="muted-copy" style={{ display: 'block' }}>{p.location} · Owner: Owner Partner</small>
                </div>
                <button className="primary-button compact-button" onClick={() => navigate('/admin/properties/verification')}>
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
