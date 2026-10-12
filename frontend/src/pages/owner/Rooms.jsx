import { useEffect, useMemo, useState } from 'react'
import { Filter, MoreVertical, Plus, Search, X } from 'lucide-react'
import { apiRequest } from '../../services/api.js'
import { propertyService } from '../../services/propertyService.js'

const defaultForm = {
  propertyId: '',
  roomNumber: '',
  roomType: 'Single',
  capacity: 1,
  price: '',
  status: 'Available',
}

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [properties, setProperties] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadRooms = async () => {
    const response = await apiRequest('/rooms/owner/my')
    setRooms(response.data || [])
  }

  useEffect(() => {
    let active = true

    const loadData = async () => {
      try {
        setLoading(true)
        setError('')
        const [roomResponse, ownerProperties] = await Promise.all([
          apiRequest('/rooms/owner/my'),
          propertyService.getOwnerProperties(),
        ])

        if (!active) return

        setRooms(roomResponse.data || [])
        setProperties(ownerProperties)
        setForm((current) => ({
          ...current,
          propertyId: current.propertyId || ownerProperties[0]?.propertyId || '',
        }))
      } catch (err) {
        if (active) setError(err.message || 'Unable to load rooms.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [])

  const propertyNames = useMemo(() => {
    return properties.reduce((map, property) => {
      map[property.propertyId] = property.name
      return map
    }, {})
  }, [properties])

  const filteredRooms = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return rooms

    return rooms.filter((room) => {
      const propertyName = propertyNames[room.propertyId] || ''
      return [room.roomNumber, room.roomType, room.status, propertyName].some((value) =>
        String(value || '').toLowerCase().includes(query),
      )
    })
  }, [propertyNames, rooms, searchTerm])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openAddModal = () => {
    setError('')
    setSuccess('')
    setForm({
      ...defaultForm,
      propertyId: properties[0]?.propertyId || '',
    })
    setShowAddModal(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.propertyId) {
      setError('Add a property first, then create rooms for it.')
      return
    }

    if (!String(form.roomNumber).trim() || !String(form.roomType).trim() || Number(form.capacity) < 1) {
      setError('Room number, type, and capacity are required.')
      return
    }

    if (Number(form.price) < 0 || form.price === '') {
      setError('Rent must be a valid amount.')
      return
    }

    try {
      setSaving(true)
      await apiRequest('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: Number(form.propertyId),
          roomNumber: form.roomNumber.trim(),
          roomType: form.roomType.trim(),
          capacity: Number(form.capacity),
          price: Number(form.price),
          status: form.status,
        }),
      })
      await loadRooms()
      setShowAddModal(false)
      setSuccess('Room added successfully.')
    } catch (err) {
      setError(err.message || 'Unable to add room.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Rooms</h1>
          <p className="owner-subtitle">Manage rooms and bed availability across properties.</p>
        </div>
        <button className="primary-button" type="button" onClick={openAddModal}>
          <Plus size={18} /> Add Room
        </button>
      </div>

      {success && (
        <div className="owner-error-banner" style={{ background: 'var(--sky)', color: 'var(--jade)', borderColor: 'var(--jade)' }}>
          <span>{success}</span>
        </div>
      )}

      {error && !showAddModal && (
        <div className="owner-error-banner">
          <span>{error}</span>
        </div>
      )}

      <div className="owner-list-actions">
        <div className="owner-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <button className="ghost-button compact-button" type="button"><Filter size={16} /> Filter</button>
      </div>

      <div className="owner-table-wrapper 3d-tilt-card">
        <table className="owner-data-table">
          <thead>
            <tr>
              <th>Room No</th>
              <th>Property</th>
              <th>Type</th>
              <th>Rent</th>
              <th>Total Beds</th>
              <th>Available</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((room) => (
              <tr key={room.roomId || room._id}>
                <td><strong>{room.roomNumber}</strong></td>
                <td>{propertyNames[room.propertyId] || `Property #${room.propertyId}`}</td>
                <td>{room.roomType}</td>
                <td>${Number(room.price || 0).toLocaleString('en-US')}</td>
                <td>{room.capacity}</td>
                <td><strong className={room.availableCount > 0 ? 'text-jade' : ''}>{room.availableCount}</strong></td>
                <td>
                  <span className={`status-badge status-${String(room.status || 'Available').toLowerCase().replace(/\s+/g, '-')}`}>
                    {room.status || 'Available'}
                  </span>
                </td>
                <td>
                  <button className="icon-btn" type="button"><MoreVertical size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && filteredRooms.length === 0 && (
          <div className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
            <h3>No rooms found</h3>
            <p className="muted-copy">
              {rooms.length === 0 ? 'Add your first room to start tracking beds.' : 'No rooms match your search.'}
            </p>
          </div>
        )}

        {loading && (
          <div className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
            <h3>Loading rooms...</h3>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(event) => event.stopPropagation()}>
            <button className="close-modal-btn" type="button" onClick={() => setShowAddModal(false)}>
              <X size={18} />
            </button>
            <h2>Add Room</h2>
            <p className="muted-copy">Create a room under one of your listed properties.</p>

            {error && (
              <p className="form-status form-status-error">{error}</p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field form-grid-full">
                  <label>Property</label>
                  <select value={form.propertyId} onChange={(event) => updateForm('propertyId', event.target.value)} disabled={!properties.length}>
                    {properties.length === 0 ? (
                      <option value="">No properties available</option>
                    ) : properties.map((property) => (
                      <option key={property.propertyId} value={property.propertyId}>{property.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Room Number</label>
                  <input value={form.roomNumber} onChange={(event) => updateForm('roomNumber', event.target.value)} placeholder="Eg. 101" />
                </div>

                <div className="form-field">
                  <label>Room Type</label>
                  <select value={form.roomType} onChange={(event) => updateForm('roomType', event.target.value)}>
                    <option>Single</option>
                    <option>Double Sharing</option>
                    <option>Triple Sharing</option>
                    <option>Four Sharing</option>
                    <option>Dormitory</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Total Beds</label>
                  <input type="number" min="1" value={form.capacity} onChange={(event) => updateForm('capacity', event.target.value)} />
                </div>

                <div className="form-field">
                  <label>Monthly Rent</label>
                  <input type="number" min="0" value={form.price} onChange={(event) => updateForm('price', event.target.value)} placeholder="Eg. 8500" />
                </div>

                <div className="form-field form-grid-full">
                  <label>Status</label>
                  <select value={form.status} onChange={(event) => updateForm('status', event.target.value)}>
                    <option>Available</option>
                    <option>Occupied</option>
                    <option>Under Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button className="ghost-button compact-button" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="primary-button compact-button" type="submit" disabled={saving || !properties.length}>
                  {saving ? 'Saving...' : 'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
