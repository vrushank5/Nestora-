import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleHelp,
  DollarSign,
  LoaderCircle,
  MessageSquare,
  Star,
} from 'lucide-react'
import { useNotifications } from '../context/useNotifications.js'

const ICONS = {
  booking: CheckCircle2,
  payment: DollarSign,
  complaint: AlertTriangle,
  property: Building2,
  visit: CalendarDays,
  message: MessageSquare,
  review: Star,
  account: CircleHelp,
  system: Bell,
}

const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function NotificationInbox({ className = '' }) {
  const { notifications, unreadCount, loading, error, refresh, markRead, markAllRead } = useNotifications()
  const [actionError, setActionError] = useState('')
  const [working, setWorking] = useState(false)

  const handleMarkAllRead = async () => {
    setWorking(true)
    setActionError('')
    try {
      await markAllRead()
    } catch (requestError) {
      setActionError(requestError.message || 'Unable to mark notifications as read.')
    } finally {
      setWorking(false)
    }
  }

  const handleMarkRead = async (notificationId) => {
    setActionError('')
    try {
      await markRead(notificationId)
    } catch (requestError) {
      setActionError(requestError.message || 'Unable to mark notification as read.')
    }
  }

  return (
    <section className={`notification-inbox ${className}`}>
      <div className="notification-inbox-actions">
        <span>{unreadCount ? `${unreadCount} unread` : 'All caught up'}</span>
        <button type="button" onClick={handleMarkAllRead} disabled={!unreadCount || working}>
          {working ? <LoaderCircle size={15} className="notification-spin" /> : <Check size={15} />}
          Mark all as read
        </button>
      </div>

      {(error || actionError) && (
        <div className="notification-error" role="alert">
          <span>{actionError || error}</span>
          {error && <button type="button" onClick={refresh}>Retry</button>}
        </div>
      )}

      {loading && notifications.length === 0 ? (
        <div className="notification-state">
          <LoaderCircle size={20} className="notification-spin" /> Loading notifications…
        </div>
      ) : notifications.length ? (
        <div className="notification-list">
          {notifications.map((notification) => {
            const Icon = ICONS[notification.type] || Bell
            const item = (
              <>
                <span className={`notification-icon ${notification.type}`}><Icon size={19} /></span>
                <span className="notification-copy">
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <time dateTime={notification.createdAt}>{formatTime(notification.createdAt)}</time>
                </span>
                {!notification.read && <span className="notification-unread-dot" aria-label="Unread" />}
              </>
            )
            return (
              <article className={`notification-item ${notification.read ? 'read' : 'unread'}`} key={notification.id}>
                {notification.link ? (
                  <Link
                    className="notification-main"
                    to={notification.link}
                    onClick={() => {
                      if (!notification.read) handleMarkRead(notification.id)
                    }}
                  >
                    {item}
                  </Link>
                ) : (
                  <div className="notification-main">{item}</div>
                )}
                {!notification.read && (
                  <button
                    className="notification-mark-read"
                    type="button"
                    onClick={() => handleMarkRead(notification.id)}
                    aria-label={`Mark ${notification.title} as read`}
                    title="Mark as read"
                  >
                    <Check size={15} />
                  </button>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="notification-state notification-empty">
          <span><Bell size={25} /></span>
          <strong>No notifications yet</strong>
          <p>Important updates and activity will appear here.</p>
          {!error && <button type="button" onClick={refresh}>Refresh</button>}
        </div>
      )}
    </section>
  )
}
