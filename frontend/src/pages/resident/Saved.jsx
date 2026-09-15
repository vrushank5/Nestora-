import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MapPin, Star, Trash2, GitCompare, BookOpen } from 'lucide-react'
import { residences } from '../../data/homeData.js'
import { useAuth } from '../../context/useAuth.js'

export default function Saved() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [savedIds, setSavedIds] = useState(() => JSON.parse(localStorage.getItem(`saved_${user?.userId || 'guest'}`) || '[]'))

  const savedProps = residences.filter(r => savedIds.includes(r.id))

  const remove = (id) => {
    const next = savedIds.filter(x => x !== id)
    setSavedIds(next)
    localStorage.setItem(`saved_${user?.userId || 'guest'}`, JSON.stringify(next))
  }

  return (
    <div className="r-page">
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">Saved Homes</h1>
          <p className="r-page-subtitle">Your shortlist for comparing and booking.</p>
        </div>
        {savedProps.length > 0 && (
          <Link to="/resident/compare" className="ghost-button compact-button">
            <GitCompare size={16} /> Compare All
          </Link>
        )}
      </div>

      {savedProps.length === 0 ? (
        <div className="empty-state">
          <Heart size={42} />
          <h3>No saved homes yet</h3>
          <p>Save properties you like to compare and book them later.</p>
          <Link to="/resident/explore" className="primary-button compact-button">Explore PGs</Link>
        </div>
      ) : (
        <div className="r-explore-grid">
          {savedProps.map(prop => (
            <motion.article key={prop.id} className="r-explore-card" whileHover={{ y: -4 }}>
              <div className="r-card-image">
                <img src={prop.image} alt={prop.name} />
                <button className="r-icon-btn r-saved" onClick={() => remove(prop.id)} title="Remove from saved">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="r-card-body">
                <div className="r-card-header">
                  <h3>{prop.name}</h3>
                  <span className="r-card-rating"><Star size={13} fill="currentColor" /> {prop.rating}</span>
                </div>
                <p className="r-card-location"><MapPin size={13} /> {prop.location}</p>
                <div className="r-card-amenities">
                  {prop.amenities.map(a => <span key={a} className="r-amenity-tag">{a}</span>)}
                </div>
                <div className="r-card-footer">
                  <strong className="r-card-price">{prop.price.replace('Rs.', '₹')}</strong>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to={`/resident/property/${prop.id}`} className="ghost-button compact-button">View</Link>
                    <button className="primary-button compact-button" onClick={() => navigate('/resident/bookings/new', { state: { property: prop } })}>
                      <BookOpen size={14} /> Book
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  )
}
