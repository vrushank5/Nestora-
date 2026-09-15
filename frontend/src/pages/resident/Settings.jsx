import { useState } from 'react'
import { Lock, Bell, Shield, Settings as SettingsIcon } from 'lucide-react'

const TABS = [
  { id: 'account', label: 'Account', icon: SettingsIcon },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Shield },
]

export default function Settings() {
  const [tab, setTab] = useState('account')

  return (
    <div className="r-page" style={{ maxWidth: '840px' }}>
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">Settings</h1>
          <p className="r-page-subtitle">Manage your account preferences and privacy.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {TABS.map(t => (
            <button key={t.id} className={`sidebar-nav-item ${tab === t.id ? 'active' : ''}`} style={{ borderRadius: 'var(--radius)', color: 'var(--ink-2)', background: tab === t.id ? 'var(--sky)' : 'transparent', boxShadow: tab === t.id ? 'inset 3px 0 0 var(--jade)' : 'none' }} onClick={() => setTab(t.id)}>
              <t.icon size={17} /> {t.label}
            </button>
          ))}
        </div>

        <div className="r-pane">
          {tab === 'account' && (
            <>
              <h3 style={{ marginBottom: '20px' }}>Account Settings</h3>
              <div className="settings-list">
                <label className="settings-row"><span>Email updates for booking changes</span><input type="checkbox" defaultChecked /></label>
                <label className="settings-row"><span>Notify when saved homes change price</span><input type="checkbox" defaultChecked /></label>
                <label className="settings-row"><span>Weekly property recommendations</span><input type="checkbox" /></label>
                <label className="settings-row"><span>Language</span><select style={{ border: '1px solid var(--line)', borderRadius: '6px', padding: '6px 10px' }}><option>English (India)</option></select></label>
              </div>
              <button className="primary-button compact-button" style={{ marginTop: '20px' }}>Save Preferences</button>
            </>
          )}
          {tab === 'security' && (
            <>
              <h3 style={{ marginBottom: '20px' }}>Security</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-field"><label>Current Password</label><input type="password" placeholder="••••••••" /></div>
                <div className="form-field"><label>New Password</label><input type="password" placeholder="••••••••" /></div>
                <div className="form-field"><label>Confirm Password</label><input type="password" placeholder="••••••••" /></div>
                <button className="primary-button compact-button">Update Password</button>
                <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '8px 0' }} />
                <h4>Login Activity</h4>
                <div className="settings-row"><span>Chrome · Ahmedabad, Gujarat</span><small style={{ color: 'var(--jade)', fontWeight: 700 }}>Active now</small></div>
                <button className="ghost-button compact-button danger-button">Logout From All Devices</button>
              </div>
            </>
          )}
          {tab === 'notifications' && (
            <>
              <h3 style={{ marginBottom: '20px' }}>Notification Preferences</h3>
              <div className="settings-list">
                {['Booking updates', 'Payment reminders', 'Complaint updates', 'New property matches', 'Promotional offers'].map(pref => (
                  <label key={pref} className="settings-row"><span>{pref}</span><input type="checkbox" defaultChecked /></label>
                ))}
              </div>
            </>
          )}
          {tab === 'privacy' && (
            <>
              <h3 style={{ marginBottom: '20px' }}>Privacy Settings</h3>
              <div className="settings-list">
                <label className="settings-row"><span>Make my profile visible to property owners</span><input type="checkbox" defaultChecked /></label>
                <label className="settings-row"><span>Show my reviews publicly</span><input type="checkbox" defaultChecked /></label>
                <label className="settings-row"><span>Use my data for better recommendations</span><input type="checkbox" defaultChecked /></label>
              </div>
              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(200,93,71,0.06)', border: '1px solid rgba(200,93,71,0.2)', borderRadius: 'var(--radius)' }}>
                <h4 style={{ color: 'var(--terracotta)', marginBottom: '8px' }}>Danger Zone</h4>
                <p className="muted-copy" style={{ fontSize: '0.9rem', marginBottom: '14px' }}>Deleting your account is permanent and cannot be undone.</p>
                <button className="ghost-button compact-button danger-button">Delete Account</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
