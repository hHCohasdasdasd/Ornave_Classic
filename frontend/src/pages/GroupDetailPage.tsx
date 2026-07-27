import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { FeedItem } from '@/components/personal/FeedItem';
import { PublicationCard } from '@/components/personal/PublicationCard';
import { CreatePublicationModal } from '@/components/personal/CreatePublicationModal';
import { MentionPicker } from '@/components/personal/MentionPicker';
import { groupService, Group, GroupMemberEntry } from '@/services/groupService';
import { publicationService, Publication } from '@/services/publicationService';
import { FeedItem as FeedItemType, Mention } from '@/types/feed';
import './GroupDetailPage.css';

export const GroupDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, triggerAuthModal } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'discussions' | 'publications' | 'members'>('discussions');

  const [discussions, setDiscussions] = useState<FeedItemType[]>([]);
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(true);
  const [composerText, setComposerText] = useState('');
  const [posting, setPosting] = useState(false);
  const [showPublicationPicker, setShowPublicationPicker] = useState(false);
  const [linkedPublication, setLinkedPublication] = useState<Publication | null>(null);
  const [composerMentions, setComposerMentions] = useState<Mention[]>([]);

  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoadingPublications, setIsLoadingPublications] = useState(true);
  const [showPublicationModal, setShowPublicationModal] = useState(false);

  const [members, setMembers] = useState<GroupMemberEntry[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!slug) return;
    loadGroup();
    loadDiscussions();
    loadPublications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadGroup = async () => {
    setIsLoadingGroup(true);
    const data = await groupService.getGroup(slug!);
    if (!data) {
      setNotFound(true);
    } else {
      setGroup(data);
    }
    setIsLoadingGroup(false);
  };

  const loadDiscussions = async () => {
    setIsLoadingDiscussions(true);
    const data = await groupService.getDiscussions(slug!);
    setDiscussions(data);
    setIsLoadingDiscussions(false);
  };

  const loadPublications = async () => {
    setIsLoadingPublications(true);
    const data = await groupService.getGroupPublications(slug!);
    setPublications(data);
    setIsLoadingPublications(false);
  };

  const loadMembers = async () => {
    setIsLoadingMembers(true);
    const data = await groupService.getMembers(slug!);
    setMembers(data);
    setIsLoadingMembers(false);
  };

  const handleTabClick = (tab: 'discussions' | 'publications' | 'members') => {
    setActiveTab(tab);
    if (tab === 'members' && members.length === 0) loadMembers();
  };

  const handleToggleMembership = async () => {
    if (!group) return;
    if (!user || user.id === 'guest') {
      triggerAuthModal('Sign in to join this sector.');
      return;
    }
    setIsJoining(true);
    try {
      if (group.isMember) {
        await groupService.leaveGroup(group.slug);
        setGroup({ ...group, isMember: false, memberCount: group.memberCount - 1 });
      } else {
        await groupService.joinGroup(group.slug);
        setGroup({ ...group, isMember: true, memberCount: group.memberCount + 1 });
      }
    } catch (error) {
      console.error('Failed to update membership:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handlePostDiscussion = async () => {
    if (!composerText.trim() || !slug) return;
    if (!user || user.id === 'guest') {
      triggerAuthModal('Sign in to post in this sector.');
      return;
    }
    setPosting(true);
    try {
      const post = await groupService.postDiscussion(slug, composerText.trim(), undefined, undefined, linkedPublication?.id, composerMentions);
      setDiscussions((prev) => [post, ...prev]);
      setComposerText('');
      setLinkedPublication(null);
      setComposerMentions([]);
    } catch (error) {
      console.error('Failed to post discussion:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleCreatePublication = async (params: { title: string; content: string; coverImage?: string; tags: string[]; postAsCompany?: boolean; mentions?: Mention[] }) => {
    try {
      const publication = await publicationService.createPublication(params);
      if (group && publication.tags.includes(group.tag)) {
        setPublications((prev) => [publication, ...prev]);
      }
      setShowPublicationModal(false);
    } catch (error) {
      console.error('Failed to create publication:', error);
    }
  };

  if (notFound) {
    return (
      <div className="personal-home group-detail-page">
        <Navbar />
        <div className="group-detail-page__not-found">
          <h2>Sector not found</h2>
          <button className="btn-primary" onClick={() => navigate('/groups')}>Back to Sectors</button>
        </div>
      </div>
    );
  }

  return (
    <div className="personal-home group-detail-page">
      <Navbar />

      <div className="personal-home__layout">
        {/* Left Column */}
        <div className="personal-home__left">
          <button className="theme-room__back-btn" onClick={() => navigate('/groups')}>
            ← Back to Sectors
          </button>

          {isLoadingGroup ? (
            <div className="group-detail-page__info-card">Loading…</div>
          ) : group ? (
            <div className="group-detail-page__info-card">
              <span className="group-detail-page__eyebrow">Sector · {group.tag}</span>
              <h2 className="group-detail-page__title">{group.name}</h2>
              <p className="group-detail-page__desc">{group.description || 'No description yet.'}</p>
              <div className="group-detail-page__stats">
                <div>
                  <strong>{group.memberCount}</strong>
                  <span>Members</span>
                </div>
                <div>
                  <strong>{discussions.length}</strong>
                  <span>Discussions</span>
                </div>
                <div>
                  <strong>{publications.length}</strong>
                  <span>Publications</span>
                </div>
              </div>
              <button
                className={`group-detail-page__join-btn ${group.isMember ? 'group-detail-page__join-btn--leave' : ''}`}
                onClick={handleToggleMembership}
                disabled={isJoining}
              >
                {group.isMember ? 'Leave Sector' : 'Join Sector'}
              </button>
            </div>
          ) : null}
        </div>

        {/* Center Column */}
        <div className="personal-home__center">
          <div className="group-detail-page__tabs">
            <button
              className={`group-detail-page__tab ${activeTab === 'discussions' ? 'group-detail-page__tab--active' : ''}`}
              onClick={() => handleTabClick('discussions')}
            >
              Discussions
            </button>
            <button
              className={`group-detail-page__tab ${activeTab === 'publications' ? 'group-detail-page__tab--active' : ''}`}
              onClick={() => handleTabClick('publications')}
            >
              Publications
            </button>
            <button
              className={`group-detail-page__tab ${activeTab === 'members' ? 'group-detail-page__tab--active' : ''}`}
              onClick={() => handleTabClick('members')}
            >
              Members
            </button>
          </div>

          {activeTab === 'discussions' && (
            <>
              <div className="group-detail-page__composer">
                {linkedPublication && (
                  <div className="group-detail-page__composer-linked-pub">
                    {linkedPublication.coverImage && (
                      <img src={linkedPublication.coverImage} alt={linkedPublication.title} />
                    )}
                    <div className="group-detail-page__composer-linked-pub-body">
                      <span className="group-detail-page__composer-linked-pub-label">📄 Linking publication</span>
                      <span className="group-detail-page__composer-linked-pub-title">{linkedPublication.title}</span>
                    </div>
                    <button
                      className="group-detail-page__composer-linked-pub-remove"
                      onClick={() => setLinkedPublication(null)}
                      title="Remove linked publication"
                    >
                      ×
                    </button>
                  </div>
                )}

                <textarea
                  placeholder={
                    linkedPublication
                      ? `Share your thoughts on "${linkedPublication.title}"…`
                      : group ? `Start a discussion in ${group.name}…` : 'Start a discussion…'
                  }
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  onFocus={() => { if (!user || user.id === 'guest') triggerAuthModal('Sign in to post in this sector.'); }}
                  rows={3}
                />

                <div className="group-detail-page__composer-toolbar">
                  <div className="group-detail-page__composer-tools">
                    <div className="group-detail-page__composer-link-wrap">
                      <button
                        className="group-detail-page__composer-link-btn"
                        onClick={() => {
                          if (!user || user.id === 'guest') { triggerAuthModal('Sign in to post in this sector.'); return; }
                          setShowPublicationPicker((v) => !v);
                        }}
                      >
                        🔗 {linkedPublication ? 'Change linked publication' : 'Link a publication'}
                      </button>

                      {showPublicationPicker && (
                        <div className="group-detail-page__pub-picker">
                          {publications.length === 0 ? (
                            <div className="group-detail-page__pub-picker-empty">
                              No publications tagged {group?.tag} yet to link.
                            </div>
                          ) : (
                            publications.map((pub) => (
                              <div
                                key={pub.id}
                                className="group-detail-page__pub-picker-item"
                                onClick={() => {
                                  setLinkedPublication(pub);
                                  setShowPublicationPicker(false);
                                }}
                              >
                                <strong>{pub.title}</strong>
                                <span>{pub.author.companyName || `${pub.author.firstName} ${pub.author.lastName}`}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <MentionPicker selected={composerMentions} onChange={setComposerMentions} />
                  </div>

                  <button
                    className="group-detail-page__composer-submit"
                    onClick={handlePostDiscussion}
                    disabled={!composerText.trim() || posting}
                  >
                    {posting ? 'Posting…' : 'Post'}
                  </button>
                </div>
              </div>

              {isLoadingDiscussions ? (
                <div className="theme-room__empty">Loading discussion…</div>
              ) : discussions.length === 0 ? (
                <div className="theme-room__empty">No discussions yet — be the first to start the conversation.</div>
              ) : (
                discussions.map((post) => <FeedItem key={post.id} item={post} />)
              )}
            </>
          )}

          {activeTab === 'publications' && (
            <>
              <div className="group-detail-page__publications-header">
                <p>Publications tagged <strong>{group?.tag}</strong> from anywhere on Ornave show up here automatically.</p>
                <button
                  className="group-detail-page__composer-submit"
                  onClick={() => {
                    if (!user || user.id === 'guest') { triggerAuthModal('Sign in to publish.'); return; }
                    setShowPublicationModal(true);
                  }}
                >
                  + Publish here
                </button>
              </div>

              {isLoadingPublications ? (
                <div className="theme-room__empty">Loading publications…</div>
              ) : publications.length === 0 ? (
                <div className="theme-room__empty">No publications tagged {group?.tag} yet.</div>
              ) : (
                publications.map((pub) => <PublicationCard key={pub.id} publication={pub} />)
              )}
            </>
          )}

          {activeTab === 'members' && (
            <div className="group-detail-page__members">
              {isLoadingMembers ? (
                <div className="theme-room__empty">Loading members…</div>
              ) : members.length === 0 ? (
                <div className="theme-room__empty">No members yet.</div>
              ) : (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="group-detail-page__member"
                    onClick={() => navigate(`/profile?view=${m.user.firstName.toLowerCase()}-${m.user.lastName.toLowerCase()}`)}
                  >
                    <div className="group-detail-page__member-avatar">
                      {m.user.profilePicture ? <img src={m.user.profilePicture} alt={m.user.firstName} /> : m.user.firstName[0]}
                    </div>
                    <div>
                      <strong>{m.user.firstName} {m.user.lastName}</strong>
                      <span>{m.user.companyName || m.user.headline || 'Member'}</span>
                    </div>
                    {m.role === 'ADMIN' && <span className="group-detail-page__member-badge">Admin</span>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <CreatePublicationModal
        isOpen={showPublicationModal}
        onClose={() => setShowPublicationModal(false)}
        onSubmit={handleCreatePublication}
        defaultTag={group?.name}
      />
    </div>
  );
};
