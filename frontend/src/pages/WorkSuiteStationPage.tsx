import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { PrinterStatusControl } from '@/components/ui/PrinterStatusControl';
import { usePrinter } from '@/hooks/usePrinter';
import { workSuiteService, StationOrderItem, MenuItemStation } from '@/services/workSuiteService';
import { formatTableLabel } from '@/utils/tableLabel';
import { BarOrdersPanel } from '@/components/pos/BarOrdersPanel';
import './WorkSuite.css';

const POLL_INTERVAL_MS = 5000;

const NEXT_STATUS: Record<StationOrderItem['status'], StationOrderItem['status'] | null> = {
  NEW: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
  SERVED: null,
};

const STATUS_LABEL: Record<StationOrderItem['status'], string> = {
  NEW: 'New', PREPARING: 'Preparing', READY: 'Ready', SERVED: 'Served',
};

const STATUS_ACTION_LABEL: Record<StationOrderItem['status'], string> = {
  NEW: 'Start Preparing', PREPARING: 'Mark Ready', READY: 'Mark Served', SERVED: '',
};

function elapsedMinutes(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

// A bar tab's label ("Stool 3", "Smith Party") isn't a table — only apply
// the "Table " formatting to tickets that actually came from one.
function ticketLabel(item: StationOrderItem): string {
  return item.source === 'bar-tab' ? item.tableLabel : formatTableLabel(item.tableLabel);
}

// One shared component for both stations (route wrappers pass the station)
// rather than two near-identical files — the only difference between
// Kitchen and Bar is which station's items get fetched.
export const WorkSuiteStationPage: React.FC<{ station: MenuItemStation }> = ({ station }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [searchParams] = useSearchParams();
  const isKiosk = searchParams.get('kiosk') === '1';
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  const [items, setItems] = useState<StationOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Bar Orders (tab-based ordering) lives inside this same module rather
  // than as its own separate page — a mode switch, not a different route.
  // Kitchen never shows the toggle since it doesn't have an ordering mode.
  const [barMode, setBarMode] = useState<'tickets' | 'order'>('tickets');
  const showOrderMode = station === 'BAR' && barMode === 'order';

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      setItems(await workSuiteService.listStationOrders(station));
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest, station]);

  // Live for everyone using this page, not just kiosk mode — unlike the
  // Reservations page, staff work directly off this screen continuously,
  // so it needs to stay current whether or not it's the fullscreen tablet.
  useEffect(() => {
    if (isGuest) return;
    const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest, station]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const openKiosk = () => {
    window.open(`/work-suite/${station === 'BAR' ? 'bar' : 'kitchen'}?kiosk=1`, '_blank', 'noopener');
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  const handleAdvance = async (item: StationOrderItem) => {
    const next = NEXT_STATUS[item.status];
    if (!next) return;
    setUpdatingId(item.id);
    setItems((prev) => (next === 'SERVED' ? prev.filter((i) => i.id !== item.id) : prev.map((i) => (i.id === item.id ? { ...i, status: next } : i))));
    try {
      await workSuiteService.updateStationOrderStatus(item.id, next);
    } catch {
      await load(true);
    } finally {
      setUpdatingId(null);
    }
  };

  const title = station === 'BAR' ? 'Bar' : 'Kitchen';
  const printer = usePrinter(station);

  const ticketFor = (item: StationOrderItem) => ({
    header: `${title} — ${ticketLabel(item)}`,
    lines: [`${item.quantity}× ${item.name}`, ...(item.note ? [`Note: ${item.note}`] : [])],
    footer: new Date(item.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  });

  const [printingId, setPrintingId] = useState<string | null>(null);
  const handlePrint = async (item: StationOrderItem) => {
    setPrintingId(item.id);
    try {
      await printer.print(ticketFor(item));
      await workSuiteService.markOrderItemPrinted(item.id);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, printedAt: new Date().toISOString() } : i)));
    } catch {
      // Browser printing can't really fail synchronously (it just opens the
      // dialog); a thrown error here is a real USB problem — leave the
      // ticket unprinted so staff notice and can retry.
    } finally {
      setPrintingId(null);
    }
  };

  // Auto-Print — fires once per unprinted item as soon as it's seen, guarded
  // by a ref (not state) so overlapping poll ticks can't double-print the
  // same ticket while the first print/mark-printed round trip is still in
  // flight.
  const autoPrintedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!printer.settings.autoPrint || printer.isLoadingSettings) return;
    if (printer.settings.printMethod === 'USB' && !printer.usbPrinter) return;
    const due = items.filter((i) => !i.printedAt && !autoPrintedRef.current.has(i.id));
    for (const item of due) {
      autoPrintedRef.current.add(item.id);
      handlePrint(item);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, printer.settings.autoPrint, printer.settings.printMethod, printer.usbPrinter, printer.isLoadingSettings]);

  const grouped = useMemo(() => {
    const byStatus: Record<StationOrderItem['status'], StationOrderItem[]> = { NEW: [], PREPARING: [], READY: [], SERVED: [] };
    for (const item of items) byStatus[item.status].push(item);
    return byStatus;
  }, [items]);

  const renderTicket = (item: StationOrderItem) => {
    const mins = elapsedMinutes(item.createdAt);
    const urgency = mins >= 15 ? '#c25b52' : mins >= 8 ? 'var(--tech-accent-gold, #c6a15b)' : '#4f9d5c';
    return (
      <div key={item.id} style={{ background: 'var(--tech-card-bg, #1c1c15)', border: `1px solid ${urgency}`, borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{ticketLabel(item)}</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: urgency }}>{mins < 1 ? 'just now' : `${mins} min`}</span>
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '6px' }}>{item.quantity}× {item.name}</div>
        {item.note && <div style={{ fontSize: '0.78rem', color: 'var(--color-muted, #a79e8c)', marginTop: '2px' }}>Note: {item.note}</div>}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button
            className="worksuite-create-btn"
            style={{ flex: 1 }}
            onClick={() => handleAdvance(item)}
            disabled={updatingId === item.id}
          >
            {updatingId === item.id ? '…' : STATUS_ACTION_LABEL[item.status]}
          </button>
          <button
            className="worksuite-btn"
            onClick={() => handlePrint(item)}
            disabled={printingId === item.id}
            title={item.printedAt ? `Printed at ${new Date(item.printedAt).toLocaleTimeString()}` : 'Print ticket'}
          >
            {printingId === item.id ? '…' : item.printedAt ? '🖨 ✓' : '🖨'}
          </button>
        </div>
      </div>
    );
  };

  const columns: StationOrderItem['status'][] = ['NEW', 'PREPARING', 'READY'];

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />

      {isKiosk ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--tech-border, #2a2a22)' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {station === 'BAR' && (
              <div className="worksuite-mode-toggle">
                <button className={barMode === 'tickets' ? 'worksuite-mode-toggle__btn worksuite-mode-toggle__btn--active' : 'worksuite-mode-toggle__btn'} onClick={() => setBarMode('tickets')}>Tickets</button>
                <button className={barMode === 'order' ? 'worksuite-mode-toggle__btn worksuite-mode-toggle__btn--active' : 'worksuite-mode-toggle__btn'} onClick={() => setBarMode('order')}>Order</button>
              </div>
            )}
            <PrinterStatusControl printer={printer} showAutoPrint />
            <button className="worksuite-btn" onClick={toggleFullscreen}>{isFullscreen ? 'Exit Fullscreen' : '⤢ Fullscreen'}</button>
            <button className="worksuite-btn" onClick={() => window.close()}>Close</button>
          </div>
        </div>
      ) : (
        <>
          <Navbar />
          <div className="worksuite-page__banner">
            <div className="worksuite-page__banner-inner">
              <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
              <h1 className="worksuite-page__title">{title}</h1>
              <p className="worksuite-page__subtitle">
                {showOrderMode ? 'Start a tab and order drinks against it — no table or seat needed.' : `Orders placed from table QR codes, tagged for ${title.toLowerCase()}.`}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
                {station === 'BAR' && (
                  <div className="worksuite-mode-toggle">
                    <button className={barMode === 'tickets' ? 'worksuite-mode-toggle__btn worksuite-mode-toggle__btn--active' : 'worksuite-mode-toggle__btn'} onClick={() => setBarMode('tickets')}>Tickets</button>
                    <button className={barMode === 'order' ? 'worksuite-mode-toggle__btn worksuite-mode-toggle__btn--active' : 'worksuite-mode-toggle__btn'} onClick={() => setBarMode('order')}>Order</button>
                  </div>
                )}
                <PrinterStatusControl printer={printer} showAutoPrint />
                <button className="worksuite-btn" onClick={openKiosk}>⤢ Open Fullscreen (for a tablet/kiosk)</button>
              </div>
            </div>
          </div>
        </>
      )}

      {showOrderMode ? (
        <BarOrdersPanel />
      ) : (
        <div className="worksuite-page__container worksuite-page__container--full">
          {isLoading ? (
            <div className="worksuite-empty">Loading orders…</div>
          ) : items.length === 0 ? (
            <div className="worksuite-empty worksuite-empty--goals">
              <p>No {title.toLowerCase()} orders right now — they'll show up here as guests order from their table.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
              {columns.map((col) => (
                <div key={col}>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted, #a79e8c)', margin: '0 0 12px' }}>
                    {STATUS_LABEL[col]} ({grouped[col].length})
                  </h3>
                  {grouped[col].length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-muted, #a79e8c)' }}>Nothing here.</p>
                  ) : (
                    grouped[col].map(renderTicket)
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
