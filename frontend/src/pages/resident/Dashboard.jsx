import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen, Heart, MessageSquare, BadgeCheck, ArrowRight, TrendingUp, Star, ShieldCheck
} from 'lucide-react'
import { useAuth } from '../../context/useAuth.js'
import { apiRequest } from '../../services/api.js'
import { propertyService } from '../../services/propertyService.js'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const name = user?.name?.split(' ')[0] || 'Resident'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const savedHomes = JSON.parse(localStorage.getItem(`saved_${user?.userId || 'guest'}`) || '[]')
  const [properties, setProperties] = useState([])
  const [bookings, setBookings] = useState([])
  useEffect(() => {
    propertyService.getAllProperties().then(setProperties)
    apiRequest('/resident/bookings').then(result => setBookings(result.data || []))
  }, [])
  const activeBookings = bookings.filter(b => !['Cancelled', 'Completed'].includes(b.status)).length

  const stats = [
    { label: 'ACTIVE BOOKINGS', value: activeBookings, icon: BookOpen, color: 'var(--jade)', bg: 'rgba(10,111,91,0.1)' },
    { label: 'SAVED HOMES', value: savedHomes.length, icon: Heart, color: 'var(--terracotta)', bg: 'rgba(200,93,71,0.1)' },
    { label: 'MESSAGES', value: 0, icon: MessageSquare, color: 'var(--steel)', bg: 'rgba(49,86,108,0.1)' },
    { label: 'PROFILE', value: user?.isActive ? 'Active' : 'Incomplete', icon: BadgeCheck, color: 'var(--saffron)', bg: 'rgba(229,168,67,0.1)' },
  ]

  return (
    <motion.div className="r-page" variants={pageVariants} initial="initial" animate="animate">
      {/* Header */}
      <div className="r-page-header">
        <div>
          <p className="r-greeting-label">{greeting} 👋</p>
          <h1 className="r-page-title">{greeting}, {name}</h1>
          <p className="r-page-subtitle">Your bookings, saved homes, and stay details are collected here.</p>
        </div>
        <Link to="/resident/explore" className="primary-button">
          Explore PGs <ArrowRight size={16} />
        </Link>
      </div>

      {/* Stats */}
      <div className="r-stats-grid">
        {stats.map(s => (
          <motion.div
            key={s.label}
            className="r-stat-card"
            whileHover={{ y: -3, boxShadow: '0 20px 40px rgba(18,34,31,0.12)' }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <div className="r-stat-icon" style={{ background: s.bg, color: s.color }}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="r-stat-label">{s.label}</p>
              <h3 className="r-stat-value">{s.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="r-dashboard-grid">
        {/* Recommended Matches */}
        <div className="r-pane">
          <div className="r-pane-header">
            <h3>Recommended matches</h3>
            <Link to="/resident/explore" className="r-link">View all</Link>
          </div>
          <div className="r-property-list">
            {properties.slice(0, 4).map(prop => (
              <motion.button
                key={prop.id}
                className="r-property-row"
                whileHover={{ x: 3 }}
                onClick={() => navigate(`/resident/property/${prop.id}`)}
              >
                <img src={prop.image} alt={prop.name} />
                <div className="r-property-row-info">
                  <div className="r-property-row-top">
                    <strong>{prop.name}</strong>
                    {prop.occupancy === 'Verified host' && <ShieldCheck size={14} className="r-verified" />}
                  </div>
                  <small>{prop.location}</small>
                  <div className="r-property-row-meta">
                    <span className="r-price">{String(prop.price || '').replace('Rs.', '$').replace('₹', '$')}</span>
                    <span className="r-rating"><Star size={12} fill="currentColor" /> {prop.rating}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Next Action */}
          <div className="r-pane r-next-action">
            <div className="r-action-icon"><TrendingUp size={22} /></div>
            <h3>Next action</h3>
            <p className="muted-copy">Compare rooms before booking to find the best value for your budget and preferences.</p>
            <Link to="/resident/compare" className="primary-button compact-button" style={{ marginTop: '12px' }}>
              Compare Properties
            </Link>
          </div>

          {/* Quick Links */}
          <div className="r-pane">
            <h3 style={{ marginBottom: '14px' }}>Quick actions</h3>
            <div className="r-quick-links">
              <Link to="/resident/bookings" className="r-quick-link"><BookOpen size={16} /> My Bookings</Link>
              <Link to="/resident/payments" className="r-quick-link"><TrendingUp size={16} /> Payments</Link>
              <Link to="/resident/complaints" className="r-quick-link"><MessageSquare size={16} /> Complaints</Link>
              <Link to="/resident/saved" className="r-quick-link"><Heart size={16} /> Saved Homes</Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
