import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { usePrinter } from '@/hooks/usePrinter';
import { formatTableLabel } from '@/utils/tableLabel';
import { formatPriceWithCurrency, parsePriceToNumber, computeBillPreview } from '@/utils/posBilling';
import {
  workSuiteService, ServerOrderTable, ServerOrder, ServerOrderItem, MenuItem, DiscountType, PaymentMethod, PosActionId, TerminalReader,
} from '@/services/workSuiteService';
import './WorkSuite.css';
import './ServerOrderPage.css';

// A POS-style order-entry screen for one table at a time — staff tap a
// table, build up a check from the menu grid, then Send it (which is when
// items actually become TableOrderItem rows and hit Kitchen/Bar; tapping a
// tile before that only stages it locally, same as a real POS holding an
// order until it's fired). Check Functions/Discounts/Service Charges/
// Payments live behind the ⋮ menu next to the table name at the bottom of
// the order panel; Print and Send are the two fixed action buttons.
const TABLES_POLL_MS = 6000;
const ORDER_POLL_MS = 4000;
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

const ALL_ACTIONS: PosActionId[] = ['check-functions', 'discount', 'service-charge', 'payments'];
const ACTION_LABELS: Record<PosActionId, string> = {
  'check-functions': 'Check Functions',
  discount: 'Discounts',
  'service-charge': 'Service Charges',
  payments: 'Payments',
};

