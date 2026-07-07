import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { FeedItem } from '@/components/personal/FeedItem';
import { UserCard } from '@/components/personal/UserCard';
import { FirmCard } from '@/components/personal/FirmCard';
import { NetworkSnapshot } from '@/components/personal/NetworkSnapshot';
import { feedService } from '@/services/feedService';
import { discoveryService } from '@/services/discoveryService';
import { networkService } from '@/services/networkService';
import { FeedItem as FeedItemType } from '@/types/feed';
import { UserProfile, FirmProfile, ConnectionRequest } from '@/types/discovery';
import './PostDetailPage.css';

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, triggerAuthModal } = useAuth();
  
  // Post state
  const [post, setPost] = useState<FeedItemType | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sidebar states (matching PersonalHomePage)
  const [discoveredUsers, setDiscoveredUsers] = useState<UserProfile[]>([]);
  const [discoveredFirms, setDiscoveredFirms] = useState<FirmProfile[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(true);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(true);
  const [discoveryTab, setDiscoveryTab] = useState<'people' | 'firms' | 'trending' | 'themes'>('people');
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingPosts, setTrendingPosts] = useState<FeedItemType[]>([]);
  const [topThemes, setTopThemes] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  useEffect(() => {
    loadPost();
    loadDiscovery();
    loadNetwork();
    loadTrendingAndThemes();
  }, [postId]);

  const loadPost = async () => {
    if (!postId) return;
    try {
      setIsLoadingPost(true);
      const response = await feedService.getPost(postId);
      if (response) {
        setPost(response);
      } else {
        setError('Post not found');
      }
    } catch (err) {
      console.error('Failed to load post:', err);
      setError('Failed to load post. Please try again later.');
    } finally {
      setIsLoadingPost(false);
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
      loadDiscovery();
      return;
    }
    try {
      setIsLoadingDiscovery(true);
      if (discoveryTab === 'people') {
        const users = await discoveryService.discoverUsers({ search: searchQuery });
        setDiscoveredUsers(users);
      } else {
        const firms = await discoveryService.discoverFirms({ search: searchQuery });
        setDiscoveredFirms(firms);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoadingDiscovery(false);
    }
  };

  const handleThemeClick = (theme: string) => {
    // Navigate back to home with the selected theme
    // We'll use a state or query param later, for now just home
    // In a real app we might pass state: { selectedTheme: theme }
    navigate('/home', { state: { selectedTheme: theme } });
  };

  return (
    <div className="personal-home post-detail-page">
      <Navbar />
      
      <div className="floating-particle particle-1"></div>
      <div className="floating-particle particle-2"></div>
      <div className="floating-particle particle-3"></div>
      <div className="floating-particle particle-4"></div>

      <div className="personal-home__layout">
        {/* Left Column - Discovery (Same as HomePage) */}
        <div className="personal-home__left">
          <div className="discovery-section">
            <div className="discovery-section__header">
              <h3 className="discovery-section__title">Discover Network</h3>
              
              <div className="discovery-section__tabs">
                {['people', 'firms', 'trending', 'themes'].map((tab) => (
                  <button
                    key={tab}
                    className={`discovery-section__tab ${discoveryTab === tab ? 'discovery-section__tab--active' : ''}`}
                    onClick={() => setDiscoveryTab(tab as any)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
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
                {discoveryTab === 'people' ? (
                  discoveredUsers.length === 0 ? <div className="discovery-section__empty">No people found</div> :
                  discoveredUsers.map((user) => <UserCard key={user.id} user={user} onConnect={handleConnectUser} />)
                ) : discoveryTab === 'firms' ? (
                  discoveredFirms.length === 0 ? <div className="discovery-section__empty">No firms found</div> :
                  discoveredFirms.map((firm) => <FirmCard key={firm.id} firm={firm} onConnect={handleConnectFirm} />)
                ) : discoveryTab === 'trending' ? (
                  trendingPosts.length === 0 ? <div className="discovery-section__empty">No trending posts yet</div> :
                  trendingPosts.map((p, index) => (
                    <div 
                      key={p.id} 
                      className={`trending-post-card ${p.id === postId ? 'trending-post-card--active' : ''}`}
                      onClick={() => navigate(`/posts/${p.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="trending-post-card__rank">#{index + 1}</div>
                      <div className="trending-post-card__header">
                        <div className="trending-post-card__author">
                          <div 
                            className="trending-post-card__avatar"
                            onClick={(e) => {
                              e.stopPropagation();
                              const slug = `${p.author.firstName.toLowerCase()}-${p.author.lastName.toLowerCase()}`;
                              navigate(`/profile?view=${slug}`);
                            }}
                          >
                            {p.author.firstName[0]}{p.author.lastName[0]}
                          </div>
                          <div 
                            className="trending-post-card__info"
                            onClick={(e) => {
                              e.stopPropagation();
                              const slug = `${p.author.firstName.toLowerCase()}-${p.author.lastName.toLowerCase()}`;
                              navigate(`/profile?view=${slug}`);
                            }}
                          >
                            <strong>{p.author.firstName} {p.author.lastName}</strong>
                            <span className="trending-post-card__headline">{p.author.headline}</span>
                          </div>
                        </div>
                      </div>
                      <div className="trending-post-card__content">
                        {p.content.length > 100 ? `${p.content.substring(0, 100)}...` : p.content}
                      </div>
                      <div className="trending-post-card__engagement">
                        <span>👍 {p.reactions.likes}</span>
                        <span>💬 {p.reactions.comments}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  topThemes.length === 0 ? <div className="discovery-section__empty">No trending themes</div> :
                  <div className="themes-grid">
                    {topThemes.map((theme, index) => (
                      <div 
                        key={index} 
                        className="theme-card"
                        onClick={() => handleThemeClick(theme)}
                      >
                        <div className="theme-card__rank">#{index + 1}</div>
                        <div className="theme-card__name">{theme}</div>
                        <div className="theme-card__tag">Trending</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <NetworkSnapshot
            requests={connectionRequests}
            onAccept={handleAcceptConnection}
            onReject={handleRejectConnection}
            isLoading={isLoadingNetwork}
          />
        </div>

        {/* Center Column - Post Detail */}
        <div className="personal-home__center">
          <button 
            className="post-detail-page__back-btn" 
            onClick={() => navigate('/home')}
            style={{ marginBottom: '20px' }}
          >
            ← Back to Feed
          </button>

          {isLoadingPost ? (
            <div className="post-detail-page__loading">Loading post...</div>
          ) : error ? (
            <div className="post-detail-page__error">
              <h2>Oops!</h2>
              <p>{error}</p>
              <button className="btn-primary" onClick={() => navigate('/home')}>Go Home</button>
            </div>
          ) : post ? (
            <div className="post-detail-page__post-wrapper">
              <div className="post-detail-page__header">
                <h1 className="post-detail-page__title">Conversation</h1>
              </div>
              <FeedItem item={post} />
              
              <div className="post-detail-page__comments-section">
                <h3>Comments</h3>
                <div className="post-detail-page__comments-placeholder">
                  No comments yet. Be the first to share your thoughts!
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Column - Contextual Card */}
        <div className="personal-home__right">
          <div className="post-detail-sidebar-card">
            <h4>About this post</h4>
            <p>This post is currently trending in the Ornave network. Join the conversation and connect with the author.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
