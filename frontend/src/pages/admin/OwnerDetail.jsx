import { useParams, Link } from 'react'
import { ChevronLeft, ShieldCheck, Building2, DollarSign, UserX, Mail, Phone, MapPin } from 'lucide-react'
import { residences } from '../../data/homeData.js'

export default function OwnerDetail() {
  const { id } = useParams()

  const owner = {
    id: id || 'O-201',
    name: 'Rajesh Sharma',
    email: 'rajesh@example.com',
    phone: '+91 9876543213',
    business: 'Nestora Living Partners',
    gstin: '24AAAAA0000A1Z5',
    address: 'Satellite, Ahmedabad, Gujarat',
    verification: 'Verified',
    status: 'Active',
    totalRevenue: '$14,80,000',
    joined: '01 Jun 2026',
  }

  return (
    <div className="admin-page" style={{ maxWidth: '960px' }}>
      <Link to="/admin/owners" className="r-back-link"><ChevronLeft size={18} /> Back to Owners</Link>

      <div className="admin-page-header">
        <div>
          <span className="admin-role-pill owner">Property Owner</span>
          <h1 className="admin-page-title">{owner.name}</h1>
          <p className="admin-page-subtitle">{owner.business} · Joined {owner.joined}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="ghost-button compact-button danger-button"><UserX size={15} /> Suspend Partner</button>
        </div>
      </div>

      <div className="admin-dashboard-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Business & Legal */}
          <div className="admin-pane">
            <h3 style={{ marginBottom: '16px' }}>Business & Verification Details</h3>
            <div className="r-booking-details">
              <div><span>Business Name</span><strong>{owner.business}</strong></div>
              <div><span>GSTIN</span><strong>{owner.gstin}</strong></div>
              <div><span>Email</span><strong>{owner.email}</strong></div>
              <div><span>Phone</span><strong>{owner.phone}</strong></div>
              <div><span>Address</span><strong>{owner.address}</strong></div>
              <div><span>Verification</span><span className="status-badge active"><ShieldCheck size={13} /> Verified Partner</span></div>
            </div>
          </div>

          {/* Owned Properties List */}
          <div className="admin-pane">
            <h3 style={{ marginBottom: '14px' }}>Owned Properties ({residences.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {residences.map(p => (
                <div key={p.id} className="admin-queue-card">
                  <img src={p.image} alt={p.name} />
                  <div style={{ flex: 1 }}>
                    <strong>{p.name}</strong>
                    <small className="muted-copy" style={{ display: 'block' }}>{p.location} · Rent: {p.price}</small>
                  </div>
                  <Link to={`/admin/properties/${p.id}`} className="ghost-button compact-button">View</Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Stats Pane */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-pane" style={{ textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--sky)', color: 'var(--jade)', fontSize: '2rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              {owner.name.charAt(0)}
            </div>
            <h4>{owner.name}</h4>
            <p className="muted-copy">{owner.business}</p>
            <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(10,111,91,0.06)', borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', textTransform: uppercase }}>Total Generated Revenue</span>
              <h3 style={{ color: 'var(--jade)', fontSize: '1.6rem', marginTop: '4px' }}>{owner.totalRevenue}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
