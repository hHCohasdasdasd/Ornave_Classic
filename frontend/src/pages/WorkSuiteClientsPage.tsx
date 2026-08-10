import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, Client } from '@/services/workSuiteService';
import './WorkSuite.css';

export const WorkSuiteClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      setClients(await workSuiteService.listClients());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setNotes('');
    setError(null);
    setShowModal(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setName(client.name);
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setCompany(client.company || '');
    setNotes(client.notes || '');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      if (editing) {
        await workSuiteService.updateClient(editing.id, payload);
      } else {
        await workSuiteService.createClient(payload);
      }
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that client — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (client: Client) => {
    await workSuiteService.deleteClient(client.id);
    await load();
  };

  const filtered = clients.filter((c) => {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return c.name.toLowerCase().includes(kw) || c.company?.toLowerCase().includes(kw) || c.email?.toLowerCase().includes(kw);
  });

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Clients</h1>
          <p className="worksuite-page__subtitle">A lightweight CRM for the people and firms you work with.</p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div className="worksuite-page__header-row">
          <input
            className="worksuite-select"
            style={{ minWidth: '240px' }}
            placeholder="Search clients…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button className="worksuite-create-btn" onClick={openCreate}>+ New Client</button>
        </div>

        <div className="worksuite-grid">
          {isLoading ? (
            <div className="worksuite-empty">Loading clients…</div>
          ) : filtered.length === 0 ? (
            <div className="worksuite-empty">No clients yet — add one to start tracking your relationships.</div>
          ) : (
            filtered.map((client) => (
              <div key={client.id} className="worksuite-card">
                <div className="worksuite-card__header">
                  <div>
                    <div className="worksuite-card__title">{client.name}</div>
                    {client.company && <div className="worksuite-card__meta">{client.company}</div>}
                  </div>
                </div>
                <p className="worksuite-card__description">
                  {client.email && <>{client.email}<br /></>}
                  {client.phone && <>{client.phone}<br /></>}
                  {client.notes || (!client.email && !client.phone ? 'No contact details yet.' : '')}
                </p>
                <div className="worksuite-card__actions">
                  <button className="worksuite-btn" onClick={() => navigate(`/work-suite/invoices?clientId=${client.id}`)}>
                    View Invoices
                  </button>
                  <button className="worksuite-btn" onClick={() => openEdit(client)}>Edit</button>
                  <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDelete(client)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Client' : 'New Client'}</h2>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" maxLength={120} />
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@acme.com" maxLength={160} />
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" maxLength={40} />
            <label>Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional" maxLength={120} />
            <label>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional notes" maxLength={500} />
            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSave} disabled={!name.trim() || isSaving}>
                {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
