import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { scopedKey } from '@/utils/storage';
import { CartProvider } from '@/context/CartContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProfileSidebar } from '@/components/personal/ProfileSidebar';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
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
import { useLocation, useNavigate } from 'react-router-dom';

const ProfilePageWithKey = () => {
  const location = useLocation();
  return <ProfilePage key={location.pathname + location.search} />;
};

// Tasks/Goals/Achievements were merged into one Personal Growth page — old
// links (including ?projectId= from the Projects page) still redirect there.
const WorkSuiteLegacyRedirect: React.FC<{ tab: 'board' | 'goals' | 'achievements' }> = ({ tab }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set('tab', tab);
  return <Navigate to={`/work-suite/personal?${params.toString()}`} replace />;
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
import { EventsPage } from '@/pages/EventsPage';
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
import { CheckoutPage } from '@/pages/CheckoutPage';
import { PurchasedServicesPage } from '@/pages/PurchasedServicesPage';
import { FirmServiceOverviewPage } from '@/pages/FirmServiceOverviewPage';
import { FirmClientManagementPage } from '@/pages/FirmClientManagementPage';
import { WorkSuiteHomePage } from '@/pages/WorkSuiteHomePage';
import { WorkSuiteProjectsPage } from '@/pages/WorkSuiteProjectsPage';
import { WorkSuitePersonalPage } from '@/pages/WorkSuitePersonalPage';
import { WorkSuiteClientsPage } from '@/pages/WorkSuiteClientsPage';
import { WorkSuiteInvoicesPage } from '@/pages/WorkSuiteInvoicesPage';
import { AuthModal } from '@/components/ui/AuthModal';
import { CreatePostModal } from '@/components/personal/CreatePostModal';
import { CreatePublicationModal } from '@/components/personal/CreatePublicationModal';
import { CreateStoryModal } from '@/components/personal/CreateStoryModal';
import { feedService } from '@/services/feedService';
import { publicationService } from '@/services/publicationService';
import { Story } from '@/components/personal/StoryViewer';
import { Mention, ServiceCard } from '@/types/feed';
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


export const MEMBER_TIER_KEY = 'ornave_member_tier';
export const VERIFIED_ADDON_KEY = 'ornave_verified_addon';
export const USER_STORIES_KEY = 'ornave_user_stories';

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const showShell = !SHELL_EXCLUDED_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

  const [memberTier, setMemberTier] = useState(() => localStorage.getItem(scopedKey(MEMBER_TIER_KEY, user?.id)) || 'Basic');
  const [verified, setVerified] = useState(() => localStorage.getItem(scopedKey(VERIFIED_ADDON_KEY, user?.id)) === 'true');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showCreatePublication, setShowCreatePublication] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setMemberTier(localStorage.getItem(scopedKey(MEMBER_TIER_KEY, user?.id)) || 'Basic');
      setVerified(localStorage.getItem(scopedKey(VERIFIED_ADDON_KEY, user?.id)) === 'true');
    };
    refresh(); // also re-sync immediately when the logged-in user changes
    window.addEventListener('ornave_state_update', refresh);
    return () => window.removeEventListener('ornave_state_update', refresh);
  }, [user?.id]);

  const userName = user ? `${user.firstName} ${user.lastName}` : 'You';

  const handleCreatePost = async (content: string, mediaUrl?: string, title?: string, serviceCard?: ServiceCard, tags?: string[]) => {
    try {
      await feedService.createPost(content, mediaUrl, title, serviceCard, tags);
      setShowCreatePost(false);
      window.dispatchEvent(new CustomEvent('ornave_feed_update'));
      navigate('/home');
    } catch (error: any) {
      console.error('Failed to create post:', error);
      alert(error?.response?.data?.message || 'Could not create that post — please try again.');
    }
  };

  const handleCreatePublication = async (params: { title: string; content: string; coverImage?: string; tags: string[]; postAsCompany?: boolean; mentions?: Mention[] }) => {
    try {
      await publicationService.createPublication(params);
    } finally {
      setShowCreatePublication(false);
      window.dispatchEvent(new CustomEvent('ornave_feed_update'));
      navigate('/home');
    }
  };

  const handleCreateStory = (params: { type: 'image' | 'video' | 'text'; image?: string; video?: string; heading?: string; text?: string; caption?: string; background?: string }) => {
    const existing: Story[] = JSON.parse(localStorage.getItem(USER_STORIES_KEY) || '[]');
    const story: Story = {
      id: `story-you-${Date.now()}`,
      type: 'user',
      name: userName,
      avatarUrl: '',
      profileSlug: 'me',
      slides: [{
        type: params.type,
        image: params.image,
        video: params.video,
        heading: params.heading,
        text: params.text,
        caption: params.caption,
        background: params.background,
      }],
    };
    try {
      localStorage.setItem(USER_STORIES_KEY, JSON.stringify([story, ...existing]));
    } catch {
      console.error('Story too large to store locally — try a smaller file.');
      return;
    }
    window.dispatchEvent(new CustomEvent('ornave_stories_update'));
    setShowCreateStory(false);
    navigate('/home');
  };

  if (!showShell) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      <ProfileSidebar
        memberNumber={user?.memberNumber ? String(user.memberNumber) : undefined}
        memberTier={`${verified ? 'Verified ' : ''}${memberTier === 'Basic' ? 'Basic Member' : memberTier}`}
        verified={verified}
        onCreatePost={() => setShowCreatePost(true)}
        onCreateStory={() => setShowCreateStory(true)}
        onCreatePublication={() => setShowCreatePublication(true)}
      />
      <div className="app-shell__content" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
        userName={userName}
        userAvatar={undefined}
      />
      <CreatePublicationModal
        isOpen={showCreatePublication}
        onClose={() => setShowCreatePublication(false)}
        onSubmit={handleCreatePublication}
      />
      <CreateStoryModal
        isOpen={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onSubmit={handleCreateStory}
      />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
        <CartProvider>
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
            <Route path="/verify-email" element={<VerifyEmailPage />} />

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
            <Route path="/events" element={<EventsPage />} />
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

            {/* Work Suite Routes */}
            <Route path="/work-suite" element={<WorkSuiteHomePage />} />
            <Route path="/work-suite/projects" element={<WorkSuiteProjectsPage />} />
            <Route path="/work-suite/personal" element={<WorkSuitePersonalPage />} />
            <Route path="/work-suite/clients" element={<WorkSuiteClientsPage />} />
            <Route path="/work-suite/invoices" element={<WorkSuiteInvoicesPage />} />
            {/* Tasks/Goals/Achievements were merged into one Personal Growth page — keep old links working. */}
            <Route path="/work-suite/tasks" element={<WorkSuiteLegacyRedirect tab="board" />} />
            <Route path="/work-suite/goals" element={<WorkSuiteLegacyRedirect tab="goals" />} />
            <Route path="/work-suite/achievements" element={<WorkSuiteLegacyRedirect tab="achievements" />} />

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
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/firm/clients" element={<FirmClientManagementPage />} />
            <Route path="/purchased-services" element={<PurchasedServicesPage />} />
            <Route path="/purchased-services/:firmId" element={<FirmServiceOverviewPage />} />

            {/* Redirects */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </AppShell>
          <AuthModal />
        </CartProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
