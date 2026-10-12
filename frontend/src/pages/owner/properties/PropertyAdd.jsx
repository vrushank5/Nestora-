import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import PropertyForm from '../../../components/owner/PropertyForm.jsx'
import { propertyService } from '../../../services/propertyService.js'
import { ownerApi } from '../../../services/api.js'

export default function PropertyAdd() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [listingDefaults, setListingDefaults] = useState({ city: 'Ahmedabad', gender: 'Unisex' })

  useEffect(() => {
    let active = true
    ownerApi.getSettings()
      .then(({ data }) => {
        if (active) {
          setListingDefaults({
            city: data?.properties?.defaultCity || 'Ahmedabad',
            gender: data?.properties?.defaultAllowedGender || 'Unisex',
          })
        }
      })
      .catch((loadError) => {
        if (active) {
          console.error('Could not load owner listing preferences:', loadError)
          setError(`Could not load your saved listing preferences. You can still create a property using the defaults shown.`)
        }
      })
    return () => { active = false }
  }, [])

  const handleCreateProperty = async (payload) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await propertyService.createProperty(payload)
      navigate('/owner/properties', {
        state: { message: 'Property created successfully!' },
      })
    } catch (err) {
      console.error('Error creating property:', err)
      setError(err.message || 'Could not create property. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="owner-page" style={{ maxWidth: '960px' }}>
      <div className="owner-page-header">
        <div>
          <Link to="/owner/properties" className="owner-text-btn mb-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={16} /> Back to My Properties
          </Link>
          <h1 className="owner-greeting">Add New Property</h1>
          <p className="owner-subtitle">
            Fill in the details below to list your co-living space on Nestora.
          </p>
        </div>
      </div>

      {error && (
        <div className="owner-error-banner mb-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      <PropertyForm
        initialData={{ city: listingDefaults.city, gender: listingDefaults.gender }}
        applyUpdatedDefaults
        onSubmit={handleCreateProperty}
        onCancel={() => navigate('/owner/properties')}
        isSubmitting={isSubmitting}
        submitLabel="Publish Property Listing"
      />
    </div>
  )
}
