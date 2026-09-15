import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Edit3, Trash2, MessageSquare } from 'lucide-react'
import { apiRequest } from '../../services/api.js'
import { propertyService } from '../../services/propertyService.js'

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} style={{ background: 'none', color: i <= value ? 'var(--saffron)' : 'var(--muted)', fontSize: '1.4rem', lineHeight: 1 }} onClick={() => onChange && onChange(i)}>★</button>
      ))}
    </div>
  )
}

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [properties, setProperties] = useState([])
  useEffect(() => { apiRequest('/resident/reviews').then(response => setReviews(response.data || [])) }, [])
  useEffect(() => { propertyService.getAllProperties().then(setProperties) }, [])
  const [form, setForm] = useState({ rating: 5, text: '', property: 'Nestora Heights' })

  const submit = () => {
    if (!form.text.trim()) return
    setReviews([{ id: Date.now(), ...form, date: 'Today', ownerReply: null }, ...reviews])
    setForm({ rating: 5, text: '', property: 'Nestora Heights' })
  }

  const remove = (id) => setReviews(reviews.filter(r => r.id !== id))

  return (
    <div className="r-page" style={{ maxWidth: '800px' }}>
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">My Reviews</h1>
          <p className="r-page-subtitle">Share your experience to help other residents.</p>
        </div>
      </div>

      {/* Write Review */}
      <div className="r-pane" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Write a Review</h3>
        <div className="form-field">
          <label>Property</label>
          <select value={form.property} onChange={e => setForm({ ...form, property: e.target.value })}>
            {properties.map(property => <option key={property.id} value={property.name}>{property.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.86rem', fontWeight: 900, color: 'var(--ink-2)', display: 'block', marginBottom: '8px' }}>Rating</label>
          <StarRating value={form.rating} onChange={r => setForm({ ...form, rating: r })} />
        </div>
        <div className="form-field">
          <label>Your Review</label>
          <textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="Share your experience..." rows={4} />
        </div>
        <button className="primary-button compact-button" onClick={submit}><MessageSquare size={15} /> Submit Review</button>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="empty-state"><Star size={42} /><h3>No reviews yet</h3><p>Write your first review above.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map(r => (
            <motion.div key={r.id} className="r-pane" whileHover={{ x: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4>{r.property}</h4>
                  <StarRating value={r.rating} />
                  <p className="muted-copy" style={{ fontSize: '0.82rem', marginTop: '4px' }}>{r.date}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="r-icon-btn" title="Edit"><Edit3 size={15} /></button>
                  <button className="r-icon-btn" style={{ color: 'var(--terracotta)' }} onClick={() => remove(r.id)} title="Delete"><Trash2 size={15} /></button>
                </div>
              </div>
              <p style={{ marginTop: '12px', lineHeight: 1.6 }}>{r.text}</p>
              {r.ownerReply && (
                <div className="r-owner-reply">
                  <strong>Owner's Response:</strong>
                  <p>{r.ownerReply}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
