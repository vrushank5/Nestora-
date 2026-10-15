import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Star, ShieldCheck, Heart, GitCompare, CalendarDays, BookOpen, Image as ImageIcon,
  Wifi, Coffee, Car, Wind, Shield, Tv, Droplets, X, ChevronLeft, ChevronRight,
  UtensilsCrossed, Zap, Sparkles, Dumbbell, Flame, CheckCircle2,
  Share2, AlertTriangle, ExternalLink, Bed, Clock
} from 'lucide-react'
import { apiRequest, getImageUrl } from '../../services/api.js'
import { propertyService } from '../../services/propertyService.js'
import { useAuth } from '../../context/useAuth.js'

const formatCurrency = (amount) => {
  const value = Number(amount)
  if (!Number.isFinite(value)) return 'Price unavailable'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

const localDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const dateAfterDays = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return localDateString(date)
}

const isRoomAvailable = (room) => {
  if (room?.status !== 'Available') return false
  const availableCount = room.availableCount ?? (
    room.capacity != null
      ? Number(room.capacity) - Number(room.occupiedCount || 0)
      : null
  )
  return availableCount == null || Number(availableCount) > 0
}

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
  const [roomsError, setRoomsError] = useState('')
  const [reviewsError, setReviewsError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  // Interactive UI States
  const [activeTab, setActiveTab] = useState('overview')
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [moveInDate, setMoveInDate] = useState(() => {
    return dateAfterDays(2)
  })
  const [stayDuration, setStayDuration] = useState('6 Months')
  const [toastMsg, setToastMsg] = useState('')

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccessData, setBookingSuccessData] = useState(null)
  const [bookingError, setBookingError] = useState('')
  const [visitError, setVisitError] = useState('')
  const [brokenImages, setBrokenImages] = useState(() => new Set())

  // Visit Form State
  const [visitDate, setVisitDate] = useState(() => {
    return dateAfterDays(1)
  })
  const [visitTimeSlot, setVisitTimeSlot] = useState('10:00 AM - 12:00 PM')
  const [visitNotes, setVisitNotes] = useState('')

  // Saved / Shortlist state
  const [saved, setSaved] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(`saved_${user?.userId || 'guest'}`) || '[]')
      return s.includes(Number(id)) || s.includes(String(id))
    } catch {
      return false
    }
  })

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  // Fetch Live Property, Rooms, and Reviews from Backend
  useEffect(() => {
    let active = true

    Promise.allSettled([
      propertyService.getPropertyById(id),
      apiRequest(`/rooms/property/${id}`).then(res => res.data || []),
      apiRequest(`/reviews/property/${id}`).then(res => res.data || [])
    ])
      .then(([propertyResult, roomsResult, reviewsResult]) => {
        if (!active) return

        if (propertyResult.status === 'rejected') throw propertyResult.reason
        const propData = propertyResult.value
        if (!propData) throw new Error('Property listing could not be found or is inactive.')

        setProperty(propData)
        setGalleryIdx(0)
        setBrokenImages(new Set())
        if (roomsResult.status === 'fulfilled') {
          const roomsData = Array.isArray(roomsResult.value) ? roomsResult.value : []
          setRooms(roomsData)
          setSelectedRoom(roomsData.find(isRoomAvailable) || null)
        } else {
          setRooms([])
          setSelectedRoom(null)
          setRoomsError(roomsResult.reason?.message || 'Unable to load room availability.')
        }
        if (reviewsResult.status === 'fulfilled') {
          setReviews(Array.isArray(reviewsResult.value) ? reviewsResult.value : [])
        } else {
          setReviews([])
          setReviewsError(reviewsResult.reason?.message || 'Unable to load property reviews.')
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
    return (property?.images || []).map(getImageUrl).filter(Boolean)
  }, [property])

  useEffect(() => {
    if (!lightbox) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setLightbox(false)
      if (event.key === 'ArrowLeft' && galleryImages.length) {
        setGalleryIdx((index) => (index - 1 + galleryImages.length) % galleryImages.length)
      }
      if (event.key === 'ArrowRight' && galleryImages.length) {
        setGalleryIdx((index) => (index + 1) % galleryImages.length)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightbox, galleryImages.length])

  const markImageBroken = (src) => {
    setBrokenImages((images) => new Set(images).add(src))
  }

  const availableRooms = useMemo(() => rooms.filter(isRoomAvailable), [rooms])
  const reviewRating = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length
    : null

  const toggleSave = () => {
    let s
    try {
      const parsed = JSON.parse(localStorage.getItem(`saved_${user?.userId || 'guest'}`) || '[]')
      s = Array.isArray(parsed) ? parsed : []
    } catch {
      s = []
    }
    const key = Number(id) || id
    const next = saved ? s.filter(x => x !== key && x !== String(key)) : [...s, key]
    localStorage.setItem(`saved_${user?.userId || 'guest'}`, JSON.stringify(next))
    setSaved(!saved)
    showToast(saved ? 'Removed from saved shortlist' : 'Added to your saved shortlist! ❤️')
  }

  const handleShare = () => {
    if (!navigator.clipboard?.writeText) {
      showToast('Sharing is not available in this browser.')
      return
    }
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Listing link copied to clipboard.'))
      .catch(() => showToast('Unable to copy the listing link.'))
  }

  // Handle Instant Booking Submission
  const handleConfirmBooking = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setBookingError('')
    setIsSubmitting(true)
    if (!selectedRoom || !isRoomAvailable(selectedRoom)) {
      setBookingError('Select a room that is currently available before requesting a booking.')
      setIsSubmitting(false)
      return
    }
    if (!moveInDate || moveInDate < localDateString(new Date())) {
      setBookingError('Choose a valid move-in date.')
      setIsSubmitting(false)
      return
    }
    const rentAmount = Number(selectedRoom.price)
    if (!Number.isFinite(rentAmount) || rentAmount <= 0) {
      setBookingError('This room does not have a valid monthly rent. Please contact support.')
      setIsSubmitting(false)
      return
    }

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
          room: selectedRoom.roomType,
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

    setVisitError('')
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
      showToast(`Visit request sent for ${visitDate} (${visitTimeSlot}).`)
    } catch (err) {
      console.error('Visit schedule error:', err)
      setVisitError(err.message || 'Failed to schedule visit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pricing computations
  const currentRent = selectedRoom ? Number(selectedRoom.price) : Number(property?.priceValue || 0)
  const currentDeposit = selectedRoom?.deposit ?? Number(property?.securityDeposit || 0)
  const totalInitial = currentRent + currentDeposit
  const canRequestBooking = Boolean(selectedRoom && isRoomAvailable(selectedRoom) && Number.isFinite(currentRent) && currentRent >= 0)
  const verificationApproved = property?.verificationStatus === 'Approved'

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
      <div className="r-property-breadcrumb">
        <Link to="/resident/explore" className="r-back-link" style={{ marginBottom: 0 }}>
          <ChevronLeft size={18} /> Explore properties
        </Link>
        <div className="r-property-actions">
          <button className="r-icon-btn-lg" type="button" onClick={handleShare} title="Share listing" aria-label="Share listing">
            <Share2 size={17} />
          </button>
          <button className={`r-icon-btn-lg ${saved ? 'r-saved' : ''}`} type="button" onClick={toggleSave} title={saved ? 'Remove from saved properties' : 'Save property'} aria-label={saved ? 'Remove from saved properties' : 'Save property'}>
            <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <Link to={`/resident/compare?property=${property.propertyId || property.id}`} className="r-icon-btn-lg" title="Compare listings" aria-label="Compare listings">
            <GitCompare size={18} />
          </Link>
        </div>
      </div>

      <div className="r-property-identity">
        <div className="r-property-badges">
          {verificationApproved && <span className="r-verified-badge"><ShieldCheck size={13} /> Verified by Nestora</span>}
          {property.gender && <span className="r-gender-badge">{property.gender} occupancy</span>}
          {availableRooms.length > 0 && <span className="r-property-availability">{availableRooms.length} room{availableRooms.length === 1 ? '' : 's'} available</span>}
        </div>
        <h1 className="r-detail-title">{property.name}</h1>
        <div className="r-property-location-rating">
          <span><MapPin size={16} aria-hidden="true" /> {property.location || [property.area, property.city].filter(Boolean).join(', ')}</span>
          {reviewRating != null && (
            <span className="r-property-rating">
              <Star size={15} fill="currentColor" aria-hidden="true" />
              <strong>{reviewRating.toFixed(1)}</strong>
              <span>({reviews.length} review{reviews.length === 1 ? '' : 's'})</span>
            </span>
          )}
        </div>
      </div>

      <div className="r-gallery">
        <div className="r-gallery-main">
          {galleryImages.length > 0 && !brokenImages.has(galleryImages[galleryIdx]) ? (
            <button className="r-gallery-image-button" type="button" onClick={() => setLightbox(true)} aria-label={`Open photo ${galleryIdx + 1} in fullscreen`}>
              <img
                src={galleryImages[galleryIdx]}
                alt={`${property.name} — photo ${galleryIdx + 1}`}
                onError={() => markImageBroken(galleryImages[galleryIdx])}
              />
            </button>
          ) : (
            <div className="r-gallery-empty" role="img" aria-label="No property photo available">
              <ImageIcon size={36} />
              <span>{galleryImages.length ? 'This photo is unavailable' : 'No property photos have been added yet'}</span>
            </div>
          )}
          {galleryImages.length > 0 && (
            <>
              <span className="r-gallery-count">{galleryIdx + 1} / {galleryImages.length}</span>
              <button className="r-gallery-tour" type="button" onClick={() => setLightbox(true)}>
                View photos
              </button>
            </>
          )}
          {galleryImages.length > 1 && (
            <>
              <button className="r-gallery-prev" type="button" aria-label="Previous photo" onClick={() => setGalleryIdx((galleryIdx - 1 + galleryImages.length) % galleryImages.length)}>
                <ChevronLeft size={20} />
              </button>
              <button className="r-gallery-next" type="button" aria-label="Next photo" onClick={() => setGalleryIdx((galleryIdx + 1) % galleryImages.length)}>
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {galleryImages.length > 1 && (
          <div className="r-gallery-thumbs" aria-label="Property photos">
            {galleryImages.map((img, i) => (
              <button key={`${img}-${i}`} type="button" className={`r-gallery-thumb ${i === galleryIdx ? 'active' : ''}`} onClick={() => setGalleryIdx(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === galleryIdx}>
                {brokenImages.has(img) ? <ImageIcon size={20} /> : <img src={img} alt="" onError={() => markImageBroken(img)} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Property photo gallery"
          >
            <div className="r-lightbox" onClick={e => e.stopPropagation()}>
              <button type="button" className="close-modal-btn" onClick={() => setLightbox(false)} aria-label="Close gallery">
                <X size={18} />
              </button>
              {brokenImages.has(galleryImages[galleryIdx]) ? (
                <div className="r-gallery-empty"><ImageIcon size={36} /><span>This photo is unavailable</span></div>
              ) : (
                <img src={galleryImages[galleryIdx]} alt={`${property.name} — photo ${galleryIdx + 1}`} onError={() => markImageBroken(galleryImages[galleryIdx])} />
              )}
              <div className="r-lightbox-nav">
                {galleryImages.length > 1 && (
                  <button type="button" aria-label="Previous photo" onClick={() => setGalleryIdx((galleryIdx - 1 + galleryImages.length) % galleryImages.length)}>
                    <ChevronLeft size={22} />
                  </button>
                )}
                <span>{galleryIdx + 1} / {galleryImages.length}</span>
                {galleryImages.length > 1 && (
                  <button type="button" aria-label="Next photo" onClick={() => setGalleryIdx((galleryIdx + 1) % galleryImages.length)}>
                    <ChevronRight size={22} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="r-v8-kpis">
        <div className="r-v8-kpi-card">
          <div className="r-v8-kpi-icon">
            <Bed size={20} />
          </div>
          <div>
            <span className="r-v8-kpi-label">MONTHLY RENT</span>
            <div className="r-v8-kpi-val">
              {formatCurrency(selectedRoom?.price ?? property.priceValue)}<span className="r-kpi-period"> / month</span>
            </div>
          </div>
        </div>

        {currentDeposit > 0 && (
          <div className="r-v8-kpi-card">
            <div className="r-v8-kpi-icon"><ShieldCheck size={20} /></div>
            <div>
              <span className="r-v8-kpi-label">SECURITY DEPOSIT</span>
              <div className="r-v8-kpi-val">{formatCurrency(currentDeposit)}</div>
            </div>
          </div>
        )}

        {availableRooms.length > 0 && (
          <div className="r-v8-kpi-card">
            <div className="r-v8-kpi-icon"><Clock size={20} /></div>
            <div>
              <span className="r-v8-kpi-label">AVAILABILITY</span>
              <div className="r-v8-kpi-val">{availableRooms.length} room{availableRooms.length === 1 ? '' : 's'} available</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left Details & Right Booking Card */}
      <div className="r-detail-grid">
        <div className="r-detail-info">
          <nav className="r-v8-tabs-nav" aria-label="Property details sections" role="tablist">
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
                type="button"
                role="tab"
                id={`property-tab-${t.id}`}
                aria-selected={activeTab === t.id}
                aria-controls={`property-panel-${t.id}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {(activeTab === 'overview' || activeTab === 'all') && (
            <section className="r-detail-section" id="property-panel-overview" role="tabpanel" aria-labelledby="property-tab-overview">
              <h2>About this Property</h2>
              {property.description
                ? <p className="r-property-description">{property.description}</p>
                : <p className="r-property-empty-copy">The property owner has not added a description yet.</p>}

              <dl className="r-property-facts">
                {property.city && <div><dt>City</dt><dd>{property.city}</dd></div>}
                {property.area && <div><dt>Locality</dt><dd>{property.area}</dd></div>}
                {property.gender && <div><dt>Occupancy policy</dt><dd>{property.gender}</dd></div>}
                {property.occupancy && property.occupancy !== 'New listing' && <div><dt>Listing status</dt><dd>{property.occupancy}</dd></div>}
              </dl>
            </section>
          )}

          {(activeTab === 'rooms' || activeTab === 'overview') && (
            <section className="r-detail-section" id="property-panel-rooms" role={activeTab === 'rooms' ? 'tabpanel' : undefined} aria-labelledby={activeTab === 'rooms' ? 'property-tab-rooms' : undefined}>
              <div className="r-property-section-heading">
                <div>
                  <h2>Room options</h2>
                  <p>Select an available room to include it in your booking request.</p>
                </div>
              </div>
              {roomsError ? (
                <div className="notification-error" role="alert">Room availability could not be loaded: {roomsError}</div>
              ) : rooms.length ? (
                <div className="r-property-room-list">
                  {rooms.map((room) => {
                    const isSelected = selectedRoom?.roomId === room.roomId
                    const available = isRoomAvailable(room)
                    const bedCount = room.availableCount ?? (
                      room.capacity != null ? Math.max(0, Number(room.capacity) - Number(room.occupiedCount || 0)) : null
                    )
                    const roomImage = galleryImages[0]
                    return (
                      <button
                        key={room.roomId}
                        type="button"
                        className={`r-v8-room-card ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                        onClick={() => available && setSelectedRoom(room)}
                        disabled={!available}
                        aria-pressed={isSelected}
                      >
                        {roomImage && !brokenImages.has(roomImage)
                          ? <img src={roomImage} alt="" className="r-v8-room-img" onError={() => markImageBroken(roomImage)} />
                          : <span className="r-room-image-placeholder"><ImageIcon size={24} /></span>}
                        <span className="r-room-card-content">
                          <span className="r-room-card-heading">
                            <strong>{room.roomType}</strong>
                            <span className={`r-room-status ${available ? 'available' : ''}`}>{available ? 'Available' : room.status || 'Unavailable'}</span>
                          </span>
                          <span className="r-room-price">{formatCurrency(room.price)} <small>/ month</small></span>
                          {bedCount != null && <span className="r-room-beds"><Bed size={14} /> {bedCount} bed{bedCount === 1 ? '' : 's'} available</span>}
                        </span>
                        <span className="r-room-select-state">{isSelected ? 'Selected' : available ? 'Select room' : 'Unavailable'}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="r-property-empty-state">
                  <Bed size={24} />
                  <strong>Room configurations aren’t listed yet</strong>
                  <span>You can request a property visit while the owner adds room availability.</span>
                </div>
              )}
            </section>
          )}

          {(activeTab === 'amenities' || activeTab === 'overview') && (
            <section className="r-detail-section" id="property-panel-amenities" role={activeTab === 'amenities' ? 'tabpanel' : undefined} aria-labelledby={activeTab === 'amenities' ? 'property-tab-amenities' : undefined}>
              <h2>Amenities</h2>
              {property.amenities?.length ? (
                <div className="r-amenities-grid r-property-amenities-grid">
                {property.amenities.map(a => {
                  const Icon = amenityIconMap[a] || Wifi
                  return (
                    <div key={a} className="r-v8-amenity-tile">
                      <span className="r-amenity-icon"><Icon size={18} /></span>
                      <span>{a}</span>
                    </div>
                  )
                })}
                </div>
              ) : <p className="r-property-empty-copy">No amenities have been listed for this property.</p>}
            </section>
          )}

          {(activeTab === 'rules' || activeTab === 'overview') && (
            <section className="r-detail-section" id="property-panel-rules" role={activeTab === 'rules' ? 'tabpanel' : undefined} aria-labelledby={activeTab === 'rules' ? 'property-tab-rules' : undefined}>
              <h2>House rules</h2>
              <p className="r-property-empty-copy">House rules have not been provided for this property.</p>
            </section>
          )}

          {(activeTab === 'location' || activeTab === 'overview') && (
            <section className="r-detail-section" id="property-panel-location" role={activeTab === 'location' ? 'tabpanel' : undefined} aria-labelledby={activeTab === 'location' ? 'property-tab-location' : undefined}>
              <h2>Neighborhood</h2>
              <div className="r-property-location-card">
                <div><strong>{property.name}</strong><p><MapPin size={15} /> {[property.location, property.area, property.city].filter(Boolean).join(', ')}</p></div>
                {(property.location || property.area || property.city) && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([property.location, property.area, property.city].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer" className="ghost-button compact-button">
                    <ExternalLink size={14} /> Open in Google Maps
                  </a>
                )}
              </div>
            </section>
          )}

          {(activeTab === 'reviews' || activeTab === 'overview') && (
            <section className="r-detail-section" id="property-panel-reviews" role={activeTab === 'reviews' ? 'tabpanel' : undefined} aria-labelledby={activeTab === 'reviews' ? 'property-tab-reviews' : undefined}>
              <div className="r-property-section-heading">
                <div><h2>Resident reviews</h2><p>{reviews.length} review{reviews.length === 1 ? '' : 's'} from this property</p></div>
                {reviewRating != null && <div className="r-property-rating"><Star size={16} fill="currentColor" /><strong>{reviewRating.toFixed(1)}</strong><span>out of 5</span></div>}
              </div>

              {reviewsError ? (
                <div className="notification-error" role="alert">Reviews could not be loaded: {reviewsError}</div>
              ) : reviews.length === 0 ? (
                <div className="r-property-empty-state">
                  <Star size={24} />
                  <strong>No reviews yet</strong>
                  <span>There aren’t any resident reviews for this property yet.</span>
                </div>
              ) : (
                <div className="r-property-review-list">
                  {reviews.map(r => (
                    <article key={r._id || r.id} className="r-property-review">
                      <div className="r-property-review-heading">
                        <strong>Resident review</strong>
                        <span><Star size={13} fill="currentColor" /> {Number(r.rating).toFixed(1)}</span>
                      </div>
                      {r.createdAt && <time dateTime={r.createdAt}>{new Date(r.createdAt).toLocaleDateString()}</time>}
                      <p>{r.comment}</p>
                      {r.ownerReply && <div className="r-property-owner-reply"><strong>Owner reply</strong><p>{r.ownerReply}</p></div>}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="r-booking-pane">
          <div className="r-v8-booking-card">
            <div className="r-booking-card-heading">
              <span className="r-v8-price-pill">Booking estimate</span>
              {verificationApproved && <span className="r-booking-verified"><ShieldCheck size={13} /> Verified</span>}
            </div>
            <div className="r-booking-price">{formatCurrency(currentRent)} <span>/ month</span></div>
            <p className="r-booking-selected">{selectedRoom ? `Selected: ${selectedRoom.roomType}` : 'Choose an available room to continue.'}</p>

            <div className="r-booking-control">
              <label htmlFor="property-move-in">Move-in date</label>
              <input
                id="property-move-in"
                type="date"
                required
                value={moveInDate}
                min={localDateString(new Date())}
                onChange={e => setMoveInDate(e.target.value)}
              />
            </div>

            <fieldset className="r-booking-duration">
              <legend>Stay duration</legend>
              <div>
                {['1 Month', '3 Months', '6 Months', '11 Months'].map(dur => (
                  <button
                    key={dur}
                    type="button"
                    aria-pressed={stayDuration === dur}
                    className={stayDuration === dur ? 'active' : ''}
                    onClick={() => setStayDuration(dur)}
                  >
                    {dur.replace(' Months', ' mo').replace(' Month', ' mo')}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="r-booking-breakdown">
              <div className="r-v8-bill-row">
                <span>Monthly rent</span>
                <strong>{formatCurrency(currentRent)}</strong>
              </div>
              {currentDeposit > 0 && <div className="r-v8-bill-row"><span>Refundable security deposit</span><strong>{formatCurrency(currentDeposit)}</strong></div>}
              {selectedRoom && <div className="r-v8-bill-total"><span>Rent + listed deposit</span><span>{formatCurrency(totalInitial)}</span></div>}
              <p>Final charges and terms are confirmed by the property owner.</p>
            </div>

            <div className="r-booking-actions">
              <button
                className="primary-button"
                type="button"
                disabled={!canRequestBooking || isSubmitting}
                onClick={() => {
                  setBookingError('')
                  setBookingSuccessData(null)
                  setShowBookingModal(true)
                }}
              >
                <BookOpen size={17} /> Request booking
              </button>
              <button
                className="ghost-button compact-button"
                type="button"
                onClick={() => { setVisitError(''); setShowVisitModal(true) }}
              >
                <CalendarDays size={16} /> Schedule a visit
              </button>
            </div>
            {!availableRooms.length && <p className="r-booking-unavailable">Booking requests are unavailable until room availability is published.</p>}
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
                    <ShieldCheck size={12} /> Booking request
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 12px' }}>
                  Review your booking request
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
                      <strong>{selectedRoom.roomType}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block' }}>MOVE-IN DATE</span>
                      <strong>{moveInDate}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block' }}>MONTHLY RENT</span>
                      <strong style={{ color: 'var(--jade)' }}>{formatCurrency(currentRent)} / month</strong>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block' }}>REFUNDABLE SECURITY DEPOSIT</span>
                      <strong>{formatCurrency(currentDeposit)}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block' }}>BOOKING STATUS</span>
                      <span className="status-badge pending">Pending owner review</span>
                    </div>
                  </div>
                </div>
                <p className="muted-copy" style={{ fontSize: '0.78rem', marginTop: '-8px', marginBottom: '14px' }}>
                  This is a request only. The owner will confirm availability and final terms before payment.
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
                    {isSubmitting ? 'Submitting...' : 'Submit booking request'}
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
                  Your booking request reference is <strong>#{bookingSuccessData.bookingId}</strong>. The property owner will review your request.
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
                <CalendarDays size={12} /> Property visit
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '6px 0 12px' }}>
              Schedule a Property Visit
            </h2>
            <p className="muted-copy" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
              Request a visit to <strong>{property.name}</strong>. The property owner will confirm the arrangement.
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
                  min={localDateString(new Date())}
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

              {visitError && <div className="notification-error" role="alert">{visitError}</div>}
              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="ghost-button compact-button" disabled={isSubmitting} onClick={() => setShowVisitModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button compact-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Requesting...' : 'Request visit'}
                </button>
              </div>
            </form>
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
