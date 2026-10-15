import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GitCompare, X, Star, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react'
import { propertyService } from '../../services/propertyService.js'
import { getImageUrl } from '../../services/api.js'

const compareFields = [
  { key: 'location', label: 'Location' },
  { key: 'price', label: 'Monthly Rent' },
  { key: 'rating', label: 'Rating' },
  { key: 'gender', label: 'Gender' },
  { key: 'occupancy', label: 'Status' },
]

const amenityList = ['Wi-Fi', 'Meals', 'AC', 'Laundry', 'Security', 'Housekeeping', 'Parking']

export default function Compare() {
  const [searchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [selected, setSelected] = useState([])

  useEffect(() => {
    propertyService.getAllProperties().then(data => {
      const normalized = data.map(property => ({ ...property, image: getImageUrl(property.images?.[0] || property.image) }))
      setProperties(normalized)
      const requestedId = Number(searchParams.get('property'))
      const requested = normalized.find(property => property.id === requestedId)
      setSelected(current => current.length ? current : requested
        ? [requested.id, ...normalized.filter(property => property.id !== requested.id).slice(0, 1).map(property => property.id)]
        : normalized.slice(0, 2).map(property => property.id))
    })
  }, [searchParams])

  const addProperty = (id) => {
    if (selected.includes(id) || selected.length >= 3) return
    setSelected([...selected, id])
  }
  const removeProperty = (id) => setSelected(selected.filter(x => x !== id))

  const compareProps = properties.filter(r => selected.includes(r.id))

  return (
    <div className="r-page">
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">Compare Properties</h1>
          <p className="r-page-subtitle">Compare up to 3 properties side-by-side to find your best match.</p>
        </div>
      </div>

      {/* Selector */}
      <div className="r-compare-selector">
        <h3>Add Properties to Compare</h3>
        <div className="r-compare-options">
          {properties.map(r => (
            <button
              key={r.id}
              className={`r-compare-option ${selected.includes(r.id) ? 'selected' : ''}`}
              onClick={() => selected.includes(r.id) ? removeProperty(r.id) : addProperty(r.id)}
              disabled={!selected.includes(r.id) && selected.length >= 3}
            >
              <img src={r.image} alt={r.name} />
              <span>{r.name}</span>
              {selected.includes(r.id) && <CheckCircle size={16} className="r-check" />}
            </button>
          ))}
        </div>
      </div>

      {compareProps.length < 2 ? (
        <div className="empty-state">
          <GitCompare size={42} />
          <h3>Select at least 2 properties</h3>
          <p>Pick properties above to start comparing them side by side.</p>
        </div>
      ) : (
        <div className="r-compare-table-wrapper">
          <table className="r-compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                {compareProps.map(p => (
                  <th key={p.id}>
                    <div className="r-compare-header">
                      <button className="r-compare-remove" onClick={() => removeProperty(p.id)}><X size={14} /></button>
                      <img src={p.image} alt={p.name} />
                      <strong>{p.name}</strong>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
                        <span className="r-verified-badge"><ShieldCheck size={11} /> Verified</span>
                        {p.priceValue === Math.min(...compareProps.map(x => x.priceValue)) && <span className="r-best-tag r-best-price">Best Price</span>}
                        {p.rating === compareProps.reduce((max, x) => Number(x.rating) > Number(max.rating) ? x : max).rating && <span className="r-best-tag r-best-rated">Top Rated</span>}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareFields.map(field => (
                <tr key={field.key}>
                  <td className="r-compare-field-label">{field.label}</td>
                  {compareProps.map(p => (
                    <td key={p.id} className="r-compare-value">
                      {field.key === 'rating' ? (
                        <span className="r-rating-cell"><Star size={14} fill="var(--saffron)" color="var(--saffron)" /> {p[field.key]}</span>
                      ) : field.key === 'price' ? (
                        <strong>{p[field.key].replace('Rs.', '$').replace('₹', '$')}</strong>
                      ) : p[field.key]}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="r-compare-field-label">Amenities</td>
                {compareProps.map(p => (
                  <td key={p.id}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {amenityList.map(a => (
                        <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                          {p.amenities.includes(a) ? (
                            <CheckCircle size={14} color="var(--jade)" />
                          ) : (
                            <AlertCircle size={14} color="var(--muted)" opacity={0.4} />
                          )}
                          <span style={{ color: p.amenities.includes(a) ? 'var(--ink)' : 'var(--muted)', opacity: p.amenities.includes(a) ? 1 : 0.5 }}>{a}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="r-compare-field-label">Action</td>
                {compareProps.map(p => (
                  <td key={p.id}>
                    <Link to={`/resident/property/${p.id}`} className="primary-button compact-button">View Details</Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
