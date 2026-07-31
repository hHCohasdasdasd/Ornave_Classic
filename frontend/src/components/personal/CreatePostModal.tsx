import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storeService, Product } from '@/services/storeService';
import { ServiceCard } from '@/types/feed';
import {
  IconEdit, IconArticle, IconChart, IconTrophy, IconBag,
  IconGlobe, IconUsers, IconLock, IconImage, IconHash, IconAt, IconPaperclip, IconSave,
} from '@/components/ui/Icons';
import './CreatePostModal.css';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, mediaUrl?: string, title?: string, serviceCard?: ServiceCard, tags?: string[]) => void;
  userName: string;
  userAvatar?: string;
}

type PostVisibility = 'public' | 'connections' | 'private';
type ContentType = 'post' | 'article' | 'poll' | 'celebration' | 'service';

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userName,
  userAvatar,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaInput, setMediaInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [contentType, setContentType] = useState<ContentType>('post');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState('1 week');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [firmProducts, setFirmProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedService, setSelectedService] = useState<Product | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);

  const maxChars = 3000;
  const charCount = content.length;
  const charPercentage = (charCount / maxChars) * 100;

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (contentType === 'service' && user?.companyId) {
      setLoadingProducts(true);
      storeService.getCompanyProducts(user.companyId).then(p => {
        setFirmProducts(p);
        setLoadingProducts(false);
      }).catch(() => setLoadingProducts(false));
    }
  }, [contentType, user?.companyId]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (contentType === 'service' && selectedService) {
      const serviceCard: ServiceCard = {
        id: selectedService.id,
        name: selectedService.name,
        price: selectedService.price,
        currency: selectedService.currency,
        firmName: user?.firstName || 'Our firm',
        firmId: user?.companyId || '',
        description: selectedService.description || undefined,
        imageUrl: selectedService.imageUrl || undefined,
      };
      onSubmit(content || `Check out our service: ${selectedService.name}`, undefined, selectedService.name, serviceCard, tags);
      resetForm();
    } else if (content.trim() || mediaUrls.length > 0) {
      onSubmit(content, mediaUrls[0], title, undefined, tags);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setMediaUrls([]);
    setMediaInput('');
    setTagInput('');
    setContentType('post');
    setVisibility('public');
    setPollOptions(['', '']);
    setSelectedService(null);
    setFirmProducts([]);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      resetForm();
    }
  };

  const handleAddMedia = () => {
    if (mediaInput.trim() && mediaUrls.length < 9) {
      setMediaUrls([...mediaUrls, mediaInput.trim()]);
      setMediaInput('');
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const visibilityOptions = [
    { value: 'public' as PostVisibility, icon: IconGlobe, label: 'Anyone', description: 'Anyone on or off Ornave', color: '#5b8fc7' },
    { value: 'connections' as PostVisibility, icon: IconUsers, label: 'Connections only', description: 'Only your connections can see', color: '#5b9d8f' },
    { value: 'private' as PostVisibility, icon: IconLock, label: 'Only me', description: 'Only visible to you', color: '#cf7d5c' },
  ];

  const currentVisibility = visibilityOptions.find(v => v.value === visibility)!;

  const CONTENT_TYPES: { value: ContentType; label: string; icon: React.FC<{ size?: number; className?: string }>; color: string }[] = [
    { value: 'post', label: 'Post', icon: IconEdit, color: '#c6a15b' },
    { value: 'article', label: 'Article', icon: IconArticle, color: '#5b9d8f' },
    { value: 'poll', label: 'Poll', icon: IconChart, color: '#8b7fd6' },
    { value: 'celebration', label: 'Celebrate', icon: IconTrophy, color: '#cf7d5c' },
    { value: 'service', label: 'Service', icon: IconBag, color: '#5b8fc7' },
  ];
  const activeType = CONTENT_TYPES.find(t => t.value === contentType)!;

  const canSubmit = contentType === 'poll'
    ? pollOptions.filter(o => o.trim()).length >= 2
    : contentType === 'service'
    ? selectedService !== null
    : (content.trim().length > 0 || mediaUrls.length > 0);

  return (
    <div className="create-post-modal-overlay" onClick={handleOverlayClick}>
      <div className="create-post-modal" style={{ ['--type-accent' as string]: activeType.color }}>
        <div className="create-post-modal__accent-bar" />
        <div className="create-post-modal__header">
          <h2>
            <activeType.icon size={16} className="create-post-modal__header-icon" />
            {contentType === 'post' && 'Create a post'}
            {contentType === 'article' && 'Write an article'}
            {contentType === 'poll' && 'Create a poll'}
            {contentType === 'celebration' && 'Celebrate an occasion'}
            {contentType === 'service' && 'Share a service'}
          </h2>
          <button className="create-post-modal__close" onClick={resetForm}>
            ×
          </button>
        </div>

        <div className="create-post-modal__user-section">
          <div className="create-post-modal__user">
            <div className="create-post-modal__avatar">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} />
              ) : (
                <div className="create-post-modal__avatar-placeholder">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="create-post-modal__user-info">
              <span className="create-post-modal__name">{userName}</span>
              <button
                className="create-post-modal__visibility-btn"
                onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
              >
                <currentVisibility.icon size={12} /> {currentVisibility.label} ▾
              </button>
            </div>
          </div>

          {showVisibilityMenu && (
            <div className="visibility-menu">
              {visibilityOptions.map((option) => (
                <button
                  key={option.value}
                  className={`visibility-option ${visibility === option.value ? 'active' : ''}`}
                  style={{ ['--vis-accent' as string]: option.color }}
                  onClick={() => {
                    setVisibility(option.value);
                    setShowVisibilityMenu(false);
                  }}
                >
                  <span className="visibility-option__icon"><option.icon size={16} /></span>
                  <div className="visibility-option__text">
                    <div className="visibility-option__label">{option.label}</div>
                    <div className="visibility-option__description">{option.description}</div>
                  </div>
                  {visibility === option.value && <span className="visibility-option__check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Type Tabs */}
        <div className="create-post-modal__tabs">
          {CONTENT_TYPES.filter(t => t.value !== 'service' || user?.userType === 'COMPANY_USER').map((type) => (
            <button
              key={type.value}
              className={`tab-btn ${contentType === type.value ? 'active' : ''}`}
              style={{ ['--tab-accent' as string]: type.color }}
              onClick={() => setContentType(type.value)}
            >
              <type.icon size={14} />
              {type.label}
            </button>
          ))}
        </div>

        {/* Service Picker */}
        {contentType === 'service' && (
          <div className="create-post-modal__service-picker">
            {loadingProducts ? (
              <div className="service-picker__empty">Loading your services...</div>
            ) : firmProducts.length === 0 ? (
              <div className="service-picker__empty">
                No services found. Add services in your store first.
              </div>
            ) : (
              <>
                <p className="service-picker__hint">Pick a service to feature in your post</p>
                <div className="service-picker__grid">
                  {firmProducts.map(product => (
                    <div
                      key={product.id}
                      className={`service-picker__item ${selectedService?.id === product.id ? 'service-picker__item--selected' : ''}`}
                      onClick={() => setSelectedService(product)}
                    >
                      {product.imageUrl && (
                        <div className="service-picker__img">
                          <img src={product.imageUrl} alt={product.name} />
                        </div>
                      )}
                      <div className="service-picker__info">
                        <div className="service-picker__name">{product.name}</div>
                        <div className="service-picker__price">{product.currency} {product.price.toFixed(2)}</div>
                      </div>
                      {selectedService?.id === product.id && (
                        <span className="service-picker__check">✓</span>
                      )}
                    </div>
                  ))}
                </div>
                {selectedService && (
                  <textarea
                    className="create-post-modal__textarea"
                    placeholder="Add a message about this service (optional)"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={3}
                    style={{ marginTop: '12px' }}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Main Content Area */}
        {contentType !== 'poll' && contentType !== 'service' ? (
          <div className="create-post-modal__content">
            <input
              type="text"
              className="create-post-modal__title-input"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              ref={textareaRef}
              className="create-post-modal__textarea"
              placeholder={
                contentType === 'article' 
                  ? 'Write your article... Share your knowledge and insights'
                  : contentType === 'celebration'
                  ? 'Share the good news! What are you celebrating?'
                  : 'What do you want to talk about?'
              }
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
              rows={contentType === 'article' ? 12 : 8}
            />
            <div className="create-post-modal__char-counter">
              <svg className="char-progress" width="24" height="24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(246, 243, 237, 0.15)" strokeWidth="2" />
                <circle 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  fill="none" 
                  stroke={charPercentage > 90 ? 'var(--color-danger)' : activeType.color}
                  strokeWidth="2"
                  strokeDasharray={`${charPercentage * 0.628} 62.8`}
                  transform="rotate(-90 12 12)"
                />
              </svg>
              <span className={charPercentage > 90 ? 'warning' : ''}>
                {maxChars - charCount}
              </span>
            </div>
          </div>
        ) : (
          <div className="create-post-modal__poll">
            <div className="poll-question">
              <textarea
                className="poll-question__input"
                placeholder="Ask a question..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
              />
            </div>
            <div className="poll-options">
              {pollOptions.map((option, index) => (
                <div key={index} className="poll-option">
                  <input
                    type="text"
                    className="poll-option__input"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handlePollOptionChange(index, e.target.value)}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      className="poll-option__remove"
                      onClick={() => handleRemovePollOption(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {pollOptions.length < 6 && (
              <button className="poll-add-option" onClick={handleAddPollOption}>
                + Add option
              </button>
            )}
            <div className="poll-duration">
              <label>Poll duration:</label>
              <select value={pollDuration} onChange={(e) => setPollDuration(e.target.value)}>
                <option value="1 day">1 day</option>
                <option value="3 days">3 days</option>
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
              </select>
            </div>
          </div>
        )}

        {/* Media Preview — hidden for service posts */}
        {contentType !== 'service' && mediaUrls.length > 0 && (
          <div className="create-post-modal__media-preview">
            {mediaUrls.map((url, index) => (
              <div key={index} className="media-preview-item">
                <img src={url} alt={`Upload ${index + 1}`} />
                <button
                  className="media-preview-item__remove"
                  onClick={() => handleRemoveMedia(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        {contentType !== 'service' && (
          <div className="create-post-modal__toolbar">
            <div className="toolbar-left">
              <button
                className="toolbar-btn toolbar-btn--image"
                onClick={() => fileInputRef.current?.click()}
                title="Add photos"
              >
                <IconImage size={16} />
              </button>
              <button className="toolbar-btn toolbar-btn--at" title="Mention someone">
                <IconAt size={16} />
              </button>
              <button className="toolbar-btn toolbar-btn--clip" title="Add document">
                <IconPaperclip size={16} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => { console.log('Files selected:', e.target.files); }}
            />
          </div>
        )}

        {/* Tags */}
        {contentType !== 'poll' && contentType !== 'service' && (
          <div className="create-post-modal__tags-section">
            <IconHash size={14} className="create-post-modal__tags-icon" />
            <input
              ref={tagInputRef}
              type="text"
              className="tag-input"
              placeholder="Add tags, comma-separated (e.g. supplychain, fintech)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
          </div>
        )}
        {tags.length > 0 && (
          <div className="create-post-modal__tag-preview">
            {tags.map((t) => (
              <span key={t} className="create-post-modal__tag-chip">#{t.toUpperCase()}</span>
            ))}
          </div>
        )}

        {/* Add Media Input */}
        {contentType !== 'poll' && contentType !== 'service' && (
          <div className="create-post-modal__media-input-section">
            <input
              type="text"
              className="media-url-input"
              placeholder="Or paste image URL here..."
              value={mediaInput}
              onChange={(e) => setMediaInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddMedia()}
            />
            <button className="media-add-btn" onClick={handleAddMedia}>
              Add
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="create-post-modal__footer">
          <button className="draft-btn"><IconSave size={13} /> Save draft</button>
          <button
            className="create-post-modal__submit"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};
