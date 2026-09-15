import { useEffect, useState } from 'react'
import { Plus, Coffee, Edit3, Copy } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function Food() {
  const [menu, setMenu] = useState({})
  useEffect(() => {
    apiRequest('/owner/menu').then(response => setMenu(Object.fromEntries((response.data || []).map(item => [item.day, item]))))
  }, [])

  const editDay = async (day) => {
    const current = menu[day] || {}
    const breakfast = window.prompt('Breakfast', current.breakfast || '')
    const lunch = window.prompt('Lunch', current.lunch || '')
    const dinner = window.prompt('Dinner', current.dinner || '')
    if (breakfast === null || lunch === null || dinner === null) return
    const response = await apiRequest('/owner/menu', { method: 'PUT', body: JSON.stringify({ day, breakfast, lunch, dinner }) })
    setMenu(previous => ({ ...previous, [day]: response.data }))
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Food & Menu</h1>
          <p className="owner-subtitle">Manage weekly meal plans for your properties.</p>
        </div>
        <button className="primary-button"><Copy size={16}/> Copy Previous Week</button>
      </div>

      <div className="owner-property-grid" style={{gridTemplateColumns: '1fr 1fr 1fr'}}>
        {days.map(day => (
          <div key={day} className="owner-stat-card 3d-tilt-card" style={{flexDirection: 'column', alignItems: 'stretch', gap: '0'}}>
             <div className="flex justify-between" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
               <h3 style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Coffee size={18} className="text-muted"/> {day}</h3>
               <button className="icon-btn text-muted" onClick={() => editDay(day)}><Edit3 size={16}/></button>
             </div>
             
             {menu[day] ? (
               <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                 <div style={{background: 'var(--paper-2)', padding: '10px 12px', borderRadius: 'var(--radius)'}}>
                   <span style={{display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', marginBottom: '4px'}}>BREAKFAST</span>
                   <span style={{fontSize: '0.9rem', fontWeight: 600}}>{menu[day].breakfast}</span>
                 </div>
                 <div style={{background: 'var(--paper-2)', padding: '10px 12px', borderRadius: 'var(--radius)'}}>
                   <span style={{display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', marginBottom: '4px'}}>LUNCH</span>
                   <span style={{fontSize: '0.9rem', fontWeight: 600}}>{menu[day].lunch}</span>
                 </div>
                 <div style={{background: 'var(--paper-2)', padding: '10px 12px', borderRadius: 'var(--radius)'}}>
                   <span style={{display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', marginBottom: '4px'}}>DINNER</span>
                   <span style={{fontSize: '0.9rem', fontWeight: 600}}>{menu[day].dinner}</span>
                 </div>
               </div>
             ) : (
               <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', border: '1px dashed var(--line)', borderRadius: 'var(--radius)'}}>
                 <button className="ghost-button compact-button" onClick={() => editDay(day)}><Plus size={16}/> Add Meals</button>
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  )
}
