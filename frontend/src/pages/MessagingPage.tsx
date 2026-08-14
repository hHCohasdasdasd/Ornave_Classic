import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { directMessageService } from '@/services/directMessageService';
import { DirectConversation, DirectMessage, DirectMessageUser } from '@/types/discovery';
import './MessagingPage.css';

const getInitials = (firstName: string, lastName: string) => `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const MessagingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inbox' | 'unread'>('inbox');
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const chatMenuContainerRef = useRef<HTMLDivElement | null>(null);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [draftCounterpart, setDraftCounterpart] = useState<DirectMessageUser | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tabOptions: Array<{ key: 'inbox' | 'unread'; label: string }> = [
    { key: 'inbox', label: 'Inbox' },
    { key: 'unread', label: 'Unread' },
  ];

  const activeTabLabel = tabOptions.find((option) => option.key === activeTab)?.label || 'Inbox';

  useEffect(() => {
    if (!user) return;
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const to = searchParams.get('to');
    if (to && to !== user?.id) openConversation(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  useEffect(() => {
    if (!isChatMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!chatMenuContainerRef.current?.contains(target)) {
        setIsChatMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isChatMenuOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  const loadConversations = async () => {
    try {
      setConversations(await directMessageService.getConversations());
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const openConversation = async (userId: string) => {
    setSelectedUserId(userId);
    setDraftCounterpart(null);
    setIsLoadingThread(true);
    try {
      const existing = conversations.find((c) => c.counterpart.id === userId);
      if (!existing) {
        const basic = await directMessageService.getUser(userId);
        if (basic) setDraftCounterpart(basic);
      }
      setMessages(await directMessageService.getThread(userId));
      loadConversations();
    } finally {
      setIsLoadingThread(false);
    }
  };

  const selectedCounterpart = conversations.find((c) => c.counterpart.id === selectedUserId)?.counterpart || draftCounterpart;

  const handleViewProfile = () => {
    setIsChatMenuOpen(false);
    if (selectedCounterpart) {
      navigate(`/profile?view=${selectedCounterpart.firstName.toLowerCase()}-${selectedCounterpart.lastName.toLowerCase()}`);
    }
  };

  const handleSendMessage = async () => {
    const content = messageText.trim();
    if (!content || !selectedUserId || isSending) return;
    setIsSending(true);
    try {
      const sent = await directMessageService.sendMessage(selectedUserId, content);
      setMessages((prev) => [...prev, sent]);
      setMessageText('');
      loadConversations();
    } finally {
      setIsSending(false);
    }
  };

  const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'unread' && c.unreadCount === 0) return false;
    const name = `${c.counterpart.firstName} ${c.counterpart.lastName}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <Navbar />
      <ProtectedPageOverlay isVisible={!user} />
      <div className="messaging-page">
        <div className="messaging-page__container">
          {/* Left Sidebar - Conversations */}
          <aside className="messaging-sidebar">
            <div className="messaging-header">
              <h1 className="messaging-title">Messaging</h1>
            </div>

            <div className="messaging-search">
              <input
                type="text"
                placeholder="Search messages..."
                className="messaging-search__input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="messaging-filter-dropdown">
              <button
                className="messaging-filter-dropdown__trigger"
                onClick={() => setIsTabMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isTabMenuOpen}
              >
                <span>{activeTabLabel}</span>
                {activeTab === 'inbox' && unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                <span className="messaging-filter-dropdown__chevron">⌄</span>
              </button>

              {isTabMenuOpen && (
                <div className="messaging-filter-dropdown__menu" role="menu">
                  {tabOptions.map((option) => (
                    <button
                      key={option.key}
                      className={`messaging-filter-dropdown__item ${activeTab === option.key ? 'messaging-filter-dropdown__item--active' : ''}`}
                      onClick={() => {
                        setActiveTab(option.key);
                        setIsTabMenuOpen(false);
                      }}
                      role="menuitem"
                    >
                      <span>{option.label}</span>
                      {option.key === 'inbox' && unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="conversations-list">
              {filteredConversations.length === 0 && !draftCounterpart && (
                <p style={{ padding: '20px', color: 'var(--tech-text-dim)', fontSize: '0.85rem' }}>
                  No conversations yet — message someone from their profile to start one.
                </p>
              )}
              {draftCounterpart && (
                <div className="conversation-item conversation-item--active">
                  <div className="conversation-avatar">{getInitials(draftCounterpart.firstName, draftCounterpart.lastName)}</div>
                  <div className="conversation-content">
                    <h3 className="conversation-name">{draftCounterpart.firstName} {draftCounterpart.lastName}</h3>
                    <p className="conversation-message">Start the conversation…</p>
                  </div>
                </div>
              )}
              {filteredConversations.map((conv) => (
                <div
                  key={conv.counterpart.id}
                  className={`conversation-item ${selectedUserId === conv.counterpart.id ? 'conversation-item--active' : ''} ${conv.unreadCount > 0 ? 'conversation-item--unread' : ''}`}
                  onClick={() => {
                    openConversation(conv.counterpart.id);
                    setIsChatMenuOpen(false);
                  }}
                >
                  <div className="conversation-avatar">{getInitials(conv.counterpart.firstName, conv.counterpart.lastName)}</div>
                  <div className="conversation-content">
                    <h3 className="conversation-name">{conv.counterpart.firstName} {conv.counterpart.lastName}</h3>
                    <p className="conversation-message">{conv.lastMessage.content}</p>
                  </div>
                  <div className="conversation-meta">
                    <span className="conversation-time">{formatTime(conv.lastMessage.createdAt)}</span>
                    {conv.unreadCount > 0 && <div className="conversation-unread-badge">{conv.unreadCount}</div>}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content - Messages */}
          <main className="messaging-main">
            {selectedCounterpart && (
              <>
                {/* Conversation Header */}
                <div className="message-header">
                  <div className="message-header__info">
                    <div className="message-header__avatar">
                      {getInitials(selectedCounterpart.firstName, selectedCounterpart.lastName)}
                    </div>
                    <div className="message-header__details">
                      <h2 className="message-header__name">{selectedCounterpart.firstName} {selectedCounterpart.lastName}</h2>
                    </div>
                  </div>
                  <div className="message-header__actions" ref={chatMenuContainerRef}>
                    <button
                      className="message-header__more"
                      aria-label="Chat options"
                      aria-haspopup="menu"
                      aria-expanded={isChatMenuOpen}
                      onClick={() => setIsChatMenuOpen((prev) => !prev)}
                    >
                      ⋯
                    </button>

                    {isChatMenuOpen && (
                      <div className="message-header__menu" role="menu">
                        <button className="message-header__menu-item" onClick={handleViewProfile} role="menuitem">
                          View profile
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Thread */}
                <div className="messages-container">
                  {isLoadingThread ? (
                    <p style={{ padding: '20px', color: 'var(--tech-text-dim)' }}>Loading…</p>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isOwn = msg.fromUserId === user?.id;
                        return (
                          <div key={msg.id} className={`message-bubble ${isOwn ? 'message-bubble--own' : ''}`}>
                            {!isOwn && (
                              <div className="message-avatar">
                                {getInitials(selectedCounterpart.firstName, selectedCounterpart.lastName)}
                              </div>
                            )}
                            <div className="message-content">
                              <p className="message-text">{msg.content}</p>
                              <span className="message-time">{formatTime(msg.createdAt)}</span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="message-input-container">
                  <div className="message-input-wrapper">
                    <textarea
                      className="message-input"
                      placeholder="Write a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>
                  <button
                    className="message-send"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isSending}
                  >
                    {isSending ? 'SENDING…' : 'TRANSMIT'}
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
};
