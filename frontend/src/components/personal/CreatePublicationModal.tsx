import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MentionPicker } from './MentionPicker';
import { Mention } from '@/types/feed';
import './CreatePublicationModal.css';

interface CreatePublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: { title: string; content: string; coverImage?: string; tags: string[]; postAsCompany?: boolean; mentions?: Mention[] }) => void;
  defaultTag?: string;
}

export const CreatePublicationModal: React.FC<CreatePublicationModalProps> = ({ isOpen, onClose, onSubmit, defaultTag }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tagInput, setTagInput] = useState(defaultTag || '');
  const [postAsCompany, setPostAsCompany] = useState(!!user?.companyId);
  const [mentions, setMentions] = useState<Mention[]>([]);

  // The modal mounts (with hooks running) before the parent's group data has
  // necessarily loaded, so `defaultTag` can still be undefined at the point
  // the `tagInput` useState initializer runs. Re-sync each time it opens.
  useEffect(() => {
    if (isOpen && defaultTag && !tagInput) {
      setTagInput(defaultTag);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultTag]);

  if (!isOpen) return null;

  const tags = tagInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && tags.length > 0;

  const reset = () => {
    setTitle('');
    setContent('');
    setCoverImage('');
    setTagInput(defaultTag || '');
    setMentions([]);
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ title: title.trim(), content: content.trim(), coverImage: coverImage.trim() || undefined, tags, postAsCompany, mentions });
    reset();
  };

  return (
    <div className="create-publication-modal-overlay" onClick={reset}>
      <div className="create-publication-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-publication-modal__header">
          <h2>Publish an article</h2>
          <button className="create-publication-modal__close" onClick={reset}>×</button>
        </div>

        <p className="create-publication-modal__hint">
          Publications are longer-form pieces, separate from your posts. Tag them with a sector (e.g. Science, Finance)
          and they'll automatically show up on that sector's page.
        </p>

        <input
          type="text"
          className="create-publication-modal__title"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
        />

        <textarea
          className="create-publication-modal__content"
          placeholder="Write your publication..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
        />

        <input
          type="text"
          className="create-publication-modal__cover"
          placeholder="Cover image URL (optional)"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
        />

        <input
          type="text"
          className="create-publication-modal__tags"
          placeholder="Sector tags, comma-separated (e.g. Science, Technology)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
        />

        {tags.length > 0 && (
          <div className="create-publication-modal__tag-preview">
            {tags.map((t) => (
              <span key={t} className="create-publication-modal__tag-chip">{t.toUpperCase()}</span>
            ))}
          </div>
        )}

        <div className="create-publication-modal__mentions">
          <MentionPicker selected={mentions} onChange={setMentions} />
        </div>

        {user?.companyId && (
          <label className="create-publication-modal__company-toggle">
            <input type="checkbox" checked={postAsCompany} onChange={(e) => setPostAsCompany(e.target.checked)} />
            Post as my company
          </label>
        )}

        <div className="create-publication-modal__footer">
          <button className="create-publication-modal__cancel" onClick={reset}>Cancel</button>
          <button className="create-publication-modal__submit" onClick={handleSubmit} disabled={!canSubmit}>
            Publish
          </button>
        </div>
      </div>
    </div>
  );
};
