import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaidLink } from 'react-plaid-link';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { ThemedSelect } from '@/components/ui/ThemedSelect';
import { ThemedDatePicker } from '@/components/ui/ThemedDatePicker';
import { workSuiteService, FinanceEntry, FinanceEntryType, BankConnection, BankTransaction } from '@/services/workSuiteService';
import { storeService, Order } from '@/services/storeService';
import { IconEdit, IconClose, IconDownload, IconCard } from '@/components/ui/Icons';
import './WorkSuite.css';

type PageView = 'tracker' | 'orders' | 'bank';

type SectionFilter = 'ALL' | FinanceEntryType;

const SECTIONS: { key: SectionFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'INCOME', label: 'Income' },
  { key: 'EXPENSE', label: 'Expenses' },
];

type SortOrder = 'newest' | 'oldest' | 'amount';

function formatMoney(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrency(amount: number, currency?: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  } catch {
    return `${currency || 'USD'} ${formatMoney(amount)}`;
  }
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  depository: 'Cash',
  credit: 'Credit',
  loan: 'Loan',
  investment: 'Investment',
  other: 'Other',
};

export const WorkSuiteFinancePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [view, setView] = useState<PageView>('tracker');

  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [section, setSection] = useState<SectionFilter>('ALL');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderDocuments, setOrderDocuments] = useState<Record<string, { id: string; name: string }[]>>({});
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const [bankConnections, setBankConnections] = useState<BankConnection[]>([]);
  const [isLoadingBank, setIsLoadingBank] = useState(true);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [plaidConfigured, setPlaidConfigured] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isConnectingBank, setIsConnectingBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [txnAccountFilter, setTxnAccountFilter] = useState('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [entryType, setEntryType] = useState<FinanceEntryType>('INCOME');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDescription, setEntryDescription] = useState('');
  const [entryCategory, setEntryCategory] = useState('');
  const [entryStatus, setEntryStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [entryDate, setEntryDate] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      setEntries(await workSuiteService.listFinanceEntries());
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      setOrders(await storeService.getUserOrders());
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadBank = async () => {
    setIsLoadingBank(true);
    setIsLoadingTransactions(true);
    try {
      const [connections, status] = await Promise.all([
        workSuiteService.listBankConnections(),
        workSuiteService.getPlaidStatus(),
      ]);
      setBankConnections(connections);
      setPlaidConfigured(status.configured);
    } finally {
      setIsLoadingBank(false);
    }
    try {
      setBankTransactions(await workSuiteService.listBankTransactions(30));
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (!isGuest) {
      load();
      loadOrders();
      loadBank();
    }
  }, [isGuest]);

  const onPlaidSuccess = useCallback(async (publicToken: string | null) => {
    if (!publicToken) return;
    setIsConnectingBank(true);
    setBankError(null);
    try {
      await workSuiteService.exchangePlaidPublicToken(publicToken);
      localStorage.removeItem('plaid_oauth_link_token');
      setLinkToken(null);
      await loadBank();
    } catch {
      setBankError('Could not link that account — try again.');
    } finally {
      setIsConnectingBank(false);
    }
  }, []);

  const { open: openPlaidLink, ready: plaidLinkReady } = usePlaidLink({
    token: linkToken || '',
    onSuccess: onPlaidSuccess,
    onExit: () => {
      localStorage.removeItem('plaid_oauth_link_token');
      setLinkToken(null);
    },
  });

  useEffect(() => {
    if (linkToken && plaidLinkReady) {
      openPlaidLink();
    }
  }, [linkToken, plaidLinkReady, openPlaidLink]);

  const handleConnectBank = async () => {
    setBankError(null);
    setIsConnectingBank(true);
    try {
      const token = await workSuiteService.createPlaidLinkToken();
      // Stashed so PlaidOAuthRedirectPage can resume the flow after a
      // full-page redirect out to the bank's own login (required for
      // most European PSD2/Open Banking institutions).
      localStorage.setItem('plaid_oauth_link_token', token);
      setLinkToken(token);
    } catch {
      setBankError('Could not start bank connection — try again later.');
      setIsConnectingBank(false);
    }
  };

  const handleDisconnectBank = async (connection: BankConnection) => {
    setBankConnections((prev) => prev.filter((c) => c.id !== connection.id));
    try {
      await workSuiteService.removeBankConnection(connection.id);
    } catch {
      await loadBank();
    }
  };

  const toggleOrderExpanded = async (order: Order) => {
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(order.id);
    if (!orderDocuments[order.id]) {
      setIsLoadingDocs(true);
      try {
        const docs = await storeService.getOrderDocuments(order.id);
        setOrderDocuments((prev) => ({ ...prev, [order.id]: docs }));
      } finally {
        setIsLoadingDocs(false);
      }
    }
  };

  const handleDownloadDocument = async (order: Order, docId: string) => {
    try {
      const url = await storeService.getOrderDocumentDownloadUrl(order.id, docId);
      window.open(url, '_blank');
    } catch {
      // Best-effort — a failed link isn't worth a page-level error banner here.
    }
  };

  const openCreate = () => {
    setEditingEntry(null);
    setEntryType(section === 'EXPENSE' ? 'EXPENSE' : 'INCOME');
    setEntryAmount('');
    setEntryDescription('');
    setEntryCategory('');
    setEntryStatus('PAID');
    setEntryDate(new Date().toISOString().slice(0, 10));
    setEntryNotes('');
    setError(null);
    setShowModal(true);
  };

  const openEdit = (entry: FinanceEntry) => {
    setEditingEntry(entry);
    setEntryType(entry.type);
    setEntryAmount(String(entry.amount));
    setEntryDescription(entry.description);
    setEntryCategory(entry.category || '');
    setEntryStatus(entry.status);
    setEntryDate(entry.date.slice(0, 10));
    setEntryNotes(entry.notes || '');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    const amountNum = parseFloat(entryAmount);
    if (!entryDescription.trim() || !entryDate || Number.isNaN(amountNum) || amountNum <= 0) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        type: entryType,
        amount: amountNum,
        description: entryDescription.trim(),
        category: entryCategory.trim() || undefined,
        status: entryType === 'INCOME' ? entryStatus : 'PAID' as const,
        date: entryDate,
        notes: entryNotes.trim() || undefined,
      };
      if (editingEntry) {
        await workSuiteService.updateFinanceEntry(editingEntry.id, payload);
      } else {
        await workSuiteService.createFinanceEntry(payload);
      }
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that entry — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entry: FinanceEntry) => {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    try {
      await workSuiteService.deleteFinanceEntry(entry.id);
    } catch {
      await load();
    }
  };

  const totals = useMemo(() => {
    const now = new Date();
    const monthEntries = entries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const income = monthEntries.filter((e) => e.type === 'INCOME').reduce((sum, e) => sum + e.amount, 0);
    const expense = monthEntries.filter((e) => e.type === 'EXPENSE').reduce((sum, e) => sum + e.amount, 0);
    return { income, expense, net: income - expense };
  }, [entries]);

  const counts = useMemo(() => {
    const c: Record<SectionFilter, number> = { ALL: entries.length, INCOME: 0, EXPENSE: 0 };
    for (const e of entries) c[e.type] += 1;
    return c;
  }, [entries]);

  const visibleEntries = useMemo(() => {
    let list = section === 'ALL' ? entries : entries.filter((e) => e.type === section);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => e.description.toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sortOrder === 'newest') sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    else if (sortOrder === 'oldest') sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    else sorted.sort((a, b) => b.amount - a.amount);
    return sorted;
  }, [entries, section, search, sortOrder]);

  const allBankAccounts = useMemo(
    () => bankConnections.flatMap((c) => c.accounts.map((a) => ({ ...a, institutionName: c.institutionName }))),
    [bankConnections]
  );

  const visibleBankTransactions = useMemo(
    () => (txnAccountFilter === 'ALL' ? bankTransactions : bankTransactions.filter((tx) => tx.accountId === txnAccountFilter)),
    [bankTransactions, txnAccountFilter]
  );

  const netWorth = useMemo(() => {
    let assets = 0;
    let debt = 0;
    for (const a of allBankAccounts) {
      const balance = a.currentBalance ?? 0;
      if (a.type === 'credit' || a.type === 'loan') debt += balance;
      else assets += balance;
    }
    return { assets, debt, net: assets - debt };
  }, [allBankAccounts]);

  const bankSpendThisMonth = useMemo(() => {
    const now = new Date();
    return bankTransactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && t.amount > 0;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [bankTransactions]);

  const recentActivity = useMemo(() => {
    const fromEntries = entries.map((e) => ({
      id: `entry-${e.id}`,
      date: e.date,
      label: e.description,
      source: 'Manual',
      amount: e.type === 'INCOME' ? e.amount : -e.amount,
      currency: undefined as string | undefined,
    }));
    const fromBank = bankTransactions.map((t) => ({
      id: `txn-${t.id}`,
      date: t.date,
      label: t.merchantName || t.name,
      source: t.institutionName || 'Bank',
      amount: -t.amount,
      currency: t.currency,
    }));
    return [...fromEntries, ...fromBank].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
  }, [entries, bankTransactions]);

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Finance</h1>
          <p className="worksuite-page__subtitle">Track what you're earning and spending.</p>
        </div>
      </div>

      <div className="worksuite-page__container worksuite-page__container--wide">
        <div className="worksuite-tabs">
          <button className={`worksuite-tab${view === 'tracker' ? ' worksuite-tab--active' : ''}`} onClick={() => setView('tracker')}>Overview</button>
          <button className={`worksuite-tab${view === 'orders' ? ' worksuite-tab--active' : ''}`} onClick={() => setView('orders')}>Orders &amp; Invoices</button>
          <button className={`worksuite-tab${view === 'bank' ? ' worksuite-tab--active' : ''}`} onClick={() => setView('bank')}>Bank Accounts</button>
        </div>

        {view === 'tracker' && (
        <>
        {!isLoadingBank && allBankAccounts.length > 0 && (
          <div className="goal-stats-strip">
            <div className="goal-stats-strip__item">
              <span className="goal-stats-strip__value">{formatCurrency(netWorth.net)}</span>
              <span className="goal-stats-strip__label">Net worth</span>
            </div>
            <div className="goal-stats-strip__item">
              <span className="goal-stats-strip__value" style={{ color: '#3f6f47' }}>{formatCurrency(netWorth.assets)}</span>
              <span className="goal-stats-strip__label">Total assets</span>
            </div>
            <div className="goal-stats-strip__item">
              <span className="goal-stats-strip__value" style={{ color: '#a2504b' }}>{formatCurrency(netWorth.debt)}</span>
              <span className="goal-stats-strip__label">Total debt</span>
            </div>
            <div className="goal-stats-strip__item">
              <span className="goal-stats-strip__value" style={{ color: '#a2504b' }}>{formatCurrency(bankSpendThisMonth)}</span>
              <span className="goal-stats-strip__label">Bank spend this month</span>
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="goal-stats-strip">
            <div className="goal-stats-strip__item">
              <span className="goal-stats-strip__value" style={{ color: '#3f6f47' }}>${formatMoney(totals.income)}</span>
              <span className="goal-stats-strip__label">Manual income this month</span>
            </div>
            <div className="goal-stats-strip__item">
              <span className="goal-stats-strip__value" style={{ color: '#a2504b' }}>${formatMoney(totals.expense)}</span>
              <span className="goal-stats-strip__label">Manual expenses this month</span>
            </div>
            <div className="goal-stats-strip__item">
              <span className="goal-stats-strip__value">${formatMoney(totals.net)}</span>
              <span className="goal-stats-strip__label">Manual net this month</span>
            </div>
          </div>
        )}

        {recentActivity.length > 0 && (
          <div className="worksuite-bank-card" style={{ marginBottom: '20px' }}>
            <div className="worksuite-bank-card__header" style={{ border: 'none', paddingBottom: 0 }}>
              <h3 className="worksuite-bank-card__title">Recent activity</h3>
            </div>
            <div className="worksuite-bank-txn-list" style={{ marginTop: '12px' }}>
              {recentActivity.map((item) => {
                const isCredit = item.amount > 0;
                return (
                  <div key={item.id} className="worksuite-bank-txn-row">
                    <div className="worksuite-bank-txn-row__info">
                      <div className="worksuite-bank-txn-row__name">{item.label}</div>
                      <div className="worksuite-bank-txn-row__meta">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {item.source}
                      </div>
                    </div>
                    <div className={`worksuite-bank-txn-row__amount${isCredit ? ' worksuite-bank-txn-row__amount--credit' : ''}`}>
                      {isCredit ? '+' : ''}{formatCurrency(item.amount, item.currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="worksuite-page__header-row">
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--tech-text-main)' }}>Manual entries</h3>
          <button className="worksuite-create-btn" onClick={openCreate}>+ New Entry</button>
        </div>

        <div className="worksuite-jobs-layout">
          <aside className="worksuite-jobs-sidebar">
            <nav className="worksuite-jobs-nav">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  className={`worksuite-jobs-nav-item${section === s.key ? ' worksuite-jobs-nav-item--active' : ''}`}
                  onClick={() => setSection(s.key)}
                >
                  <span className="worksuite-jobs-nav-item__left"><span>{s.label}</span></span>
                  <span className="worksuite-jobs-nav-item__count">{counts[s.key]}</span>
                </button>
              ))}
            </nav>

            <div className="worksuite-jobs-filters">
              <h4>Filter</h4>
              <input
                className="input"
                placeholder="Search description or category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <ThemedSelect
                value={sortOrder}
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                  { value: 'amount', label: 'Highest amount' },
                ]}
                onChange={(v) => setSortOrder(v as SortOrder)}
              />
            </div>
          </aside>

          <div className="worksuite-jobs-feed">
            {isLoading ? (
              <div className="worksuite-empty">Loading entries…</div>
            ) : visibleEntries.length === 0 ? (
              <div className="worksuite-empty worksuite-empty--goals">
                <p>{search.trim() ? 'No entries match your search.' : 'Nothing logged yet — add your first entry.'}</p>
                <button className="worksuite-create-btn" onClick={openCreate}>+ New Entry</button>
              </div>
            ) : (
              visibleEntries.map((entry) => {
                const isIncome = entry.type === 'INCOME';
                const color = isIncome ? '#3f6f47' : '#a2504b';
                return (
                  <div key={entry.id} className="worksuite-job-post" style={{ borderLeft: `4px solid ${color}` }}>
                    <div className="worksuite-job-post__top">
                      <div>
                        <h3 className="worksuite-job-post__role">{entry.description}</h3>
                        {entry.category && <p className="worksuite-job-post__company">{entry.category}</p>}
                      </div>
                      <span className="worksuite-job-post__badge" style={{ background: color, color: '#14140f' }}>
                        {isIncome ? '+' : '−'}${formatMoney(entry.amount)}
                      </span>
                    </div>

                    <div className="worksuite-job-post__meta">
                      <span>{new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {isIncome && <span>{entry.status === 'PAID' ? 'Paid' : 'Pending'}</span>}
                    </div>

                    {entry.notes && <p className="worksuite-job-post__notes">{entry.notes}</p>}

                    <div className="worksuite-job-post__footer">
                      <div />
                      <div className="worksuite-job-post__actions">
                        <button className="worksuite-kanban-card__icon-btn" onClick={() => openEdit(entry)} title="Edit"><IconEdit size={13} /></button>
                        <button className="worksuite-kanban-card__icon-btn" onClick={() => handleDelete(entry)} title="Delete"><IconClose size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        </>
        )}

        {view === 'orders' && (
          <div className="worksuite-jobs-feed">
            {isLoadingOrders ? (
              <div className="worksuite-empty">Loading orders…</div>
            ) : orders.length === 0 ? (
              <div className="worksuite-empty worksuite-empty--goals">
                <p>No orders yet — anything you buy through Ornave shows up here.</p>
              </div>
            ) : (
              orders.map((order) => {
                const statusColor = order.status === 'DELIVERED' || order.status === 'COMPLETED'
                  ? '#3f6f47'
                  : order.status === 'CANCELLED'
                    ? '#a2504b'
                    : '#c6a15b';
                const isExpanded = expandedOrderId === order.id;
                const docs = orderDocuments[order.id] || [];
                return (
                  <div key={order.id} className="worksuite-job-post" style={{ borderLeft: `4px solid ${statusColor}` }}>
                    <div className="worksuite-job-post__top">
                      <div>
                        <h3 className="worksuite-job-post__role">{order.company?.name || 'Unknown company'}</h3>
                        <p className="worksuite-job-post__company">{order.items.length} item{order.items.length === 1 ? '' : 's'}</p>
                      </div>
                      <span className="worksuite-job-post__badge" style={{ background: statusColor, color: '#14140f' }}>
                        {order.currency} {formatMoney(order.totalAmount)}
                      </span>
                    </div>

                    <div className="worksuite-job-post__meta">
                      <span>{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>{order.status.charAt(0) + order.status.slice(1).toLowerCase()}</span>
                      {order.trackingNumber && <span>Tracking: {order.trackingNumber}</span>}
                    </div>

                    <div className="worksuite-job-post__footer">
                      <button className="worksuite-btn" onClick={() => toggleOrderExpanded(order)}>
                        {isExpanded ? 'Hide details' : 'View items & documents'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--tech-border)' }}>
                        <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--tech-text-dim)', margin: '0 0 8px' }}>Items</p>
                        {order.items.map((item) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--tech-text-dim)', marginBottom: '4px' }}>
                            <span>{item.product?.name || 'Item'} × {item.quantity}</span>
                            <span>{order.currency} {formatMoney(item.price * item.quantity)}</span>
                          </div>
                        ))}

                        <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--tech-text-dim)', margin: '14px 0 8px' }}>Documents</p>
                        {isLoadingDocs && !orderDocuments[order.id] ? (
                          <p className="worksuite-jobs-profile-empty">Loading…</p>
                        ) : docs.length === 0 ? (
                          <p className="worksuite-jobs-profile-empty">No invoices or receipts attached to this order.</p>
                        ) : (
                          <div className="worksuite-jobs-doc-list">
                            {docs.map((doc) => (
                              <div key={doc.id} className="worksuite-jobs-doc-row">
                                <div className="worksuite-jobs-doc-row__info">
                                  <div className="worksuite-jobs-doc-row__name">{doc.name}</div>
                                </div>
                                <div className="worksuite-jobs-doc-row__actions">
                                  <button className="worksuite-kanban-card__icon-btn" onClick={() => handleDownloadDocument(order, doc.id)} title="Download"><IconDownload size={13} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {view === 'bank' && (
          <div className="worksuite-jobs-feed">
            <div className="worksuite-page__header-row">
              <div />
              <button
                className="worksuite-create-btn"
                onClick={handleConnectBank}
                disabled={!plaidConfigured || isConnectingBank}
              >
                {isConnectingBank ? 'Connecting…' : '+ Connect Bank'}
              </button>
            </div>

            {bankError && <p className="worksuite-modal__error">{bankError}</p>}
            {!plaidConfigured && !isLoadingBank && (
              <div className="worksuite-empty worksuite-empty--goals">
                <p>Bank connections aren't available right now — try again later.</p>
              </div>
            )}

            {isLoadingBank ? (
              <div className="worksuite-empty">Loading bank accounts…</div>
            ) : bankConnections.length === 0 ? (
              plaidConfigured && (
                <div className="worksuite-empty worksuite-empty--goals">
                  <p>No bank accounts connected yet — link one to see balances and transactions here.</p>
                  <button className="worksuite-create-btn" onClick={handleConnectBank} disabled={isConnectingBank}>
                    {isConnectingBank ? 'Connecting…' : '+ Connect Bank'}
                  </button>
                </div>
              )
            ) : (
              bankConnections.map((connection) => (
                <div key={connection.id} className="worksuite-bank-card">
                  <div className="worksuite-bank-card__header">
                    <div>
                      <h3 className="worksuite-bank-card__title">{connection.institutionName || 'Connected bank'}</h3>
                      <span className="worksuite-bank-card__count">{connection.accounts.length} account{connection.accounts.length === 1 ? '' : 's'}</span>
                    </div>
                    <button className="worksuite-bank-card__disconnect" onClick={() => handleDisconnectBank(connection)}>
                      <IconClose size={12} /> Disconnect
                    </button>
                  </div>

                  <div className="worksuite-bank-account-list">
                    {connection.accounts.map((account) => (
                      <div key={account.id} className="worksuite-bank-account-row">
                        <div className="worksuite-bank-account-row__icon"><IconCard size={15} /></div>
                        <div className="worksuite-bank-account-row__info">
                          <div className="worksuite-bank-account-row__name">
                            {account.name}
                            {account.mask && <span className="worksuite-bank-account-row__mask">••••{account.mask}</span>}
                          </div>
                          <div className="worksuite-bank-account-row__type">{ACCOUNT_TYPE_LABELS[account.type] || account.type}{account.subtype ? ` · ${account.subtype}` : ''}</div>
                        </div>
                        <div className="worksuite-bank-account-row__balance">{formatCurrency(account.currentBalance ?? 0, account.currency)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {bankConnections.length > 0 && (
              <>
                <div className="worksuite-bank-txn-header">
                  <h4 className="worksuite-bank-txn-heading">Recent transactions</h4>
                  <ThemedSelect
                    value={txnAccountFilter}
                    options={[
                      { value: 'ALL', label: 'All accounts' },
                      ...allBankAccounts.map((a) => ({
                        value: a.plaidAccountId,
                        label: `${a.name}${a.mask ? ` ••••${a.mask}` : ''}`,
                      })),
                    ]}
                    onChange={setTxnAccountFilter}
                  />
                </div>
                {isLoadingTransactions ? (
                  <div className="worksuite-empty">Loading transactions…</div>
                ) : visibleBankTransactions.length === 0 ? (
                  <div className="worksuite-empty worksuite-empty--goals">
                    <p>{txnAccountFilter === 'ALL' ? 'No transactions in the last 30 days.' : 'No transactions for this account in the last 30 days.'}</p>
                  </div>
                ) : (
                  <div className="worksuite-bank-txn-list">
                    {visibleBankTransactions.map((tx) => {
                      // Plaid's convention: positive amount = money out, negative = money in.
                      // Flip it so spending reads as negative/red and inflows as positive/green.
                      const displayAmount = -tx.amount;
                      const isCredit = displayAmount > 0;
                      return (
                        <div key={tx.id} className="worksuite-bank-txn-row">
                          <div className="worksuite-bank-txn-row__info">
                            <div className="worksuite-bank-txn-row__name">{tx.merchantName || tx.name}</div>
                            <div className="worksuite-bank-txn-row__meta">
                              {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {tx.category ? ` · ${tx.category}` : ''}
                              {tx.pending ? ' · Pending' : ''}
                            </div>
                          </div>
                          <div className={`worksuite-bank-txn-row__amount${isCredit ? ' worksuite-bank-txn-row__amount--credit' : ''}`}>
                            {isCredit ? '+' : ''}{formatCurrency(displayAmount, tx.currency)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEntry ? 'Edit Entry' : 'New Entry'}</h2>

            <label>Type</label>
            <ThemedSelect
              value={entryType}
              options={[
                { value: 'INCOME', label: 'Income' },
                { value: 'EXPENSE', label: 'Expense' },
              ]}
              onChange={(v) => setEntryType(v as FinanceEntryType)}
            />

            <label>Description</label>
            <input value={entryDescription} onChange={(e) => setEntryDescription(e.target.value)} placeholder="Freelance invoice — Acme Corp" maxLength={200} />

            <div className="worksuite-jobs-cv-form-row">
              <div>
                <label>Amount ($)</label>
                <input type="number" min="0" step="0.01" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label>Category</label>
                <input value={entryCategory} onChange={(e) => setEntryCategory(e.target.value)} placeholder="Freelance, Rent…" maxLength={80} />
              </div>
            </div>

            <label>Date</label>
            <ThemedDatePicker value={entryDate} onChange={setEntryDate} />

            {entryType === 'INCOME' && (
              <>
                <label>Status</label>
                <ThemedSelect
                  value={entryStatus}
                  options={[
                    { value: 'PAID', label: 'Paid' },
                    { value: 'PENDING', label: 'Pending' },
                  ]}
                  onChange={(v) => setEntryStatus(v as 'PAID' | 'PENDING')}
                />
              </>
            )}

            <label>Notes</label>
            <textarea value={entryNotes} onChange={(e) => setEntryNotes(e.target.value)} rows={2} placeholder="Optional details" maxLength={500} />

            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              {editingEntry && (
                <button
                  className="worksuite-modal__cancel"
                  style={{ color: 'var(--color-danger)', marginRight: 'auto' }}
                  onClick={async () => { await handleDelete(editingEntry); setShowModal(false); }}
                >
                  Delete
                </button>
              )}
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="worksuite-modal__submit"
                onClick={handleSave}
                disabled={!entryDescription.trim() || !entryDate || !entryAmount || Number(entryAmount) <= 0 || isSaving}
              >
                {isSaving ? 'Saving…' : editingEntry ? 'Save Changes' : 'Create Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
