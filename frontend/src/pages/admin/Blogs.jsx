import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Plus, Edit3, Trash2, Eye } from 'lucide-react'
import { getToken } from '../../context/authStorage.js'

export default function Blogs() {
  const navigate = useNavigate()
  const [blogs, setBlogs] = useState([])
  useEffect(() => { fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/blogs`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(response => response.json()).then(result => setBlogs(result.data || [])) }, [])

  const remove = (id) => setBlogs(blogs.filter(b => b.id !== id))

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Blog Management</h1>
          <p className="admin-page-subtitle">Publish content, guides, and SEO articles for Nestora.</p>
        </div>
        <button className="primary-button compact-button" onClick={() => navigate('/admin/blogs/create')}>
          <Plus size={16} /> Create Article
        </button>
      </div>

      <div className="owner-table-wrapper">
        <table className="owner-data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Published Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map(b => (
              <tr key={b.id}>
                <td><strong>{b.title}</strong></td>
                <td><span className="r-amenity-tag">{b.category}</span></td>
                <td>{b.date}</td>
                <td><span className={`status-badge ${b.status === 'Published' ? 'active' : 'pending'}`}>{b.status}</span></td>
                <td>
                  <div className="table-actions">
                    <button className="r-icon-btn" title="Edit" onClick={() => navigate(`/admin/blogs/${b.id}/edit`)}>
                      <Edit3 size={15} />
                    </button>
                    <button className="r-icon-btn" title="Delete" onClick={() => remove(b.id)}>
                      <Trash2 size={15} color="var(--terracotta)" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
