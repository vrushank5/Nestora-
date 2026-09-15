import { useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'

const initChats = [
  { id: 'r1', name: 'Nestora Heights Host', property: 'Nestora Heights', messages: [{ sender: 'host', text: 'Welcome! Feel free to ask anything about availability.', time: '10:30 AM' }] },
  { id: 'r2', name: 'Nestora Support', property: 'General Support', messages: [{ sender: 'host', text: 'Hi! How can we help you today?', time: 'Yesterday' }] },
]

export default function Messages() {
  const [rooms, setRooms] = useState(initChats)
  const [activeId, setActiveId] = useState('r1')
  const [msg, setMsg] = useState('')

  const activeRoom = rooms.find(r => r.id === activeId)

  const send = () => {
    if (!msg.trim()) return
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setRooms(rooms.map(r => r.id === activeId ? { ...r, messages: [...r.messages, { sender: 'user', text: msg.trim(), time }] } : r))
    setMsg('')
  }

  return (
    <div className="r-page">
      <div className="r-page-header">
        <div>
          <h1 className="r-page-title">Messages</h1>
          <p className="r-page-subtitle">Communicate professionally with property owners and support.</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-inbox">
          {rooms.map(r => (
            <button key={r.id} className={`chat-user-item ${activeId === r.id ? 'active' : ''}`} onClick={() => setActiveId(r.id)}>
              <span className="chat-avatar">{r.name.charAt(0)}</span>
              <span className="chat-user-info">
                <strong>{r.name}</strong>
                <small>{r.property}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="chat-screen">
          {activeRoom ? (
            <>
              <div className="chat-header">
                <h4>{activeRoom.name}</h4>
                <span>{activeRoom.property}</span>
              </div>
              <div className="chat-messages">
                {activeRoom.messages.map((m, i) => (
                  <div key={i} className={`chat-bubble ${m.sender === 'user' ? 'sent' : 'received'}`}>
                    <p>{m.text}</p>
                    <span>{m.time}</span>
                  </div>
                ))}
              </div>
              <div className="chat-input-row">
                <input value={msg} placeholder="Type a professional message..." onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
                <button onClick={send} aria-label="Send"><Send size={18} /></button>
              </div>
            </>
          ) : (
            <div className="empty-state"><MessageSquare size={42} /><h3>No conversation selected</h3></div>
          )}
        </div>
      </div>
    </div>
  )
}
