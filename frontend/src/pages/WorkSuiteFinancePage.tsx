import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaidLink } from 'react-plaid-link';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { ThemedSelect } from '@/components/ui/ThemedSelect';
import { ThemedDatePicker } from '@/components/ui/ThemedDatePicker';
import { workSuiteService, BankConnection, BankTransaction, ManualOrder, ManualOrderType, ManualOrderStatus } from '@/services/workSuiteService';
import { storeService, Order } from '@/services/storeService';
import { IconClose, IconDownload, IconCard, IconEdit } from '@/components/ui/Icons';
import './WorkSuite.css';

type PageView = 'tracker' | 'orders' | 'bank';

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

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderDocuments, setOrderDocuments] = useState<Record<string, { id: string; name: string }[]>>({});
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const [manualOrders, setManualOrders] = useState<ManualOrder[]>([]);
  const [isLoadingManualOrders, setIsLoadingManualOrders] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ManualOrder | null>(null);
  const [orderType, setOrderType] = useState<ManualOrderType>('ORDER');
  const [orderVendor, setOrderVendor] = useState('');
  const [orderDescription, setOrderDescription] = useState('');
  const [orderAmount, setOrderAmount] = useState('');
  const [orderCurrency, setOrderCurrency] = useState('USD');
  const [orderStatus, setOrderStatus] = useState<ManualOrderStatus>('PENDING');
  const [orderDate, setOrderDate] = useState('');
  const [orderTrackingNumber, setOrderTrackingNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [bankConnections, setBankConnections] = useState<BankConnection[]>([]);
  const [isLoadingBank, setIsLoadingBank] = useState(true);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [plaidConfigured, setPlaidConfigured] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isConnectingBank, setIsConnectingBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [txnAccountFilter, setTxnAccountFilter] = useState('ALL');

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      setOrders(await storeService.getUserOrders());
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadManualOrders = async () => {
    setIsLoadingManualOrders(true);
    try {
      setManualOrders(await workSuiteService.listManualOrders());
    } finally {
      setIsLoadingManualOrders(false);
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
      loadOrders();
      loadManualOrders();
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

  const openCreateOrder = () => {
    setEditingOrder(null);
    setOrderType('ORDER');
    setOrderVendor('');
    setOrderDescription('');
    setOrderAmount('');
    setOrderCurrency('USD');
    setOrderStatus('PENDING');
    setOrderDate(new Date().toISOString().slice(0, 10));
    setOrderTrackingNumber('');
    setOrderNotes('');
    setOrderError(null);
    setShowOrderModal(true);
  };

  const openEditOrder = (order: ManualOrder) => {
    setEditingOrder(order);
    setOrderType(order.type);
    setOrderVendor(order.vendor);
    setOrderDescription(order.description || '');
    setOrderAmount(String(order.amount));
    setOrderCurrency(order.currency);
    setOrderStatus(order.status);
    setOrderDate(order.date.slice(0, 10));
    setOrderTrackingNumber(order.trackingNumber || '');
    setOrderNotes(order.notes || '');
    setOrderError(null);
    setShowOrderModal(true);
  };

  const handleSaveOrder = async () => {
    const amountNum = parseFloat(orderAmount);
    if (!orderVendor.trim() || !orderDate || Number.isNaN(amountNum) || amountNum <= 0) return;
    setIsSavingOrder(true);
    setOrderError(null);
    try {
      const payload = {
        type: orderType,
        vendor: orderVendor.trim(),
        description: orderDescription.trim() || undefined,
        amount: amountNum,
        currency: orderCurrency.trim() || 'USD',
        status: orderStatus,
        date: orderDate,
        trackingNumber: orderTrackingNumber.trim() || undefined,
        notes: orderNotes.trim() || undefined,
      };
      if (editingOrder) {
        await workSuiteService.updateManualOrder(editingOrder.id, payload);
      } else {
        await workSuiteService.createManualOrder(payload);
      }
      setShowOrderModal(false);
      await loadManualOrders();
    } catch {
      setOrderError('Something went wrong saving that — try again.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDeleteOrder = async (order: ManualOrder) => {
    setManualOrders((prev) => prev.filter((o) => o.id !== order.id));
    try {
      await workSuiteService.deleteManualOrder(order.id);
    } catch {
      await loadManualOrders();
    }
  };

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

  const holdings = useMemo(() => {
    const totalExposure = allBankAccounts.reduce((sum, a) => sum + Math.abs(a.currentBalance ?? 0), 0);
    return [...allBankAccounts]
      .sort((a, b) => Math.abs(b.currentBalance ?? 0) - Math.abs(a.currentBalance ?? 0))
      .map((a) => ({
        ...a,
        weight: totalExposure > 0 ? (Math.abs(a.currentBalance ?? 0) / totalExposure) * 100 : 0,
        isDebt: a.type === 'credit' || a.type === 'loan',
      }));
  }, [allBankAccounts]);

  const spendingByCategory = useMemo(() => {
    const now = new Date();
    const byCategory = new Map<string, number>();
    for (const t of bankTransactions) {
      const d = new Date(t.date);
      if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth() || t.amount <= 0) continue;
      const key = t.category || 'Other';
      byCategory.set(key, (byCategory.get(key) || 0) + t.amount);
    }
    const rows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = rows.length ? rows[0][1] : 0;
    return rows.map(([category, amount]) => ({ category, amount, pct: max > 0 ? (amount / max) * 100 : 0 }));
  }, [bankTransactions]);

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
          <div className="worksuite-ticker-hero">
            <span className="worksuite-ticker-hero__label">Net worth</span>
            <span className={`worksuite-ticker-hero__value${netWorth.net < 0 ? ' worksuite-ticker--down' : ' worksuite-ticker--up'}`}>
              {formatCurrency(netWorth.net)}
            </span>
          </div>
        )}

        {!isLoadingBank && allBankAccounts.length > 0 && (
          <div className="worksuite-ticker-grid">
            <div className="worksuite-ticker-tile">
              <span className="worksuite-ticker-tile__label">Total assets</span>
              <span className="worksuite-ticker-tile__value worksuite-ticker--up">{formatCurrency(netWorth.assets)}</span>
            </div>
            <div className="worksuite-ticker-tile">
              <span className="worksuite-ticker-tile__label">Total debt</span>
              <span className="worksuite-ticker-tile__value worksuite-ticker--down">{formatCurrency(netWorth.debt)}</span>
            </div>
            <div className="worksuite-ticker-tile">
              <span className="worksuite-ticker-tile__label">Bank spend this month</span>
              <span className="worksuite-ticker-tile__value worksuite-ticker--down">{formatCurrency(bankSpendThisMonth)}</span>
            </div>
          </div>
        )}

        {holdings.length > 0 ? (
          <div className="worksuite-trader-row">
            <div className="worksuite-bank-card worksuite-holdings-card">
              <div className="worksuite-bank-card__header" style={{ border: 'none', paddingBottom: 0 }}>
                <h3 className="worksuite-bank-card__title">Holdings</h3>
              </div>
              <div className="worksuite-holdings-table">
                <div className="worksuite-holdings-row worksuite-holdings-row--head">
                  <span>Account</span>
                  <span>Type</span>
                  <span>Weight</span>
                  <span>Balance</span>
                </div>
                {holdings.map((h) => (
                  <div key={h.id} className="worksuite-holdings-row">
                    <span className="worksuite-holdings-row__name">{h.name}{h.mask ? ` ••••${h.mask}` : ''}</span>
                    <span className="worksuite-holdings-row__type">{ACCOUNT_TYPE_LABELS[h.type] || h.type}</span>
                    <span className="worksuite-holdings-row__weight">
                      <span className="worksuite-holdings-row__bar"><span style={{ width: `${h.weight}%`, background: h.isDebt ? '#a2504b' : '#3f6f47' }} /></span>
                      {h.weight.toFixed(1)}%
                    </span>
                    <span className={`worksuite-holdings-row__balance${h.isDebt ? ' worksuite-ticker--down' : ' worksuite-ticker--up'}`}>
                      {formatCurrency(h.currentBalance ?? 0, h.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="worksuite-bank-card worksuite-leaderboard-card">
              <div className="worksuite-bank-card__header" style={{ border: 'none', paddingBottom: 0 }}>
                <h3 className="worksuite-bank-card__title">Top spending (mo)</h3>
              </div>
              {spendingByCategory.length === 0 ? (
                <p className="worksuite-jobs-profile-empty">No spending this month yet.</p>
              ) : (
                <div className="worksuite-leaderboard-list">
                  {spendingByCategory.map((row) => (
                    <div key={row.category} className="worksuite-leaderboard-row">
                      <div className="worksuite-leaderboard-row__top">
                        <span className="worksuite-leaderboard-row__label">{row.category}</span>
                        <span className="worksuite-leaderboard-row__value worksuite-ticker--down">{formatCurrency(row.amount)}</span>
                      </div>
                      <span className="worksuite-leaderboard-row__bar"><span style={{ width: `${row.pct}%` }} /></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          !isLoadingBank && (
            <div className="worksuite-empty worksuite-empty--goals">
              <p>Connect a bank account to see your overview here.</p>
              <button className="worksuite-create-btn" onClick={() => setView('bank')}>Go to Bank Accounts</button>
            </div>
          )
        )}
        </>
        )}

        {view === 'orders' && (
          <div className="worksuite-jobs-feed">
            <div className="worksuite-page__header-row">
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--tech-text-main)' }}>Manually logged</h3>
              <button className="worksuite-create-btn" onClick={openCreateOrder}>+ New Order/Invoice</button>
            </div>

            {isLoadingManualOrders ? (
              <div className="worksuite-empty">Loading…</div>
            ) : manualOrders.length === 0 ? (
              <div className="worksuite-empty worksuite-empty--goals">
                <p>Nothing logged yet — add an order or invoice from outside Ornave.</p>
                <button className="worksuite-create-btn" onClick={openCreateOrder}>+ New Order/Invoice</button>
              </div>
            ) : (
              manualOrders.map((order) => {
                const statusColor = order.status === 'PAID' ? '#3f6f47' : order.status === 'CANCELLED' ? '#a2504b' : '#c6a15b';
                return (
                  <div key={order.id} className="worksuite-job-post" style={{ borderLeft: `4px solid ${statusColor}` }}>
                    <div className="worksuite-job-post__top">
                      <div>
                        <h3 className="worksuite-job-post__role">{order.vendor}</h3>
                        <p className="worksuite-job-post__company">{order.type === 'INVOICE' ? 'Invoice' : 'Order'}{order.description ? ` · ${order.description}` : ''}</p>
                      </div>
                      <span className="worksuite-job-post__badge" style={{ background: statusColor, color: '#14140f' }}>
                        {formatCurrency(order.amount, order.currency)}
                      </span>
                    </div>

                    <div className="worksuite-job-post__meta">
                      <span>{new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>{order.status.charAt(0) + order.status.slice(1).toLowerCase()}</span>
                      {order.trackingNumber && <span>Tracking: {order.trackingNumber}</span>}
                    </div>

                    {order.notes && <p className="worksuite-job-post__notes">{order.notes}</p>}

                    <div className="worksuite-job-post__footer">
                      <div />
                      <div className="worksuite-job-post__actions">
                        <button className="worksuite-kanban-card__icon-btn" onClick={() => openEditOrder(order)} title="Edit"><IconEdit size={13} /></button>
                        <button className="worksuite-kanban-card__icon-btn" onClick={() => handleDeleteOrder(order)} title="Delete"><IconClose size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <h3 style={{ margin: '24px 0 4px', fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--tech-text-main)' }}>Ornave orders</h3>

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

      {showOrderModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingOrder ? 'Edit Order/Invoice' : 'New Order/Invoice'}</h2>

            <label>Type</label>
            <ThemedSelect
              value={orderType}
              options={[
                { value: 'ORDER', label: 'Order' },
                { value: 'INVOICE', label: 'Invoice' },
              ]}
              onChange={(v) => setOrderType(v as ManualOrderType)}
            />

            <label>Vendor</label>
            <input value={orderVendor} onChange={(e) => setOrderVendor(e.target.value)} placeholder="Acme Supplies" maxLength={200} />

            <label>Description</label>
            <input value={orderDescription} onChange={(e) => setOrderDescription(e.target.value)} placeholder="Optional details" maxLength={200} />

            <div className="worksuite-jobs-cv-form-row">
              <div>
                <label>Amount</label>
                <input type="number" min="0" step="0.01" value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label>Currency</label>
                <input value={orderCurrency} onChange={(e) => setOrderCurrency(e.target.value.toUpperCase())} placeholder="USD" maxLength={3} />
              </div>
            </div>

            <label>Date</label>
            <ThemedDatePicker value={orderDate} onChange={setOrderDate} />

            <label>Status</label>
            <ThemedSelect
              value={orderStatus}
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'PAID', label: 'Paid' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              onChange={(v) => setOrderStatus(v as ManualOrderStatus)}
            />

            <label>Tracking Number</label>
            <input value={orderTrackingNumber} onChange={(e) => setOrderTrackingNumber(e.target.value)} placeholder="Optional" maxLength={100} />

            <label>Notes</label>
            <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} rows={2} placeholder="Optional details" maxLength={500} />

            {orderError && <p className="worksuite-modal__error">{orderError}</p>}
            <div className="worksuite-modal__actions">
              {editingOrder && (
                <button
                  className="worksuite-modal__cancel"
                  style={{ color: 'var(--color-danger)', marginRight: 'auto' }}
                  onClick={async () => { await handleDeleteOrder(editingOrder); setShowOrderModal(false); }}
                >
                  Delete
                </button>
              )}
              <button className="worksuite-modal__cancel" onClick={() => setShowOrderModal(false)}>Cancel</button>
              <button
                className="worksuite-modal__submit"
                onClick={handleSaveOrder}
                disabled={!orderVendor.trim() || !orderDate || !orderAmount || Number(orderAmount) <= 0 || isSavingOrder}
              >
                {isSavingOrder ? 'Saving…' : editingOrder ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
