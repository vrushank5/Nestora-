import NotificationInbox from '../../components/NotificationInbox.jsx'

export default function Notifications() {
  return (
    <div className="r-page" style={{ maxWidth: '760px' }}>
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">Notifications</h1>
          <p className="r-page-subtitle">Stay up to date with your bookings, payments, and activities.</p>
        </div>
      </div>
      <NotificationInbox />
    </div>
  )
}
