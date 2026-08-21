import { DiscountType } from '@/services/workSuiteService';

// MenuItem.price is free-text ("9.00", "$18", "Market price") rather than a
// real numeric column, so a price entered without a symbol wouldn't show
// any currency in a popup/receipt — this only adds "$" when the string
// starts with a digit, leaving anything already symbol-prefixed or
// non-numeric ("Market price") alone.
export function formatPriceWithCurrency(price: string): string {
  return /^\d/.test(price.trim()) ? `$${price.trim()}` : price;
}

// Mirrors the backend's parsePriceToNumber/computeBill (see
// workSuiteService.ts) so a ticket can show a live total that includes
// items still sitting in a pending cart, not just what's already been sent
// — the server's own subtotal/total only ever reflects sent items.
export function parsePriceToNumber(price: string): number {
  const match = price.replace(/,/g, '').match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

export function computeBillPreview(
  subtotal: number,
  discountType: DiscountType | null | undefined,
  discountValue: number | null | undefined,
  serviceChargeType: DiscountType | null | undefined,
  serviceChargeValue: number | null | undefined,
) {
  const discountAmount = discountType === 'PERCENT'
    ? subtotal * ((discountValue || 0) / 100)
    : discountType === 'FIXED'
    ? Math.min(discountValue || 0, subtotal)
    : 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const serviceChargeAmount = serviceChargeType === 'PERCENT'
    ? afterDiscount * ((serviceChargeValue || 0) / 100)
    : serviceChargeType === 'FIXED'
    ? (serviceChargeValue || 0)
    : 0;
  return { subtotal, discountAmount, serviceChargeAmount, total: afterDiscount + serviceChargeAmount };
}
