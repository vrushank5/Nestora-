import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  DollarSign,
  LayoutDashboard,
  Plus,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import DashboardShell from '../components/DashboardShell.jsx'
import PropertyCard from '../components/PropertyCard.jsx'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../services/api.js'

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'properties', label: 'Properties', icon: Building2 },
  { id: 'bookings', label: 'Requests', icon: BookOpen },
  { id: 'residents', label: 'Residents', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const propertyFallbackImages = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1000&q=85',
]

const defaultBookings = [
  { id: 'b-101', propertyName: 'Nestora Heights', residentName: 'Riya Shah', date: '25 Aug 2026', rent: '$8,500/mo', status: 'Pending' },
  { id: 'b-102', propertyName: 'Urban Living PG', residentName: 'Aarav Mehta', date: '24 Aug 2026', rent: '$7,500/mo', status: 'Approved' },
  { id: 'b-103', propertyName: 'Nestora Central', residentName: 'Kabir Patel', date: '10 Jul 2026', rent: '$8,200/mo', status: 'Completed' },
]

const defaultResidents = [
  { id: 'r-201', name: 'Riya Shah', email: 'riya@example.com', phone: '9876543210', property: 'Nestora Heights', room: 'Suite A-12', status: 'Paid' },
  { id: 'r-202', name: 'Aarav Mehta', email: 'aarav@example.com', phone: '9823456789', property: 'Urban Living PG', room: 'B-04 sharing', status: 'Paid' },
  { id: 'r-203', name: 'Ananya Vyas', email: 'ananya@example.com', phone: '8876543212', property: 'Green Home Co-Living', room: 'Studio 10', status: 'Pending' },
]

const getInitialOwnerProperties = (userId) => {
  const key = userId || 'owner'
  const storedProperties = localStorage.getItem(`residences_${key}`)
  if (storedProperties) return JSON.parse(storedProperties)
  return []
}

const toPropertyCardData = (property, index = 0) => ({
  id: property.propertyId ?? property.id,
  slug: property.slug ?? property.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name: property.name,
  city: property.city ?? 'Ahmedabad',
  area: property.area ?? property.location?.split(',')[0] ?? 'Ahmedabad',
  location: property.location ?? property.area,
  rating: String(property.rating ?? '4.5'),
  reviews: property.reviews ?? 'New',
  price: property.price ? String(property.price).replace(/₹|Rs\.?/g, '$') : `$${Number(property.priceValue || 0).toLocaleString('en-US')}/month`,
  priceValue: Number(property.priceValue ?? 0),
  amenities: Array.isArray(property.amenities) ? property.amenities : ['Wi-Fi'],
  roomTypes: Array.isArray(property.roomTypes) ? property.roomTypes : ['Single'],
  gender: property.gender ?? 'Unisex',
  occupancy: property.occupancy ?? 'New listing',
  description: property.description ?? 'Managed property listing.',
  image: property.image || propertyFallbackImages[index % propertyFallbackImages.length],
})

const getInitialOwnerBookings = () => {
  const storedBookings = localStorage.getItem('bookings_all')
  if (storedBookings) return JSON.parse(storedBookings)
  localStorage.setItem('bookings_all', JSON.stringify(defaultBookings))
  return defaultBookings
}

function OwnerDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [ownerProperties, setOwnerProperties] = useState(() => getInitialOwnerProperties(user?.userId))
  const [ownerBookings, setOwnerBookings] = useState(getInitialOwnerBookings)

  useEffect(() => {
    const loadOwnerProperties = async () => {
      try {
        const response = await apiRequest('/properties', { token: null })
        const items = Array.isArray(response?.data) ? response.data : []
        const nextProperties = items.map((property, index) => toPropertyCardData(property, index))
        setOwnerProperties(nextProperties)
        localStorage.setItem(`residences_${user?.userId || 'owner'}`, JSON.stringify(nextProperties))
      } catch (error) {
        console.warn('Could not load owner properties from backend.', error.message)
        setOwnerProperties([])
      }
    }

    loadOwnerProperties()
  }, [user?.userId])
  const [residentsList] = useState(defaultResidents)
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [newProperty, setNewProperty] = useState({
    name: '',
    location: '',
    price: '',
    amenities: 'Wi-Fi, Meals',
    roomTypes: 'Twin Sharing',
    description: '',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85',
  })

  const notify = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 2800)
  }

  const monthlyRevenue = useMemo(() => ownerProperties.reduce((total, property) => total + Number(property.priceValue || 0), 0), [ownerProperties])

  const persistProperties = (properties) => {
    setOwnerProperties(properties)
    localStorage.setItem(`residences_${user?.userId || 'owner'}`, JSON.stringify(properties))
  }

  const updateBookingStatus = (bookingId, status) => {
    const nextBookings = ownerBookings.map((booking) => booking.id === bookingId ? { ...booking, status } : booking)
    setOwnerBookings(nextBookings)
    localStorage.setItem('bookings_all', JSON.stringify(nextBookings))
    notify(`Booking request ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'info')
  }

  const handleAddProperty = async (event) => {
    event.preventDefault()
    if (!newProperty.name.trim() || !newProperty.location.trim() || !newProperty.price) {
      notify('Property name, location, and rent are required.', 'error')
      return
    }

    const propertyPayload = {
      ownerId: Number(user?.userId || 0),
      name: newProperty.name.trim(),
      city: 'Ahmedabad',
      area: newProperty.location.split(',')[0].trim(),
      location: newProperty.location.trim(),
      price: `Rs.${newProperty.price}/month`,
      priceValue: Number(newProperty.price),
      amenities: newProperty.amenities.split(',').map((item) => item.trim()).filter(Boolean),
      roomTypes: newProperty.roomTypes.split(',').map((item) => item.trim()).filter(Boolean),
      gender: 'Unisex',
      occupancy: 'New listing',
      description: newProperty.description.trim() || 'A managed residence with clear room details and essential services.',
      image: newProperty.image,
    }

    try {
      const response = await apiRequest('/properties', {
        method: 'POST',
        body: JSON.stringify(propertyPayload),
        token: null,
      })

      const savedProperty = response?.data ? toPropertyCardData(response.data) : {
        ...propertyPayload,
        id: `property-${Date.now()}`,
        slug: newProperty.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        rating: '5.0',
        reviews: 'New',
        price: `Rs.${newProperty.price}/month`,
      }

      persistProperties([savedProperty, ...ownerProperties])
      setNewProperty({
        name: '',
        location: '',
        price: '',
        amenities: 'Wi-Fi, Meals',
        roomTypes: 'Twin Sharing',
        description: '',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85',
      })
      setShowAddPropertyModal(false)
      notify('Property added successfully.')
    } catch (error) {
      notify(error.message || 'Could not save property.', 'error')
    }
  }

  const deleteProperty = (propertyId) => {
    persistProperties(ownerProperties.filter((property) => property.id !== propertyId))
    notify('Listing removed.', 'info')
  }

  return (
    <DashboardShell label="OWNER" user={user} navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout}>
      <Toast toast={toast} />

      {activeTab === 'overview' ? (
        <DashboardSection title={`Owner workspace, ${user?.name || 'Partner'}`} subtitle="Manage local listing data, booking requests, and resident records.">
          <div className="dashboard-stats-grid">
            <StatCard label="Projected monthly rent" value={`$${monthlyRevenue.toLocaleString('en-US')}`} icon={DollarSign} />
            <StatCard label="Properties" value={ownerProperties.length} icon={Building2} />
            <StatCard label="Residents" value={residentsList.length} icon={Users} />
            <StatCard label="Pending requests" value={ownerBookings.filter((booking) => booking.status === 'Pending').length} icon={BookOpen} />
          </div>

          <div className="dashboard-inner-grid">
            <div className="dashboard-pane">
              <div className="dashboard-pane-header">
                <h3>Requests needing review</h3>
                <button type="button" onClick={() => setActiveTab('bookings')}>Open requests</button>
              </div>
              <RequestList bookings={ownerBookings.filter((booking) => booking.status === 'Pending')} onUpdate={updateBookingStatus} />
            </div>
            <div className="dashboard-pane">
              <h3>Listing health</h3>
              <p className="muted-copy">Keep photos, pricing, and amenities clear so residents can compare faster.</p>
              <button className="primary-button compact-button" type="button" onClick={() => setShowAddPropertyModal(true)}><Plus size={16} /> Add property</button>
            </div>
          </div>
        </DashboardSection>
      ) : null}

      {activeTab === 'properties' ? (
        <DashboardSection title="My properties" subtitle="Listings currently managed in this browser workspace.">
          <div className="dashboard-actions"><button className="primary-button compact-button" type="button" onClick={() => setShowAddPropertyModal(true)}><Plus size={16} /> Add property</button></div>
          <div className="property-grid dashboard-property-grid">
            {ownerProperties.map((property) => (
              <div className="owner-property-wrap" key={property.id}>
                <PropertyCard residence={property} onView={() => notify(`${property.name} is listed at ${property.price}.`, 'info')} />
                <button className="icon-danger-button" type="button" onClick={() => deleteProperty(property.id)} aria-label={`Delete ${property.name}`}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </DashboardSection>
      ) : null}

      {activeTab === 'bookings' ? (
        <DashboardSection title="Booking requests" subtitle="Review and update local booking request statuses.">
          <div className="profile-card table-card">
            <table>
              <thead><tr><th>Resident</th><th>Property</th><th>Date</th><th>Rent</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {ownerBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.residentName}</td>
                    <td>{booking.propertyName}</td>
                    <td>{booking.date}</td>
                    <td>{booking.rent}</td>
                    <td><span className={`status-badge ${booking.status.toLowerCase()}`}>{booking.status}</span></td>
                    <td>
                      {booking.status === 'Pending' ? (
                        <div className="table-actions">
                          <button className="primary-button compact-button" type="button" onClick={() => updateBookingStatus(booking.id, 'Approved')}>Approve</button>
                          <button className="ghost-button compact-button danger-button" type="button" onClick={() => updateBookingStatus(booking.id, 'Declined')}>Decline</button>
                        </div>
                      ) : <span className="muted-copy">Reviewed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardSection>
      ) : null}

      {activeTab === 'residents' ? (
        <DashboardSection title="Residents roster" subtitle="Resident records currently represented in the owner workspace.">
          <div className="resident-grid">
            {residentsList.map((resident) => (
              <article className="resident-card" key={resident.id}>
                <div>
                  <h3>{resident.name}</h3>
                  <span className={`status-badge ${resident.status === 'Paid' ? 'active' : 'upcoming'}`}>Rent {resident.status}</span>
                </div>
                <p>{resident.property} / {resident.room}</p>
                <small>{resident.phone} / {resident.email}</small>
              </article>
            ))}
          </div>
        </DashboardSection>
      ) : null}

      {activeTab === 'settings' ? (
        <DashboardSection title="Owner settings" subtitle="Preferences for local owner workspace notifications.">
          <div className="settings-list">
            <label className="settings-row"><span>Email me new booking requests</span><input type="checkbox" defaultChecked /></label>
            <label className="settings-row"><span>Highlight incomplete listing details</span><input type="checkbox" defaultChecked /></label>
            <button className="ghost-button compact-button" type="button" onClick={() => notify('Owner preferences saved.')}>Save preferences</button>
          </div>
        </DashboardSection>
      ) : null}

      <AddPropertyModal
        open={showAddPropertyModal}
        property={newProperty}
        setProperty={setNewProperty}
        onClose={() => setShowAddPropertyModal(false)}
        onSubmit={handleAddProperty}
      />
    </DashboardShell>
  )
}

function DashboardSection({ title, subtitle, children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <header className="dashboard-header">
        <div className="dashboard-title"><h2>{title}</h2><p>{subtitle}</p></div>
      </header>
      {children}
    </motion.section>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="dashboard-stat-card">
      <span className="stat-icon-wrapper"><Icon size={20} /></span>
      <div className="stat-info"><span>{label}</span><h3>{value}</h3></div>
    </div>
  )
}

function RequestList({ bookings, onUpdate }) {
  if (!bookings.length) {
    return <div className="empty-state compact-empty"><CheckCircle2 size={34} /><h3>No pending requests</h3><p>Everything has been reviewed.</p></div>
  }

  return (
    <div className="request-list">
      {bookings.map((booking) => (
        <article key={booking.id}>
          <div><strong>{booking.residentName}</strong><span>{booking.propertyName} / {booking.date}</span></div>
          <b>{booking.rent}</b>
          <div className="table-actions">
            <button className="ghost-button compact-button danger-button" type="button" onClick={() => onUpdate(booking.id, 'Declined')}>Decline</button>
            <button className="primary-button compact-button" type="button" onClick={() => onUpdate(booking.id, 'Approved')}>Approve</button>
          </div>
        </article>
      ))}
    </div>
  )
}

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div className={`toast-alert ${toast.type || 'success'}`} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
          <BadgeCheck size={16} />
          <span>{toast.message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function AddPropertyModal({ open, property, setProperty, onClose, onSubmit }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-content" initial={{ scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 18 }}>
            <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Close add property"><X size={18} /></button>
            <h2>Add property</h2>
            <form onSubmit={onSubmit}>
              <div className="form-grid">
                <Field label="Property Name" value={property.name} onChange={(value) => setProperty({ ...property, name: value })} />
                <Field label="Monthly Rent (Rs.)" type="number" value={property.price} onChange={(value) => setProperty({ ...property, price: value })} />
                <Field className="form-grid-full" label="Location" value={property.location} onChange={(value) => setProperty({ ...property, location: value })} />
                <Field label="Amenities" value={property.amenities} onChange={(value) => setProperty({ ...property, amenities: value })} />
                <Field label="Room Types" value={property.roomTypes} onChange={(value) => setProperty({ ...property, roomTypes: value })} />
                <div className="form-field form-grid-full">
                  <label>Description</label>
                  <textarea value={property.description} placeholder="Describe room furnishings and nearby areas" onChange={(event) => setProperty({ ...property, description: event.target.value })} />
                </div>
              </div>
              <div className="form-actions">
                <button className="ghost-button compact-button" type="button" onClick={onClose}>Cancel</button>
                <button className="primary-button compact-button" type="submit">Publish listing</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function Field({ label, className = '', type = 'text', value, onChange }) {
  return (
    <div className={`form-field ${className}`}>
      <label>{label}<span>*</span></label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

export default OwnerDashboard
