import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Star, ShieldCheck, Heart, GitCompare, CalendarDays, BookOpen,
  Wifi, Coffee, Car, Wind, Shield, Tv, Droplets, X, ChevronLeft, ChevronRight,
  Phone, UtensilsCrossed, Zap, Sparkles, Dumbbell, Flame, CheckCircle2,
  Share2, Copy, AlertTriangle, ArrowRight, ExternalLink, Bed, Clock, UserCheck
} from 'lucide-react'
import { apiRequest, getImageUrl } from '../../services/api.js'
import { propertyService } from '../../services/propertyService.js'
import { useAuth } from '../../context/useAuth.js'

// High-resolution fallback interior/exterior co-living images
const FALLBACK_GALLERY = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=85',
]

// Icon mapper for dynamic amenities
const amenityIconMap = {
  'Wi-Fi': Wifi,
  'Wifi': Wifi,
  'Meals': Coffee,
  'Food': UtensilsCrossed,
  'Parking': Car,
  'AC': Wind,
  'Air Conditioning': Wind,
  'Security': Shield,
  'CCTV': ShieldCheck,
  'Laundry': Tv,
  'Hot Water': Flame,
  'Power Backup': Zap,
  'Housekeeping': Sparkles,
  'Gym': Dumbbell,
  'Attached Washroom': Droplets,
}

