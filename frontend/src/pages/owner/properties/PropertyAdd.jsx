import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import PropertyForm from '../../../components/owner/PropertyForm.jsx'
import { propertyService } from '../../../services/propertyService.js'

export default function PropertyAdd() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

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
        onSubmit={handleCreateProperty}
        onCancel={() => navigate('/owner/properties')}
        isSubmitting={isSubmitting}
        submitLabel="Publish Property Listing"
      />
    </div>
  )
}
