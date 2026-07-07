import React, { useState, useEffect } from 'react';
import './Carousel.css';

export interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  bgColor?: string;
  icon?: React.ReactNode;
}

interface CarouselProps {
  slides: CarouselSlide[];
}

export const Carousel: React.FC<CarouselProps> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);

  useEffect(() => {
    if (!isAutoplay || slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoplay, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoplay(false);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoplay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setIsAutoplay(false);
  };

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div className="carousel">
      <div className="carousel__container">
        <div className="carousel__track">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`carousel__slide ${
                index === currentIndex ? 'carousel__slide--active' : ''
              }`}
              style={{ backgroundColor: slide.bgColor || 'var(--color-bg-alt)' }}
            >
              <div className="carousel__content">
                <div className="carousel__icon">{slide.icon}</div>
                <h2 className="carousel__title">{slide.title}</h2>
                <p className="carousel__description">{slide.description}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          className="carousel__control carousel__control--prev"
          onClick={goToPrev}
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button
          className="carousel__control carousel__control--next"
          onClick={goToNext}
          aria-label="Next slide"
        >
          ›
        </button>
      </div>

      <div className="carousel__dots">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            className={`carousel__dot ${
              index === currentIndex ? 'carousel__dot--active' : ''
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
