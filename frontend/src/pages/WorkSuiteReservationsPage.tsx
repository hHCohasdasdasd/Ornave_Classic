import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { PrinterStatusControl } from '@/components/ui/PrinterStatusControl';
import { usePrinter } from '@/hooks/usePrinter';
import { workSuiteService, CompanyReservation, RestaurantTable, FloorPlanChair, FloorPlanWall, TerminalReader } from '@/services/workSuiteService';
import { formatTableLabel } from '@/utils/tableLabel';
import './WorkSuite.css';

// Same fixed logical canvas as the floor plan editor (WorkSuiteFloorPlanPage)
// and the public read-only view (FirmProfileSections' FirmFloorPlan) — this
// is a third, read-only rendering of the same data for the same reason
// those two don't share one: different data shape (private RestaurantTable
// vs. the public Firm* types) and no zoom/edit affordances needed here.
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1000;
const CHAIR_SIZE = 28;

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// Web NFC text records store the text after a 1-byte header (bit 7 = text
// encoding, bits 0-5 = language-code length) plus the language code itself
// — this is the standard decode per the NDEF spec / MDN's Web NFC guide,
// not something the API hands you pre-parsed.
function decodeNdefTextRecord(record: any): string {
  const languageCodeLength = record.data.getUint8(0) & 0x3f;
  const decoder = new TextDecoder(record.encoding || 'utf-8');
  return decoder.decode(record.data.buffer.slice(1 + languageCodeLength));
}

