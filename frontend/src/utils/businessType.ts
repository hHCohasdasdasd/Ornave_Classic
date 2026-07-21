// A company's business type drives which profile layout it gets — a
// restaurant needs a Menu, a real estate firm needs Listings, everyone else
// gets the standard Services/Case Studies layout. Registration only offers
// these fixed options so every firm maps cleanly to a known template.

export type FirmLayoutTemplate = 'default' | 'restaurant' | 'real-estate';

export interface BusinessTypeOption {
  value: string;
  template: FirmLayoutTemplate;
}

export const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] = [
  { value: 'Professional Services', template: 'default' },
  { value: 'Technology', template: 'default' },
  { value: 'Manufacturing', template: 'default' },
  { value: 'Logistics', template: 'default' },
  { value: 'Infrastructure', template: 'default' },
  { value: 'Healthcare', template: 'default' },
  { value: 'Retail', template: 'default' },
  { value: 'Restaurant & Food Service', template: 'restaurant' },
  { value: 'Real Estate', template: 'real-estate' },
];

export function getFirmLayoutTemplate(industry?: string): FirmLayoutTemplate {
  if (!industry) return 'default';
  const exact = BUSINESS_TYPE_OPTIONS.find((o) => o.value.toLowerCase() === industry.toLowerCase());
  if (exact) return exact.template;

  const i = industry.toLowerCase();
  if (i.includes('restaurant') || i.includes('food') || i.includes('cafe') || i.includes('catering')) return 'restaurant';
  if (i.includes('real estate') || i.includes('realty') || i.includes('property')) return 'real-estate';
  return 'default';
}
