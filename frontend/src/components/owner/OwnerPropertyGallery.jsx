import { useState } from 'react'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { getImageUrl } from '../../services/api.js'

const DEFAULT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80'

export default function OwnerPropertyGallery({ images = [], name = 'Property' }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [imageErrorMap, setImageErrorMap] = useState({})

  const cleanImages = Array.isArray(images) && images.length > 0 ? images : []

  if (cleanImages.length === 0) {
    return (
      <div className="owner-gallery-container empty-gallery">
        <div className="gallery-placeholder">
          <ImageIcon size={48} className="text-muted" />
          <p>No property images available</p>
        </div>
      </div>
    )
  }

  const handlePrev = (e) => {
    e.stopPropagation()
    setSelectedIndex((prev) => (prev === 0 ? cleanImages.length - 1 : prev - 1))
  }

  const handleNext = (e) => {
    e.stopPropagation()
    setSelectedIndex((prev) => (prev === cleanImages.length - 1 ? 0 : prev + 1))
  }

  const currentRawUrl = cleanImages[selectedIndex]
  const currentUrl = imageErrorMap[selectedIndex]
    ? DEFAULT_PLACEHOLDER
    : getImageUrl(currentRawUrl)

  const handleImageError = (index) => {
    setImageErrorMap((prev) => ({ ...prev, [index]: true }))
  }

  return (
    <div className="owner-property-gallery">
      {/* Main Image View */}
      <div className="gallery-main-view">
        <img
          src={currentUrl}
          alt={`${name} - View ${selectedIndex + 1}`}
          onError={() => handleImageError(selectedIndex)}
        />

        {cleanImages.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-nav-btn prev-btn"
              onClick={handlePrev}
              aria-label="Previous Image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="gallery-nav-btn next-btn"
              onClick={handleNext}
              aria-label="Next Image"
            >
              <ChevronRight size={20} />
            </button>
            <div className="gallery-counter">
              {selectedIndex + 1} / {cleanImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Bar */}
      {cleanImages.length > 1 && (
        <div className="gallery-thumbnails">
          {cleanImages.map((img, idx) => {
            const thumbUrl = imageErrorMap[idx]
              ? DEFAULT_PLACEHOLDER
              : getImageUrl(img)
            return (
              <button
                type="button"
                key={idx}
                className={`thumb-btn ${idx === selectedIndex ? 'active' : ''}`}
                onClick={() => setSelectedIndex(idx)}
              >
                <img
                  src={thumbUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  onError={() => handleImageError(idx)}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
