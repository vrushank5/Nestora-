import { useEffect, useState } from 'react'
import { Plus, Search, Filter, MoreVertical } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  useEffect(() => { apiRequest('/owner/rooms').then(response => setRooms(response.data || [])) }, [])

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Rooms</h1>
          <p className="owner-subtitle">Manage rooms and bed availability across properties.</p>
        </div>
        <button className="primary-button"><Plus size={18} /> Add Room</button>
      </div>

      <div className="owner-list-actions">
        <div className="owner-search-box">
          <Search size={16} />
          <input type="text" placeholder="Search rooms..." />
        </div>
        <button className="ghost-button compact-button"><Filter size={16} /> Filter</button>
      </div>

      <div className="owner-table-wrapper 3d-tilt-card">
        <table className="owner-data-table">
          <thead>
            <tr>
              <th>Room No</th>
              <th>Type</th>
              <th>Sharing</th>
              <th>Rent (₹)</th>
              <th>Total Beds</th>
              <th>Available</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id}>
                <td><strong>{room.roomNo}</strong></td>
                <td>{room.type}</td>
                <td>{room.sharing}</td>
                <td>{room.rent}</td>
                <td>{room.totalBeds}</td>
                <td><strong className={room.available > 0 ? 'text-jade' : ''}>{room.available}</strong></td>
                <td>
                  <span className={`status-badge status-${room.status.toLowerCase().replace(' ', '-')}`}>
                    {room.status}
                  </span>
                </td>
                <td>
                  <button className="icon-btn"><MoreVertical size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
