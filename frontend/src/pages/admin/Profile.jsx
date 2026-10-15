import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth.js'
import { getImageUrl, adminApi } from '../../services/api.js'

const emptyProfile = { name: '', email: '', mobile: '', roleId: 1, imageUrl: '', isActive: null }

const getInitials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

export default function Profile() {
  const { updateUser } = useAuth()
  const [profile, setProfile] = useState(emptyProfile)
  const [draft, setDraft] = useState(emptyProfile)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    adminApi.getProfile()
      .then((response) => {
        if (!active) return
        const loaded = { ...emptyProfile, ...response.data }
        setProfile(loaded)
        setDraft(loaded)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to load your profile.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const initials = useMemo(() => getInitials(profile.name) || 'AD', [profile.name])

  const cancelEdit = () => {
    setDraft(profile)
    setEditing(false)
    setError('')
    setSuccess('')
  }

  const startEdit = () => {
    setEditing(true)
    setError('')
    setSuccess('')
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    const name = draft.name.trim()
    const mobile = draft.mobile.trim()

    if (!name || name.length > 100) {
      setError('Enter a name between 1 and 100 characters.')
      return
    }
    if (!mobile || mobile.length > 30) {
      setError('Enter a phone number between 1 and 30 characters.')
      return
    }

    setSaving(true)
    try {
      const response = await adminApi.updateProfile({ name, mobile })
      const updated = { ...profile, ...response.data }
      setProfile(updated)
      setDraft(updated)
      updateUser?.({ name: updated.name, mobile: updated.mobile, imageUrl: updated.imageUrl })
      setEditing(false)
      setSuccess(response.message || 'Your profile has been updated.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page admin-profile-page">
      <nav className="admin-profile-breadcrumb" aria-label="Breadcrumb">
        <span>Admin</span><span className="admin-profile-breadcrumb-divider">/</span><span>My Profile</span>
      </nav>

      <div className="admin-page-header admin-profile-heading">
        <div>
          <h1 className="admin-page-title">Admin Profile</h1>
          <p className="admin-page-subtitle">Manage your administrator account and security settings.</p>
        </div>
        {!loading && !error && (
          <button
            type="button"
            className={editing ? 'ghost-button compact-button' : 'primary-button compact-button'}
            onClick={editing ? cancelEdit : startEdit}
          >
            {editing ? 'Cancel editing' : 'Edit Profile'}
          </button>
        )}
      </div>

      {error && (
        <div className="admin-profile-alert error" role="alert">
          <AlertCircle size={18} /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="admin-profile-alert success" role="status">
          <CheckCircle2 size={18} /><span>{success}</span>
        </div>
      )}

      {loading ? (
        <section className="admin-pane admin-profile-loading" aria-label="Loading profile">
          <span className="admin-profile-spinner" /> Loading your account details…
        </section>
      ) : !error || profile.email ? (
        <>
          <section className="admin-pane admin-profile-identity" aria-label="Administrator identity">
            <div className="admin-profile-avatar">
              {profile.imageUrl
                ? <img src={getImageUrl(profile.imageUrl)} alt="" />
                : <span>{initials}</span>}
            </div>
            <div className="admin-profile-identity-copy">
              <div className="admin-profile-badges">
                <span className="admin-role-pill admin"><ShieldCheck size={13} /> Administrator</span>
                {typeof profile.isActive === 'boolean' && (
                  <span className={`admin-profile-status ${profile.isActive ? 'active' : 'inactive'}`}>
                    <span />{profile.isActive ? 'Active account' : 'Inactive account'}
                  </span>
                )}
              </div>
              <h2>{profile.name || 'Administrator'}</h2>
              <p>{profile.email}</p>
            </div>
            <div className="admin-profile-identity-note">
              <ShieldCheck size={17} />
              <span>Administrator privileges are managed securely and cannot be changed here.</span>
            </div>
          </section>

          <section className="admin-pane admin-profile-account">
            <div className="admin-profile-section-heading">
              <div className="admin-profile-section-icon"><UserRound size={18} /></div>
              <div>
                <h2>Account information</h2>
                <p>Personal details associated with your administrator account.</p>
              </div>
            </div>

            <form onSubmit={saveProfile} noValidate>
              <div className="admin-profile-fields">
                <div className="admin-profile-field">
                  <label htmlFor="admin-profile-name">Admin name <span aria-hidden="true">*</span></label>
                  <div className={`admin-profile-input-wrap ${editing ? '' : 'readonly'}`}>
                    <UserRound size={17} aria-hidden="true" />
                    <input
                      id="admin-profile-name"
                      value={editing ? draft.name : profile.name}
                      onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                      disabled={!editing || saving}
                      maxLength={100}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>
                <div className="admin-profile-field">
                  <label htmlFor="admin-profile-email">Email address</label>
                  <div className="admin-profile-input-wrap readonly">
                    <Mail size={17} aria-hidden="true" />
                    <input id="admin-profile-email" value={profile.email} disabled readOnly />
                    <span className="admin-profile-readonly-label">Read only</span>
                  </div>
                </div>
                <div className="admin-profile-field">
                  <label htmlFor="admin-profile-phone">Phone number <span aria-hidden="true">*</span></label>
                  <div className={`admin-profile-input-wrap ${editing ? '' : 'readonly'}`}>
                    <Phone size={17} aria-hidden="true" />
                    <input
                      id="admin-profile-phone"
                      type="tel"
                      value={editing ? draft.mobile : profile.mobile}
                      onChange={(event) => setDraft({ ...draft, mobile: event.target.value })}
                      disabled={!editing || saving}
                      maxLength={30}
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>
                <div className="admin-profile-field">
                  <label htmlFor="admin-profile-role">Role</label>
                  <div className="admin-profile-input-wrap readonly">
                    <ShieldCheck size={17} aria-hidden="true" />
                    <input id="admin-profile-role" value="Administrator" disabled readOnly />
                    <span className="admin-profile-readonly-label">Protected</span>
                  </div>
                </div>
              </div>
              {editing && (
                <div className="admin-profile-form-actions">
                  <button type="button" className="ghost-button compact-button" onClick={cancelEdit} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button compact-button" disabled={saving}>
                    {saving ? <><span className="admin-profile-button-spinner" /> Saving…</> : <><Check size={16} /> Save Changes</>}
                  </button>
                </div>
              )}
            </form>
          </section>

          <section id="activity" className="admin-pane admin-profile-activity">
            <div className="admin-profile-section-heading">
              <div className="admin-profile-section-icon"><Activity size={18} /></div>
              <div>
                <h2>Admin activity log</h2>
                <p>Recent actions associated with your administrator account.</p>
              </div>
            </div>
            <div className="admin-profile-empty-activity">
              <span><Clock3 size={19} /></span>
              <div>
                <strong>No activity records available</strong>
                <p>Activity history is not currently recorded for administrator accounts.</p>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="admin-pane admin-profile-load-error">
          <p>Your account information could not be loaded. Please try again.</p>
          <button type="button" className="ghost-button compact-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </section>
      )}
    </div>
  )
}
