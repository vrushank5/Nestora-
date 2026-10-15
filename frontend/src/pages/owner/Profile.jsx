import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  Building2,
  Camera,
  Check,
  ChevronRight,
  CircleUserRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Save,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth.js'
import { apiRequest, getImageUrl } from '../../services/api.js'

const emptyProfile = {
  name: '',
  email: '',
  mobile: '',
  address: '',
  occupation: '',
  imageUrl: '',
}

const isProfileValue = (value) => {
  const normalized = String(value || '').trim()
  return normalized.length > 0 && !/^not provided$/i.test(normalized)
}

const splitName = (name = '') => {
  const [firstName = '', ...lastNameParts] = name.trim().split(/\s+/)
  return { firstName, lastName: lastNameParts.join(' ') }
}

const validateProfile = (profile) => {
  const errors = {}
  const { firstName, lastName } = splitName(profile.name)

  if (!firstName) errors.firstName = 'Enter your first name.'
  if (!lastName) errors.lastName = 'Enter your last name.'
  if (!/^[+]?[\d\s().-]{7,20}$/.test(profile.mobile.trim())) {
    errors.mobile = 'Enter a valid phone number.'
  }
  if (!profile.occupation.trim()) errors.occupation = 'Enter your business name.'
  if (!profile.address.trim()) errors.address = 'Enter your business address.'
  return errors
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(emptyProfile)
  const [initialProfile, setInitialProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [avatarError, setAvatarError] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const imageInputRef = useRef(null)
  const formRef = useRef(null)

  useEffect(() => {
    let current = true
    apiRequest('/owner/profile')
      .then((response) => {
        if (!current) return
        const loadedProfile = { ...emptyProfile, ...response.data }
        setProfile(loadedProfile)
        setInitialProfile(loadedProfile)
      })
      .catch((error) => {
        if (current) {
          setNotice({
            type: 'error',
            message: error.message || 'Unable to load your profile.',
          })
        }
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => { current = false }
  }, [])

  useEffect(() => {
    if (!imagePreview) return undefined
    return () => URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const completion = useMemo(() => {
    const availableFields = [
      profile.name,
      profile.email,
      profile.mobile,
      profile.address,
      profile.occupation,
      profile.imageUrl,
    ]
    const completedFields = availableFields.filter(isProfileValue).length
    return Math.round((completedFields / availableFields.length) * 100)
  }, [profile])

  const initials = profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'O'

  const updateField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setNotice(null)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    const validationErrors = validateProfile(profile)
    setErrors(validationErrors)
    setNotice(null)
    if (Object.keys(validationErrors).length) return

    const { firstName, lastName } = splitName(profile.name)
    setSaving(true)
    try {
      const response = await apiRequest('/owner/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstName,
          lastName,
          mobile: profile.mobile.trim(),
          address: profile.address.trim(),
          occupation: profile.occupation.trim(),
        }),
      })
      const savedProfile = { ...emptyProfile, ...response.data }
      setProfile(savedProfile)
      setInitialProfile(savedProfile)
      setNotice({ type: 'success', message: response.message || 'Your profile has been saved.' })
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.message || 'Unable to save your profile. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setProfile(initialProfile)
    setErrors({})
    setNotice(null)
  }

  const handleImageSelection = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotice({ type: 'error', message: 'Choose a JPG, PNG, or WEBP image.' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: 'error', message: 'Profile photos must be 5 MB or smaller.' })
      return
    }

    setUploading(true)
    setNotice(null)
    setImagePreview(URL.createObjectURL(file))
    const formData = new FormData()
    formData.append('image', file)
    try {
      const response = await apiRequest('/owner/profile/image', {
        method: 'POST',
        body: formData,
      })
      const imageUrl = response.data.imageUrl
      setProfile((current) => ({ ...current, imageUrl }))
      setInitialProfile((current) => ({ ...current, imageUrl }))
      setAvatarError(false)
      setImagePreview('')
      setNotice({ type: 'success', message: response.message || 'Profile photo updated.' })
    } catch (error) {
      setImagePreview('')
      setNotice({
        type: 'error',
        message: error.message || 'Unable to upload your profile photo.',
      })
    } finally {
      setUploading(false)
    }
  }

  const inputClass = (field) => `owner-profile-input${errors[field] ? ' has-error' : ''}`

  return (
    <div className="owner-page owner-profile-page">
      <div className="owner-page-header owner-profile-page-heading">
        <div>
          <span className="owner-profile-eyebrow">YOUR ACCOUNT</span>
          <h1 className="owner-greeting">My Profile</h1>
          <p className="owner-subtitle">Keep your personal and business details up to date.</p>
        </div>
      </div>

      {notice && (
        <div className={`owner-profile-notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
          {notice.type === 'success' ? <Check size={17} /> : <X size={17} />}
          <span>{notice.message}</span>
        </div>
      )}

      {loading ? (
        <div className="owner-profile-loading" role="status">
          <LoaderCircle size={20} className="owner-profile-spinner" />
          Loading your profile…
        </div>
      ) : (
        <>
          <section className="owner-profile-summary" aria-label="Profile summary">
            <div className="owner-profile-summary-main">
              <div className="owner-profile-avatar-wrap">
                <div className="owner-profile-avatar">
                  {(imagePreview || profile.imageUrl) && !avatarError ? (
                    <img
                      src={imagePreview || getImageUrl(profile.imageUrl)}
                      alt={`${profile.name || 'Owner'} profile`}
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="owner-profile-camera"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading}
                  aria-label="Upload profile photo"
                  title="Upload profile photo"
                >
                  {uploading ? <LoaderCircle size={17} className="owner-profile-spinner" /> : <Camera size={17} />}
                </button>
                <input
                  ref={imageInputRef}
                  className="owner-profile-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelection}
                  aria-label="Choose profile photo"
                />
              </div>
              <div className="owner-profile-identity">
                <span className="owner-profile-role"><BadgeCheck size={15} /> Property Owner</span>
                <h2>{profile.name || user?.name || 'Owner'}</h2>
                <p><Mail size={15} /> {profile.email || user?.email || 'Email not available'}</p>
                <button
                  type="button"
                  className="owner-profile-edit-link"
                  onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  Edit profile <ChevronRight size={15} />
                </button>
              </div>
            </div>
            <div className="owner-profile-completion" aria-label={`Profile ${completion}% complete`}>
              <div className="owner-profile-completion-copy">
                <span>Profile completion</span>
                <strong>{completion}%</strong>
              </div>
              <div className="owner-profile-progress-track">
                <span style={{ width: `${completion}%` }} />
              </div>
              <small>Based on the profile details you’ve provided.</small>
            </div>
          </section>

          <form ref={formRef} className="owner-profile-form" onSubmit={handleSave} noValidate>
            <section className="owner-profile-card">
              <div className="owner-profile-card-heading">
                <div className="owner-profile-section-icon"><CircleUserRound size={19} /></div>
                <div>
                  <h2>Personal information</h2>
                  <p>Details used to identify and contact you.</p>
                </div>
              </div>

              <div className="owner-profile-fields">
                {[
                  { field: 'firstName', label: 'First name', icon: UserRound, value: splitName(profile.name).firstName },
                  { field: 'lastName', label: 'Last name', icon: UserRound, value: splitName(profile.name).lastName },
                ].map(({ field, label, icon: Icon, value }) => (
                  <div className="owner-profile-field" key={field}>
                    <label htmlFor={field}>{label} <span aria-hidden="true">*</span></label>
                    <div className={`owner-profile-input-wrap${errors[field] ? ' has-error' : ''}`}>
                      <Icon size={17} />
                      <input
                        id={field}
                        className={inputClass(field)}
                        type="text"
                        autoComplete={field === 'firstName' ? 'given-name' : 'family-name'}
                        maxLength={80}
                        value={value}
                        onChange={(event) => {
                          const names = splitName(profile.name)
                          names[field] = event.target.value
                          updateField('name', `${names.firstName} ${names.lastName}`.trim())
                        }}
                        aria-invalid={Boolean(errors[field])}
                        aria-describedby={errors[field] ? `${field}-error` : undefined}
                        disabled={saving}
                      />
                    </div>
                    {errors[field] && <small id={`${field}-error`} className="owner-profile-field-error">{errors[field]}</small>}
                  </div>
                ))}

                <div className="owner-profile-field">
                  <label htmlFor="email">Email address</label>
                  <div className="owner-profile-input-wrap is-readonly">
                    <Mail size={17} />
                    <input
                      id="email"
                      className="owner-profile-input"
                      type="email"
                      autoComplete="email"
                      value={profile.email}
                      readOnly
                      aria-describedby="email-help"
                    />
                    <span className="owner-profile-readonly-tag">Read only</span>
                  </div>
                  <small id="email-help" className="owner-profile-field-help">Email is managed by your sign-in account.</small>
                </div>

                <div className="owner-profile-field">
                  <label htmlFor="mobile">Phone number <span aria-hidden="true">*</span></label>
                  <div className={`owner-profile-input-wrap${errors.mobile ? ' has-error' : ''}`}>
                    <Phone size={17} />
                    <input
                      id="mobile"
                      className={inputClass('mobile')}
                      type="tel"
                      autoComplete="tel"
                      maxLength={20}
                      value={profile.mobile}
                      onChange={(event) => updateField('mobile', event.target.value)}
                      aria-invalid={Boolean(errors.mobile)}
                      aria-describedby={errors.mobile ? 'mobile-error' : undefined}
                      disabled={saving}
                    />
                  </div>
                  {errors.mobile && <small id="mobile-error" className="owner-profile-field-error">{errors.mobile}</small>}
                </div>
              </div>
            </section>

            <section className="owner-profile-card">
              <div className="owner-profile-card-heading">
                <div className="owner-profile-section-icon"><Building2 size={19} /></div>
                <div>
                  <h2>Business information</h2>
                  <p>Business details associated with your owner account.</p>
                </div>
              </div>

              <div className="owner-profile-fields owner-profile-fields-business">
                <div className="owner-profile-field">
                  <label htmlFor="occupation">Business name <span aria-hidden="true">*</span></label>
                  <div className={`owner-profile-input-wrap${errors.occupation ? ' has-error' : ''}`}>
                    <Building2 size={17} />
                    <input
                      id="occupation"
                      className={inputClass('occupation')}
                      type="text"
                      maxLength={120}
                      value={profile.occupation}
                      onChange={(event) => updateField('occupation', event.target.value)}
                      aria-invalid={Boolean(errors.occupation)}
                      aria-describedby={errors.occupation ? 'occupation-error' : undefined}
                      disabled={saving}
                    />
                  </div>
                  {errors.occupation && <small id="occupation-error" className="owner-profile-field-error">{errors.occupation}</small>}
                </div>

                <div className="owner-profile-field">
                  <label htmlFor="address">Business address <span aria-hidden="true">*</span></label>
                  <div className={`owner-profile-input-wrap owner-profile-textarea-wrap${errors.address ? ' has-error' : ''}`}>
                    <MapPin size={17} />
                    <textarea
                      id="address"
                      className={inputClass('address')}
                      rows={3}
                      maxLength={300}
                      value={profile.address}
                      onChange={(event) => updateField('address', event.target.value)}
                      aria-invalid={Boolean(errors.address)}
                      aria-describedby={errors.address ? 'address-error' : undefined}
                      disabled={saving}
                    />
                  </div>
                  {errors.address && <small id="address-error" className="owner-profile-field-error">{errors.address}</small>}
                </div>
              </div>

              <div className="owner-profile-form-actions">
                <button type="button" className="ghost-button" onClick={handleCancel} disabled={saving || uploading}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={saving || uploading}>
                  {saving ? <LoaderCircle size={17} className="owner-profile-spinner" /> : <Save size={17} />}
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </section>
          </form>

          <section className="owner-profile-security">
            <div className="owner-profile-security-icon"><LockKeyhole size={19} /></div>
            <div>
              <h2>Account &amp; security</h2>
              <p>Manage your password and account preferences in settings.</p>
            </div>
            <Link to="/owner/settings" className="owner-profile-security-link">
              Open settings <ChevronRight size={16} />
            </Link>
          </section>
        </>
      )}
    </div>
  )
}
