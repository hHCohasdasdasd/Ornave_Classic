import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Publication, publicationService } from '@/services/publicationService';
import { groupService } from '@/services/groupService';
import './PublicationCard.css';

interface PublicationCardProps {
  publication: Publication;
}

export const PublicationCard: React.FC<PublicationCardProps> = ({ publication }) => {
  const navigate = useNavigate();
  const { user, triggerAuthModal } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(publication.reactions?.likes ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState(publication.reactions?.comments ?? 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const requireAuth = (action: string, fn: () => void) => {
    if (!user || user.id === 'guest') {
      triggerAuthModal(`Please log in to ${action}.`);
      return;
    }
    fn();
  };

  const handleLike = () => {
    requireAuth('like this publication', () => {
      const next = !liked;
      setLiked(next);
      const nextCount = next ? likeCount + 1 : likeCount - 1;
      setLikeCount(nextCount);
      publicationService.updateReactions(publication.id, { likes: nextCount, comments: commentCount }).catch(() => {});
    });
  };

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const data = await publicationService.getComments(publication.id);
        setComments(data);
      } catch {
        // silently fail
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments((v) => !v);
    if (!showComments) setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    requireAuth('comment on publications', async () => {
      setSubmitting(true);
      try {
        const comment = await publicationService.addComment(publication.id, newComment.trim());
        setComments((prev) => [...prev, comment]);
        setCommentCount((c) => c + 1);
        setNewComment('');
      } catch {
        // silently fail
      } finally {
        setSubmitting(false);
      }
    });
  };

  const handleTagClick = async (tag: string) => {
    const matches = await groupService.listGroups(tag);
    const exact = matches.find((g) => g.tag === tag.toUpperCase()) || matches[0];
    if (exact) navigate(`/groups/${exact.slug}`);
    else navigate(`/groups?search=${encodeURIComponent(tag)}`);
  };

  const authorName = publication.author.companyName || `${publication.author.firstName} ${publication.author.lastName}`;
  const isLong = publication.content.length > 320;
  const displayedContent = expanded || !isLong ? publication.content : `${publication.content.slice(0, 320)}…`;

  return (
    <div className="publication-card">
      {publication.coverImage && (
        <div className="publication-card__cover">
          <img src={publication.coverImage} alt={publication.title} />
        </div>
      )}
      <div className="publication-card__body">
        <div className="publication-card__author">
          <div className="publication-card__avatar">
            {publication.author.profilePicture ? (
              <img src={publication.author.profilePicture} alt={authorName} />
            ) : (
              authorName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="publication-card__author-info">
            <span className="publication-card__author-name">{authorName}</span>
            {publication.author.headline && !publication.author.companyName && (
              <span className="publication-card__author-headline">{publication.author.headline}</span>
            )}
          </div>
        </div>

        <h3 className="publication-card__title">{publication.title}</h3>

        <div className="publication-card__tags">
          {publication.tags.map((t) => (
            <span key={t} className="publication-card__tag" onClick={() => handleTagClick(t)}>
              {t}
            </span>
          ))}
        </div>

        <p className="publication-card__content">{displayedContent}</p>
        {isLong && (
          <button className="publication-card__expand" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {publication.mentions && publication.mentions.length > 0 && (
          <div className="publication-card__mentions">
            <span className="publication-card__mentions-label">With</span>
            {publication.mentions.map((m) => (
              <span
                key={`${m.type}-${m.id}`}
                className="publication-card__mention-chip"
                onClick={() => navigate(`/profile?view=${m.slug}`)}
              >
                {m.avatarUrl && <img src={m.avatarUrl} alt={m.name} />}
                {m.name}
              </span>
            ))}
          </div>
        )}

        <div className="publication-card__actions">
          <button className={`publication-card__action ${liked ? 'publication-card__action--active' : ''}`} onClick={handleLike}>
            {liked ? '❤️' : '🤍'} {likeCount}
          </button>
          <button className="publication-card__action" onClick={handleToggleComments}>
            💬 {commentCount}
          </button>
        </div>

        {showComments && (
          <div className="publication-card__comments">
            {loadingComments ? (
              <div className="publication-card__comments-empty">Loading comments…</div>
            ) : comments.length === 0 ? (
              <div className="publication-card__comments-empty">No comments yet.</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="publication-card__comment">
                  <div className="publication-card__comment-avatar">
                    {c.author.firstName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="publication-card__comment-author">{c.author.firstName} {c.author.lastName}</span>
                    <p className="publication-card__comment-content">{c.content}</p>
                  </div>
                </div>
              ))
            )}
            <form className="publication-card__comment-form" onSubmit={handleSubmitComment}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Add a comment…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={submitting}
              />
              <button type="submit" disabled={submitting || !newComment.trim()}>Post</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
