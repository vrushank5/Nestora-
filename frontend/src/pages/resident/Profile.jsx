import { useState } from 'react'
import { Camera } from 'lucide-react'
import { useAuth } from '../../context/useAuth.js'

export default function Profile() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState({
    firstName: user?.name?.split(' ')[0] || 'Resident',
    lastName: user?.name?.split(' ')[1] || 'Member',
    email: user?.email || 'resident@nestora.com',
    phone: user?.mobile || '+91 9876543210',
    gender: 'Male',
    dob: '1998-05-15',
    occupation: 'Software Engineer',
    college: 'IIT Ahmedabad',
    city: 'Ahmedabad',
    state: 'Gujarat',
    address: 'Bodakdev, Ahmedabad, Gujarat - 380054',
    emergency: '+91 9876501234',
  })

  const completionFields = ['firstName', 'lastName', 'phone', 'gender', 'dob', 'occupation', 'city', 'address', 'emergency']
  const filled = completionFields.filter(f => profile[f]).length
  const completion = Math.round((filled / completionFields.length) * 100)

  const fields = [
    ['firstName', 'First Name'], ['lastName', 'Last Name'],
    ['email', 'Email Address'], ['phone', 'Phone Number'],
    ['gender', 'Gender', 'select', ['Male', 'Female', 'Other']],
    ['dob', 'Date of Birth', 'date'],
    ['occupation', 'Occupation'], ['college', 'College / Company'],
    ['city', 'City'], ['state', 'State'],
    ['address', 'Address'], ['emergency', 'Emergency Contact'],
  ]

  return (
    <div className="r-page" style={{ maxWidth: '840px' }}>
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">My Profile</h1>
          <p className="r-page-subtitle">Keep your profile complete for better PG recommendations.</p>
        </div>
        <button className={editing ? 'ghost-button compact-button' : 'primary-button compact-button'} onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Profile card */}
      <div className="r-pane" style={{ display: 'flex', gap: '28px', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '50%', background: 'var(--jade)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 900, flexShrink: 0 }}>
          {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
          {editing && (
            <button style={{ position: 'absolute', bottom: 0, right: 0, width: '30px', height: '30px', borderRadius: '50%', background: 'var(--white)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Camera size={14} />
            </button>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '4px' }}>{profile.firstName} {profile.lastName}</h3>
          <p className="muted-copy">{profile.occupation} · {profile.city}</p>
          <div className="progress-row" style={{ marginTop: '12px' }}>
            <div><span>Profile Completion</span><strong>{completion}%</strong></div>
            <div className="progress-track"><i style={{ width: `${completion}%` }} /></div>
          </div>
          {completion < 100 && <p className="muted-copy" style={{ fontSize: '0.82rem', marginTop: '6px' }}>Complete your profile to get better PG recommendations.</p>}
        </div>
      </div>

      {/* Form */}
      <div className="r-pane">
        <h3 style={{ marginBottom: '24px' }}>Personal Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {fields.map(([key, label, type, options]) => (
            <div key={key} className={`form-field ${key === 'address' ? 'form-grid-full' : ''}`}>
              <label>{label}</label>
              {type === 'select' ? (
                <select value={profile[key]} disabled={!editing} onChange={e => setProfile({ ...profile, [key]: e.target.value })}>
                  {options.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type={type || 'text'} value={profile[key]} disabled={key === 'email' || !editing} onChange={e => setProfile({ ...profile, [key]: e.target.value })} />
              )}
            </div>
          ))}
        </div>
        {editing && (
          <div className="form-actions">
            <button className="primary-button compact-button" onClick={() => setEditing(false)}>Save Changes</button>
          </div>
        )}
      </div>
    </div>
  )
}
