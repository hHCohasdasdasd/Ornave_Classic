import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { networkService } from '@/services/networkService';
import { apiClient } from '@/services/api';
import {
  IconHome, IconCircles, IconInbox, IconBell, IconSuite, IconLaurel, IconMoon, IconSun,
  IconBuilding, IconBriefcase, IconSearch, IconUsers, IconCard, IconUser, IconChart, IconSpark,
} from './Icons';
import { mockProfileSections } from '@/data/mockProfileSections';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = React.useState(() => {
    const saved = localStorage.getItem('ornave-theme');
    return saved === 'dark';
  });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [isForBusinessMenuOpen, setIsForBusinessMenuOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [notificationsCount, setNotificationsCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = React.useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const forBusinessMenuRef = React.useRef<HTMLDivElement>(null);
  const notificationsMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('ornave-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  React.useEffect(() => {
    const loadStats = async () => {
      if (user && user.id !== 'guest') {
        try {
          const stats = await networkService.getNetworkStats();
          setNotificationsCount(stats.notifications);
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

  const handleOpenSettings = () => {
    setIsProfileMenuOpen(false);
    navigate('/settings');
  };

  const loadNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const response = await apiClient.getGlobalActivity();
      setNotifications(response.data || []);
      // Reset count when opening
      setNotificationsCount(0);
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

  // Same tier derivation as the profile hero card: only shown once we know
  // this account has real editorial content behind it (mockProfileSections),
  // so a fresh/empty account doesn't get a fabricated "Gold Member" badge.
  const memberTier = (() => {
    if (!user || user.id === 'guest' || user.userType === 'COMPANY_USER') return undefined;
    if (user.lastName?.toLowerCase() === 'hartwig' || user.firstName?.toLowerCase() === 'chuck') return 'Founding Member';
    const slug = `${user.firstName || ''}-${user.lastName || ''}`.toLowerCase().replace(/\s+/g, '-');
    return mockProfileSections[slug] ? 'Gold Member' : undefined;
  })();

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__left">
          <div className="navbar__logo" onClick={handleNavigateHome}>
            ORNAVE
          </div>
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
                        <div key={item.requestId} className="navbar__notification-item">
                          <div className="navbar__notification-title">{item.title}</div>
                          <div className="navbar__notification-desc">{item.description}</div>
                          <div className="navbar__notification-time">{item.lastUpdate}</div>
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
                <div className={`navbar__dropdown navbar__dropdown--work-suite ${(!user || user.id === 'guest' || user.userType !== 'COMPANY_USER') ? 'navbar__dropdown--restricted' : ''}`} role="menu">
                  {(!user || user.id === 'guest' || user.userType !== 'COMPANY_USER') && (
                    <div className="navbar__dropdown-overlay">
                      <div className="navbar__dropdown-message">
                        <span>Log in as a firm</span>
                        <button className="navbar__auth-btn navbar__auth-btn--primary" onClick={() => navigate('/login')}>Login</button>
                      </div>
                    </div>
                  )}
                  <div className="navbar__dropdown-content">
                    <div className="navbar__dropdown-section">
                      <div className="navbar__dropdown-header">Work Suite Apps</div>
                      <div className="navbar__forbiz-grid">
                        {forBusinessApps.map((app) => (
                          <button
                            key={app.route}
                            className="navbar__dropdown-item navbar__dropdown-item--app"
                            onClick={() => {
                              if (user && user.id !== 'guest' && user.userType === 'COMPANY_USER') {
                                navigate(app.route);
                                setIsForBusinessMenuOpen(false);
                              }
                            }}
                            role="menuitem"
                            disabled={!user || user.id === 'guest' || user.userType !== 'COMPANY_USER'}
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
            <button className="navbar__icon-btn navbar__icon-btn--accent" onClick={() => navigate('/dashboard')}>
              <span className="navbar__icon"><IconLaurel /></span>
              <span className="navbar__icon-label">Ornave Solutions</span>
            </button>
            <button
              className="navbar__icon-btn navbar__dark-toggle"
              onClick={() => setIsDark(d => !d)}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="navbar__icon">{isDark ? <IconSun /> : <IconMoon />}</span>
              <span className="navbar__icon-label">{isDark ? 'Light' : 'Dark'}</span>
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
                {user.firstName[0]}{user.lastName[0]}
                {notificationsCount > 0 && <span className="navbar__avatar-badge"></span>}
              </button>
              {isProfileMenuOpen && (
                <div className="navbar__menu" role="menu">
                  <button className="navbar__menu-item" onClick={handleOpenProfile} role="menuitem">
                    View profile
                  </button>
                  <button className="navbar__menu-item" onClick={handleOpenSettings} role="menuitem">
                    Settings
                  </button>
                  {memberTier && (
                    <button className="navbar__menu-item" onClick={handleLogout} role="menuitem">
                      Sign out
                    </button>
                  )}
                </div>
              )}
              <div className="navbar__profile-info">
                <span className="navbar__user">{user.firstName} {user.lastName}</span>
                {memberTier ? (
                  <span className="navbar__user-tier">{memberTier}</span>
                ) : (
                  <button className="navbar__logout" onClick={handleLogout}>Sign out</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
