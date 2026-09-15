import { useState } from 'react'
import { UploadCloud, Link as LinkIcon, X, Plus, Image as ImageIcon } from 'lucide-react'
import { getImageUrl } from '../../services/api.js'

export default function ImageUploader({
  existingUrls = [],
  newFiles = [],
  onUrlsChange,
  onFilesChange,
}) {
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')

  // Add online URL string
  const handleAddUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setUrlError('URL must start with http:// or https://')
      return
    }

    setUrlError('')
    onUrlsChange([...existingUrls, trimmed])
    setUrlInput('')
  }

  // Remove existing online URL
  const handleRemoveUrl = (index) => {
    const next = [...existingUrls]
    next.splice(index, 1)
    onUrlsChange(next)
  }

  // Handle local file selection
  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    const validFiles = selected.filter((file) => {
      const isImg = file.type.startsWith('image/')
      const isSmall = file.size <= 5 * 1024 * 1024 // 5MB limit
      return isImg && isSmall
    })

    onFilesChange([...newFiles, ...validFiles])
    // Reset file input value
    e.target.value = ''
  }

  // Remove selected local file
  const handleRemoveFile = (index) => {
    const next = [...newFiles]
    next.splice(index, 1)
    onFilesChange(next)
  }

  const totalImages = existingUrls.length + newFiles.length

  return (
    <div className="image-uploader-container">
      <div className="uploader-header">
        <label className="form-label">
          Property Images ({totalImages} selected)
        </label>
        <span className="muted-copy">
          Supports online image URLs and local file uploads (JPG, PNG, WEBP).
        </span>
      </div>

      {/* Online Image URL Input */}
      <div className="url-input-row">
        <div className="url-input-wrap">
          <LinkIcon size={16} className="url-icon" />
          <input
            type="url"
            className="owner-input"
            placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddUrl()
              }
            }}
          />
        </div>
        <button
          type="button"
          className="ghost-button compact-button"
          onClick={handleAddUrl}
        >
          <Plus size={16} /> Add URL
        </button>
      </div>
      {urlError && <p className="field-error">{urlError}</p>}

      {/* Local Drag & Drop / File Input Box */}
      <div className="dropzone-box">
        <UploadCloud size={36} className="text-muted mb-2" />
        <p className="dropzone-title">
          Drag and drop local image files, or click to browse
        </p>
        <span className="dropzone-sub">
          Maximum 10 images. Up to 5MB each.
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          multiple
          className="file-input-overlay"
          onChange={handleFileSelect}
        />
      </div>

      {/* Image Previews Grid */}
      {totalImages > 0 && (
        <div className="preview-grid">
          {/* Previews for Online URLs */}
          {existingUrls.map((url, idx) => (
            <div className="preview-item" key={`url-${idx}`}>
              <img src={getImageUrl(url)} alt={`Online image ${idx + 1}`} />
              <span className="preview-badge url-badge">URL</span>
              <button
                type="button"
                className="remove-preview-btn"
                onClick={() => handleRemoveUrl(idx)}
                title="Remove Image"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Previews for Local Selected Files */}
          {newFiles.map((file, idx) => {
            const objectUrl = URL.createObjectURL(file)
            return (
              <div className="preview-item" key={`file-${idx}`}>
                <img src={objectUrl} alt={`Local upload ${file.name}`} />
                <span className="preview-badge file-badge">Local</span>
                <button
                  type="button"
                  className="remove-preview-btn"
                  onClick={() => handleRemoveFile(idx)}
                  title="Remove Image"
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
