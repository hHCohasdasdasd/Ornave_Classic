import React, { useState } from 'react';
import { UsePrinterResult } from '@/hooks/usePrinter';

// Dropped into Kitchen/Bar/Reservations headers — shows whether printing is
// ready to go and lets staff switch between the two print methods (direct
// USB thermal printer vs. the browser's own print dialog) and, for
// Kitchen/Bar, toggle Auto-Print. Kept as one shared component since all
// three stations need the identical control.
//
// Takes the `usePrinter()` result as a prop rather than calling the hook
// itself — the page needs that same hook instance for its own print calls
// (manual ticket buttons, auto-print), and two separate instances would
// mean two independent USB connections that don't know about each other.
export const PrinterStatusControl: React.FC<{ printer: UsePrinterResult; showAutoPrint?: boolean }> = ({ printer, showAutoPrint = false }) => {
  const [showSettings, setShowSettings] = useState(false);

  if (printer.isLoadingSettings) return null;

  const isReady = printer.settings.printMethod === 'BROWSER' || !!printer.usbPrinter;

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <button
        className="worksuite-btn"
        onClick={() => setShowSettings((v) => !v)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isReady ? '#4f9d5c' : 'var(--color-danger)', flexShrink: 0 }} />
        {printer.settings.printMethod === 'USB' ? (printer.usbPrinter ? 'Printer Connected' : 'Printer Not Connected') : 'Browser Print'}
      </button>

      {showSettings && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 20,
            background: 'var(--tech-card-bg, #1c1c15)', border: '1px solid var(--tech-border, #2a2a22)',
            borderRadius: '10px', padding: '14px', width: '260px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted, #a79e8c)', marginBottom: '4px' }}>Print Method</label>
          <select
            value={printer.settings.printMethod}
            onChange={(e) => printer.updateSettings({ printMethod: e.target.value as any })}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            <option value="BROWSER">Browser print dialog</option>
            <option value="USB">Direct USB thermal printer</option>
          </select>

          {printer.settings.printMethod === 'USB' && (
            <div style={{ marginBottom: '10px' }}>
              {printer.usbPrinter ? (
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#4f9d5c' }}>✓ Printer connected</p>
              ) : printer.isUsbSupported ? (
                <button className="worksuite-btn" onClick={printer.connectUsb} disabled={printer.isConnectingUsb} style={{ width: '100%' }}>
                  {printer.isConnectingUsb ? 'Connecting…' : 'Connect Printer'}
                </button>
              ) : (
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-muted, #a79e8c)' }}>USB printing needs Chrome or Edge.</p>
              )}
              {printer.usbError && <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--color-danger)' }}>{printer.usbError}</p>}
            </div>
          )}

          {showAutoPrint && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={printer.settings.autoPrint}
                onChange={(e) => printer.updateSettings({ autoPrint: e.target.checked })}
                style={{ width: 'auto' }}
              />
              Auto-print new tickets
            </label>
          )}
        </div>
      )}
    </span>
  );
};
