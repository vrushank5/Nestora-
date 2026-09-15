import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BadgeCheck, CheckCircle2, Eye, MapPin, Check, X, AlertTriangle } from 'lucide-react'
import { SkeletonCard } from '../../components/Skeleton.jsx'
import { getToken } from '../../context/authStorage.js'

const usePropertyVerifications = () => {
    const [props, setProps] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)

    useEffect(() => {
        let active = true
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/property-verifications`, { headers: { Authorization: `Bearer ${getToken()}` } })
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok')
                return res.json()
            })
            .then(json => {
                if (active) setProps(json.data || json)
            })
            .catch(err => {
                if (active) setFetchError(err.message || 'Failed to load property verifications')
            })
            .finally(() => {
                if (active) setIsLoading(false)
            })
        return () => { active = false }
    }, [])
    return { props, isLoading, fetchError, setProps }
}

const TABS = ['Pending', 'Approved', 'Rejected', 'All']

export default function PropertyVerification() {
    const { props: propsList, isLoading, fetchError, setProps: setPropsList } = usePropertyVerifications()
    const [tab, setTab] = useState('Pending')
    const [selectedProp, setSelectedProp] = useState(null)
    const [toastMessage, setToastMessage] = useState('')
    const filtered = tab === 'All' ? propsList : propsList.filter(p => p.status.toLowerCase() === tab.toLowerCase())
    const handleAction = (id, newStatus) => {
        setPropsList(propsList.map(p => p.id === id ? { ...p, status: newStatus } : p))
        setToastMessage(`Property ${newStatus.toLowerCase()} successfully.`)
        setTimeout(() => setToastMessage(''), 3000); setSelectedProp(null)
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header"><div><span className="admin-page-kicker"><BadgeCheck size={14} /> PROPERTY AUDIT</span><h1 className="admin-page-title">Property Verification</h1><p className="admin-page-subtitle">Review submitted property documents, images, and owner identities before live publishing.</p></div></div>
            {toastMessage && <div className="admin-toast-banner"><CheckCircle2 size={16} /> {toastMessage}</div>}
            <div className="owner-tabs">{TABS.map(t => <button key={t} className={`owner-tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t} ({t === 'All' ? propsList.length : propsList.filter(p => p.status.toLowerCase() === t.toLowerCase()).length})</button>)}</div>
            {isLoading && <div className="admin-explore-grid">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>}
            {fetchError && !isLoading && <div className="admin-error-banner"><AlertTriangle size={18} /> {fetchError}</div>}
            {!isLoading && !fetchError && filtered.length === 0 && <div className="empty-state"><BadgeCheck size={42} /><h3>No properties in {tab.toLowerCase()} status</h3><p>All property verification requests have been processed.</p></div>}
            {!isLoading && !fetchError && filtered.length > 0 && <div className="admin-explore-grid">{filtered.map(prop => (
                <motion.article key={prop.id} className="admin-verification-card 3d-tilt-card" whileHover={{ y: -4 }}><div className="admin-verif-image-row"><img src={prop.image} alt={prop.name} /><span className={`status-badge ${prop.status === 'Approved' ? 'active' : prop.status === 'Rejected' ? 'status-available' : 'pending'}`}>{prop.status}</span></div><div className="admin-verif-body"><h3>{prop.name}</h3><p className="muted-copy"><MapPin size={13} /> {prop.location}</p><div className="admin-verif-meta"><div><span>Owner</span><strong>{prop.owner}</strong></div><div><span>Submitted</span><strong>{prop.submittedDate}</strong></div><div><span>Type</span><strong>{prop.type}</strong></div><div><span>Price</span><strong>{prop.price}</strong></div></div><div className="admin-verif-actions"><button className="ghost-button compact-button" onClick={() => setSelectedProp(prop)}><Eye size={14} /> Review Details</button>{prop.status === 'Pending' && <><button className="primary-button compact-button" onClick={() => handleAction(prop.id, 'Approved')}><Check size={14} /> Approve</button><button className="ghost-button compact-button danger-button" onClick={() => handleAction(prop.id, 'Rejected')}><X size={14} /> Reject</button></>}</div></div></motion.article>
            ))}</div>}
            <AnimatePresence>{selectedProp && <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProp(null)}><motion.div className="modal-content" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}><button className="close-modal-btn" onClick={() => setSelectedProp(null)}><X size={18} /></button><h2>Verification Audit: {selectedProp.name}</h2><p className="muted-copy">Submitted by {selectedProp.owner} on {selectedProp.submittedDate}</p><div className="admin-checklist-card"><h4>Verification Checklist</h4><div className="admin-checklist-grid"><div className={`check-item ${selectedProp.checklist.ownerId ? 'done' : ''}`}><CheckCircle2 size={16} /> Owner Identity (Aadhaar / PAN)</div><div className={`check-item ${selectedProp.checklist.address ? 'done' : ''}`}><CheckCircle2 size={16} /> Property Address Verification</div><div className={`check-item ${selectedProp.checklist.images ? 'done' : ''}`}><CheckCircle2 size={16} /> Property Images Authenticity</div><div className={`check-item ${selectedProp.checklist.details ? 'done' : ''}`}><CheckCircle2 size={16} /> Property Details & Amenities</div><div className={`check-item ${selectedProp.checklist.roomDetails ? 'done' : ''}`}><CheckCircle2 size={16} /> Room & Bed Layout</div><div className={`check-item ${selectedProp.checklist.contactInfo ? 'done' : ''}`}><CheckCircle2 size={16} /> Contact Information & Ownership Proof</div></div></div><div className="form-actions"><button className="ghost-button compact-button" onClick={() => alert('Changes requested from owner.')}>Request Changes</button><div><button className="ghost-button compact-button danger-button" onClick={() => handleAction(selectedProp.id, 'Rejected')}>REJECT</button><button className="primary-button compact-button" onClick={() => handleAction(selectedProp.id, 'Approved')}>APPROVE PROPERTY</button></div></div></motion.div></motion.div>}</AnimatePresence>
        </div>
    )
}
