import { ArrowRight, BadgeCheck, Heart, MapPin, Star, Wifi } from 'lucide-react'
import { motion } from 'framer-motion'

function PropertyCard({ residence, disabled = false, saved = false, onSave, onView }) {
  return (
    <motion.article
      className={`property-card ${disabled ? 'is-disabled' : ''}`}
      whileHover={disabled ? undefined : { y: -6 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <div className="property-image">
        <img src={residence.image} alt={`${residence.name} residence`} loading="lazy" />
        <span className="verified-pill"><BadgeCheck size={15} /> Verified</span>
        <button
          className={`favorite-button ${saved ? 'active' : ''}`}
          type="button"
          aria-label={`Save ${residence.name}`}
          disabled={disabled}
          onClick={onSave}
        >
          <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="property-body">
        <div className="property-title-row">
          <div>
            <h3>{residence.name}</h3>
            <p><MapPin size={15} /> {residence.location}</p>
          </div>
          <span className="rating"><Star size={15} fill="currentColor" /> {residence.rating}</span>
        </div>

        <p className="property-description">{residence.description}</p>

        <div className="amenity-tags">
          {residence.amenities.slice(0, 3).map((item) => (
            <span key={item}><Wifi size={13} /> {item}</span>
          ))}
        </div>

        <div className="property-foot">
          <div>
            <strong>{String(residence.price || '').replace(/₹|Rs\.?/g, '$')}</strong>
            <small>{residence.occupancy || `${residence.reviews} reviews`}</small>
          </div>
          <button className="primary-button compact-button" type="button" disabled={disabled} onClick={onView}>
            Details <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

export default PropertyCard
