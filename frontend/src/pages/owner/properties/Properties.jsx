import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, AlertTriangle, Building2 } from 'lucide-react'
import OwnerPropertyCard from '../../../components/owner/OwnerPropertyCard.jsx'
import { propertyService } from '../../../services/propertyService.js'

export default function Properties() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [successToast, setSuccessToast] = useState('')

  const fetchOwnerProperties = () => {
    setLoading(true)
    setError(null)
    propertyService.getOwnerProperties()
      .then(data => setProperties(data || []))
      .catch(err => setError(err.message || 'Unable to load properties.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    propertyService.getOwnerProperties()
      .then(data => { if (active) setProperties(data || []) })
      .catch(err => { if (active) setError(err.message || 'Unable to load properties.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // Filter properties by search term
  const filteredProperties = useMemo(() => {
    if (!searchTerm.trim()) return properties
    const term = searchTerm.toLowerCase()
    return properties.filter((p) =>
      p.name?.toLowerCase().includes(term) ||
      p.city?.toLowerCase().includes(term) ||
      p.area?.toLowerCase().includes(term) ||
      p.location?.toLowerCase().includes(term)
    )
  }, [properties, searchTerm])

  const promptDelete = (id, name) => {
    setDeleteConfirm({ id, name })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    const id = deleteConfirm.id
    try {
      setIsDeleting(true)
      await propertyService.deleteProperty(id)
      setProperties((prev) => prev.filter((p) => (p.id ?? p.propertyId) !== id))
      setSuccessToast(`Property "${deleteConfirm.name}" deleted successfully.`)
      setTimeout(() => setSuccessToast(''), 4000)
    } catch (err) {
      alert(err.message || 'Could not delete property.')
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(null)
    }
  }

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">My Properties</h1>
          <p className="owner-subtitle">
            Manage your co-living, PG, and rental listings dynamically.
          </p>
        </div>
        <Link to="/owner/properties/add" className="primary-button">
          <Plus size={18} /> Add Property
        </Link>
      </div>

      {successToast && (
        <div className="owner-error-banner" style={{ background: 'var(--sky)', color: 'var(--jade)', borderColor: 'var(--jade)' }}>
          <span>{successToast}</span>
          <button type="button" className="ghost-button compact-button" onClick={() => setSuccessToast('')}>Dismiss</button>
        </div>
      )}

      {/* SEARCH AND CONTROL BAR */}
      <div className="owner-list-actions">
        <div className="owner-search-box">
          <Search size={18} className="text-muted" />
          <input
            type="text"
            placeholder="Search by name, area or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className="muted-copy">
            Showing {filteredProperties.length} of {properties.length} properties
          </span>
          <button
            type="button"
            className="ghost-button compact-button"
            onClick={fetchOwnerProperties}
            title="Refresh List"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="owner-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
          <button type="button" className="ghost-button compact-button" onClick={fetchOwnerProperties}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading ? (
        <div className="loading-state-wrapper">
          <div className="spinner"></div>
          <h3>Loading your properties...</h3>
          <p className="text-muted">Fetching real-time property data from server.</p>
        </div>
      ) : (
        <>
          {/* EMPTY STATE */}
          {filteredProperties.length === 0 && !error && (
            <div className="owner-empty-state">
              <Building2 size={48} className="empty-icon text-muted" />
              <h3>
                {properties.length === 0
                  ? "You haven't added any properties yet."
                  : "No properties match your search criteria."}
              </h3>
              <p>
                {properties.length === 0
                  ? "Click below to add your first property listing."
                  : "Try clearing your search term to see all listings."}
              </p>
              {properties.length === 0 ? (
                <Link to="/owner/properties/add" className="primary-button mt-2">
                  <Plus size={18} /> Add Property
                </Link>
              ) : (
                <button
                  type="button"
                  className="ghost-button compact-button mt-2"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* DYNAMIC PROPERTIES GRID */}
          {filteredProperties.length > 0 && (
            <div className="owner-property-grid">
              {filteredProperties.map((property) => {
                const keyId = property.id ?? property.propertyId
                return (
                  <OwnerPropertyCard
                    key={keyId}
                    property={property}
                    onView={(id) => navigate(`/owner/properties/${id}`)}
                    onEdit={(id) => navigate(`/owner/properties/${id}/edit`)}
                    onDelete={promptDelete}
                  />
                )
              })}
            </div>
          )}
        </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Property</h3>
            <p>Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?</p>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              This will set the property status to inactive on the server.
            </p>
            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-button danger-button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
