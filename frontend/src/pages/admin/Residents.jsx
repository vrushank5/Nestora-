import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, MessageSquare, Download, AlertTriangle } from 'lucide-react';
import { SkeletonCard } from '../../components/Skeleton.jsx';
import { getToken } from '../../context/authStorage.js';

const useResidents = () => {
  const [residents, setResidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/residents`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(json => {
        if (active) setResidents(json.data || json);
      })
      .catch(err => {
        if (active) setFetchError(err.message || 'Failed to load residents');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  return { residents, isLoading, fetchError };
};

export default function Residents() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { residents, isLoading, fetchError } = useResidents();
  const filtered = residents.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.property?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Resident Roster</h1>
          <p className="admin-page-subtitle">Track active residents, room assignments, and payment statuses.</p>
        </div>
        <button className="ghost-button compact-button" onClick={() => alert('Exporting resident roster CSV...')}>
          <Download size={15} /> Export Roster
        </button>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search-field">
          <Search size={16} />
          <input placeholder="Filter by resident name or property..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="owner-table-wrapper">
          {[...Array(4)].map((_, idx) => (
            <SkeletonCard key={idx} />
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
                <th>Resident</th>
                <th>Property</th>
                <th>Room Assignment</th>
                <th>Booking ID</th>
                <th>Move-In Date</th>
                <th>Payment Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="resident-cell">
                      <div className="admin-avatar-sm">{r.name?.charAt(0)}</div>
                      <div>
                        <strong>{r.name}</strong>
                        <small className="muted-copy" style={{ display: 'block' }}>{r.email}</small>
                      </div>
                    </div>
                  </td>
                  <td><strong>{r.property}</strong></td>
                  <td>{r.room}</td>
                  <td>{r.booking}</td>
                  <td>{r.moveIn}</td>
                  <td>
                    <span className={`status-badge ${r.paymentStatus === 'Paid' ? 'active' : r.paymentStatus === 'Overdue' ? 'status-available' : 'pending'}`}>{r.paymentStatus}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${r.status === 'Active' ? 'active' : 'status-available'}`}>{r.status}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="r-icon-btn" title="View Resident" onClick={() => navigate(`/admin/users/${r.id}`)}>
                        <Eye size={15} />
                      </button>
                      <button className="r-icon-btn" title="Message Resident" onClick={() => navigate('/admin/notifications')}>
                        <MessageSquare size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <p>No residents match the search criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
