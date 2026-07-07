import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import './GroupsPage.css';

interface Group {
  id: string;
  name: string;
  industry: string;
  description: string;
  members: number;
  posts: number;
  joined: boolean;
  invited?: boolean;
  category: 'discover' | 'mine';
}

const mockGroups: Group[] = [
  { id: '1', name: 'European Tech Leaders', industry: 'Technology', description: 'A community for senior tech professionals and CTOs across Europe shaping the future of digital business.', members: 14820, posts: 42, joined: false, category: 'discover' },
  { id: '2', name: 'DACH Business Network', industry: 'Business', description: 'Connecting executives, founders, and investors across Germany, Austria, and Switzerland.', members: 32100, posts: 88, joined: true, category: 'mine' },
  { id: '3', name: 'FinTech Innovators', industry: 'Finance', description: 'Discussing the latest in banking, blockchain, and financial technology innovation.', members: 9640, posts: 21, joined: false, invited: true, category: 'discover' },
  { id: '4', name: 'Global Supply Chain Forum', industry: 'Logistics', description: 'Professionals in procurement, logistics, and supply chain management sharing best practices.', members: 6780, posts: 17, joined: false, category: 'discover' },
  { id: '5', name: 'Ornave Power Users', industry: 'Community', description: 'Tips, workflows, and feature discussions for Ornave platform users.', members: 3200, posts: 65, joined: true, category: 'mine' },
  { id: '6', name: 'HR & People Ops Europe', industry: 'Human Resources', description: 'HR leaders, talent acquisition pros, and people ops managers from across Europe.', members: 11500, posts: 34, joined: false, category: 'discover' },
];

export const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'discover' | 'mine' | 'invitations'>('discover');
  const [keyword, setKeyword] = useState('');
  const [groups, setGroups] = useState<Group[]>(mockGroups);

  if (!user) {
    navigate('/login');
    return null;
  }

  const toggleJoin = (id: string) => {
    setGroups(prev =>
      prev.map(g =>
        g.id === id
          ? { ...g, joined: !g.joined, category: !g.joined ? 'mine' : 'discover' }
          : g
      )
    );
  };

  const filtered = groups.filter(g => {
    const kw = keyword === '' || g.name.toLowerCase().includes(keyword.toLowerCase()) || g.industry.toLowerCase().includes(keyword.toLowerCase());
    if (activeTab === 'mine') return g.joined && kw;
    if (activeTab === 'invitations') return !!g.invited && kw;
    return !g.joined && kw;
  });

  return (
    <>
      <ProtectedPageOverlay isVisible={!user} />
      <div className="groups-page">
        <Navbar />

      {/* Search Banner */}
      <div className="groups-page__search-banner">
        <div className="groups-page__search-container">
          <div className="groups-search">
            <div className="groups-search__field">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#a79e8c" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="#a79e8c" strokeWidth="2" strokeLinecap="round"/></svg>
              <input
                type="text"
                placeholder="Search groups by name or industry"
                className="groups-search__input"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            <button className="groups-search__btn">Search</button>
          </div>
        </div>
      </div>

      <div className="groups-page__container">
        {/* Header */}
        <div className="groups-page__header">
          <h1 className="groups-page__title">Groups</h1>
          <button className="groups-page__create-btn">+ Create Group</button>
        </div>

        {/* Tabs */}
        <div className="groups-page__tabs">
          {['discover', 'mine', 'invitations'].map(tab => (
            <button
              key={tab}
              className={`groups-page__tab${activeTab === tab ? ' groups-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab as typeof activeTab)}
            >
              {tab === 'mine' ? 'My Groups' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'invitations' && (
                <span className="groups-page__tab-badge">
                  {groups.filter(g => g.invited).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Groups Grid */}
        <div className="groups-grid">
          {filtered.length === 0 && (
            <div className="groups-empty">
              {activeTab === 'invitations' ? 'No pending group invitations.' : 'No groups found.'}
            </div>
          )}
          {filtered.map(group => (
            <div key={group.id} className="group-card">
              <div className="group-card__icon">
                {group.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="group-card__content">
                <div className="group-card__header">
                  <div>
                    <div className="group-card__name">{group.name}</div>
                    <div className="group-card__industry">{group.industry}</div>
                  </div>
                  {group.invited && !group.joined && (
                    <span className="group-card__invited-badge">Invited</span>
                  )}
                </div>
                <p className="group-card__description">{group.description}</p>
                <div className="group-card__stats">
                  <span>👥 {group.members.toLocaleString()} members</span>
                  <span>· {group.posts} posts/week</span>
                </div>
                <div className="group-card__actions">
                  <button
                    className={`group-card__join-btn${group.joined ? ' group-card__join-btn--leave' : ''}`}
                    onClick={() => toggleJoin(group.id)}
                  >
                    {group.joined ? 'Leave Group' : 'Join Group'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};
