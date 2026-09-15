import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, CheckCircle2, Clock, XCircle, CreditCard, Download, Search, AlertTriangle } from 'lucide-react'
import { getToken } from '../../context/authStorage.js'

const usePayments = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ revenue: 0, successful: 0, pending: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(json => { setSummary(json.summary || summary); return json.data || json });
      setPayments(data);
    } catch (err) {
      setFetchError(err.message || 'Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return { payments, isLoading, fetchError };
};

export default function Payments() {
  const [search, setSearch] = useState('');
  const { payments, isLoading, fetchError } = usePayments();
  const filtered = payments.filter(p =>
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.resident.toLowerCase().includes(search.toLowerCase()) ||
    p.property.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Financial & Payment Management</h1>
          <p className="admin-page-subtitle">Track platform transaction volume, Gateway statuses, and downloadable invoices.</p>
        </div>
        <button className="ghost-button compact-button" onClick={() => alert('Exporting payment statements CSV...')}>
          <Download size={15} /> Export Financial CSV
        </button>
      </div>

      {/* Financial Overview Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(10,111,91,0.1)', color: 'var(--jade)' }}><DollarSign size={20} /></div>
          <div><span className="admin-stat-label">TOTAL REVENUE</span><h3 className="admin-stat-val">₹{summary.revenue.toLocaleString('en-IN')}</h3></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(10,111,91,0.1)', color: 'var(--jade)' }}><CheckCircle2 size={20} /></div>
          <div><span className="admin-stat-label">SUCCESSFUL PAYMENTS</span><h3 className="admin-stat-val">{summary.successful}</h3></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(229,168,67,0.1)', color: '#9b6817' }}><Clock size={20} /></div>
          <div><span className="admin-stat-label">PENDING PAYMENTS</span><h3 className="admin-stat-val">{summary.pending}</h3></div>
        </div>
        <div className="admin-stat-card alert-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(200,93,71,0.1)', color: 'var(--terracotta)' }}><XCircle size={20} /></div>
          <div><span className="admin-stat-label">FAILED PAYMENTS</span><h3 className="admin-stat-val">{summary.failed}</h3></div>
        </div>
      </div>

      {/* Filter */}
      <div className="admin-filter-bar">
        <div className="admin-search-field">
          <Search size={16} />
          <input placeholder="Search by transaction ID, resident or property..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="owner-table-wrapper">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="skeleton-row" style={{ height: '50px', background: '#f0f0f0', margin: '10px 0' }}></div>
          ))}
        </div>
      )}

      {/* Error state */}
      {fetchError && !isLoading && (
        <div className="owner-error-banner" style={{ padding: '1rem', background: 'var(--error-bg)', color: 'var(--error-fg)', borderRadius: '8px', marginTop: '1rem' }}>
          <AlertTriangle size={18} /> {fetchError}
        </div>
      )}

      {/* Payments Table */}
      {!isLoading && !fetchError && (
        <div className="owner-table-wrapper">
          <table className="owner-data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Resident</th>
                <th>Property</th>
                <th>Booking ID</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.id}</strong></td>
                  <td>{p.resident}</td>
                  <td>{p.property}</td>
                  <td>{p.booking}</td>
                  <td><strong style={{ color: 'var(--jade)' }}>{p.amount}</strong></td>
                  <td><span className="r-amenity-tag">{p.method}</span></td>
                  <td>{p.date}</td>
                  <td>
                    <span className={`status-badge ${p.status === 'Paid' ? 'active' : p.status === 'Failed' ? 'status-available' : 'pending'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <button className="r-icon-btn" title="Download Invoice" onClick={() => alert(`Downloading Invoice ${p.id}`)}>
                      <Download size={15} />
                    </button>
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
