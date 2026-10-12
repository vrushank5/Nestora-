import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, Star, MapPin, Eye, BadgeCheck, AlertTriangle } from 'lucide-react'
import { apiRequest, getImageUrl } from '../../services/api.js'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'

export default function Properties() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('All')
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    let active = true
    apiRequest('/admin/properties')
      .then(res => {
        if (active) {
          const list = Array.isArray(res) ? res : (res.data || [])
          setProperties(list)
        }
      })
      .catch(err => {
        if (active) setFetchError(err.message || 'Unable to load properties')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [])

  const filteredProps = useMemo(() => {
    return properties.filter(p => {
      const q = search.toLowerCase().trim()
      const matchSearch = !q || (p.name || '').toLowerCase().includes(q) || (p.location || '').toLowerCase().includes(q)
      const matchGender = genderFilter === 'All' || p.gender === genderFilter
      return matchSearch && matchGender
    })
  }, [properties, search, genderFilter])

  const pendingCount = useMemo(() => {
    return properties.filter(p => (p.verificationStatus || 'Pending').toLowerCase() === 'pending').length
  }, [properties])

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">All Properties</h1>
          <p className="admin-page-subtitle">Full catalog of registered PGs, Hostels, and Co-Living properties.</p>
        </div>
        <Link to="/admin/properties/verification" className="primary-button compact-button">
          <BadgeCheck size={16} /> Pending Verifications ({pendingCount})
        </Link>
      </div>

      {/* Filters */}
      <div className="admin-filter-bar">
        <div className="admin-search-field">
          <Search size={16} />
          <input
            placeholder="Search properties by name or area..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-filter-controls">
          <div className="filter-item">
            <label>Gender</label>
            <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
              <option>All</option>
              <option>Male</option>
              <option>Female</option>
              <option>Unisex</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {fetchError && !isLoading && (
        <div className="owner-error-banner" style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
          <AlertTriangle size={18} /> {fetchError}
        </div>
      )}

      {/* Property Cards Table / Grid */}
      {!isLoading && (
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
              {filteredProps.map(p => {
                const imgSrc = p.image ? getImageUrl(p.image) : FALLBACK_IMAGE
                const verifStatus = (p.verificationStatus || 'Pending').toLowerCase()

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="resident-cell">
                        <img
                          src={imgSrc}
                          alt={p.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = FALLBACK_IMAGE
                          }}
                          style={{ width: '48px', height: '40px', objectFit: 'cover', borderRadius: '6px', backgroundColor: '#e5e7eb' }}
                        />
                        <div>
                          <strong>{p.name}</strong>
                          <small className="muted-copy" style={{ display: 'block' }}>{p.occupancy || 'Available'}</small>
                        </div>
                      </div>
                    </td>
                    <td>Owner Partner</td>
                    <td><MapPin size={13} /> {p.location}</td>
                    <td><span className="r-gender-badge">{p.gender || 'Unisex'}</span></td>
                    <td><strong style={{ color: 'var(--jade, #10b981)' }}>{p.price}</strong></td>
                    <td><Star size={13} fill="var(--saffron, #f59e0b)" color="var(--saffron, #f59e0b)" /> {p.rating || 0}</td>
                    <td>
                      {verifStatus === 'approved' || verifStatus === 'verified' ? (
                        <span className="status-badge active"><ShieldCheck size={13} /> Verified</span>
                      ) : verifStatus === 'rejected' ? (
                        <span className="status-badge status-available">Rejected</span>
                      ) : (
                        <span className="status-badge pending">Pending Audit</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${p.status === 'Active' ? 'active' : 'pending'}`}>
                        {p.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="r-icon-btn" title="View Property" onClick={() => navigate(`/admin/properties/${p.id}`)}>
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredProps.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              No properties found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
