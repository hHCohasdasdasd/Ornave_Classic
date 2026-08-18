import Stripe from 'stripe';

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key, { apiVersion: '2026-07-29.dahlia' });
}

// Lazy singleton — avoids constructing the client (and throwing on a
// missing key) at import time, before .env has necessarily loaded.
let cached: Stripe | null = null;
export const stripeClient = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!cached) cached = getStripe();
    return (cached as any)[prop];
  },
});
