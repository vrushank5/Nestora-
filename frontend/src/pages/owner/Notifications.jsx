import NotificationInbox from '../../components/NotificationInbox.jsx'

export default function Notifications() {
  return (
    <div className="owner-page" style={{ maxWidth: '800px' }}>
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Notifications</h1>
          <p className="owner-subtitle">Stay updated on your property activities.</p>
        </div>
      </div>
      <NotificationInbox />
    </div>
  )
}
