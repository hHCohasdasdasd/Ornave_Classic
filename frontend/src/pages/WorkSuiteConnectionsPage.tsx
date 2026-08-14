import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { networkService } from '@/services/networkService';
import { storeService, Order } from '@/services/storeService';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import { FirmConnection, FirmConnectionFile, UserProfile } from '@/types/discovery';
import './WorkSuite.css';

const getInitials = (firstName: string, lastName: string) => `${firstName[0] || ''}${lastName[0] || ''}`;

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
};

type ConnectionKind = 'people' | 'firms';

interface OpenConnection {
  id: string;
  company: { id: string; name: string; logo?: string; industry?: string; description?: string };
}

export const WorkSuiteConnectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [kind, setKind] = useState<ConnectionKind>('people');
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [firms, setFirms] = useState<FirmConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Firm detail modal
  const [detail, setDetail] = useState<OpenConnection | null>(null);
  const [isOpeningDetail, setIsOpeningDetail] = useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [files, setFiles] = useState<FirmConnectionFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{ key: string; name: string; percent: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<{ id: string; senderIsCompany: boolean; content: string; createdAt: string }[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGuest) return;
    setIsLoading(true);
    Promise.all([networkService.getRecentConnections(), networkService.getFirmConnections()])
      .then(([p, f]) => { setPeople(p); setFirms(f); })
      .finally(() => setIsLoading(false));
  }, [isGuest]);

  const viewProfile = (person: UserProfile) => {
    navigate(`/profile?view=${person.firstName.toLowerCase()}-${person.lastName.toLowerCase()}`);
  };

  const viewFirmProfile = (firm: FirmConnection) => {
    navigate(`/profile?view=${firm.id}`);
  };

  const message = (person: UserProfile) => {
    navigate(`/messages?to=${person.id}`);
  };

  const unfollowFirm = async (firm: FirmConnection) => {
    setFirms((prev) => prev.filter((f) => f.id !== firm.id));
    await networkService.unfollowFirmConnection(firm.id);
  };

  const loadDetail = async (connectionId: string, companyId: string) => {
    setIsLoadingDetail(true);
    try {
      const [ords, fls, msgs] = await Promise.all([
        storeService.getOrdersWithCompany(companyId),
        networkService.listFirmFiles(connectionId),
        networkService.getFirmMessages(connectionId),
      ]);
      setOrders(ords);
      setFiles(fls);
      setMessages(msgs);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

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

  const openFirmDetail = async (firm: FirmConnection) => {
    setError(null);
    setIsOpeningDetail(firm.id);
    try {
      const connection = await networkService.ensureFirmConnection(firm.id);
      if (!connection) {
        setError(`Can't open details for "${firm.name}" — it isn't a registered Ornave company.`);
        return;
      }
      setDetail(connection);
      await loadDetail(connection.id, connection.company.id);
    } finally {
      setIsOpeningDetail(null);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setOrders([]);
    setFiles([]);
    setMessages([]);
    setMessageDraft('');
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

  const q = search.trim().toLowerCase();
  const filteredPeople = q
    ? people.filter((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || (c.headline || '').toLowerCase().includes(q)
      )
    : people;
  const filteredFirms = q
    ? firms.filter((c) =>
        c.name.toLowerCase().includes(q) || (c.headline || '').toLowerCase().includes(q)
      )
    : firms;

  const count = kind === 'people' ? people.length : firms.length;

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Connections</h1>
          <p className="worksuite-page__subtitle">Your network — the people and firms you're connected with on Ornave.</p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div className="worksuite-tabs">
          <button className={`worksuite-tab${kind === 'people' ? ' worksuite-tab--active' : ''}`} onClick={() => setKind('people')}>
            People
          </button>
          <button className={`worksuite-tab${kind === 'firms' ? ' worksuite-tab--active' : ''}`} onClick={() => setKind('firms')}>
            Firms
          </button>
        </div>

        <div className="worksuite-page__header-row">
          <input
            className="worksuite-select"
            style={{ minWidth: '240px' }}
            placeholder={`Search ${kind}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="files-storage-total">
            {count} {kind === 'people' ? `connection${count === 1 ? '' : 's'}` : `firm${count === 1 ? '' : 's'}`}
          </span>
        </div>

        {error && <p className="worksuite-modal__error">{error}</p>}

        <div className="worksuite-grid">
          {isLoading ? (
            <div className="worksuite-empty">Loading connections…</div>
          ) : kind === 'people' ? (
            filteredPeople.length === 0 ? (
              <div className="worksuite-empty worksuite-empty--goals">
                <div className="worksuite-empty__icon">🤝</div>
                <p>{search ? 'No connections match your search.' : "You haven't connected with anyone yet."}</p>
                {!search && <button className="worksuite-create-btn" onClick={() => navigate('/network')}>Find People</button>}
              </div>
            ) : (
              filteredPeople.map((person) => (
                <div key={person.id} className="worksuite-card">
                  <div className="worksuite-card__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        className="worksuite-connection-avatar"
                        onClick={() => viewProfile(person)}
                        style={person.profilePicture ? { backgroundImage: `url(${person.profilePicture})` } : undefined}
                      >
                        {!person.profilePicture && getInitials(person.firstName, person.lastName)}
                      </div>
                      <div>
                        <div className="worksuite-card__title" style={{ cursor: 'pointer' }} onClick={() => viewProfile(person)}>
                          {person.firstName} {person.lastName}
                        </div>
                        {person.headline && <div className="worksuite-card__meta">{person.headline}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="worksuite-card__actions">
                    <button className="worksuite-btn" onClick={() => message(person)}>Message</button>
                    <button className="worksuite-btn" onClick={() => viewProfile(person)}>View Profile</button>
                  </div>
                </div>
              ))
            )
          ) : filteredFirms.length === 0 ? (
            <div className="worksuite-empty worksuite-empty--goals">
              <div className="worksuite-empty__icon">🏢</div>
              <p>{search ? 'No firms match your search.' : "You aren't connected with any firms yet."}</p>
              {!search && <button className="worksuite-create-btn" onClick={() => navigate('/firms')}>Find Firms</button>}
            </div>
          ) : (
            filteredFirms.map((firm) => (
              <div key={firm.id} className="worksuite-card">
                <div className="worksuite-card__header">
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    onClick={() => openFirmDetail(firm)}
                  >
                    <div className="worksuite-connection-avatar worksuite-connection-avatar--square">
                      {isOpeningDetail === firm.id ? '…' : '🏢'}
                    </div>
                    <div>
                      <div className="worksuite-card__title">{firm.name}</div>
                      {firm.headline && <div className="worksuite-card__meta">{firm.headline}</div>}
                      {firm.location && <div className="worksuite-card__meta">{firm.location}</div>}
                    </div>
                  </div>
                </div>
                <div className="worksuite-card__actions">
                  <button className="worksuite-btn" onClick={() => openFirmDetail(firm)}>Open</button>
                  <button className="worksuite-btn" onClick={() => viewFirmProfile(firm)}>View Profile</button>
                  <button className="worksuite-btn worksuite-btn--danger" onClick={() => unfollowFirm(firm)}>Unfollow</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {detail && (
        <div className="worksuite-modal-overlay" onClick={closeDetail}>
          <div className="worksuite-modal firm-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="firm-detail-modal__close" onClick={closeDetail}>✕</button>
            <div className="firm-detail-modal__header">
              <div className="worksuite-connection-avatar worksuite-connection-avatar--square" style={{ width: 52, height: 52, fontSize: '1.5rem' }}>
                🏢
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{detail.company.name}</h2>
                {detail.company.industry && <p style={{ margin: '2px 0 0', color: 'var(--tech-text-dim)', fontSize: '0.85rem' }}>{detail.company.industry}</p>}
              </div>
            </div>

            {isLoadingDetail ? (
              <div className="worksuite-empty">Loading…</div>
            ) : (
              <div className="firm-detail-modal__grid">
              <div className="firm-detail-modal__col">
                <div className="firm-detail-modal__section">
                  <div className="firm-detail-modal__section-header">
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

                <div className="firm-detail-modal__section">
                  <div className="firm-detail-modal__section-header">
                    <h3>Files</h3>
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

                  {files.length === 0 ? (
                    <p className="worksuite-card__meta">No files uploaded for this firm yet.</p>
                  ) : (
                    <div className="firm-detail-modal__list">
                      {files.map((file) => (
                        <div key={file.id} className="firm-detail-modal__row">
                          <div>
                            <div className="firm-detail-modal__row-title">{file.name}</div>
                            <div className="worksuite-card__meta">{formatBytes(file.size)}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button className="worksuite-btn" onClick={() => handleDownloadFile(file)}>Download</button>
                            <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDeleteFile(file)}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="firm-detail-modal__col firm-detail-modal__col--messages">
                <div className="firm-detail-modal__section">
                  <div className="firm-detail-modal__section-header">
                    <h3>Messages</h3>
                  </div>
                  <div className="order-modal__thread firm-detail-modal__thread--tall">
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
              </div>
              </div>
            )}
          </div>
        </div>
      )}

      {viewingOrder && (
        <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
      )}
    </div>
  );
};
