import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, FileText, Upload } from 'lucide-react'

export default function BlogEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    title: isEdit ? 'Top 10 Co-Living Spaces in Ahmedabad' : '',
    category: 'Guides',
    description: '',
    content: '',
    status: 'Published'
  })

  const submit = (e) => {
    e.preventDefault()
    alert(`Article ${isEdit ? 'updated' : 'published'} successfully.`)
    navigate('/admin/blogs')
  }

  return (
    <div className="admin-page" style={{ maxWidth: '800px' }}>
      <Link to="/admin/blogs" className="r-back-link"><ChevronLeft size={18} /> Back to Blogs</Link>

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{isEdit ? 'Edit Blog Article' : 'Create New Article'}</h1>
          <p className="admin-page-subtitle">Publish SEO optimized guides and stories for the Nestora community.</p>
        </div>
      </div>

      <form className="admin-pane" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-field">
          <label>Article Title *</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Enter article headline" required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-field">
            <label>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option>Guides</option><option>Owner Insights</option><option>Trends</option><option>Co-Living</option>
            </select>
          </div>
          <div className="form-field">
            <label>Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option>Published</option><option>Draft</option>
            </select>
          </div>
        </div>

        <div className="form-field">
          <label>Summary / Excerpt</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief summary..." rows={2} />
        </div>

        <div className="form-field">
          <label>Full Content (Markdown / HTML) *</label>
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write full article body..." rows={8} required />
        </div>

        <div className="form-actions" style={{ marginTop: '12px' }}>
          <button className="ghost-button compact-button" type="button" onClick={() => navigate('/admin/blogs')}>Cancel</button>
          <button className="primary-button compact-button" type="submit">
            {isEdit ? 'Save Changes' : 'Publish Article'}
          </button>
        </div>
      </form>
    </div>
  )
}
