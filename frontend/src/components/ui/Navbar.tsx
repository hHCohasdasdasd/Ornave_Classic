import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { networkService } from '@/services/networkService';
import { apiClient } from '@/services/api';
import { workSuiteService } from '@/services/workSuiteService';
import { notificationService } from '@/services/notificationService';
import { scopedKey } from '@/utils/storage';
import {
  IconHome, IconCircles, IconInbox, IconBell, IconSuite, IconLaurel,
  IconBuilding, IconBriefcase, IconSearch, IconUsers, IconCard, IconUser, IconChart, IconSpark,
  IconLogout, IconBag, IconLayers, IconHandshake, IconCompass,
  IconPaperclip,
} from './Icons';
interface NavbarProps {
  /** True when the global left nav rail (ProfileSidebar, rendered once in
   * App.tsx) is present alongside this page — hides the navbar's own logo
   * and offsets the bar's content so nothing duplicates or sits underneath
   * the rail. Defaults to true since the rail now shows on nearly every
   * route; pages excluded from the shell (ERP/admin layouts, login) don't
   * render this Navbar at all, so the default doesn't affect them. */
  sidebarOffset?: boolean;
}

function formatNotificationTime(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOffset = true }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [isForBusinessMenuOpen, setIsForBusinessMenuOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [notificationsCount, setNotificationsCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(undefined);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const forBusinessMenuRef = React.useRef<HTMLDivElement>(null);
  const notificationsMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!user || user.id === 'guest') {
      setAvatarUrl(undefined);
      return;
    }
    apiClient.getProfile().then((res) => {
      const url = res?.data?.profile?.avatarUrl;
      if (url) setAvatarUrl(url);
    }).catch(() => {});
  }, [user?.id]);

  React.useEffect(() => {
    const loadStats = async () => {
      if (user && user.id !== 'guest') {
        try {
          const [stats, realUnread] = await Promise.all([
            networkService.getNetworkStats(),
            notificationService.getUnreadCount().catch(() => 0),
          ]);
          setNotificationsCount(stats.notifications + realUnread);
        } catch (error) {
          console.error('Failed to load network stats:', error);
        }
      }
    };
    loadStats();

    const handleStateUpdate = () => {
      loadStats();
    };

    window.addEventListener('ornave_state_update', handleStateUpdate);

    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (forBusinessMenuRef.current && !forBusinessMenuRef.current.contains(event.target as Node)) {
        setIsForBusinessMenuOpen(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('ornave_state_update', handleStateUpdate);
    };
  }, [user]);

  const workSuiteApps = [
    {
      icon: <IconLayers />,
      label: 'Work Suite Home',
      description: 'Your mini-ERP hub — files, tasks, connections.',
      route: '/work-suite',
    },
    {
      icon: <IconPaperclip />,
      label: 'Files',
      description: 'Your own cloud — upload, store, and get back anything, anytime.',
      route: '/work-suite/files',
    },
    {
      icon: <IconHandshake />,
      label: 'Connections',
      description: "Your network — the people you're connected with on Ornave.",
      route: '/work-suite/connections',
    },
    {
      icon: <IconCompass />,
      label: 'Planning',
      description: 'Your board, goals, and achievements — all in one place.',
      route: '/work-suite/personal',
    },
  ];

  const forBusinessApps = [
    {
      icon: <IconBuilding />,
      label: 'Firms',
      description: 'Browse and discover firms in your network.',
      route: '/firms',
    },
    {
      icon: <IconBriefcase />,
      label: 'Jobs',
      description: 'Find and post job opportunities.',
      route: '/jobs',
    },
    {
      icon: <IconSearch />,
      label: 'Prospecting',
      description: 'Discover decision-makers and target accounts.',
      route: '/leads',
    },
    {
      icon: <IconUsers />,
      label: 'Groups',
      description: 'Build circles around industries and niches.',
      route: '/groups',
    },
    {
      icon: <IconCard />,
      label: 'Manage Billing',
      description: 'Control plan, invoices, and payment methods.',
      route: '/billing',
    },
    {
      icon: <IconUser />,
      label: 'Talent',
      description: 'Source people by skill, location, and intent.',
      route: '/talent',
    },
    {
      icon: <IconChart />,
      label: 'Hiring Metrics',
      description: 'Track hiring signals and funnel health.',
      route: '/talent-insights',
    },
    {
      icon: <IconSpark />,
      label: 'Smart Hiring',
      description: 'Draft roles and interview plans with AI help.',
      route: '/hire-ai',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleOpenProfile = () => {
    setIsProfileMenuOpen(false);
    navigate('/profile');
  };

  // Board notification-channel prefs are client-side only (set on the
  // Planning page), scoped per user so they don't bleed across accounts.
  const getTaskNotifyPrefs = () => {
    const defaults = { notifyOverdue: true, notifyDueSoon: true, notifyChannelApp: true };
    if (!user) return defaults;
    try {
      const raw = localStorage.getItem(scopedKey('worksuite_task_prefs', user.id));
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch {
      return defaults;
    }
  };

  const loadNotifications = async () => {
    try {
      setIsLoadingNotifications(true);

      // Three notification sources: company-level "Global Requests" activity
      // (GlobalRequest model), personal incoming connection requests
      // (UserConnection model), and task due/overdue reminders from the
      // Planning board's insights — gated by the board's own App-channel
      // preference so turning that off here also silences it there.
      const taskPrefs = getTaskNotifyPrefs();
      const [activityResponse, connectionRequests, insights, realNotifications] = await Promise.all([
        apiClient.getGlobalActivity().catch(() => ({ data: [] })),
        networkService.getConnectionRequests().catch(() => []),
        taskPrefs.notifyChannelApp ? workSuiteService.getInsights().catch(() => []) : Promise.resolve([]),
        notificationService.list().catch(() => []),
      ]);

      const realItems = realNotifications.map((n) => ({
        requestId: `notif-${n.id}`,
        title: n.title,
        description: n.body || '',
        lastUpdate: n.createdAt,
        type: 'app' as const,
        actionRoute: n.actionRoute || undefined,
      }));

      const activityItems = (activityResponse?.data || []).map((item: any) => ({
        requestId: item.requestId,
        title: item.title,
        description: item.description,
        lastUpdate: item.lastUpdate,
        type: 'activity' as const,
      }));

      const connectionItems = connectionRequests.map((r: any) => ({
        requestId: `connection-${r.id}`,
        title: `${r.user?.firstName || 'Someone'} ${r.user?.lastName || ''}`.trim() + ' wants to connect',
        description: r.user?.headline || 'Sent you a connection request',
        lastUpdate: r.timestamp,
        type: 'connection' as const,
      }));

      const now = new Date().toISOString();
      const taskItems = insights
        .filter((i: any) =>
          (i.id === 'overdue-tasks' && taskPrefs.notifyOverdue) ||
          (i.id === 'due-soon-tasks' && taskPrefs.notifyDueSoon)
        )
        .map((i: any) => ({
          requestId: `task-${i.id}`,
          title: i.message,
          description: i.id === 'overdue-tasks' ? 'Overdue task on your board' : 'Due soon on your board',
          lastUpdate: now,
          type: 'task' as const,
          actionRoute: i.actionRoute,
        }));

      const merged = [...taskItems, ...connectionItems, ...realItems, ...activityItems].sort(
        (a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()
      );

      setNotifications(merged);
      // Reset count when opening
      setNotificationsCount(0);
      notificationService.markAllRead().catch(() => {});
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const toggleNotifications = () => {
    const nextState = !isNotificationsOpen;
    setIsNotificationsOpen(nextState);
    if (nextState) {
      loadNotifications();
    }
  };

  const handleNavigateHome = () => {
    navigate(user && user.id !== 'guest' ? '/home' : '/');
  };

  // No real membership-tier data source yet — leave unset so a fresh
  // account doesn't get a fabricated tier badge.
  const memberTier: string | undefined = undefined;

  return (
    <nav className={`navbar ${sidebarOffset ? 'navbar--sidebar-offset' : ''}`}>
      <div className="navbar__container">
        <div className="navbar__left">
          {!sidebarOffset && (
            <div className="navbar__logo" onClick={handleNavigateHome}>
              ORNAVE
            </div>
          )}
        </div>

        <div className="navbar__center">
          <div className="navbar__icon-nav">
            <button className="navbar__icon-btn" onClick={handleNavigateHome}>
              <span className="navbar__icon"><IconHome /></span>
              <span className="navbar__icon-label">Home</span>
            </button>
            <button className="navbar__icon-btn" onClick={() => navigate('/network')}>
              <span className="navbar__icon"><IconCircles /></span>
              <span className="navbar__icon-label">Circles</span>
            </button>
            <button className="navbar__icon-btn" onClick={() => navigate('/messages')}>
              <span className="navbar__icon"><IconInbox /></span>
              <span className="navbar__icon-label">Inbox</span>
            </button>
            <div className="navbar__dropdown-container" ref={notificationsMenuRef}>
              <button 
                className="navbar__icon-btn" 
                onClick={toggleNotifications}
                aria-haspopup="menu"
                aria-expanded={isNotificationsOpen}
              >
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="navbar__icon"><IconBell /></span>
                  <span className="navbar__icon-label">Notifications</span>
                  {notificationsCount > 0 && <span className="navbar__notification-badge-icon">{notificationsCount}</span>}
                </div>
              </button>
              {isNotificationsOpen && (
                <div className="navbar__dropdown navbar__dropdown--notifications" role="menu">
                  <div className="navbar__dropdown-header">Notifications</div>
                  <div className="navbar__dropdown-content navbar__dropdown-content--scrollable">
                    {isLoadingNotifications ? (
                      <div className="navbar__dropdown-loading">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="navbar__dropdown-empty">No notifications yet.</div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.requestId}
                          className="navbar__notification-item"
                          role="menuitem"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            if (item.type === 'task') navigate(item.actionRoute || '/work-suite/personal?tab=board');
                            else if (item.type === 'app') navigate(item.actionRoute || '/home');
                            else navigate(item.type === 'connection' ? '/network' : '/global/activity');
                          }}
                        >
                          <div className="navbar__notification-title">{item.title}</div>
                          <div className="navbar__notification-desc">{item.description}</div>
                          <div className="navbar__notification-time">{formatNotificationTime(item.lastUpdate)}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <button 
                    className="navbar__dropdown-footer-btn" 
                    onClick={() => {
                      navigate('/global/activity');
                      setIsNotificationsOpen(false);
                    }}
                  >
                    View all activity
                  </button>
                </div>
              )}
            </div>
            <span className="navbar__divider" aria-hidden="true"></span>
            <div className="navbar__dropdown-container" ref={forBusinessMenuRef}>
              <button 
                className="navbar__icon-btn" 
                onClick={() => setIsForBusinessMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isForBusinessMenuOpen}
              >
                <span className="navbar__icon"><IconSuite /></span>
                <span className="navbar__icon-label">Work Suite</span>
              </button>
              {isForBusinessMenuOpen && (
                <div className={`navbar__dropdown navbar__dropdown--work-suite ${(!user || user.id === 'guest') ? 'navbar__dropdown--restricted' : ''}`} role="menu">
                  {(!user || user.id === 'guest') && (
                    <div className="navbar__dropdown-overlay">
                      <div className="navbar__dropdown-message">
                        <span>Sign in to open Work Suite</span>
                        <button className="navbar__auth-btn navbar__auth-btn--primary" onClick={() => navigate('/login')}>Login</button>
                      </div>
                    </div>
                  )}
                  <div className="navbar__dropdown-content">
                    <div className="navbar__dropdown-section">
                      <div className="navbar__dropdown-header">Mini ERP</div>
                      <div className="navbar__forbiz-grid">
                        {workSuiteApps.map((app) => (
                          <button
                            key={app.route}
                            className="navbar__dropdown-item navbar__dropdown-item--app"
                            onClick={() => {
                              if (user && user.id !== 'guest') {
                                navigate(app.route);
                                setIsForBusinessMenuOpen(false);
                              }
                            }}
                            role="menuitem"
                            disabled={!user || user.id === 'guest'}
                          >
                            <span className="navbar__forbiz-app-icon">{app.icon}</span>
                            <span className="navbar__forbiz-app-copy">
                              <span className="navbar__forbiz-app-title">{app.label}</span>
                              <span className="navbar__forbiz-app-desc">{app.description}</span>
                            </span>
                            <span className="navbar__forbiz-app-arrow" aria-hidden="true">↗</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="navbar__dropdown-section">
                      <div className="navbar__dropdown-header">Growth &amp; Hiring</div>
                      <div className="navbar__forbiz-grid">
                        {forBusinessApps.map((app) => (
                          <button
                            key={app.route}
                            className="navbar__dropdown-item navbar__dropdown-item--app"
                            onClick={() => {
                              if (user && user.id !== 'guest') {
                                navigate(app.route);
                                setIsForBusinessMenuOpen(false);
                              }
                            }}
                            role="menuitem"
                            disabled={!user || user.id === 'guest'}
                          >
                            <span className="navbar__forbiz-app-icon">{app.icon}</span>
                            <span className="navbar__forbiz-app-copy">
                              <span className="navbar__forbiz-app-title">{app.label}</span>
                              <span className="navbar__forbiz-app-desc">{app.description}</span>
                            </span>
                            <span className="navbar__forbiz-app-arrow" aria-hidden="true">↗</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button className="navbar__icon-btn navbar__icon-btn--accent" onClick={() => navigate('/work-suite')}>
              <span className="navbar__icon"><IconLaurel /></span>
              <span className="navbar__icon-label">Ornave Solutions</span>
            </button>
          </div>
        </div>

        <div className="navbar__right">
          <button className="navbar__search-btn" onClick={() => navigate('/network')} title="Search" aria-label="Search">
            <IconSearch size={17} />
          </button>
          {!user || user.id === 'guest' ? (
            <div className="navbar__auth">
              <button className="navbar__auth-btn" onClick={() => navigate('/login')}>
                Login
              </button>
              <button className="navbar__auth-btn navbar__auth-btn--primary" onClick={() => navigate('/register')}>
                Get Started
              </button>
            </div>
          ) : (
            <div className="navbar__profile" ref={profileMenuRef}>
              <button
                className="navbar__avatar"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="navbar__avatar-img" />
                ) : (
                  <>{user.firstName[0]}{user.lastName[0]}</>
                )}
                {notificationsCount > 0 && <span className="navbar__avatar-badge"></span>}
              </button>
              <div className="navbar__profile-info">
                <span className="navbar__user">{user.firstName} {user.lastName}</span>
                {memberTier && <span className="navbar__user-tier">{memberTier}</span>}
              </div>
              <button
                className="navbar__chevron"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                aria-label="Account menu"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isProfileMenuOpen && (
                <div className="navbar__menu" role="menu">
                  <div className="navbar__menu-header">
                    <div className="navbar__menu-avatar">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" />
                      ) : (
                        <>{user.firstName[0]}{user.lastName[0]}</>
                      )}
                    </div>
                    <div className="navbar__menu-header-text">
                      <span className="navbar__menu-name">{user.firstName} {user.lastName}</span>
                      <span className="navbar__menu-email">{user.email}</span>
                    </div>
                  </div>

                  <div className="navbar__menu-divider" />

                  <button className="navbar__menu-item" onClick={handleOpenProfile} role="menuitem">
                    <IconUser size={15} />
                    View profile
                  </button>

                  <button className="navbar__menu-item" onClick={() => { setIsProfileMenuOpen(false); navigate('/purchased-services'); }} role="menuitem">
                    <IconBag size={15} />
                    Orders &amp; Invoices
                  </button>

                  <div className="navbar__menu-divider" />

                  <button className="navbar__menu-item navbar__menu-item--danger" onClick={handleLogout} role="menuitem">
                    <IconLogout size={15} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
