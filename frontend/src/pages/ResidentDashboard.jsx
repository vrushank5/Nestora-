import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import {
  AlertCircle,
  BadgeCheck,
  BookOpen,
  Heart,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Star,
  User,
  X,
} from 'lucide-react'
import DashboardShell from '../components/DashboardShell.jsx'
import PropertyCard from '../components/PropertyCard.jsx'
import { useAuth } from '../context/useAuth.js'
import { bookings as initialBookingsData, residences } from '../data/homeData.js'

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'explore', label: 'Explore PGs', icon: Search },
  { id: 'bookings', label: 'Bookings', icon: BookOpen },
  { id: 'saved', label: 'Saved', icon: Heart },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const getInitialBookings = (userId) => {
  const key = userId || 'guest'
  const storedBookings = localStorage.getItem(`bookings_${key}`)
  if (storedBookings) return JSON.parse(storedBookings)

  const seeded = initialBookingsData.map((booking, index) => ({
    id: `booking-${index + 1}`,
    propertyName: booking[0],
    checkIn: booking[1],
    checkOut: booking[2],
    price: booking[3],
    status: booking[4],
  }))
  localStorage.setItem(`bookings_${key}`, JSON.stringify(seeded))
  return seeded
}

const getInitialSavedHomes = (userId) => {
  const storedSaved = localStorage.getItem(`saved_${userId || 'guest'}`)
  return storedSaved ? JSON.parse(storedSaved) : []
}

const getInitialChats = (userId) => {
  const key = userId || 'guest'
  const storedChats = localStorage.getItem(`chats_${key}`)
  if (storedChats) return JSON.parse(storedChats)

  const seededChats = [
    {
      id: 'room-1',
      hostName: 'Nestora Heights Host',
      propertyName: 'Nestora Heights',
      messages: [{ sender: 'host', text: 'Thanks for viewing Nestora Heights. Ask me anything about availability.', time: '10:30 AM' }],
    },
  ]
  localStorage.setItem(`chats_${key}`, JSON.stringify(seededChats))
  return seededChats
}

