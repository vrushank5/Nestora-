import { Bell, Lock, Shield, CreditCard, Building } from 'lucide-react'

export default function Settings() {
  return (
    <div className="owner-page" style={{maxWidth: '800px'}}>
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Settings</h1>
          <p className="owner-subtitle">Manage your account preferences and security.</p>
        </div>
      </div>

      <div className="owner-dashboard-content" style={{gridTemplateColumns: '1fr 2fr', gap: '32px'}}>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <button className="owner-nav-item active" style={{background: 'var(--paper-2)', color: 'var(--ink)', borderRadius: 'var(--radius)', border: 'none'}}><Lock size={18}/> Security</button>
          <button className="owner-nav-item" style={{color: 'var(--ink)'}}><Bell size={18}/> Notifications</button>
          <button className="owner-nav-item" style={{color: 'var(--ink)'}}><Building size={18}/> Property Settings</button>
          <button className="owner-nav-item" style={{color: 'var(--ink)'}}><CreditCard size={18}/> Payments</button>
          <button className="owner-nav-item" style={{color: 'var(--ink)'}}><Shield size={18}/> Privacy</button>
        </div>

        <div className="dashboard-chart-pane 3d-tilt-card">
          <h3 style={{marginBottom: '24px'}}>Change Password</h3>
          <div className="form-grid" style={{display: 'grid', gridTemplateColumns: '1fr', gap: '20px'}}>
            <div className="form-field"><label>Current Password</label><input type="password" className="owner-select w-full" placeholder="••••••••"/></div>
            <div className="form-field"><label>New Password</label><input type="password" className="owner-select w-full" placeholder="••••••••"/></div>
            <div className="form-field"><label>Confirm New Password</label><input type="password" className="owner-select w-full" placeholder="••••••••"/></div>
          </div>
          <div style={{marginTop: '24px', display: 'flex', justifyContent: 'flex-start'}}>
             <button className="primary-button compact-button">Update Password</button>
          </div>

          <hr style={{margin: '32px 0', border: 'none', borderTop: '1px solid var(--line)'}} />

          <h3 style={{marginBottom: '16px'}}>Login History</h3>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--line)'}}>
            <div>
              <strong>Windows PC - Chrome</strong>
              <div className="text-muted" style={{fontSize: '0.85rem'}}>Ahmedabad, Gujarat • Active Now</div>
            </div>
          </div>
          
          <div style={{marginTop: '32px'}}>
            <h3 style={{marginBottom: '8px', color: 'var(--terracotta)'}}>Logout All Devices</h3>
            <p className="text-muted" style={{marginBottom: '16px', fontSize: '0.9rem'}}>This will log you out from all other active sessions across devices.</p>
            <button className="ghost-button compact-button danger-button">Logout All Devices</button>
          </div>
        </div>

      </div>
    </div>
  )
}
