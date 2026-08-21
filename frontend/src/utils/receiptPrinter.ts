// Shared by the Kitchen, Bar, and Reservations pages — two ways to actually
// get a ticket/receipt onto paper:
//
// 1. Direct USB (ESC/POS) — WebUSB straight to a thermal printer, no
//    dialog, same connect-once/reconnect-automatically pattern as the card
//    reader in WorkSuiteReservationsPage.tsx. Real POS-style, but I can't
//    verify actual printed output from here — only that the byte encoding
//    matches the published ESC/POS spec.
// 2. Browser print dialog — a receipt-width HTML page opened in a hidden
//    iframe and printed via the browser's own print(). Works with whatever
//    printer is already set up at the OS level; shows a dialog every time.

const ESC = 0x1b;
const GS = 0x1d;

/** Plain ESC/POS text ticket: init, optional bold header, body lines,
 * feed, cut. Kept deliberately simple (no bit-image logos, no barcodes) —
 * this is a kitchen/bar ticket or a receipt, not a marketing printout. */
export function buildEscPosTicket(opts: { header?: string; lines: string[]; footer?: string }): Uint8Array {
  const bytes: number[] = [];
  const push = (...b: number[]) => bytes.push(...b);
  const text = (s: string) => {
    for (const byte of new TextEncoder().encode(s)) bytes.push(byte);
  };

  push(ESC, 0x40); // initialize

  if (opts.header) {
    push(ESC, 0x21, 0x30); // double width + height
    push(ESC, 0x61, 0x01); // center align
    text(opts.header + '\n');
    push(ESC, 0x21, 0x00); // back to normal size
    push(ESC, 0x61, 0x00); // left align
    text('\n');
  }

  for (const line of opts.lines) {
    text(line + '\n');
  }

  if (opts.footer) {
    text('\n');
    push(ESC, 0x61, 0x01);
    text(opts.footer + '\n');
    push(ESC, 0x61, 0x00);
  }

  text('\n\n\n');
  push(GS, 0x56, 0x42, 0x00); // partial cut
  return new Uint8Array(bytes);
}

export function isUsbPrintSupported(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

export interface ConnectedUsbPrinter {
  device: any;
  endpointNumber: number;
}

/** Opens Chrome's own USB device picker (empty filter — no vendor/product
 * ID hardcoded, since the exact printer model isn't fixed) and claims the
 * first OUT endpoint it finds, which is how ESC/POS commands actually get
 * sent regardless of the specific printer's descriptor layout. */
export async function connectUsbPrinter(): Promise<ConnectedUsbPrinter | null> {
  const usb = (navigator as any).usb;
  const device = await usb.requestDevice({ filters: [] });
  if (!device) return null;
  return openUsbPrinter(device);
}

export async function openUsbPrinter(device: any): Promise<ConnectedUsbPrinter> {
  if (!device.opened) await device.open();
  if (device.configuration === null) await device.selectConfiguration(1);
  const iface = device.configuration.interfaces[0];
  await device.claimInterface(iface.interfaceNumber);
  const endpoint = iface.alternate.endpoints.find((e: any) => e.direction === 'out');
  if (!endpoint) throw new Error('No output endpoint found on this USB device');
  return { device, endpointNumber: endpoint.endpointNumber };
}

export async function getPairedUsbPrinters(): Promise<any[]> {
  if (!isUsbPrintSupported()) return [];
  return (navigator as any).usb.getDevices();
}

export async function printViaUsb(printer: ConnectedUsbPrinter, ticket: Uint8Array): Promise<void> {
  await printer.device.transferOut(printer.endpointNumber, ticket);
}

/** Receipt-width (80mm) HTML in a hidden iframe, printed via the browser's
 * own dialog, then torn down. No new tab/window juggling for the user. */
export function printViaBrowser(opts: { header?: string; lines: string[]; footer?: string }): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`
    <html>
      <head>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; }
          h1 { font-size: 16px; text-align: center; margin: 0 0 8px; }
          .line { white-space: pre-wrap; margin: 2px 0; }
          .footer { text-align: center; margin-top: 12px; }
        </style>
      </head>
      <body>
        ${opts.header ? `<h1>${escapeHtml(opts.header)}</h1>` : ''}
        ${opts.lines.map((l) => `<div class="line">${escapeHtml(l)}</div>`).join('')}
        ${opts.footer ? `<div class="footer">${escapeHtml(opts.footer)}</div>` : ''}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 150);
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
