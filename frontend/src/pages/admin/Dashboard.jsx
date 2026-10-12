import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Database,
  DoorOpen,
  Download,
  Eye,
  MapPin,
  MoreHorizontal,
  SearchCheck,
  Server,
  Shield,
  ShieldAlert,
  Sparkles,
  Star,
  UserCheck,
  Users,
  WalletCards,
  XCircle,
} from 'lucide-react'
import { residences } from '../../data/homeData.js'
import { getToken } from '../../context/authStorage.js'

const numberFormat = new Intl.NumberFormat('en-IN')

const ranges = ['7 Days', '30 Days', '90 Days', '1 Year']

const statCards = [
  { id: 'users', label: 'Total Users', value: '2,480', change: '+12.4%', helper: 'Residents, owners, admins', icon: Users, tone: 'jade', positive: true },
  { id: 'residents', label: 'Active Residents', value: '1,820', change: '+8.1%', helper: 'Live resident accounts', icon: UserCheck, tone: 'steel', positive: true },
  { id: 'owners', label: 'Property Owners', value: '186', change: '+15.2%', helper: 'Verified partners', icon: ShieldAlert, tone: 'saffron', positive: true },
  { id: 'properties', label: 'PG Properties', value: '324', change: '+5.7%', helper: 'Published and pending', icon: Building2, tone: 'jade', positive: true },
  { id: 'occupancy', label: 'Occupancy Rate', value: '87%', change: '+3.2%', helper: 'Across tracked beds', icon: DoorOpen, tone: 'steel', positive: true },
  { id: 'revenue', label: 'Monthly Revenue', value: 'Rs. 24.85L', change: '+14.8%', helper: 'Confirmed payments', icon: CircleDollarSign, tone: 'jade', positive: true },
  { id: 'verifications', label: 'Pending Checks', value: '18', change: '-4.0%', helper: 'Need document review', icon: BadgeCheck, tone: 'terracotta', positive: false, alert: true },
  { id: 'complaints', label: 'Open Complaints', value: '27', change: '-2.3%', helper: 'Awaiting response', icon: AlertTriangle, tone: 'terracotta', positive: false, alert: true },
]

const chartDataByRange = {
  '7 Days': [
    { label: 'Mon', revenue: 52, users: 36, bookings: 24 },
    { label: 'Tue', revenue: 61, users: 42, bookings: 34 },
    { label: 'Wed', revenue: 48, users: 39, bookings: 28 },
    { label: 'Thu', revenue: 72, users: 54, bookings: 42 },
    { label: 'Fri', revenue: 78, users: 59, bookings: 48 },
    { label: 'Sat', revenue: 84, users: 68, bookings: 56 },
    { label: 'Sun', revenue: 69, users: 51, bookings: 39 },
  ],
  '30 Days': [
    { label: 'W1', revenue: 62, users: 46, bookings: 32 },
    { label: 'W2', revenue: 78, users: 58, bookings: 44 },
    { label: 'W3', revenue: 91, users: 72, bookings: 61 },
    { label: 'W4', revenue: 100, users: 82, bookings: 70 },
  ],
  '90 Days': [
    { label: 'Apr', revenue: 64, users: 44, bookings: 38 },
    { label: 'May', revenue: 76, users: 61, bookings: 49 },
    { label: 'Jun', revenue: 82, users: 66, bookings: 55 },
    { label: 'Jul', revenue: 96, users: 78, bookings: 68 },
    { label: 'Aug', revenue: 88, users: 73, bookings: 63 },
    { label: 'Sep', revenue: 100, users: 86, bookings: 76 },
  ],
  '1 Year': [
    { label: 'Q1', revenue: 58, users: 44, bookings: 35 },
    { label: 'Q2', revenue: 74, users: 59, bookings: 51 },
    { label: 'Q3', revenue: 90, users: 73, bookings: 66 },
    { label: 'Q4', revenue: 100, users: 84, bookings: 78 },
  ],
}

const alertCenterItems = [
  { id: 1, text: '18 properties waiting for verification', tag: 'High Priority', path: '/admin/properties/verification', icon: BadgeCheck },
  { id: 2, text: '27 complaints need owner follow-up', tag: 'Action Needed', path: '/admin/complaints', icon: AlertTriangle },
  { id: 3, text: '6 reviews are flagged for moderation', tag: 'Moderation', path: '/admin/reviews', icon: Star },
  { id: 4, text: '12 payments need manual reconciliation', tag: 'Financial', path: '/admin/payments', icon: WalletCards },
]

