import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageContainer } from '@/components/ui/PageContainer';
import { erpNavigation } from '@/constants/navigation';
import { storeService, Order } from '@/services/storeService';
import { companyClientService, CompanyClientConnection, ConnectionMessage } from '@/services/companyClientService';
import { TicketThreadModal } from '@/components/TicketThreadModal';
import { Ticket, TicketStatus, TicketWithMessages, FirmConnectionFile } from '@/types/discovery';
import '@/pages/NetworkPage.css';
import '@/components/OrderDetailModal.css';
import '@/pages/WorkSuite.css';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
};

export const FirmClientManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [followers, setFollowers] = useState<CompanyClientConnection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bannerUrl, setBannerUrl] = useState<string | null>(company?.bannerUrl || null);

  const [activeClient, setActiveClient] = useState<CompanyClientConnection | null>(null);
  const [messages, setMessages] = useState<ConnectionMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageDraft, setMessageDraft] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [ticketsClient, setTicketsClient] = useState<CompanyClientConnection | null>(null);
  const [clientTickets, setClientTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<TicketWithMessages | null>(null);

  const [filesClient, setFilesClient] = useState<CompanyClientConnection | null>(null);
  const [clientFiles, setClientFiles] = useState<FirmConnectionFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ key: string; name: string; percent: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !company) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, company, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [clients, companyOrders] = await Promise.all([
        companyClientService.getClients(),
        storeService.getCompanyOrders(),
      ]);

      setFollowers(clients);
      setOrders(companyOrders);
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openMessages = async (client: CompanyClientConnection) => {
    setActiveClient(client);
    setIsLoadingMessages(true);
    try {
      setMessages(await companyClientService.getMessages(client.id));
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const closeMessages = () => {
    setActiveClient(null);
    setMessages([]);
    setMessageDraft('');
  };

  const handleSendMessage = async () => {
    const content = messageDraft.trim();
    if (!content || !activeClient) return;
    setIsSendingMessage(true);
    try {
      const sent = await companyClientService.sendMessage(activeClient.id, content);
      setMessages((prev) => [...prev, sent]);
      setMessageDraft('');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const openTickets = async (client: CompanyClientConnection) => {
    setTicketsClient(client);
    setIsLoadingTickets(true);
    try {
      setClientTickets(await companyClientService.getTickets(client.id));
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const closeTickets = () => {
    setTicketsClient(null);
    setClientTickets([]);
  };

  const openTicketThread = async (ticketId: string) => {
    const ticket = await companyClientService.getTicket(ticketId);
    setViewingTicket(ticket);
  };

  const handleTicketMessage = async (content: string) => {
    if (!viewingTicket) return;
    const sent = await companyClientService.sendTicketMessage(viewingTicket.id, content);
    setViewingTicket((prev) => (prev ? { ...prev, messages: [...prev.messages, sent] } : prev));
  };

  const handleUpdateTicketStatus = async (status: TicketStatus) => {
    if (!viewingTicket) return;
    const updated = await companyClientService.updateTicketStatus(viewingTicket.id, status);
    setViewingTicket((prev) => (prev ? { ...prev, status: updated.status as TicketStatus } : prev));
    setClientTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, status: updated.status as TicketStatus } : t)));
  };

  const openFiles = async (client: CompanyClientConnection) => {
    setFilesClient(client);
    setIsLoadingFiles(true);
    try {
      setClientFiles(await companyClientService.getFiles(client.id));
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const closeFiles = () => {
    setFilesClient(null);
    setClientFiles([]);
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (!filesClient || !picked.length) return;
    for (const file of picked) {
      const key = `${file.name}-${Date.now()}`;
      setUploadingFiles((prev) => [...prev, { key, name: file.name, percent: 0 }]);
      try {
        await companyClientService.uploadFile(filesClient.id, file, (percent) => {
          setUploadingFiles((prev) => prev.map((u) => (u.key === key ? { ...u, percent } : u)));
        });
        setUploadingFiles((prev) => prev.filter((u) => u.key !== key));
        setClientFiles(await companyClientService.getFiles(filesClient.id));
      } catch {
        setUploadingFiles((prev) => prev.filter((u) => u.key !== key));
      }
    }
  };

  const handleDownloadFile = async (file: FirmConnectionFile) => {
    if (!filesClient) return;
    const url = await companyClientService.getFileDownloadUrl(filesClient.id, file.id);
    window.open(url, '_blank');
  };

  const handleDeleteFile = async (file: FirmConnectionFile) => {
    if (!filesClient) return;
    setClientFiles((prev) => prev.filter((f) => f.id !== file.id));
    await companyClientService.deleteFile(filesClient.id, file.id);
  };

  const handleEditBanner = async () => {
    if (!company) return;
    const input = window.prompt('Paste a banner image URL (shown to buyers on your firm page):', bannerUrl || '');
    if (input === null) return;
    const trimmed = input.trim();
    const updated = await companyClientService.updateBanner(company.id, trimmed || null);
    setBannerUrl(updated.bannerUrl);
  };

  if (isLoading) {
    return (
      <div style={{ background: 'var(--color-bg, #111111)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted, #a79e8c)' }}>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <PageContainer
      title="Client & Network HUD"
      subtitle="Monitor your global followers, active subscribers, and service utilization."
      sidebarItems={erpNavigation}
    >
      <div className="network-main fade-in">
        {/* Firm Status Header */}
        <section className="network-section" style={{
          border: '1px solid rgba(231, 223, 201, 0.3)',
          background: bannerUrl
            ? `linear-gradient(180deg, rgba(10, 10, 8, 0.35) 0%, rgba(0, 0, 0, 0.88) 100%), url(${bannerUrl})`
            : 'linear-gradient(180deg, rgba(231, 223, 201, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '24px',
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '30px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, var(--tech-blue), transparent)' }}></div>
          <button
            className="btn-sm-primary"
            style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '0.65rem', padding: '5px 12px' }}
            onClick={handleEditBanner}
          >
            {bannerUrl ? 'Change Banner' : 'Set Banner'}
          </button>

          <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'var(--color-bg)',
              border: '1px solid var(--tech-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              position: 'relative'
            }}>
              🏢
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '1.8rem', textTransform: 'uppercase', margin: 0, letterSpacing: '2px', fontWeight: 900, color: 'var(--color-text)' }}>{company?.name}</h1>
                <div style={{ border: '1px solid var(--tech-blue)', padding: '2px 10px', fontSize: '0.6rem', fontWeight: 800, color: 'var(--tech-blue)' }}>
                  VERIFIED_ENTITY_HUB
                </div>
              </div>
              <div style={{ display: 'flex', gap: '25px' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(246, 243, 237, 0.55)', fontWeight: 800 }}>TOTAL_FOLLOWERS: <span style={{ color: 'var(--tech-blue)' }}>{followers.length}</span></div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(246, 243, 237, 0.55)', fontWeight: 800 }}>ACTIVE_CLIENTS: <span style={{ color: 'var(--tech-blue)' }}>{new Set(orders.map(o => o.userId)).size}</span></div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(246, 243, 237, 0.55)', fontWeight: 800 }}>PENDING_REQUESTS: <span style={{ color: 'var(--tech-blue)' }}>0</span></div>
              </div>
            </div>
          </div>
        </section>

        <div className="bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
          {/* Followers List */}
          <div style={{ gridColumn: 'span 7' }}>
            <section className="network-section" style={{ height: '100%', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(246, 243, 237, 0.08)', padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--tech-blue)', fontWeight: 900 }}>//</span> NETWORK FOLLOWERS
              </h3>
              <div className="profile-connections-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {followers.map(follower => (
                  <div key={follower.id} className="connection-hud-item" style={{ 
                    background: 'rgba(246, 243, 237, 0.02)',
                    border: '1px solid rgba(246, 243, 237, 0.08)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                  }}>
                    <div style={{ 
                      width: '45px', 
                      height: '45px', 
                      background: 'rgba(139, 163, 120, 0.12)',
                      borderRadius: '50%',
                      border: '1px solid rgba(139, 163, 120, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      👤
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text)' }}>{follower.user.firstName} {follower.user.lastName}</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--tech-text-dim)' }}>{follower.user.email}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="tech-tag" style={{ fontSize: '0.6rem', borderColor: 'rgba(139, 163, 120, 0.35)', color: '#8ba378' }}>CORE_LINK</span>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '5px' }}>
                        <button
                          className="btn-sm-primary"
                          style={{ fontSize: '0.65rem', padding: '4px 12px' }}
                          onClick={() => openMessages(follower)}
                        >MESSAGE</button>
                        <button
                          className="btn-sm-primary"
                          style={{ fontSize: '0.65rem', padding: '4px 12px' }}
                          onClick={() => openTickets(follower)}
                        >TICKETS</button>
                        <button
                          className="btn-sm-primary"
                          style={{ fontSize: '0.65rem', padding: '4px 12px' }}
                          onClick={() => openFiles(follower)}
                        >FILES</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Service Utilization / Orders */}
          <div style={{ gridColumn: 'span 5' }}>
            <section className="network-section" style={{ height: '100%', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(246, 243, 237, 0.08)', padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--tech-blue)', fontWeight: 900 }}>//</span> SERVICE UTILIZATION
              </h3>
              <div className="profile-connections-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.length > 0 ? orders.map(order => (
                  <div key={order.id} style={{ 
                    borderBottom: '1px solid rgba(246, 243, 237, 0.08)',
                    paddingBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 700 }}>{order.items[0]?.product?.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--tech-blue)', fontWeight: 800 }}>{order.currency} {order.totalAmount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                      <span style={{ color: 'rgba(246, 243, 237, 0.4)' }}>USER: {order.user?.firstName || 'CHUCK'} {order.user?.lastName || 'HARTWIG'}</span>
                      <span style={{ color: order.status === 'COMPLETED' ? '#8ba378' : 'var(--tech-blue)' }}>{order.status}</span>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '30px', textAlign: 'center', opacity: 0.3 }}>
                    <p>No active service subscriptions detected.</p>
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: '24px', padding: '15px', background: 'rgba(231, 223, 201, 0.05)', border: '1px solid rgba(231, 223, 201, 0.08)' }}>
                <h4 style={{ fontSize: '0.8rem', margin: '0 0 10px 0', color: 'var(--tech-blue)' }}>REVENUE_ANALYTICS</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--tech-text-dim)' }}>MONTHLY_RECURRING</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: 800 }}>USD {orders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString()}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Client Analytics Section */}
          <div style={{ gridColumn: 'span 12', marginTop: '10px' }}>
            <section className="network-section" style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(246, 243, 237, 0.08)', padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--tech-blue)', fontWeight: 900 }}>//</span> NETWORK GROWTH & ENGAGEMENT
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {[
                  { label: 'Avg. Retention', value: '94.2%', color: '#8ba378' },
                  { label: 'Engagement Rate', value: '12.5%', color: 'var(--tech-blue)' },
                  { label: 'New Followers', value: '+124', color: '#8ba378' },
                  { label: 'Churn Risk', value: '0.8%', color: '#c6a15b' }
                ].map(stat => (
                  <div key={stat.label} style={{ 
                    background: 'rgba(246, 243, 237, 0.02)', 
                    padding: '20px', 
                    border: '1px solid rgba(246, 243, 237, 0.08)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--tech-text-dim)', marginBottom: '8px', fontWeight: 800 }}>{stat.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {activeClient && (
        <div className="order-modal-overlay" onClick={closeMessages}>
          <div className="order-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <button className="order-modal__close" onClick={closeMessages}>×</button>
            <div className="order-modal__header">
              <div>
                <span className="order-modal__order-id">Direct Message</span>
                <h2 className="order-modal__company">{activeClient.user.firstName} {activeClient.user.lastName}</h2>
                <span className="order-modal__date">{activeClient.user.email}</span>
              </div>
            </div>

            <div className="order-modal__section" style={{ marginBottom: 0 }}>
              <div className="order-modal__thread">
                {isLoadingMessages ? (
                  <p className="order-modal__block-text">Loading…</p>
                ) : messages.length === 0 ? (
                  <p className="order-modal__block-text">No messages yet — write to {activeClient.user.firstName} below.</p>
                ) : (
                  <div className="order-modal__thread-list">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`order-modal__bubble${msg.senderIsCompany ? ' order-modal__bubble--own' : ''}`}>
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
                  placeholder={`Message ${activeClient.user.firstName}…`}
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
          </div>
        </div>
      )}

      {ticketsClient && (
        <div className="order-modal-overlay" onClick={closeTickets}>
          <div className="order-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <button className="order-modal__close" onClick={closeTickets}>×</button>
            <div className="order-modal__header">
              <div>
                <span className="order-modal__order-id">Tickets</span>
                <h2 className="order-modal__company">{ticketsClient.user.firstName} {ticketsClient.user.lastName}</h2>
                <span className="order-modal__date">{ticketsClient.user.email}</span>
              </div>
            </div>

            {isLoadingTickets ? (
              <p className="order-modal__block-text">Loading…</p>
            ) : clientTickets.length === 0 ? (
              <p className="order-modal__block-text">No tickets opened by this client yet.</p>
            ) : (
              <div className="firm-detail-modal__list">
                {clientTickets.map((ticket) => (
                  <div key={ticket.id} className="firm-detail-modal__row" style={{ cursor: 'pointer' }} onClick={() => openTicketThread(ticket.id)}>
                    <div>
                      <div className="firm-detail-modal__row-title">{ticket.subject}</div>
                      <div className="worksuite-card__meta">{new Date(ticket.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
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
      )}

      {viewingTicket && (
        <TicketThreadModal
          ticket={viewingTicket}
          onClose={() => setViewingTicket(null)}
          isCompanyView
          onSendMessage={handleTicketMessage}
          onUpdateStatus={handleUpdateTicketStatus}
        />
      )}

      {filesClient && (
        <div className="order-modal-overlay" onClick={closeFiles}>
          <div className="order-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <button className="order-modal__close" onClick={closeFiles}>×</button>
            <div className="order-modal__header">
              <div>
                <span className="order-modal__order-id">Files</span>
                <h2 className="order-modal__company">{filesClient.user.firstName} {filesClient.user.lastName}</h2>
                <span className="order-modal__date">{filesClient.user.email}</span>
              </div>
            </div>

            <div className="order-modal__section-header-row">
              <button className="worksuite-create-btn" onClick={() => fileInputRef.current?.click()}>+ Upload</button>
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

            {isLoadingFiles ? (
              <p className="order-modal__block-text">Loading…</p>
            ) : clientFiles.length === 0 ? (
              <p className="order-modal__block-text">No files uploaded for this client yet.</p>
            ) : (
              <div className="firm-detail-modal__list">
                {clientFiles.map((file) => (
                  <div key={file.id} className="firm-detail-modal__row">
                    <div>
                      <div className="firm-detail-modal__row-title">{file.name}</div>
                      <div className="worksuite-card__meta">
                        {formatBytes(file.size)} · {file.uploadedByCompany ? 'You' : `${filesClient.user.firstName}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button className="worksuite-btn" onClick={() => handleDownloadFile(file)}>Download</button>
                      {file.uploadedByCompany && (
                        <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDeleteFile(file)}>Delete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
};
