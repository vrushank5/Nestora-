import { useEffect, useState } from 'react'
import { Coffee, Copy, Edit3, Plus, X } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const emptyMeals = { breakfast: '', lunch: '', dinner: '' }

export default function Food() {
  const [menu, setMenu] = useState({})
  const [selectedDay, setSelectedDay] = useState('')
  const [form, setForm] = useState(emptyMeals)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await apiRequest('/owner/menu')
        if (!active) return
        setMenu(Object.fromEntries((response.data || []).map((item) => [item.day, item])))
      } catch (err) {
        if (active) setError(err.message || 'Unable to load menu.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const openEditor = (day) => {
    const current = menu[day] || emptyMeals
    setSelectedDay(day)
    setForm({
      breakfast: current.breakfast || '',
      lunch: current.lunch || '',
      dinner: current.dinner || '',
    })
    setError('')
    setSuccess('')
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const closeEditor = () => {
    setSelectedDay('')
    setForm(emptyMeals)
  }

  const saveDay = async (event) => {
    event.preventDefault()

    if (!selectedDay) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const response = await apiRequest('/owner/menu', {
        method: 'PUT',
        body: JSON.stringify({
          day: selectedDay,
          breakfast: form.breakfast.trim(),
          lunch: form.lunch.trim(),
          dinner: form.dinner.trim(),
        }),
      })
      setMenu((previous) => ({ ...previous, [selectedDay]: response.data }))
      setSuccess(`${selectedDay} menu saved.`)
      closeEditor()
    } catch (err) {
      setError(err.message || 'Unable to save menu.')
    } finally {
      setSaving(false)
    }
  }

  const copyPreviousWeek = async () => {
    const firstFilledDay = days.find((day) => {
      const meals = menu[day]
      return meals?.breakfast || meals?.lunch || meals?.dinner
    })

    if (!firstFilledDay) {
      setError('Add meals for at least one day before copying.')
      setSuccess('')
      return
    }

    const source = menu[firstFilledDay]

    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const updates = await Promise.all(days.map((day) => {
        const current = menu[day] || {}
        const payload = {
          day,
          breakfast: current.breakfast || source.breakfast || '',
          lunch: current.lunch || source.lunch || '',
          dinner: current.dinner || source.dinner || '',
        }
        return apiRequest('/owner/menu', {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      }))

      setMenu(Object.fromEntries(updates.map((response) => [response.data.day, response.data])))
      setSuccess(`Copied ${firstFilledDay} meals into empty menu slots.`)
    } catch (err) {
      setError(err.message || 'Unable to copy menu.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="owner-page">
      <div className="owner-page-header">
        <div>
          <h1 className="owner-greeting">Food & Menu</h1>
          <p className="owner-subtitle">Manage weekly meal plans for your properties.</p>
        </div>
        <button className="primary-button" type="button" onClick={copyPreviousWeek} disabled={saving}>
          <Copy size={16} /> Copy Previous Week
        </button>
      </div>

      {success && (
        <div className="owner-error-banner" style={{ background: 'var(--sky)', color: 'var(--jade)', borderColor: 'var(--jade)' }}>
          <span>{success}</span>
        </div>
      )}

      {error && !selectedDay && (
        <div className="owner-error-banner">
          <span>{error}</span>
        </div>
      )}

      <div className="owner-property-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {days.map((day) => (
          <div key={day} className="owner-stat-card 3d-tilt-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
            <div className="flex justify-between" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Coffee size={18} className="text-muted" /> {day}</h3>
              <button className="icon-btn text-muted" type="button" onClick={() => openEditor(day)}>
                <Edit3 size={16} />
              </button>
            </div>

            {menu[day] ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <MealBlock label="Breakfast" value={menu[day].breakfast} />
                <MealBlock label="Lunch" value={menu[day].lunch} />
                <MealBlock label="Dinner" value={menu[day].dinner} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', border: '1px dashed var(--line)', borderRadius: 'var(--radius)' }}>
                <button className="ghost-button compact-button" type="button" onClick={() => openEditor(day)}>
                  <Plus size={16} /> Add Meals
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
          <h3>Loading menu...</h3>
        </div>
      )}

      {selectedDay && (
        <div className="modal-overlay" onClick={closeEditor}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(event) => event.stopPropagation()}>
            <button className="close-modal-btn" type="button" onClick={closeEditor}>
              <X size={18} />
            </button>
            <h2>{selectedDay} Menu</h2>
            <p className="muted-copy">Update meals for this day.</p>

            {error && (
              <p className="form-status form-status-error">{error}</p>
            )}

            <form onSubmit={saveDay}>
              <div className="form-field">
                <label>Breakfast</label>
                <input value={form.breakfast} onChange={(event) => updateForm('breakfast', event.target.value)} placeholder="Eg. Poha, tea, fruit" />
              </div>

              <div className="form-field">
                <label>Lunch</label>
                <input value={form.lunch} onChange={(event) => updateForm('lunch', event.target.value)} placeholder="Eg. Roti, dal, rice, sabzi" />
              </div>

              <div className="form-field">
                <label>Dinner</label>
                <input value={form.dinner} onChange={(event) => updateForm('dinner', event.target.value)} placeholder="Eg. Khichdi, kadhi, salad" />
              </div>

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button className="ghost-button compact-button" type="button" onClick={closeEditor}>
                  Cancel
                </button>
                <button className="primary-button compact-button" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MealBlock({ label, value }) {
  return (
    <div style={{ background: 'var(--paper-2)', padding: '10px 12px', borderRadius: 'var(--radius)' }}>
      <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', marginBottom: '4px' }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{value || 'Not set'}</span>
    </div>
  )
}
