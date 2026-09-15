import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Eye, CheckCircle2, XCircle, Download, AlertTriangle, Clock, Calendar } from 'lucide-react'
import { SkeletonCard } from '../../components/Skeleton.jsx'
import { getToken } from '../../context/authStorage.js'

const mockBookings = [];

const useBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/bookings`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(json => json.data || json);
      setBookings(data);
    } catch (err) {
      setFetchError(err.message || 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, []);

  return { bookings, isLoading, fetchError, setBookings };
};

const TABS = ['All', 'Pending', 'Approved', 'Active', 'Completed', 'Cancelled']

export default function Bookings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const { bookings, isLoading, fetchError, setBookings } = useBookings();

  const filtered = bookings.filter(b => {
    const matchTab = tab === 'All' || b.status === tab
    const q = search.toLowerCase()
    const matchSearch = !q || b.id.toLowerCase().includes(q) || b.resident.toLowerCase().includes(q) || b.property.toLowerCase().includes(q)
    return matchTab && matchSearch
  })

  const updateStatus = (id, newStatus) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b))
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Booking Management</h1>
          <p className="admin-page-subtitle">Track, approve, or resolve booking reservations platform-wide.</p>
        </div>
        <button className="ghost-button compact-button" onClick={() => alert('Exporting bookings CSV...')}>
          <Download size={15} /> Export Bookings CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="owner-tabs">
        {TABS.map(t => (
          <button key={t} className={`owner-tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search-field">
          <Search size={16} />
          <input placeholder="Search by booking ID, resident or property..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Booking ID</th><th>Resident</th><th>Property</th><th>Payment</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id}>
                <td>{b.id}</td><td>{b.resident}</td><td>{b.property}</td>
                <td><span className={`status-badge ${b.payment === 'Paid' ? 'active' : 'pending'}`}>{b.payment}</span></td>
                <td><span className={`status-badge ${b.status.toLowerCase()}`}>{b.status}</span></td>
                <td>
                  <div className="table-actions">
                    <button className="r-icon-btn" title="View Details" onClick={() => navigate(`/admin/bookings/${b.id}`)}>
                      <Eye size={15} />
                    </button>
                    {b.status === 'Pending' && (
                      <button className="primary-button compact-button" onClick={() => updateStatus(b.id, 'Approved')}>
                        Approve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
