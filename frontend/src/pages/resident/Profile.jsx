import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BadgeCheck,
  BriefcaseBusiness,
  Camera,
  Check,
  CircleUserRound,
  Home,
  LoaderCircle,
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
  gender: '',
  address: '',
  occupation: '',
  imageUrl: '',
}

const completionFields = [
  { key: 'name', label: 'Full name' },
  { key: 'email', label: 'Email address' },
  { key: 'mobile', label: 'Phone number' },
  { key: 'gender', label: 'Gender' },
  { key: 'address', label: 'Address' },
  { key: 'occupation', label: 'Occupation' },
]

const splitName = (name = '') => {
  const [firstName = '', ...lastNameParts] = name.trim().split(/\s+/)
  return { firstName, lastName: lastNameParts.join(' ') }
}

const isPresent = (value) => typeof value === 'string' && value.trim().length > 0

const validateProfile = (profile) => {
  const errors = {}
  const { firstName, lastName } = splitName(profile.name)
  if (!firstName) errors.firstName = 'Enter your first name.'
  if (!lastName) errors.lastName = 'Enter your last name.'
  if (!/^[+]?[\d\s().-]{7,20}$/.test(profile.mobile.trim())) {
    errors.mobile = 'Enter a valid phone number.'
  }
  if (!profile.gender.trim()) errors.gender = 'Select your gender.'
  if (!profile.address.trim()) errors.address = 'Enter your address.'
  if (!profile.occupation.trim()) errors.occupation = 'Enter your occupation.'
  return errors
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(emptyProfile)
  const [initialProfile, setInitialProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [avatarError, setAvatarError] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const imageInputRef = useRef(null)
  const formRef = useRef(null)
  const names = splitName(profile.name)

  useEffect(() => {
    let active = true
    apiRequest('/resident/profile')
      .then((response) => {
        if (!active) return
        const loaded = { ...emptyProfile, ...response.data }
        setProfile(loaded)
        setInitialProfile(loaded)
        setLoadError('')
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Unable to load your profile.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!imagePreview) return undefined
    return () => URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const completion = useMemo(() => {
    const completeCount = completionFields.filter(({ key }) => (
      key === 'name'
        ? Boolean(splitName(profile.name).firstName && splitName(profile.name).lastName)
        : isPresent(profile[key])
    )).length
    return Math.round((completeCount / completionFields.length) * 100)
  }, [profile])

  const missingFields = completionFields
    .filter(({ key }) => (
      key === 'name'
        ? !(splitName(profile.name).firstName && splitName(profile.name).lastName)
        : !isPresent(profile[key])
    ))
    .map(({ label }) => label.toLowerCase())

  const initials = profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'R'

  const updateField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setNotice(null)
  }

  const startEditing = () => {
    setEditing(true)
    setNotice(null)
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const handleCancel = () => {
    setProfile(initialProfile)
    setErrors({})
    setNotice(null)
    setEditing(false)
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
      const response = await apiRequest('/resident/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstName,
          lastName,
          mobile: profile.mobile.trim(),
          gender: profile.gender.trim(),
          address: profile.address.trim(),
          occupation: profile.occupation.trim(),
        }),
      })
      const savedProfile = { ...emptyProfile, ...response.data }
      setProfile(savedProfile)
      setInitialProfile(savedProfile)
      updateUser?.({
        name: savedProfile.name,
        email: savedProfile.email,
        mobile: savedProfile.mobile,
        gender: savedProfile.gender,
        address: savedProfile.address,
        occupation: savedProfile.occupation,
        imageUrl: savedProfile.imageUrl,
      })
      setEditing(false)
      setNotice({ type: 'success', message: response.message || 'Your profile has been saved.' })
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Unable to save your profile. Please try again.' })
    } finally {
      setSaving(false)
    }
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

    const preview = URL.createObjectURL(file)
    setImagePreview(preview)
    setAvatarError(false)
    setUploading(true)
    setNotice(null)
    const formData = new FormData()
    formData.append('image', file)
    try {
      const response = await apiRequest('/resident/profile/image', {
        method: 'POST',
        body: formData,
      })
      const imageUrl = response.data.imageUrl
      setProfile((current) => ({ ...current, imageUrl }))
      setInitialProfile((current) => ({ ...current, imageUrl }))
      updateUser?.({ imageUrl })
      setAvatarError(false)
      setNotice({ type: 'success', message: response.message || 'Profile photo updated.' })
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Unable to upload your profile photo.' })
    } finally {
      setImagePreview('')
      URL.revokeObjectURL(preview)
      setUploading(false)
    }
  }

  const fieldClass = (field) => `resident-profile-input${errors[field] ? ' has-error' : ''}`

  if (loading) {
    return (
      <div className="r-page resident-profile-page">
        <div className="resident-profile-loading" role="status">
          <LoaderCircle size={22} className="resident-profile-spinner" />
          Loading your profile…
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="r-page resident-profile-page">
        <div className="r-page-header">
          <div><span className="resident-profile-eyebrow">YOUR ACCOUNT</span><h1 className="r-page-title">My Profile</h1></div>
        </div>
        <div className="resident-profile-notice error" role="alert">{loadError}</div>
        <button type="button" className="primary-button compact-button" onClick={() => window.location.reload()}>Try again</button>
      </div>
    )
  }

  return (
    <div className="r-page resident-profile-page">
      <div className="r-page-header resident-profile-heading">
        <div>
          <span className="resident-profile-eyebrow">YOUR ACCOUNT</span>
          <h1 className="r-page-title">My Profile</h1>
          <p className="r-page-subtitle">Manage the details used for your Nestora stay.</p>
        </div>
        {!editing && (
          <button type="button" className="primary-button compact-button" onClick={startEditing}>
            <UserRound size={16} /> Edit profile
          </button>
        )}
      </div>

      {notice && (
        <div className={`resident-profile-notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
          {notice.type === 'success' ? <Check size={17} /> : <X size={17} />}
          <span>{notice.message}</span>
        </div>
      )}

      <section className="resident-profile-summary" aria-label="Profile overview">
        <div className="resident-profile-summary-main">
          <div className="resident-profile-avatar-wrap">
            <div className="resident-profile-avatar">
              {(imagePreview || profile.imageUrl) && !avatarError ? (
                <img
                  src={imagePreview || getImageUrl(profile.imageUrl)}
                  alt={`${profile.name || 'Resident'} profile`}
                  onError={() => setAvatarError(true)}
                />
              ) : <span>{initials}</span>}
            </div>
            <button
              type="button"
              className="resident-profile-camera"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              aria-label="Change profile photo"
              title="Change profile photo"
            >
              {uploading ? <LoaderCircle size={17} className="resident-profile-spinner" /> : <Camera size={17} />}
            </button>
            <input
              ref={imageInputRef}
              className="resident-profile-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelection}
              aria-label="Choose profile photo"
            />
          </div>
          <div className="resident-profile-identity">
            <span className="resident-profile-role"><BadgeCheck size={15} /> Resident</span>
            <h2>{profile.name || user?.name || 'Resident'}</h2>
            <p><Mail size={15} /> {profile.email || user?.email || 'Email not available'}</p>
            {profile.occupation && <span className="resident-profile-meta"><BriefcaseBusiness size={14} /> {profile.occupation}</span>}
          </div>
        </div>
        <div className="resident-profile-completion" aria-label={`Profile ${completion}% complete`}>
          <div className="resident-profile-completion-copy"><span>Profile completion</span><strong>{completion}%</strong></div>
          <div className="resident-profile-progress-track"><span style={{ width: `${completion}%` }} /></div>
          {missingFields.length ? (
            <small>Still needed: {missingFields.join(', ')}.</small>
          ) : (
            <small>Your essential profile details are complete.</small>
          )}
          {!profile.imageUrl && <small className="resident-profile-photo-tip">Add a profile photo to help your account feel complete.</small>}
        </div>
      </section>

      <form ref={formRef} className="resident-profile-form" onSubmit={handleSave} noValidate>
        <section className="resident-profile-card">
          <div className="resident-profile-card-heading">
            <div className="resident-profile-section-icon"><CircleUserRound size={19} /></div>
            <div><h2>Personal information</h2><p>Personal details associated with your resident account.</p></div>
          </div>

          <div className="resident-profile-fields">
            {[
              { field: 'firstName', label: 'First name', icon: UserRound, value: names.firstName, autoComplete: 'given-name' },
              { field: 'lastName', label: 'Last name', icon: UserRound, value: names.lastName, autoComplete: 'family-name' },
            ].map(({ field, label, icon: Icon, value, autoComplete }) => (
              <div className="resident-profile-field" key={field}>
                <label htmlFor={`resident-${field}`}>{label} <span aria-hidden="true">*</span></label>
                <div className={`resident-profile-input-wrap${errors[field] ? ' has-error' : ''}`}>
                  <Icon size={17} />
                  <input
                    id={`resident-${field}`}
                    className={fieldClass(field)}
                    value={value}
                    maxLength={80}
                    autoComplete={autoComplete}
                    disabled={!editing || saving}
                    aria-invalid={Boolean(errors[field])}
                    aria-describedby={errors[field] ? `resident-${field}-error` : undefined}
                    onChange={(event) => {
                      const nextNames = splitName(profile.name)
                      nextNames[field] = event.target.value
                      updateField('name', `${nextNames.firstName} ${nextNames.lastName}`.trim())
                    }}
                  />
                </div>
                {errors[field] && <small className="resident-profile-field-error" id={`resident-${field}-error`}>{errors[field]}</small>}
              </div>
            ))}

            <div className="resident-profile-field">
              <label htmlFor="resident-email">Email address</label>
              <div className="resident-profile-input-wrap is-readonly">
                <Mail size={17} />
                <input id="resident-email" type="email" autoComplete="email" value={profile.email} readOnly />
                <span className="resident-profile-readonly-tag">Read only</span>
              </div>
              <small className="resident-profile-field-help">Email is managed by your sign-in account.</small>
            </div>

            <div className="resident-profile-field">
              <label htmlFor="resident-mobile">Phone number <span aria-hidden="true">*</span></label>
              <div className={`resident-profile-input-wrap${errors.mobile ? ' has-error' : ''}`}>
                <Phone size={17} />
                <input
                  id="resident-mobile"
                  className={fieldClass('mobile')}
                  type="tel"
                  autoComplete="tel"
                  maxLength={20}
                  value={profile.mobile}
                  disabled={!editing || saving}
                  aria-invalid={Boolean(errors.mobile)}
                  aria-describedby={errors.mobile ? 'resident-mobile-error' : undefined}
                  onChange={(event) => updateField('mobile', event.target.value)}
                />
              </div>
              {errors.mobile && <small className="resident-profile-field-error" id="resident-mobile-error">{errors.mobile}</small>}
            </div>

            <div className="resident-profile-field">
              <label htmlFor="resident-gender">Gender <span aria-hidden="true">*</span></label>
              <div className={`resident-profile-input-wrap${errors.gender ? ' has-error' : ''}`}>
                <UserRound size={17} />
                <select
                  id="resident-gender"
                  className={fieldClass('gender')}
                  value={profile.gender}
                  disabled={!editing || saving}
                  aria-invalid={Boolean(errors.gender)}
                  aria-describedby={errors.gender ? 'resident-gender-error' : undefined}
                  onChange={(event) => updateField('gender', event.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {errors.gender && <small className="resident-profile-field-error" id="resident-gender-error">{errors.gender}</small>}
            </div>
          </div>
        </section>

        <section className="resident-profile-card">
          <div className="resident-profile-card-heading">
            <div className="resident-profile-section-icon"><Home size={19} /></div>
            <div><h2>Address &amp; occupation</h2><p>Used for your resident records and relevant property recommendations.</p></div>
          </div>
          <div className="resident-profile-fields">
            <div className="resident-profile-field">
              <label htmlFor="resident-occupation">Occupation <span aria-hidden="true">*</span></label>
              <div className={`resident-profile-input-wrap${errors.occupation ? ' has-error' : ''}`}>
                <BriefcaseBusiness size={17} />
                <input
                  id="resident-occupation"
                  className={fieldClass('occupation')}
                  value={profile.occupation}
                  maxLength={120}
                  disabled={!editing || saving}
                  aria-invalid={Boolean(errors.occupation)}
                  aria-describedby={errors.occupation ? 'resident-occupation-error' : undefined}
                  onChange={(event) => updateField('occupation', event.target.value)}
                />
              </div>
              {errors.occupation && <small className="resident-profile-field-error" id="resident-occupation-error">{errors.occupation}</small>}
            </div>
            <div className="resident-profile-field resident-profile-address">
              <label htmlFor="resident-address">Address <span aria-hidden="true">*</span></label>
              <div className={`resident-profile-input-wrap${errors.address ? ' has-error' : ''}`}>
                <MapPin size={17} />
                <textarea
                  id="resident-address"
                  className={fieldClass('address')}
                  value={profile.address}
                  maxLength={300}
                  rows={3}
                  disabled={!editing || saving}
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={errors.address ? 'resident-address-error' : undefined}
                  onChange={(event) => updateField('address', event.target.value)}
                />
              </div>
              {errors.address && <small className="resident-profile-field-error" id="resident-address-error">{errors.address}</small>}
            </div>
          </div>
        </section>

        {editing && (
          <div className="resident-profile-form-actions">
            <button type="button" className="ghost-button compact-button" onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary-button compact-button" disabled={saving || uploading}>
              {saving ? <LoaderCircle size={16} className="resident-profile-spinner" /> : <Save size={16} />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
