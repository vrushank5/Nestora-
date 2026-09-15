import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Star,
  ShieldCheck,
  Edit3,
  Trash2,
  AlertTriangle,
  Users,
  Tag,
  Calendar,
} from 'lucide-react'
import OwnerPropertyGallery from '../../../components/owner/OwnerPropertyGallery.jsx'
import { propertyService } from '../../../services/propertyService.js'

export default function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await propertyService.getPropertyById(id)
        if (!data) {
          throw new Error('Property not found')
        }
        setProperty(data)
      } catch (err) {
        console.error('Error fetching property details:', err)
        setError(err.message || 'Unable to load property details.')
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [id])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await propertyService.deleteProperty(id)
      navigate('/owner/properties', {
        state: { message: `Property "${property.name}" deleted successfully.` },
      })
    } catch (err) {
      alert(err.message || 'Failed to delete property.')
      setIsDeleting(false)
      setDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="owner-page">
        <div className="loading-state-wrapper">
          <div className="spinner"></div>
          <h3>Loading Property Details...</h3>
          <p className="text-muted">Fetching property #{id} from backend server.</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="owner-page">
        <div className="owner-page-header">
          <div>
            <Link to="/owner/properties" className="owner-text-btn mb-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={16} /> Back to My Properties
            </Link>
            <h1 className="owner-greeting">Property Not Found</h1>
          </div>
        </div>

        <div className="owner-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} />
            <span>{error || 'The requested property could not be found.'}</span>
          </div>
          <Link to="/owner/properties" className="ghost-button compact-button">
            View All Properties
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="owner-page property-detail-page">
      {/* HEADER BAR */}
      <div className="detail-header-card">
        <div className="detail-title-group">
          <Link to="/owner/properties" className="owner-text-btn mb-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={16} /> Back to Properties
          </Link>
          <h1>{property.name}</h1>
          <p className="detail-location-sub">
            <MapPin size={16} /> {property.location || `${property.area}, ${property.city}`}
          </p>
        </div>

        <div className="detail-header-actions">
          <span className={`status-badge ${property.isActive !== false ? 'verified' : 'pending'}`}>
            <ShieldCheck size={14} />
            {property.isActive !== false ? 'Active Listing' : 'Inactive Listing'}
          </span>
          <button
            type="button"
            className="ghost-button compact-button"
            onClick={() => navigate(`/owner/properties/${id}/edit`)}
          >
            <Edit3 size={16} /> Edit
          </button>
          <button
            type="button"
            className="ghost-button compact-button danger-button"
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="detail-main-grid">
        {/* LEFT COLUMN: MULTIPLE IMAGE GALLERY & DESCRIPTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="detail-info-card" style={{ padding: '20px' }}>
            <h3 className="section-heading" style={{ marginBottom: '16px' }}>
              Property Photo Gallery
            </h3>
            <OwnerPropertyGallery images={property.images} name={property.name} />
          </div>

          <div className="detail-info-card">
            <h3 className="section-heading">Description</h3>
            <p className="text-muted" style={{ lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {property.description || 'No detailed description provided for this property listing.'}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: PROPERTY SPECIFICATIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="detail-price-box">
            <span>Starting Monthly Rent</span>
            <strong>{property.price || `₹${(property.priceValue || 0).toLocaleString('en-IN')}/mo`}</strong>
          </div>

          <div className="detail-info-card">
            <h3 className="section-heading">Key Information</h3>
            <div className="property-metrics" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <span>City</span>
                <strong>{property.city || 'Ahmedabad'}</strong>
              </div>
              <div>
                <span>Area</span>
                <strong>{property.area || 'N/A'}</strong>
              </div>
              <div>
                <span>Gender</span>
                <strong className="text-jade">{property.gender || 'Unisex'}</strong>
              </div>
              <div>
                <span>Occupancy</span>
                <strong>{property.occupancy || 'Available'}</strong>
              </div>
              <div>
                <span>Rating</span>
                <strong className="rating-flex">
                  <Star size={14} className="fill-star" /> {Number(property.rating || 0).toFixed(1)}
                </strong>
              </div>
              <div>
                <span>Reviews Count</span>
                <strong>{property.reviews || 0} reviews</strong>
              </div>
            </div>
          </div>

          {/* ROOM TYPES */}
          <div className="detail-info-card">
            <h3 className="section-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} /> Room Types
            </h3>
            <div className="chips-wrapper">
              {Array.isArray(property.roomTypes) && property.roomTypes.length > 0 ? (
                property.roomTypes.map((rt, i) => (
                  <span key={i} className="chip-button active">
                    {rt}
                  </span>
                ))
              ) : (
                <span className="text-muted">No room types specified.</span>
              )}
            </div>
          </div>

          {/* AMENITIES */}
          <div className="detail-info-card">
            <h3 className="section-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={18} /> Amenities & Facilities
            </h3>
            <div className="chips-wrapper">
              {Array.isArray(property.amenities) && property.amenities.length > 0 ? (
                property.amenities.map((am, i) => (
                  <span key={i} className="chip-button active">
                    ✓ {am}
                  </span>
                ))
              ) : (
                <span className="text-muted">No amenities specified.</span>
              )}
            </div>
          </div>

          {/* SYSTEM METADATA */}
          <div className="detail-info-card" style={{ fontSize: '0.85rem' }}>
            <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Created: {property.createdAt ? new Date(property.createdAt).toLocaleDateString('en-IN') : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Property</h3>
            <p>Are you sure you want to delete <strong>"{property.name}"</strong>?</p>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              This property will be deactivated and hidden from public searches.
            </p>
            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-button danger-button"
                onClick={handleDelete}
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
