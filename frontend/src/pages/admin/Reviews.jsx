import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, ShieldAlert, EyeOff, Trash2 } from 'lucide-react'
import { getToken } from '../../context/authStorage.js'

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  useEffect(() => { fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reviews`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(response => response.json()).then(result => setReviews(result.data || [])) }, [])

  const stats = [
    { label: 'TOTAL REVIEWS', value: reviews.length, icon: Star },
    { label: 'AVERAGE RATING', value: reviews.length ? `${(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)} ★` : '0 ★', icon: Star },
    { label: 'REPORTED REVIEWS', value: reviews.filter(review => review.reported).length, alert: true, icon: ShieldAlert },
    { label: 'PENDING MODERATION', value: reviews.filter(review => review.status === 'Pending').length, icon: Star },
  ]

  const remove = (id) => setReviews(reviews.filter(r => r.id !== id))
  const toggleHide = (id) => setReviews(reviews.map(r => r.id === id ? { ...r, status: r.status === 'Hidden' ? 'Approved' : 'Hidden' } : r))

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Review Moderation</h1>
          <p className="admin-page-subtitle">Inspect public user reviews and moderate reported or inappropriate content.</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        {stats.map(s => (
          <div key={s.label} className={`admin-stat-card ${s.alert ? 'alert-card' : ''}`}>
            <div className="admin-stat-icon" style={{ background: 'var(--paper-2)', color: s.alert ? 'var(--terracotta)' : 'var(--jade)' }}><s.icon size={20} /></div>
            <div>
              <span className="admin-stat-label">{s.label}</span>
              <h3 className="admin-stat-val">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reviews.map(r => (
          <motion.div key={r.id} className={`admin-pane ${r.reported ? 'alert-center-pane' : ''}`} whileHover={{ x: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <strong>{r.resident}</strong>
                  {r.reported && <span className="status-badge status-available"><ShieldAlert size={12} /> Reported</span>}
                  <span className={`status-badge ${r.status === 'Approved' ? 'active' : 'pending'}`}>{r.status}</span>
                </div>
                <p className="muted-copy" style={{ fontSize: '0.82rem', marginTop: '2px' }}>{r.property} · {r.date}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="ghost-button compact-button" onClick={() => toggleHide(r.id)}>
                  <EyeOff size={14} /> {r.status === 'Hidden' ? 'Unhide' : 'Hide'}
                </button>
                <button className="ghost-button compact-button danger-button" onClick={() => remove(r.id)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
            <p style={{ marginTop: '12px', fontSize: '0.95rem' }}>{r.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
