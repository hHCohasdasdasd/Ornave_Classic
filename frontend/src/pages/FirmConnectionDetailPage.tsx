import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { networkService } from '@/services/networkService';
import { storeService, Order } from '@/services/storeService';
import { firmService } from '@/services/firmService';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import { TicketThreadModal } from '@/components/TicketThreadModal';
import { FirmConnectionFile, Ticket, TicketWithMessages } from '@/types/discovery';
import { FirmProfileData } from '@/types/firm';
import './WorkSuite.css';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
};

const getInitials = (name: string) => name.trim().slice(0, 2).toUpperCase();

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

interface OpenConnection {
  id: string;
  createdAt?: string;
  company: { id: string; name: string; logo?: string; bannerUrl?: string; industry?: string; description?: string };
}

export const FirmConnectionDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { firmId } = useParams<{ firmId: string }>();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [detail, setDetail] = useState<OpenConnection | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firmProfile, setFirmProfile] = useState<FirmProfileData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [files, setFiles] = useState<FirmConnectionFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{ key: string; name: string; percent: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<{ id: string; senderIsCompany: boolean; content: string; createdAt: string }[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [viewingTicket, setViewingTicket] = useState<TicketWithMessages | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  useEffect(() => {
    if (isGuest || !firmId) return;
    openFirmDetail(firmId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest, firmId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  const openFirmDetail = async (id: string) => {
    setError(null);
    setIsLoadingDetail(true);
    try {
      const connection = await networkService.ensureFirmConnection(id);
      if (!connection) {
        setError("Can't open this firm — it isn't a registered Ornave company.");
        return;
      }
      setDetail(connection);
      const [ords, fls, msgs, profile, tix] = await Promise.all([
        storeService.getOrdersWithCompany(connection.company.id),
        networkService.listFirmFiles(connection.id),
        networkService.getFirmMessages(connection.id),
        firmService.getFirmProfile(connection.company.id),
        networkService.getFirmTickets(connection.id),
      ]);
      setOrders(ords);
      setFiles(fls);
      setMessages(msgs);
      setFirmProfile(profile);
      setTickets(tix);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSendMessage = async () => {
    const content = messageDraft.trim();
    if (!content || !detail) return;
    setIsSendingMessage(true);
    try {
      const sent = await networkService.sendFirmMessage(detail.id, content);
      setMessages((prev) => [...prev, sent]);
      setMessageDraft('');
    } catch {
      setError('Could not send that message — try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleOpenTicket = async () => {
    const subject = newTicketSubject.trim();
    const message = newTicketMessage.trim();
    if (!subject || !message || !detail) return;
    setIsCreatingTicket(true);
    try {
      const ticket = await networkService.openFirmTicket(detail.id, subject, message);
      setTickets((prev) => [ticket, ...prev]);
      setNewTicketSubject('');
      setNewTicketMessage('');
      setIsNewTicketOpen(false);
    } catch {
      setError('Could not open that ticket — try again.');
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const openTicketThread = async (ticketId: string) => {
    const ticket = await networkService.getTicket(ticketId);
    setViewingTicket(ticket);
  };

  const handleTicketMessage = async (content: string) => {
    if (!viewingTicket) return;
    const sent = await networkService.sendTicketMessage(viewingTicket.id, content);
    setViewingTicket((prev) => (prev ? { ...prev, messages: [...prev.messages, sent] } : prev));
  };

  const handleCloseTicket = async () => {
    if (!viewingTicket) return;
    const updated = await networkService.closeTicket(viewingTicket.id);
    setViewingTicket((prev) => (prev ? { ...prev, status: updated.status } : prev));
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, status: updated.status } : t)));
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // e.target.files is a live FileList — capture a real array from it before
    // resetting the input's value, since that reset also clears the FileList
    // out from under any reference still pointing at it.
    const picked = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (!detail || !picked.length) return;
    for (const file of picked) {
      const key = `${file.name}-${Date.now()}`;
      setUploadingFiles((prev) => [...prev, { key, name: file.name, percent: 0 }]);
      try {
        await networkService.uploadFirmFile(detail.id, file, (percent) => {
          setUploadingFiles((prev) => prev.map((u) => (u.key === key ? { ...u, percent } : u)));
        });
        setUploadingFiles((prev) => prev.filter((u) => u.key !== key));
        const fresh = await networkService.listFirmFiles(detail.id);
        setFiles(fresh);
      } catch {
        setUploadingFiles((prev) => prev.filter((u) => u.key !== key));
        setError('Upload failed — try again.');
      }
    }
  };

  const handleDownloadFile = async (file: FirmConnectionFile) => {
    if (!detail) return;
    try {
      const url = await networkService.getFirmFileDownloadUrl(detail.id, file.id);
      window.open(url, '_blank');
    } catch {
      setError('Could not generate a download link — try again.');
    }
  };

  const handleDeleteFile = async (file: FirmConnectionFile) => {
    if (!detail) return;
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    await networkService.deleteFirmFile(detail.id, file.id);
  };

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite/connections')}>← Connections</button>
        </div>
      </div>

      {detail && (
        <div
          className="firm-detail-page__cover"
          style={detail.company.bannerUrl ? { backgroundImage: `url(${detail.company.bannerUrl})` } : undefined}
        />
      )}

      <div className="worksuite-page__container worksuite-page__container--wide">
        {error && <p className="worksuite-modal__error">{error}</p>}

        {isLoadingDetail ? (
          <div className="worksuite-empty">Loading…</div>
        ) : !detail ? null : (
          <>
            <div className="firm-detail-page__hero">
              <div className="firm-detail-page__profile firm-detail-page__profile--overlap">
                <div
                  className="firm-detail-page__logo"
                  style={detail.company.logo ? { backgroundImage: `url(${detail.company.logo})` } : undefined}
                >
                  {!detail.company.logo && getInitials(detail.company.name)}
                </div>
                <div className="firm-detail-page__profile-info">
                  <h1 className="firm-detail-page__name">{detail.company.name}</h1>
                  {(firmProfile?.industry || detail.company.industry) && (
                    <span className="firm-detail-page__industry-tag">{firmProfile?.industry || detail.company.industry}</span>
                  )}
                  <p className="firm-detail-page__bio">
                    {firmProfile?.bio || detail.company.description || 'No description available.'}
                  </p>
                </div>
              </div>

              <div className="firm-detail-page__stats">
                <div className="firm-detail-page__stat">
                  <span className="firm-detail-page__stat-value">{detail.createdAt ? formatDate(detail.createdAt) : '—'}</span>
                  <span className="firm-detail-page__stat-label">Connected since</span>
                </div>
                <div className="firm-detail-page__stat">
                  <span className="firm-detail-page__stat-value">{orders.length}</span>
                  <span className="firm-detail-page__stat-label">Total orders</span>
                </div>
                <div className="firm-detail-page__stat">
                  <span className="firm-detail-page__stat-value">{orders[0]?.currency || 'USD'} {orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}</span>
                  <span className="firm-detail-page__stat-label">Total spent</span>
                </div>
                <div className="firm-detail-page__stat">
                  <span className="firm-detail-page__stat-value">{orders[0] ? formatDate(orders[0].createdAt) : '—'}</span>
                  <span className="firm-detail-page__stat-label">Last order</span>
                </div>
              </div>
            </div>

            <div className="firm-detail-page__grid">
              <div className="firm-detail-page__col">
                {firmProfile && firmProfile.services.length > 0 && (
                  <div className="firm-detail-page__card">
                    <div className="firm-detail-page__card-header">
                      <span className="firm-detail-page__card-icon">✦</span>
                      <h3>Services</h3>
                    </div>
                    <div className="firm-detail-page__services">
                      {firmProfile.services.map((service, i) => (
                        <div key={i} className="firm-detail-page__service-card">
                          <div className="firm-detail-page__service-title">{service.title}</div>
                          <p className="firm-detail-page__service-desc">{service.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="firm-detail-page__card">
                  <div className="firm-detail-page__card-header">
                    <span className="firm-detail-page__card-icon">▤</span>
                    <h3>Orders</h3>
                  </div>

                  {orders.length === 0 ? (
                    <p className="worksuite-card__meta">No orders placed with this firm yet.</p>
                  ) : (
                    <div className="firm-detail-modal__list">
                      {orders.map((order) => (
                        <div key={order.id} className="firm-detail-modal__row" style={{ cursor: 'pointer' }} onClick={() => setViewingOrder(order)}>
                          <div>
                            <div className="firm-detail-modal__row-title">Order #{order.id.slice(-8).toUpperCase()}</div>
                            <div className="worksuite-card__meta">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className={`order-modal__status order-modal__status--${order.status.toLowerCase()}`} style={{ position: 'static' }}>{order.status}</span>
                            <span className="firm-detail-modal__amount">{order.currency} {order.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="firm-detail-page__card">
                  <div className="firm-detail-page__card-header">
                    <span className="firm-detail-page__card-icon">⌘</span>
                    <h3>Files</h3>
                    <button className="worksuite-create-btn firm-detail-page__card-action" onClick={() => fileInputRef.current?.click()}>+ Upload</button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFilePick}
                      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
                    />
                  </div>

                  {uploadingFiles.length > 0 && (
                    <div className="files-uploading">
                      {uploadingFiles.map((u) => (
                        <div key={u.key} className="files-uploading__row">
                          <span className="files-uploading__name">{u.name}</span>
                          <div className="files-uploading__bar">
                            <div className="files-uploading__bar-fill" style={{ width: `${u.percent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {files.length === 0 ? (
                    <p className="worksuite-card__meta">No files uploaded for this firm yet.</p>
                  ) : (
                    <div className="firm-detail-modal__list">
                      {files.map((file) => (
                        <div key={file.id} className="firm-detail-modal__row">
                          <div>
                            <div className="firm-detail-modal__row-title">{file.name}</div>
                            <div className="worksuite-card__meta">
                              {formatBytes(file.size)} · {file.uploadedByCompany ? detail.company.name : 'You'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button className="worksuite-btn" onClick={() => handleDownloadFile(file)}>Download</button>
                            {!file.uploadedByCompany && (
                              <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDeleteFile(file)}>Delete</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="firm-detail-page__col firm-detail-page__col--messages">
                <div className="firm-detail-page__card firm-detail-page__card--chat">
                  <div className="firm-detail-page__card-header">
                    <span className="firm-detail-page__card-icon">✉</span>
                    <h3>Messages</h3>
                  </div>
                  <div className="order-modal__thread firm-detail-page__thread">
                    {messages.length === 0 ? (
                      <p className="worksuite-card__meta">No messages yet — write to {detail.company.name} below.</p>
                    ) : (
                      <div className="order-modal__thread-list">
                        {messages.map((msg) => (
                          <div key={msg.id} className={`order-modal__bubble${!msg.senderIsCompany ? ' order-modal__bubble--own' : ''}`}>
                            <p className="order-modal__bubble-text">{msg.content}</p>
                            <span className="order-modal__bubble-time">
                              {new Date(msg.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                  <div className="order-modal__composer">
                    <input
                      placeholder={`Message ${detail.company.name}…`}
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                      maxLength={2000}
                    />
                    <button onClick={handleSendMessage} disabled={!messageDraft.trim() || isSendingMessage}>
                      {isSendingMessage ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                </div>

                <div className="firm-detail-page__card">
                  <div className="firm-detail-page__card-header">
                    <span className="firm-detail-page__card-icon">🎫</span>
                    <h3>Tickets</h3>
                    <button className="worksuite-create-btn firm-detail-page__card-action" onClick={() => setIsNewTicketOpen((v) => !v)}>
                      {isNewTicketOpen ? 'Cancel' : '+ New Ticket'}
                    </button>
                  </div>

                  {isNewTicketOpen && (
                    <div className="ticket-new-form">
                      <input
                        placeholder="Subject"
                        value={newTicketSubject}
                        onChange={(e) => setNewTicketSubject(e.target.value)}
                        maxLength={140}
                      />
                      <textarea
                        placeholder="Describe the issue…"
                        value={newTicketMessage}
                        onChange={(e) => setNewTicketMessage(e.target.value)}
                        rows={3}
                        maxLength={2000}
                      />
                      <button
                        className="worksuite-create-btn"
                        onClick={handleOpenTicket}
                        disabled={!newTicketSubject.trim() || !newTicketMessage.trim() || isCreatingTicket}
                      >
                        {isCreatingTicket ? 'Opening…' : 'Open Ticket'}
                      </button>
                    </div>
                  )}

                  {tickets.length === 0 ? (
                    <p className="worksuite-card__meta">No tickets opened with this firm yet.</p>
                  ) : (
                    <div className="firm-detail-modal__list">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="firm-detail-modal__row" style={{ cursor: 'pointer' }} onClick={() => openTicketThread(ticket.id)}>
                          <div>
                            <div className="firm-detail-modal__row-title">{ticket.subject}</div>
                            <div className="worksuite-card__meta">{formatDate(ticket.updatedAt)}</div>
                          </div>
                          <span className={`ticket-modal__status-badge ticket-modal__status-badge--${ticket.status.toLowerCase()}`}>
                            {ticket.status === 'IN_PROGRESS' ? 'In Progress' : ticket.status.charAt(0) + ticket.status.slice(1).toLowerCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {viewingOrder && (
        <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
      )}

      {viewingTicket && (
        <TicketThreadModal
          ticket={viewingTicket}
          onClose={() => setViewingTicket(null)}
          onSendMessage={handleTicketMessage}
          onCloseTicket={handleCloseTicket}
        />
      )}
    </div>
  );
};
