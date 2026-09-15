import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Star, Eye, Edit3, Trash2, ShieldCheck, Tag, Users } from 'lucide-react'
import { getImageUrl } from '../../services/api.js'

const DEFAULT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'

export default function OwnerPropertyCard({ property, onView, onEdit, onDelete }) {
  const [imgError, setImgError] = useState(false)

  const propertyId = property.id ?? property.propertyId
  const mainImageRaw = Array.isArray(property.images) && property.images.length > 0 ? property.images[0] : null
  const mainImageUrl = imgError || !mainImageRaw ? DEFAULT_PLACEHOLDER : getImageUrl(mainImageRaw)

  return (
    <motion.div
      className="owner-property-card 3d-tilt-card"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="property-image-wrapper">
        <img
          src={mainImageUrl}
          alt={property.name}
          onError={() => setImgError(true)}
        />
        <div className={`property-badge ${property.isActive !== false ? 'verified' : 'pending'}`}>
          <ShieldCheck size={14} />
          {property.isActive !== false ? 'Active' : 'Inactive'}
        </div>
        {Array.isArray(property.images) && property.images.length > 1 && (
          <div className="image-count-tag">
            📷 {property.images.length} photos
          </div>
        )}
      </div>

      <div className="property-card-body">
        <div className="property-card-header">
          <h3>{property.name}</h3>
        </div>

        <p className="property-location">
          <MapPin size={14} /> {property.location || `${property.area}, ${property.city}`}
        </p>

        <div className="property-metrics">
          <div>
            <span>City / Area</span>
            <strong>{property.city || 'Ahmedabad'} ({property.area || 'N/A'})</strong>
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
              <Star size={12} className="fill-star" /> {Number(property.rating || 0).toFixed(1)} ({property.reviews || 0})
            </strong>
          </div>
        </div>

        {Array.isArray(property.roomTypes) && property.roomTypes.length > 0 && (
          <div className="card-tags-row">
            <span className="tags-label"><Users size={12} /> Rooms:</span>
            {property.roomTypes.slice(0, 3).map((room, i) => (
              <span key={i} className="mini-chip">{room}</span>
            ))}
          </div>
        )}

        {Array.isArray(property.amenities) && property.amenities.length > 0 && (
          <div className="card-tags-row">
            <span className="tags-label"><Tag size={12} /> Amenities:</span>
            {property.amenities.slice(0, 4).map((am, i) => (
              <span key={i} className="mini-chip">{am}</span>
            ))}
            {property.amenities.length > 4 && (
              <span className="mini-chip more">+{property.amenities.length - 4}</span>
            )}
          </div>
        )}

        {property.description && (
          <p className="card-desc-snippet">{property.description}</p>
        )}

        <div className="property-card-footer">
          <div className="rent-info">
            <span>Price</span>
            <strong>{property.price || `₹${(property.priceValue || 0).toLocaleString('en-IN')}/mo`}</strong>
          </div>

          <div className="card-actions">
            {onView && (
              <button
                type="button"
                className="ghost-button compact-button"
                onClick={() => onView(propertyId)}
                title="View Property Details"
              >
                <Eye size={15} /> Details
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                className="ghost-button compact-button"
                onClick={() => onEdit(propertyId)}
                title="Edit Property"
              >
                <Edit3 size={15} /> Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="ghost-button compact-button danger-button"
                onClick={() => onDelete(propertyId, property.name)}
                title="Delete Property"
              >
                <Trash2 size={15} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
