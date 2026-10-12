import { useEffect, useState } from 'react'
import { Bell, Building, CreditCard, Lock, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../context/useAuth.js'
import { ownerApi } from '../../services/api.js'

const defaultSettings = {
  notifications: {
    bookingRequests: true,
    paymentUpdates: true,
    residentMessages: true,
    productUpdates: false,
  },
  properties: {
    defaultCity: 'Ahmedabad',
    defaultAllowedGender: 'Unisex',
  },
  payments: {
    payoutMethod: 'bank-transfer',
    payoutEmail: '',
  },
  privacy: {
    shareContactWithResidents: true,
    personalizedInsights: true,
  },
}

const settingsTabs = [
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'properties', label: 'Property Settings', icon: Building },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'privacy', label: 'Privacy', icon: Shield },
]

function getCurrentBrowser() {
  const userAgent = navigator.userAgent
  const browser = userAgent.includes('Edg/')
    ? 'Microsoft Edge'
    : userAgent.includes('Chrome/')
      ? 'Google Chrome'
      : userAgent.includes('Firefox/')
        ? 'Mozilla Firefox'
        : userAgent.includes('Safari/')
          ? 'Safari'
          : 'Current browser'
  const platform = navigator.userAgentData?.platform || navigator.platform || 'This device'
  return `${platform} · ${browser}`
}

function SettingsToggle({ checked, onChange, title, description }) {
  return (
    <label className="owner-settings-option">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  )
}

