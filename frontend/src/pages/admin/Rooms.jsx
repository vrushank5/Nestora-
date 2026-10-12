import { useState, useEffect } from 'react'
import { Search, DoorOpen, AlertTriangle } from 'lucide-react'
import { SkeletonTable } from '../../components/Skeleton.jsx'
import { apiRequest } from '../../services/api.js'

// Hook to fetch rooms data
const useRooms = () => {
  const [rooms, setRooms] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    let active = true
    apiRequest('/rooms/admin/all')
      .then(res => {
        if (active) {
          const list = Array.isArray(res) ? res : (res.data || [])
          setRooms(list)
        }
      })
      .catch(err => {
        if (active) setFetchError(err.message || 'Failed to load rooms')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [])

  return { rooms, isLoading, fetchError }
}

const TABS = ['All', 'Occupied', 'Partially Available', 'Available']

export default function Rooms() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('All')
  const { rooms, isLoading, fetchError } = useRooms()

  const filtered = rooms.filter(r => {
    const status = r.status || 'Available'
    const matchesTab = tab === 'All' || status === tab
    const q = search.trim().toLowerCase()
    
    const propName = String(r.property || r.propertyName || `Property #${r.propertyId || ''}`).toLowerCase()
    const roomNo = String(r.roomNo || r.roomNumber || '').toLowerCase()

    const matchesSearch = !q || propName.includes(q) || roomNo.includes(q)
    return matchesTab && matchesSearch
  })

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Room Management</h1>
          <p className="admin-page-subtitle">Track room capacities, sharing types, rents, and bed availabilities across properties.</p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search-field">
          <Search size={16} />
          <input
            placeholder="Search by property or room number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <SkeletonTable rows={4} cols={7} />
      )}

      {/* Error banner */}
      {fetchError && !isLoading && (
        <div className="owner-error-banner" style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} /> {fetchError}
        </div>
      )}

      {/* Table */}
      {!isLoading && !fetchError && (
        <div className="owner-table-wrapper">
          <table className="owner-data-table">
            <thead>
              <tr>
                <th>Room No</th>
                <th>Property Name</th>
                <th>Room Type</th>
                <th>Rent / Bed</th>
                <th>Total Beds</th>
                <th>Available Beds</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const roomNo = r.roomNo || r.roomNumber || `R-${idx + 1}`
                const propertyName = r.property || r.propertyName || `Property #${r.propertyId || ''}`
                const roomType = r.type || r.roomType || 'Standard'
                const rent = r.rent ?? r.price ?? 0
                const beds = r.beds ?? r.capacity ?? 0
                const availableBeds = r.availableBeds ?? r.availableCount ?? 0
                const status = r.status || 'Available'

                return (
                  <tr key={r.id || r._id || r.roomId || idx}>
                    <td><strong><DoorOpen size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Room {roomNo}</strong></td>
                    <td>{propertyName}</td>
                    <td>{roomType}</td>
                    <td><strong style={{ color: 'var(--jade, #10b981)' }}>${Number(rent).toLocaleString('en-US')}/mo</strong></td>
                    <td>{beds} Beds</td>
                    <td><strong>{availableBeds} Available</strong></td>
                    <td>
                      <span className={`status-badge ${status === 'Available' ? 'active' : status === 'Occupied' ? 'status-available' : 'pending'}`}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <button className="ghost-button compact-button" onClick={() => alert(`Managing Room ${roomNo}`)}>
                        Manage
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              No rooms found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
