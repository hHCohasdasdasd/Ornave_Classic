import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Story, StorySlide, StorySlideType } from '@/data/mockStories';
import './StoryViewer.css';

interface StoryViewerProps {
  stories: Story[];
  startIndex: number;
  onClose: () => void;
}

const IMAGE_SLIDE_DURATION_MS = 4500;
const VIDEO_SLIDE_DURATION_MS = 8000;
const TEXT_SLIDE_DURATION_MS = 5500;

function getSlideType(slide: StorySlide): StorySlideType {
  if (slide.type) return slide.type;
  if (slide.video) return 'video';
  if (slide.image) return 'image';
  return 'text';
}

function getSlideDuration(slide: StorySlide): number {
  switch (getSlideType(slide)) {
    case 'video': return VIDEO_SLIDE_DURATION_MS;
    case 'text': return TEXT_SLIDE_DURATION_MS;
    default: return IMAGE_SLIDE_DURATION_MS;
  }
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ stories, startIndex, onClose }) => {
  const navigate = useNavigate();
  const [storyIndex, setStoryIndex] = useState(startIndex);
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number>();
  const startRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const story = stories[storyIndex];
  const slide = story?.slides[slideIndex];

  const goToNextSlide = useCallback(() => {
    setProgress(0);
    elapsedRef.current = 0;
    if (!story) return;
    if (slideIndex + 1 < story.slides.length) {
      setSlideIndex(slideIndex + 1);
    } else if (storyIndex + 1 < stories.length) {
      setStoryIndex(storyIndex + 1);
      setSlideIndex(0);
    } else {
      onClose();
    }
  }, [story, stories.length, storyIndex, slideIndex, onClose]);

  const goToPrevSlide = useCallback(() => {
    setProgress(0);
    elapsedRef.current = 0;
    if (slideIndex > 0) {
      setSlideIndex(slideIndex - 1);
    } else if (storyIndex > 0) {
      const prevStory = stories[storyIndex - 1];
      setStoryIndex(storyIndex - 1);
      setSlideIndex(Math.max(0, prevStory.slides.length - 1));
    }
  }, [slideIndex, storyIndex, stories]);

  useEffect(() => {
    if (paused || !slide) return;
    const duration = getSlideDuration(slide);
    startRef.current = performance.now() - elapsedRef.current;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      elapsedRef.current = elapsed;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        goToNextSlide();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [storyIndex, slideIndex, paused, goToNextSlide, slide]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goToNextSlide();
      if (e.key === 'ArrowLeft') goToPrevSlide();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goToNextSlide, goToPrevSlide]);

  if (!story || !slide) return null;

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <button className="story-viewer__close" onClick={onClose} aria-label="Close">×</button>

      <div className="story-viewer__card" onClick={(e) => e.stopPropagation()}>
        <div className="story-viewer__progress-row">
          {story.slides.map((_, i) => (
            <div key={i} className="story-viewer__progress-track">
              <div
                className="story-viewer__progress-fill"
                style={{ width: i < slideIndex ? '100%' : i === slideIndex ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        <div className="story-viewer__header">
          <div className="story-viewer__header-avatar">
            {story.avatarUrl ? <img src={story.avatarUrl} alt={story.name} /> : <span>{story.name.charAt(0).toUpperCase()}</span>}
          </div>
          <span
            className="story-viewer__header-name"
            onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/profile?view=${story.profileSlug}`); }}
          >
            {story.name}
          </span>
          {story.type === 'company' && <span className="story-viewer__header-badge">Company</span>}
        </div>

        {(() => {
          const slideType = getSlideType(slide);

          if (slideType === 'text') {
            return (
              <div className="story-viewer__text-slide" style={{ background: slide.background || '#1c1a17' }}>
                {slide.heading && <h2 className="story-viewer__text-heading">{slide.heading}</h2>}
                {slide.text && <p className="story-viewer__text-body">{slide.text}</p>}
              </div>
            );
          }

          if (slideType === 'video') {
            return (
              <video
                key={slide.video}
                className="story-viewer__video"
                src={slide.video}
                autoPlay
                muted
                loop
                playsInline
              />
            );
          }

          return <img className="story-viewer__image" src={slide.image} alt="" />;
        })()}

        {getSlideType(slide) !== 'text' && slide.caption && (
          <>
            <div className="story-viewer__caption-scrim" />
            <p className="story-viewer__caption">{slide.caption}</p>
          </>
        )}

        <button
          className="story-viewer__tap-zone story-viewer__tap-zone--prev"
          onClick={goToPrevSlide}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          aria-label="Previous"
        />
        <button
          className="story-viewer__tap-zone story-viewer__tap-zone--next"
          onClick={goToNextSlide}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          aria-label="Next"
        />
      </div>
    </div>
  );
};
