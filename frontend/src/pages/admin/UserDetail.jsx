import { useParams, Link } from 'react'
import { ChevronLeft, Shield, UserX } from 'lucide-react'

export default function UserDetail() {
  const { id } = useParams()

  const user = {
    id: id || 'U-1001',
    name: 'Riya Shah',
    email: 'riya@example.com',
    role: 'Resident',
    phone: '+91 9876543210',
    gender: 'Female',
    occupation: 'Software Engineer',
    address: 'Bodakdev, Ahmedabad, Gujarat - 380054',
    status: 'Active',
    verified: true,
    joined: '25 Aug 2026',
    currentStay: 'Nestora Heights (Room 302)',
    totalPaid: '$25,500',
    bookingsCount: 2,
    complaintsCount: 1,
  }

  return (
    <div className="admin-page" style={{ maxWidth: '900px' }}>
      <Link to="/admin/users" className="r-back-link"><ChevronLeft size={18} /> Back to All Users</Link>

      <div className="admin-page-header">
        <div>
          <span className="admin-role-pill resident">{user.role}</span>
          <h1 className="admin-page-title">{user.name}</h1>
          <p className="admin-page-subtitle">User ID: <strong>{user.id}</strong> · Member since {user.joined}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="ghost-button compact-button danger-button"><UserX size={15} /> Suspend Account</button>
        </div>
      </div>

      <div className="admin-dashboard-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Personal Information */}
          <div className="admin-pane">
            <h3 style={{ marginBottom: '16px' }}>Personal & Contact Details</h3>
            <div className="r-booking-details">
              <div><span>Full Name</span><strong>{user.name}</strong></div>
              <div><span>Email</span><strong>{user.email}</strong></div>
              <div><span>Phone</span><strong>{user.phone}</strong></div>
              <div><span>Gender</span><strong>{user.gender}</strong></div>
              <div><span>Occupation</span><strong>{user.occupation}</strong></div>
              <div><span>Address</span><strong>{user.address}</strong></div>
            </div>
          </div>

          {/* Activity Overview */}
          <div className="admin-pane">
            <h3 style={{ marginBottom: '16px' }}>Activity & Stay History</h3>
            <div className="r-booking-details">
              <div><span>Current Stay</span><strong>{user.currentStay}</strong></div>
              <div><span>Total Rent Paid</span><strong style={{ color: 'var(--jade)' }}>{user.totalPaid}</strong></div>
              <div><span>Bookings Made</span><strong>{user.bookingsCount}</strong></div>
              <div><span>Complaints Raised</span><strong>{user.complaintsCount}</strong></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-pane" style={{ textAlign: 'center' }}>
            <div className="admin-avatar-lg" style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--sky)', color: 'var(--jade)', fontSize: '2rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              {user.name.charAt(0)}
            </div>
            <h4>{user.name}</h4>
            <p className="muted-copy">{user.email}</p>
            <div style={{ marginTop: '12px' }}>
              <span className="status-badge active"><Shield size={12} /> Verified Identity</span>
            </div>
          </div>

          <div className="admin-pane">
            <h3 style={{ marginBottom: '12px' }}>Admin Controls</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="ghost-button compact-button" onClick={() => alert(`Reset password email sent to ${user.email}`)}>
                Send Password Reset
              </button>
              <button className="ghost-button compact-button danger-button">
                Block Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
