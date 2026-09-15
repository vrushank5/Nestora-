import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import PropertyForm from '../../../components/owner/PropertyForm.jsx'
import { propertyService } from '../../../services/propertyService.js'

export default function PropertyEdit() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [initialData, setInitialData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await propertyService.getPropertyById(id)
        if (!data) {
          throw new Error('Property not found.')
        }
        setInitialData(data)
      } catch (err) {
        console.error('Error fetching property for edit:', err)
        setError(err.message || 'Unable to load property details.')
      } finally {
        setLoading(false)
      }
    }

    loadProperty()
  }, [id])

  const handleUpdateProperty = async (payload) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await propertyService.updateProperty(id, payload)
      navigate(`/owner/properties/${id}`, {
        state: { message: 'Property updated successfully!' },
      })
    } catch (err) {
      console.error('Error updating property:', err)
      setError(err.message || 'Could not update property. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="owner-page" style={{ maxWidth: '960px' }}>
        <div className="loading-state-wrapper">
          <div className="spinner"></div>
          <h3>Loading Property Data...</h3>
          <p className="text-muted">Fetching property #{id} details from backend.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="owner-page" style={{ maxWidth: '960px' }}>
      <div className="owner-page-header">
        <div>
          <Link to={`/owner/properties/${id}`} className="owner-text-btn mb-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={16} /> Back to Property Details
          </Link>
          <h1 className="owner-greeting">Edit Property #{id}</h1>
          <p className="owner-subtitle">
            Update listing info, images, pricing, amenities, or active status.
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

      {initialData && (
        <PropertyForm
          initialData={initialData}
          onSubmit={handleUpdateProperty}
          onCancel={() => navigate(`/owner/properties/${id}`)}
          isSubmitting={isSubmitting}
          submitLabel="Save Changes"
        />
      )}
    </div>
  )
}
