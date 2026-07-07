import { SidebarItem } from '@/components/ui/Sidebar';

export const erpNavigation: SidebarItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Modules', to: '/modules' },
  { label: 'Pages', to: '/pages' },
  { label: 'Connections', to: '/connections' },
  { label: 'Clients', to: '/firm/clients' },
  { label: 'Transactions', to: '/transactions' },
  { label: 'Messages', to: '/messages' },
  { label: 'Company Settings', to: '/company-settings' },
  { label: 'Profile', to: '/profile' },
  { label: 'Ornave Global', to: '/global/dashboard' },
];

export const globalNavigation: SidebarItem[] = [
  { label: 'Global Dashboard', to: '/global/dashboard' },
  { label: 'Connections', to: '/global/connections' },
  { label: 'Requests', to: '/global/requests' },
  { label: 'Documents', to: '/global/documents' },
  { label: 'Payments', to: '/global/payments' },
  { label: 'Activity', to: '/global/activity' },
  { label: 'Profile', to: '/profile' },
  { label: 'Back to ERP', to: '/dashboard' },
];
