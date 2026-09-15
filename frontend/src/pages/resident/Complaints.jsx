import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Plus, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

const PRIORITY_COLORS = { High: 'status-available', Medium: 'status-pending', Low: 'status-upcoming' }
const STATUS_MAP = { 'In Progress': 'upcoming', Resolved: 'active', Pending: 'pending', Closed: 'completed' }

const timeline = [
  { label: 'Complaint Created', done: true },
  { label: 'Assigned to Team', done: true },
  { label: 'In Progress', done: true },
  { label: 'Resolution Sent', done: false },
  { label: 'Resolved', done: false },
]

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  useEffect(() => { apiRequest('/resident/complaints').then(response => setComplaints(response.data || [])) }, [])
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ title: '', category: 'Maintenance', desc: '', priority: 'Medium' })

  const submit = () => {
    const c = { id: `C-${100 + complaints.length + 1}`, ...form, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), status: 'Pending' }
    setComplaints([c, ...complaints])
    setShowModal(false)
    setForm({ title: '', category: 'Maintenance', desc: '', priority: 'Medium' })
  }

  const stats = [
    { label: 'Open', value: complaints.filter(c => c.status === 'Pending').length, icon: AlertCircle, color: 'var(--terracotta)', bg: 'rgba(200,93,71,0.1)' },
    { label: 'In Progress', value: complaints.filter(c => c.status === 'In Progress').length, icon: Clock, color: '#9b6817', bg: 'rgba(229,168,67,0.1)' },
    { label: 'Resolved', value: complaints.filter(c => c.status === 'Resolved').length, icon: CheckCircle2, color: 'var(--jade)', bg: 'rgba(10,111,91,0.1)' },
  ]

  return (
    <div className="r-page">
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">My Complaints</h1>
          <p className="r-page-subtitle">Raise and track maintenance or service issues.</p>
        </div>
        <button className="primary-button" onClick={() => setShowModal(true)}><Plus size={16} /> New Complaint</button>
      </div>

      <div className="r-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {stats.map(s => (
          <motion.div key={s.label} className="r-stat-card" whileHover={{ y: -3 }}>
            <div className="r-stat-icon" style={{ background: s.bg, color: s.color }}><s.icon size={20} /></div>
            <div><p className="r-stat-label">{s.label.toUpperCase()}</p><h3 className="r-stat-value">{s.value}</h3></div>
          </motion.div>
        ))}
      </div>

      {complaints.length === 0 ? (
        <div className="empty-state"><AlertTriangle size={42} /><h3>No complaints</h3><p>Raise an issue if you face any problem with your stay.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
          {complaints.map(c => (
            <motion.div key={c.id} className="r-pane r-complaint-card" whileHover={{ x: 2 }}>
              <div className="r-complaint-body">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h4>{c.title}</h4>
                    <p className="muted-copy" style={{ fontSize: '0.85rem', marginTop: '4px' }}>{c.id} · {c.category} · {c.date}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`status-badge ${PRIORITY_COLORS[c.priority]}`}>{c.priority}</span>
                    <span className={`status-badge ${STATUS_MAP[c.status]}`}>{c.status}</span>
                  </div>
                </div>
                <p style={{ marginTop: '10px', color: 'var(--ink-2)', fontSize: '0.9rem' }}>{c.desc}</p>
              </div>
              <button className="ghost-button compact-button" style={{ marginTop: '14px', alignSelf: 'flex-start' }} onClick={() => setSelected(c)}>View Timeline</button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Timeline Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div className="modal-content" initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <button className="close-modal-btn" onClick={() => setSelected(null)}><X size={18} /></button>
              <h2 style={{ marginBottom: '6px' }}>Complaint Timeline</h2>
              <p className="muted-copy">{selected.title}</p>
              <div className="r-timeline" style={{ marginTop: '24px' }}>
                {timeline.map((step, i) => (
                  <div key={i} className={`r-timeline-step ${step.done ? 'done' : ''}`}>
                    <div className="r-timeline-dot">{step.done ? <CheckCircle2 size={16} /> : <Clock size={16} />}</div>
                    {i < timeline.length - 1 && <div className={`r-timeline-line ${step.done ? 'done' : ''}`} />}
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Complaint Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
              <h2>Raise a Complaint</h2>
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-field"><label>Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief description of the issue" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-field"><label>Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {['Electricity', 'Water', 'Food', 'Cleaning', 'Internet', 'Maintenance', 'Security', 'Room', 'Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-field"><label>Priority</label>
                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      <option>High</option><option>Medium</option><option>Low</option>
                    </select>
                  </div>
                </div>
                <div className="form-field"><label>Description *</label><textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Describe the issue in detail..." rows={4} /></div>
              </div>
              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button className="ghost-button compact-button" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="primary-button compact-button" onClick={submit}>Submit Complaint</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
