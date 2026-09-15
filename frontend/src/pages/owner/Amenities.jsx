import { useEffect, useState } from 'react'
import { Sparkles, Wifi, Car, Tv, Fan, Coffee, Droplets } from 'lucide-react'
import { propertyService } from '../../services/propertyService.js'

const amenityIcons = { wifi: Wifi, 'wi-fi': Wifi, parking: Car, tv: Tv, 'smart tv': Tv, ac: Fan, 'air conditioning': Fan, meals: Coffee, 'meals included': Coffee, 'hot water': Droplets }

export default function Amenities() {
  const [amenities, setAmenities] = useState([])

  useEffect(() => {
    propertyService.getOwnerProperties().then(properties => {
      const counts = properties.reduce((result, property) => {
        ;(property.amenities || []).forEach(name => {
          const key = name.trim().toLowerCase()
          result[key] = { id: key, name, count: (result[key]?.count || 0) + 1, icon: amenityIcons[key] || Sparkles }
        })
        return result
      }, {})
      setAmenities(Object.values(counts))
    })
  }, [])

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Amenities</h1>
          <p className="owner-subtitle">Manage the facilities available across your properties.</p>
        </div>
        <button className="primary-button"><Sparkles size={16}/> Add Amenity</button>
      </div>

      <div className="owner-property-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'}}>
        {amenities.map(am => (
          <div key={am.id} className="owner-stat-card 3d-tilt-card" style={{flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
            <div className="stat-icon" style={{width: '64px', height: '64px', marginBottom: '16px'}}>
              <am.icon size={28} />
            </div>
            <strong style={{fontSize: '1.1rem'}}>{am.name}</strong>
            <p className="text-muted" style={{fontSize: '0.85rem', marginTop: '4px'}}>Available in {am.count} properties</p>
          </div>
        ))}
      </div>
    </div>
  )
}
