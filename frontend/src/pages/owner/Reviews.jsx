import { useEffect, useState } from 'react'
import { Star, MessageSquare, Flag } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  useEffect(() => { apiRequest('/owner/reviews').then(response => setReviews(response.data || [])) }, [])

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Reviews</h1>
          <p className="owner-subtitle">Monitor and respond to resident feedback.</p>
        </div>
      </div>

      <div className="owner-dashboard-content" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className="owner-stat-card 3d-tilt-card flex-col align-center text-center">
          <div className="stat-title text-center w-full block">Overall Rating</div>
          <h3 style={{ fontSize: '3rem', margin: '16px 0' }}>4.7</h3>
          <div className="rating-flex" style={{ justifyContent: 'center', marginBottom: '8px' }}>
            <Star size={20} className="fill-star" /><Star size={20} className="fill-star" /><Star size={20} className="fill-star" /><Star size={20} className="fill-star" /><Star size={20} className="fill-star" />
          </div>
          <p className="text-muted">Based on 248 reviews</p>

          <div className="w-full mt-4" style={{ textAlign: 'left', marginTop: '24px' }}>
            {[5, 4, 3, 2, 1].map(stars => (
              <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '12px' }}>{stars}</span> <Star size={12} className="fill-star" />
                <div style={{ flex: 1, height: '8px', background: 'var(--paper-2)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${stars === 5 ? 80 : stars === 4 ? 15 : stars === 3 ? 3 : stars === 2 ? 1 : 1}%`, height: '100%', background: 'var(--jade)' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map(rev => (
            <div key={rev.id} className="owner-property-card 3d-tilt-card p-4" style={{ padding: '24px' }}>
              <div className="flex justify-between" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div className="resident-cell">
                  <div className="owner-avatar sm">{rev.resident.charAt(0)}</div>
                  <div>
                    <strong>{rev.resident}</strong><br />
                    <small className="text-muted">{rev.property} • {rev.date}</small>
                  </div>
                </div>
                <div className="rating-flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < rev.rating ? 'fill-star' : 'text-muted'} />
                  ))}
                </div>
              </div>
              <p style={{ lineHeight: 1.6 }}>{rev.comment}</p>
              <div className="mt-4 table-actions" style={{ marginTop: '16px' }}>
                <button className="ghost-button compact-button"><MessageSquare size={14} /> Reply</button>
                <button className="ghost-button compact-button text-muted" style={{ border: 'none' }}><Flag size={14} /> Report</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
