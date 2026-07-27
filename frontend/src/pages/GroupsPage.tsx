import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { apiClient } from '@/services/api';
import { groupService, Group } from '@/services/groupService';
import './GroupsPage.css';

export const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, triggerAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<'discover' | 'mine'>('discover');
  const [keyword, setKeyword] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    const data = await groupService.listGroups();
    setGroups(data);
    setIsLoading(false);
  };

  const toggleJoin = async (group: Group) => {
    if (!user || user.id === 'guest') {
      triggerAuthModal('Sign in to join a group.');
      return;
    }
    setPendingSlug(group.slug);
    try {
      if (group.isMember) {
        await groupService.leaveGroup(group.slug);
      } else {
        await groupService.joinGroup(group.slug);
      }
      setGroups((prev) =>
        prev.map((g) => (g.slug === group.slug ? { ...g, isMember: !g.isMember, memberCount: g.memberCount + (g.isMember ? -1 : 1) } : g))
      );
    } catch (error) {
      console.error('Failed to update membership:', error);
    } finally {
      setPendingSlug(null);
    }
  };

  // A "completed" profile means the user has actually filled something in —
  // not just registered. Checked before letting anyone create a sector.
  const hasCompletedProfile = (profile: any): boolean =>
    !!(profile?.headline?.trim() || profile?.bio?.trim() || profile?.avatarUrl?.trim());

  const handleCreateClick = async () => {
    if (!user || user.id === 'guest') {
      triggerAuthModal('Sign in to create a sector.');
      return;
    }
    setCheckingProfile(true);
    try {
      const response = await apiClient.getProfile();
      const profile = response?.data?.profile;
      if (hasCompletedProfile(profile)) {
        setShowCreateModal(true);
      } else {
        setShowProfilePrompt(true);
      }
    } catch (error) {
      console.error('Failed to check profile:', error);
      setShowProfilePrompt(true);
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const group = await groupService.createGroup(newName.trim(), newDescription.trim() || undefined);
      setShowCreateModal(false);
      setNewName('');
      setNewDescription('');
      navigate(`/groups/${group.slug}`);
    } catch (error: any) {
      console.error('Failed to create group:', error);
      if (error?.response?.status === 403) {
        setShowCreateModal(false);
        setShowProfilePrompt(true);
      } else {
        setCreateError('Something went wrong creating that sector — try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = groups.filter((g) => {
    const kw = keyword === '' || g.name.toLowerCase().includes(keyword.toLowerCase()) || g.tag.toLowerCase().includes(keyword.toLowerCase());
    if (activeTab === 'mine') return g.isMember && kw;
    return kw;
  });

  return (
    <>
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
                  placeholder="Search sectors by name or tag"
                  className="groups-search__input"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="groups-page__container">
          {/* Header */}
          <div className="groups-page__header">
            <h1 className="groups-page__title">Sectors</h1>
            <button className="groups-page__create-btn" onClick={handleCreateClick} disabled={checkingProfile}>
              {checkingProfile ? 'Checking…' : '+ Create Sector'}
            </button>
          </div>

          {/* Tabs */}
          <div className="groups-page__tabs">
            {(['discover', 'mine'] as const).map(tab => (
              <button
                key={tab}
                className={`groups-page__tab${activeTab === tab ? ' groups-page__tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'mine' ? 'My Sectors' : 'Discover'}
              </button>
            ))}
          </div>

          {/* Groups Grid */}
          <div className="groups-grid">
            {isLoading ? (
              <div className="groups-empty">Loading sectors…</div>
            ) : filtered.length === 0 ? (
              <div className="groups-empty">
                {activeTab === 'mine' ? "You haven't joined any sectors yet." : 'No sectors found — be the first to create one.'}
              </div>
            ) : (
              filtered.map(group => (
                <div key={group.id} className="group-card">
                  <div className="group-card__icon" onClick={() => navigate(`/groups/${group.slug}`)} style={{ cursor: 'pointer' }}>
                    {group.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="group-card__content">
                    <div className="group-card__header">
                      <div>
                        <div className="group-card__name" onClick={() => navigate(`/groups/${group.slug}`)} style={{ cursor: 'pointer' }}>{group.name}</div>
                        <div className="group-card__industry">{group.tag}</div>
                      </div>
                    </div>
                    <p className="group-card__description">{group.description || 'No description yet.'}</p>
                    <div className="group-card__stats">
                      <span>👥 {group.memberCount.toLocaleString()} member{group.memberCount === 1 ? '' : 's'}</span>
                    </div>
                    <div className="group-card__actions">
                      <button
                        className={`group-card__join-btn${group.isMember ? ' group-card__join-btn--leave' : ''}`}
                        onClick={() => toggleJoin(group)}
                        disabled={pendingSlug === group.slug}
                      >
                        {group.isMember ? 'Leave' : 'Join'}
                      </button>
                      <button className="group-card__join-btn group-card__join-btn--leave" onClick={() => navigate(`/groups/${group.slug}`)}>
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {showCreateModal && (
          <div className="groups-create-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="groups-create-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Create a Sector</h2>
              <p>A sector is a community anyone can join — like Science or Finance — where members post discussions and tagged publications surface automatically.</p>
              <input
                type="text"
                placeholder="Sector name (e.g. Science)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={60}
              />
              <textarea
                placeholder="What's this sector about? (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                maxLength={300}
              />
              {createError && <p className="groups-create-modal__error">{createError}</p>}
              <div className="groups-create-modal__actions">
                <button className="groups-create-modal__cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button className="groups-create-modal__submit" onClick={handleCreate} disabled={!newName.trim() || isCreating}>
                  {isCreating ? 'Creating…' : 'Create Sector'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showProfilePrompt && (
          <div className="groups-create-modal-overlay" onClick={() => setShowProfilePrompt(false)}>
            <div className="groups-create-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Complete your profile first</h2>
              <p>
                Add a headline, bio, or profile photo before creating a sector — it helps other members know who
                they're joining a community with.
              </p>
              <div className="groups-create-modal__actions">
                <button className="groups-create-modal__cancel" onClick={() => setShowProfilePrompt(false)}>Not now</button>
                <button className="groups-create-modal__submit" onClick={() => navigate('/profile/edit')}>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