export const WorkSuiteServerOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';
  const printer = usePrinter('RESERVATIONS');

  const [tables, setTables] = useState<ServerOrderTable[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [order, setOrder] = useState<ServerOrder | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const [seatingTable, setSeatingTable] = useState<ServerOrderTable | null>(null);
  const [seatPartySize, setSeatPartySize] = useState('2');
  const [isOpeningTable, setIsOpeningTable] = useState(false);

  const [pending, setPending] = useState<PendingLine[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
  const [activeCheckId, setActiveCheckId] = useState<string | null>(null);
  const [isUpdatingPartySize, setIsUpdatingPartySize] = useState(false);
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
  const [readerPaymentIntentId, setReaderPaymentIntentId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidingItemId, setVoidingItemId] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const [itemModal, setItemModal] = useState<{ menuItemId: string; name: string; price: string; description?: string | null; quantity: number; note: string; editingKey?: string } | null>(null);

  const [quickActions, setQuickActions] = useState<PosActionId[]>([]);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [editOrder, setEditOrder] = useState<PosActionId[]>([]);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [showAddActionMenu, setShowAddActionMenu] = useState(false);

  const loadTables = async () => {
    try {
      setTables(await workSuiteService.listServerOrderTables());
    } finally {
      setIsLoadingTables(false);
    }
  };

  const loadOrder = async (tableId: string) => {
    const view = await workSuiteService.getServerOrder(tableId);
    setOrder(view);
    if (view?.checks && view.checks.length) {
      setActiveCheckId((prev) => (prev && view.checks!.some((c) => c.id === prev) ? prev : view.checks![0].id));
    } else {
      setActiveCheckId(null);
    }
  };

  useEffect(() => {
    if (isGuest) return;
    loadTables();
    workSuiteService.listMenuItems().then(setMenuItems);
    workSuiteService.getPosLayout().then((l) => setQuickActions(l.order)).catch(() => {});
    const interval = setInterval(loadTables, TABLES_POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  useEffect(() => {
    if (!selectedTableId || isGuest) return;
    loadOrder(selectedTableId);
    const interval = setInterval(() => loadOrder(selectedTableId), ORDER_POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTableId, isGuest]);

  // Tapping an occupied table drops straight into its order. Tapping an
  // empty one first asks how many guests are being seated — that's what
  // actually flips it from empty to occupied — then opens the order screen.
  const selectTable = (table: ServerOrderTable) => {
    setError(null);
    if (!table.active) {
      setSeatPartySize('2');
      setSeatingTable(table);
      return;
    }
    setPending([]);
    setPanel(null);
    setOrder(undefined);
    setSelectedTableId(table.id);
  };

  const confirmSeatTable = async () => {
    if (!seatingTable) return;
    setIsOpeningTable(true);
    setError(null);
    try {
      await workSuiteService.startWalkIn(seatingTable.id, { partySize: Number(seatPartySize) || 2 });
      setPending([]);
      setPanel(null);
      setOrder(undefined);
      setSelectedTableId(seatingTable.id);
      setSeatingTable(null);
      await loadTables();
    } catch (err: any) {
      setError(err.message || 'Could not seat this table — try again.');
    } finally {
      setIsOpeningTable(false);
    }
  };

  const backToTables = () => {
    setSelectedTableId(null);
    setOrder(undefined);
    setPending([]);
    setPanel(null);
    setShowActionsMenu(false);
    setSeatingTable(null);
    loadTables();
  };

  // Edit Layout — pick which of Check Functions/Discounts/Service Charges/
  // Payments get a quick-access button on the order screen, and in what
  // order. Anything not chosen still lives in the ⋮ menu, so nothing here
  // can make a function unreachable, only add a shortcut to it.
  const openLayoutEditor = () => {
    setEditOrder(quickActions);
    setIsEditingLayout(true);
  };

  const toggleEditAction = (id: PosActionId) => {
    setEditOrder((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const moveEditAction = (id: PosActionId, delta: number) => {
    setEditOrder((prev) => {
      const idx = prev.indexOf(id);
      const next = idx + delta;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  };

  const handleSaveLayout = async () => {
    setIsSavingLayout(true);
    try {
      const saved = await workSuiteService.updatePosLayout(editOrder);
      setQuickActions(saved.order);
      setIsEditingLayout(false);
    } catch {
      setError('Could not save the layout — try again.');
    } finally {
      setIsSavingLayout(false);
    }
  };

  // Tapping a tile opens a small popup for quantity + notes ("extra
  // pineapple", "no onions") rather than adding it straight to the ticket —
  // clicking a pending (not-yet-sent) row reopens that same popup, prefilled,
  // so it can be adjusted or removed before Send.
  const openAddItemModal = (item: MenuItem) => {
    if (!order) return;
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
      // Notes make an item distinct — only merge quantity into an existing
      // line when neither has a note, same as the old plain-tap behavior.
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
    if (!selectedTableId || pending.length === 0) return;
    setIsSending(true);
    setError(null);
    try {
      for (const line of pending) {
        await workSuiteService.addServerOrderItem(selectedTableId, { menuItemId: line.menuItemId, quantity: line.quantity, note: line.note, checkId: line.checkId });
      }
      setPending([]);
      await loadOrder(selectedTableId);
      await loadTables();
    } catch (err: any) {
      setError(err.message || 'Could not send that order — try again.');
    } finally {
      setIsSending(false);
    }
  };

  const activeBill = useMemo(() => {
    if (!order) return null;

    const relevantPending = pending.filter((p) => (order.checks ? p.checkId === activeCheckId : true));
    const pendingSubtotal = relevantPending.reduce((sum, p) => sum + parsePriceToNumber(p.price) * p.quantity, 0);

    if (order.checks && order.checks.length) {
      const check = order.checks.find((c) => c.id === activeCheckId) || order.checks[0];
      if (!check) return null;
      return computeBillPreview(check.subtotal + pendingSubtotal, check.discountType, check.discountValue, check.serviceChargeType, check.serviceChargeValue);
    }
    return computeBillPreview(order.subtotal + pendingSubtotal, order.discountType, order.discountValue, order.serviceChargeType, order.serviceChargeValue);
  }, [order, activeCheckId, pending]);

  const pendingTotal = pending.reduce((sum, p) => sum + p.quantity, 0);

  const openPanel = (kind: PanelKind) => {
    setShowActionsMenu(false);
    setPanel(kind);
    setPanelError(null);
    setVoidReason('');
    setVoidingItemId(null);
  };

  const refreshOrder = async () => {
    if (selectedTableId) await loadOrder(selectedTableId);
    await loadTables();
  };

  const handleVoid = async (itemId: string) => {
    if (!selectedTableId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.voidServerOrderItem(selectedTableId, itemId, voidReason.trim() || undefined);
      setVoidingItemId(null);
      setVoidReason('');
      await refreshOrder();
    } catch (err: any) {
      setPanelError(err.message || 'Could not void that item.');
    } finally {
      setIsPanelBusy(false);
    }
  };

  // A quick one-tap void straight from the cart row's trash icon — same
  // endpoint as the Check Functions void flow, just without asking for a
  // reason first (staff can still use Check Functions -> Void for that).
  const quickVoidItem = async (itemId: string) => {
    if (!selectedTableId) return;
    try {
      await workSuiteService.voidServerOrderItem(selectedTableId, itemId, undefined);
      await refreshOrder();
    } catch {
      await refreshOrder();
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedTableId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.cancelServerOrder(selectedTableId);
      setPanel(null);
      backToTables();
    } catch (err: any) {
      setPanelError(err.message || 'Could not cancel this order.');
      setIsPanelBusy(false);
    }
  };

  const handleSplit = async () => {
    if (!selectedTableId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.splitServerOrderCheck(selectedTableId);
      await refreshOrder();
      setPanel(null);
    } catch (err: any) {
      setPanelError(err.message || 'Could not split this check.');
    } finally {
      setIsPanelBusy(false);
    }
  };

  const handleAddCheck = async () => {
    if (!selectedTableId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.addServerOrderCheck(selectedTableId);
      await refreshOrder();
    } catch (err: any) {
      setPanelError(err.message || 'Could not add another check.');
    } finally {
      setIsPanelBusy(false);
    }
  };

  const handleMoveItem = async (itemId: string, checkId: string) => {
    if (!selectedTableId) return;
    try {
      await workSuiteService.assignServerOrderItemToCheck(selectedTableId, itemId, checkId);
      await refreshOrder();
    } catch {
      await refreshOrder();
    }
  };

  const handleApplyDiscount = async (clear = false) => {
    if (!selectedTableId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.applyServerOrderDiscount(selectedTableId, {
        type: clear ? null : discountType,
        value: clear ? undefined : Number(discountValue) || 0,
        label: clear ? undefined : discountLabel,
        checkId: order?.checks ? activeCheckId || undefined : undefined,
      });
      await refreshOrder();
      if (clear) setPanel(null);
    } catch (err: any) {
      setPanelError(err.message || 'Could not update the discount.');
    } finally {
      setIsPanelBusy(false);
    }
  };

  const handleApplyServiceCharge = async (clear = false) => {
    if (!selectedTableId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.applyServerOrderServiceCharge(selectedTableId, {
        type: clear ? null : serviceChargeType,
        value: clear ? undefined : Number(serviceChargeValue) || 0,
        checkId: order?.checks ? activeCheckId || undefined : undefined,
      });
      await refreshOrder();
      if (clear) setPanel(null);
    } catch (err: any) {
      setPanelError(err.message || 'Could not update the service charge.');
    } finally {
      setIsPanelBusy(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedTableId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    try {
      await workSuiteService.recordServerOrderPayment(selectedTableId, {
        method: paymentMethod,
        checkId: order?.checks ? activeCheckId || undefined : undefined,
      });
      const stillOpenSplit = order?.checks ? order.checks.filter((c) => c.id !== activeCheckId).some((c) => c.paymentStatus !== 'PAID') : false;
      await refreshOrder();
      if (!stillOpenSplit) {
        setPanel(null);
        backToTables();
      }
    } catch (err: any) {
      setPanelError(err.message || 'Could not record that payment.');
    } finally {
      setIsPanelBusy(false);
    }
  };

  // Card Reader — a physical Stripe Terminal reader, for guests who won't
  // pay via Automatic Check-In. Pushes a PaymentIntent to the reader, then
  // polls it while the reader prompts "Insert or tap card"; completion is
  // re-verified server-side against Stripe before the order is marked
  // paid, so nothing closes out on the client's say-so alone.
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
    if (!selectedTableId || !selectedReaderId) return;
    setIsPanelBusy(true);
    setPanelError(null);
    setReaderChargeState('waiting');
    try {
      const checkId = order?.checks ? activeCheckId || undefined : undefined;
      const { paymentIntentId } = await workSuiteService.chargeServerOrderReader(selectedTableId, { readerId: selectedReaderId, checkId });
      setReaderPaymentIntentId(paymentIntentId);

      const poll = async (): Promise<void> => {
        const { status } = await workSuiteService.getTerminalPaymentIntentStatus(paymentIntentId);
        if (status === 'succeeded') {
          const stillOpenSplit = order?.checks ? order.checks.filter((c) => c.id !== activeCheckId).some((c) => c.paymentStatus !== 'PAID') : false;
          await workSuiteService.completeServerOrderReaderPayment(selectedTableId, { paymentIntentId, checkId });
          await refreshOrder();
          setReaderChargeState('idle');
          setReaderPaymentIntentId(null);
          setIsPanelBusy(false);
          if (!stillOpenSplit) {
            setPanel(null);
            backToTables();
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
      setReaderPaymentIntentId(null);
      setIsPanelBusy(false);
    }
  };

  const buildReceiptLines = (items: ServerOrderItem[]) => items
    .filter((i) => i.status !== 'VOID')
    .map((i) => `${i.quantity}× ${i.name}  ${i.price}`);

  const handlePrint = async () => {
    if (!order) return;
    setIsPrinting(true);
    try {
      const items = order.checks ? (order.checks.find((c) => c.id === activeCheckId)?.items || []) : order.items;
      const bill = activeBill;
      await printer.print({
        header: selectedTable ? formatTableLabel(selectedTable.label) : 'Receipt',
        lines: [
          order.guestName || (order.isWalkIn ? 'Walk-in' : 'Guest'),
          `Party of ${order.partySize}`,
          '',
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

  const handlePartySizeChange = async (delta: number) => {
    if (!selectedTableId || !order) return;
    const next = Math.max(1, Math.min(20, order.partySize + delta));
    if (next === order.partySize) return;
    setOrder({ ...order, partySize: next });
    setIsUpdatingPartySize(true);
    try {
      await workSuiteService.updateServerOrderPartySize(selectedTableId, next);
    } catch {
      await refreshOrder();
    } finally {
      setIsUpdatingPartySize(false);
    }
  };

  const categories = Array.from(new Set(menuItems.map((i) => i.category)));
  const visibleItems = menuItems.filter((i) => {
    if (searchTerm.trim()) return i.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
    return activeCategory === ALL_CATEGORY || i.category === activeCategory;
  });
  const selectedTable = tables.find((t) => t.id === selectedTableId) || null;

  const displayedItems: (ServerOrderItem | PendingLine)[] = order
    ? [
        ...order.items.filter((i) => i.status !== 'VOID' && (!order.checks || i.checkId === activeCheckId)),
        ...pending.filter((p) => (order.checks ? p.checkId === activeCheckId : true)),
      ]
    : [];

  const isPendingLine = (row: ServerOrderItem | PendingLine): row is PendingLine => 'key' in row;

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />
      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button
            className="worksuite-breadcrumb"
            onClick={() => (selectedTable ? backToTables() : navigate('/work-suite'))}
          >
            {selectedTable ? '← Server Orders' : '← Work Suite'}
          </button>
          <h1 className="worksuite-page__title">Server Orders</h1>
          <p className="worksuite-page__subtitle">Take an order directly for a table — walk-ins, or guests who'd rather tell you than scan the QR code.</p>
        </div>
      </div>

      <div className="worksuite-page__container worksuite-page__container--full">
        {isEditingLayout ? (
          <div className="pos pos--layout-editor">
            <div className="pos-layout-editor__banner">
              <div>
                <h2 className="server-order-page__section-title" style={{ marginBottom: 4 }}>Edit Layout</h2>
                <p className="server-order-page__hint">
                  This is a preview of the order screen. Add, remove, or reorder the quick-access buttons in the Current Order panel — Print and Send always stay, and every function is still reachable from the ⋮ menu either way.
                </p>
              </div>
              <div className="pos-layout-editor__banner-actions">
                <button type="button" className="pos__print-btn" onClick={() => setIsEditingLayout(false)} disabled={isSavingLayout}>
                  Cancel
                </button>
                <button type="button" className="pos__send-btn" onClick={handleSaveLayout} disabled={isSavingLayout}>
                  {isSavingLayout ? 'Saving…' : 'Save Layout'}
                </button>
              </div>
            </div>
            {error && <p className="pos__error">{error}</p>}

            <div className="pos__layout">
              <main className="pos__main">
                <div className="pos__main-header">
                  <h2>New Order</h2>
                </div>

                <div className="pos__meta-row">
                  <div className="pos__meta-field">
                    <label>Table</label>
                    <div className="pos__meta-value">Table 1</div>
                  </div>
                  <div className="pos__meta-field">
                    <label>Guests</label>
                    <div className="pos__meta-value">2</div>
                  </div>
                  <div className="pos__meta-field">
                    <label>Server</label>
                    <div className="pos__meta-value">{user?.firstName} {user?.lastName}</div>
                  </div>
                </div>

                <div className="pos__search-row">
                  <span className="pos__search-icon">🔍</span>
                  <input className="pos__search" type="text" placeholder="Search menu items…" disabled />
                </div>

                <div className="pos__categories">
                  <button className="pos__category-tab pos__category-tab--active" disabled>All</button>
                  {categories.slice(0, 3).map((cat) => (
                    <button key={cat} className="pos__category-tab" disabled>{cat}</button>
                  ))}
                </div>

                <div className="pos__tiles">
                  {menuItems.slice(0, 4).map((item) => (
                    <div key={item.id} className="pos__tile" style={{ cursor: 'default' }}>
                      <div>
                        <div className="pos__tile-name">{item.name}</div>
                        {item.description && <div className="pos__tile-desc">{item.description}</div>}
                      </div>
                      <div className="pos__tile-bottom">
                        <span className="pos__tile-price">{item.price}</span>
                        <span className="pos__tile-plus">+</span>
                      </div>
                    </div>
                  ))}
                  {menuItems.length === 0 && <p className="server-order-page__hint">Menu items will appear here.</p>}
                </div>
              </main>

              <aside className="pos__cart">
                <div className="pos__cart-header">
                  <h3>Current Order</h3>
                </div>
                <p className="pos__cart-guest">Guest</p>

                <div className="pos-layout-editor__quick-actions">
                  {editOrder.length === 0 && (
                    <p className="server-order-page__hint">No quick-access buttons yet — add one below.</p>
                  )}
                  {editOrder.map((id, idx) => (
                    <div key={id} className="pos-layout-editor__quick-action">
                      <span className="pos__quick-action-btn">{ACTION_LABELS[id]}</span>
                      <div className="pos-layout-editor__quick-action-controls">
                        <button type="button" onClick={() => moveEditAction(id, -1)} disabled={idx === 0} title="Move earlier">↑</button>
                        <button type="button" onClick={() => moveEditAction(id, 1)} disabled={idx === editOrder.length - 1} title="Move later">↓</button>
                        <button type="button" onClick={() => toggleEditAction(id)} title="Remove">×</button>
                      </div>
                    </div>
                  ))}
                  {editOrder.length < ALL_ACTIONS.length && (
                    <div className="pos-layout-editor__add-wrap">
                      <button type="button" className="pos-layout-editor__add-btn" onClick={() => setShowAddActionMenu((v) => !v)}>
                        + Add Button
                      </button>
                      {showAddActionMenu && (
                        <div className="pos__cart-menu pos-layout-editor__add-menu">
                          {ALL_ACTIONS.filter((id) => !editOrder.includes(id)).map((id) => (
                            <button key={id} onClick={() => { toggleEditAction(id); setShowAddActionMenu(false); }}>
                              {ACTION_LABELS[id]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pos__cart-items">
                  <div className="pos__cart-item" style={{ cursor: 'default' }}>
                    <span className="pos__cart-item-qty">1×</span>
                    <div className="pos__cart-item-info">
                      <span className="pos__cart-item-name" style={{ cursor: 'default' }}>Sample Item</span>
                    </div>
                    <span className="pos__cart-item-price">$0.00</span>
                  </div>
                </div>

                <div className="pos__cart-footer">
                  <div className="pos__cart-line"><span>Subtotal</span><span>0.00</span></div>
                  <div className="pos__cart-total"><span>Total Due</span><span>0.00</span></div>
                </div>

                <button className="pos__send-btn" disabled>Send to Kitchen</button>
                <button className="pos__print-btn" disabled>🖨 Print Receipt</button>

                <div className="pos__cart-footer-bar">
                  <span className="pos__cart-footer-label">🍽️ Table 1</span>
                  <button className="pos__cart-menu-btn" disabled>⋮</button>
                </div>
              </aside>
            </div>
          </div>
        ) : !selectedTable ? (
          <>
            <div className="server-order-page__section-header">
              <h3 className="server-order-page__section-title">Tables</h3>
              <button type="button" className="server-order-page__edit-layout-btn" onClick={openLayoutEditor}>
                Edit Layout
              </button>
            </div>
            {error && <p className="pos__error">{error}</p>}
            {isOpeningTable && <p className="server-order-page__hint">Opening table…</p>}
            {isLoadingTables ? (
              <p className="server-order-page__hint">Loading…</p>
            ) : tables.length === 0 ? (
              <p className="server-order-page__hint">No tables yet — add some in Floor Plan first.</p>
            ) : (
              <div className="server-order-page__table-grid">
                {tables.map((table) => (
                  <button key={table.id} className={`server-order-page__table-card${table.active ? ' server-order-page__table-card--occupied' : ' server-order-page__table-card--empty'}`} onClick={() => selectTable(table)} disabled={isOpeningTable}>
                    <span className="server-order-page__table-status">
                      <span className="server-order-page__table-dot" />
                      {table.active ? 'Occupied' : 'Empty'}
                    </span>
                    <span className="server-order-page__table-label">{table.label}</span>
                    {table.active ? (
                      <>
                        <span className="server-order-page__table-guest">{table.active.guestName || (table.active.isWalkIn ? 'Walk-in' : 'Guest')}</span>
                        <span className="server-order-page__table-meta">{table.active.itemCount} item{table.active.itemCount === 1 ? '' : 's'} · ${table.active.total.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="server-order-page__table-meta">{table.seats} seats</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : order === undefined ? (
          <div className="worksuite-empty">Loading order…</div>
        ) : order === null ? (
          <div className="worksuite-empty">This table's order just ended — go back and pick it again to start a new one.</div>
        ) : (
          <div className="pos">
            {order.status !== 'CONFIRMED' && <span className="pos__status-tag">{order.status}</span>}

            <div className="pos__layout">
              <main className="pos__main">
                <div className="pos__main-header">
                  <h2>New Order</h2>
                  <button className="worksuite-breadcrumb" onClick={backToTables}>← Tables</button>
                </div>

                <div className="pos__meta-row">
                  <div className="pos__meta-field">
                    <label>Table</label>
                    <div className="pos__meta-value">{formatTableLabel(selectedTable.label)}</div>
                  </div>
                  <div className="pos__meta-field">
                    <label>Guests</label>
                    <div className="pos__stepper">
                      <button onClick={() => handlePartySizeChange(-1)} disabled={isUpdatingPartySize}>−</button>
                      <span>{order.partySize}</span>
                      <button onClick={() => handlePartySizeChange(1)} disabled={isUpdatingPartySize}>+</button>
                    </div>
                  </div>
                  <div className="pos__meta-field">
                    <label>Server</label>
                    <div className="pos__meta-value">{user?.firstName} {user?.lastName}</div>
                  </div>
                </div>

                <div className="pos__search-row">
                  <span className="pos__search-icon">🔍</span>
                  <input className="pos__search" type="text" placeholder="Search menu items…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                  {visibleItems.length === 0 && <p className="server-order-page__hint">No items here.</p>}
                </div>
              </main>

              <aside className="pos__cart">
                <div className="pos__cart-header">
                  <h3>Current Order</h3>
                  {pending.length > 0 && <button className="pos__clear-btn" onClick={clearPending}>Clear</button>}
                </div>
                <p className="pos__cart-guest">{order.guestName || (order.isWalkIn ? 'Walk-in' : 'Guest')}</p>

                {quickActions.length > 0 && (
                  <div className="pos__quick-actions">
                    {quickActions.map((id) => (
                      <button key={id} className="pos__quick-action-btn" onClick={() => openPanel(id)}>
                        {ACTION_LABELS[id]}
                      </button>
                    ))}
                  </div>
                )}

                {order.checks && order.checks.length > 0 && (
                  <div className="pos__check-tabs">
                    {order.checks.map((check) => (
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
                            {order.checks && order.checks.length > 1 && (
                              <select
                                className="pos__cart-item-move"
                                value={row.checkId || ''}
                                onChange={(e) => handleMoveItem(row.id, e.target.value)}
                              >
                                {order.checks.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
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
                  {isSending ? 'Sending…' : `Send to Kitchen${pendingTotal ? ` (${pendingTotal})` : ''}`}
                </button>
                <button className="pos__print-btn" onClick={handlePrint} disabled={isPrinting}>
                  {isPrinting ? 'Printing…' : '🖨 Print Receipt'}
                </button>

                <div className="pos__cart-footer-bar">
                  <span className="pos__cart-footer-label">🍽️ {formatTableLabel(selectedTable.label)}</span>
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
              placeholder="e.g. extra pineapple, no onions"
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

      {seatingTable && (
        <div className="worksuite-modal-overlay" onClick={() => !isOpeningTable && setSeatingTable(null)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Seat {formatTableLabel(seatingTable.label)}</h2>
            <p className="server-order-page__hint">Marks this table occupied and opens the menu.</p>
            {error && <p className="pos__error">{error}</p>}
            <label>Number of guests</label>
            <input
              type="number"
              min={1}
              max={20}
              autoFocus
              value={seatPartySize}
              onChange={(e) => setSeatPartySize(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmSeatTable()}
            />
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setSeatingTable(null)} disabled={isOpeningTable}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={confirmSeatTable} disabled={isOpeningTable}>
                {isOpeningTable ? 'Seating…' : 'Seat Table'}
              </button>
            </div>
          </div>
        </div>
      )}

      {panel && order && (
        <div className="worksuite-modal-overlay" onClick={() => setPanel(null)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            {panel === 'check-functions' && (
              <>
                <h2>Check Functions</h2>
                {panelError && <p className="worksuite-modal__error">{panelError}</p>}

                <div className="pos__panel-section">
                  <h3>Void an item</h3>
                  {order.items.filter((i) => i.status !== 'VOID').length === 0 ? (
                    <p className="server-order-page__hint">Nothing to void.</p>
                  ) : (
                    order.items.filter((i) => i.status !== 'VOID').map((item) => (
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
                  {order.checks ? (
                    <p className="server-order-page__hint">Already split into {order.checks.length} checks. Use the tabs on the ticket to move items between them.</p>
                  ) : (
                    <button className="worksuite-btn" onClick={handleSplit} disabled={isPanelBusy}>Split into 2 checks</button>
                  )}
                </div>

                <div className="pos__panel-section">
                  <h3>Reprint Check</h3>
                  <button className="worksuite-btn" onClick={() => { setPanel(null); handlePrint(); }}>Reprint</button>
                </div>

                <div className="pos__panel-section">
                  <h3 style={{ color: 'var(--color-danger)' }}>Cancel Order</h3>
                  <p className="server-order-page__hint">Clears this table without recording payment — for walk-outs or a mistaken walk-in.</p>
                  <button className="worksuite-btn worksuite-btn--danger" onClick={handleCancelOrder} disabled={isPanelBusy}>Cancel whole order</button>
                </div>

                <div className="worksuite-modal__actions">
                  <button className="worksuite-modal__cancel" onClick={() => setPanel(null)}>Close</button>
                </div>
              </>
            )}

            {panel === 'discount' && (
              <>
                <h2>Discount{order.checks ? ` — ${order.checks.find((c) => c.id === activeCheckId)?.label || ''}` : ''}</h2>
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
                <h2>Service Charge{order.checks ? ` — ${order.checks.find((c) => c.id === activeCheckId)?.label || ''}` : ''}</h2>
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
                <h2>Payment{order.checks ? ` — ${order.checks.find((c) => c.id === activeCheckId)?.label || ''}` : ''}</h2>
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
                    setReaderPaymentIntentId(null);
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
    </div>
  );
};
