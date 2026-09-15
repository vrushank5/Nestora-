import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, HelpCircle } from 'lucide-react'
import { getToken } from '../../context/authStorage.js'

export default function Faqs() {
  const [faqs, setFaqs] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'Booking' })
  useEffect(() => { fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faqs`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(response => response.json()).then(result => setFaqs(result.data || [])) }, [])

  const addFaq = () => {
    if (!newFaq.question || !newFaq.answer) return
    setFaqs([...faqs, { id: Date.now(), ...newFaq, order: faqs.length + 1 }])
    setNewFaq({ question: '', answer: '', category: 'Booking' })
    setShowAdd(false)
  }

  const remove = (id) => setFaqs(faqs.filter(f => f.id !== id))

  return (
    <div className="admin-page" style={{ maxWidth: '840px' }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">FAQ Management</h1>
          <p className="admin-page-subtitle">Manage system-wide Frequently Asked Questions across categories.</p>
        </div>
        <button className="primary-button compact-button" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> Add FAQ Item
        </button>
      </div>

      {showAdd && (
        <div className="admin-pane" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '14px' }}>New FAQ</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-field">
              <label>Question *</label>
              <input value={newFaq.question} onChange={e => setNewFaq({ ...newFaq, question: e.target.value })} placeholder="Enter question..." />
            </div>
            <div className="form-field">
              <label>Category</label>
              <select value={newFaq.category} onChange={e => setNewFaq({ ...newFaq, category: e.target.value })}>
                <option>Booking</option><option>Payment</option><option>Resident</option><option>Owner</option><option>Property</option><option>Account</option>
              </select>
            </div>
            <div className="form-field">
              <label>Answer *</label>
              <textarea value={newFaq.answer} onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })} placeholder="Enter answer..." rows={3} />
            </div>
            <button className="primary-button compact-button" onClick={addFaq} style={{ alignSelf: 'flex-start' }}>
              Save FAQ
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {faqs.map(f => (
          <div key={f.id} className="admin-pane">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="r-amenity-tag">{f.category}</span>
                <h4 style={{ marginTop: '6px', fontSize: '1.02rem' }}>{f.question}</h4>
              </div>
              <button className="r-icon-btn" onClick={() => remove(f.id)} title="Delete FAQ">
                <Trash2 size={15} color="var(--terracotta)" />
              </button>
            </div>
            <p style={{ marginTop: '10px', color: 'var(--muted)', fontSize: '0.9rem' }}>{f.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
