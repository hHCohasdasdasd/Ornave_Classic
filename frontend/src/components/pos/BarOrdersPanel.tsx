import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePrinter } from '@/hooks/usePrinter';
import { formatPriceWithCurrency, parsePriceToNumber, computeBillPreview } from '@/utils/posBilling';
import {
  workSuiteService, OpenBarTabSummary, BarTab, BarTabItem, MenuItem, DiscountType, PaymentMethod,
  BarStoolStatus, TerminalReader,
} from '@/services/workSuiteService';
import '@/pages/WorkSuite.css';
import '@/pages/ServerOrderPage.css';

// The bar's own tab-based order screen — deliberately not tied to any
// floor-plan table/seat, unlike Server Orders. A bartender starts a tab
// under a name and orders drinks against it directly. Lives inside the Bar
// module page (WorkSuiteStationPage, station="BAR") as a mode alongside the
// live ticket board, rather than as its own separate module — this
// component owns only the content, not the page chrome (Navbar/banner),
// which the Bar module page already provides.
const TABS_POLL_MS = 6000;
const TAB_POLL_MS = 4000;
const ALL_CATEGORY = '__all__';

interface PendingLine {
  key: string;
  menuItemId: string;
  name: string;
  price: string;
  quantity: number;
  note?: string;
  checkId?: string;
}

type PanelKind = 'check-functions' | 'discount' | 'service-charge' | 'payments' | null;

