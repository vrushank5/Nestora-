import { useEffect, useMemo, useState } from 'react'
import { Car, Coffee, Droplets, Fan, Plus, Sparkles, Tv, Wifi, X } from 'lucide-react'
import { apiRequest } from '../../services/api.js'
import { propertyService } from '../../services/propertyService.js'

const amenityIcons = {
  wifi: Wifi,
  'wi-fi': Wifi,
  parking: Car,
  tv: Tv,
  'smart tv': Tv,
  ac: Fan,
  'air conditioning': Fan,
  meals: Coffee,
  'meals included': Coffee,
  'hot water': Droplets,
}

const defaultForm = {
  name: '',
  category: 'General',
  icon: '',
  propertyIds: [],
}

export default function Amenities() {
  const [amenities, setAmenities] = useState([])
  const [properties, setProperties] = useState([])
  const [form, setForm] = useState(defaultForm)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    const [amenityResponse, ownerProperties] = await Promise.all([
      apiRequest('/amenities', { token: null }),
      propertyService.getOwnerProperties(),
    ])
    setAmenities(amenityResponse.data || [])
    setProperties(ownerProperties)
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [amenityResponse, ownerProperties] = await Promise.all([
          apiRequest('/amenities', { token: null }),
          propertyService.getOwnerProperties(),
        ])
        if (!active) return
        setAmenities(amenityResponse.data || [])
        setProperties(ownerProperties)
      } catch (err) {
        if (active) setError(err.message || 'Unable to load amenities.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const amenityCards = useMemo(() => {
    const propertyCounts = properties.reduce((counts, property) => {
      ;(property.amenities || []).forEach((name) => {
        const key = String(name || '').trim().toLowerCase()
        if (!key) return
        counts[key] = (counts[key] || 0) + 1
      })
      return counts
    }, {})

    const catalogCards = amenities.map((amenity) => {
      const key = String(amenity.name || '').trim().toLowerCase()
      return {
        id: amenity.amenityId || key,
        name: amenity.name,
        category: amenity.category || 'General',
        count: propertyCounts[key] || 0,
        icon: amenityIcons[key] || Sparkles,
      }
    })

    const catalogKeys = new Set(catalogCards.map((item) => String(item.name || '').trim().toLowerCase()))
    const propertyOnlyCards = Object.entries(propertyCounts)
      .filter(([key]) => !catalogKeys.has(key))
      .map(([key, count]) => ({
        id: key,
        name: key.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        category: 'Property',
        count,
        icon: amenityIcons[key] || Sparkles,
      }))

    return [...catalogCards, ...propertyOnlyCards].sort((a, b) => a.name.localeCompare(b.name))
  }, [amenities, properties])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const toggleProperty = (propertyId) => {
    setForm((current) => {
      const hasProperty = current.propertyIds.includes(propertyId)
      return {
        ...current,
        propertyIds: hasProperty
          ? current.propertyIds.filter((id) => id !== propertyId)
          : [...current.propertyIds, propertyId],
      }
    })
  }

  const openModal = () => {
    setForm(defaultForm)
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const cleanName = form.name.trim()

    if (!cleanName) {
      setError('Amenity name is required.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const existing = amenities.find((amenity) => amenity.name.toLowerCase() === cleanName.toLowerCase())
      if (!existing) {
        await apiRequest('/amenities', {
          method: 'POST',
          body: JSON.stringify({
            name: cleanName,
            category: form.category.trim() || 'General',
            icon: form.icon.trim(),
          }),
        })
      }

      const selectedProperties = properties.filter((property) => form.propertyIds.includes(property.propertyId))
      await Promise.all(selectedProperties.map((property) => {
        const currentAmenities = Array.isArray(property.amenities) ? property.amenities : []
        const alreadyAssigned = currentAmenities.some((item) => item.toLowerCase() === cleanName.toLowerCase())
        if (alreadyAssigned) return Promise.resolve()

        return propertyService.updateProperty(property.propertyId, {
          amenities: [...currentAmenities, cleanName],
        })
      }))

      await loadData()
      setShowModal(false)
      setSuccess('Amenity saved successfully.')
    } catch (err) {
      setError(err.message || 'Unable to save amenity.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Amenities</h1>
          <p className="owner-subtitle">Manage the facilities available across your properties.</p>
        </div>
        <button className="primary-button" type="button" onClick={openModal}>
          <Plus size={16} /> Add Amenity
        </button>
      </div>

      {success && (
        <div className="owner-error-banner" style={{ background: 'var(--sky)', color: 'var(--jade)', borderColor: 'var(--jade)' }}>
          <span>{success}</span>
        </div>
      )}

      {error && !showModal && (
        <div className="owner-error-banner">
          <span>{error}</span>
        </div>
      )}

      <div className="owner-property-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {amenityCards.map((amenity) => (
          <div key={amenity.id} className="owner-stat-card 3d-tilt-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div className="stat-icon" style={{ width: '64px', height: '64px', marginBottom: '16px' }}>
              <amenity.icon size={28} />
            </div>
            <strong style={{ fontSize: '1.1rem' }}>{amenity.name}</strong>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>{amenity.category}</p>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>Available in {amenity.count} properties</p>
          </div>
        ))}
      </div>

      {!loading && amenityCards.length === 0 && (
        <div className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
          <h3>No amenities yet</h3>
          <p className="muted-copy">Add amenities and assign them to your properties.</p>
        </div>
      )}

      {loading && (
        <div className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
          <h3>Loading amenities...</h3>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(event) => event.stopPropagation()}>
            <button className="close-modal-btn" type="button" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>
            <h2>Add Amenity</h2>
            <p className="muted-copy">Save a new facility and assign it to your properties.</p>

            {error && (
              <p className="form-status form-status-error">{error}</p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field form-grid-full">
                  <label>Amenity Name</label>
                  <input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Eg. Laundry" />
                </div>

                <div className="form-field">
                  <label>Category</label>
                  <select value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
                    <option>General</option>
                    <option>Comfort</option>
                    <option>Food</option>
                    <option>Safety</option>
                    <option>Utility</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Icon Name</label>
                  <input value={form.icon} onChange={(event) => updateForm('icon', event.target.value)} placeholder="Optional" />
                </div>
              </div>

              <div className="form-field" style={{ marginTop: '16px' }}>
                <label>Assign To Properties</label>
                <div style={{ display: 'grid', gap: '10px', maxHeight: '180px', overflow: 'auto', padding: '4px' }}>
                  {properties.length === 0 ? (
                    <p className="muted-copy">No properties available.</p>
                  ) : properties.map((property) => (
                    <label key={property.propertyId} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
                      <input
                        type="checkbox"
                        checked={form.propertyIds.includes(property.propertyId)}
                        onChange={() => toggleProperty(property.propertyId)}
                      />
                      {property.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button className="ghost-button compact-button" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="primary-button compact-button" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Amenity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
