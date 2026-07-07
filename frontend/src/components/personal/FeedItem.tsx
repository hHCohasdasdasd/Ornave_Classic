import React, { memo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeedItem as FeedItemType } from '@/types/feed';
import { useAuth } from '@/context/AuthContext';
import { feedService } from '@/services/feedService';

interface FeedItemProps {
  item: FeedItemType;
  focused?: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; headline?: string };
}

const FeedItemComponent: React.FC<FeedItemProps> = ({ item, focused }) => {
  const navigate = useNavigate();
  const { user, triggerAuthModal } = useAuth();
  const [serviceRequested, setServiceRequested] = useState(false);
  const [voteScore, setVoteScore] = useState(item.reactions?.likes ?? 0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [muted, setMuted] = useState(true);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(item.reactions?.comments ?? 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Video autoplay-on-scroll
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const navigateToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    const slug = `${item.author.firstName.toLowerCase()}-${item.author.lastName.toLowerCase()}`;
    navigate(`/profile?view=${slug}`);
  };

  const requireAuth = (action: string, fn: () => void) => {
    if (!user) { triggerAuthModal(`Please log in to ${action}.`); return; }
    fn();
  };

  const handleVote = (dir: 'up' | 'down') => {
    requireAuth('vote', () => {
      if (userVote === dir) {
        setVoteScore(v => dir === 'up' ? v - 1 : v + 1);
        setUserVote(null);
      } else {
        const delta = userVote ? 2 : 1;
        setVoteScore(v => dir === 'up' ? v + delta : v - delta);
        setUserVote(dir);
      }
    });
  };

  const handleLike = () => {
    requireAuth('like this post', () => {
      setLiked(prev => {
        setVoteScore(v => prev ? v - 1 : v + 1);
        return !prev;
      });
    });
  };

  const handleSave = () => requireAuth('save posts', () => setSaved(s => !s));

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const data = await feedService.getComments(item.id);
        setComments(data);
      } catch {
        // silently fail — show empty state
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(v => !v);
    if (!showComments) {
      setTimeout(() => commentInputRef.current?.focus(), 100);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    requireAuth('comment on posts', async () => {
      setSubmittingComment(true);
      try {
        const comment = await feedService.addComment(item.id, newComment.trim());
        setComments(prev => [...prev, comment]);
        setCommentCount(c => c + 1);
        setNewComment('');
      } catch {
        // silently fail
      } finally {
        setSubmittingComment(false);
      }
    });
  };

  const handleInteraction = (action: string) => {
    requireAuth(`${action.toLowerCase()} this post`, () => {
      alert(`${action} functionality coming soon!`);
    });
  };

  const handleServiceRequest = () => {
    if (!user || user.id === 'guest') {
      triggerAuthModal('Please log in to request a service.');
      return;
    }
    const sc = item.metadata?.serviceCard;
    if (!sc) return;
    const ORDERS_KEY = 'ornave_orders';
    const existing = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const newOrder = {
      id: `ord-${Date.now()}`,
      userId: user.id,
      companyId: sc.firmId,
      status: 'PENDING',
      totalAmount: sc.price,
      currency: sc.currency,
      createdAt: new Date().toISOString(),
      company: { name: sc.firmName, id: sc.firmId },
      items: [{ id: `i-${Date.now()}`, productId: sc.id, product: sc, quantity: 1, price: sc.price }],
    };
    localStorage.setItem(ORDERS_KEY, JSON.stringify([newOrder, ...existing]));
    setServiceRequested(true);
  };

  const getTimeAgo = (ts: string): string => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 60) return `${m}m`;
    if (h < 24) return `${h}h`;
    return `${d}d`;
  };

  const TYPE_META: Record<string, { label: string; color: string }> = {
    post:         { label: 'Post',         color: '#b8955f' },
    connection:   { label: 'Connection',   color: '#0d6b5f' },
    transaction:  { label: 'Transaction',  color: '#8a6d3f' },
    announcement: { label: 'Announcement', color: '#5b4a6f' },
    mention:      { label: 'Mention',      color: '#4a6670' },
  };
  const typeMeta = TYPE_META[item.type] ?? { label: 'Update', color: '#6b6558' };
  const isVideo = item.mediaUrl && (item.mediaUrl.match(/\.(mp4|webm|ogg)$/) || item.mediaUrl.includes('mov_bbb'));

  return (
    <div className={`feed-item${focused ? ' feed-item--focused' : ''}`} data-post-id={item.id}>
      {/* Reddit vote column */}
      <div className="feed-item__vote-col">
        <button
          className={`feed-item__vote-btn feed-item__vote-btn--up${userVote === 'up' ? ' active' : ''}`}
          onClick={() => handleVote('up')}
          title="Upvote"
        >▲</button>
        <span className={`feed-item__vote-score${userVote === 'up' ? ' score--up' : userVote === 'down' ? ' score--down' : ''}`}>
          {voteScore >= 1000 ? `${(voteScore / 1000).toFixed(1)}k` : voteScore}
        </span>
        <button
          className={`feed-item__vote-btn feed-item__vote-btn--down${userVote === 'down' ? ' active' : ''}`}
          onClick={() => handleVote('down')}
          title="Downvote"
        >▼</button>
      </div>

      {/* Main body */}
      <div className="feed-item__body">
        {/* Author header */}
        <div className="feed-item__header">
          <div className="feed-item__header-left">
            <div className="feed-item__avatar" onClick={navigateToProfile} style={{ cursor: 'pointer' }}>
              {item.author.profilePicture ? (
                <img src={item.author.profilePicture} alt={item.author.firstName} />
              ) : (
                <div className="feed-item__avatar-placeholder">
                  {item.author.firstName[0]}{item.author.lastName[0]}
                </div>
              )}
            </div>
            <div className="feed-item__author-info">
              <div className="feed-item__author-row">
                <span className="feed-item__author-name" onClick={navigateToProfile} style={{ cursor: 'pointer' }}>
                  {item.author.firstName} {item.author.lastName}
                </span>
                <span style={{ color: '#878a8c', fontSize: '0.7rem' }}>·</span>
                <span className="feed-item__time">{getTimeAgo(item.timestamp)}</span>
                <span
                  className="feed-item__flair"
                  style={{ background: typeMeta.color + '18', color: typeMeta.color, border: `1px solid ${typeMeta.color}44` }}
                >
                  {typeMeta.label}
                </span>
              </div>
              {item.author.headline && (
                <div className="feed-item__author-headline">{item.author.headline}</div>
              )}
            </div>
          </div>
          <button className={`feed-item__save-btn${saved ? ' saved' : ''}`} onClick={handleSave} title={saved ? 'Unsave' : 'Save'}>
            {saved ? '🔖' : '📑'}
          </button>
        </div>

        {/* Content — title is the hero (Reddit style) */}
        <div className="feed-item__content">
          {item.title && <h3 className="feed-item__title">{item.title}</h3>}
          <p>{item.content}</p>
        </div>

        {/* Service card */}
        {item.metadata?.serviceCard && (
          <div className="feed-item__service-card">
            {item.metadata.serviceCard.imageUrl && (
              <div className="feed-item__service-card-img">
                <img src={item.metadata.serviceCard.imageUrl} alt={item.metadata.serviceCard.name} />
              </div>
            )}
            <div className="feed-item__service-card-body">
              <div className="feed-item__service-card-label">Featured Service</div>
              <div className="feed-item__service-card-name">{item.metadata.serviceCard.name}</div>
              {item.metadata.serviceCard.description && (
                <div className="feed-item__service-card-desc">{item.metadata.serviceCard.description}</div>
              )}
              <div className="feed-item__service-card-price">
                {item.metadata.serviceCard.currency} {item.metadata.serviceCard.price.toFixed(2)}
              </div>
            </div>
            <button
              className={`feed-item__service-card-btn${serviceRequested ? ' feed-item__service-card-btn--sent' : ''}`}
              onClick={handleServiceRequest}
              disabled={serviceRequested}
            >
              {serviceRequested ? '✓ Requested' : 'Request'}
            </button>
          </div>
        )}

        {/* Media */}
        {item.mediaUrl && (
          <div className={`feed-item__media${isVideo ? ' feed-item__media--video' : ''}`}>
            {isVideo ? (
              <div className="feed-item__video-wrap">
                <video
                  ref={videoRef}
                  src={item.mediaUrl}
                  muted={muted}
                  loop
                  playsInline
                />
                <button
                  className="feed-item__mute-btn"
                  onClick={() => setMuted(m => !m)}
                  title={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? '🔇' : '🔊'}
                </button>
              </div>
            ) : (
              <img src={item.mediaUrl} alt={item.title || 'Post media'} />
            )}
          </div>
        )}

        {/* Reaction counts */}
        {item.reactions && (
          <div className="feed-item__stats">
            <span>{liked ? '❤️' : '🤍'} {voteScore} points</span>
            <span>💬 {commentCount} comments</span>
          </div>
        )}

        {/* Action bar */}
        {item.reactions && (
          <div className="feed-item__actions">
            <button className={`feed-item__action-btn${liked ? ' feed-item__action-btn--active' : ''}`} onClick={handleLike}>
              <span className="feed-item__action-icon">{liked ? '❤️' : '🤍'}</span>
              <span>{voteScore} Likes</span>
            </button>
            <button
              className={`feed-item__action-btn${showComments ? ' feed-item__action-btn--active' : ''}`}
              onClick={handleToggleComments}
            >
              <span className="feed-item__action-icon">💬</span>
              <span>{commentCount} Comments</span>
            </button>
            <button className="feed-item__action-btn" onClick={() => handleInteraction('Repost')}>
              <span className="feed-item__action-icon">🔄</span>
              <span>Repost</span>
            </button>
            <button className="feed-item__action-btn" onClick={() => handleInteraction('Share')}>
              <span className="feed-item__action-icon">↗️</span>
              <span>Share</span>
            </button>
            <button className={`feed-item__action-btn${saved ? ' feed-item__action-btn--active' : ''}`} onClick={handleSave}>
              <span className="feed-item__action-icon">{saved ? '🔖' : '📑'}</span>
              <span>{saved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        )}

        {/* Inline comment panel */}
        {showComments && (
          <div className="comments-panel">
            {loadingComments ? (
              <div className="comments-panel__loading">Loading comments…</div>
            ) : comments.length === 0 ? (
              <div className="comments-panel__empty">No comments yet. Be first!</div>
            ) : (
              <div className="comments-panel__list">
                {comments.map(c => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-item__avatar-placeholder">
                      {c.author.firstName[0]}{c.author.lastName[0]}
                    </div>
                    <div className="comment-item__body">
                      <div className="comment-item__meta">
                        <strong className="comment-item__name">
                          {c.author.firstName} {c.author.lastName}
                        </strong>
                        <span className="comment-item__time">{getTimeAgo(c.createdAt)}</span>
                      </div>
                      <p className="comment-item__content">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <form className="comments-panel__form" onSubmit={handleSubmitComment}>
              <div className="comment-item__avatar-placeholder comment-item__avatar-placeholder--self">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
              </div>
              <input
                ref={commentInputRef}
                className="comment-input"
                type="text"
                placeholder={user ? 'Add a comment…' : 'Sign in to comment'}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                disabled={!user || submittingComment}
              />
              {newComment.trim() && (
                <button
                  type="submit"
                  className="comment-submit-btn"
                  disabled={submittingComment}
                >
                  {submittingComment ? '…' : '↵'}
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export const FeedItem = memo(FeedItemComponent);
