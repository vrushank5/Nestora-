import { useState } from 'react'
import { HelpCircle, Search, ChevronDown, ChevronUp, MessageSquare, Phone, AlertCircle } from 'lucide-react'

const faqs = [
  { q: 'How do I book a PG on Nestora?', a: 'Browse properties from the Explore section, select a room, and submit a booking request. The owner will confirm within 24 hours.' },
  { q: 'Can I cancel my booking?', a: 'Yes, you can cancel from the Bookings page as long as your booking status is Upcoming. Cancellation policies vary by property.' },
  { q: 'How do I pay my rent?', a: 'Go to the Payments section and use UPI, card, or net banking to pay your monthly rent. You can download invoices for each payment.' },
  { q: 'How do I raise a complaint?', a: 'Visit the Complaints section, click "New Complaint", fill in the details, and submit. You can track the resolution status in real time.' },
  { q: 'Can I schedule a property visit before booking?', a: 'Absolutely! From any property detail page, click "Schedule Visit" to request a time slot with the owner.' },
  { q: 'How does property verification work?', a: 'All properties on Nestora are physically verified by our team. Verified properties show a green shield badge.' },
]

export default function Help() {
  const [search, setSearch] = useState('')
  const [openIdx, setOpenIdx] = useState(null)

  const filtered = faqs.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="r-page" style={{ maxWidth: '820px' }}>
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">Help & Support</h1>
          <p className="r-page-subtitle">Find answers to common questions or contact our team.</p>
        </div>
      </div>

      {/* Search FAQ */}
      <div className="r-smart-search" style={{ marginBottom: '32px' }}>
        <div className="r-search-inner">
          <Search size={18} />
          <input placeholder="How can we help you? Search FAQs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* FAQs */}
      <h3 style={{ marginBottom: '16px' }}>Frequently Asked Questions</h3>
      {filtered.length === 0 ? (
        <div className="empty-state"><HelpCircle size={36} /><h3>No results found</h3><p>Try a different search term.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          {filtered.map((f, i) => (
            <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--white)', overflow: 'hidden' }}>
              <button style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'none', fontWeight: 700, textAlign: 'left' }} onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                <span>{f.q}</span>
                {openIdx === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {openIdx === i && (
                <div style={{ padding: '0 20px 16px', color: 'var(--muted)', lineHeight: 1.65, fontSize: '0.92rem' }}>{f.a}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contact Section */}
      <h3 style={{ marginBottom: '16px' }}>Still need help?</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {[
          { icon: MessageSquare, title: 'Live Chat', desc: 'Chat with our support team in real time.', btn: 'Start Chat' },
          { icon: Phone, title: 'Call Support', desc: 'Mon–Sat, 9 AM – 6 PM: 1800-XXX-XXXX', btn: 'Call Now' },
          { icon: AlertCircle, title: 'Report Problem', desc: 'Report a technical issue or policy violation.', btn: 'Report' },
        ].map(c => (
          <div key={c.title} className="r-pane" style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--sky)', color: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <c.icon size={22} />
            </div>
            <h4 style={{ marginBottom: '6px' }}>{c.title}</h4>
            <p className="muted-copy" style={{ fontSize: '0.85rem', marginBottom: '14px' }}>{c.desc}</p>
            <button className="ghost-button compact-button">{c.btn}</button>
          </div>
        ))}
      </div>
    </div>
  )
}
