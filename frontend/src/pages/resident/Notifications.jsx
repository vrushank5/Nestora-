import { useEffect, useState } from 'react'
import { Bell, CheckCircle2, DollarSign, AlertTriangle, CalendarDays, Building2, Star } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

const TYPE_ICONS = { booking: CheckCircle2, payment: DollarSign, complaint: AlertTriangle, visit: CalendarDays, property: Building2, review: Star }

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  useEffect(() => { apiRequest('/resident/notifications').then(response => setNotifications(response.data || [])) }, [])
  const getIcon = (type) => {
    const Icon = TYPE_ICONS[type] || Bell
    return <Icon size={18} />
  }

  return (
    <div className="r-page" style={{ maxWidth: '760px' }}>
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">Notifications</h1>
          <p className="r-page-subtitle">Stay up to date with your bookings, payments, and activities.</p>
        </div>
        <button className="ghost-button compact-button" style={{ border: 'none', color: 'var(--jade)', fontWeight: 800 }}>Mark all as read</button>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
        {notifications.map((n, i) => (
          <div
            key={n.id}
            style={{
              display: 'flex', gap: '16px', padding: '20px',
              borderBottom: i < notifications.length - 1 ? '1px solid var(--line)' : 'none',
              background: n.unread ? 'rgba(10,111,91,0.03)' : 'transparent'
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: n.unread ? 'var(--sky)' : 'var(--paper-2)', color: n.unread ? 'var(--jade)' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {getIcon(n.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: n.unread ? 'var(--ink)' : 'var(--ink-2)' }}>{n.title}</strong>
                <small style={{ color: 'var(--muted)', flexShrink: 0 }}>{n.time}</small>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{n.desc}</p>
            </div>
            {n.unread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--jade)', flexShrink: 0, marginTop: '6px' }} />}
          </div>
        ))}
      </div>
    </div>
  )
}