export const WorkSuiteReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [reservations, setReservations] = useState<CompanyReservation[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [chairs, setChairs] = useState<FloorPlanChair[]>([]);
  const [walls, setWalls] = useState<FloorPlanWall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  // Clicking a table on the floor plan narrows the list on the right to
  // just that table's bookings — ties the two panels together instead of
  // leaving them as two unrelated views side by side.
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  // Clicking a reservation itself (as opposed to clicking a table on the
  // floor plan) opens the full detail modal — everything the guest added
  // when booking, not just the compact summary the list row shows.
  const [detailReservation, setDetailReservation] = useState<CompanyReservation | null>(null);

  const [searchParams] = useSearchParams();
  // ?kiosk=1 — a bare, chrome-less version of this same page meant to be
  // opened in its own tab/window and left running on a tablet at the host
  // stand, rather than a separate route/component, so it can never drift
  // out of sync with the normal page.
  const isKiosk = searchParams.get('kiosk') === '1';
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [reservationList, tableList, chairList, wallList] = await Promise.all([
        workSuiteService.listCompanyReservations(),
        workSuiteService.listTables(),
        workSuiteService.listChairs(),
        workSuiteService.listWalls(),
      ]);
      setReservations(reservationList);
      setTables(tableList);
      setChairs(chairList);
      setWalls(wallList);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Kiosk mode is meant to be left open unattended, so it needs to refresh
  // itself — a silent background reload, not the spinner-showing `load()`.
  useEffect(() => {
    if (!isKiosk || isGuest) return;
    const interval = setInterval(() => load(true), 30_000);
    return () => clearInterval(interval);
  }, [isKiosk, isGuest]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Stripe Terminal card readers — real hardware, registered once in
  // Company Settings under Payments (not a per-browser WebHID pairing,
  // since these are internet-connected and shared by the whole staff).
  // This is just a status glance; actually charging a reader happens from
  // the Payments panel in Server/Bar Orders.
  const [terminalReaders, setTerminalReaders] = useState<TerminalReader[]>([]);
  useEffect(() => {
    if (isGuest) return;
    workSuiteService.listTerminalReaders().then(setTerminalReaders).catch(() => setTerminalReaders([]));
  }, [isGuest]);

  const renderCardReaderStatus = () => {
    const onlineCount = terminalReaders.filter((r) => r.status === 'online').length;
    if (terminalReaders.length === 0) {
      return (
        <button className="worksuite-btn" onClick={() => navigate('/company-settings')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)', flexShrink: 0 }} />
          Set Up Card Reader
        </button>
      );
    }
    return (
      <span title={terminalReaders.map((r) => `${r.label}: ${r.status}`).join(', ')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: onlineCount > 0 ? '#4f9d5c' : 'var(--color-muted, #a79e8c)', fontWeight: 600 }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: onlineCount > 0 ? '#4f9d5c' : 'var(--color-muted, #a79e8c)', flexShrink: 0 }} />
        {onlineCount} of {terminalReaders.length} Reader{terminalReaders.length === 1 ? '' : 's'} Online
      </span>
    );
  };

  const openKiosk = () => {
    window.open('/work-suite/reservations?kiosk=1', '_blank', 'noopener');
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleCheckIn = async (reservation: CompanyReservation) => {
    setCheckingInId(reservation.id);
    try {
      // The backend's check-in response is the raw reservation row — it
      // doesn't re-run listForCompany's guestName/table enrichment, so this
      // has to merge onto the existing row, not replace it, or table/guest
      // fields go missing from the list right after checking someone in.
      const updated = await workSuiteService.checkInReservation(reservation.id);
      setReservations((prev) => prev.map((r) => (r.id === reservation.id ? { ...r, ...updated } : r)));
      setDetailReservation((prev) => (prev && prev.id === reservation.id ? { ...prev, ...updated } : prev));
    } catch {
      await load();
    } finally {
      setCheckingInId(null);
    }
  };

  const handleCancelReservation = async (reservation: CompanyReservation) => {
    if (!window.confirm(`Cancel ${reservation.guestName}'s reservation for ${formatWhen(reservation.reservationTime)}?`)) return;
    setCancellingId(reservation.id);
    try {
      const updated = await workSuiteService.cancelReservation(reservation.id);
      setReservations((prev) => prev.map((r) => (r.id === reservation.id ? { ...r, ...updated } : r)));
      setDetailReservation((prev) => (prev && prev.id === reservation.id ? { ...prev, ...updated } : prev));
    } catch {
      await load();
    } finally {
      setCancellingId(null);
    }
  };

  // Guest Arrival — the actual "customer walks in" flow: tap an NFC card or
  // look up by phone, then a staff member has to look at the photo and
  // actively tap Confirm before it counts as checked in. Deliberately not
  // automatic, even though the lookup itself is instant — this is the
  // human-in-the-loop counterpart to AutoCheckInService's background sweep.
  const isNfcSupported = typeof window !== 'undefined' && 'NDEFReader' in window;
  const [showArrivalPanel, setShowArrivalPanel] = useState(false);
  const [arrivalPhone, setArrivalPhone] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [arrivalError, setArrivalError] = useState<string | null>(null);
  const [arrivalResult, setArrivalResult] = useState<CompanyReservation | null>(null);
  const [isConfirmingArrival, setIsConfirmingArrival] = useState(false);

  // Printing here is always manual (a "Print Receipt" button, no
  // Auto-Print) — a full itemized bill only makes sense to print when
  // someone's actually asking for it, unlike Kitchen/Bar tickets.
  const printer = usePrinter('RESERVATIONS');
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const handlePrintReceipt = async (reservation: CompanyReservation) => {
    setIsPrintingReceipt(true);
    try {
      const items = reservation.orderItems || [];
      await printer.print({
        header: formatTableLabel(reservation.table.label),
        lines: [
          reservation.guestName,
          `Party of ${reservation.partySize} — ${formatWhen(reservation.reservationTime)}`,
          '',
          ...items.map((i) => `${i.quantity}× ${i.name}  ${i.price}`),
          '',
          `Total: $${(reservation.orderTotal || 0).toFixed(2)}`,
        ],
        footer: 'Thank you!',
      });
    } catch {
      // Same as station tickets — browser print can't really fail here;
      // a thrown error means the USB printer itself had a problem.
    } finally {
      setIsPrintingReceipt(false);
    }
  };

  const openArrivalPanel = () => {
    setArrivalPhone('');
    setArrivalError(null);
    setArrivalResult(null);
    setShowArrivalPanel(true);
  };

  const runLookup = async (params: { nfcToken?: string; phone?: string }) => {
    setIsLookingUp(true);
    setArrivalError(null);
    setArrivalResult(null);
    try {
      const result = await workSuiteService.lookupArrival(params);
      if (!result) {
        setArrivalError("No matching reservation for today — check the number or ask the guest for their booking name.");
      } else {
        setArrivalResult(result);
      }
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleNfcScan = async () => {
    setIsNfcScanning(true);
    setArrivalError(null);
    setArrivalResult(null);
    try {
      const reader = new (window as any).NDEFReader();
      await reader.scan();
      reader.onreading = (event: any) => {
        setIsNfcScanning(false);
        const textRecord = event.message.records.find((r: any) => r.recordType === 'text');
        if (!textRecord) {
          setArrivalError('That card has no readable data on it.');
          return;
        }
        const token = decodeNdefTextRecord(textRecord);
        runLookup({ nfcToken: token });
      };
      reader.onreadingerror = () => {
        setIsNfcScanning(false);
        setArrivalError('Could not read that card — try tapping again.');
      };
    } catch {
      setIsNfcScanning(false);
      setArrivalError('Could not start the NFC scan — check that NFC is turned on for this device.');
    }
  };

  const handleConfirmArrival = async () => {
    if (!arrivalResult) return;
    setIsConfirmingArrival(true);
    try {
      const updated = await workSuiteService.checkInReservation(arrivalResult.id);
      setReservations((prev) => {
        const exists = prev.some((r) => r.id === updated.id);
        return exists ? prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)) : [...prev, { ...arrivalResult, ...updated }];
      });
      setShowArrivalPanel(false);
    } catch {
      setArrivalError('Could not check this guest in — try again.');
    } finally {
      setIsConfirmingArrival(false);
    }
  };

  const orderedReservations = useMemo(() => {
    const oneHourAgo = now.getTime() - 60 * 60 * 1000;
    return reservations
      // Upcoming only — once a guest has checked in they're being served
      // (tracked from here on in Server Orders), not "upcoming" anymore.
      .filter((r) => !r.checkedInAt)
      // A no-show that's more than an hour past its time falls off the
      // list on its own rather than sitting there indefinitely — still
      // reachable via Show Cancelled once it's actually cancelled.
      .filter((r) => new Date(r.reservationTime).getTime() >= oneHourAgo)
      .filter((r) => showCancelled || r.status !== 'CANCELLED')
      .filter((r) => !selectedTableId || r.tableId === selectedTableId)
      .sort((a, b) => new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime());
  }, [reservations, showCancelled, selectedTableId, now]);

  const reservationCountByTable = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reservations) {
      if (r.status !== 'CONFIRMED' || r.checkedInAt) continue;
      map.set(r.tableId, (map.get(r.tableId) || 0) + 1);
    }
    return map;
  }, [reservations]);

  const pct = (value: number, total: number) => `${(value / total) * 100}%`;
  const selectedTable = tables.find((t) => t.id === selectedTableId) || null;

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />

      {isKiosk ? (
        // Chrome-less: no Navbar, no banner, no sidebar links — this tab is
        // meant to be handed to a tablet and left running at the host
        // stand, not navigated around like a normal page.
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--tech-border, #2a2a22)' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Reservations</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {renderCardReaderStatus()}
            <PrinterStatusControl printer={printer} />
            <button className="worksuite-create-btn" onClick={openArrivalPanel}>Guest Arrival</button>
            <button className="worksuite-btn" onClick={toggleFullscreen}>
              {isFullscreen ? 'Exit Fullscreen' : '⤢ Fullscreen'}
            </button>
            <button className="worksuite-btn" onClick={() => window.close()}>Close</button>
          </div>
        </div>
      ) : (
        <>
          <Navbar />
          <div className="worksuite-page__banner">
            <div className="worksuite-page__banner-inner">
              <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
              <h1 className="worksuite-page__title">Reservations</h1>
              <p className="worksuite-page__subtitle">Click a table to see just its bookings, or a reservation to jump to its table.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
                {renderCardReaderStatus()}
                <PrinterStatusControl printer={printer} />
                <button className="worksuite-create-btn" onClick={openArrivalPanel}>Guest Arrival</button>
                <button className="worksuite-btn" onClick={openKiosk}>
                  ⤢ Open Fullscreen (for a tablet/kiosk)
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="worksuite-page__container worksuite-page__container--full">
        {isLoading ? (
          <div className="worksuite-empty">Loading reservations…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '24px', alignItems: 'start' }}>
            {/* Floor plan — center */}
            <div>
              {selectedTable && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-muted, #a79e8c)' }}>Showing only {selectedTable.label}</span>
                  <button className="worksuite-btn" onClick={() => setSelectedTableId(null)}>Clear</button>
                </div>
              )}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
                  background: 'var(--tech-bg, #14140f)',
                  border: '1px solid var(--tech-border, #2a2a22)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <svg viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  {walls.map((wall) => {
                    if (wall.shape === 'circle') {
                      return <circle key={wall.id} cx={wall.x1} cy={wall.y1} r={wall.radius || 0} fill="none" stroke="var(--tech-text-dim, #8a8578)" strokeWidth={4} />;
                    }
                    const cx = wall.curveX ?? Math.round((wall.x1 + wall.x2) / 2);
                    const cy = wall.curveY ?? Math.round((wall.y1 + wall.y2) / 2);
                    return <path key={wall.id} d={`M ${wall.x1} ${wall.y1} Q ${cx} ${cy} ${wall.x2} ${wall.y2}`} fill="none" stroke="var(--tech-text-dim, #8a8578)" strokeWidth={4} />;
                  })}
                </svg>

                {chairs.map((chair) => (
                  <div
                    key={chair.id}
                    style={{
                      position: 'absolute',
                      left: pct(chair.positionX, CANVAS_WIDTH),
                      top: pct(chair.positionY, CANVAS_HEIGHT),
                      width: pct(CHAIR_SIZE, CANVAS_WIDTH),
                      height: pct(CHAIR_SIZE, CANVAS_HEIGHT),
                      borderRadius: '6px',
                      border: '2px solid #7a8fb0',
                      background: 'var(--tech-card-bg, #1c1c15)',
                    }}
                  />
                ))}

                {tables.map((table) => {
                  const pendingCount = reservationCountByTable.get(table.id) || 0;
                  const isSelected = table.id === selectedTableId;
                  return (
                    <div
                      key={table.id}
                      onClick={() => setSelectedTableId(isSelected ? null : table.id)}
                      title={`${table.label} — ${table.seats} seats${pendingCount ? ` — ${pendingCount} upcoming` : ''}`}
                      style={{
                        position: 'absolute',
                        left: pct(table.positionX, CANVAS_WIDTH),
                        top: pct(table.positionY, CANVAS_HEIGHT),
                        width: pct(table.width, CANVAS_WIDTH),
                        height: pct(table.height, CANVAS_HEIGHT),
                        borderRadius: table.shape === 'round' ? '50%' : table.shape === 'half-circle' ? '999px 999px 6px 6px' : '10px',
                        border: isSelected ? '2px solid var(--tech-accent-gold, #c6a15b)' : '2px solid #4f9d5c',
                        background: 'rgba(79, 157, 92, 0.28)',
                        boxShadow: isSelected ? '0 0 0 3px rgba(198, 161, 91, 0.25)' : undefined,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--color-text, #f0ece1)',
                        textAlign: 'center',
                        padding: '2px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                    >
                      {table.label}
                      {pendingCount > 0 && (
                        <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--tech-accent-gold, #c6a15b)', color: '#1a1a1a', borderRadius: '999px', fontSize: '0.62rem', fontWeight: 800, padding: '1px 6px' }}>
                          {pendingCount}
                        </span>
                      )}
                    </div>
                  );
                })}

                {tables.length === 0 && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted, #a79e8c)', fontSize: '0.85rem' }}>
                    No floor plan yet — set one up in the Floor Plan module.
                  </div>
                )}
              </div>
            </div>

            {/* Time + reservation list — right */}
            <div>
              <div style={{ textAlign: 'center', padding: '14px', marginBottom: '16px', background: 'var(--tech-card-bg, #1c1c15)', border: '1px solid var(--tech-border, #2a2a22)', borderRadius: '10px' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text, #f0ece1)' }}>
                  {now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-muted, #a79e8c)', marginTop: '2px' }}>
                  {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted, #a79e8c)', margin: 0 }}>
                  Reservations
                </h3>
                <button className="worksuite-btn" onClick={() => setShowCancelled((v) => !v)}>
                  {showCancelled ? 'Hide Cancelled' : 'Show Cancelled'}
                </button>
              </div>

              {orderedReservations.length === 0 ? (
                <div className="worksuite-empty worksuite-empty--goals">
                  <p>{selectedTableId ? 'No reservations for this table.' : "No reservations yet — they'll show up here as guests book tables from your public profile."}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {orderedReservations.map((r) => {
                    const isPast = new Date(r.reservationTime).getTime() < now.getTime();
                    return (
                      <div
                        key={r.id}
                        onClick={() => { setSelectedTableId(r.tableId); setDetailReservation(r); }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--tech-border, #2a2a22)',
                          background: r.tableId === selectedTableId ? 'rgba(198, 161, 91, 0.08)' : 'var(--tech-card-bg, #1c1c15)',
                          opacity: r.status === 'CANCELLED' || (isPast && !r.checkedInAt) ? 0.55 : 1,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>{formatTime(r.reservationTime)}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: r.status === 'CANCELLED' ? 'var(--color-danger)' : r.checkedInAt ? '#4f9d5c' : r.autoCheckInEnabled ? 'var(--tech-accent-gold, #c6a15b)' : 'var(--color-muted, #a79e8c)' }}>
                            {r.status === 'CANCELLED' ? 'Cancelled' : r.checkedInAt ? 'Checked In' : r.autoCheckInEnabled ? 'Auto Check-In' : 'Confirmed'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          {r.autoCheckInEnabled && (
                            r.guestPhotoUrl ? (
                              <img src={r.guestPhotoUrl} alt={r.guestName} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div title="No ID photo on file" style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px dashed var(--color-danger)', flexShrink: 0 }} />
                            )
                          )}
                          <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{r.guestName} — table {r.table.label}, party of {r.partySize}</div>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-muted, #a79e8c)', marginTop: '2px' }}>{formatWhen(r.reservationTime)}</div>
                        {!!r.orderItems?.length && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--tech-accent-gold, #c6a15b)', fontWeight: 600, marginTop: '4px' }}>
                            🛒 {r.orderItems.reduce((n, i) => n + i.quantity, 0)} item{r.orderItems.length === 1 ? '' : 's'} — ${(r.orderTotal || 0).toFixed(2)}
                          </div>
                        )}
                        {r.guestNotes && <div style={{ fontSize: '0.72rem', color: '#c25b52', fontWeight: 600, marginTop: '4px' }}>⚠ {r.guestNotes}</div>}
                        {!r.checkedInAt && r.status === 'CONFIRMED' && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                              className="worksuite-btn"
                              onClick={(e) => { e.stopPropagation(); handleCheckIn(r); }}
                              disabled={checkingInId === r.id || cancellingId === r.id}
                            >
                              {checkingInId === r.id ? 'Checking In…' : 'Check In'}
                            </button>
                            <button
                              className="worksuite-btn"
                              style={{ color: 'var(--color-danger)' }}
                              onClick={(e) => { e.stopPropagation(); handleCancelReservation(r); }}
                              disabled={checkingInId === r.id || cancellingId === r.id}
                            >
                              {cancellingId === r.id ? 'Cancelling…' : 'Cancel'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {detailReservation && (
        <div className="worksuite-modal-overlay" onClick={() => setDetailReservation(null)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {detailReservation.autoCheckInEnabled && (
                detailReservation.guestPhotoUrl ? (
                  <img
                    src={detailReservation.guestPhotoUrl}
                    alt={detailReservation.guestName}
                    style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--tech-border, #2a2a22)', flexShrink: 0 }}
                  />
                ) : (
                  <div
                    title="No ID photo on file"
                    style={{ width: '64px', height: '64px', borderRadius: '10px', border: '1px dashed var(--color-danger)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', color: 'var(--color-danger)', textAlign: 'center', padding: '4px' }}
                  >
                    No photo on file
                  </div>
                )
              )}
              <div>
                <h2 style={{ margin: 0 }}>{detailReservation.guestName}</h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-muted, #a79e8c)' }}>
                  {formatWhen(detailReservation.reservationTime)}
                </p>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--tech-border, #2a2a22)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-muted, #a79e8c)' }}>Table</span>
                <span style={{ fontWeight: 600 }}>{detailReservation.table.label} ({detailReservation.table.seats} seats)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--tech-border, #2a2a22)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-muted, #a79e8c)' }}>Party size</span>
                <span style={{ fontWeight: 600 }}>{detailReservation.partySize}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--tech-border, #2a2a22)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-muted, #a79e8c)' }}>Status</span>
                <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: detailReservation.status === 'CANCELLED' ? 'var(--color-danger)' : detailReservation.checkedInAt ? '#4f9d5c' : 'var(--color-text, #f0ece1)' }}>
                  {detailReservation.status === 'CANCELLED' ? 'Cancelled' : detailReservation.checkedInAt ? 'Checked In' : 'Confirmed'}
                </span>
              </div>
              {detailReservation.checkedInAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--tech-border, #2a2a22)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--color-muted, #a79e8c)' }}>Checked in at</span>
                  <span style={{ fontWeight: 600 }}>{new Date(detailReservation.checkedInAt).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--tech-border, #2a2a22)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-muted, #a79e8c)' }}>Automatic Check-In</span>
                <span style={{ fontWeight: 600 }}>{detailReservation.autoCheckInEnabled ? 'Enabled' : 'Off'}</span>
              </div>
              {detailReservation.guestPhone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--tech-border, #2a2a22)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--color-muted, #a79e8c)' }}>Phone</span>
                  <span style={{ fontWeight: 600 }}>{detailReservation.guestPhone}</span>
                </div>
              )}
              {detailReservation.guestEmail && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--tech-border, #2a2a22)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--color-muted, #a79e8c)' }}>Email</span>
                  <span style={{ fontWeight: 600 }}>{detailReservation.guestEmail}</span>
                </div>
              )}
              {detailReservation.note && (
                <div>
                  <span style={{ color: 'var(--color-muted, #a79e8c)', display: 'block', marginBottom: '4px' }}>Note with this booking</span>
                  <p style={{ margin: 0 }}>{detailReservation.note}</p>
                </div>
              )}
              {detailReservation.guestNotes && (
                <div>
                  <span style={{ color: 'var(--color-muted, #a79e8c)', display: 'block', marginBottom: '4px' }}>Standing note (Check-In Profile)</span>
                  <p style={{ margin: 0, color: '#c25b52', fontWeight: 600 }}>⚠ {detailReservation.guestNotes}</p>
                </div>
              )}
              {!!detailReservation.orderItems?.length && (
                <div>
                  <span style={{ color: 'var(--color-muted, #a79e8c)', display: 'block', marginBottom: '6px' }}>Order (from table QR)</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {detailReservation.orderItems.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span>{item.quantity}× {item.name}</span>
                        <span>{item.price}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--tech-border-dim, #2a2a22)' }}>
                    <span>Total</span>
                    <span>${(detailReservation.orderTotal || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setDetailReservation(null)}>Close</button>
              <button
                className="worksuite-btn"
                onClick={() => handlePrintReceipt(detailReservation)}
                disabled={isPrintingReceipt}
              >
                {isPrintingReceipt ? 'Printing…' : '🖨 Print Receipt'}
              </button>
              {!detailReservation.checkedInAt && detailReservation.status === 'CONFIRMED' && (
                <>
                  <button
                    className="worksuite-btn"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => handleCancelReservation(detailReservation)}
                    disabled={checkingInId === detailReservation.id || cancellingId === detailReservation.id}
                  >
                    {cancellingId === detailReservation.id ? 'Cancelling…' : 'Cancel Reservation'}
                  </button>
                  <button
                    className="worksuite-modal__submit"
                    onClick={() => handleCheckIn(detailReservation)}
                    disabled={checkingInId === detailReservation.id || cancellingId === detailReservation.id}
                  >
                    {checkingInId === detailReservation.id ? 'Checking In…' : 'Check In'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showArrivalPanel && (
        <div className="worksuite-modal-overlay" onClick={() => setShowArrivalPanel(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            {arrivalResult ? (
              <>
                <h2 style={{ marginBottom: '4px' }}>Confirm this is {arrivalResult.guestName}</h2>
                <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: 'var(--color-muted, #a79e8c)' }}>
                  {formatTableLabel(arrivalResult.table.label)}, party of {arrivalResult.partySize} — {formatWhen(arrivalResult.reservationTime)}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  {arrivalResult.guestPhotoUrl ? (
                    <img
                      src={arrivalResult.guestPhotoUrl}
                      alt={arrivalResult.guestName}
                      style={{ width: '160px', height: '160px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--tech-accent-gold, #c6a15b)' }}
                    />
                  ) : (
                    <div style={{ width: '160px', height: '160px', borderRadius: '12px', border: '2px dashed var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--color-danger)', textAlign: 'center', padding: '10px' }}>
                      No ID photo on file — verify identity another way
                    </div>
                  )}
                </div>

                {arrivalResult.guestNotes && (
                  <p style={{ textAlign: 'center', color: '#c25b52', fontWeight: 600, fontSize: '0.85rem', marginBottom: '16px' }}>⚠ {arrivalResult.guestNotes}</p>
                )}

                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-muted, #a79e8c)', marginBottom: '4px' }}>
                  Look at the guest and compare — only confirm once you're sure this is them.
                </p>

                {arrivalError && <p className="worksuite-modal__error">{arrivalError}</p>}

                <div className="worksuite-modal__actions">
                  <button className="worksuite-modal__cancel" onClick={() => setArrivalResult(null)}>Back</button>
                  <button className="worksuite-modal__submit" onClick={handleConfirmArrival} disabled={isConfirmingArrival}>
                    {isConfirmingArrival ? 'Checking In…' : 'Confirm & Check In'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Guest Arrival</h2>
                <p style={{ margin: '-8px 0 16px', fontSize: '0.8rem', color: 'var(--color-muted, #a79e8c)' }}>
                  Tap their NFC card, or look them up by phone number.
                </p>

                {isNfcSupported && (
                  <button className="worksuite-create-btn" style={{ width: '100%', marginBottom: '14px' }} onClick={handleNfcScan} disabled={isNfcScanning || isLookingUp}>
                    {isNfcScanning ? 'Hold card near device…' : '📶 Tap Card'}
                  </button>
                )}

                <label>Phone number</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={arrivalPhone}
                    onChange={(e) => setArrivalPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    onKeyDown={(e) => { if (e.key === 'Enter' && arrivalPhone.trim()) runLookup({ phone: arrivalPhone.trim() }); }}
                  />
                  <button
                    className="worksuite-btn"
                    onClick={() => runLookup({ phone: arrivalPhone.trim() })}
                    disabled={!arrivalPhone.trim() || isLookingUp}
                  >
                    {isLookingUp ? 'Looking up…' : 'Look Up'}
                  </button>
                </div>

                {arrivalError && <p className="worksuite-modal__error">{arrivalError}</p>}

                <div className="worksuite-modal__actions">
                  <button className="worksuite-modal__cancel" onClick={() => setShowArrivalPanel(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
