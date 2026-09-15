import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, Star, MapPin, Eye, BadgeCheck } from 'lucide-react'
import { getToken } from '../../context/authStorage.js'

export default function Properties() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('All')
  const [properties, setProperties] = useState([])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/properties`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(response => { if (!response.ok) throw new Error('Unable to load properties'); return response.json() })
      .then(result => setProperties(result.data || []))
  }, [])

  const filteredProps = useMemo(() => {
    return properties.filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
      const matchGender = genderFilter === 'All' || p.gender === genderFilter
      return matchSearch && matchGender
    })
  }, [properties, search, genderFilter])

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">All Properties</h1>
          <p className="admin-page-subtitle">Full catalog of registered PGs, Hostels, and Co-Living properties.</p>
        </div>
        <Link to="/admin/properties/verification" className="primary-button compact-button">
          <BadgeCheck size={16} /> Pending Verifications (18)
        </Link>
      </div>

      {/* Filters */}
      <div className="admin-filter-bar">
        <div className="admin-search-field">
          <Search size={16} />
          <input placeholder="Search properties by name or area..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="admin-filter-controls">
          <div className="filter-item">
            <label>Gender</label>
            <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
              <option>All</option><option>Male</option><option>Female</option><option>Unisex</option>
            </select>
          </div>
        </div>
      </div>

      {/* Property Cards Table / Grid */}
      <div className="owner-table-wrapper">
        <table className="owner-data-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Owner</th>
              <th>Location</th>
              <th>Gender</th>
              <th>Rent Range</th>
              <th>Rating</th>
              <th>Verification</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProps.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="resident-cell">
                    <img src={p.image} alt={p.name} style={{ width: '48px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                    <div>
                      <strong>{p.name}</strong>
                      <small className="muted-copy" style={{ display: 'block' }}>{p.occupancy}</small>
                    </div>
                  </div>
                </td>
                <td>Owner Partner</td>
                <td><MapPin size={13} /> {p.location}</td>
                <td><span className="r-gender-badge">{p.gender}</span></td>
                <td><strong style={{ color: 'var(--jade)' }}>{p.price}</strong></td>
                <td><Star size={13} fill="var(--saffron)" color="var(--saffron)" /> {p.rating}</td>
                <td><span className="status-badge active"><ShieldCheck size={13} /> Verified</span></td>
                <td><span className="status-badge active">Active</span></td>
                <td>
                  <div className="table-actions">
                    <button className="r-icon-btn" title="View Property" onClick={() => navigate(`/admin/properties/${p.id}`)}>
                      <Eye size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
