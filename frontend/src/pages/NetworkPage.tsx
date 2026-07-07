import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { networkService } from '@/services/networkService';
import './NetworkPage.css';

interface ConnectionRequest {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  mutualConnections: number;
  avatarUrl?: string;
}

interface Suggestion {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  mutualConnections: number;
  mutualConnectionName?: string;
  connected?: boolean;
  avatarUrl?: string;
}

interface PopularProfile {
  id: string;
  name: string;
  title: string;
  followers: string;
  following?: boolean;
  avatarUrl?: string;
}

export const NetworkPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'grow' | 'catchup'>('grow');
  const [invitesSent, setInvitesSent] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [popularProfiles, setPopularProfiles] = useState<PopularProfile[]>([]);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [filter, setFilter] = useState<'all' | 'location' | 'industry'>('all');

  useEffect(() => {
    if (user) {
      loadNetworkData();
    }

    const handleStateUpdate = () => {
      loadNetworkData();
    };

    window.addEventListener('ornave_state_update', handleStateUpdate);
    return () => window.removeEventListener('ornave_state_update', handleStateUpdate);
  }, [user]);

  const loadNetworkData = async () => {
    try {
      const stats = await networkService.getNetworkStats();
      const storedConnections = await networkService.getRecentConnections();
      const storedFollows = await firmService.getFollowedFirms();

      setConnectionsCount(storedConnections.length > 2 ? storedConnections.length + 125 : storedConnections.length);
      setFollowingCount(storedFollows.length + 7);
      setInvitesSent(3);
      
      setPendingRequests([
        {
          id: '1',
          firstName: 'Alex',
          lastName: 'Rivera',
          headline: 'Senior Supply Chain Consultant',
          mutualConnections: 4,
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Chen',
          headline: 'Industrial Designer | Robotics Enthusiast',
          mutualConnections: 2,
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
        }
      ]);

      setSuggestions([
        {
          id: '3',
          firstName: 'Marcus',
          lastName: 'Thorn',
          headline: 'Operations Director at NovaTech',
          mutualConnections: 3,
          mutualConnectionName: 'Sarah',
          connected: storedConnections.some(c => c.id === '3'),
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
        },
        {
          id: '4',
          firstName: 'Elena',
          lastName: 'Rodriguez',
          headline: 'Sustainability Lead | Environmental Advocate',
          mutualConnections: 5,
          mutualConnectionName: 'Alex',
          connected: storedConnections.some(c => c.id === '4'),
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop'
        },
        {
          id: '5',
          firstName: 'Julian',
          lastName: 'Vogt',
          headline: 'Full Stack Engineer | Open Source Contributor',
          mutualConnections: 2,
          mutualConnectionName: 'Michael',
          connected: storedConnections.some(c => c.id === '5'),
          avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop'
        },
        {
          id: '6',
          firstName: 'Sophia',
          lastName: 'Müller',
          headline: 'AI Ethics Researcher',
          mutualConnections: 1,
          mutualConnectionName: 'Sarah',
          connected: storedConnections.some(c => c.id === '6'),
          avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop'
        }
      ]);

      setPopularProfiles([
        { 
          id: 'p1', 
          name: 'Robert Habeck', 
          title: 'Federal Minister', 
          followers: '45.2K', 
          following: storedFollows.some(f => f.id === 'p1'),
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
        },
        { 
          id: 'p2', 
          name: 'Annalena Baerbock', 
          title: 'Minister for Foreign Affairs', 
          followers: '58.7K', 
          following: storedFollows.some(f => f.id === 'p2'),
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop'
        },
        { 
          id: 'p3', 
          name: 'Klaus Schwab', 
          title: 'Founder, World Economic Forum', 
          followers: '92.3K', 
          following: storedFollows.some(f => f.id === 'p3'),
          avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop'
        }
      ]);
    } catch (err) {
      console.error('Failed to load network data:', err);
    }
  };
  const handleAcceptInvite = async (id: string) => {
    const request = pendingRequests.find(r => r.id === id);
    if (request) {
      await networkService.addConnection({
        id: request.id,
        firstName: request.firstName,
        lastName: request.lastName,
        headline: request.headline,
        location: 'Unknown'
      });
      setPendingRequests(prev => prev.filter(req => req.id !== id));
    }
  };

  const handleIgnoreInvite = (id: string) => {
    setPendingRequests(prev => prev.filter(req => req.id !== id));
  };

  const handleConnect = async (suggestion: Suggestion) => {
    await networkService.addConnection({
      id: suggestion.id,
      firstName: suggestion.firstName,
      lastName: suggestion.lastName,
      headline: suggestion.headline,
      location: 'Remote'
    });
  };

  const handleDismiss = (id: string) => {
    setSuggestions(prev => prev.filter(sug => sug.id !== id));
  };

  const handleFollowPopular = async (profile: PopularProfile) => {
    if (profile.following) {
      await firmService.unfollowFirm(profile.id);
    } else {
      await firmService.followFirm({
        id: profile.id,
        name: profile.name,
        headline: profile.title,
        location: 'Global'
      });
    }
  };

  const handleViewProfile = (firstName: string, lastName: string) => {
    // Navigate to profile page with the person's name
    navigate(`/profile?view=${firstName.toLowerCase()}-${lastName.toLowerCase()}`);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`;
  };

  const displayedSuggestions = showAllSuggestions ? suggestions : suggestions.slice(0, 8);
  const displayedPopular = showAllPopular ? popularProfiles : popularProfiles.slice(0, 3);

  return (
    <>
      <Navbar />
      <ProtectedPageOverlay isVisible={!user} />
      <div className="network-page" style={!user ? { filter: 'blur(8px)', pointerEvents: 'none' } : {}}>
        <div className="network-page__container">
          {/* Left Sidebar */}
          <aside className="network-sidebar">
            <div className="network-sidebar__card">
              <div className="network-sidebar__header">
                <h2>Network Overview</h2>
              </div>
              
              <div className="network-stats">
                <button className="network-stat" onClick={() => navigate('/network/invites')}>
                  <div className="network-stat__info">
                    <div className="network-stat__icon network-stat__icon--invites">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                      </svg>
                    </div>
                    <span className="network-stat__label">Invitations Sent</span>
                  </div>
                  <span className="network-stat__value">{invitesSent}</span>
                </button>
                <button className="network-stat" onClick={() => navigate('/connections')}>
                  <div className="network-stat__info">
                    <div className="network-stat__icon network-stat__icon--connections">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <span className="network-stat__label">Total Connections</span>
                  </div>
                  <span className="network-stat__value">{connectionsCount}</span>
                </button>
                <button className="network-stat" onClick={() => navigate('/network/following')}>
                  <div className="network-stat__info">
                    <div className="network-stat__icon network-stat__icon--following">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                      </svg>
                    </div>
                    <span className="network-stat__label">Following</span>
                  </div>
                  <span className="network-stat__value">{followingCount}</span>
                </button>
                <button className="network-stat" onClick={() => navigate('/purchased-services')}>
                  <div className="network-stat__info">
                    <div className="network-stat__icon" style={{ background: 'var(--tech-blue-glow)', color: 'var(--tech-blue)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                    </div>
                    <span className="network-stat__label">Connected Services</span>
                  </div>
                  <span className="network-stat__value">2</span>
                </button>
              </div>

              <button className="network-sidebar__more" onClick={() => navigate('/profile')}>
                View profile <span>→</span>
              </button>
            </div>

            {/* Featured Firms Section */}
            <div className="network-sidebar__card network-sidebar__card--firms">
              <div className="network-sidebar__header">
                <h2>Featured Firms</h2>
              </div>
              <div className="sidebar-firms">
                <div className="sidebar-firm" onClick={() => navigate('/profile?view=ecostream-solutions')}>
                  <div className="sidebar-firm__logo" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1516383740770-fbcc5cbece03?w=100&h=100&fit=crop)', backgroundSize: 'cover' }}></div>
                  <div className="sidebar-firm__info">
                    <span className="sidebar-firm__name">EcoStream</span>
                    <span className="sidebar-firm__industry">Environmental</span>
                  </div>
                </div>
                <div className="sidebar-firm" onClick={() => navigate('/profile?view=novatech-robotics')}>
                  <div className="sidebar-firm__logo" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop)', backgroundSize: 'cover' }}></div>
                  <div className="sidebar-firm__info">
                    <span className="sidebar-firm__name">NovaTech</span>
                    <span className="sidebar-firm__industry">Manufacturing</span>
                  </div>
                </div>
              </div>
              <button className="network-sidebar__more" onClick={() => navigate('/firms')}>
                Discover firms <span>→</span>
              </button>
            </div>

            {/* Filter Section */}
            <div className="network-sidebar__filter">
              <h3>Filter Options</h3>
              <div className="filter-options">
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All Contacts
                </button>
                <button 
                  className={`filter-btn ${filter === 'location' ? 'active' : ''}`}
                  onClick={() => setFilter('location')}
                >
                  By Location
                </button>
                <button 
                  className={`filter-btn ${filter === 'industry' ? 'active' : ''}`}
                  onClick={() => setFilter('industry')}
                >
                  By Industry
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="network-main">
            <div className="network-tabs">
              <button 
                className={`network-tab ${activeTab === 'grow' ? 'network-tab--active' : ''}`}
                onClick={() => setActiveTab('grow')}
              >
                Grow Network
              </button>
              <button 
                className={`network-tab ${activeTab === 'catchup' ? 'network-tab--active' : ''}`}
                onClick={() => setActiveTab('catchup')}
              >
                Catch Up
              </button>
            </div>

            {/* Invites Received */}
            {activeTab === 'grow' && pendingRequests.length > 0 && (
              <section className="network-section">
                <div className="network-section__header">
                  <h2>Invites received ({pendingRequests.length})</h2>
                  <button className="network-section__link" onClick={() => navigate('/network/invites')}>
                    Show all →
                  </button>
                </div>

                <div className="invite-cards">
                  {pendingRequests.map(request => (
                    <div key={request.id} className="invite-card">
                      <div 
                        className="invite-card__avatar"
                        style={request.avatarUrl ? { backgroundImage: `url(${request.avatarUrl})`, backgroundSize: 'cover', color: 'transparent' } : {}}
                      >
                        {!request.avatarUrl && getInitials(request.firstName, request.lastName)}
                      </div>
                      <div className="invite-card__content">
                        <button 
                          className="invite-card__name"
                          onClick={() => handleViewProfile(request.firstName, request.lastName)}
                        >
                          {request.firstName} {request.lastName}
                          <span className="badge-icon">✓</span>
                        </button>
                        <p className="invite-card__headline">{request.headline}</p>
                        <p className="invite-card__mutual">
                          <span className="tech-label">Mutual:</span>
                          {request.mutualConnections} connections detected
                        </p>
                        <div className="invite-card__actions">
                          <button className="btn-ignore" onClick={() => handleIgnoreInvite(request.id)}>
                            ✕ Ignore
                          </button>
                          <button className="btn-accept" onClick={() => handleAcceptInvite(request.id)}>
                            ✓ Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* People You May Know */}
            {activeTab === 'grow' && (
              <section className="network-section">
                <div className="network-section__header">
                  <h2>People you may know in Greater Leipzig Area</h2>
                  <button 
                    className="network-section__link"
                    onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                  >
                    {showAllSuggestions ? 'Show less' : 'Show all'} →
                  </button>
                </div>

                <div className="suggestion-grid">
                  {displayedSuggestions.map(suggestion => (
                    <div key={suggestion.id} className="suggestion-card">
                      <button className="suggestion-card__dismiss" onClick={() => handleDismiss(suggestion.id)}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.5 3.5L8 8l4.5 4.5-1 1L7 9l-4.5 4.5-1-1L6 8 1.5 3.5l1-1L7 7l4.5-4.5z"/>
                        </svg>
                      </button>
                      <div 
                        className="suggestion-card__avatar"
                        onClick={() => handleViewProfile(suggestion.firstName, suggestion.lastName)}
                        style={suggestion.avatarUrl ? { cursor: 'pointer', backgroundImage: `url(${suggestion.avatarUrl})`, backgroundSize: 'cover', color: 'transparent' } : { cursor: 'pointer' }}
                      >
                        {!suggestion.avatarUrl && getInitials(suggestion.firstName, suggestion.lastName)}
                      </div>
                      <button 
                        className="suggestion-card__name"
                        onClick={() => handleViewProfile(suggestion.firstName, suggestion.lastName)}
                      >
                        {suggestion.firstName} {suggestion.lastName}
                      </button>
                      <p className="suggestion-card__headline">{suggestion.headline}</p>
                      {suggestion.mutualConnectionName && (
                        <p className="suggestion-card__mutual">
                          <span className="tech-label">Via:</span>
                          {suggestion.mutualConnectionName} (Mutual)
                        </p>
                      )}
                      <button 
                        className={`suggestion-card__connect ${suggestion.connected ? 'connected' : ''}`}
                        onClick={() => handleConnect(suggestion)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M14 7H9V2H7V7H2V9H7V14H9V9H14V7Z"/>
                        </svg>
                        {suggestion.connected ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Popular on LinkedIn */}
            {activeTab === 'grow' && (
              <section className="network-section">
                <div className="network-section__header">
                  <h2>Popular professionals</h2>
                  <button 
                    className="network-section__link"
                    onClick={() => setShowAllPopular(!showAllPopular)}
                  >
                    {showAllPopular ? 'Show less' : 'Show all'} →
                  </button>
                </div>

                <div className="popular-profiles">
                  {displayedPopular.map(profile => (
                    <div key={profile.id} className="popular-card">
                      <div 
                        className="popular-card__avatar"
                        style={profile.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})`, backgroundSize: 'cover', color: 'transparent' } : {}}
                      >
                        {!profile.avatarUrl && profile.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="popular-card__info">
                        <button 
                          className="popular-card__name"
                          onClick={() => navigate(`/profile?view=${profile.name.toLowerCase().replace(/\s+/g, '-')}`)}
                        >
                          {profile.name}
                        </button>
                        <span className="popular-card__title">{profile.title}</span>
                        <span className="popular-card__followers">{profile.followers} followers</span>
                      </div>
                      <button 
                        className={`btn-follow-popular ${profile.following ? 'following' : ''}`}
                        onClick={() => handleFollowPopular(profile)}
                      >
                        {profile.following ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Catch Up Tab */}
            {activeTab === 'catchup' && (
              <div className="catchup-section">
                <div className="catchup-card">
                  <h2 className="catchup-card__title">Network Activity</h2>
                  <p className="catchup-card__desc">
                    Your network is quiet right now. Check back later for updates from your connections.
                  </p>
                </div>
                
                <div className="network-section">
                  <div className="catchup-empty">
                    <div className="catchup-empty__icon">☕</div>
                    <h3>No Recent Activity</h3>
                    <p>Grow your network to see more updates and insights from industry peers.</p>
                    <button className="suggestion-card__connect" onClick={() => setActiveTab('grow')}>
                      Grow Your Network
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};
