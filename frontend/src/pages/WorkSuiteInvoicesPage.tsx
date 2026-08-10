import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, Invoice, Client } from '@/services/workSuiteService';
import './WorkSuite.css';

type StatusFilter = 'ALL' | Invoice['status'];

export const WorkSuiteInvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';
  const [searchParams] = useSearchParams();
  const clientIdFilter = searchParams.get('clientId') || '';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [invoiceList, clientList] = await Promise.all([
        workSuiteService.listInvoices(),
        workSuiteService.listClients(),
      ]);
      setInvoices(invoiceList);
      setClients(clientList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setAmount('');
    setCurrency('USD');
    setClientId(clientIdFilter || '');
    setDueDate('');
    setError(null);
    setShowModal(true);
  };

  const openEdit = (invoice: Invoice) => {
    setEditing(invoice);
    setTitle(invoice.title);
    setAmount(String(invoice.amount));
    setCurrency(invoice.currency);
    setClientId(invoice.clientId || '');
    setDueDate(invoice.dueDate ? invoice.dueDate.slice(0, 10) : '');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    const amountNum = Number(amount);
    if (!title.trim() || !amount || Number.isNaN(amountNum) || amountNum <= 0) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        amount: amountNum,
        currency,
        clientId: clientId || undefined,
        dueDate: dueDate || undefined,
      };
      if (editing) {
        await workSuiteService.updateInvoice(editing.id, payload);
      } else {
        await workSuiteService.createInvoice(payload);
      }
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that invoice — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const setStatus = async (invoice: Invoice, status: Invoice['status']) => {
    await workSuiteService.updateInvoiceStatus(invoice.id, status);
    await load();
  };

  const handleDelete = async (invoice: Invoice) => {
    await workSuiteService.deleteInvoice(invoice.id);
    await load();
  };

  const filtered = invoices
    .filter((i) => (clientIdFilter ? i.clientId === clientIdFilter : true))
    .filter((i) => (filter === 'ALL' ? true : i.status === filter));
  const filterClientName = clients.find((c) => c.id === clientIdFilter)?.name;

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Invoices</h1>
          <p className="worksuite-page__subtitle">
            {filterClientName ? `Filtered to client: ${filterClientName}` : 'Bill clients and track what is owed.'}
          </p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div className="worksuite-page__header-row">
          <div className="worksuite-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
            {(['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                className={`worksuite-tab${filter === s ? ' worksuite-tab--active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <button className="worksuite-create-btn" onClick={openCreate}>+ New Invoice</button>
        </div>

        <div className="worksuite-table-wrap">
          <table className="worksuite-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Title</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="worksuite-table__muted">Loading invoices…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="worksuite-table__muted">No invoices yet — create one to start billing.</td></tr>
              ) : (
                filtered.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.title}</td>
                    <td className="worksuite-table__muted">{invoice.client?.name || '—'}</td>
                    <td>{invoice.currency} {invoice.amount.toLocaleString()}</td>
                    <td className="worksuite-table__muted">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`worksuite-badge worksuite-badge--${invoice.status.toLowerCase()}`}>{invoice.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {invoice.status === 'DRAFT' && (
                          <button className="worksuite-btn" onClick={() => setStatus(invoice, 'SENT')}>Send</button>
                        )}
                        {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                          <button className="worksuite-btn worksuite-btn--primary" onClick={() => setStatus(invoice, 'PAID')}>Mark Paid</button>
                        )}
                        <button className="worksuite-btn" onClick={() => openEdit(invoice)}>Edit</button>
                        <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDelete(invoice)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Invoice' : 'New Invoice'}</h2>
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Web design services" maxLength={160} />
            <label>Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label>Amount</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="2500" />
            <label>Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            <label>Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="worksuite-modal__submit"
                onClick={handleSave}
                disabled={!title.trim() || !amount || Number(amount) <= 0 || isSaving}
              >
                {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
