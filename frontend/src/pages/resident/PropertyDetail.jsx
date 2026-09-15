import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Star, ShieldCheck, Heart, GitCompare, CalendarDays, BookOpen,
  Wifi, Coffee, Car, Wind, Shield, Tv, Droplets, X, ChevronLeft, ChevronRight, Phone
} from 'lucide-react'
import { residences } from '../../data/homeData.js'
import { useAuth } from '../../context/useAuth.js'

const amenityIconMap = { 'Wi-Fi': Wifi, 'Meals': Coffee, 'Parking': Car, 'AC': Wind, 'Security': Shield, 'Laundry': Tv, 'Housekeeping': Droplets }

const rooms = [
  { id: 1, type: 'Single Sharing', rent: 12000, deposit: 24000, beds: 1, available: 1, facilities: ['AC', 'Attached Bath', 'Wardrobe'], image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80' },
  { id: 2, type: 'Double Sharing', rent: 8500, deposit: 17000, beds: 2, available: 2, facilities: ['Wi-Fi', 'Wardrobe', 'Study Table'], image: 'https://images.unsplash.com/photo-1598928506311-c95d43b271d1?auto=format&fit=crop&w=800&q=80' },
  { id: 3, type: 'Triple Sharing', rent: 7000, deposit: 14000, beds: 3, available: 1, facilities: ['Wi-Fi', 'Wardrobe'], image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80' },
]

const galleryImages = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=85',
]

export default function PropertyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const property = residences.find(r => r.id === id) || residences[0]

  const [galleryIdx, setGalleryIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [saved, setSaved] = useState(() => {
    const s = JSON.parse(localStorage.getItem(`saved_${user?.userId || 'guest'}`) || '[]')
    return s.includes(id)
  })

  const toggleSave = () => {
    const s = JSON.parse(localStorage.getItem(`saved_${user?.userId || 'guest'}`) || '[]')
    const next = saved ? s.filter(x => x !== id) : [...s, id]
    localStorage.setItem(`saved_${user?.userId || 'guest'}`, JSON.stringify(next))
    setSaved(!saved)
  }

  const handleBook = (room) => {
    navigate('/resident/bookings/new', { state: { property, room } })
  }

  return (
    <div className="r-page r-detail-page">
      {/* Back */}
      <Link to="/resident/explore" className="r-back-link">
        <ChevronLeft size={18} /> Back to Explore
      </Link>

      {/* Gallery */}
      <div className="r-gallery">
        <div className="r-gallery-main" onClick={() => setLightbox(true)}>
          <img src={galleryImages[galleryIdx]} alt="Property" />
          <button className="r-gallery-prev" onClick={e => { e.stopPropagation(); setGalleryIdx((galleryIdx - 1 + galleryImages.length) % galleryImages.length) }}>
            <ChevronLeft size={20} />
          </button>
          <button className="r-gallery-next" onClick={e => { e.stopPropagation(); setGalleryIdx((galleryIdx + 1) % galleryImages.length) }}>
            <ChevronRight size={20} />
          </button>
          <button className="r-gallery-tour">📷 View All Photos</button>
        </div>
        <div className="r-gallery-thumbs">
          {galleryImages.map((img, i) => (
            <button key={i} className={`r-gallery-thumb ${i === galleryIdx ? 'active' : ''}`} onClick={() => setGalleryIdx(i)}>
              <img src={img} alt="" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(false)}>
            <div className="r-lightbox" onClick={e => e.stopPropagation()}>
              <button className="close-modal-btn" onClick={() => setLightbox(false)}><X size={18} /></button>
              <img src={galleryImages[galleryIdx]} alt="" />
              <div className="r-lightbox-nav">
                <button onClick={() => setGalleryIdx((galleryIdx - 1 + galleryImages.length) % galleryImages.length)}><ChevronLeft size={22} /></button>
                <span>{galleryIdx + 1} / {galleryImages.length}</span>
                <button onClick={() => setGalleryIdx((galleryIdx + 1) % galleryImages.length)}><ChevronRight size={22} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="r-detail-grid">
        {/* Left / Info */}
        <div className="r-detail-info">
          <div className="r-detail-header">
            <div>
              <div className="r-detail-badges">
                <span className="r-verified-badge"><ShieldCheck size={13} /> Verified</span>
                <span className="r-gender-badge">{property.gender}</span>
              </div>
              <h1 className="r-detail-title">{property.name}</h1>
              <div className="r-detail-meta">
                <span><MapPin size={14} /> {property.location}</span>
                <span><Star size={14} fill="var(--saffron)" color="var(--saffron)" /> {property.rating} · {property.reviews} reviews</span>
              </div>
            </div>
            <div className="r-detail-actions">
              <button className={`r-icon-btn-lg ${saved ? 'r-saved' : ''}`} onClick={toggleSave} title="Save">
                <Heart size={20} fill={saved ? 'currentColor' : 'none'} />
              </button>
              <Link to="/resident/compare" className="r-icon-btn-lg" title="Compare"><GitCompare size={20} /></Link>
            </div>
          </div>

          {/* About */}
          <section className="r-detail-section">
            <h2>About this property</h2>
            <p className="muted-copy">{property.description}</p>
          </section>

          {/* Amenities */}
          <section className="r-detail-section">
            <h2>Amenities</h2>
            <div className="r-amenities-grid">
              {property.amenities.map(a => {
                const Icon = amenityIconMap[a] || Wifi
                return (
                  <div key={a} className="r-amenity-item">
                    <span className="r-amenity-icon"><Icon size={18} /></span>
                    <span>{a}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Room Options */}
          <section className="r-detail-section">
            <h2>Room Options</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rooms.map(room => (
                <motion.div
                  key={room.id}
                  className={`r-room-card ${selectedRoom?.id === room.id ? 'selected' : ''}`}
                  whileHover={{ scale: 1.01 }}
                >
                  <img src={room.image} alt={room.type} />
                  <div className="r-room-info">
                    <div className="r-room-header">
                      <h4>{room.type}</h4>
                      <span className="r-room-avail">{room.available} bed{room.available !== 1 ? 's' : ''} available</span>
                    </div>
                    <p className="r-room-price">₹{room.rent.toLocaleString('en-IN')}<span>/month</span></p>
                    <p className="muted-copy" style={{ fontSize: '0.82rem' }}>Deposit: ₹{room.deposit.toLocaleString('en-IN')}</p>
                    <div className="r-amenity-tags-row">
                      {room.facilities.map(f => <span key={f} className="r-amenity-tag">{f}</span>)}
                    </div>
                  </div>
                  <button
                    className={selectedRoom?.id === room.id ? 'ghost-button compact-button' : 'primary-button compact-button'}
                    onClick={() => setSelectedRoom(selectedRoom?.id === room.id ? null : room)}
                  >
                    {selectedRoom?.id === room.id ? 'Deselect' : 'Select Room'}
                  </button>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Rules */}
          <section className="r-detail-section">
            <h2>Property Rules</h2>
            <ul className="r-rules-list">
              <li>Entry time: Before 11:00 PM</li>
              <li>No smoking inside the premises</li>
              <li>Visitors allowed in common areas only</li>
              <li>Pets not allowed</li>
            </ul>
          </section>
        </div>

        {/* Right / Booking Pane */}
        <aside className="r-booking-pane">
          <div className="r-booking-card">
            <h3>Starting from</h3>
            <p className="r-booking-price">{property.price.replace('Rs.', '₹')}</p>
            <div className="r-booking-details">
              <div><span>Property Type</span><strong>Co-Living / PG</strong></div>
              <div><span>Gender</span><strong>{property.gender}</strong></div>
              <div><span>Status</span><strong style={{ color: 'var(--jade)' }}>{property.occupancy}</strong></div>
            </div>
            {selectedRoom && (
              <div className="r-selected-room-info">
                <p>Selected: <strong>{selectedRoom.type}</strong></p>
                <p>Rent: <strong>₹{selectedRoom.rent.toLocaleString('en-IN')}/mo</strong></p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              <button
                className="primary-button"
                onClick={() => handleBook(selectedRoom || rooms[0])}
              >
                <BookOpen size={16} /> Book Now
              </button>
              <button className="ghost-button compact-button" onClick={() => navigate('/resident/visits')}>
                <CalendarDays size={16} /> Schedule Visit
              </button>
            </div>
            <div className="r-booking-contact">
              <Phone size={14} />
              <span>Contact property owner</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
