import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { CreatePostModal } from '@/components/personal/CreatePostModal';
import { FeedItem } from '@/components/personal/FeedItem';
import { UserCard } from '@/components/personal/UserCard';
import { FirmCard } from '@/components/personal/FirmCard';
import { NetworkSnapshot } from '@/components/personal/NetworkSnapshot';
import { Carousel, CarouselSlide } from '@/components/personal/Carousel';
import { QuickActionsSidebar } from '@/components/personal/QuickActionsSidebar';
import { NewsCard } from '@/components/personal/NewsCard';
import { ERPSnapshotCard } from '@/components/personal/ERPSnapshotCard';
import { IconLaurel, IconSearch, IconEdit, IconUsers, IconUser, IconBuilding } from '@/components/ui/Icons';
import { feedService } from '@/services/feedService';
import { discoveryService } from '@/services/discoveryService';
import { networkService } from '@/services/networkService';
import { FeedItem as FeedItemType, ServiceCard } from '@/types/feed';
import { UserProfile, FirmProfile, ConnectionRequest } from '@/types/discovery';
import './PersonalHomePage.css';

interface PersonalHomePageProps {
  user: User | null;
}

const DISCOVERY_VISIBLE_COUNT = 4;

const carouselSlides: CarouselSlide[] = [
  {
    id: 'slide-1',
    title: 'Welcome to Ornave',
    description: 'Connect with professionals and firms in your network. Share insights, collaborate, and grow together.',
    icon: <IconLaurel size={40} />,
    bgColor: 'linear-gradient(135deg, rgba(155, 74, 70, 0.5) 0%, rgba(20, 20, 15, 0.6) 100%)',
  },
  {
    id: 'slide-2',
    title: 'Discover Opportunities',
    description: 'Browse people and firms, find new connections, and expand your professional reach.',
    icon: <IconSearch size={40} />,
    bgColor: 'linear-gradient(135deg, rgba(184, 149, 95, 0.35) 0%, rgba(20, 20, 15, 0.6) 100%)',
  },
  {
    id: 'slide-3',
    title: 'Share Your Updates',
    description: 'Post updates, news, and achievements to keep your network informed and engaged.',
    icon: <IconEdit size={40} />,
    bgColor: 'linear-gradient(135deg, rgba(155, 74, 70, 0.5) 0%, rgba(184, 149, 95, 0.3) 100%)',
  },
  {
    id: 'slide-4',
    title: 'Manage Connections',
    description: 'Accept or decline connection requests and nurture meaningful professional relationships.',
    icon: <IconUsers size={40} />,
    bgColor: 'linear-gradient(135deg, rgba(20, 20, 15, 0.6) 0%, rgba(155, 74, 70, 0.4) 100%)',
  },
];