export default function PropertyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Dynamic Data States
  const [property, setProperty] = useState(null)
  const [rooms, setRooms] = useState([])
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  // Interactive UI States
  const [activeTab, setActiveTab] = useState('overview')
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [moveInDate, setMoveInDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().split('T')[0]
  })
  const [stayDuration, setStayDuration] = useState('6 Months')
  const [toastMsg, setToastMsg] = useState('')

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccessData, setBookingSuccessData] = useState(null)
  const [bookingError, setBookingError] = useState('')

  // Visit Form State
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [visitTimeSlot, setVisitTimeSlot] = useState('11:00 AM - 01:00 PM')
  const [visitNotes, setVisitNotes] = useState('')

  // Saved / Shortlist state
  const [saved, setSaved] = useState(() => {
    const s = JSON.parse(localStorage.getItem(`saved_${user?.userId || 'guest'}`) || '[]')
    return s.includes(Number(id)) || s.includes(String(id))
  })

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  // Fetch Live Property, Rooms, and Reviews from Backend
  useEffect(() => {
    let active = true
    setIsLoading(true)
    setFetchError(null)

    Promise.all([
      propertyService.getPropertyById(id).catch(() => null),
      apiRequest(`/rooms/property/${id}`).then(res => res.data || []).catch(() => []),
      apiRequest(`/reviews/property/${id}`).then(res => res.data || []).catch(() => [])
    ])
      .then(([propData, roomsData, reviewsData]) => {
        if (!active) return

        if (!propData) {
          throw new Error('Property listing could not be found or is inactive.')
        }

        setProperty(propData)
        setReviews(reviewsData)

        // Process dynamic rooms from backend or create fallback structured rooms based on property
        if (roomsData.length > 0) {
          setRooms(roomsData)
          setSelectedRoom(roomsData[0])
        } else {
          // Construct realistic room options using property prices & roomTypes
          const basePrice = propData.priceValue || 9000
          const types = propData.roomTypes?.length > 0 ? propData.roomTypes : ['Single', 'Double']
          const generatedRooms = types.map((typeName, index) => {
            const multiplier = typeName.toLowerCase().includes('single') ? 1.25 : typeName.toLowerCase().includes('triple') ? 0.8 : 1
            const rentVal = Math.round(basePrice * multiplier)
            return {
              roomId: index + 1,
              roomType: `${typeName} Sharing Suite`,
              capacity: typeName.toLowerCase().includes('single') ? 1 : typeName.toLowerCase().includes('triple') ? 3 : 2,
              availableCount: 2,
              price: rentVal,
              deposit: propData.securityDeposit != null ? Number(propData.securityDeposit) : rentVal * 2,
              facilities: ['AC', 'Attached Washroom', 'Wi-Fi', 'Wardrobe', 'Study Desk'],
              status: 'Available'
            }
          })
          setRooms(generatedRooms)
          setSelectedRoom(generatedRooms[0])
        }
      })
      .catch(err => {
        if (active) {
          console.error('Property load error:', err)
          setFetchError(err.message || 'Failed to load property details.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [id])

  // Images gallery list
  const galleryImages = useMemo(() => {
    if (!property || !property.images || property.images.length === 0) {
      return FALLBACK_GALLERY
    }
    const realImgs = property.images.map(img => getImageUrl(img))
    // If fewer than 4 images, supplement with fallback images for rich gallery
    if (realImgs.length < 4) {
      return [...realImgs, ...FALLBACK_GALLERY.slice(realImgs.length)]
    }
    return realImgs
  }, [property])

  const toggleSave = () => {
    const s = JSON.parse(localStorage.getItem(`saved_${user?.userId || 'guest'}`) || '[]')
    const key = Number(id) || id
    const next = saved ? s.filter(x => x !== key && x !== String(key)) : [...s, key]
    localStorage.setItem(`saved_${user?.userId || 'guest'}`, JSON.stringify(next))
    setSaved(!saved)
    showToast(saved ? 'Removed from saved shortlist' : 'Added to your saved shortlist! ❤️')
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    showToast('Listing link copied to clipboard! 📋')
  }

  // Handle Instant Booking Submission
  const handleConfirmBooking = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setBookingError('')
    setIsSubmitting(true)
    const rentAmount = selectedRoom ? selectedRoom.price : (property.priceValue || 9000)

    try {
      const propertyId = Number(property.propertyId || property.id)
      if (!Number.isFinite(propertyId) || propertyId <= 0) {
        throw new Error('This property could not be identified. Please refresh and try again.')
      }

      const res = await apiRequest('/resident/bookings', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          roomId: selectedRoom?.roomId,
          date: moveInDate,
          amount: rentAmount,
          stayDuration,
          securityDeposit: currentDeposit,
          resident: user.name,
          property: property.name,
          room: selectedRoom?.roomType || 'Standard Room',
        })
      })

      if (!res.data?.bookingId) {
        throw new Error('The booking service did not confirm your reservation. Please try again.')
      }

      setBookingSuccessData(res.data)
      showToast('Booking request submitted successfully!')
    } catch (err) {
      console.error('Booking failed:', err)
      setBookingError(err.message || 'Failed to submit booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Schedule Visit Submission
  const handleScheduleVisit = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }

    setIsSubmitting(true)
    try {
      await apiRequest('/resident/visits', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: property.propertyId || property.id,
          propertyName: property.name,
          visitDate,
          visitTime: visitTimeSlot,
          notes: visitNotes,
        })
      })

      setShowVisitModal(false)
      showToast(`Visit successfully scheduled for ${visitDate} (${visitTimeSlot})! 🎉`)
    } catch (err) {
      console.error('Visit schedule error:', err)
      showToast(err.message || 'Failed to schedule visit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pricing computations
  const currentRent = selectedRoom ? Number(selectedRoom.price || 0) : (Number(property?.priceValue) || 9000)
  const currentDeposit = selectedRoom?.deposit ?? (
    property?.securityDeposit != null ? Number(property.securityDeposit) : currentRent * 2
  )
  const totalInitial = currentRent + currentDeposit

  if (isLoading) {
    return (
      <div className="r-page r-detail-page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <div style={{ width: '120px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }} />
        </div>
        <div style={{ height: '420px', background: '#e5e7eb', borderRadius: '16px', marginBottom: '24px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ height: '36px', width: '60%', background: '#e5e7eb', borderRadius: '6px' }} />
            <div style={{ height: '20px', width: '40%', background: '#e5e7eb', borderRadius: '6px' }} />
            <div style={{ height: '120px', background: '#e5e7eb', borderRadius: '12px' }} />
          </div>
          <div style={{ height: '400px', background: '#e5e7eb', borderRadius: '16px' }} />
        </div>
      </div>
    )
  }

  if (fetchError || !property) {
    return (
      <div className="r-page r-detail-page">
        <Link to="/resident/explore" className="r-back-link">
          <ChevronLeft size={18} /> Back to Explore
        </Link>
        <div className="owner-error-banner" style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', borderRadius: '12px', marginTop: '1rem', textAlign: 'center' }}>
          <AlertTriangle size={32} style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Listing Unavailable</h3>
          <p style={{ marginTop: '6px', color: '#7f1d1d' }}>{fetchError || 'Unable to retrieve property data.'}</p>
          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button className="primary-button compact-button" onClick={() => window.location.reload()}>
              Retry Loading
            </button>
            <Link to="/resident/explore" className="ghost-button compact-button">
              Explore Other Properties
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="r-page r-detail-page">
      {/* V8 Navigation & Back Link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Link to="/resident/explore" className="r-back-link" style={{ marginBottom: 0 }}>
          <ChevronLeft size={18} /> Back to Explore Verified PGs
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="r-icon-btn-lg" onClick={handleShare} title="Share Listing">
            <Share2 size={17} />
          </button>
          <button className={`r-icon-btn-lg ${saved ? 'r-saved' : ''}`} onClick={toggleSave} title="Save to Shortlist">
            <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <Link to="/resident/compare" className="r-icon-btn-lg" title="Compare Listings">
            <GitCompare size={18} />
          </Link>
        </div>
      </div>

      {/* V8 Kicker Badge */}
      <div>
        <span className="r-v8-kicker">
          <ShieldCheck size={14} /> VERIFIED CO-LIVING SUITE V8 · ID #{property.propertyId || property.id}
        </span>
      </div>

      {/* V8 Hero Gallery Section */}
      <div className="r-gallery">
        <div className="r-gallery-main" onClick={() => setLightbox(true)} style={{ boxShadow: '0 12px 36px rgba(0,0,0,0.1)' }}>
          <img src={galleryImages[galleryIdx]} alt={property.name} />
          <button
            className="r-gallery-prev"
            onClick={e => {
              e.stopPropagation()
              setGalleryIdx((galleryIdx - 1 + galleryImages.length) % galleryImages.length)
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="r-gallery-next"
            onClick={e => {
              e.stopPropagation()
              setGalleryIdx((galleryIdx + 1) % galleryImages.length)
            }}
          >
            <ChevronRight size={20} />
          </button>

          <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px' }}>
            <span style={{ background: 'rgba(17,24,39,0.75)', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={13} color="#10b981" /> 100% Verified Property
            </span>
          </div>

          <button className="r-gallery-tour">
            📷 Photo {galleryIdx + 1} of {galleryImages.length} · Fullscreen
          </button>
        </div>

        {/* Thumbnail Bar */}
        <div className="r-gallery-thumbs" style={{ marginTop: '10px' }}>
          {galleryImages.map((img, i) => (
            <button
              key={i}
              className={`r-gallery-thumb ${i === galleryIdx ? 'active' : ''}`}
              onClick={() => setGalleryIdx(i)}
            >
              <img src={img} alt={`Thumb ${i + 1}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
          >
            <div className="r-lightbox" onClick={e => e.stopPropagation()}>
              <button className="close-modal-btn" onClick={() => setLightbox(false)}>
                <X size={18} />
              </button>
              <img src={galleryImages[galleryIdx]} alt="Property High Res" />
              <div className="r-lightbox-nav">
                <button onClick={() => setGalleryIdx((galleryIdx - 1 + galleryImages.length) % galleryImages.length)}>
                  <ChevronLeft size={22} />
                </button>
                <span>{galleryIdx + 1} / {galleryImages.length}</span>
                <button onClick={() => setGalleryIdx((galleryIdx + 1) % galleryImages.length)}>
                  <ChevronRight size={22} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* V8 Key Metric Stat Cards */}
      <div className="r-v8-kpis">
        <div className="r-v8-kpi-card">
          <div className="r-v8-kpi-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            <Bed size={20} />
          </div>
          <div>
            <span className="r-v8-kpi-label">MONTHLY RENT</span>
            <div className="r-v8-kpi-val" style={{ color: '#10b981' }}>
              ${Number(property.priceValue || 500).toLocaleString('en-US')}<span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>/mo</span>
            </div>
          </div>
        </div>

        <div className="r-v8-kpi-card">
          <div className="r-v8-kpi-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="r-v8-kpi-label">SECURITY DEPOSIT</span>
            <div className="r-v8-kpi-val">
              ${Number(currentDeposit).toLocaleString('en-US')}
            </div>
          </div>
        </div>

        <div className="r-v8-kpi-card">
          <div className="r-v8-kpi-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
            <Clock size={20} />
          </div>
          <div>
            <span className="r-v8-kpi-label">OCCUPANCY STATUS</span>
            <div className="r-v8-kpi-val" style={{ color: '#d97706', fontSize: '1rem' }}>
              {property.occupancy || 'Available Now'}
            </div>
          </div>
        </div>

        <div className="r-v8-kpi-card">
          <div className="r-v8-kpi-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
            <UserCheck size={20} />
          </div>
          <div>
            <span className="r-v8-kpi-label">BROKERAGE FEE</span>
            <div className="r-v8-kpi-val" style={{ color: '#8b5cf6' }}>
              $0 <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>100% Zero</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Booking Card */}
      <div className="r-detail-grid">
        {/* Left Column */}
        <div className="r-detail-info">
          {/* Header Title & Badges */}
          <div className="r-detail-header" style={{ marginBottom: '16px' }}>
            <div>
              <div className="r-detail-badges">
                <span className="r-verified-badge"><ShieldCheck size={13} /> Verified by Nestora</span>
                <span className="r-gender-badge">{property.gender || 'Unisex'}</span>
                <span className="status-badge active">{property.occupancy || 'Available'}</span>
              </div>
              <h1 className="r-detail-title" style={{ fontWeight: 800, marginTop: '6px' }}>{property.name}</h1>
              <div className="r-detail-meta" style={{ marginTop: '8px' }}>
                <span>
                  <MapPin size={15} color="var(--jade)" /> {property.location || `${property.area}, ${property.city}`}
                </span>
                <span>
                  <Star size={15} fill="#f59e0b" color="#f59e0b" />
                  <strong>{property.rating ? property.rating.toFixed(1) : '4.8'}</strong> · ({property.reviews || reviews.length || 14} verified resident reviews)
                </span>
              </div>
            </div>
          </div>

          {/* V8 Tab Navigation */}
          <div className="r-v8-tabs-nav">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'rooms', label: `Room Options (${rooms.length})` },
              { id: 'amenities', label: `Amenities (${property.amenities?.length || 0})` },
              { id: 'rules', label: 'House Rules' },
              { id: 'location', label: 'Neighborhood' },
              { id: 'reviews', label: `Reviews (${reviews.length})` },
            ].map(t => (
              <button
                key={t.id}
                className={`r-v8-tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {(activeTab === 'overview' || activeTab === 'all') && (
            <section className="r-detail-section">
              <h2>About this Property</h2>
              <p className="muted-copy" style={{ fontSize: '0.96rem', lineHeight: 1.7 }}>
                {property.description || 'Welcome to this fully managed modern co-living space designed for working professionals and students seeking premium comfort, high-speed connectivity, and vibrant community living.'}
              </p>

              <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div style={{ background: 'var(--paper-2)', padding: '12px 16px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', fontWeight: 700 }}>CITY &amp; REGION</span>
                  <strong style={{ fontSize: '0.95rem', textTransform: 'capitalize' }}>{property.city}, {property.area}</strong>
                </div>
                <div style={{ background: 'var(--paper-2)', padding: '12px 16px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', fontWeight: 700 }}>GENDER POLICY</span>
                  <strong style={{ fontSize: '0.95rem' }}>{property.gender || 'Unisex'} Living</strong>
                </div>
                <div style={{ background: 'var(--paper-2)', padding: '12px 16px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', fontWeight: 700 }}>LOCK-IN PERIOD</span>
                  <strong style={{ fontSize: '0.95rem' }}>1 Month Minimum</strong>
                </div>
              </div>
            </section>
          )}

          {/* Tab 2: Room Options */}
          {(activeTab === 'rooms' || activeTab === 'overview') && (
            <section className="r-detail-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ margin: 0 }}>Available Room Configurations</h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--jade)', fontWeight: 700 }}>
                  Select a room to configure your booking
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rooms.map((room, idx) => {
                  const isSelected = selectedRoom?.roomId === room.roomId || (!selectedRoom && idx === 0)
                  const rRent = Number(room.price || property.priceValue || 9000)
                  const rDeposit = room.deposit || (rRent * 2)

                  return (
                    <motion.div
                      key={room.roomId || idx}
                      className={`r-v8-room-card ${isSelected ? 'selected' : ''}`}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedRoom(room)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img
                        src={room.image ? getImageUrl(room.image) : galleryImages[idx % galleryImages.length]}
                        alt={room.roomType}
                        className="r-v8-room-img"
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{room.roomType}</h4>
                          <span className="r-room-avail">
                            {room.availableCount ?? 2} beds available
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--jade)' }}>
                            ${rRent.toLocaleString('en-US')}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>/ month</span>
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginLeft: '8px' }}>
                            (Deposit: ${rDeposit.toLocaleString('en-US')})
                          </span>
                        </div>
                        <div className="r-amenity-tags-row" style={{ marginTop: '8px' }}>
                          {(room.facilities || ['AC', 'Wi-Fi', 'Attached Bath', 'Wardrobe']).map(f => (
                            <span key={f} className="r-amenity-tag" style={{ fontSize: '0.74rem' }}>{f}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <button
                          className={isSelected ? 'primary-button compact-button' : 'ghost-button compact-button'}
                          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRoom(room)
                          }}
                        >
                          {isSelected ? 'Selected' : 'Choose Room'}
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Tab 3: Amenities */}
          {(activeTab === 'amenities' || activeTab === 'overview') && (
            <section className="r-detail-section">
              <h2>Amenities &amp; Lifestyle Features</h2>
              <div className="r-amenities-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
                {(property.amenities || ['Wi-Fi', 'AC', 'Laundry', 'Meals', 'Parking', 'CCTV', 'Hot Water']).map(a => {
                  const Icon = amenityIconMap[a] || Wifi
                  return (
                    <div key={a} className="r-v8-amenity-tile">
                      <span className="r-amenity-icon" style={{ background: 'rgba(16,185,129,0.12)', padding: '8px', borderRadius: '8px', color: '#10b981' }}>
                        <Icon size={18} />
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{a}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Tab 4: Rules & Policies */}
          {(activeTab === 'rules' || activeTab === 'overview') && (
            <section className="r-detail-section">
              <h2>House Rules &amp; Tenancy Policies</h2>
              <ul className="r-rules-list">
                <li>🕒 Gate Closing Time: 11:00 PM (Prior notification required for late entry)</li>
                <li>🚭 No smoking or vaping inside bedrooms and common indoor spaces</li>
                <li>👥 Visitors permitted in designated reception &amp; lounge areas until 8:00 PM</li>
                <li>🐾 Pets are strictly not permitted in standard accommodations</li>
                <li>🧹 Professional housekeeping provided daily for common areas and twice a week for rooms</li>
                <li>⚡ Electricity charges calculated via sub-meter at local government tariffs</li>
              </ul>
            </section>
          )}

          {/* Tab 5: Neighborhood */}
          {(activeTab === 'location' || activeTab === 'overview') && (
            <section className="r-detail-section">
              <h2>Location &amp; Commute</h2>
              <div style={{ background: 'var(--paper-2)', borderRadius: '12px', padding: '16px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '1rem', display: 'block' }}>{property.name}</strong>
                    <p className="muted-copy" style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                      <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {property.location || `${property.area}, ${property.city}`}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.location || `${property.name} ${property.city}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ghost-button compact-button"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <ExternalLink size={14} /> Open in Google Maps
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* Tab 6: Reviews */}
          {(activeTab === 'reviews' || activeTab === 'overview') && (
            <section className="r-detail-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>Resident Reviews ({reviews.length})</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef3c7', padding: '4px 10px', borderRadius: '12px', color: '#92400e', fontWeight: 800, fontSize: '0.85rem' }}>
                  <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  {property.rating ? property.rating.toFixed(1) : '4.8'} / 5.0 Overall
                </div>
              </div>

              {reviews.length === 0 ? (
                <div style={{ background: 'var(--paper-2)', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                  <Star size={28} color="#d1d5db" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 700, margin: 0, color: '#4b5563' }}>Be the first verified resident to review {property.name}!</p>
                  <p className="muted-copy" style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                    Reviews are verified from tenants who completed their stay.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reviews.map(r => (
                    <div key={r._id || r.id} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{r.userName || r.residentName || 'Resident'}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 800 }}>★ {r.rating}</span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: '#4b5563', marginTop: '6px' }}>{r.comment || r.review}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Column: Sticky V8 Booking Card */}
        <aside className="r-booking-pane">
          <div className="r-v8-booking-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="r-v8-price-pill">VERIFIED PRICING</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700 }}>Direct Owner</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--jade)' }}>
                ${currentRent.toLocaleString('en-US')}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 700 }}>/ month</span>
            </div>
            <p className="muted-copy" style={{ fontSize: '0.78rem', marginBottom: '16px' }}>
              Selected: <strong>{selectedRoom?.roomType || 'Standard Co-Living Room'}</strong>
            </p>

            {/* Move-in Date Picker */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#4b5563', marginBottom: '6px' }}>
                DESIRED MOVE-IN DATE
              </label>
              <input
                type="date"
                value={moveInDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setMoveInDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '0.88rem', fontWeight: 600, background: 'var(--paper-2)' }}
              />
            </div>

            {/* Stay Duration Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#4b5563', marginBottom: '6px' }}>
                STAY DURATION
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {['1 Mo', '3 Mo', '6 Mo', '11 Mo'].map(dur => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setStayDuration(dur)}
                    style={{
                      padding: '7px 4px',
                      borderRadius: '6px',
                      border: stayDuration === dur ? '1.5px solid var(--jade)' : '1px solid var(--line)',
                      background: stayDuration === dur ? 'rgba(16,185,129,0.1)' : 'var(--white)',
                      color: stayDuration === dur ? 'var(--jade)' : '#4b5563',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Pricing Breakdown */}
            <div style={{ background: 'var(--paper-2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px' }}>
              <div className="r-v8-bill-row">
                <span>Monthly Rent</span>
                <strong>${currentRent.toLocaleString('en-US')}</strong>
              </div>
              <div className="r-v8-bill-row">
                <span>Security Deposit (Refundable)</span>
                <strong>${currentDeposit.toLocaleString('en-US')}</strong>
              </div>
              <div className="r-v8-bill-row">
                <span>Maintenance &amp; High-Speed WiFi</span>
                <strong style={{ color: '#10b981' }}>Included</strong>
              </div>
              <div className="r-v8-bill-row">
                <span>Platform Brokerage</span>
                <strong style={{ color: '#10b981' }}>$0 (Free)</strong>
              </div>
              <div className="r-v8-bill-total">
                <span>Initial Payable at Move-in</span>
                <span style={{ color: 'var(--jade)' }}>${totalInitial.toLocaleString('en-US')}</span>
              </div>
            </div>

            {/* Action CTA Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="primary-button"
                style={{ width: '100%', padding: '12px', fontSize: '0.96rem', justifyContent: 'center' }}
                onClick={() => {
                  setBookingError('')
                  setBookingSuccessData(null)
                  setShowBookingModal(true)
                }}
              >
                <BookOpen size={17} /> Request Instant Booking
              </button>

              <button
                className="ghost-button compact-button"
                style={{ width: '100%', padding: '10px', fontSize: '0.88rem', justifyContent: 'center' }}
                onClick={() => setShowVisitModal(true)}
              >
                <CalendarDays size={16} /> Schedule Free Property Visit
              </button>
            </div>

            {/* Host / Owner Card */}
            <div className="r-v8-host-card">
              <div>
                <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 800, textTransform: 'uppercase' }}>VERIFIED HOST</span>
                <strong style={{ fontSize: '0.88rem', display: 'block', marginTop: '2px' }}>Nestora Partner Housing</strong>
                <span style={{ fontSize: '0.76rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <ShieldCheck size={12} /> Identity Verified
                </span>
              </div>
              <button
                className="ghost-button compact-button"
                style={{ fontSize: '0.76rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setShowContactModal(true)}
              >
                <Phone size={12} /> Contact Host
              </button>
            </div>

            {/* Safe Living Guarantee */}
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#6b7280' }}>
              <ShieldCheck size={16} color="var(--jade)" style={{ flexShrink: 0 }} />
              <span>100% Verified stay, zero lock-in disputes, 24/7 resident support guarantee.</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowBookingModal(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <button type="button" className="close-modal-btn" disabled={isSubmitting} onClick={() => setShowBookingModal(false)}>
              <X size={18} />
            </button>

            {!bookingSuccessData ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="r-v8-badge-verified">
                    <ShieldCheck size={12} /> Instant Lease Confirmation
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 12px' }}>
                  Confirm Booking Reservation
                </h2>
                <p className="muted-copy" style={{ fontSize: '0.88rem', marginBottom: '16px' }}>
                  Review your reservation details for <strong>{property.name}</strong> before submitting.
                </p>

                <div style={{ background: 'var(--paper-2)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block' }}>RESIDENT NAME</span>
                      <strong>{user?.name || 'Verified Resident'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block' }}>SELECTED ROOM</span>
                      <strong>{selectedRoom?.roomType || 'Standard Room'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block' }}>MOVE-IN DATE</span>
                      <strong>{moveInDate}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block' }}>MONTHLY RENT</span>
                      <strong style={{ color: 'var(--jade)' }}>${currentRent.toLocaleString('en-US')}/mo</strong>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block' }}>REFUNDABLE SECURITY DEPOSIT</span>
                      <strong>${Number(currentDeposit).toLocaleString('en-US')}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block' }}>PAYMENT STATUS</span>
                      <span className="status-badge pending">Pay After Approval</span>
                    </div>
                  </div>
                </div>
                <p className="muted-copy" style={{ fontSize: '0.78rem', marginTop: '-8px', marginBottom: '14px' }}>
                  The security deposit is recorded separately and is not included in the monthly rent payment.
                </p>

                {bookingError && (
                  <div className="owner-error-banner" role="alert" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <AlertTriangle size={18} />
                      <span>{bookingError}</span>
                    </div>
                  </div>
                )}

                <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="ghost-button compact-button" disabled={isSubmitting} onClick={() => setShowBookingModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="primary-button compact-button"
                    disabled={isSubmitting}
                    onClick={handleConfirmBooking}
                  >
                    {isSubmitting ? 'Confirming...' : 'Confirm Reservation'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Reservation Request Received!</h3>
                <p className="muted-copy" style={{ fontSize: '0.88rem', margin: '8px 0 16px' }}>
                  Your booking reference <strong>#{bookingSuccessData.bookingId}</strong> has been transmitted directly to the property manager for quick approval.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="primary-button compact-button"
                    onClick={() => {
                      setShowBookingModal(false)
                      navigate('/resident/bookings')
                    }}
                  >
                    View My Bookings
                  </button>
                  <button
                    type="button"
                    className="ghost-button compact-button"
                    onClick={() => {
                      setShowBookingModal(false)
                      setBookingSuccessData(null)
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Visit Modal */}
      {showVisitModal && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowVisitModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowVisitModal(false)}>
              <X size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="r-v8-badge-verified">
                <CalendarDays size={12} /> Free Physical Tour
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '6px 0 12px' }}>
              Schedule a Property Visit
            </h2>
            <p className="muted-copy" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
              Meet the property manager at <strong>{property.name}</strong> for a complimentary walkthrough.
            </p>

            <form onSubmit={handleScheduleVisit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#4b5563', marginBottom: '4px' }}>
                  SELECT VISIT DATE
                </label>
                <input
                  type="date"
                  required
                  value={visitDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setVisitDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--paper-2)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#4b5563', marginBottom: '4px' }}>
                  PREFERRED TIME SLOT
                </label>
                <select
                  value={visitTimeSlot}
                  onChange={e => setVisitTimeSlot(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--paper-2)' }}
                >
                  <option value="10:00 AM - 12:00 PM">Morning (10:00 AM - 12:00 PM)</option>
                  <option value="12:00 PM - 03:00 PM">Afternoon (12:00 PM - 03:00 PM)</option>
                  <option value="04:00 PM - 07:00 PM">Evening (04:00 PM - 07:00 PM)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#4b5563', marginBottom: '4px' }}>
                  SPECIAL REQUIREMENTS / NOTES (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Want to inspect the attached bathroom and study desk space..."
                  value={visitNotes}
                  onChange={e => setVisitNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--paper-2)', resize: 'none' }}
                />
              </div>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="ghost-button compact-button" onClick={() => setShowVisitModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button compact-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Scheduling...' : 'Confirm Free Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Host Modal */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowContactModal(false)}>
              <X size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="r-v8-badge-verified">
                <ShieldCheck size={12} /> Verified Nestora Partner
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Property Host Contact</h2>
            <p className="muted-copy" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
              Reach out to the property manager directly for inquiries or instant clarifications.
            </p>

            <div style={{ background: 'var(--paper-2)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>PROPERTY NAME</span>
                <strong>{property.name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>PRIMARY PHONE</span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--jade)' }}>+91 98765 43210</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>COMMUNICATION HOURS</span>
                <span style={{ fontSize: '0.85rem' }}>9:00 AM – 8:00 PM (Mon - Sun)</span>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <a
                href="tel:+919876543210"
                className="primary-button compact-button"
                style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
              >
                <Phone size={15} /> Call Host
              </a>
              <button
                className="ghost-button compact-button"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  navigator.clipboard?.writeText('+919876543210')
                  showToast('Phone number copied to clipboard!')
                }}
              >
                <Copy size={15} /> Copy Number
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Message */}
      {toastMsg && (
        <div className="r-v8-toast">
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  )
}
