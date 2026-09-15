import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Eye, ShieldCheck, ShieldAlert, UserX, MessageSquare, Download, AlertTriangle } from 'lucide-react'
import { getToken } from '../../context/authStorage.js'

const mockOwners = [];
const useOwners = () => {
  const [owners, setOwners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchOwners = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/owners`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(json => json.data || json);
      setOwners(data);
    } catch (err) {
      setFetchError(err.message || 'Failed to load owners');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOwners();
  }, []);

  return { owners, isLoading, fetchError };
};

export default function Owners() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { owners, isLoading, fetchError } = useOwners();
  const filtered = owners.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.business.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Property Owner Partners</h1>
          <p className="admin-page-subtitle">Manage partner accounts, properties count, and revenue metrics.</p>
        </div>
        <button className="ghost-button compact-button" onClick={() => alert('Exporting owner records...')}>
          <Download size={15} /> Export Owners CSV
        </button>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search-field">
          <Search size={16} />
          <input placeholder="Search by owner name or business..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="owner-table-wrapper">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="skeleton-row" style={{ height: '50px', background: '#f0f0f0', margin: '10px 0' }} />
          ))}
        </div>
      )}

      {/* Error banner */}
      {fetchError && !isLoading && (
        <div className="owner-error-banner" style={{ padding: '1rem', background: 'var(--error-bg)', color: 'var(--error-fg)', borderRadius: '8px', marginTop: '1rem' }}>
          <AlertTriangle size={18} /> {fetchError}
        </div>
      )}

      {/* Table */}
      {!isLoading && !fetchError && (
        <div className="owner-table-wrapper">
          <table className="owner-data-table">
            <thead>
              <tr>
                <th>Owner Partner</th>
                <th>Business Name</th>
                <th>Properties</th>
                <th>Verification</th>
                <th>Total Revenue</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td>
                    <div className="resident-cell">
                      <div className="admin-avatar-sm" style={{ background: 'var(--steel)' }}>{o.name.charAt(0)}</div>
                      <div>
                        <strong>{o.name}</strong>
                        <small className="muted-copy" style={{ display: 'block' }}>{o.phone}</small>
                      </div>
                    </div>
                  </td>
                  <td><strong>{o.business}</strong></td>
                  <td>{o.propertiesCount} properties</td>
                  <td>{o.verification === 'Verified' ? (
                    <span className="status-badge active"><ShieldCheck size={13} /> Verified</span>
                  ) : (
                    <span className="status-badge pending"><ShieldAlert size={13} /> Pending Review</span>
                  )}</td>
                  <td><strong style={{ color: 'var(--jade)' }}>{o.totalRevenue}</strong></td>
                  <td><span className={`status-badge ${o.status === 'Active' ? 'active' : 'pending'}`}>{o.status}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="r-icon-btn" title="View Owner Detail" onClick={() => navigate(`/admin/owners/${o.id}`)}>
                        <Eye size={15} />
                      </button>
                      {o.verification !== 'Verified' && (
                        <button className="primary-button compact-button" onClick={() => navigate('/admin/properties/verification')}>Verify</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