export const BarOrdersPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';
  const printer = usePrinter('BAR');

  const [tabs, setTabs] = useState<OpenBarTabSummary[]>([]);
  const [isLoadingTabs, setIsLoadingTabs] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stools, setStools] = useState<BarStoolStatus[]>([]);
  const [isOpeningStool, setIsOpeningStool] = useState(false);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [tab, setTab] = useState<BarTab | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const [showNewTabForm, setShowNewTabForm] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState('');
  const [isStartingTab, setIsStartingTab] = useState(false);

  const [pending, setPending] = useState<PendingLine[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
  const [activeCheckId, setActiveCheckId] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const [panel, setPanel] = useState<PanelKind>(null);
  const [isPanelBusy, setIsPanelBusy] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);

  const [discountType, setDiscountType] = useState<DiscountType>('PERCENT');
  const [discountValue, setDiscountValue] = useState('10');
  const [discountLabel, setDiscountLabel] = useState('');
  const [serviceChargeType, setServiceChargeType] = useState<DiscountType>('PERCENT');
  const [serviceChargeValue, setServiceChargeValue] = useState('18');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [readers, setReaders] = useState<TerminalReader[]>([]);
  const [selectedReaderId, setSelectedReaderId] = useState('');
  const [readerChargeState, setReaderChargeState] = useState<'idle' | 'waiting' | 'failed'>('idle');
  const [voidReason, setVoidReason] = useState('');
  const [voidingItemId, setVoidingItemId] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const [itemModal, setItemModal] = useState<{ menuItemId: string; name: string; price: string; description?: string | null; quantity: number; note: string; editingKey?: string } | null>(null);

  const loadTabs = async () => {
    try {
      const [openTabs, stoolStatuses] = await Promise.all([
        workSuiteService.listOpenBarTabs(),
        workSuiteService.listBarStoolsWithStatus(),
      ]);
      setTabs(openTabs);
      setStools(stoolStatuses);
    } finally {
      setIsLoadingTabs(false);
    }
  };

  const loadTab = async (tabId: string) => {
    const view = await workSuiteService.getBarTab(tabId);
    setTab(view);
    if (view?.checks && view.checks.length) {
      setActiveCheckId((prev) => (prev && view.checks!.some((c) => c.id === prev) ? prev : view.checks![0].id));
    } else {
      setActiveCheckId(null);
    }
  };

  useEffect(() => {
    if (isGuest) return;
    loadTabs();
    workSuiteService.listMenuItems().then((items) => {
      setMenuItems(items.filter((i) => i.station === 'BAR'));
    });
    const interval = setInterval(loadTabs, TABS_POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  useEffect(() => {
    if (!selectedTabId || isGuest) return;
    loadTab(selectedTabId);
    const interval = setInterval(() => loadTab(selectedTabId), TAB_POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTabId, isGuest]);

  const openTab = (summary: OpenBarTabSummary) => {
    setError(null);
    setPending([]);
    setPanel(null);
    setTab(undefined);
    setSelectedTabId(summary.id);
  };

  // Clicking an occupied stool drops straight into its open tab, same as
  // clicking an occupied table does in Server Orders. Clicking an empty
  // stool starts a tab for it immediately (labeled after the stool itself)
  // and opens straight into ordering — no separate prompt, since a stool is
  // one seat, not a party size to ask about.
  const selectStool = async (stool: BarStoolStatus) => {
    setError(null);
    if (stool.active) {
      setPending([]);
      setPanel(null);
      setTab(undefined);
      setSelectedTabId(stool.active.tabId);
      return;
    }
    setIsOpeningStool(true);
    try {
      const created = await workSuiteService.startBarTab(stool.label, stool.id);
      setPending([]);
      setPanel(null);
      setTab(undefined);
      setSelectedTabId(created.tabId);
      await loadTabs();
    } catch (err: any) {
      setError(err.message || 'Could not open this stool — try again.');
    } finally {
      setIsOpeningStool(false);
    }
  };

  const openNewTabForm = () => {
    setNewTabLabel('');
    setError(null);
    setShowNewTabForm(true);
  };

  const confirmNewTab = async () => {
    if (!newTabLabel.trim()) return;
    setIsStartingTab(true);
    setError(null);
    try {
      const created = await workSuiteService.startBarTab(newTabLabel.trim());
      setPending([]);
      setPanel(null);
      setTab(undefined);
      setSelectedTabId(created.tabId);
      setShowNewTabForm(false);
      await loadTabs();
    } catch (err: any) {
      setError(err.message || 'Could not start this tab — try again.');
    } finally {
      setIsStartingTab(false);
    }
  };

  const backToTabs = () => {
    setSelectedTabId(null);
    setTab(undefined);
    setPending([]);
    setPanel(null);
    setShowActionsMenu(false);
    loadTabs();
  };

  // Tapping a tile opens a small popup for quantity + notes ("no ice",
  // "double shot") rather than adding it straight to the ticket — clicking
  // a pending (not-yet-sent) row reopens that same popup, prefilled, so it
  // can be adjusted or removed before Send.
  const openAddItemModal = (item: MenuItem) => {
    if (!tab) return;
    setItemModal({ menuItemId: item.id, name: item.name, price: item.price, description: item.description, quantity: 1, note: '' });
  };

  const openEditPendingModal = (line: PendingLine) => {
    const menuItem = menuItems.find((i) => i.id === line.menuItemId);
    setItemModal({ menuItemId: line.menuItemId, name: line.name, price: line.price, description: menuItem?.description, quantity: line.quantity, note: line.note || '', editingKey: line.key });
  };

  const confirmItemModal = () => {
    if (!itemModal) return;
    const { menuItemId, name, price, quantity, note, editingKey } = itemModal;
    const trimmedNote = note.trim();
    setPending((prev) => {
      if (editingKey) {
        return prev.map((p) => (p.key === editingKey ? { ...p, quantity, note: trimmedNote || undefined } : p));
      }
      if (!trimmedNote) {
        const idx = prev.findIndex((p) => p.menuItemId === menuItemId && p.checkId === (activeCheckId || undefined) && !p.note);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
          return next;
        }
      }
      return [...prev, { key: `${menuItemId}-${Date.now()}-${Math.random()}`, menuItemId, name, price, quantity, note: trimmedNote || undefined, checkId: activeCheckId || undefined }];
    });
    setItemModal(null);
  };

  const removeEditingPendingLine = () => {
    if (!itemModal?.editingKey) return;
    setPending((prev) => prev.filter((p) => p.key !== itemModal.editingKey));
    setItemModal(null);
  };

  const decrementPending = (key: string) => {
    setPending((prev) => prev.flatMap((p) => {
      if (p.key !== key) return [p];
      if (p.quantity <= 1) return [];
      return [{ ...p, quantity: p.quantity - 1 }];
    }));
  };

  const incrementPending = (key: string) => {
    setPending((prev) => prev.map((p) => (p.key === key ? { ...p, quantity: Math.min(20, p.quantity + 1) } : p)));
  };

  const removePendingLine = (key: string) => {
    setPending((prev) => prev.filter((p) => p.key !== key));
  };

  const clearPending = () => setPending([]);

  const handleSend = async () => {
    if (!selectedTabId || pending.length === 0) return;
    setIsSending(true);
    setError(null);
    try {
      for (const line of pending) {
        await workSuiteService.addBarTabItem(selectedTabId, { menuItemId: line.menuItemId, quantity: line.quantity, note: line.note, checkId: line.checkId });
      }
      setPending([]);
      await loadTab(selectedTabId);
      await loadTabs();
    } catch (err: any) {
      setError(err.message || 'Could not send that order — try again.');
    } finally {
      setIsSending(false);
    }
  };

  const activeBill = useMemo(() => {
    if (!tab) return null;

    const relevantPending = pending.filter((p) => (tab.checks ? p.checkId === activeCheckId : true));
    const pendingSubtotal = relevantPending.reduce((sum, p) => sum + parsePriceToNumber(p.price) * p.quantity, 0);

    if (tab.checks && tab.checks.length) {
      const check = tab.checks.find((c) => c.id === activeCheckId) || tab.checks[0];
      if (!check) return null;
      return computeBillPreview(check.subtotal + pendingSubtotal, check.discountType, check.discountValue, check.serviceChargeType, check.serviceChargeValue);
    }
    return computeBillPreview(tab.subtotal + pendingSubtotal, tab.discountType, tab.discountValue, tab.serviceChargeType, tab.serviceChargeValue);
  }, [tab, activeCheckId, pending]);

  const pendingTotal = pending.reduce((sum, p) => sum + p.quantity, 0);

  const openPanel = (kind: PanelKind) => {
    setShowActionsMenu(false);
    setPanel(kind);
    setPanelError(null);
    setVoidReason('');
    setVoidingItemId(null);
  };

  const refreshTab = async () => {
    if (selectedTabId) await loadTab(selectedTabId);
    await loadTabs();
  };

  const handleVoid = async (itemId: string) => {
    if (!selectedTabId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.voidBarTabItem(selectedTabId, itemId, voidReason.trim() || undefined);
      setVoidingItemId(null);
      setVoidReason('');
      await refreshTab();
    } catch (err: any) {
      setPanelError(err.message || 'Could not void that item.');
    } finally {
      setIsPanelBusy(false);
    }
  };

  // A quick one-tap void straight from the cart row's trash icon — same
  // endpoint as the Check Functions void flow, just without asking for a
  // reason first.
  const quickVoidItem = async (itemId: string) => {
    if (!selectedTabId) return;
    try {
      await workSuiteService.voidBarTabItem(selectedTabId, itemId, undefined);
      await refreshTab();
    } catch {
      await refreshTab();
    }
  };

  const handleCancelTab = async () => {
    if (!selectedTabId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.cancelBarTab(selectedTabId);
      setPanel(null);
      backToTabs();
    } catch (err: any) {
      setPanelError(err.message || 'Could not cancel this tab.');
      setIsPanelBusy(false);
    }
  };

  const handleSplit = async () => {
    if (!selectedTabId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.splitBarTabCheck(selectedTabId);
      await refreshTab();
      setPanel(null);
    } catch (err: any) {
      setPanelError(err.message || 'Could not split this check.');
    } finally {
      setIsPanelBusy(false);
    }
  };

  const handleAddCheck = async () => {
    if (!selectedTabId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.addBarTabCheck(selectedTabId);
      await refreshTab();
    } catch (err: any) {
      setPanelError(err.message || 'Could not add another check.');
    } finally {
      setIsPanelBusy(false);
    }
  };

  const handleMoveItem = async (itemId: string, checkId: string) => {
    if (!selectedTabId) return;
    try {
      await workSuiteService.assignBarTabItemToCheck(selectedTabId, itemId, checkId);
      await refreshTab();
    } catch {
      await refreshTab();
    }
  };

  const handleApplyDiscount = async (clear = false) => {
    if (!selectedTabId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.applyBarTabDiscount(selectedTabId, {
        type: clear ? null : discountType,
        value: clear ? undefined : Number(discountValue) || 0,
        label: clear ? undefined : discountLabel,
        checkId: tab?.checks ? activeCheckId || undefined : undefined,
      });
      await refreshTab();
      if (clear) setPanel(null);
    } catch (err: any) {
      setPanelError(err.message || 'Could not update the discount.');
    } finally {
      setIsPanelBusy(false);
    }
  };

  const handleApplyServiceCharge = async (clear = false) => {
    if (!selectedTabId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.applyBarTabServiceCharge(selectedTabId, {
        type: clear ? null : serviceChargeType,
        value: clear ? undefined : Number(serviceChargeValue) || 0,
        checkId: tab?.checks ? activeCheckId || undefined : undefined,
      });
      await refreshTab();
      if (clear) setPanel(null);
    } catch (err: any) {
      setPanelError(err.message || 'Could not update the service charge.');
    } finally {
      setIsPanelBusy(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedTabId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.recordBarTabPayment(selectedTabId, {
        method: paymentMethod,
        checkId: tab?.checks ? activeCheckId || undefined : undefined,
      });
      const stillOpenSplit = tab?.checks ? tab.checks.filter((c) => c.id !== activeCheckId).some((c) => c.paymentStatus !== 'PAID') : false;
      await refreshTab();
      if (!stillOpenSplit) {
        setPanel(null);
        backToTabs();
      }
    } catch (err: any) {
      setPanelError(err.message || 'Could not record that payment.');
    } finally {
      setIsPanelBusy(false);
    }
  };

  // Card Reader — a physical Stripe Terminal reader, for guests who won't
  // pay via Automatic Check-In. Mirrors Server Orders' flow: push a
  // PaymentIntent to the reader, poll it while the reader prompts, and
  // re-verify against Stripe before marking the tab paid.
  const loadReaders = async () => {
    try {
      const list = await workSuiteService.listTerminalReaders();
      setReaders(list);
      if (list.length === 1) setSelectedReaderId(list[0].id);
    } catch {
      setReaders([]);
    }
  };

  const handleChargeReader = async () => {
    if (!selectedTabId || !selectedReaderId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    setReaderChargeState('waiting');
    try {
      const checkId = tab?.checks ? activeCheckId || undefined : undefined;
      const { paymentIntentId } = await workSuiteService.chargeBarTabReader(selectedTabId, { readerId: selectedReaderId, checkId });

      const poll = async (): Promise<void> => {
        const { status } = await workSuiteService.getTerminalPaymentIntentStatus(paymentIntentId);
        if (status === 'succeeded') {
          const stillOpenSplit = tab?.checks ? tab.checks.filter((c) => c.id !== activeCheckId).some((c) => c.paymentStatus !== 'PAID') : false;
          await workSuiteService.completeBarTabReaderPayment(selectedTabId, { paymentIntentId, checkId });
          await refreshTab();
          setReaderChargeState('idle');
          setIsPanelBusy(false);
          if (!stillOpenSplit) {
            setPanel(null);
            backToTabs();
          }
          return;
        }
        if (status === 'canceled' || status === 'requires_payment_method') {
          setReaderChargeState('failed');
          setIsPanelBusy(false);
          return;
        }
        setTimeout(poll, 2000);
      };
      poll();
    } catch (err: any) {
      setPanelError(err.message || 'Could not send the charge to that reader.');
      setReaderChargeState('idle');
      setIsPanelBusy(false);
    }
  };

  const handleCancelReaderCharge = async () => {
    if (!selectedReaderId) return;
    try {
      await workSuiteService.cancelTerminalReaderAction(selectedReaderId);
    } catch {
      // best-effort — the reader may have already cleared on its own
    } finally {
      setReaderChargeState('idle');
      setIsPanelBusy(false);
    }
  };

  const buildReceiptLines = (items: BarTabItem[]) => items
    .filter((i) => i.status !== 'VOID')
    .map((i) => `${i.quantity}× ${i.name}  ${i.price}`);

  const handlePrint = async () => {
    if (!tab) return;
    setIsPrinting(true);
    try {
      const items = tab.checks ? (tab.checks.find((c) => c.id === activeCheckId)?.items || []) : tab.items;
      const bill = activeBill;
      await printer.print({
        header: tab.label,
        lines: [
          ...buildReceiptLines(items),
          '',
          `Subtotal: ${(bill?.subtotal || 0).toFixed(2)}`,
          ...(bill && bill.discountAmount > 0 ? [`Discount: -${bill.discountAmount.toFixed(2)}`] : []),
          ...(bill && bill.serviceChargeAmount > 0 ? [`Service Charge: ${bill.serviceChargeAmount.toFixed(2)}`] : []),
          `Total: ${(bill?.total || 0).toFixed(2)}`,
        ],
        footer: 'Thank you!',
      });
    } catch {
      // Browser printing can't fail synchronously; a thrown error here is a
      // real USB printer problem.
    } finally {
      setIsPrinting(false);
    }
  };

  const categories = Array.from(new Set(menuItems.map((i) => i.category)));
  const visibleItems = menuItems.filter((i) => {
    if (searchTerm.trim()) return i.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
    return activeCategory === ALL_CATEGORY || i.category === activeCategory;
  });

  const displayedItems: (BarTabItem | PendingLine)[] = tab
    ? [
        ...tab.items.filter((i) => i.status !== 'VOID' && (!tab.checks || i.checkId === activeCheckId)),
        ...pending.filter((p) => (tab.checks ? p.checkId === activeCheckId : true)),
      ]
    : [];

  const isPendingLine = (row: BarTabItem | PendingLine): row is PendingLine => 'key' in row;

  return (
    <>
      <div className="worksuite-page__container worksuite-page__container--full">
        {!selectedTabId ? (
          <>
            {stools.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 className="server-order-page__section-title">Bar Seating</h3>
                <div className="server-order-page__table-grid">
                  {stools.map((stool) => (
                    <button
                      key={stool.id}
                      className={`server-order-page__table-card${stool.active ? ' server-order-page__table-card--occupied' : ' server-order-page__table-card--empty'}`}
                      onClick={() => selectStool(stool)}
                      disabled={isOpeningStool}
                    >
                      <span className="server-order-page__table-status">
                        <span className="server-order-page__table-dot" />
                        {stool.active ? 'Occupied' : 'Empty'}
                      </span>
                      <span className="server-order-page__table-label">{stool.label}</span>
                      {stool.active && (
                        <span className="server-order-page__table-meta">{stool.active.itemCount} item{stool.active.itemCount === 1 ? '' : 's'} · ${stool.active.total.toFixed(2)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <h3 className="server-order-page__section-title" style={{ margin: 0 }}>Open Tabs</h3>
              <button className="worksuite-create-btn" onClick={openNewTabForm}>+ New Tab</button>
            </div>
            {error && <p className="pos__error">{error}</p>}
            {isLoadingTabs ? (
              <p className="server-order-page__hint">Loading…</p>
            ) : tabs.length === 0 ? (
              <p className="server-order-page__hint">No open tabs right now.</p>
            ) : (
              <div className="server-order-page__table-grid">
                {tabs.map((t) => (
                  <button key={t.id} className="server-order-page__table-card server-order-page__table-card--occupied" onClick={() => openTab(t)}>
                    <span className="server-order-page__table-status">
                      <span className="server-order-page__table-dot" />
                      Open
                    </span>
                    <span className="server-order-page__table-label">{t.label}</span>
                    <span className="server-order-page__table-meta">{t.itemCount} item{t.itemCount === 1 ? '' : 's'} · ${t.total.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : tab === undefined ? (
          <div className="worksuite-empty">Loading tab…</div>
        ) : tab === null ? (
          <div className="worksuite-empty">This tab just closed — go back to start a new one.</div>
        ) : (
          <div className="pos">
            {tab.status !== 'OPEN' && <span className="pos__status-tag">{tab.status}</span>}

            <div className="pos__layout">
              <main className="pos__main">
                <div className="pos__main-header">
                  <h2>New Order</h2>
                  <button className="worksuite-breadcrumb" onClick={backToTabs}>← Tabs</button>
                </div>

                <div className="pos__meta-row">
                  <div className="pos__meta-field">
                    <label>Tab</label>
                    <div className="pos__meta-value">{tab.label}</div>
                  </div>
                  <div className="pos__meta-field">
                    <label>Server</label>
                    <div className="pos__meta-value">{user?.firstName} {user?.lastName}</div>
                  </div>
                </div>

                <div className="pos__search-row">
                  <span className="pos__search-icon">🔍</span>
                  <input className="pos__search" type="text" placeholder="Search drinks…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="pos__categories">
                  <button
                    className={`pos__category-tab${activeCategory === ALL_CATEGORY && !searchTerm ? ' pos__category-tab--active' : ''}`}
                    onClick={() => { setActiveCategory(ALL_CATEGORY); setSearchTerm(''); }}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`pos__category-tab${cat === activeCategory && !searchTerm ? ' pos__category-tab--active' : ''}`}
                      onClick={() => { setActiveCategory(cat); setSearchTerm(''); }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {error && <p className="pos__error">{error}</p>}
                <div className="pos__tiles">
                  {visibleItems.map((item) => (
                    <button
                      key={item.id}
                      className={`pos__tile${!item.isAvailable ? ' pos__tile--unavailable' : ''}`}
                      onClick={() => openAddItemModal(item)}
                      disabled={!item.isAvailable}
                    >
                      <div>
                        <div className="pos__tile-name">{item.name}</div>
                        {item.description && <div className="pos__tile-desc">{item.description}</div>}
                      </div>
                      <div className="pos__tile-bottom">
                        {item.isAvailable ? (
                          <>
                            <span className="pos__tile-price">{item.price}</span>
                            <span className="pos__tile-plus">+</span>
                          </>
                        ) : (
                          <span className="pos__tile-unavailable-tag">Unavailable</span>
                        )}
                      </div>
                    </button>
                  ))}
                  {visibleItems.length === 0 && <p className="server-order-page__hint">No drinks here.</p>}
                </div>
              </main>

              <aside className="pos__cart">
                <div className="pos__cart-header">
                  <h3>Current Order</h3>
                  {pending.length > 0 && <button className="pos__clear-btn" onClick={clearPending}>Clear</button>}
                </div>

                {tab.checks && tab.checks.length > 0 && (
                  <div className="pos__check-tabs">
                    {tab.checks.map((check) => (
                      <button
                        key={check.id}
                        className={`pos__check-tab${check.id === activeCheckId ? ' pos__check-tab--active' : ''}${check.paymentStatus === 'PAID' ? ' pos__check-tab--paid' : ''}`}
                        onClick={() => setActiveCheckId(check.id)}
                      >
                        {check.label}{check.paymentStatus === 'PAID' ? ' ✓' : ''}
                      </button>
                    ))}
                    <button className="pos__check-tab pos__check-tab--add" onClick={handleAddCheck}>+</button>
                  </div>
                )}

                <div className="pos__cart-items">
                  {displayedItems.length === 0 ? (
                    <p className="server-order-page__hint">Nothing on this check yet.</p>
                  ) : (
                    displayedItems.map((row) => {
                      if (isPendingLine(row)) {
                        return (
                          <div key={row.key} className="pos__cart-item">
                            <div className="pos__cart-item-stepper">
                              <button onClick={() => decrementPending(row.key)}>−</button>
                              <span className="pos__cart-item-qty">{row.quantity}</span>
                              <button onClick={() => incrementPending(row.key)}>+</button>
                            </div>
                            <div className="pos__cart-item-info">
                              <button className="pos__cart-item-name" onClick={() => openEditPendingModal(row)}>{row.name}</button>
                              {row.note && <div className="pos__cart-item-note">{row.note}</div>}
                            </div>
                            <span className="pos__cart-item-price">{row.price}</span>
                            <button className="pos__cart-item-trash" onClick={() => removePendingLine(row.key)} title="Remove">🗑</button>
                          </div>
                        );
                      }
                      return (
                        <div key={row.id} className="pos__cart-item">
                          <span className="pos__cart-item-qty">{row.quantity}×</span>
                          <div className="pos__cart-item-info">
                            <span className="pos__cart-item-name" style={{ cursor: 'default' }}>{row.name}</span>
                            {row.note && <div className="pos__cart-item-note">{row.note}</div>}
                            {tab.checks && tab.checks.length > 1 && (
                              <select
                                className="pos__cart-item-move"
                                value={row.checkId || ''}
                                onChange={(e) => handleMoveItem(row.id, e.target.value)}
                              >
                                {tab.checks.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                              </select>
                            )}
                          </div>
                          <span className="pos__cart-item-price">{row.price}</span>
                          <button className="pos__cart-item-trash" onClick={() => quickVoidItem(row.id)} title="Void">🗑</button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pos__cart-footer">
                  <button className="pos__cart-line" onClick={() => openPanel('service-charge')}>
                    <span>Subtotal</span><span>{(activeBill?.subtotal || 0).toFixed(2)}</span>
                  </button>
                  {activeBill && activeBill.discountAmount > 0 ? (
                    <button className="pos__cart-line" onClick={() => openPanel('discount')}>
                      <span>Discount</span><span>-{activeBill.discountAmount.toFixed(2)}</span>
                    </button>
                  ) : (
                    <button className="pos__cart-line" onClick={() => openPanel('discount')}>
                      <span>+ Add Discount</span><span></span>
                    </button>
                  )}
                  {activeBill && activeBill.serviceChargeAmount > 0 && (
                    <button className="pos__cart-line" onClick={() => openPanel('service-charge')}>
                      <span>Service Charge</span><span>{activeBill.serviceChargeAmount.toFixed(2)}</span>
                    </button>
                  )}
                  <div className="pos__cart-total"><span>Total Due</span><span>{(activeBill?.total || 0).toFixed(2)}</span></div>
                  {pendingTotal > 0 && <div className="pos__cart-pending-note">{pendingTotal} item{pendingTotal === 1 ? '' : 's'} not sent yet</div>}
                </div>

                <button className="pos__send-btn" onClick={handleSend} disabled={isSending || pending.length === 0}>
                  {isSending ? 'Sending…' : `Send to Bar${pendingTotal ? ` (${pendingTotal})` : ''}`}
                </button>
                <button className="pos__print-btn" onClick={handlePrint} disabled={isPrinting}>
                  {isPrinting ? 'Printing…' : '🖨 Print Receipt'}
                </button>

                <div className="pos__cart-footer-bar">
                  <span className="pos__cart-footer-label">🍸 {tab.label}</span>
                  <button className="pos__cart-menu-btn" onClick={() => setShowActionsMenu((v) => !v)}>⋮</button>
                  {showActionsMenu && (
                    <div className="pos__cart-menu">
                      <button onClick={() => openPanel('check-functions')}>Check Functions</button>
                      <button onClick={() => openPanel('discount')}>Discounts</button>
                      <button onClick={() => openPanel('service-charge')}>Service Charges</button>
                      <button onClick={() => openPanel('payments')}>Payments</button>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>

      {itemModal && (
        <div className="worksuite-modal-overlay" onClick={() => setItemModal(null)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-item-modal__header">
              <h2>{itemModal.name}</h2>
              <span className="pos-item-modal__price">{formatPriceWithCurrency(itemModal.price)}</span>
            </div>
            {itemModal.description && <p className="server-order-page__hint">{itemModal.description}</p>}

            <label>Quantity</label>
            <div className="pos__stepper" style={{ justifyContent: 'flex-start', marginBottom: '14px' }}>
              <button onClick={() => setItemModal((m) => (m ? { ...m, quantity: Math.max(1, m.quantity - 1) } : m))}>−</button>
              <span>{itemModal.quantity}</span>
              <button onClick={() => setItemModal((m) => (m ? { ...m, quantity: Math.min(20, m.quantity + 1) } : m))}>+</button>
            </div>

            <label>Notes (optional)</label>
            <textarea
              rows={3}
              value={itemModal.note}
              onChange={(e) => setItemModal((m) => (m ? { ...m, note: e.target.value } : m))}
              placeholder="e.g. no ice, double shot"
              maxLength={200}
            />

            <div className="worksuite-modal__actions">
              {itemModal.editingKey && (
                <button className="worksuite-modal__cancel" style={{ color: 'var(--color-danger)' }} onClick={removeEditingPendingLine}>Remove</button>
              )}
              <button className="worksuite-modal__cancel" onClick={() => setItemModal(null)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={confirmItemModal}>
                {itemModal.editingKey ? 'Update' : 'Add to Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewTabForm && (
        <div className="worksuite-modal-overlay" onClick={() => !isStartingTab && setShowNewTabForm(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Start a New Tab</h2>
            {error && <p className="pos__error">{error}</p>}
            <label>Name on the tab</label>
            <input
              type="text"
              autoFocus
              value={newTabLabel}
              onChange={(e) => setNewTabLabel(e.target.value)}
              placeholder="e.g. Smith, or Table by the window"
              maxLength={100}
              onKeyDown={(e) => e.key === 'Enter' && confirmNewTab()}
            />
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowNewTabForm(false)} disabled={isStartingTab}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={confirmNewTab} disabled={isStartingTab || !newTabLabel.trim()}>
                {isStartingTab ? 'Starting…' : 'Start Tab'}
              </button>
            </div>
          </div>
        </div>
      )}

      {panel && tab && (
        <div className="worksuite-modal-overlay" onClick={() => setPanel(null)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            {panel === 'check-functions' && (
              <>
                <h2>Check Functions</h2>
                {panelError && <p className="worksuite-modal__error">{panelError}</p>}

                <div className="pos__panel-section">
                  <h3>Void an item</h3>
                  {tab.items.filter((i) => i.status !== 'VOID').length === 0 ? (
                    <p className="server-order-page__hint">Nothing to void.</p>
                  ) : (
                    tab.items.filter((i) => i.status !== 'VOID').map((item) => (
                      <div key={item.id} className="pos__void-row">
                        <span>{item.quantity}× {item.name}</span>
                        {voidingItemId === item.id ? (
                          <span className="pos__void-confirm">
                            <input type="text" placeholder="Reason (optional)" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
                            <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleVoid(item.id)} disabled={isPanelBusy}>Confirm Void</button>
                            <button className="worksuite-btn" onClick={() => setVoidingItemId(null)}>Cancel</button>
                          </span>
                        ) : (
                          <button className="worksuite-btn" onClick={() => setVoidingItemId(item.id)}>Void</button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="pos__panel-section">
                  <h3>Split Check</h3>
                  {tab.checks ? (
                    <p className="server-order-page__hint">Already split into {tab.checks.length} checks. Use the tabs on the ticket to move items between them.</p>
                  ) : (
                    <button className="worksuite-btn" onClick={handleSplit} disabled={isPanelBusy}>Split into 2 checks</button>
                  )}
                </div>

                <div className="pos__panel-section">
                  <h3>Reprint Check</h3>
                  <button className="worksuite-btn" onClick={() => { setPanel(null); handlePrint(); }}>Reprint</button>
                </div>

                <div className="pos__panel-section">
                  <h3 style={{ color: 'var(--color-danger)' }}>Cancel Tab</h3>
                  <p className="server-order-page__hint">Clears this tab without recording payment — for walk-outs or a mistaken tab.</p>
                  <button className="worksuite-btn worksuite-btn--danger" onClick={handleCancelTab} disabled={isPanelBusy}>Cancel whole tab</button>
                </div>

                <div className="worksuite-modal__actions">
                  <button className="worksuite-modal__cancel" onClick={() => setPanel(null)}>Close</button>
                </div>
              </>
            )}

            {panel === 'discount' && (
              <>
                <h2>Discount{tab.checks ? ` — ${tab.checks.find((c) => c.id === activeCheckId)?.label || ''}` : ''}</h2>
                {panelError && <p className="worksuite-modal__error">{panelError}</p>}
                <label>Type</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)}>
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FIXED">Fixed amount ($)</option>
                </select>
                <label>Value</label>
                <input type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
                <label>Label (optional)</label>
                <input type="text" value={discountLabel} onChange={(e) => setDiscountLabel(e.target.value)} placeholder="e.g. Happy Hour" maxLength={100} />
                <div className="worksuite-modal__actions">
                  <button className="worksuite-modal__cancel" onClick={() => handleApplyDiscount(true)} disabled={isPanelBusy}>Clear</button>
                  <button className="worksuite-modal__submit" onClick={() => handleApplyDiscount(false)} disabled={isPanelBusy}>Apply</button>
                </div>
              </>
            )}

            {panel === 'service-charge' && (
              <>
                <h2>Service Charge{tab.checks ? ` — ${tab.checks.find((c) => c.id === activeCheckId)?.label || ''}` : ''}</h2>
                {panelError && <p className="worksuite-modal__error">{panelError}</p>}
                <label>Type</label>
                <select value={serviceChargeType} onChange={(e) => setServiceChargeType(e.target.value as DiscountType)}>
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FIXED">Fixed amount ($)</option>
                </select>
                <label>Value</label>
                <input type="number" min={0} value={serviceChargeValue} onChange={(e) => setServiceChargeValue(e.target.value)} />
                <div className="worksuite-modal__actions">
                  <button className="worksuite-modal__cancel" onClick={() => handleApplyServiceCharge(true)} disabled={isPanelBusy}>Clear</button>
                  <button className="worksuite-modal__submit" onClick={() => handleApplyServiceCharge(false)} disabled={isPanelBusy}>Apply</button>
                </div>
              </>
            )}

            {panel === 'payments' && (
              <>
                <h2>Payment{tab.checks ? ` — ${tab.checks.find((c) => c.id === activeCheckId)?.label || ''}` : ''}</h2>
                {panelError && <p className="worksuite-modal__error">{panelError}</p>}
                <div className="pos__panel-section">
                  <div className="pos__cart-line pos__cart-line--static"><span>Subtotal</span><span>{(activeBill?.subtotal || 0).toFixed(2)}</span></div>
                  {activeBill && activeBill.discountAmount > 0 && <div className="pos__cart-line pos__cart-line--static"><span>Discount</span><span>-{activeBill.discountAmount.toFixed(2)}</span></div>}
                  {activeBill && activeBill.serviceChargeAmount > 0 && <div className="pos__cart-line pos__cart-line--static"><span>Service Charge</span><span>{activeBill.serviceChargeAmount.toFixed(2)}</span></div>}
                  <div className="pos__cart-total"><span>Total Due</span><span>{(activeBill?.total || 0).toFixed(2)}</span></div>
                </div>
                <label>Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const method = e.target.value as PaymentMethod;
                    setPaymentMethod(method);
                    setReaderChargeState('idle');
                    if (method === 'CARD_READER' && readers.length === 0) loadReaders();
                  }}
                >
                  <option value="CARD">Card</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD_READER">Card Reader</option>
                </select>

                {paymentMethod === 'CARD_READER' ? (
                  <>
                    {readers.length === 0 ? (
                      <p className="server-order-page__hint">
                        No card readers set up yet — add one in Company Settings under Payments.
                      </p>
                    ) : (
                      <>
                        <label>Reader</label>
                        <select value={selectedReaderId} onChange={(e) => setSelectedReaderId(e.target.value)} disabled={readerChargeState === 'waiting'}>
                          <option value="">Select a reader…</option>
                          {readers.map((r) => (
                            <option key={r.id} value={r.id}>{r.label} {r.status === 'online' ? '' : '(offline)'}</option>
                          ))}
                        </select>
                        {readerChargeState === 'waiting' && (
                          <p className="server-order-page__hint">Present card to reader…</p>
                        )}
                        {readerChargeState === 'failed' && (
                          <p className="pos__error">Payment was declined or cancelled — try again.</p>
                        )}
                      </>
                    )}
                    <div className="worksuite-modal__actions">
                      {readerChargeState === 'waiting' ? (
                        <button className="worksuite-modal__cancel" onClick={handleCancelReaderCharge}>Cancel</button>
                      ) : (
                        <button className="worksuite-modal__cancel" onClick={() => setPanel(null)}>Close</button>
                      )}
                      <button
                        className="worksuite-modal__submit"
                        onClick={handleChargeReader}
                        disabled={isPanelBusy || !selectedReaderId || readers.length === 0}
                      >
                        {readerChargeState === 'waiting' ? 'Waiting for card…' : 'Charge Reader'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="worksuite-modal__actions">
                    <button className="worksuite-modal__cancel" onClick={() => setPanel(null)}>Close</button>
                    <button className="worksuite-modal__submit" onClick={handleRecordPayment} disabled={isPanelBusy}>
                      {isPanelBusy ? 'Recording…' : 'Confirm Payment'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
