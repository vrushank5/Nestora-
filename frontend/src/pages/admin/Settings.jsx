import { useState } from 'react'
import { Settings as SettingsIcon, Shield, CreditCard, Lock } from 'lucide-react'

export default function Settings() {
  const [tab, setTab] = useState('general')
  const [toast, setToast] = useState('')

  const save = () => {
    setToast('System settings updated successfully.')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="admin-page" style={{ maxWidth: '840px' }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">System Settings</h1>
          <p className="admin-page-subtitle">Configure global platform rules, security parameters, and payment gateways.</p>
        </div>
      </div>

      {toast && (
        <div className="admin-toast-banner" style={{ marginBottom: '20px' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'general', label: 'General', icon: SettingsIcon },
            { id: 'booking', label: 'Booking Rules', icon: Shield },
            { id: 'payment', label: 'Payment Gateway', icon: CreditCard },
            { id: 'security', label: 'Security & Auth', icon: Lock },
          ].map(t => (
            <button
              key={t.id}
              className={`sidebar-nav-item ${tab === t.id ? 'active' : ''}`}
              style={{
                borderRadius: 'var(--radius)',
                color: 'var(--ink-2)',
                background: tab === t.id ? 'var(--sky)' : 'transparent',
                boxShadow: tab === t.id ? 'inset 3px 0 0 var(--jade)' : 'none'
              }}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={17} /> {t.label}
            </button>
          ))}
        </div>

        <div className="admin-pane">
          {tab === 'general' && (
            <>
              <h3 style={{ marginBottom: '16px' }}>General Configuration</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-field"><label>Platform Name</label><input defaultValue="Nestora PG & Co-Living" /></div>
                <div className="form-field"><label>Support Email</label><input defaultValue="support@nestora.com" /></div>
                <div className="form-field"><label>Contact Phone</label><input defaultValue="+91 1800-NESTORA" /></div>
                <button className="primary-button compact-button" onClick={save}>Save General Settings</button>
              </div>
            </>
          )}

          {tab === 'booking' && (
            <>
              <h3 style={{ marginBottom: '16px' }}>Booking & Verification Rules</h3>
              <div className="settings-list">
                <label className="settings-row"><span>Require manual verification before publishing listings</span><input type="checkbox" defaultChecked /></label>
                <label className="settings-row"><span>Allow instant resident booking without owner approval</span><input type="checkbox" /></label>
                <label className="settings-row"><span>Enable automated site visit scheduling</span><input type="checkbox" defaultChecked /></label>
              </div>
              <button className="primary-button compact-button" style={{ marginTop: '16px' }} onClick={save}>Save Rules</button>
            </>
          )}

          {tab === 'payment' && (
            <>
              <h3 style={{ marginBottom: '16px' }}>Payment Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-field"><label>Primary Gateway</label><select><option>Razorpay</option><option>Stripe</option></select></div>
                <div className="form-field"><label>Platform Commission (%)</label><input defaultValue="5.0" /></div>
                <div className="form-field"><label>Currency</label><input defaultValue="INR (₹)" disabled /></div>
                <button className="primary-button compact-button" onClick={save}>Save Payment Config</button>
              </div>
            </>
          )}

          {tab === 'security' && (
            <>
              <h3 style={{ marginBottom: '16px' }}>Security & Session Policies</h3>
              <div className="settings-list">
                <label className="settings-row"><span>Enforce Google OAuth 2FA for Admin accounts</span><input type="checkbox" defaultChecked /></label>
                <label className="settings-row"><span>Strictly restrict Admin role to nestora2671@gmail.com</span><input type="checkbox" defaultChecked disabled /></label>
                <label className="settings-row"><span>JWT Token Expiry</span><select><option>24 Hours (1 Day)</option><option>7 Days</option></select></label>
              </div>
              <button className="primary-button compact-button" style={{ marginTop: '16px' }} onClick={save}>Save Security Settings</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