function ResidentDashboard() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'overview')
  const [myBookings, setMyBookings] = useState(() => getInitialBookings(user?.userId))
  const [savedHomes, setSavedHomes] = useState(() => getInitialSavedHomes(user?.userId))
  const [chatRooms, setChatRooms] = useState(() => getInitialChats(user?.userId))
  const [activeRoomId, setActiveRoomId] = useState(() => getInitialChats(user?.userId)[0]?.id || null)
  const [currentMessage, setCurrentMessage] = useState('')
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [toast, setToast] = useState(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Member',
    email: user?.email || '',
    mobile: user?.mobile || '',
    gender: user?.gender || '',
    address: user?.address || '',
    occupation: user?.occupation || '',
  })

  const [filters, setFilters] = useState({
    query: location.state?.filterLocation || '',
    budget: location.state?.filterBudget || 'Any budget',
    room: location.state?.filterRoom || 'Any room',
    amenity: 'All',
    sort: 'rating',
  })

  const notify = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 2800)
  }

  const persistSaved = (nextSaved) => {
    setSavedHomes(nextSaved)
    localStorage.setItem(`saved_${user?.userId || 'guest'}`, JSON.stringify(nextSaved))
  }

  const toggleFavorite = (propertyId) => {
    if (savedHomes.includes(propertyId)) {
      persistSaved(savedHomes.filter((id) => id !== propertyId))
      notify('Removed from saved homes.', 'info')
      return
    }
    persistSaved([...savedHomes, propertyId])
    notify('Saved for comparison.')
  }

  const handleBooking = (property) => {
    const newBooking = {
      id: `booking-${Date.now()}`,
      propertyName: property.name,
      checkIn: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      checkOut: 'Flexible stay',
      price: property.price,
      status: 'Upcoming',
    }

    const nextBookings = [newBooking, ...myBookings]
    setMyBookings(nextBookings)
    localStorage.setItem(`bookings_${user?.userId || 'guest'}`, JSON.stringify(nextBookings))
    setSelectedProperty(null)
    setActiveTab('bookings')
    notify(`Booking record created for ${property.name}.`)
  }

  const cancelBooking = (bookingId) => {
    const nextBookings = myBookings.map((booking) => booking.id === bookingId ? { ...booking, status: 'Cancelled' } : booking)
    setMyBookings(nextBookings)
    localStorage.setItem(`bookings_${user?.userId || 'guest'}`, JSON.stringify(nextBookings))
    notify('Booking marked as cancelled.', 'info')
  }

  const sendMessage = () => {
    if (!currentMessage.trim() || !activeRoomId) return
    const nextRooms = chatRooms.map((room) => room.id === activeRoomId
      ? {
          ...room,
          messages: [
            ...room.messages,
            { sender: 'user', text: currentMessage.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ],
        }
      : room)
    setChatRooms(nextRooms)
    localStorage.setItem(`chats_${user?.userId || 'guest'}`, JSON.stringify(nextRooms))
    setCurrentMessage('')
  }

  const filteredResidences = useMemo(() => residences.filter((residence) => {
    const query = filters.query.toLowerCase()
    const matchesQuery = !query || [residence.name, residence.location, residence.city, residence.area].some((value) => value.toLowerCase().includes(query))
    const matchesBudget =
      filters.budget === 'Any budget' ||
      (filters.budget === 'Under $8,000' && residence.priceValue < 8000) ||
      (filters.budget === '$8,000 - $12,000' && residence.priceValue >= 8000 && residence.priceValue <= 12000) ||
      (filters.budget === '$12,000+' && residence.priceValue > 12000)
    const matchesRoom = filters.room === 'Any room' || residence.roomTypes.includes(filters.room)
    const matchesAmenity = filters.amenity === 'All' || residence.amenities.includes(filters.amenity)
    return matchesQuery && matchesBudget && matchesRoom && matchesAmenity
  }).sort((a, b) => {
    if (filters.sort === 'price-low') return a.priceValue - b.priceValue
    if (filters.sort === 'price-high') return b.priceValue - a.priceValue
    return Number(b.rating) - Number(a.rating)
  }), [filters])

  const activeRoom = chatRooms.find((room) => room.id === activeRoomId)
  const savedResidences = residences.filter((residence) => savedHomes.includes(residence.id))

  return (
    <DashboardShell label="RESIDENT" user={user} navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout}>
      <Toast toast={toast} />

      {activeTab === 'overview' ? (
        <DashboardSection title={`Good to see you, ${profileData.name}`} subtitle="Your bookings, saved homes, and shortlist tools are collected here.">
          <div className="dashboard-stats-grid">
            <StatCard label="Active bookings" value={myBookings.filter((booking) => !['Cancelled', 'Completed'].includes(booking.status)).length} icon={BookOpen} />
            <StatCard label="Saved homes" value={savedHomes.length} icon={Heart} />
            <StatCard label="Messages" value={chatRooms.length} icon={MessageSquare} />
            <StatCard label="Profile" value="Verified" icon={BadgeCheck} />
          </div>

          <div className="dashboard-inner-grid">
            <div className="dashboard-pane">
              <div className="dashboard-pane-header">
                <h3>Recommended matches</h3>
                <button type="button" onClick={() => setActiveTab('explore')}>View all</button>
              </div>
              <div className="compact-property-list">
                {residences.slice(0, 3).map((property) => (
                  <button key={property.id} type="button" onClick={() => setSelectedProperty(property)}>
                    <img src={property.image} alt={property.name} />
                    <span>
                      <strong>{property.name}</strong>
                      <small>{property.location}</small>
                    </span>
                    <b>{property.price}</b>
                  </button>
                ))}
              </div>
            </div>
            <div className="dashboard-pane">
              <h3>Next action</h3>
              <p className="muted-copy">Use filters to compare rooms by budget, location, and amenities before creating a booking record.</p>
              <button className="primary-button compact-button" type="button" onClick={() => setActiveTab('explore')}>Explore PGs</button>
            </div>
          </div>
        </DashboardSection>
      ) : null}

      {activeTab === 'explore' ? (
        <DashboardSection title="Explore PGs" subtitle="Search the available residence data and inspect details before booking.">
          <div className="search-filter-panel">
            <div className="explore-filter-row">
              <label className="explore-search-input">
                <Search size={17} />
                <input value={filters.query} placeholder="Search by residence, city, or area" onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
              </label>
              <select value={filters.budget} onChange={(event) => setFilters({ ...filters, budget: event.target.value })}>
                <option>Any budget</option>
                <option>Under $8,000</option>
                <option>$8,000 - $12,000</option>
                <option>$12,000+</option>
              </select>
              <select value={filters.room} onChange={(event) => setFilters({ ...filters, room: event.target.value })}>
                <option>Any room</option>
                <option>Single</option>
                <option>Twin Sharing</option>
                <option>Studio</option>
              </select>
              <select value={filters.amenity} onChange={(event) => setFilters({ ...filters, amenity: event.target.value })}>
                <option>All</option>
                <option>Wi-Fi</option>
                <option>Meals</option>
                <option>Laundry</option>
                <option>AC</option>
              </select>
              <select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}>
                <option value="rating">Top rated</option>
                <option value="price-low">Price low to high</option>
                <option value="price-high">Price high to low</option>
              </select>
            </div>
          </div>

          {filteredResidences.length ? (
            <div className="property-grid dashboard-property-grid">
              {filteredResidences.map((property) => (
                <PropertyCard
                  key={property.id}
                  residence={property}
                  saved={savedHomes.includes(property.id)}
                  onSave={() => toggleFavorite(property.id)}
                  onView={() => setSelectedProperty(property)}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={SlidersHorizontal} title="No matching homes" text="Try a wider location, budget, or amenity filter." />
          )}
        </DashboardSection>
      ) : null}

      {activeTab === 'bookings' ? (
        <DashboardSection title="My bookings" subtitle="Booking records created from the resident dashboard.">
          {myBookings.length ? (
            <div className="booking-list">
              {myBookings.map((booking) => (
                <article className="booking-item-card" key={booking.id}>
                  <img src={residences.find((residence) => residence.name === booking.propertyName)?.image || residences[0].image} alt={booking.propertyName} />
                  <div className="booking-item-content">
                    <div className="booking-item-title-row">
                      <div>
                        <h4>{booking.propertyName}</h4>
                        <span className={`status-badge ${booking.status.toLowerCase()}`}>{booking.status}</span>
                      </div>
                      <strong>{booking.price}</strong>
                    </div>
                    <div className="booking-item-details">
                      <span><MapPin size={14} /> Ahmedabad hub</span>
                      <span>{booking.checkIn} - {booking.checkOut}</span>
                    </div>
                    {booking.status === 'Upcoming' ? (
                      <button className="ghost-button compact-button danger-button" type="button" onClick={() => cancelBooking(booking.id)}>Cancel booking</button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={BookOpen} title="No bookings yet" text="Explore PGs and reserve a room to create your first booking record." />
          )}
        </DashboardSection>
      ) : null}

      {activeTab === 'saved' ? (
        <DashboardSection title="Saved homes" subtitle="Your shortlist for comparing residences.">
          {savedResidences.length ? (
            <div className="property-grid dashboard-property-grid">
              {savedResidences.map((property) => (
                <PropertyCard
                  key={property.id}
                  residence={property}
                  saved
                  onSave={() => toggleFavorite(property.id)}
                  onView={() => setSelectedProperty(property)}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Heart} title="Your shortlist is empty" text="Tap the heart on any residence card to save it here." />
          )}
        </DashboardSection>
      ) : null}

      {activeTab === 'messages' ? (
        <DashboardSection title="Messages" subtitle="Local conversation notes with property hosts.">
          <div className="chat-container">
            <div className="chat-inbox">
              {chatRooms.map((room) => (
                <button key={room.id} className={`chat-user-item ${activeRoomId === room.id ? 'active' : ''}`} type="button" onClick={() => setActiveRoomId(room.id)}>
                  <span className="chat-avatar">{room.hostName.charAt(0)}</span>
                  <span className="chat-user-info">
                    <strong>{room.hostName}</strong>
                    <small>{room.propertyName}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="chat-screen">
              {activeRoom ? (
                <>
                  <div className="chat-header">
                    <h4>{activeRoom.hostName}</h4>
                    <span>{activeRoom.propertyName}</span>
                  </div>
                  <div className="chat-messages">
                    {activeRoom.messages.map((message, index) => (
                      <div className={`chat-bubble ${message.sender === 'user' ? 'sent' : 'received'}`} key={`${message.time}-${index}`}>
                        <p>{message.text}</p>
                        <span>{message.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="chat-input-row">
                    <input value={currentMessage} placeholder="Type a message" onChange={(event) => setCurrentMessage(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} />
                    <button type="button" onClick={sendMessage} aria-label="Send message"><Send size={18} /></button>
                  </div>
                </>
              ) : (
                <EmptyState icon={MessageSquare} title="No conversation selected" text="Choose a host thread to view messages." />
              )}
            </div>
          </div>
        </DashboardSection>
      ) : null}

      {activeTab === 'profile' ? (
        <DashboardSection title="Profile" subtitle="Manage the local profile details shown in your dashboard.">
          <form className="profile-card" onSubmit={(event) => { event.preventDefault(); setIsEditingProfile(false); notify('Profile details updated.') }}>
            <div className="profile-header-block">
              <div className="profile-pic-placeholder">{profileData.name.charAt(0).toUpperCase()}</div>
              <h3>{profileData.name}</h3>
              <p>Resident member</p>
            </div>
            <div className="profile-grid-cols">
              {['name', 'mobile', 'address', 'occupation'].map((field) => (
                <div className={`form-field ${field === 'address' ? 'form-grid-full' : ''}`} key={field}>
                  <label>{field.replace(/^\w/, (letter) => letter.toUpperCase())}</label>
                  <input value={profileData[field]} disabled={!isEditingProfile} onChange={(event) => setProfileData({ ...profileData, [field]: event.target.value })} />
                </div>
              ))}
              <div className="form-field">
                <label>Email</label>
                <input value={profileData.email} disabled />
              </div>
            </div>
            <div className="form-actions">
              {isEditingProfile ? (
                <>
                  <button className="ghost-button compact-button" type="button" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                  <button className="primary-button compact-button" type="submit">Save changes</button>
                </>
              ) : (
                <button className="primary-button compact-button" type="button" onClick={() => setIsEditingProfile(true)}>Edit profile</button>
              )}
            </div>
          </form>
        </DashboardSection>
      ) : null}

      {activeTab === 'settings' ? (
        <DashboardSection title="Settings" subtitle="Local preferences for the resident experience.">
          <div className="settings-list">
            <label className="settings-row"><span>Email updates for booking changes</span><input type="checkbox" defaultChecked /></label>
            <label className="settings-row"><span>Notify me when saved homes change</span><input type="checkbox" defaultChecked /></label>
            <button className="ghost-button compact-button" type="button" onClick={() => notify('Preferences saved.')}>Save preferences</button>
          </div>
        </DashboardSection>
      ) : null}

      <PropertyModal property={selectedProperty} onClose={() => setSelectedProperty(null)} onBook={handleBooking} />
    </DashboardShell>
  )
}

function DashboardSection({ title, subtitle, children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>
      {children}
    </motion.section>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="dashboard-stat-card">
      <span className="stat-icon-wrapper"><Icon size={20} /></span>
      <div className="stat-info">
        <span>{label}</span>
        <h3>{value}</h3>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon = AlertCircle, title, text }) {
  return (
    <div className="empty-state">
      <Icon size={42} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div className={`toast-alert ${toast.type || 'success'}`} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
          <CheckIcon />
          <span>{toast.message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function CheckIcon() {
  return <BadgeCheck size={16} />
}

function PropertyModal({ property, onClose, onBook }) {
  return (
    <AnimatePresence>
      {property ? (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-content" initial={{ scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 18 }}>
            <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Close property details"><X size={18} /></button>
            <div className="detail-modal-gallery"><img src={property.image} alt={property.name} /></div>
            <div className="detail-modal-info">
              <h2>{property.name}</h2>
              <div className="detail-modal-meta">
                <span><BadgeCheck size={16} /> Verified host</span>
                <span><Star size={14} fill="currentColor" /> {property.rating}</span>
                <span><MapPin size={14} /> {property.location}</span>
              </div>
              <div className="detail-modal-grid">
                <div className="detail-modal-features">
                  <h4>About this residence</h4>
                  <p>{property.description}</p>
                  <h4>Amenities</h4>
                  <div className="amenity-tags">{property.amenities.map((amenity) => <span key={amenity}>{amenity}</span>)}</div>
                  <h4>Room layouts</h4>
                  <div className="amenity-tags">{property.roomTypes.map((room) => <span key={room}>{room}</span>)}</div>
                </div>
                <aside className="modal-checkout-pane">
                  <div className="checkout-row"><span>Monthly rent</span><strong>{property.price}</strong></div>
                  <div className="checkout-row"><span>Resident group</span><span>{property.gender}</span></div>
                  <div className="checkout-row"><span>Status</span><span>{property.occupancy}</span></div>
                  <button className="primary-button" type="button" onClick={() => onBook(property)}>Create booking record</button>
                </aside>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default ResidentDashboard
