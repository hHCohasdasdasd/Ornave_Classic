import React, { useEffect, useRef, useState } from 'react';
import { TicketStatus, TicketWithMessages } from '@/types/discovery';
import './TicketThreadModal.css';

const STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const statusLabel = (status: TicketStatus) =>
  status === 'IN_PROGRESS' ? 'In Progress' : status.charAt(0) + status.slice(1).toLowerCase();

interface TicketThreadModalProps {
  ticket: TicketWithMessages;
  onClose: () => void;
  isCompanyView?: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onUpdateStatus?: (status: TicketStatus) => Promise<void>;
  onCloseTicket?: () => Promise<void>;
}

export const TicketThreadModal: React.FC<TicketThreadModalProps> = ({
  ticket,
  onClose,
  isCompanyView,
  onSendMessage,
  onUpdateStatus,
  onCloseTicket,
}) => {
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [ticket.messages.length]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content) return;
    setIsSending(true);
    try {
      await onSendMessage(content);
      setDraft('');
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!onUpdateStatus) return;
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal ticket-modal" onClick={(e) => e.stopPropagation()}>
        <button className="order-modal__close" onClick={onClose}>×</button>

        <div className="order-modal__header">
          <div>
            <span className="order-modal__order-id">Ticket #{ticket.id.slice(-8).toUpperCase()}</span>
            <h2 className="order-modal__company">{ticket.subject}</h2>
            <span className="order-modal__date">Opened {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          {isCompanyView && onUpdateStatus ? (
            <select
              className={`ticket-modal__status-select ticket-modal__status-select--${ticket.status.toLowerCase()}`}
              value={ticket.status}
              disabled={isUpdatingStatus}
              onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          ) : (
            <span className={`ticket-modal__status-badge ticket-modal__status-badge--${ticket.status.toLowerCase()}`}>
              {statusLabel(ticket.status)}
            </span>
          )}
        </div>

        <div className="order-modal__thread ticket-modal__thread">
          <div className="order-modal__thread-list">
            {ticket.messages.map((msg) => (
              <div
                key={msg.id}
                className={`order-modal__bubble${msg.senderIsCompany === !!isCompanyView ? ' order-modal__bubble--own' : ''}`}
              >
                <p className="order-modal__bubble-text">{msg.content}</p>
                <span className="order-modal__bubble-time">
                  {new Date(msg.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {ticket.status !== 'CLOSED' ? (
          <div className="order-modal__composer">
            <input
              placeholder="Write a reply…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              maxLength={2000}
            />
            <button onClick={handleSend} disabled={!draft.trim() || isSending}>
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </div>
        ) : (
          <p className="ticket-modal__closed-note">This ticket is closed.</p>
        )}

        {!isCompanyView && onCloseTicket && ticket.status !== 'CLOSED' && (
          <button className="ticket-modal__close-ticket-btn" onClick={onCloseTicket}>Close Ticket</button>
        )}
      </div>
    </div>
  );
};