export const PersonalHomePage: React.FC<PersonalHomePageProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerAuthModal } = useAuth();
  
  // State
  const [feedItems, setFeedItems] = useState<FeedItemType[]>([]);
  const [discoveredUsers, setDiscoveredUsers] = useState<UserProfile[]>([]);
  const [discoveredFirms, setDiscoveredFirms] = useState<FirmProfile[]>([]);
  const [isSearchingResults, setIsSearchingResults] = useState(false);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [networkStats, setNetworkStats] = useState({
    connectionCount: 0,
    unreadMessages: 0,
    notifications: 0,
  });
  
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(true);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(true);
  const [discoveryTab, setDiscoveryTab] = useState<'people' | 'firms' | 'trending' | 'themes'>('people');
  const [showAllDiscovery, setShowAllDiscovery] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [feedViewMode, setFeedViewMode] = useState<'groups' | 'single'>('groups');
  const [feedContentType, setFeedContentType] = useState<'all' | 'friends' | 'firms'>('all');
  const [feedSort, setFeedSort] = useState<'hot' | 'new' | 'top' | 'rising'>('hot');
  const [feedMode, setFeedMode] = useState<'forYou' | 'following'>('forYou');
  const [trendingPosts, setTrendingPosts] = useState<FeedItemType[]>([]);
  const [topThemes, setTopThemes] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(
    (location.state as any)?.selectedTheme || null
  );
  // Keyboard nav
  const [focusedPostIndex, setFocusedPostIndex] = useState<number>(-1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Search autocomplete
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Load initial data
  useEffect(() => {
    // If we came with a theme, switch to themes tab
    if (selectedTheme) {
      setDiscoveryTab('themes');
    }
    loadFeed();
    loadDiscovery();
    loadNetwork();
    loadNetworkStats();
    loadTrendingAndThemes();

    const handleStateUpdate = () => {
      loadNetworkStats();
      loadDiscovery();
    };

    window.addEventListener('ornave_state_update', handleStateUpdate);
    return () => window.removeEventListener('ornave_state_update', handleStateUpdate);
  }, [selectedTheme]);

  const loadFeed = async () => {
    try {
      setIsLoadingFeed(true);
      const response = await feedService.getFeed(undefined, selectedTheme || undefined);
      setFeedItems(response.items);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const loadDiscovery = async () => {
    try {
      setIsLoadingDiscovery(true);
      const [users, firms] = await Promise.all([
        discoveryService.discoverUsers(),
        discoveryService.discoverFirms(),
      ]);
      setDiscoveredUsers(users);
      setDiscoveredFirms(firms);
    } catch (error) {
      console.error('Failed to load discovery:', error);
    } finally {
      setIsLoadingDiscovery(false);
    }
  };

  const loadNetwork = async () => {
    try {
      setIsLoadingNetwork(true);
      const requests = await networkService.getConnectionRequests();
      setConnectionRequests(requests);
    } catch (error) {
      console.error('Failed to load network:', error);
    } finally {
      setIsLoadingNetwork(false);
    }
  };

  const loadNetworkStats = async () => {
    try {
      const stats = await networkService.getNetworkStats();
      setNetworkStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadTrendingAndThemes = async () => {
    try {
      const [trending, themes] = await Promise.all([
        feedService.getTrendingPosts(),
        feedService.getTopThemes(),
      ]);
      setTrendingPosts(trending);
      setTopThemes(themes);
    } catch (error) {
      console.error('Failed to load trending posts and themes:', error);
    }
  };

  const handleConnectUser = async (userId: string) => {
    if (!user) {
      triggerAuthModal('Please log in to connect with other professionals.');
      return;
    }
    try {
      await discoveryService.sendConnectionRequest(userId);
      setDiscoveredUsers(prev => 
        prev.map(u => u.id === userId ? { ...u, isConnected: true } : u)
      );
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleConnectFirm = async (firmId: string) => {
    if (!user) {
      triggerAuthModal('Please log in to follow firms.');
      return;
    }
    try {
      await discoveryService.connectWithFirm(firmId);
      setDiscoveredFirms(prev => 
        prev.map(f => f.id === firmId ? { ...f, isConnected: true } : f)
      );
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleAcceptConnection = async (requestId: string) => {
    try {
      await networkService.acceptConnection(requestId);
      setConnectionRequests(prev => prev.filter(r => r.id !== requestId));
      await loadNetworkStats();
    } catch (error) {
      console.error('Failed to accept connection:', error);
    }
  };

  const handleRejectConnection = async (requestId: string) => {
    try {
      await networkService.rejectConnection(requestId);
      setConnectionRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Failed to reject connection:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearchingResults(false);
      loadDiscovery();
      return;
    }

    try {
      setIsLoadingDiscovery(true);
      setIsSearchingResults(true);
      
      // Perform cross-tab search to find results anywhere
      const [users, firms] = await Promise.all([
        discoveryService.discoverUsers({ search: searchQuery }),
        discoveryService.discoverFirms({ search: searchQuery })
      ]);

      setDiscoveredUsers(users);
      setDiscoveredFirms(firms);

      // Auto-switch tab if results are found only in the other tab
      if (discoveryTab === 'people' && users.length === 0 && firms.length > 0) {
        setDiscoveryTab('firms');
      } else if (discoveryTab === 'firms' && firms.length === 0 && users.length > 0) {
        setDiscoveryTab('people');
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoadingDiscovery(false);
    }
  };

  // Add real-time search support
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      } else if (isSearchingResults) {
        setIsSearchingResults(false);
        loadDiscovery();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard shortcuts: j/k navigate, l like, c comments, ? help
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '?') { setShowShortcuts(s => !s); return; }
      if (e.key === 'Escape') { setShowShortcuts(false); return; }
      if (e.key === 'j') {
        setFocusedPostIndex(i => {
          const next = Math.min(i + 1, feedItems.length - 1);
          document.querySelectorAll('[data-post-id]')[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return next;
        });
      }
      if (e.key === 'k') {
        setFocusedPostIndex(i => {
          const prev = Math.max(i - 1, 0);
          document.querySelectorAll('[data-post-id]')[prev]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return prev;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [feedItems.length]);

  const handleCreatePost = async (content: string, mediaUrl?: string, title?: string, serviceCard?: ServiceCard) => {
    try {
      const newPost = await feedService.createPost(content, mediaUrl, title, serviceCard);
      setFeedItems(prev => [newPost, ...prev]);
      setShowCreatePostModal(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleThemeClick = (theme: string) => {
    setSelectedTheme(prevTheme => prevTheme === theme ? null : theme);
    // Smooth scroll to feed
    document.querySelector('.personal-home__center')?.scrollIntoView({ behavior: 'smooth' });
  };

  const discoveryTabCount = discoveryTab === 'people' ? discoveredUsers.length
    : discoveryTab === 'firms' ? discoveredFirms.length
    : discoveryTab === 'trending' ? trendingPosts.length
    : topThemes.length;

  return (
    <div className="personal-home">
      <Navbar />
      <QuickActionsSidebar
        onCreatePost={() => user ? setShowCreatePostModal(true) : triggerAuthModal('Sign in to create a post.')}
        onBrowseFirms={() => {
          setDiscoveryTab('firms');
          document.querySelector('.personal-home__left')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onBrowsePeople={() => {
          setDiscoveryTab('people');
          document.querySelector('.personal-home__left')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
      
      <div className="personal-home__layout">
        {/* Left Column - Discovery */}
        <div className="personal-home__left">
          <ERPSnapshotCard />
          <div className="discovery-section">
            <div className="discovery-section__header">
              <h3 className="discovery-section__title">Discover</h3>

              <div className="discovery-section__tabs">
                <button
                  className={`discovery-section__tab ${discoveryTab === 'people' ? 'discovery-section__tab--active' : ''}`}
                  onClick={() => { setDiscoveryTab('people'); setShowAllDiscovery(false); }}
                >
                  People
                </button>
                <button
                  className={`discovery-section__tab ${discoveryTab === 'firms' ? 'discovery-section__tab--active' : ''}`}
                  onClick={() => { setDiscoveryTab('firms'); setShowAllDiscovery(false); }}
                >
                  Companies
                </button>
                <button
                  className={`discovery-section__tab ${discoveryTab === 'trending' ? 'discovery-section__tab--active' : ''}`}
                  onClick={() => { setDiscoveryTab('trending'); setShowAllDiscovery(false); }}
                >
                  Trending
                </button>
                <button
                  className={`discovery-section__tab ${discoveryTab === 'themes' ? 'discovery-section__tab--active' : ''}`}
                  onClick={() => { setDiscoveryTab('themes'); setShowAllDiscovery(false); }}
                >
                  Themes
                </button>
              </div>

              <input
                type="text"
                className="discovery-section__search"
                placeholder={`Search ${discoveryTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={{ display: discoveryTab === 'trending' || discoveryTab === 'themes' ? 'none' : 'block' }}
              />
            </div>

            {isLoadingDiscovery ? (
              <div className="discovery-section__empty">Loading...</div>
            ) : (
              <div className="discovery-section__list">
                {isSearchingResults && (
                  <div style={{ padding: '10px 15px', borderBottom: '1px solid var(--tech-border)', background: 'var(--tech-blue-glow)', fontSize: '0.7rem', color: 'var(--tech-blue)', fontWeight: 800 }}>
                    SEARCH_QUERY_ACTIVE: {searchQuery.toUpperCase()}
                  </div>
                )}
                {discoveryTab === 'people' ? (
                  discoveredUsers.length === 0 ? (
                    <div className="discovery-section__empty">No people found</div>
                  ) : (
                    (showAllDiscovery ? discoveredUsers : discoveredUsers.slice(0, DISCOVERY_VISIBLE_COUNT)).map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onConnect={handleConnectUser}
                      />
                    ))
                  )
                ) : discoveryTab === 'firms' ? (
                  discoveredFirms.length === 0 ? (
                    <div className="discovery-section__empty">
                      {isSearchingResults ? `No firms matching "${searchQuery}"` : 'No firms found'}
                    </div>
                  ) : (
                    (showAllDiscovery ? discoveredFirms : discoveredFirms.slice(0, DISCOVERY_VISIBLE_COUNT)).map((firm) => (
                      <FirmCard
                        key={firm.id || firm.name}
                        firm={firm}
                        onConnect={handleConnectFirm}
                      />
                    ))
                  )
                ) : discoveryTab === 'trending' ? (
                  trendingPosts.length === 0 ? (
                    <div className="discovery-section__empty">No trending posts yet</div>
                  ) : (
                    (showAllDiscovery ? trendingPosts : trendingPosts.slice(0, DISCOVERY_VISIBLE_COUNT)).map((post, index) => (
                      <div 
                        key={post.id} 
                        className="trending-post-card"
                        onClick={() => navigate(`/posts/${post.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="trending-post-card__rank">#{index + 1}</div>
                        <div className="trending-post-card__header">
                          <div className="trending-post-card__author">
                            <div 
                              className="trending-post-card__avatar"
                              onClick={(e) => {
                                e.stopPropagation();
                                const slug = `${post.author.firstName.toLowerCase()}-${post.author.lastName.toLowerCase()}`;
                                navigate(`/profile?view=${slug}`);
                              }}
                            >
                              {post.author.firstName[0]}{post.author.lastName[0]}
                            </div>
                            <div 
                              className="trending-post-card__info"
                              onClick={(e) => {
                                e.stopPropagation();
                                const slug = `${post.author.firstName.toLowerCase()}-${post.author.lastName.toLowerCase()}`;
                                navigate(`/profile?view=${slug}`);
                              }}
                            >
                              <strong>{post.author.firstName} {post.author.lastName}</strong>
                              <span className="trending-post-card__headline">{post.author.headline}</span>
                            </div>
                          </div>
                        </div>
                        <div className="trending-post-card__content">
                          {post.title && <div className="trending-post-card__title">{post.title}</div>}
                          {post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content}
                        </div>
                        <div className="trending-post-card__engagement">
                          <span title="Likes">👍 {post.reactions.likes}</span>
                          <span title="Comments">💬 {post.reactions.comments}</span>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  // Themes tab
                  topThemes.length === 0 ? (
                    <div className="discovery-section__empty">No trending themes this week</div>
                  ) : (
                    <div className="themes-grid">
                      {(showAllDiscovery ? topThemes : topThemes.slice(0, DISCOVERY_VISIBLE_COUNT)).map((theme, index) => (
                        <div 
                          key={index} 
                          className={`theme-card ${selectedTheme === theme ? 'theme-card--active' : ''}`}
                          onClick={() => handleThemeClick(theme)}
                        >
                          <div className="theme-card__rank">#{index + 1}</div>
                          <div className="theme-card__name">{theme}</div>
                          <div className="theme-card__tag">{selectedTheme === theme ? 'Filtered' : 'Trending'}</div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {!isLoadingDiscovery && discoveryTabCount > DISCOVERY_VISIBLE_COUNT && (
              <button
                className="discovery-section__show-more"
                onClick={() => setShowAllDiscovery((prev) => !prev)}
              >
                {showAllDiscovery ? 'Show Less' : `Show More (${discoveryTabCount - DISCOVERY_VISIBLE_COUNT})`}
              </button>
            )}
          </div>

          <NetworkSnapshot
            requests={connectionRequests}
            onAccept={handleAcceptConnection}
            onReject={handleRejectConnection}
            isLoading={isLoadingNetwork}
          />
          <NewsCard />
        </div>

        {/* Right Column - Main Feed */}
        <div className="personal-home__center">
          {/* Stories Row — Instagram / TikTok style */}
          <div className="stories-row">
            {/* Your story bubble */}
            <div
              className="story-item story-item--create"
              onClick={() => user ? setShowCreatePostModal(true) : triggerAuthModal('Sign in to create a post.')}
            >
              <div className="story-avatar story-avatar--create">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : '+'}
              </div>
              <span>{user ? 'Your Story' : 'Sign In'}</span>
            </div>
            {/* Network stories from discovered users */}
            {discoveredUsers.slice(0, 8).map((u) => (
              <div
                key={u.id}
                className="story-item"
                onClick={() => navigate(`/profile?view=${u.firstName.toLowerCase()}-${u.lastName.toLowerCase()}`)}
              >
                <div className="story-avatar">
                  {u.firstName[0]}{u.lastName[0]}
                </div>
                <span>{u.firstName}</span>
              </div>
            ))}
          </div>

          <Carousel slides={carouselSlides} />

          {selectedTheme && (
            <div className="feed-filter-indicator">
              <span>Showing posts for: <strong>{selectedTheme}</strong></span>
              <button
                className="feed-filter-indicator__clear"
                onClick={() => setSelectedTheme(null)}
              >
                Clear Filter
              </button>
            </div>
          )}

          <div className="personal-home__search" style={{ position: 'relative' }}>
            <span className="personal-home__search-icon"><IconSearch size={15} /></span>
            <input
              className="personal-home__search-input"
              type="text"
              placeholder="Search people, firms, posts…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowAutocomplete(true); }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => setShowAutocomplete(true)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
            />
            {showAutocomplete && searchQuery.length > 1 && (discoveredUsers.length > 0 || discoveredFirms.length > 0) && (
              <div className="search-autocomplete">
                {discoveredUsers.slice(0, 3).map(u => (
                  <div
                    key={u.id}
                    className="search-autocomplete__item"
                    onMouseDown={() => navigate(`/profile?view=${u.firstName.toLowerCase()}-${u.lastName.toLowerCase()}`)}
                  >
                    <span className="search-autocomplete__icon"><IconUser size={14} /></span>
                    <span className="search-autocomplete__label">{u.firstName} {u.lastName}</span>
                    {u.headline && <span className="search-autocomplete__sub">{u.headline}</span>}
                  </div>
                ))}
                {discoveredFirms.slice(0, 2).map(f => (
                  <div
                    key={f.id || f.name}
                    className="search-autocomplete__item"
                    onMouseDown={() => navigate('/firms')}
                  >
                    <span className="search-autocomplete__icon"><IconBuilding size={14} /></span>
                    <span className="search-autocomplete__label">{f.name}</span>
                    {f.industry && <span className="search-autocomplete__sub">{f.industry}</span>}
                  </div>
                ))}
                <div className="search-autocomplete__footer" onMouseDown={handleSearch}>
                  Search all results for "{searchQuery}"
                </div>
              </div>
            )}
          </div>

          {/* For You / Following tabs — TikTok style */}
          <div className="feed__mode-bar">
            <div className="feed__mode-tabs">
              <button
                className={`feed__mode-tab${feedMode === 'forYou' ? ' feed__mode-tab--active' : ''}`}
                onClick={() => setFeedMode('forYou')}
              >
                For You
              </button>
              <button
                className={`feed__mode-tab${feedMode === 'following' ? ' feed__mode-tab--active' : ''}`}
                onClick={() => setFeedMode('following')}
              >
                Following
              </button>
            </div>

            {/* View toggle */}
            <div className="feed__view-toggle">
              <button
                className={`feed__view-btn${feedViewMode === 'groups' ? ' feed__view-btn--active' : ''}`}
                onClick={() => setFeedViewMode('groups')}
                title="Grid view"
              >⊞</button>
              <button
                className={`feed__view-btn${feedViewMode === 'single' ? ' feed__view-btn--active' : ''}`}
                onClick={() => setFeedViewMode('single')}
                title="List view"
              >☰</button>
            </div>
          </div>

          {/* Reddit-style sort tabs + filter */}
          <div className="feed__sort-bar">
            <div className="feed__sort-tabs">
              {(['hot', 'new', 'top', 'rising'] as const).map((s) => {
                const icons = { hot: '🔥', new: '✨', top: '📈', rising: '🚀' };
                const labels = { hot: 'Hot', new: 'New', top: 'Top', rising: 'Rising' };
                return (
                  <button
                    key={s}
                    className={`feed__sort-tab${feedSort === s ? ' feed__sort-tab--active' : ''}`}
                    onClick={() => setFeedSort(s)}
                  >
                    {icons[s]} {labels[s]}
                  </button>
                );
              })}
            </div>
            <div className="feed__filter-pills">
              {(['all', 'friends', 'firms'] as const).map((f) => {
                const labels = { all: 'All', friends: 'Connections', firms: 'Companies' };
                return (
                  <button
                    key={f}
                    className={`feed__filter-pill${feedContentType === f ? ' feed__filter-pill--active' : ''}`}
                    onClick={() => setFeedContentType(f)}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Feed */}
          <div className={`feed feed--${feedViewMode}`}>
            {isLoadingFeed ? (
              <div className="feed__loading">Loading your activity feed...</div>
            ) : feedItems.length === 0 ? (
              <div className="feed__empty">
                <p>No activity yet. Start connecting with people and firms!</p>
              </div>
            ) : (
              <div className={`feed__list feed__list--${feedViewMode}`}>
                {feedItems.map((item, idx) => (
                  <FeedItem key={item.id} item={item} focused={idx === focusedPostIndex} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar — Twitter-style trending */}
        <aside className="personal-home__right">
          {/* Search hint */}
          <div className="right-sidebar__search-hint">
            <span>⌨️</span>
            <span>Press <kbd>?</kbd> for keyboard shortcuts</span>
          </div>

          {/* What's Happening — trending posts */}
          <div className="right-sidebar__card">
            <div className="right-sidebar__card-title">What's Happening</div>
            {trendingPosts.slice(0, 5).map((post, i) => (
              <div
                key={post.id}
                className="right-sidebar__trend-item"
                onClick={() => navigate(`/posts/${post.id}`)}
              >
                <div className="right-sidebar__trend-rank">#{i + 1}</div>
                <div className="right-sidebar__trend-body">
                  <div className="right-sidebar__trend-name">
                    {post.author.firstName} {post.author.lastName}
                  </div>
                  <div className="right-sidebar__trend-preview">
                    {post.content.length > 60 ? post.content.slice(0, 60) + '…' : post.content}
                  </div>
                  <div className="right-sidebar__trend-stats">
                    ❤️ {post.reactions.likes} · 💬 {post.reactions.comments}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trending Topics */}
          {topThemes.length > 0 && (
            <div className="right-sidebar__card">
              <div className="right-sidebar__card-title">Trending Topics</div>
              {topThemes.slice(0, 6).map((theme, i) => (
                <div
                  key={i}
                  className={`right-sidebar__topic${selectedTheme === theme ? ' right-sidebar__topic--active' : ''}`}
                  onClick={() => {
                    setSelectedTheme(t => t === theme ? null : theme);
                    document.querySelector('.personal-home__center')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span className="right-sidebar__topic-rank">#{i + 1}</span>
                  <div>
                    <div className="right-sidebar__topic-name">{theme}</div>
                    <div className="right-sidebar__topic-label">Trending in Business</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Who to Follow */}
          {discoveredUsers.length > 0 && (
            <div className="right-sidebar__card">
              <div className="right-sidebar__card-title">Who to Follow</div>
              {discoveredUsers.slice(0, 3).map(u => (
                <div key={u.id} className="right-sidebar__follow-item">
                  <div className="right-sidebar__follow-avatar">
                    {u.firstName[0]}{u.lastName[0]}
                  </div>
                  <div className="right-sidebar__follow-info">
                    <div className="right-sidebar__follow-name">{u.firstName} {u.lastName}</div>
                    {u.headline && <div className="right-sidebar__follow-headline">{u.headline}</div>}
                  </div>
                  <button
                    className="right-sidebar__follow-btn"
                    onClick={() => navigate(`/profile?view=${u.firstName.toLowerCase()}-${u.lastName.toLowerCase()}`)}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && (
        <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
            <div className="shortcuts-modal__title">Keyboard Shortcuts</div>
            <div className="shortcuts-modal__list">
              {[
                ['j', 'Next post'],
                ['k', 'Previous post'],
                ['l', 'Like focused post'],
                ['c', 'Open comments'],
                ['?', 'Toggle shortcuts'],
                ['Esc', 'Close'],
              ].map(([key, desc]) => (
                <div key={key} className="shortcuts-modal__item">
                  <kbd>{key}</kbd>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
            <button className="shortcuts-modal__close" onClick={() => setShowShortcuts(false)}>✕ Close</button>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {user && user.id !== 'guest' && (
        <CreatePostModal
          isOpen={showCreatePostModal}
          onClose={() => setShowCreatePostModal(false)}
          onSubmit={handleCreatePost}
          userName={`${user.firstName} ${user.lastName}`}
          userAvatar={undefined}
        />
      )}
    </div>
  );
};