const orders = [
  { id: 'BK-1082', guest: 'Aarav Mehta', property: 'Green Home Co-Living', amount: 'Rs. 18,500', status: 'approved', time: '12 min ago' },
  { id: 'BK-1081', guest: 'Nisha Patel', property: 'Urban Living PG', amount: 'Rs. 14,200', status: 'pending', time: '38 min ago' },
  { id: 'BK-1079', guest: 'Rahul Shah', property: 'Prime Nest PG', amount: 'Rs. 21,000', status: 'completed', time: '2 hr ago' },
  { id: 'BK-1075', guest: 'Meera Iyer', property: 'City Stay Hostel', amount: 'Rs. 11,900', status: 'cancelled', time: '4 hr ago' },
]

const activityFeed = [
  { id: 1, title: 'Owner submitted new KYC documents', meta: 'Urban Living PG, Bodakdev', time: '8 min ago', icon: SearchCheck, tone: 'jade' },
  { id: 2, title: 'Payment gateway retry succeeded', meta: 'Invoice PAY-8821 cleared', time: '24 min ago', icon: CheckCircle2, tone: 'steel' },
  { id: 3, title: 'Water supply complaint escalated', meta: 'Green Home Co-Living', time: '1 hr ago', icon: AlertTriangle, tone: 'terracotta' },
  { id: 4, title: 'New resident booking created', meta: 'Double sharing room, Ahmedabad', time: '2 hr ago', icon: BookOpen, tone: 'saffron' },
]

const platformHealth = [
  { service: 'API Backend Server', status: 'Operational', load: '42ms', color: 'var(--jade)' },
  { service: 'PostgreSQL Database', status: 'Operational', load: '21ms', color: 'var(--jade)' },
  { service: 'Payment Gateway', status: 'Operational', load: '99.9%', color: 'var(--jade)' },
  { service: 'Email Notifications', status: 'Queued', load: '14 jobs', color: 'var(--saffron)' },
]

