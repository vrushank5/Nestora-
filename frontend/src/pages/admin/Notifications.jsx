import { useState } from 'react'
import { Bell, Send, Users, ShieldAlert, CheckCircle2 } from 'lucide-react'

export default function Notifications() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('System')
  const [audience, setAudience] = useState('All Users')
  const [toast, setToast] = useState('')

  const handleSend = (e) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    setToast(`Notification broadcast sent to ${audience}.`)
    setTitle('')
    setMessage('')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="admin-page" style={{ maxWidth: '800px' }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Broadcast Notifications</h1>
          <p className="admin-page-subtitle">Send push and email notifications to platform users, residents, or owners.</p>
        </div>
      </div>

      {toast && (
        <div className="admin-toast-banner" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div className="admin-pane">
        <h3 style={{ marginBottom: '20px' }}>Create System Notification</h3>
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-field">
            <label>Notification Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Platform Maintenance Notice" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-field">
              <label>Notification Type</label>
              <select value={type} onChange={e => setType(e.target.value)}>
                <option>System</option><option>Booking</option><option>Payment</option><option>Complaint</option><option>Property</option><option>Promotion</option>
              </select>
            </div>
            <div className="form-field">
              <label>Target Audience</label>
              <select value={audience} onChange={e => setAudience(e.target.value)}>
                <option>All Users</option><option>Residents Only</option><option>Owners Only</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Message Content *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write message..." rows={4} />
          </div>

          <button className="primary-button compact-button" type="submit" style={{ alignSelf: 'flex-start' }}>
            <Send size={15} /> Send Broadcast Now
          </button>
        </form>
      </div>
    </div>
  )
}
