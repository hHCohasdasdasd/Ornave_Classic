import { useEffect, useState } from 'react';
import { workSuiteService, PrinterStation, PrinterSettings, ReceiptSettings } from '@/services/workSuiteService';
import {
  isUsbPrintSupported, getPairedUsbPrinters, connectUsbPrinter, openUsbPrinter,
  printViaUsb, printViaBrowser, buildEscPosTicket, ConnectedUsbPrinter,
} from '@/utils/receiptPrinter';

export interface TicketContent {
  header?: string;
  lines: string[];
  footer?: string;
}

/** Everything a station page needs for printing — settings (method +
 * auto-print), USB connection state, and a single `print()` that dispatches
 * to whichever method is configured. Shared across Kitchen, Bar, and
 * Reservations rather than duplicated three times. */
export function usePrinter(station: PrinterStation) {
  const [settings, setSettings] = useState<PrinterSettings>({ printMethod: 'BROWSER', autoPrint: false });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const isUsbSupported = isUsbPrintSupported();
  const [usbPrinter, setUsbPrinter] = useState<ConnectedUsbPrinter | null>(null);
  const [isConnectingUsb, setIsConnectingUsb] = useState(false);
  const [usbError, setUsbError] = useState<string | null>(null);
  // Company-wide custom header/footer lines (Company Settings > Receipt
  // Design) — layered around whatever page-specific content each print()
  // call passes in, so every station picks this up without changes.
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({ headerText: '', footerText: '' });

  useEffect(() => {
    workSuiteService.getPrinterSettings(station).then(setSettings).finally(() => setIsLoadingSettings(false));
  }, [station]);

  useEffect(() => {
    workSuiteService.getReceiptSettings().then(setReceiptSettings).catch(() => {});
  }, []);

  // Reconnect to a previously-approved printer automatically, same as the
  // card reader — staff shouldn't have to re-pick their printer every shift.
  useEffect(() => {
    if (!isUsbSupported) return;
    getPairedUsbPrinters().then(async (devices) => {
      const device = devices.find((d: any) => d.opened) || devices[0];
      if (!device) return;
      try {
        setUsbPrinter(await openUsbPrinter(device));
      } catch {
        // Leave disconnected — the Connect button stays available to retry.
      }
    });
  }, [isUsbSupported]);

  const updateSettings = async (patch: Partial<PrinterSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      await workSuiteService.updatePrinterSettings(station, patch);
    } catch {
      workSuiteService.getPrinterSettings(station).then(setSettings);
    }
  };

  const connectUsb = async () => {
    setUsbError(null);
    setIsConnectingUsb(true);
    try {
      const printer = await connectUsbPrinter();
      if (printer) setUsbPrinter(printer);
    } catch {
      setUsbError("Could not connect to a printer — make sure it's plugged in and try again.");
    } finally {
      setIsConnectingUsb(false);
    }
  };

  /** Prints via whichever method is configured, throwing only for USB
   * (browser printing can't really "fail" synchronously — it just opens
   * the dialog) so callers can decide whether to still mark something
   * printed. */
  const print = async (content: TicketContent): Promise<void> => {
    const headerLines = receiptSettings.headerText.split('\n').map((l) => l.trim()).filter(Boolean);
    const footerLines = receiptSettings.footerText.split('\n').map((l) => l.trim()).filter(Boolean);
    const merged: TicketContent = {
      header: content.header,
      lines: [
        ...headerLines,
        ...(headerLines.length ? [''] : []),
        ...content.lines,
        ...(footerLines.length ? ['', ...footerLines] : []),
      ],
      footer: content.footer,
    };

    if (settings.printMethod === 'USB') {
      if (!usbPrinter) throw new Error('No USB printer connected');
      await printViaUsb(usbPrinter, buildEscPosTicket(merged));
    } else {
      printViaBrowser(merged);
    }
  };

  return {
    settings, isLoadingSettings, updateSettings,
    isUsbSupported, usbPrinter, isConnectingUsb, usbError, connectUsb,
    print,
  };
}

export type UsePrinterResult = ReturnType<typeof usePrinter>;
