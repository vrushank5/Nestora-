import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, Heart, GitCompare, ShieldCheck, Star, MapPin, X, AlertTriangle, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/useAuth.js'
import { SkeletonCard } from '../../components/Skeleton.jsx'
import { propertyService } from '../../services/propertyService.js'
import { getImageUrl } from '../../services/api.js'

export default function Explore() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [budget, setBudget] = useState('Any')
  const [gender, setGender] = useState('Any')
  const [room, setRoom] = useState('Any')
  const [amenity, setAmenity] = useState('All')
  const [sort, setSort] = useState('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [savedIds, setSavedIds] = useState(() => JSON.parse(localStorage.getItem(`saved_${user?.userId || 'guest'}`) || '[]'))
  const [compareIds, setCompareIds] = useState([])

  // API data state
  const [allProperties, setAllProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const fetchProperties = () => {
    setIsLoading(true)
    setFetchError(null)
    propertyService.getAllProperties()
      .then(data => setAllProperties(data))
      .catch(err => setFetchError(err.message || 'Failed to load properties.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    let active = true
    propertyService.getAllProperties()
      .then(data => { if (active) setAllProperties(data) })
      .catch(err => { if (active) setFetchError(err.message || 'Failed to load properties.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])

  const toggleSave = (id) => {
    const next = savedIds.includes(id) ? savedIds.filter(x => x !== id) : [...savedIds, id]
    setSavedIds(next)
    localStorage.setItem(`saved_${user?.userId || 'guest'}`, JSON.stringify(next))
  }

  const toggleCompare = (id) => {
    if (compareIds.includes(id)) { setCompareIds(compareIds.filter(x => x !== id)); return }
    if (compareIds.length >= 3) return
    setCompareIds([...compareIds, id])
  }

  const filtered = useMemo(() => {
    let list = allProperties.filter(r => {
      const q = query.toLowerCase()
      const matchQ = !q || [r.name, r.location, r.city, r.area].some(v => v?.toLowerCase().includes(q))
      const matchB = budget === 'Any' || (budget === 'Under ₹8,000' && r.priceValue < 8000) || (budget === '₹8k–₹12k' && r.priceValue >= 8000 && r.priceValue <= 12000) || (budget === '₹12,000+' && r.priceValue > 12000)
      const matchG = gender === 'Any' || r.gender === gender || r.gender === 'Unisex'
      const matchR = room === 'Any' || (r.roomTypes || []).includes(room)
      const matchA = amenity === 'All' || (r.amenities || []).includes(amenity)
      return matchQ && matchB && matchG && matchR && matchA
    })
    if (sort === 'price-low') list = [...list].sort((a, b) => a.priceValue - b.priceValue)
    if (sort === 'price-high') list = [...list].sort((a, b) => b.priceValue - a.priceValue)
    if (sort === 'rating') list = [...list].sort((a, b) => Number(b.rating) - Number(a.rating))
    return list
  }, [allProperties, query, budget, gender, room, amenity, sort])


  return (
    <div className="r-page">
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">Find your next place to live</h1>
          <p className="r-page-subtitle">Search verified PGs, hostels and co-living spaces across your city.</p>
        </div>
      </div>

      {/* Smart Search Bar */}
      <div className="r-smart-search">
        <div className="r-search-inner">
          <Search size={18} />
          <input
            placeholder='Search by city, area, college or company... e.g. "Bodakdev under ₹9000"'
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && <button className="r-search-clear" onClick={() => setQuery('')}><X size={16} /></button>}
        </div>
        <button className="ghost-button compact-button r-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={16} /> Filters {showFilters ? '↑' : '↓'}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div className="r-filters-panel" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="r-filters-grid">
            <div className="r-filter-group">
              <label>Budget</label>
              <select value={budget} onChange={e => setBudget(e.target.value)}>
                <option>Any</option><option>Under ₹8,000</option><option>₹8k–₹12k</option><option>₹12,000+</option>
              </select>
            </div>
            <div className="r-filter-group">
              <label>Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)}>
                <option>Any</option><option>Male</option><option>Female</option><option>Unisex</option>
              </select>
            </div>
            <div className="r-filter-group">
              <label>Room Type</label>
              <select value={room} onChange={e => setRoom(e.target.value)}>
                <option>Any</option><option>Single</option><option>Twin Sharing</option><option>Triple Sharing</option><option>Studio</option>
              </select>
            </div>
            <div className="r-filter-group">
              <label>Amenity</label>
              <select value={amenity} onChange={e => setAmenity(e.target.value)}>
                <option>All</option><option>Wi-Fi</option><option>Meals</option><option>AC</option><option>Laundry</option><option>Security</option>
              </select>
            </div>
            <div className="r-filter-group">
              <label>Sort by</label>
              <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
          <button className="ghost-button compact-button" onClick={() => { setBudget('Any'); setGender('Any'); setRoom('Any'); setAmenity('All'); setSort('rating') }}>
            Clear Filters
          </button>
        </motion.div>
      )}

      {/* Results */}
      <div className="r-results-header">
        <p className="muted-copy">{isLoading ? 'Loading properties...' : `${filtered.length} properties found`}</p>
      </div>

      {/* Fetch Error */}
      {fetchError && !isLoading && (
        <div className="owner-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} />
            <span>{fetchError}</span>
          </div>
          <button type="button" className="ghost-button compact-button" onClick={fetchProperties}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="r-explore-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length > 0 ? (
        <div className="r-explore-grid">
          {filtered.map(prop => (
            <ExploreCard
              key={prop.id ?? prop.propertyId}
              prop={prop}
              saved={savedIds.includes(prop.id ?? prop.propertyId)}
              compared={compareIds.includes(prop.id ?? prop.propertyId)}
              onSave={() => toggleSave(prop.id ?? prop.propertyId)}
              onCompare={() => toggleCompare(prop.id ?? prop.propertyId)}
            />
          ))}
        </div>
      ) : !fetchError ? (
        <div className="empty-state">
          <Search size={42} />
          <h3>No properties found</h3>
          <p>Try adjusting your search terms or filters.</p>
          <button className="primary-button compact-button" onClick={() => { setQuery(''); setBudget('Any'); setGender('Any') }}>
            Clear Search
          </button>
        </div>
      ) : null}

      {/* Compare Bar */}
      {compareIds.length > 0 && (
        <motion.div className="r-compare-bar" initial={{ y: 80 }} animate={{ y: 0 }}>
          <span>{compareIds.length} selected for comparison</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="ghost-button compact-button" onClick={() => setCompareIds([])}>Clear</button>
            <Link to="/resident/compare" className="primary-button compact-button">Compare Now</Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function ExploreCard({ prop, saved, compared, onSave, onCompare }) {
  const imgSrc = getImageUrl(prop.images?.[0] || prop.image || '')
  return (
    <motion.article
      className="r-explore-card"
      whileHover={{ y: -4, boxShadow: '0 24px 48px rgba(18,34,31,0.14)' }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="r-card-image">
        <img src={imgSrc} alt={prop.name} />
        <div className="r-card-badges">
          {(prop.occupancy === 'Verified host' || prop.occupancy === 'Few rooms left') && (
            <span className="r-verified-badge"><ShieldCheck size={12} /> Verified</span>
          )}
        </div>
        <div className="r-card-actions">
          <button className={`r-icon-btn ${saved ? 'r-saved' : ''}`} onClick={onSave} title="Save">
            <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button className={`r-icon-btn ${compared ? 'r-compared' : ''}`} onClick={onCompare} title="Compare">
            <GitCompare size={16} />
          </button>
        </div>
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
          <div>
            <strong className="r-card-price">{prop.price.replace('Rs.', '₹')}</strong>
            <small className="r-card-deposit">+ Security deposit</small>
          </div>
          <Link to={`/resident/property/${prop.id ?? prop.propertyId}`} className="primary-button compact-button">View Details</Link>
        </div>
      </div>
    </motion.article>
  )
}
