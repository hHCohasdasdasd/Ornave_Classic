import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { FeedItem } from '@/components/personal/FeedItem';
import { CreatePostModal } from '@/components/personal/CreatePostModal';
import { NewsCard } from '@/components/personal/NewsCard';
import { feedService } from '@/services/feedService';
import { FeedItem as FeedItemType, ServiceCard } from '@/types/feed';
import './ThemeRoomPage.css';

export const ThemeRoomPage: React.FC = () => {
  const { theme: encodedTheme } = useParams<{ theme: string }>();
  const theme = decodeURIComponent(encodedTheme || '');
  const navigate = useNavigate();
  const { user, triggerAuthModal } = useAuth();

  const [posts, setPosts] = useState<FeedItemType[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [otherThemes, setOtherThemes] = useState<string[]>([]);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  useEffect(() => {
    loadRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const loadRoom = async () => {
    try {
      setIsLoadingPosts(true);
      const [feed, themes] = await Promise.all([
        feedService.getFeed(undefined, theme),
        feedService.getTopThemes(),
      ]);
      setPosts(feed.items);
      setOtherThemes(themes.filter((t) => t !== theme));
    } catch (error) {
      console.error('Failed to load theme room:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleCreatePost = async (content: string, mediaUrl?: string, title?: string, serviceCard?: ServiceCard) => {
    try {
      const newPost = await feedService.createPost(content, mediaUrl, title, serviceCard);
      setPosts((prev) => [newPost, ...prev]);
      setShowCreatePostModal(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const contributors = useMemo(() => {
    const byAuthor = new Map<string, { name: string; initials: string; count: number }>();
    posts.forEach((post) => {
      const key = post.author.id;
      const name = `${post.author.firstName} ${post.author.lastName}`.trim();
      const initials = `${post.author.firstName[0] || ''}${post.author.lastName[0] || ''}`;
      const existing = byAuthor.get(key);
      byAuthor.set(key, { name, initials, count: (existing?.count || 0) + 1 });
    });
    return Array.from(byAuthor.values()).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [posts]);

  return (
    <div className="personal-home theme-room-page">
      <Navbar />

      <div className="personal-home__layout">
        {/* Left Column - Room info + other rooms */}
        <div className="personal-home__left">
          <button className="theme-room__back-btn" onClick={() => navigate('/home')}>
            ← Back to Feed
          </button>

          <div className="theme-room__info-card">
            <span className="theme-room__info-eyebrow">Theme Room</span>
            <h2 className="theme-room__info-title">{theme}</h2>
            <p className="theme-room__info-desc">
              A gathering place for professionals discussing {theme}. Post updates, ask
              questions, and share news with everyone following this topic.
            </p>
            <div className="theme-room__info-stats">
              <div>
                <strong>{posts.length}</strong>
                <span>Posts</span>
              </div>
              <div>
                <strong>{contributors.length}</strong>
                <span>Contributors</span>
              </div>
            </div>
          </div>

          {otherThemes.length > 0 && (
            <div className="right-sidebar__card">
              <div className="right-sidebar__card-title">Other Rooms</div>
              {otherThemes.slice(0, 6).map((t, i) => (
                <div
                  key={i}
                  className="right-sidebar__topic"
                  onClick={() => navigate(`/themes/${encodeURIComponent(t)}`)}
                >
                  <span className="right-sidebar__topic-rank">#{i + 1}</span>
                  <div>
                    <div className="right-sidebar__topic-name">{t}</div>
                    <div className="right-sidebar__topic-label">Trending in Business</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center Column - Discussion */}
        <div className="personal-home__center">
          <div
            className="theme-room__composer"
            onClick={() => (user ? setShowCreatePostModal(true) : triggerAuthModal('Sign in to post in this room.'))}
          >
            <div className="theme-room__composer-avatar">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : '+'}
            </div>
            <span>Share an update or news in {theme}…</span>
          </div>

          {isLoadingPosts ? (
            <div className="theme-room__empty">Loading discussion…</div>
          ) : posts.length === 0 ? (
            <div className="theme-room__empty">
              No posts yet — be the first to start the conversation in {theme}.
            </div>
          ) : (
            posts.map((post) => <FeedItem key={post.id} item={post} />)
          )}
        </div>

        {/* Right Column - Contributors + News */}
        <aside className="personal-home__right">
          {contributors.length > 0 && (
            <div className="right-sidebar__card">
              <div className="right-sidebar__card-title">Who's Talking</div>
              {contributors.map((c, i) => (
                <div key={i} className="right-sidebar__follow-item">
                  <div className="right-sidebar__follow-avatar">{c.initials}</div>
                  <div className="right-sidebar__follow-info">
                    <strong>{c.name}</strong>
                    <span>{c.count} post{c.count === 1 ? '' : 's'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <NewsCard />
        </aside>
      </div>

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
