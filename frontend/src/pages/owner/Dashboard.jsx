import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, RefreshCw, AlertTriangle, Building2 } from 'lucide-react'
import PropertyStats from '../../components/owner/PropertyStats.jsx'
import OwnerPropertyCard from '../../components/owner/OwnerPropertyCard.jsx'
import { propertyService } from '../../services/propertyService.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [actionSuccess, setActionSuccess] = useState('')

  const loadProperties = () => {
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

  // Delete Action Handlers
  const promptDelete = (id, name) => {
    setDeleteConfirm({ id, name })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    const id = deleteConfirm.id
    try {
      setDeletingId(id)
      await propertyService.deleteProperty(id)
      setProperties((prev) => prev.filter((p) => (p.id ?? p.propertyId) !== id))
      setActionSuccess(`Property "${deleteConfirm.name}" deleted successfully.`)
      setTimeout(() => setActionSuccess(''), 4000)
    } catch (err) {
      alert(err.message || 'Failed to delete property.')
    } finally {
      setDeletingId(null)
      setDeleteConfirm(null)
    }
  }

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Owner Dashboard</h1>
          <p className="owner-subtitle">
            Real-time overview of your listed co-living properties.
          </p>
        </div>
        <Link to="/owner/properties/add" className="primary-button">
          <Plus size={18} /> Add Property
        </Link>
      </div>

      {actionSuccess && (
        <div className="owner-error-banner" style={{ background: 'var(--sky)', color: 'var(--jade)', borderColor: 'var(--jade)' }}>
          <span>{actionSuccess}</span>
          <button type="button" className="ghost-button compact-button" onClick={() => setActionSuccess('')}>Dismiss</button>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="owner-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
          <div className="error-actions">
            <button type="button" className="ghost-button compact-button" onClick={loadProperties}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE SKELETON */}
      {loading ? (
        <div className="loading-state-wrapper">
          <div className="spinner"></div>
          <h3>Loading your properties...</h3>
          <p className="text-muted">Fetching real-time property listings from backend.</p>
        </div>
      ) : (
        <>
          {/* DYNAMIC STATISTICS */}
          <PropertyStats properties={properties} />

          {/* PROPERTIES LIST SECTION */}
          <div className="pane-header mt-4 mb-3" style={{ marginTop: '32px' }}>
            <h3>Your Property Listings ({properties.length})</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="ghost-button compact-button" onClick={loadProperties} title="Refresh Data">
                <RefreshCw size={14} /> Refresh
              </button>
              <Link to="/owner/properties" className="owner-text-btn">
                <span>View All Properties</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* EMPTY STATE */}
          {properties.length === 0 && !error && (
            <div className="owner-empty-state">
              <Building2 size={48} className="empty-icon text-muted" />
              <h3>You haven't added any properties yet.</h3>
              <p>Start listing your co-living spaces and PG accommodations today.</p>
              <Link to="/owner/properties/add" className="primary-button mt-2">
                <Plus size={18} /> Add Property
              </Link>
            </div>
          )}

          {/* DYNAMIC PROPERTIES GRID */}
          {properties.length > 0 && (
            <div className="owner-property-grid">
              {properties.map((property) => {
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
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>This action will deactivate the listing in the system.</p>
            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-button danger-button"
                onClick={handleConfirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId ? 'Deleting...' : 'Delete Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
