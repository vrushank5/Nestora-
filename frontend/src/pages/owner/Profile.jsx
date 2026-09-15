import { Camera } from 'lucide-react'

export default function Profile() {
  return (
    <div className="owner-page" style={{maxWidth: '800px'}}>
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">My Profile</h1>
          <p className="owner-subtitle">Manage your personal and business information.</p>
        </div>
      </div>

      <div className="owner-dashboard-content" style={{gridTemplateColumns: '1fr', gap: '24px'}}>
        <div className="dashboard-chart-pane 3d-tilt-card" style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
           <div style={{position: 'relative', width: '100px', height: '100px', borderRadius: '50%', background: 'var(--steel)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800}}>
             P
             <button style={{position: 'absolute', bottom: 0, right: 0, width: '32px', height: '32px', borderRadius: '50%', background: 'var(--white)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', cursor: 'pointer'}}>
               <Camera size={16}/>
             </button>
           </div>
           <div>
             <h2>Property Owner</h2>
             <p className="text-muted">owner@nestora.com</p>
             <button className="primary-button compact-button mt-4" style={{marginTop: '16px'}}>Edit Profile Picture</button>
           </div>
        </div>

        <div className="dashboard-chart-pane 3d-tilt-card">
          <h3 style={{marginBottom: '24px'}}>Personal Information</h3>
          <div className="form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
            <div className="form-field"><label>First Name</label><input type="text" className="owner-select w-full" defaultValue="Property"/></div>
            <div className="form-field"><label>Last Name</label><input type="text" className="owner-select w-full" defaultValue="Owner"/></div>
            <div className="form-field"><label>Email Address</label><input type="email" className="owner-select w-full" defaultValue="owner@nestora.com"/></div>
            <div className="form-field"><label>Phone Number</label><input type="text" className="owner-select w-full" defaultValue="+91 9876543210"/></div>
          </div>

          <h3 style={{marginBottom: '24px', marginTop: '32px'}}>Business Information</h3>
          <div className="form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
            <div className="form-field" style={{gridColumn: '1 / -1'}}><label>Business Name</label><input type="text" className="owner-select w-full" defaultValue="Nestora Management Pvt. Ltd."/></div>
            <div className="form-field" style={{gridColumn: '1 / -1'}}><label>Business Address</label><textarea className="owner-select w-full" rows="3" defaultValue="Navrangpura, Ahmedabad, Gujarat"></textarea></div>
          </div>

          <div style={{marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'flex-end'}}>
             <button className="ghost-button">Cancel</button>
             <button className="primary-button">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}
