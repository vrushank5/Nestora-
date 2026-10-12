import { useState } from 'react'
import { Activity, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/useAuth.js'

const activityLogs = [
  { id: 1, action: 'Approved property Nestora Heights verification', date: '30 Aug 2026', time: '11:45 AM', ip: '103.24.12.1' },
  { id: 2, action: 'Updated system security & session settings', date: '29 Aug 2026', time: '04:12 PM', ip: '103.24.12.1' },
  { id: 3, action: 'Suspended user account U-1006 for policy violation', date: '25 Aug 2026', time: '02:30 PM', ip: '103.24.12.1' },
  { id: 4, action: 'Rejected inappropriate user review #102', date: '20 Aug 2026', time: '10:15 AM', ip: '103.24.12.1' },
]

export default function Profile() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [adminData, setAdminData] = useState({
    name: user?.name || 'Administrator',
    email: user?.email || '',
    phone: user?.mobile || '',
    role: user?.roleName || 'Administrator',
  })

  return (
    <div className="admin-page" style={{ maxWidth: '840px' }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Admin Profile</h1>
          <p className="admin-page-subtitle">Administrative account details and system audit log.</p>
        </div>
        <button className={editing ? 'ghost-button compact-button' : 'primary-button compact-button'} onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="admin-pane" style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--jade)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, flexShrink: 0 }}>
          {adminData.name.charAt(0)}
        </div>
        <div>
          <span className="admin-role-pill admin">{adminData.role}</span>
          <h3 style={{ marginTop: '4px' }}>{adminData.name}</h3>
          <p className="muted-copy">{adminData.email}</p>
        </div>
      </div>

      {/* Account Info Form */}
      <div className="admin-pane" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Account Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-field"><label>Admin Name</label><input value={adminData.name} disabled={!editing} onChange={e => setAdminData({ ...adminData, name: e.target.value })} /></div>
          <div className="form-field"><label>Email Address</label><input value={adminData.email} disabled /></div>
          <div className="form-field"><label>Phone</label><input value={adminData.phone} disabled={!editing} onChange={e => setAdminData({ ...adminData, phone: e.target.value })} /></div>
          <div className="form-field"><label>Role</label><input value={adminData.role} disabled /></div>
        </div>
        {editing && (
          <button className="primary-button compact-button" style={{ marginTop: '16px' }} onClick={() => setEditing(false)}>
            Save Profile
          </button>
        )}
      </div>

      {/* Admin Activity Log */}
      <div id="activity" className="admin-pane">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Activity size={18} color="var(--jade)" />
          <h3>Admin Activity Log</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activityLogs.map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--paper-2)', borderRadius: 'var(--radius)' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>{log.action}</strong>
                <small className="muted-copy" style={{ display: 'block', marginTop: '2px' }}>{log.date} at {log.time} · IP: {log.ip}</small>
              </div>
              <span className="status-badge active"><CheckCircle2 size={12} /> Logged</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