const cityStats = [
  { city: 'Ahmedabad', properties: 124, residents: '1,240', occupancy: 89, revenue: 'Rs. 14.2L' },
  { city: 'Surat', properties: 72, residents: '680', occupancy: 84, revenue: 'Rs. 6.8L' },
  { city: 'Vadodara', properties: 45, residents: '390', occupancy: 82, revenue: 'Rs. 3.85L' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.055 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [chartRange, setChartRange] = useState('30 Days')
  const [summary, setSummary] = useState({})

  useEffect(() => {
    let ignore = false

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/summary`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(response => response.json())
      .then(result => {
        if (!ignore) setSummary(result.data || {})
      })
      .catch(() => {
        if (!ignore) setSummary({})
      })

    return () => {
      ignore = true
    }
  }, [])

  const dynamicStatCards = useMemo(() => statCards.map(card => {
    const liveValue = {
      users: summary.totalUsers,
      residents: summary.residents,
      owners: summary.owners,
      properties: summary.properties,
      verifications: summary.pendingProperties,
    }[card.id]

    return {
      ...card,
      value: liveValue !== undefined && liveValue !== null ? numberFormat.format(liveValue) : card.value,
    }
  }), [summary])

  const chartData = chartDataByRange[chartRange]
  const maxBarValue = Math.max(...chartData.flatMap(point => [point.revenue, point.users, point.bookings]))

  return (
    <motion.div className="admin-page admin-v7-page" variants={containerVariants} initial="hidden" animate="show">
      <motion.div className="admin-v7-hero" variants={itemVariants}>
        <div className="admin-v7-hero-copy">
          <span className="admin-page-kicker"><Shield size={14} /> Admin Dashboard V7</span>
          <h1 className="admin-page-title">Powerful, clean, interactive control center</h1>
          <p className="admin-page-subtitle">
            Monitor PG operations, users, orders, verification queues, payments, and platform health from one premium admin workspace.
          </p>
          <div className="admin-v7-hero-actions">
            <Link to="/admin/properties/verification" className="primary-button compact-button">
              <BadgeCheck size={16} /> Review Verifications
            </Link>
            <Link to="/admin/reports" className="ghost-button compact-button">
              <Download size={16} /> Export Report
            </Link>
          </div>
        </div>

        <div className="admin-v7-command-card">
          <div className="admin-v7-command-head">
            <span><Sparkles size={15} /> Live command summary</span>
            <MoreHorizontal size={18} />
          </div>
          <div className="admin-v7-command-grid">
            <div>
              <strong>87%</strong>
              <span>Occupancy</span>
            </div>
            <div>
              <strong>18</strong>
              <span>Pending checks</span>
            </div>
            <div>
              <strong>99.9%</strong>
              <span>Uptime</span>
            </div>
          </div>
          <div className="admin-v7-ops-meter">
            <span style={{ width: '72%' }} />
          </div>
          <small>Operational load is stable. Payment queue needs review before evening settlement.</small>
        </div>
      </motion.div>

      <motion.div className="admin-stats-grid admin-v7-stats-grid" variants={containerVariants}>
        {dynamicStatCards.map(card => (
          <motion.div
            key={card.id}
            className={`admin-stat-card admin-v7-stat-card tone-${card.tone} ${card.alert ? 'alert-card' : ''}`}
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <div className="admin-stat-icon">
              <card.icon size={21} />
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">{card.label}</span>
              <h3 className="admin-stat-val">{card.value}</h3>
              <p>{card.helper}</p>
              <span className={`admin-stat-trend ${card.positive ? 'up' : 'down'}`}>
                {card.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {card.change} vs last month
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div className="admin-v7-priority-strip" variants={itemVariants}>
        {alertCenterItems.map(item => (
          <button key={item.id} className="admin-v7-priority-item" onClick={() => navigate(item.path)}>
            <span className="admin-v7-priority-icon"><item.icon size={17} /></span>
            <span>
              <strong>{item.tag}</strong>
              <small>{item.text}</small>
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
      </motion.div>

      <div className="admin-v7-main-grid">
        <motion.section className="admin-pane admin-v7-analytics-pane" variants={itemVariants}>
          <div className="admin-pane-header">
            <div>
              <h3>Analytics & Statistics</h3>
              <p className="muted-copy">Revenue, user growth, and booking volume trends</p>
            </div>
            <div className="admin-range-selector">
              {ranges.map(range => (
                <button
                  key={range}
                  className={`admin-range-btn ${chartRange === range ? 'active' : ''}`}
                  onClick={() => setChartRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-v7-chart-shell">
            <div className="admin-v7-chart-legend">
              <span><i className="legend-revenue" /> Revenue</span>
              <span><i className="legend-users" /> Users</span>
              <span><i className="legend-bookings" /> Bookings</span>
            </div>
            <div className="admin-v7-bar-chart">
              {chartData.map(point => (
                <div key={point.label} className="admin-v7-bar-group">
                  <div className="admin-v7-bar-stack">
                    <motion.i
                      className="revenue"
                      initial={{ height: 0 }}
                      animate={{ height: `${(point.revenue / maxBarValue) * 100}%` }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      title={`Revenue: ${point.revenue}`}
                    />
                    <motion.i
                      className="users"
                      initial={{ height: 0 }}
                      animate={{ height: `${(point.users / maxBarValue) * 100}%` }}
                      transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                      title={`Users: ${point.users}`}
                    />
                    <motion.i
                      className="bookings"
                      initial={{ height: 0 }}
                      animate={{ height: `${(point.bookings / maxBarValue) * 100}%` }}
                      transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                      title={`Bookings: ${point.bookings}`}
                    />
                  </div>
                  <span>{point.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.aside className="admin-pane admin-v7-health-pane" variants={itemVariants}>
          <div className="admin-pane-header">
            <div>
              <h3>Platform Health</h3>
              <p className="muted-copy">PostgreSQL and service status</p>
            </div>
            <Server size={18} />
          </div>
          <div className="platform-health-list">
            {platformHealth.map(service => (
              <div key={service.service} className="health-row admin-v7-health-row">
                <div>
                  <Database size={14} />
                  <span>{service.service}</span>
                </div>
                <strong>{service.load}</strong>
                <span className="health-status-badge">
                  <i style={{ background: service.color }} /> {service.status}
                </span>
              </div>
            ))}
          </div>
        </motion.aside>
      </div>

      <div className="admin-v7-main-grid">
        <motion.section className="admin-pane" variants={itemVariants}>
          <div className="admin-pane-header">
            <div>
              <h3>Orders & Activity</h3>
              <p className="muted-copy">Recent bookings across your PG network</p>
            </div>
            <Link to="/admin/bookings" className="admin-link">View bookings</Link>
          </div>
          <div className="admin-v7-orders">
            {orders.map(order => (
              <button key={order.id} className="admin-v7-order-row" onClick={() => navigate('/admin/bookings')}>
                <span className="admin-v7-order-id">{order.id}</span>
                <span>
                  <strong>{order.guest}</strong>
                  <small>{order.property}</small>
                </span>
                <strong>{order.amount}</strong>
                <span className={`status-badge ${order.status}`}>{order.status}</span>
                <small><Clock3 size={13} /> {order.time}</small>
              </button>
            ))}
          </div>
        </motion.section>

        <motion.aside className="admin-pane" variants={itemVariants}>
          <div className="admin-pane-header">
            <div>
              <h3>Live Activity</h3>
              <p className="muted-copy">Micro events requiring awareness</p>
            </div>
            <Activity size={18} />
          </div>
          <div className="admin-v7-activity-feed">
            {activityFeed.map(item => (
              <div key={item.id} className={`admin-v7-activity-item tone-${item.tone}`}>
                <span><item.icon size={16} /></span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                  <em>{item.time}</em>
                </div>
              </div>
            ))}
          </div>
        </motion.aside>
      </div>

      <div className="admin-v7-bottom-grid">
        <motion.section className="admin-pane" variants={itemVariants}>
          <div className="admin-pane-header">
            <div>
              <h3>User & Data Management</h3>
              <p className="muted-copy">City performance suitable for PG admin decisions</p>
            </div>
            <Link to="/admin/analytics" className="admin-link">Full analytics</Link>
          </div>
          <div className="admin-v7-city-list">
            {cityStats.map(city => (
              <div key={city.city} className="admin-v7-city-row">
                <span><MapPin size={15} /> {city.city}</span>
                <strong>{city.properties} properties</strong>
                <small>{city.residents} residents</small>
                <div className="admin-v7-city-meter">
                  <i style={{ width: `${city.occupancy}%` }} />
                </div>
                <b>{city.occupancy}% occupied</b>
                <em>{city.revenue}</em>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section className="admin-pane" variants={itemVariants}>
          <div className="admin-pane-header">
            <div>
              <h3>Verification Queue</h3>
              <p className="muted-copy">Pending property review preview</p>
            </div>
            <Link to="/admin/properties/verification" className="admin-link">View all</Link>
          </div>
          <div className="admin-v7-queue-list">
            {residences.slice(0, 3).map((property, index) => (
              <div key={property.id} className="admin-queue-card admin-v7-queue-card">
                <img src={property.image} alt={property.name} />
                <div>
                  <strong>{property.name}</strong>
                  <small><MapPin size={12} /> {property.location}</small>
                  <span>{index === 0 ? 'Identity check' : index === 1 ? 'Photo review' : 'Rent proof'}</span>
                </div>
                <button className="admin-icon-button" onClick={() => navigate('/admin/properties/verification')} aria-label={`Review ${property.name}`}>
                  <Eye size={16} />
                </button>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section className="admin-pane admin-v7-action-pane" variants={itemVariants}>
          <div className="admin-pane-header">
            <div>
              <h3>Quick Controls</h3>
              <p className="muted-copy">Fast admin routes</p>
            </div>
            <Bell size={18} />
          </div>
          <div className="admin-v7-quick-actions">
            <button onClick={() => navigate('/admin/users')}><Users size={16} /> Manage users</button>
            <button onClick={() => navigate('/admin/properties')}><Building2 size={16} /> Audit PG data</button>
            <button onClick={() => navigate('/admin/payments')}><WalletCards size={16} /> Reconcile payments</button>
            <button onClick={() => navigate('/admin/complaints')}><XCircle size={16} /> Resolve complaints</button>
          </div>
        </motion.section>
      </div>
    </motion.div>
  )
}
