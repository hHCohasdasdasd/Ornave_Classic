import React, { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StorySlideType } from './StoryViewer';
import { IconImage } from '@/components/ui/Icons';
import './CreateStoryModal.css';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: { type: StorySlideType; image?: string; video?: string; heading?: string; text?: string; caption?: string; background?: string }) => void;
}

const BACKGROUNDS = ['#1a1a2e', '#4f6b3f', '#5f5646', '#7d6329', '#4f5f68'];

// Stories are stored client-side (localStorage), so uploads are kept small
// enough to avoid hitting the ~5MB localStorage quota.
const MAX_FILE_BYTES = 3 * 1024 * 1024;

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { user } = useAuth();
  const [slideType, setSlideType] = useState<StorySlideType>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [caption, setCaption] = useState('');
  const [heading, setHeading] = useState('');
  const [text, setText] = useState('');
  const [background, setBackground] = useState(BACKGROUNDS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const userName = user ? `${user.firstName} ${user.lastName}` : 'You';
  const canSubmit = slideType === 'text' ? heading.trim().length > 0 : mediaUrl.trim().length > 0;

  const reset = () => {
    setSlideType('image');
    setMediaUrl('');
    setFileName('');
    setFileError('');
    setIsDragging(false);
    setCaption('');
    setHeading('');
    setText('');
    setBackground(BACKGROUNDS[0]);
    onClose();
  };

  const acceptedType = slideType === 'video' ? 'video' : 'image';

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    setFileError('');
    if (!file.type.startsWith(`${acceptedType}/`)) {
      setFileError(`Please choose a ${acceptedType} file.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`That file is too big — keep it under ${Math.round(MAX_FILE_BYTES / (1024 * 1024))}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(typeof reader.result === 'string' ? reader.result : '');
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (slideType === 'text') {
      onSubmit({ type: 'text', heading: heading.trim(), text: text.trim() || undefined, background });
    } else if (slideType === 'video') {
      onSubmit({ type: 'video', video: mediaUrl, caption: caption.trim() || undefined });
    } else {
      onSubmit({ type: 'image', image: mediaUrl, caption: caption.trim() || undefined });
    }
    reset();
  };

  return (
    <div className="create-story-modal-overlay" onClick={reset}>
      <div className="create-story-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-story-modal__header">
          <h2>Create a Story</h2>
          <button className="create-story-modal__close" onClick={reset}>×</button>
        </div>

        <div className="create-story-modal__user-section">
          <div className="create-story-modal__user">
            <div className="create-story-modal__avatar">
              <div className="create-story-modal__avatar-placeholder">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="create-story-modal__user-info">
              <span className="create-story-modal__name">{userName}</span>
              <span className="create-story-modal__kind">Visible for 24 hours</span>
            </div>
          </div>
        </div>

        <div className="create-story-modal__tabs">
          <button
            className={`tab-btn ${slideType === 'image' ? 'active' : ''}`}
            onClick={() => { setSlideType('image'); setMediaUrl(''); setFileName(''); setFileError(''); }}
          >
            Photo
          </button>
          <button
            className={`tab-btn ${slideType === 'video' ? 'active' : ''}`}
            onClick={() => { setSlideType('video'); setMediaUrl(''); setFileName(''); setFileError(''); }}
          >
            Video
          </button>
          <button className={`tab-btn ${slideType === 'text' ? 'active' : ''}`} onClick={() => setSlideType('text')}>Text</button>
        </div>

        <div className="create-story-modal__content">
          {slideType !== 'text' ? (
            <>
              {!mediaUrl ? (
                <div
                  className={`create-story-modal__dropzone ${isDragging ? 'dragging' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFile(e.dataTransfer.files?.[0]);
                  }}
                >
                  <IconImage size={26} />
                  <span className="create-story-modal__dropzone-title">
                    Drag &amp; drop {acceptedType === 'image' ? 'an' : 'a'} {acceptedType} here
                  </span>
                  <span className="create-story-modal__dropzone-sub">or click to upload from your device</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={`${acceptedType}/*`}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>
              ) : (
                <div className="create-story-modal__preview">
                  {slideType === 'video' ? (
                    <video src={mediaUrl} controls muted />
                  ) : (
                    <img src={mediaUrl} alt="Preview" />
                  )}
                  {caption && <span className="create-story-modal__preview-caption">{caption}</span>}
                  <button
                    className="create-story-modal__preview-remove"
                    onClick={() => { setMediaUrl(''); setFileName(''); }}
                  >
                    ×
                  </button>
                </div>
              )}

              {fileError && <span className="create-story-modal__file-error">{fileError}</span>}
              {fileName && !fileError && <span className="create-story-modal__file-name">{fileName}</span>}

              <input
                type="text"
                className="create-story-modal__field"
                placeholder="Caption (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={140}
              />
            </>
          ) : (
            <>
              <input
                type="text"
                className="create-story-modal__title"
                placeholder="Heading (e.g. We're hiring!)"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                maxLength={60}
              />
              <textarea
                className="create-story-modal__textarea"
                placeholder="Add a bit more detail (optional)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
              />
              <div className="create-story-modal__swatches">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg}
                    className={`create-story-modal__swatch ${background === bg ? 'active' : ''}`}
                    style={{ background: bg }}
                    onClick={() => setBackground(bg)}
                  />
                ))}
              </div>
              {heading.trim() && (
                <div className="create-story-modal__preview create-story-modal__preview--text" style={{ background }}>
                  <span className="create-story-modal__preview-heading">{heading}</span>
                  {text && <span className="create-story-modal__preview-text">{text}</span>}
                </div>
              )}
            </>
          )}
        </div>

        <div className="create-story-modal__footer">
          <button className="create-story-modal__cancel" onClick={reset}>Cancel</button>
          <button className="create-story-modal__submit" onClick={handleSubmit} disabled={!canSubmit}>
            Share to Story
          </button>
        </div>
      </div>
    </div>
  );
};
