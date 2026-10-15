import { useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import NotificationInbox from '../../components/NotificationInbox.jsx'
import { useNotifications } from '../../context/useNotifications.js'
import { apiRequest } from '../../services/api.js'

export default function Notifications() {
  const { refresh } = useNotifications()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('system')
  const [audience, setAudience] = useState('all')
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    setSending(true)
    setError('')
    setToast('')
    try {
      const response = await apiRequest('/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, message, type, audience }),
      })
      await refresh()
      setToast(response.message || 'Broadcast notification sent.')
      setTitle('')
      setMessage('')
    } catch (requestError) {
      setError(requestError.message || 'Unable to send broadcast notification.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="admin-page" style={{ maxWidth: '800px' }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Broadcast Notifications</h1>
          <p className="admin-page-subtitle">Send in-app updates to platform users, residents, owners, or admins.</p>
        </div>
      </div>

      {toast && (
        <div className="admin-toast-banner" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}
      {error && <div className="notification-error" role="alert">{error}</div>}

      <div className="admin-pane">
        <h3 style={{ marginBottom: '20px' }}>Create System Notification</h3>
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-field">
            <label htmlFor="notification-title">Notification Title *</label>
            <input id="notification-title" required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Platform maintenance notice" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-field">
              <label htmlFor="notification-type">Notification Type</label>
              <select id="notification-type" value={type} onChange={e => setType(e.target.value)}>
                <option value="system">System</option><option value="booking">Booking</option><option value="payment">Payment</option><option value="complaint">Complaint</option><option value="property">Property</option><option value="promotion">Promotion</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="notification-audience">Target Audience</label>
              <select id="notification-audience" value={audience} onChange={e => setAudience(e.target.value)}>
                <option value="all">All active users</option><option value="residents">Residents only</option><option value="owners">Owners only</option><option value="admins">Admins only</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="notification-message">Message Content *</label>
            <textarea id="notification-message" required maxLength={1000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your update…" rows={4} />
          </div>

          <button className="primary-button compact-button" type="submit" disabled={sending} style={{ alignSelf: 'flex-start' }}>
            <Send size={15} /> {sending ? 'Sending…' : 'Send Broadcast'}
          </button>
        </form>
      </div>

      <div className="admin-pane notification-admin-inbox">
        <h3>Notifications for this admin account</h3>
        <NotificationInbox />
      </div>
    </div>
  )
}
