import { useState } from 'react'
import ImageUploader from './ImageUploader.jsx'

const STANDARD_AMENITIES = ['Wi-Fi', 'AC', 'Laundry', 'Food', 'Parking', 'CCTV', 'Power Backup', 'Cleaning']
const STANDARD_ROOM_TYPES = ['Single', 'Double', 'Triple', 'Twin Sharing', 'Studio']

export default function PropertyForm({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save Property',
}) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    city: initialData.city || 'Ahmedabad',
    area: initialData.area || '',
    location: initialData.location || '',
    price: initialData.price || '₹',
    priceValue: initialData.priceValue !== undefined ? String(initialData.priceValue) : '',
    securityDeposit: initialData.securityDeposit !== undefined ? String(initialData.securityDeposit) : '0',
    gender: initialData.gender || 'Unisex',
    occupancy: initialData.occupancy || 'Available',
    description: initialData.description || '',
    isActive: initialData.isActive !== false,
  })

  const [amenities, setAmenities] = useState(
    Array.isArray(initialData.amenities) ? initialData.amenities : ['Wi-Fi', 'AC']
  )
  const [roomTypes, setRoomTypes] = useState(
    Array.isArray(initialData.roomTypes) ? initialData.roomTypes : ['Single', 'Double']
  )

  const [existingUrls, setExistingUrls] = useState(
    Array.isArray(initialData.images) ? initialData.images : []
  )
  const [newFiles, setNewFiles] = useState([])

  const [customAmenity, setCustomAmenity] = useState('')
  const [customRoomType, setCustomRoomType] = useState('')
  const [errors, setErrors] = useState({})

  // Price Sync helper
  const handlePriceValueChange = (val) => {
    const num = Number(val)
    setFormData((prev) => ({
      ...prev,
      priceValue: val,
      price: val ? `₹${num.toLocaleString('en-IN')}/month` : '',
    }))
  }

  // Toggle amenity selection
  const toggleAmenity = (item) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    )
  }

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim()
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities((prev) => [...prev, trimmed])
      setCustomAmenity('')
    }
  }

  // Toggle room type selection
  const toggleRoomType = (item) => {
    setRoomTypes((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
    )
  }

  const addCustomRoomType = () => {
    const trimmed = customRoomType.trim()
    if (trimmed && !roomTypes.includes(trimmed)) {
      setRoomTypes((prev) => [...prev, trimmed])
      setCustomRoomType('')
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Property name is required'
    if (!formData.area.trim()) newErrors.area = 'Area is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'
    if (!formData.priceValue || Number(formData.priceValue) < 0) {
      newErrors.priceValue = 'Valid price value is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const numericPrice = Number(formData.priceValue)
    const formattedPrice = formData.price.trim() || `₹${numericPrice.toLocaleString('en-IN')}/month`
    const numericSecurityDeposit = Number(formData.securityDeposit)

    // If local files are attached, construct FormData
    if (newFiles.length > 0) {
      const payload = new FormData()
      payload.append('name', formData.name.trim())
      payload.append('city', formData.city.trim() || 'Ahmedabad')
      payload.append('area', formData.area.trim())
      payload.append('location', formData.location.trim())
      payload.append('price', formattedPrice)
      payload.append('priceValue', String(numericPrice))
      payload.append('securityDeposit', String(numericSecurityDeposit))
      payload.append('gender', formData.gender)
      payload.append('occupancy', formData.occupancy.trim())
      payload.append('description', formData.description.trim())
      payload.append('isActive', String(formData.isActive))

      payload.append('amenities', JSON.stringify(amenities))
      payload.append('roomTypes', JSON.stringify(roomTypes))
      payload.append('images', JSON.stringify(existingUrls))

      newFiles.forEach((file) => {
        payload.append('images', file)
      })

      onSubmit(payload)
    } else {
      // Standard JSON payload
      const payload = {
        name: formData.name.trim(),
        city: formData.city.trim() || 'Ahmedabad',
        area: formData.area.trim(),
        location: formData.location.trim(),
        price: formattedPrice,
        priceValue: numericPrice,
        securityDeposit: numericSecurityDeposit,
        gender: formData.gender,
        occupancy: formData.occupancy.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive,
        amenities,
        roomTypes,
        images: existingUrls,
      }
      onSubmit(payload)
    }
  }

  return (
    <form className="property-form-card" onSubmit={handleSubmit}>
      <div className="form-section">
        <h3 className="section-heading">Basic Information</h3>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">
              Property Name <span className="req">*</span>
            </label>
            <input
              type="text"
              className={`owner-input ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g. Green Home Co-Living"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Gender Allowed</label>
            <select
              className="owner-select"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="Unisex">Unisex / All</option>
              <option value="Male">Male Only</option>
              <option value="Female">Female Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-heading">Location</h3>
        <div className="form-grid-3">
          <div className="form-group">
            <label className="form-label">City</label>
            <input
              type="text"
              className="owner-input"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Area / Locality <span className="req">*</span>
            </label>
            <input
              type="text"
              className={`owner-input ${errors.area ? 'input-error' : ''}`}
              placeholder="e.g. Prahlad Nagar"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
            {errors.area && <span className="field-error">{errors.area}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Full Address / Location <span className="req">*</span>
            </label>
            <input
              type="text"
              className={`owner-input ${errors.location ? 'input-error' : ''}`}
              placeholder="e.g. Prahlad Nagar, Ahmedabad"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            {errors.location && <span className="field-error">{errors.location}</span>}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-heading">Pricing & Occupancy</h3>
        <div className="form-grid-3">
          <div className="form-group">
            <label className="form-label">
              Price Amount (₹/mo) <span className="req">*</span>
            </label>
            <input
              type="number"
              className={`owner-input ${errors.priceValue ? 'input-error' : ''}`}
              placeholder="e.g. 9000"
              value={formData.priceValue}
              onChange={(e) => handlePriceValueChange(e.target.value)}
            />
            {errors.priceValue && <span className="field-error">{errors.priceValue}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Security Deposit (₹)</label>
            <input
              type="number"
              className="owner-input"
              placeholder="e.g. 18000"
              min="0"
              value={formData.securityDeposit}
              onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Formatted Rent String</label>
            <input
              type="text"
              className="owner-input"
              placeholder="e.g. ₹9,000/month"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Occupancy Status</label>
            <select
              className="owner-select"
              value={formData.occupancy}
              onChange={(e) => setFormData({ ...formData, occupancy: e.target.value })}
            >
              <option value="Available">Available</option>
              <option value="New listing">New listing</option>
              <option value="Few Rooms Left">Few Rooms Left</option>
              <option value="Fully Occupied">Fully Occupied</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-heading">Amenities</h3>
        <div className="chips-wrapper">
          {STANDARD_AMENITIES.map((am) => (
            <button
              type="button"
              key={am}
              className={`chip-button ${amenities.includes(am) ? 'active' : ''}`}
              onClick={() => toggleAmenity(am)}
            >
              {amenities.includes(am) ? '✓ ' : '+ '}
              {am}
            </button>
          ))}
          {amenities
            .filter((a) => !STANDARD_AMENITIES.includes(a))
            .map((am) => (
              <button
                type="button"
                key={am}
                className="chip-button active custom-chip"
                onClick={() => toggleAmenity(am)}
              >
                ✓ {am}
              </button>
            ))}
        </div>
        <div className="custom-input-row">
          <input
            type="text"
            className="owner-input sm"
            placeholder="Add custom amenity..."
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomAmenity()
              }
            }}
          />
          <button type="button" className="ghost-button compact-button" onClick={addCustomAmenity}>
            Add
          </button>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-heading">Room Types</h3>
        <div className="chips-wrapper">
          {STANDARD_ROOM_TYPES.map((rt) => (
            <button
              type="button"
              key={rt}
              className={`chip-button ${roomTypes.includes(rt) ? 'active' : ''}`}
              onClick={() => toggleRoomType(rt)}
            >
              {roomTypes.includes(rt) ? '✓ ' : '+ '}
              {rt}
            </button>
          ))}
          {roomTypes
            .filter((r) => !STANDARD_ROOM_TYPES.includes(r))
            .map((rt) => (
              <button
                type="button"
                key={rt}
                className="chip-button active custom-chip"
                onClick={() => toggleRoomType(rt)}
              >
                ✓ {rt}
              </button>
            ))}
        </div>
        <div className="custom-input-row">
          <input
            type="text"
            className="owner-input sm"
            placeholder="Add custom room type..."
            value={customRoomType}
            onChange={(e) => setCustomRoomType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomRoomType()
              }
            }}
          />
          <button type="button" className="ghost-button compact-button" onClick={addCustomRoomType}>
            Add
          </button>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-heading">Property Images</h3>
        <ImageUploader
          existingUrls={existingUrls}
          newFiles={newFiles}
          onUrlsChange={setExistingUrls}
          onFilesChange={setNewFiles}
        />
      </div>

      <div className="form-section">
        <h3 className="section-heading">Description & Status</h3>
        <div className="form-group mb-4">
          <label className="form-label">Description</label>
          <textarea
            className="owner-textarea"
            rows="4"
            placeholder="Describe your co-living space, furnishings, house rules, and nearby points of interest..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="checkbox-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <span>Active Property Listing (Visible on public search)</span>
          </label>
        </div>
      </div>

      <div className="form-actions-bar">
        {onCancel && (
          <button type="button" className="ghost-button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
