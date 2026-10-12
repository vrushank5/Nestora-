import { useEffect, useState } from 'react'
import { Search, Filter, DollarSign, Download } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function Payments() {
  const [payments, setPayments] = useState([])
  useEffect(() => { apiRequest('/owner/payments').then(response => setPayments(response.data || [])) }, [])
  const paid = payments.filter(payment => payment.status?.toLowerCase() === 'paid')
  const pending = payments.filter(payment => payment.status?.toLowerCase() === 'pending')
  const total = list => list.reduce((sum, payment) => sum + Number(String(payment.amount || 0).replace(/[^0-9.]/g, '')), 0)

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Payments</h1>
          <p className="owner-subtitle">Monitor rent collection and revenue.</p>
        </div>
      </div>

      <div className="owner-stats-grid">
        <div className="owner-stat-card 3d-tilt-card">
          <div className="stat-icon"><DollarSign size={22} /></div>
          <div className="stat-details">
            <span className="stat-title">Total Revenue (Aug)</span>
            <div className="stat-value-row">
              <h3>${total(payments).toLocaleString('en-US')}</h3>
            </div>
          </div>
        </div>
        <div className="owner-stat-card 3d-tilt-card">
          <div className="stat-icon" style={{ background: 'var(--sky)', color: 'var(--jade)' }}><DollarSign size={22} /></div>
          <div className="stat-details">
            <span className="stat-title">Collected</span>
            <div className="stat-value-row">
              <h3>${total(paid).toLocaleString('en-US')}</h3>
            </div>
          </div>
        </div>
        <div className="owner-stat-card 3d-tilt-card alert-state">
          <div className="stat-icon"><DollarSign size={22} /></div>
          <div className="stat-details">
            <span className="stat-title">Pending</span>
            <div className="stat-value-row">
              <h3>${total(pending).toLocaleString('en-US')}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="owner-list-actions mt-4">
        <div className="owner-search-box">
          <Search size={16} />
          <input type="text" placeholder="Search transactions..." />
        </div>
        <button className="ghost-button compact-button"><Filter size={16} /> Filter</button>
      </div>

      <div className="owner-table-wrapper 3d-tilt-card mt-4">
        <table className="owner-data-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Resident</th>
              <th>Property</th>
              <th>Amount ($)</th>
              <th>Method</th>
              <th>Date</th>
              <th>Status</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(tx => (
              <tr key={tx.id}>
                <td><strong>{tx.id}</strong></td>
                <td>{tx.resident}</td>
                <td>{tx.property}</td>
                <td>{String(tx.amount || '').startsWith('$') ? tx.amount : `$${Number(tx.amount || 0).toLocaleString('en-US')}`}</td>
                <td>{tx.method}</td>
                <td>{tx.date}</td>
                <td>
                  <span className={`status-badge status-${tx.status.toLowerCase()}`}>
                    {tx.status}
                  </span>
                </td>
                <td>
                  <button className="icon-btn" title="Download Invoice"><Download size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
