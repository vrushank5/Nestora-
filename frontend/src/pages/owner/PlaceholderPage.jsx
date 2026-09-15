export default function PlaceholderPage({ title }) {
  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">{title}</h1>
          <p className="owner-subtitle">Manage your {title.toLowerCase()} here.</p>
        </div>
      </div>
      <div className="owner-empty-state">
        <div className="empty-icon">📁</div>
        <h3>No {title.toLowerCase()} found</h3>
        <p>This module is currently being built.</p>
      </div>
    </div>
  )
}
