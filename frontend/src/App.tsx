import React, { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProfileSidebar } from '@/components/personal/ProfileSidebar';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { CompanySetupPage } from '@/pages/CompanySetupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ModulesPage } from '@/pages/ModulesPage';
import { PagesPage } from '@/pages/PagesPage';
import { ConnectionsPage } from '@/pages/ConnectionsPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { MessagingPage } from '@/pages/MessagingPage';
import { CompanySettingsPage } from '@/pages/CompanySettingsPage';
import { GlobalDashboardPage } from '@/pages/GlobalDashboardPage';
import { GlobalConnectionsPage } from '@/pages/GlobalConnectionsPage';
import { GlobalRequestsPage } from '@/pages/GlobalRequestsPage';
import { GlobalDocumentsPage } from '@/pages/GlobalDocumentsPage';
import { GlobalPaymentsPage } from '@/pages/GlobalPaymentsPage';
import { GlobalActivityPage } from '@/pages/GlobalActivityPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { useLocation } from 'react-router-dom';

const ProfilePageWithKey = () => {
  const location = useLocation();
  return <ProfilePage key={location.pathname + location.search} />;
};

import { ProfileEditPage } from '@/pages/ProfileEditPage';
import { ProfileResourcesPage } from '@/pages/ProfileResourcesPage';
import { OpenToWorkSettingsPage } from '@/pages/OpenToWorkSettingsPage';
import { NetworkPage } from '@/pages/NetworkPage';
import { InvitesSentPage } from '@/pages/InvitesSentPage';
import { TotalConnectionsPage } from '@/pages/TotalConnectionsPage';
import { FollowingPage } from '@/pages/FollowingPage';
import { FirmsPage } from '@/pages/FirmsPage';
import { JobsPage } from '@/pages/JobsPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { GroupDetailPage } from '@/pages/GroupDetailPage';
import { BillingPage } from '@/pages/BillingPage';
import { TalentPage } from '@/pages/TalentPage';
import { TalentInsightsPage } from '@/pages/TalentInsightsPage';
import { HireWithAIPage } from '@/pages/HireWithAIPage';
import { SalesPage } from '@/pages/SalesPage';
import { MarketingPage } from '@/pages/MarketingPage';
import { LearningPage } from '@/pages/LearningPage';
import { PostDetailPage } from '@/pages/PostDetailPage';
import { ThemeRoomPage } from '@/pages/ThemeRoomPage';
import { StoreManagementPage } from '@/pages/StoreManagementPage';
import { UserStorePage } from '@/pages/UserStorePage';
import { PurchasedServicesPage } from '@/pages/PurchasedServicesPage';
import { FirmServiceOverviewPage } from '@/pages/FirmServiceOverviewPage';
import { FirmClientManagementPage } from '@/pages/FirmClientManagementPage';
import { AuthModal } from '@/components/ui/AuthModal';
import './App.css';

const AUTH_BYPASS_ENABLED = false;

// Routes that use their own dedicated ERP/admin layout (with its own
// sidebar) instead of the personal-network Navbar — the global rail would
// double up with their existing nav, so it's hidden on these paths.
const SHELL_EXCLUDED_PREFIXES = [
  '/login',
  '/register',
  '/company-setup',
  '/dashboard',
  '/modules',
  '/pages',
  '/connections',
  '/transactions',
  '/messages',
  '/company-settings',
  '/global',
  '/manage-store',
  '/firm/clients',
];

const getMemberNumber = (id?: string | null): string | undefined => {
  if (!id) return undefined;
  return String(Math.abs(Array.from(id).reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 1000000, 7)) + 100000).slice(0, 6);
};

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const showShell = !SHELL_EXCLUDED_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

  if (!showShell) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      <ProfileSidebar memberNumber={getMemberNumber(user?.id)} />
      <div className="app-shell__content" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppShell>
          <Routes>
            {/* Home Page */}
            <Route 
              path="/" 
              element={<Navigate to="/home" replace />} 
            />
            <Route path="/home" element={<HomePage />} />
            <Route path="/posts/:postId" element={<PostDetailPage />} />
            <Route path="/themes/:theme" element={<ThemeRoomPage />} />

            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* All Other Pages - Now Visible Without Login */}
            <Route path="/company-setup" element={<CompanySetupPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/modules" element={<ModulesPage />} />
            <Route path="/pages" element={<PagesPage />} />
            <Route path="/connections" element={<TotalConnectionsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/messages" element={<MessagingPage />} />
            <Route path="/company-settings" element={<CompanySettingsPage />} />
            <Route 
              path="/profile" 
              element={
                <ProfilePageWithKey />
              } 
            />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/network/invites" element={<InvitesSentPage />} />
            <Route path="/network/following" element={<FollowingPage />} />
            <Route path="/firms" element={<FirmsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/profile/resources" element={<ProfileResourcesPage />} />
            <Route path="/profile/settings/open-to" element={<OpenToWorkSettingsPage />} />

            {/* Ornave Global Routes */}
            <Route path="/global/dashboard" element={<GlobalDashboardPage />} />
            <Route path="/global/connections" element={<GlobalConnectionsPage />} />
            <Route path="/global/requests" element={<GlobalRequestsPage />} />
            <Route path="/global/documents" element={<GlobalDocumentsPage />} />
            <Route path="/global/payments" element={<GlobalPaymentsPage />} />
            <Route path="/global/activity" element={<GlobalActivityPage />} />

            {/* For Business Routes */}
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:slug" element={<GroupDetailPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/talent" element={<TalentPage />} />
            <Route path="/talent-insights" element={<TalentInsightsPage />} />
            <Route path="/hire-ai" element={<HireWithAIPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/marketing" element={<MarketingPage />} />
            <Route path="/learning" element={<LearningPage />} />
            
            {/* Store Routes */}
            <Route path="/manage-store" element={<StoreManagementPage />} />
            <Route path="/store" element={<UserStorePage />} />
            <Route path="/store/:companyId" element={<UserStorePage />} />
            <Route path="/firm/clients" element={<FirmClientManagementPage />} />
            <Route path="/purchased-services" element={<PurchasedServicesPage />} />
            <Route path="/purchased-services/:firmId" element={<FirmServiceOverviewPage />} />

            {/* Redirects */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </AppShell>
          <AuthModal />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
