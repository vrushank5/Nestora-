import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MapPin, Star, Trash2, GitCompare, BookOpen } from 'lucide-react'
import { propertyService } from '../../services/propertyService.js'
import { getImageUrl } from '../../services/api.js'
import { useAuth } from '../../context/useAuth.js'

export default function Saved() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [savedIds, setSavedIds] = useState(() => JSON.parse(localStorage.getItem(`saved_${user?.userId || 'guest'}`) || '[]'))
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    propertyService.getAllProperties()
      .then(data => {
        const normalized = data.map(p => ({
          ...p,
          id: p.propertyId || p.id,
          image: getImageUrl(p.images?.[0] || p.image) || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'
        }))
        setProperties(normalized)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const savedProps = properties.filter(r => savedIds.includes(r.id) || savedIds.includes(String(r.id)) || savedIds.includes(Number(r.id)))

  const remove = (id) => {
    const next = savedIds.filter(x => x !== id && x !== String(id) && x !== Number(id))
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

      {!isLoading && savedProps.length === 0 ? (
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
                  <span className="r-card-rating">
                    <Star size={13} fill="currentColor" /> {prop.rating ? prop.rating.toFixed(1) : '4.8'}
                  </span>
                </div>
                <p className="r-card-location"><MapPin size={13} /> {prop.location || `${prop.area}, ${prop.city}`}</p>
                <div className="r-card-amenities">
                  {(prop.amenities || []).slice(0, 4).map(a => <span key={a} className="r-amenity-tag">{a}</span>)}
                </div>
                <div className="r-card-footer">
                  <strong className="r-card-price">
                    ${Number(prop.priceValue || 500).toLocaleString('en-US')}/mo
                  </strong>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to={`/resident/property/${prop.id}`} className="ghost-button compact-button">View</Link>
                    <Link to={`/resident/property/${prop.id}`} className="primary-button compact-button">
                      <BookOpen size={14} /> Book
                    </Link>
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
