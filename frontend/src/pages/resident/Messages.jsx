import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import {
  ArrowLeft,
  Bot,
  Building2,
  Check,
  CheckCheck,
  CircleHelp,
  Headset,
  LoaderCircle,
  MessageSquare,
  Send,
  ShieldCheck,
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

const conversationIcon = (type) => {
  if (type === 'assistant') return <Bot size={18} />
  if (type === 'support') return <Headset size={18} />
  return <Building2 size={18} />
}

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [ownerOptions, setOwnerOptions] = useState([])
  const [activeId, setActiveId] = useState('')
  const [messages, setMessages] = useState([])
  const [hasOlderMessages, setHasOlderMessages] = useState(false)
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false)
  const [draft, setDraft] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [messageError, setMessageError] = useState('')
  const [socketState, setSocketState] = useState(() => getToken() ? 'connecting' : 'unavailable')
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const messageEndRef = useRef(null)
  const shouldScrollToBottomRef = useRef(true)
  const activeIdRef = useRef(activeId)
  const socketRef = useRef(null)

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) || null,
    [activeId, conversations],
  )

  const loadConversations = useCallback(async (selectFirst = true) => {
    try {
      const response = await apiRequest('/chat/conversations')
      const nextConversations = response.data || []
      setError('')
      setConversations(nextConversations)
      setOwnerOptions(response.ownerOptions || [])
      if (selectFirst && !activeIdRef.current && nextConversations.length) {
        setActiveId(nextConversations[0].id)
        activeIdRef.current = nextConversations[0].id
        setLoadingMessages(true)
      }
    } catch (err) {
      setError(err.message || 'Unable to load your conversations.')
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
        setHasOlderMessages(Boolean(response.hasMore))
        setConversations((current) => current.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
        ))
      }
    } catch (err) {
      if (activeIdRef.current === conversationId) {
        setMessageError(err.message || 'Unable to load this conversation.')
      }
    } finally {
      if (showLoading && activeIdRef.current === conversationId) setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    activeIdRef.current = activeId
    // Fetching remote messages is a state-synchronizing effect; updates occur after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeId) loadMessages(activeId)
  }, [activeId, loadMessages])

  useEffect(() => {
    // Initial conversation loading updates state only after the API request resolves.
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
    socketRef.current = socket
    socket.on('connect', () => {
      setSocketState('connected')
      loadConversations(false)
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
      loadConversations(false)
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
      socketRef.current = null
    }
  }, [loadConversations, loadMessages, user?.userId])

  useEffect(() => {
    if (shouldScrollToBottomRef.current) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
    shouldScrollToBottomRef.current = true
  }, [messages])

  const chooseConversation = (conversationId) => {
    setActiveId(conversationId)
    activeIdRef.current = conversationId
    setMessages([])
    setHasOlderMessages(false)
    setLoadingOlderMessages(false)
    setLoadingMessages(true)
    setMobileChatOpen(true)
    setMessageError('')
  }

  const retryMessages = () => {
    setMessageError('')
    setLoadingMessages(true)
    loadMessages(activeConversation.id)
  }

  const loadOlderMessages = async () => {
    if (!activeConversation || !messages.length || loadingOlderMessages) return
    setLoadingOlderMessages(true)
    setMessageError('')
    try {
      const before = encodeURIComponent(messages[0]._id)
      const response = await apiRequest(
        `/chat/conversations/${activeConversation.id}/messages?limit=50&before=${before}`,
      )
      shouldScrollToBottomRef.current = false
      setMessages((current) => appendUnique(current, response.data || []))
      setHasOlderMessages(Boolean(response.hasMore))
    } catch (err) {
      setMessageError(err.message || 'Unable to load older messages.')
    } finally {
      setLoadingOlderMessages(false)
    }
  }

  const createConversation = async (endpoint, body = {}) => {
    setStarting(true)
    setMessageError('')
    try {
      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      await loadConversations(false)
      chooseConversation(response.data.id)
    } catch (err) {
      setError(err.message || 'Unable to start this conversation.')
    } finally {
      setStarting(false)
    }
  }

  const requestHandoff = async () => {
    if (!activeConversation) return
    setStarting(true)
    setMessageError('')
    try {
      const response = await apiRequest(`/chat/conversations/${activeConversation.id}/handoff`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      setConversations((current) => current.map((conversation) =>
        conversation.id === activeConversation.id
          ? { ...conversation, ...response.data }
          : conversation
      ))
      setMessageError('')
      await loadConversations(false)
    } catch (err) {
      setMessageError(err.message || 'Unable to contact support.')
    } finally {
      setStarting(false)
    }
  }

  const send = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !activeConversation || sending) return
    if (content.length > 1000) {
      setMessageError('Messages can be up to 1000 characters.')
      return
    }
    setSending(true)
    setMessageError('')
    try {
      const response = await apiRequest(`/chat/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          clientMessageId: crypto.randomUUID(),
        }),
      })
      setMessages((current) => appendUnique(current, response.data || []))
      setConversations((current) => current.map((conversation) =>
        conversation.id === activeConversation.id
          ? { ...conversation, ...response.conversation }
          : conversation
      ))
      setDraft('')
      await loadConversations(false)
    } catch (err) {
      setMessageError(err.message || 'Your message was not sent. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const isAssistant = activeConversation?.type === 'assistant'
  const showHandoff = activeConversation && activeConversation.status === 'bot'

  return (
    <div className="r-page r-messages-page">
      <div className="r-page-header r-messages-page-heading">
        <div>
          <span className="r-messages-eyebrow">HERE TO HELP</span>
          <h1 className="r-page-title">Messages</h1>
          <p className="r-page-subtitle">Chat with the Nestora Assistant or reach a property owner.</p>
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
          <CircleHelp size={17} /> <span>{error}</span>
          <button type="button" onClick={() => loadConversations()}>Retry</button>
        </div>
      )}

      <div className="r-chat-shell">
        <aside className={`r-chat-sidebar ${mobileChatOpen ? 'mobile-hidden' : ''}`} aria-label="Conversations">
          <div className="r-chat-sidebar-heading">
            <div>
              <h2>Your conversations</h2>
              <p>Messages stay saved to your account.</p>
            </div>
            <button
              type="button"
              className="r-chat-support-button"
              onClick={() => createConversation('/chat/conversations/support')}
              disabled={starting}
            >
              <Headset size={16} /> Support
            </button>
          </div>

          {loadingConversations ? (
            <div className="r-chat-sidebar-loading"><LoaderCircle size={19} className="r-chat-spin" /> Loading chats…</div>
          ) : conversations.length ? (
            <div className="r-chat-conversation-list">
              {conversations.map((conversation) => (
                <button
                  type="button"
                  key={conversation.id}
                  className={`r-chat-conversation ${activeId === conversation.id ? 'active' : ''}`}
                  onClick={() => chooseConversation(conversation.id)}
                >
                  <span className={`r-chat-avatar ${conversation.type}`}>
                    {conversationIcon(conversation.type)}
                  </span>
                  <span className="r-chat-conversation-copy">
                    <span className="r-chat-conversation-top">
                      <strong>{conversation.title}</strong>
                      <time>{formatTime(conversation.lastMessageAt)}</time>
                    </span>
                    <span className="r-chat-conversation-preview">
                      {conversation.lastMessageText || 'No messages yet'}
                    </span>
                    <span className="r-chat-conversation-bottom">
                      <small>{conversation.subtitle}</small>
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
            <div className="r-chat-empty-list">
              <MessageSquare size={26} />
              <p>No conversations yet.</p>
              <button type="button" onClick={() => createConversation('/chat/conversations/support')} disabled={starting}>
                Contact support
              </button>
            </div>
          )}

          {ownerOptions.length > 0 && (
            <div className="r-chat-owner-start">
              <label htmlFor="owner-property">Message an owner</label>
              <select
                id="owner-property"
                value=""
                disabled={starting}
                onChange={(event) => {
                  if (event.target.value) {
                    createConversation('/chat/conversations/owner', { propertyId: Number(event.target.value) })
                  }
                }}
              >
                <option value="">Choose a property…</option>
                {ownerOptions.map((property) => (
                  <option key={property.propertyId} value={property.propertyId}>
                    {property.name} — {[property.area, property.city].filter(Boolean).join(', ')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </aside>

        <section className={`r-chat-panel ${mobileChatOpen ? 'mobile-visible' : ''}`} aria-label="Chat messages">
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
                <span className={`r-chat-avatar ${activeConversation.type}`}>
                  {conversationIcon(activeConversation.type)}
                </span>
                <div className="r-chat-header-copy">
                  <h2>{activeConversation.title}</h2>
                  <p>
                    {isAssistant
                      ? activeConversation.status === 'bot'
                        ? 'Nestora Assistant · automated replies'
                        : activeConversation.assignedAdminId
                          ? 'A support agent has joined'
                          : 'Waiting for a human support agent'
                      : activeConversation.type === 'owner'
                        ? activeConversation.subtitle || 'Property owner'
                        : activeConversation.assignedAdminId
                          ? 'Support agent'
                          : 'Waiting for human support'}
                  </p>
                </div>
                {showHandoff && (
                  <button
                    type="button"
                    className="r-chat-handoff"
                    onClick={requestHandoff}
                    disabled={starting}
                  >
                    <Headset size={16} />
                    <span>Contact a person</span>
                  </button>
                )}
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
                  <>
                    {hasOlderMessages && (
                      <button
                        type="button"
                        className="r-chat-load-older"
                        onClick={loadOlderMessages}
                        disabled={loadingOlderMessages}
                      >
                        {loadingOlderMessages ? 'Loading older messages…' : 'Load older messages'}
                      </button>
                    )}
                    {messages.map((message) => {
                    const own = Number(message.senderId) === Number(user?.userId)
                    const assistant = message.senderRole === 'assistant'
                    const read = !own || (message.readBy || []).some((readerId) => Number(readerId) !== Number(user?.userId))
                    return (
                      <article
                        className={`r-chat-message-row ${own ? 'own' : 'other'}`}
                        key={message._id}
                      >
                        {!own && (
                          <span className={`r-chat-message-avatar ${assistant ? 'assistant' : 'human'}`}>
                            {assistant ? <Bot size={15} /> : message.senderRole === 'owner' ? <Building2 size={15} /> : <UserRound size={15} />}
                          </span>
                        )}
                        <div className="r-chat-message-group">
                          {!own && <span className="r-chat-sender">{assistant ? 'Nestora Assistant' : message.senderRole === 'owner' ? activeConversation.title : message.senderRole === 'admin' ? 'Support agent' : 'Resident'}</span>}
                          <div className={`r-chat-bubble ${own ? 'sent' : 'received'}${assistant ? ' assistant' : ''}`}>
                            <p>{message.content}</p>
                            {message.properties?.length > 0 && (
                              <div className="r-chat-property-results">
                                {message.properties.map((property) => (
                                  <article className="r-chat-property-card" key={property.propertyId}>
                                    <div className="r-chat-property-card-title">
                                      <Building2 size={16} />
                                      <strong>{property.name}</strong>
                                    </div>
                                    <p>{[property.area, property.city].filter(Boolean).join(', ')}</p>
                                    <p className="r-chat-property-rent">From ₹{Number(property.rent).toLocaleString('en-IN')} / month</p>
                                    <p>Available rooms: {property.roomTypes.join(', ')}</p>
                                    {property.amenities.length > 0 && <p>Amenities: {property.amenities.join(', ')}</p>}
                                    <div className="r-chat-property-actions">
                                      <a href={`/resident/property/${property.propertyId}`}>View property</a>
                                      <button
                                        type="button"
                                        onClick={() => createConversation('/chat/conversations/owner', { propertyId: property.propertyId })}
                                        disabled={starting}
                                      >
                                        Message owner
                                      </button>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="r-chat-message-meta">
                            <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                            {own && (read ? <CheckCheck size={14} aria-label="Read" /> : <Check size={14} aria-label="Sent" />)}
                          </div>
                        </div>
                      </article>
                    )
                    })}
                  </>
                ) : (
                  <div className="r-chat-empty-thread">
                    <span><ShieldCheck size={27} /></span>
                    <h3>Start a conversation</h3>
                    <p>Your messages are stored securely with your account.</p>
                  </div>
                )}
                <div ref={messageEndRef} />
              </div>

              {messageError && messages.length > 0 && (
                <div className="r-chat-inline-error" role="alert">{messageError}</div>
              )}
              <form className="r-chat-composer" onSubmit={send}>
                <label className="sr-only" htmlFor="chat-message">Write a message</label>
                <textarea
                  id="chat-message"
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
                  placeholder={
                    activeConversation.status === 'closed'
                      ? 'This conversation is closed'
                      : sending
                        ? 'Sending…'
                        : 'Write a message…'
                  }
                  maxLength={1000}
                  rows={1}
                  disabled={sending || loadingMessages || activeConversation.status === 'closed'}
                />
                <span className="r-chat-char-count">{draft.length}/1000</span>
                <button
                  type="submit"
                  disabled={!draft.trim() || sending || loadingMessages || activeConversation.status === 'closed'}
                  aria-label="Send message"
                >
                  {sending ? <LoaderCircle size={18} className="r-chat-spin" /> : <Send size={18} />}
                </button>
              </form>
              {showHandoff && (
                <p className="r-chat-composer-hint">
                  The Assistant uses live Nestora listings and your account records. <button type="button" onClick={requestHandoff} disabled={starting}>Ask a person instead</button>
                </p>
              )}
            </>
          ) : (
            <div className="r-chat-no-selection">
              <span><MessageSquare size={30} /></span>
              <h2>Select a conversation</h2>
              <p>Choose a conversation or contact support to get started.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
