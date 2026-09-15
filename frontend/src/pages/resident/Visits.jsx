import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, X, Plus } from 'lucide-react'
import { apiRequest } from '../../services/api.js'
import { propertyService } from '../../services/propertyService.js'

const STATUS_CLASSES = { Confirmed: 'active', Requested: 'pending', Completed: 'completed', Cancelled: 'cancelled', Rescheduled: 'upcoming' }

export default function Visits() {
  const [visits, setVisits] = useState([])
  const [properties, setProperties] = useState([])
  useEffect(() => { apiRequest('/resident/visits').then(response => setVisits(response.data || [])) }, [])
  useEffect(() => { propertyService.getAllProperties().then(setProperties) }, [])
  const [showModal, setShowModal] = useState(false)

  const cancel = (id) => setVisits(visits.map(v => v.id === id ? { ...v, status: 'Cancelled' } : v))

  return (
    <div className="r-page">
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">Property Visits</h1>
          <p className="r-page-subtitle">Manage your scheduled property site visits.</p>
        </div>
        <button className="primary-button" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Schedule Visit
        </button>
      </div>

      {visits.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={42} />
          <h3>No visits scheduled</h3>
          <p>Schedule a visit to explore properties in person before booking.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {visits.map(v => (
            <motion.div key={v.id} className="r-pane r-visit-card" whileHover={{ x: 2 }}>
              <div className="r-visit-icon">
                <CalendarDays size={22} />
              </div>
              <div className="r-visit-info">
                <h4>{v.property}</h4>
                <p className="muted-copy">{v.address}</p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}><CalendarDays size={13} /> {v.date} at {v.time}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                <span className={`status-badge ${STATUS_CLASSES[v.status] || 'upcoming'}`}>{v.status}</span>
                {v.status !== 'Completed' && v.status !== 'Cancelled' && (
                  <div className="table-actions">
                    <button className="ghost-button compact-button danger-button" onClick={() => cancel(v.id)}>
                      <X size={13} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Schedule Visit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
              <h2>Schedule a Visit</h2>
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-field"><label>Select Property *</label>
                  <select>{properties.map(property => <option key={property.id} value={property.id}>{property.name}</option>)}</select>
                </div>
                <div className="form-field"><label>Preferred Date *</label><input type="date" /></div>
                <div className="form-field"><label>Preferred Time *</label><input type="time" /></div>
                <div className="form-field"><label>Note (Optional)</label><textarea placeholder="Any specific rooms you want to see?" rows={3} /></div>
              </div>
              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button className="ghost-button compact-button" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="primary-button compact-button" onClick={() => setShowModal(false)}>Request Visit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
