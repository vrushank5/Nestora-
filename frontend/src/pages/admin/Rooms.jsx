import { useState, useEffect } from 'react'
import { Search, DoorOpen, AlertTriangle } from 'lucide-react'
import { SkeletonTable } from '../../components/Skeleton.jsx'
import { getToken } from '../../context/authStorage.js'

// Hook to fetch rooms data
const useRooms = () => {
  const [rooms, setRooms] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    let active = true
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.json()
      })
      .then(json => {
        if (active) setRooms(json.data || json)
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
    const matchesTab = tab === 'All' || r.status === tab
    const q = search.toLowerCase()
    const matchesSearch = !q || r.property.toLowerCase().includes(q) || r.roomNo.includes(q)
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
          <input placeholder="Search by property or room number..." value={search} onChange={e => setSearch(e.target.value)} />
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
        <div className="owner-error-banner" style={{ padding: '1rem', background: 'var(--error-bg)', color: 'var(--error-fg)', borderRadius: '8px', marginTop: '1rem' }}>
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
              {filtered.map(r => (
                <tr key={r.id}>
                  <td><strong><DoorOpen size={14} /> Room {r.roomNo}</strong></td>
                  <td>{r.property}</td>
                  <td>{r.type}</td>
                  <td><strong style={{ color: 'var(--jade)' }}>₹{r.rent.toLocaleString('en-IN')}/mo</strong></td>
                  <td>{r.beds} Beds</td>
                  <td><strong>{r.availableBeds} Available</strong></td>
                  <td>
                    <span className={`status-badge ${r.status === 'Available' ? 'active' : r.status === 'Occupied' ? 'status-available' : 'pending'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <button className="ghost-button compact-button" onClick={() => alert(`Managing Room ${r.roomNo}`)}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
