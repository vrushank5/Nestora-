import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Download, TrendingUp, Clock, CheckCircle2, ArrowUpRight } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function Payments() {
  const [payments, setPayments] = useState([])
  useEffect(() => { apiRequest('/resident/payments').then(response => setPayments(response.data || [])) }, [])
  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalPending = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + Number(p.amount || 0), 0)
  const lastPayment = payments.find(p => p.status === 'Paid')

  return (
    <div className="r-page">
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">Payments</h1>
          <p className="r-page-subtitle">Track your rent payments and download invoices.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="r-stats-grid">
        {[
          { label: 'TOTAL PAID', value: `₹${totalPaid.toLocaleString('en-IN')}`, icon: CheckCircle2, color: 'var(--jade)', bg: 'rgba(10,111,91,0.1)' },
          { label: 'PENDING', value: `₹${totalPending.toLocaleString('en-IN')}`, icon: Clock, color: 'var(--saffron)', bg: 'rgba(229,168,67,0.1)', alert: true },
          { label: 'NEXT PAYMENT', value: totalPending ? 'Pending' : 'None', icon: TrendingUp, color: 'var(--steel)', bg: 'rgba(49,86,108,0.1)' },
          { label: 'LAST PAYMENT', value: lastPayment?.date || 'None', icon: CreditCard, color: 'var(--muted)', bg: 'var(--paper-2)' },
        ].map(s => (
          <motion.div key={s.label} className="r-stat-card" whileHover={{ y: -3 }}>
            <div className="r-stat-icon" style={{ background: s.bg, color: s.color }}><s.icon size={20} /></div>
            <div>
              <p className="r-stat-label">{s.label}</p>
              <h3 className="r-stat-value">{s.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pending Payment Banner */}
      {totalPending > 0 && (
        <div className="r-alert-banner">
          <Clock size={18} />
          <div>
            <strong>Payment Due</strong>
            <p>₹{totalPending.toLocaleString('en-IN')} is currently pending.</p>
          </div>
          <button className="primary-button compact-button">Pay Now ₹{totalPending.toLocaleString('en-IN')}</button>
        </div>
      )}

      {/* Table */}
      <div className="owner-table-wrapper" style={{ marginTop: '24px' }}>
        <table className="owner-data-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Property</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Date</th>
              <th>Status</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td><strong>{p.id}</strong></td>
                <td>{p.property}</td>
                <td><strong>₹{p.amount.toLocaleString('en-IN')}</strong></td>
                <td>{p.method}</td>
                <td>{p.date}</td>
                <td>
                  <span className={`status-badge ${p.status === 'Paid' ? 'active' : 'pending'}`}>
                    {p.status === 'Paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />} {p.status}
                  </span>
                </td>
                <td>
                  {p.status === 'Paid' ? (
                    <button className="r-icon-btn" title="Download Invoice"><Download size={16} /></button>
                  ) : (
                    <button className="primary-button compact-button"><ArrowUpRight size={14} /> Pay</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
