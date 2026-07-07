import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import './MessagingPage.css';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

interface Conversation {
  id: string;
  participantName: string;
  participantTitle: string;
  participantInitials: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  isActive: boolean;
}

export const MessagingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inbox' | 'jobs' | 'unread' | 'connections' | 'inmail' | 'starred'>('inbox');
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [mutedConversationIds, setMutedConversationIds] = useState<Set<string>>(new Set());
  const chatMenuContainerRef = useRef<HTMLDivElement | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const tabOptions: Array<{
    key: 'inbox' | 'jobs' | 'unread' | 'connections' | 'inmail' | 'starred';
    label: string;
  }> = [
    { key: 'inbox', label: 'Inbox' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'unread', label: 'Unread' },
    { key: 'connections', label: 'Connections' },
    { key: 'inmail', label: 'InMail' },
    { key: 'starred', label: 'Starred' },
  ];

  const activeTabLabel = tabOptions.find((option) => option.key === activeTab)?.label || 'Inbox';

  useEffect(() => {
    if (user) {
      loadMessagingData();
    }
  }, [user]);

  useEffect(() => {
    if (!isChatMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!chatMenuContainerRef.current?.contains(target)) {
        setIsChatMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isChatMenuOpen]);

  const loadMessagingData = async () => {
    try {
      setConversations([]);
      setMessages([]);
    } catch (err) {
      console.error('Failed to load messaging data:', err);
    }
  };

  const unreadCount = conversations.filter(conv => conv.unread).length;
  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);
  const isSelectedConversationMuted = selectedConversation ? mutedConversationIds.has(selectedConversation.id) : false;

  const handleViewProfile = () => {
    setIsChatMenuOpen(false);
    navigate('/profile');
  };

  const handleToggleMuteConversation = () => {
    if (!selectedConversation) return;

    setMutedConversationIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(selectedConversation.id)) {
        updated.delete(selectedConversation.id);
      } else {
        updated.add(selectedConversation.id);
      }
      return updated;
    });

    setIsChatMenuOpen(false);
  };

  const handleClearConversation = () => {
    setMessages([]);
    setIsChatMenuOpen(false);
  };

  const handleDeleteConversation = () => {
    if (!selectedConversation) return;

    setConversations((prev) => {
      const updated = prev.filter((conv) => conv.id !== selectedConversation.id);
      const fallbackConversation = updated[0];
      setSelectedConversationId(fallbackConversation ? fallbackConversation.id : '');
      return updated;
    });

    setMutedConversationIds((prev) => {
      const updated = new Set(prev);
      updated.delete(selectedConversation.id);
      return updated;
    });

    setMessages([]);
    setIsChatMenuOpen(false);
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: 'self',
        senderName: 'You',
        senderInitials: 'YU',
        content: messageText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true
      };
      setMessages([...messages, newMessage]);
      setMessageText('');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'unread' && !conv.unread) return false;
    if (activeTab === 'starred') return false;
    return conv.participantName.toLowerCase().includes(searchQuery.toLowerCase());
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
              {filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item ${selectedConversationId === conv.id ? 'conversation-item--active' : ''} ${conv.unread ? 'conversation-item--unread' : ''}`}
                  onClick={() => {
                    setSelectedConversationId(conv.id);
                    setIsChatMenuOpen(false);
                  }}
                >
                  <div className="conversation-avatar">
                    {conv.participantInitials}
                  </div>
                  <div className="conversation-content">
                    <h3 className="conversation-name">{conv.participantName}</h3>
                    <p className="conversation-message">{conv.lastMessage}</p>
                  </div>
                  <div className="conversation-meta">
                    <span className="conversation-time">{conv.lastMessageTime}</span>
                    {conv.unread && <div className="conversation-unread-badge">!</div>}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content - Messages */}
          <main className="messaging-main">
            {selectedConversation && (
              <>
                {/* Conversation Header */}
                <div className="message-header">
                  <div className="message-header__info">
                    <div className="message-header__avatar">
                      {selectedConversation.participantInitials}
                    </div>
                    <div className="message-header__details">
                      <h2 className="message-header__name">{selectedConversation.participantName}</h2>
                      <p className="message-header__title">
                        {selectedConversation.participantTitle}
                      </p>
                      {isSelectedConversationMuted && (
                        <p className="message-header__muted">Muted</p>
                      )}
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
                        <button className="message-header__menu-item" onClick={handleToggleMuteConversation} role="menuitem">
                          {isSelectedConversationMuted ? 'Unmute conversation' : 'Mute conversation'}
                        </button>
                        <button className="message-header__menu-item" onClick={handleClearConversation} role="menuitem">
                          Clear conversation
                        </button>
                        <button className="message-header__menu-item message-header__menu-item--danger" onClick={handleDeleteConversation} role="menuitem">
                          Delete conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Thread */}
                <div className="messages-container">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message-bubble ${msg.isOwn ? 'message-bubble--own' : ''}`}
                    >
                      {!msg.isOwn && (
                        <div className="message-avatar">
                          {msg.senderInitials}
                        </div>
                      )}
                      <div className="message-content">
                        <p className="message-text">
                          {msg.content}
                        </p>
                        <span className="message-time">{msg.timestamp}</span>
                      </div>
                    </div>
                  ))}
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
                    <div className="message-actions">
                      <button className="message-action" title="Attach image">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="#0b3d2e">
                          <path d="M16 1H4C2.9 1 2 1.9 2 3V17C2 18.1 2.9 19 4 19H16C17.1 19 18 18.1 18 17V3C18 1.9 17.1 1 16 1ZM16 17H4V3H16V17ZM13.5 11.5L9.5 7L5.5 12V13H7.5L9.5 10.5L13.5 14Z"/>
                        </svg>
                      </button>
                      <button className="message-action" title="Attach link">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="#0b3d2e">
                          <path d="M9 3C5.13 3 2 6.13 2 10C2 13.87 5.13 17 9 17C12.87 17 16 13.87 16 10M15 9H9V11H15V9Z"/>
                        </svg>
                      </button>
                      <button className="message-action" title="Attach GIF">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="#0b3d2e">
                          <text x="4" y="14" fontSize="12" fontWeight="bold">GIF</text>
                        </svg>
                      </button>
                      <button className="message-action" title="Add emoji">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="#0b3d2e">
                          <circle cx="10" cy="10" r="8"/>
                          <circle cx="7" cy="8" r="1.5" fill="#0b3d2e"/>
                          <circle cx="13" cy="8" r="1.5" fill="#0b3d2e"/>
                          <path d="M7 12C7 13 8 14 10 14C12 14 13 13 13 12" stroke="#0b3d2e" fill="none"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button 
                    className="message-send"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                  >
                    TRANSMIT
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
