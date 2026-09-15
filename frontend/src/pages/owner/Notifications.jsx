import { useEffect, useState } from 'react'
import { Bell, CheckCircle2, DollarSign, MessageSquare, Building2, CalendarDays } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  useEffect(() => { apiRequest('/owner/notifications').then(response => setNotifications(response.data || [])) }, [])

  const getIcon = (type) => {
    switch (type) {
      case 'booking': return <CheckCircle2 size={20} className="text-jade" />;
      case 'payment': return <DollarSign size={20} className="text-jade" />;
      case 'complaint': return <MessageSquare size={20} style={{ color: '#9b6817' }} />;
      case 'property': return <Building2 size={20} className="text-jade" />;
      case 'visit': return <CalendarDays size={20} className="text-jade" />;
      default: return <Bell size={20} className="text-jade" />;
    }
  }

  return (
    <div className="owner-page" style={{ maxWidth: '800px' }}>
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Notifications</h1>
          <p className="owner-subtitle">Stay updated on your property activities.</p>
        </div>
        <button className="ghost-button compact-button text-muted" style={{ border: 'none' }}>Mark all as read</button>
      </div>

      <div className="notifications-list" style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
        {notifications.map((n, i) => (
          <div key={n.id} style={{ display: 'flex', gap: '16px', padding: '20px', borderBottom: i < notifications.length - 1 ? '1px solid var(--line)' : 'none', background: n.unread ? 'rgba(10, 111, 91, 0.03)' : 'transparent' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: n.unread ? 'var(--sky)' : 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {getIcon(n.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '1rem', color: n.unread ? 'var(--ink)' : 'var(--ink-2)' }}>{n.title}</strong>
                <small className="text-muted">{n.time}</small>
              </div>
              <p className="text-muted">{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
