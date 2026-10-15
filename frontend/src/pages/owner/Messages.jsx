import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCheck,
  CircleHelp,
  LoaderCircle,
  MessageSquare,
  Send,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth.js'
import { getToken } from '../../context/authStorage.js'
import { apiRequest } from '../../services/api.js'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

const appendUnique = (current, incoming) => {
  const known = new Set(current.map((message) => String(message._id)))
  return [...current, ...incoming.filter((message) => !known.has(String(message._id)))]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

export default function OwnerMessages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState('')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [messageError, setMessageError] = useState('')
  const [socketState, setSocketState] = useState(() => getToken() ? 'connecting' : 'unavailable')
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const messageEndRef = useRef(null)
  const activeIdRef = useRef(activeId)

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) || null,
    [activeId, conversations],
  )

  const loadConversations = useCallback(async () => {
    try {
      const response = await apiRequest('/chat/conversations')
      const nextConversations = response.data || []
      setError('')
      setConversations(nextConversations)
      if (!activeIdRef.current && nextConversations.length) {
        const firstId = nextConversations[0].id
        activeIdRef.current = firstId
        setActiveId(firstId)
        setLoadingMessages(true)
      } else if (activeIdRef.current && !nextConversations.some((item) => item.id === activeIdRef.current)) {
        activeIdRef.current = ''
        setActiveId('')
        setMessages([])
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to load resident conversations.')
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  const loadMessages = useCallback(async (conversationId, showLoading = true) => {
    if (!conversationId) return
    try {
      const response = await apiRequest(`/chat/conversations/${conversationId}/messages`)
      if (activeIdRef.current === conversationId) {
        setMessageError('')
        setMessages(response.data || [])
        setConversations((current) => current.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
        ))
      }
    } catch (requestError) {
      if (activeIdRef.current === conversationId) {
        setMessageError(requestError.message || 'Unable to load this conversation.')
      }
    } finally {
      if (showLoading && activeIdRef.current === conversationId) setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    activeIdRef.current = activeId
    // The API request synchronizes the selected conversation with persisted messages.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeId) loadMessages(activeId)
  }, [activeId, loadMessages])

  useEffect(() => {
    // Initial inbox data is loaded asynchronously from the authenticated API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    const token = getToken()
    if (!token) return undefined

    const socket = io(BACKEND_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 700,
      reconnectionDelayMax: 5000,
    })
    socket.on('connect', () => {
      setSocketState('connected')
      loadConversations()
      if (activeIdRef.current) loadMessages(activeIdRef.current, false)
    })
    socket.on('disconnect', () => {
      if (socket.active) setSocketState('reconnecting')
    })
    socket.on('connect_error', (connectionError) => {
      if (/authentication required|invalid authentication token|account is inactive/i.test(connectionError.message)) {
        setSocketState('unavailable')
        socket.disconnect()
      } else {
        setSocketState('reconnecting')
      }
    })
    socket.on('chat:message', (message) => {
      const conversationId = String(message.conversationId)
      if (activeIdRef.current === conversationId) {
        setMessages((current) => appendUnique(current, [message]))
        if (Number(message.senderId) !== Number(user?.userId)) {
          loadMessages(conversationId, false)
        }
      }
      loadConversations()
    })
    socket.on('chat:conversation-updated', (updated) => {
      setConversations((current) => current.map((conversation) =>
        conversation.id === String(updated._id)
          ? { ...conversation, ...updated, id: String(updated._id) }
          : conversation
      ))
    })
    socket.on('chat:conversation-state', (updated) => {
      setConversations((current) => current.map((conversation) =>
        conversation.id === String(updated._id)
          ? { ...conversation, ...updated, id: String(updated._id) }
          : conversation
      ))
    })
    socket.on('chat:read', ({ conversationId, readerId, messageIds }) => {
      if (activeIdRef.current !== conversationId) return
      const readSet = new Set(messageIds.map(String))
      setMessages((current) => current.map((message) =>
        readSet.has(String(message._id))
          ? { ...message, readBy: [...new Set([...(message.readBy || []), Number(readerId)])] }
          : message
      ))
    })
    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [loadConversations, loadMessages, user?.userId])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const chooseConversation = (conversationId) => {
    activeIdRef.current = conversationId
    setActiveId(conversationId)
    setMessages([])
    setLoadingMessages(true)
    setMessageError('')
    setMobileChatOpen(true)
  }

  const retryMessages = () => {
    if (!activeConversation) return
    setMessageError('')
    setLoadingMessages(true)
    loadMessages(activeConversation.id)
  }

  const send = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !activeConversation || sending) return
    setSending(true)
    setMessageError('')
    try {
      const response = await apiRequest(`/chat/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, clientMessageId: crypto.randomUUID() }),
      })
      setMessages((current) => appendUnique(current, response.data || []))
      setConversations((current) => current.map((conversation) =>
        conversation.id === activeConversation.id
          ? { ...conversation, ...response.conversation }
          : conversation
      ))
      setDraft('')
      await loadConversations()
    } catch (requestError) {
      setMessageError(requestError.message || 'Your message was not sent. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="owner-page owner-messages-page">
      <div className="owner-page-header owner-messages-heading">
        <div>
          <h1 className="owner-greeting">Messages</h1>
          <p className="owner-subtitle">Reply to residents who have contacted you about your properties.</p>
        </div>
        <div className={`r-messages-connection ${socketState}`}>
          <span />
          {socketState === 'connected'
            ? 'Live connection'
            : socketState === 'connecting'
              ? 'Connecting…'
              : socketState === 'unavailable'
                ? 'Live updates unavailable'
                : 'Reconnecting…'}
        </div>
      </div>

      {error && (
        <div className="r-messages-alert" role="alert">
          <CircleHelp size={17} />
          <span>{error}</span>
          <button type="button" onClick={loadConversations}>Retry</button>
        </div>
      )}

      <div className="r-chat-shell owner-chat-shell">
        <aside className={`r-chat-sidebar ${mobileChatOpen ? 'mobile-hidden' : ''}`} aria-label="Resident conversations">
          <div className="r-chat-sidebar-heading owner-chat-sidebar-heading">
            <div>
              <h2>Resident conversations</h2>
              <p>Messages are saved to your account.</p>
            </div>
          </div>
          {loadingConversations ? (
            <div className="r-chat-sidebar-loading">
              <LoaderCircle size={19} className="r-chat-spin" /> Loading conversations…
            </div>
          ) : conversations.length ? (
            <div className="r-chat-conversation-list">
              {conversations.map((conversation) => (
                <button
                  type="button"
                  key={conversation.id}
                  className={`r-chat-conversation ${activeId === conversation.id ? 'active' : ''}`}
                  onClick={() => chooseConversation(conversation.id)}
                >
                  <span className="r-chat-avatar owner"><UserRound size={18} /></span>
                  <span className="r-chat-conversation-copy">
                    <span className="r-chat-conversation-top">
                      <strong>{conversation.title || 'Resident'}</strong>
                      <time>{formatTime(conversation.lastMessageAt)}</time>
                    </span>
                    <span className="r-chat-conversation-preview">
                      {conversation.lastMessageText || 'No messages yet'}
                    </span>
                    <span className="r-chat-conversation-bottom">
                      <small>{conversation.subtitle || 'Your property'}</small>
                      {conversation.unreadCount > 0 && (
                        <span className="r-chat-unread" aria-label={`${conversation.unreadCount} unread messages`}>
                          {conversation.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="r-chat-empty-list owner-chat-empty">
              <MessageSquare size={26} />
              <p>No resident messages yet.</p>
              <small>When a resident contacts you from one of your properties, the conversation will appear here.</small>
            </div>
          )}
        </aside>

        <section className={`r-chat-panel ${mobileChatOpen ? 'mobile-visible' : ''}`} aria-label="Selected resident conversation">
          {activeConversation ? (
            <>
              <header className="r-chat-header">
                <button
                  type="button"
                  className="r-chat-back"
                  onClick={() => setMobileChatOpen(false)}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={19} />
                </button>
                <span className="r-chat-avatar owner"><UserRound size={18} /></span>
                <div className="r-chat-header-copy">
                  <h2>{activeConversation.title || 'Resident'}</h2>
                  <p><Building2 size={13} /> {activeConversation.subtitle || 'Your property'}</p>
                </div>
              </header>

              <div className="r-chat-messages" aria-live="polite" aria-relevant="additions text">
                {loadingMessages ? (
                  <div className="r-chat-loading"><LoaderCircle size={20} className="r-chat-spin" /> Loading messages…</div>
                ) : messageError && messages.length === 0 ? (
                  <div className="r-chat-error">
                    <CircleHelp size={24} />
                    <p>{messageError}</p>
                    <button type="button" onClick={retryMessages}>Try again</button>
                  </div>
                ) : messages.length ? (
                  messages.map((message) => {
                    const own = Number(message.senderId) === Number(user?.userId)
                    const read = !own || (message.readBy || []).some((readerId) => Number(readerId) !== Number(user?.userId))
                    return (
                      <article className={`r-chat-message-row ${own ? 'own' : 'other'}`} key={message._id}>
                        {!own && (
                          <span className="r-chat-message-avatar human"><UserRound size={15} /></span>
                        )}
                        <div className="r-chat-message-group">
                          {!own && <span className="r-chat-sender">{activeConversation.title || 'Resident'}</span>}
                          <div className={`r-chat-bubble ${own ? 'sent' : 'received'}`}>
                            <p>{message.content}</p>
                          </div>
                          <div className="r-chat-message-meta">
                            <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                            {own && (read
                              ? <CheckCheck size={14} aria-label="Read by resident" />
                              : <Check size={14} aria-label="Sent" />)}
                          </div>
                        </div>
                      </article>
                    )
                  })
                ) : (
                  <div className="r-chat-empty-thread">
                    <span><MessageSquare size={27} /></span>
                    <h3>Conversation started</h3>
                    <p>Send a reply to continue the conversation.</p>
                  </div>
                )}
                <div ref={messageEndRef} />
              </div>

              {messageError && messages.length > 0 && (
                <div className="r-chat-inline-error" role="alert">{messageError}</div>
              )}
              <form className="r-chat-composer" onSubmit={send}>
                <label className="sr-only" htmlFor="owner-chat-message">Write a reply</label>
                <textarea
                  id="owner-chat-message"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value)
                    setMessageError('')
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      send(event)
                    }
                  }}
                  placeholder={sending ? 'Sending…' : 'Write a reply…'}
                  maxLength={1000}
                  rows={1}
                  disabled={sending || loadingMessages}
                />
                <span className="r-chat-char-count">{draft.length}/1000</span>
                <button type="submit" disabled={!draft.trim() || sending || loadingMessages} aria-label="Send reply">
                  {sending ? <LoaderCircle size={18} className="r-chat-spin" /> : <Send size={18} />}
                </button>
              </form>
            </>
          ) : (
            <div className="r-chat-no-selection">
              <span><MessageSquare size={30} /></span>
              <h2>Select a conversation</h2>
              <p>Choose a resident conversation to read and reply.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
