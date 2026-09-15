import { useParams, Link } from 'react'
import { ChevronLeft, ShieldCheck, MapPin, Star } from 'lucide-react'
import { residences } from '../../data/homeData.js'

export default function PropertyDetail() {
  const { id } = useParams()
  const property = residences.find(r => r.id === id) || residences[0]

  return (
    <div className="admin-page" style={{ maxWidth: '1000px' }}>
      <Link to="/admin/properties" className="r-back-link"><ChevronLeft size={18} /> Back to All Properties</Link>

      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <span className="status-badge active"><ShieldCheck size={13} /> Verified Property</span>
            <span className="r-gender-badge">{property.gender}</span>
          </div>
          <h1 className="admin-page-title">{property.name}</h1>
          <p className="admin-page-subtitle"><MapPin size={14} /> {property.location} · ID: {property.id}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="ghost-button compact-button danger-button">Suspend Property</button>
        </div>
      </div>

      <div className="r-gallery-main" style={{ height: '320px', marginBottom: '24px' }}>
        <img src={property.image} alt={property.name} />
      </div>

      <div className="admin-dashboard-grid" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-pane">
            <h3 style={{ marginBottom: '14px' }}>About Property</h3>
            <p className="muted-copy">{property.description}</p>
          </div>

          <div className="admin-pane">
            <h3 style={{ marginBottom: '14px' }}>Amenities</h3>
            <div className="r-amenities-grid">
              {property.amenities.map(a => (
                <div key={a} className="r-amenity-item">
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-pane">
            <h3 style={{ marginBottom: '14px' }}>Owner Info</h3>
            <div className="r-booking-details">
              <div><span>Owner Name</span><strong>Owner Partner</strong></div>
              <div><span>Contact</span><strong>+91 9876543213</strong></div>
              <div><span>Email</span><strong>owner@nestora.com</strong></div>
            </div>
          </div>

          <div className="admin-pane">
            <h3 style={{ marginBottom: '14px' }}>Pricing & Occupancy</h3>
            <div className="r-booking-details">
              <div><span>Monthly Rent</span><strong style={{ color: 'var(--jade)' }}>{property.price}</strong></div>
              <div><span>Rating</span><strong><Star size={13} fill="var(--saffron)" color="var(--saffron)" /> {property.rating}</strong></div>
              <div><span>Occupancy</span><strong>{property.occupancy}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