export default function Settings() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('security')
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    let active = true
    ownerApi.getSettings()
      .then((response) => {
        if (active) {
          setSettings({
            notifications: { ...defaultSettings.notifications, ...response.data?.notifications },
            properties: { ...defaultSettings.properties, ...response.data?.properties },
            payments: { ...defaultSettings.payments, ...response.data?.payments },
            privacy: { ...defaultSettings.privacy, ...response.data?.privacy },
          })
        }
      })
      .catch((error) => {
        if (active) setNotice({ type: 'error', message: error.message })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const updateSetting = (section, key, value) => {
    setSettings((current) => ({
      ...current,
      [section]: { ...current[section], [key]: value },
    }))
  }

  const saveSettings = async (event) => {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      const response = await ownerApi.updateSettings(settings)
      setSettings(response.data)
      setNotice({ type: 'success', message: 'Your preferences have been saved.' })
    } catch (error) {
      setNotice({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  const updatePassword = async (event) => {
    event.preventDefault()
    setNotice(null)
    if (passwords.newPassword.length < 8) {
      setNotice({ type: 'error', message: 'Your new password must be at least 8 characters.' })
      return
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setNotice({ type: 'error', message: 'The new password and confirmation do not match.' })
      return
    }

    setPasswordSaving(true)
    try {
      const response = await ownerApi.changePassword(passwords)
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setNotice({ type: 'success', message: response.message })
    } catch (error) {
      setNotice({ type: 'error', message: error.message })
    } finally {
      setPasswordSaving(false)
    }
  }

  const renderPreferenceForm = (children) => (
    <form className="owner-settings-card dashboard-chart-pane" onSubmit={saveSettings}>
      {children}
      <button className="primary-button compact-button" type="submit" disabled={saving || loading}>
        {saving ? 'Saving…' : 'Save Preferences'}
      </button>
    </form>
  )

  return (
    <div className="owner-page owner-settings-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Settings</h1>
          <p className="owner-subtitle">Manage your account preferences and security.</p>
        </div>
      </div>

      {notice && (
        <div className={`owner-settings-notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
          {notice.message}
        </div>
      )}

      <div className="owner-settings-layout">
        <nav className="owner-settings-tabs" aria-label="Owner settings">
          {settingsTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`owner-settings-tab ${activeTab === id ? 'active' : ''}`}
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => { setActiveTab(id); setNotice(null) }}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        {loading ? (
          <section className="owner-settings-card dashboard-chart-pane" aria-live="polite">
            <h2>Loading your settings…</h2>
          </section>
        ) : (
          <>
            {activeTab === 'security' && (
              <div className="owner-settings-content">
                <form className="owner-settings-card dashboard-chart-pane" onSubmit={updatePassword}>
                  <h2>Change Password</h2>
                  <p className="owner-settings-description">Verify your current password before choosing a new one.</p>
                  <div className="owner-settings-fields">
                    <div className="form-field">
                      <label htmlFor="current-password">Current Password</label>
                      <input
                        id="current-password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={passwords.currentPassword}
                        onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="new-password">New Password</label>
                      <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={passwords.newPassword}
                        onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="confirm-password">Confirm New Password</label>
                      <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={passwords.confirmPassword}
                        onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })}
                      />
                    </div>
                  </div>
                  <button className="primary-button compact-button" type="submit" disabled={passwordSaving}>
                    {passwordSaving ? 'Updating…' : 'Update Password'}
                  </button>

                  <div className="owner-settings-divider" />
                  <h2>Current Session</h2>
                  <p className="owner-settings-description">This is the device you are using now. No other device sessions are tracked by the current sign-in system.</p>
                  <div className="owner-settings-session">
                    <div>
                      <strong>{getCurrentBrowser()}</strong>
                      <small>{user?.email || 'Signed-in owner'} · Active now</small>
                    </div>
                    <button className="ghost-button compact-button danger-button" type="button" onClick={logout}>
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && renderPreferenceForm(
              <>
                <h2>Notifications</h2>
                <p className="owner-settings-description">Choose which owner account updates you want to receive.</p>
                <div className="owner-settings-options">
                  <SettingsToggle title="Booking requests" description="Updates when a resident requests a booking." checked={settings.notifications.bookingRequests} onChange={(event) => updateSetting('notifications', 'bookingRequests', event.target.checked)} />
                  <SettingsToggle title="Payment updates" description="Payment confirmations and pending payment reminders." checked={settings.notifications.paymentUpdates} onChange={(event) => updateSetting('notifications', 'paymentUpdates', event.target.checked)} />
                  <SettingsToggle title="Resident messages" description="Updates when residents send a message or request." checked={settings.notifications.residentMessages} onChange={(event) => updateSetting('notifications', 'residentMessages', event.target.checked)} />
                  <SettingsToggle title="Nestora product updates" description="Occasional feature announcements and service news." checked={settings.notifications.productUpdates} onChange={(event) => updateSetting('notifications', 'productUpdates', event.target.checked)} />
                </div>
              </>,
            )}

            {activeTab === 'properties' && renderPreferenceForm(
              <>
                <h2>Property Settings</h2>
                <p className="owner-settings-description">Set the starting city and occupancy preference for new listings.</p>
                <div className="owner-settings-fields">
                  <div className="form-field">
                    <label htmlFor="default-property-city">Default listing city</label>
                    <input id="default-property-city" type="text" maxLength={100} required value={settings.properties.defaultCity} onChange={(event) => updateSetting('properties', 'defaultCity', event.target.value)} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="default-allowed-gender">Default gender allowed</label>
                    <select id="default-allowed-gender" value={settings.properties.defaultAllowedGender} onChange={(event) => updateSetting('properties', 'defaultAllowedGender', event.target.value)}>
                      <option value="Unisex">Unisex / All</option>
                      <option value="Male">Male only</option>
                      <option value="Female">Female only</option>
                    </select>
                  </div>
                </div>
              </>,
            )}

            {activeTab === 'payments' && renderPreferenceForm(
              <>
                <h2>Payment Preferences</h2>
                <p className="owner-settings-description">Manage your preferred payout contact and method. Do not enter bank or UPI credentials here.</p>
                <div className="owner-settings-fields">
                  <div className="form-field">
                    <label htmlFor="payout-method">Preferred payout method</label>
                    <select id="payout-method" value={settings.payments.payoutMethod} onChange={(event) => updateSetting('payments', 'payoutMethod', event.target.value)}>
                      <option value="bank-transfer">Bank transfer</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="payout-email">Payout notification email</label>
                    <input id="payout-email" type="email" required value={settings.payments.payoutEmail} onChange={(event) => updateSetting('payments', 'payoutEmail', event.target.value)} />
                  </div>
                </div>
              </>,
            )}

            {activeTab === 'privacy' && renderPreferenceForm(
              <>
                <h2>Privacy</h2>
                <p className="owner-settings-description">Control how your account details and preferences are used.</p>
                <div className="owner-settings-options">
                  <SettingsToggle title="Share contact with residents" description="Allow current residents to see your owner contact details." checked={settings.privacy.shareContactWithResidents} onChange={(event) => updateSetting('privacy', 'shareContactWithResidents', event.target.checked)} />
                  <SettingsToggle title="Personalized insights" description="Use account activity to tailor owner dashboard insights." checked={settings.privacy.personalizedInsights} onChange={(event) => updateSetting('privacy', 'personalizedInsights', event.target.checked)} />
                </div>
              </>,
            )}
          </>
        )}
      </div>
    </div>
  )
}
