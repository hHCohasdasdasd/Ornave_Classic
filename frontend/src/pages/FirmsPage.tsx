import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { networkService } from '@/services/networkService';
import { firmService } from '@/services/firmService';
import './FirmsPage.css';

interface FirmRequest {
  id: string;
  name: string;
  industry: string;
  description: string;
  employees: number;
}

interface FirmSuggestion {
  id: string;
  name: string;
  industry: string;
  description: string;
  commonConnections: number;
  commonConnectionName?: string;
  logo?: string;
}

export const FirmsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'discover' | 'following'>('discover');
  const [companiesFollowing, setCompaniesFollowing] = useState(0);
  const [companiesPartnered, setCompaniesPartnered] = useState(0);
  const [followRequests, setFollowRequests] = useState<FirmRequest[]>([]);
  const [suggestions, setSuggestions] = useState<FirmSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FirmSuggestion[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadFirmsData();

    const handleStateUpdate = () => {
      loadFirmsData();
    };

    window.addEventListener('ornave_state_update', handleStateUpdate);
    return () => window.removeEventListener('ornave_state_update', handleStateUpdate);
  }, [user, navigate]);

  const loadFirmsData = async () => {
    try {
      const followed = await firmService.getFollowedFirms();
      setCompaniesFollowing(followed.length);

      const partnered = await firmService.getPartneredFirms();
      setCompaniesPartnered(partnered.length);
      
      // Fetch real directory data
      const directoryData = await networkService.searchDirectory({});
      if (directoryData && directoryData.length > 0) {
        setSuggestions(directoryData.map((profile: any) => ({
          id: profile.company?.slug || profile.companyId,
          name: profile.company.name,
          industry: profile.industry || 'Various',
          description: profile.company.description || profile.about || 'No description available.',
          commonConnections: Math.floor(Math.random() * 50) + 1,
          commonConnectionName: 'Your Network',
          logo: profile.company.logo
        })));
      } else {
        setSuggestions([]);
      }

      setFollowRequests([]);
    } catch (err) {
      console.error('Failed to load firms data:', err);
    }
  };

  const handleAcceptFollow = async (request: FirmRequest) => {
    await firmService.followFirm({
      id: request.id,
      name: request.name,
      headline: request.industry,
      location: 'Multiple Locations'
    });
    setFollowRequests(prev => prev.filter(req => req.id !== request.id));
  };

  const handleIgnoreFollow = (id: string) => {
    setFollowRequests(prev => prev.filter(req => req.id !== id));
  };

  const handleFollow = async (firm: FirmSuggestion) => {
    await firmService.followFirm({
      id: firm.id,
      name: firm.name,
      headline: firm.industry,
      location: 'Remote/Global'
    });
    setSuggestions(prev => prev.filter(sug => sug.id !== firm.id));
  };

  const handleDismiss = (id: string) => {
    setSuggestions(prev => prev.filter(sug => sug.id !== id));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      loadFirmsData();
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Use the robust searchDirectory that now includes registered firms
      const results = await networkService.searchDirectory({
        name: searchQuery,
        country: locationQuery
      });
      
      if (results && results.length > 0) {
        setSearchResults(results.map((profile: any) => ({
          id: profile.company?.slug || profile.companyId || profile.id,
          name: profile.company?.name || profile.name || 'Unknown Firm',
          industry: profile.industry || 'Various',
          description: profile.company?.description || profile.description || 'No description available.',
          commonConnections: Math.floor(Math.random() * 50) + 1,
          commonConnectionName: 'Global Network',
          logo: profile.company?.logo || profile.logo
        })));
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Navbar />
      <div className="firms-page">
        <div className="firms-page__search-banner">
          <div className="firms-page__search-container">
            <div className="firms-search">
              <div className="firms-search__field">
                <input
                  type="text"
                  placeholder="Firm name, industry or keyword"
                  className="firms-search__input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="firms-search__field">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#a79e8c">
                  <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 13c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm3-9H8V5h3v1z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Germany"
                  className="firms-search__input"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              <button className="firms-search__btn" onClick={handleSearch}>Search</button>
            </div>
          </div>
        </div>

        <div className="firms-page__container">
          {/* Left Sidebar */}
          <aside className="firms-sidebar">
            <div className="firms-sidebar__card">
              <div className="firms-sidebar__header">
                <h2>Business Network</h2>
              </div>
              
              <div className="firms-stats">
                <button className="firms-stat">
                  <div className="firms-stat__info">
                    <div className="firms-stat__icon firms-stat__icon--partners">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <span className="firms-stat__label">My Partners</span>
                  </div>
                  <span className="firms-stat__value">{companiesPartnered}</span>
                </button>
                <button className="firms-stat">
                  <div className="firms-stat__info">
                    <div className="firms-stat__icon firms-stat__icon--watching">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </div>
                    <span className="firms-stat__label">Watching</span>
                  </div>
                  <span className="firms-stat__value">{companiesFollowing}</span>
                </button>
              </div>

              <button className="firms-sidebar__more">
                Show more <span>⌄</span>
              </button>
            </div>

            <div className="firms-sidebar__premium">
              <div className="premium-badge">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#c6a15b">
                  <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z"/>
                </svg>
                Premium
              </div>
              <p className="premium-text">Unlock insights about leading firms with Premium</p>
              <button className="premium-cta">Try for free</button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="firms-main">
            <div className="firms-tabs">
              <button 
                className={`firms-tab ${activeTab === 'discover' ? 'firms-tab--active' : ''}`}
                onClick={() => setActiveTab('discover')}
              >
                Discover
              </button>
              <button 
                className={`firms-tab ${activeTab === 'following' ? 'firms-tab--active' : ''}`}
                onClick={() => setActiveTab('following')}
              >
                Following
              </button>
            </div>

            {/* Search Results */}
            {isSearching && (
              <section className="firms-section">
                <div className="firms-section__header">
                  <h2>Search results for "{searchQuery}"</h2>
                  <button className="firms-section__link" onClick={() => setIsSearching(false)}>Clear results</button>
                </div>
                {searchResults.length === 0 ? (
                  <p className="muted-text">No firms found matching your search.</p>
                ) : (
                  <div className="firm-grid">
                    {searchResults.map(result => (
                      <div key={result.id} className="firm-card">
                        <div 
                          className="firm-card__avatar" 
                          onClick={() => navigate(`/profile?view=${result.id}`)} 
                          style={result.logo ? { cursor: 'pointer', backgroundImage: `url(${result.logo})`, backgroundSize: 'cover', color: 'transparent' } : { cursor: 'pointer' }}
                        >
                          {!result.logo && getInitials(result.name)}
                        </div>
                        <h3 className="firm-card__name" onClick={() => navigate(`/profile?view=${result.id}`)} style={{ cursor: 'pointer' }}>{result.name}</h3>
                        <p className="firm-card__industry">{result.industry}</p>
                        <p className="firm-card__description">{result.description}</p>
                        <button className="firm-card__follow" onClick={() => handleFollow(result)}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M14 7H9V2H7V7H2V9H7V14H9V9H14V7Z"/>
                          </svg>
                          Follow
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Follow Invites */}
            {followRequests.length > 0 && (
              <section className="firms-section">
                <div className="firms-section__header">
                  <h2>Follow requests ({followRequests.length})</h2>
                  <button className="firms-section__link">Show all</button>
                </div>

                <div className="follow-cards">
                  {followRequests.map(request => (
                    <div key={request.id} className="follow-card">
                      <div className="follow-card__avatar">
                        {getInitials(request.name)}
                      </div>
                      <div className="follow-card__content">
                        <h3 className="follow-card__name">
                          {request.name}
                          <span className="badge-icon">✓</span>
                        </h3>
                        <p className="follow-card__industry">{request.industry}</p>
                        <p className="follow-card__description">{request.description}</p>
                        <p className="follow-card__employees">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="rgba(246,243,237,0.6)">
                            <path d="M8 8C9.66 8 11 6.66 11 5C11 3.34 9.66 2 8 2C6.34 2 5 3.34 5 5C5 6.66 6.34 8 8 8ZM8 9.5C5.66 9.5 1 10.67 1 13V14H15V13C15 10.67 10.34 9.5 8 9.5Z"/>
                          </svg>
                          {request.employees.toLocaleString()} employees
                        </p>
                        <div className="follow-card__actions">
                          <button className="btn-ignore" onClick={() => handleIgnoreFollow(request.id)}>
                            Ignore
                          </button>
                          <button className="btn-follow" onClick={() => handleAcceptFollow(request)}>
                            Follow
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Firms You May Know */}
            <section className="firms-section">
              <div className="firms-section__header">
                <h2>Firms you may be interested in</h2>
                <button className="firms-section__link">Show all</button>
              </div>

              <div className="firm-grid">
                {suggestions.slice(0, 8).map(suggestion => (
                  <div key={suggestion.id} className="firm-card">
                    <button className="firm-card__dismiss" onClick={() => handleDismiss(suggestion.id)}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.5 3.5L8 8l4.5 4.5-1 1L7 9l-4.5 4.5-1-1L6 8 1.5 3.5l1-1L7 7l4.5-4.5z"/>
                      </svg>
                    </button>
                    <div 
                      className="firm-card__avatar" 
                      onClick={() => navigate(`/profile?view=${suggestion.id}`)} 
                      style={suggestion.logo ? { cursor: 'pointer', backgroundImage: `url(${suggestion.logo})`, backgroundSize: 'cover', color: 'transparent' } : { cursor: 'pointer' }}
                    >
                      {!suggestion.logo && getInitials(suggestion.name)}
                    </div>
                    <h3 className="firm-card__name" onClick={() => navigate(`/profile?view=${suggestion.id}`)} style={{ cursor: 'pointer' }}>{suggestion.name}</h3>
                    <p className="firm-card__industry">{suggestion.industry}</p>
                    <p className="firm-card__description">{suggestion.description}</p>
                    {suggestion.commonConnectionName && (
                      <p className="firm-card__connections">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="rgba(246,243,237,0.6)">
                          <path d="M8 8C9.66 8 11 6.66 11 5C11 3.34 9.66 2 8 2C6.34 2 5 3.34 5 5C5 6.66 6.34 8 8 8ZM8 9.5C5.66 9.5 1 10.67 1 13V14H15V13C15 10.67 10.34 9.5 8 9.5Z"/>
                        </svg>
                        {suggestion.commonConnections} people you know work here
                      </p>
                    )}
                    <button className="firm-card__follow" onClick={() => handleFollow(suggestion)}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M14 7H9V2H7V7H2V9H7V14H9V9H14V7Z"/>
                      </svg>
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Popular Companies */}
            <section className="firms-section">
              <div className="firms-section__header">
                <h2>Popular companies on Ornave</h2>
                <button className="firms-section__link">Show all</button>
              </div>

              <div className="popular-firms-grid">
                {suggestions.length === 0 && (
                  <p className="firms-empty-state">No popular companies to show yet.</p>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
};
