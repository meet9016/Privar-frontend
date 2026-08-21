import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { assetUrl, memberApi } from '../../lib/api';

/**
 * Professional Web Carousel Component
 * - Merged from CarouselDemo & InfiniteCarouselAdvanced
 * - Uses same color scheme as WebHeader (localStorage web_* keys)
 * - Features: Autoplay, Touch/Swipe, Keyboard, Smooth animations
 */
const getInitialWebTheme = () => {
  const colorKeys = [
    'backgroundColor', 'borderColor', 'buttonColor', 'fontColor',
    'gradientEnd', 'gradientStart', 'primaryColor', 'secondaryColor', 'textColor',
    'name', 'webLogo', 'favicon', 'phone', 'email', 'facebook', 'instagram', 'twitter', 'youtube', 'whatsapp', 'bannerImages'
  ];
  const loaded = {};
  colorKeys.forEach((key) => {
    const value = localStorage.getItem(`web_${key}`);
    if (value) loaded[key] = value;
  });
  return loaded;
}

const normalizeBannerImages = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(assetUrl)
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map(assetUrl)
  } catch (error) {
    // Fall back to comma-separated values for older saved localStorage data.
  }
  return value.split(',').map((item) => item.trim()).filter(Boolean).map(assetUrl)
}

const Carousel = ({
  autoplay = true,
  autoplayInterval = 4000,
  showArrows = true,
  showDots = true,
  showCounter = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [theme, setTheme] = useState(getInitialWebTheme);
  const [images, setImages] = useState(() => normalizeBannerImages(getInitialWebTheme().bannerImages));
  useEffect(() => {
    const handleStorage = () => {
      const loaded = getInitialWebTheme();
      setTheme(loaded);
      const parsed = normalizeBannerImages(loaded.bannerImages);
      if (parsed.length) setImages(parsed);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const fetchBannerImages = async () => {
      try {
        const res = await memberApi.get('/get_app_theme');
        const data = res.data?.data || res.data || {};
        const bannerImages = normalizeBannerImages(data.bannerImages);
        if (bannerImages.length) setImages(bannerImages);
      } catch (error) {
        console.error('Failed to load banner images:', error);
      }
    };
    fetchBannerImages();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autoplay
  useEffect(() => {
    if (!autoplay || images.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoplayInterval);
    return () => clearInterval(timer);
  }, [autoplay, autoplayInterval, images.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [images.length]);

  const nextSlide = () => {
    if (!images.length) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    if (!images.length) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Touch handlers
  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e) => {
    setTouchEnd(e.changedTouches[0].clientX);
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextSlide() : prevSlide();
    }
  };

  return (
    <div
      className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1] max-h-[500px] overflow-hidden group bg-transparent"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-width crossfade slides */}
      <div className="relative w-full h-full">
        {images.length ? images.map((image, index) => {
          let diff = (index - currentIndex) % images.length;

          // Normalize diff
          const half = Math.floor(images.length / 2);
          if (diff > half) diff -= images.length;
          if (diff < -half) diff += images.length;

          // For 2 images, special direction handling
          if (images.length === 2) {
            if (direction > 0 && diff === -1) diff = 1;
            if (direction < 0 && diff === 1) diff = -1;
          }

          const isActive = diff === 0;

          return (
            <div
              key={index}
              className="absolute inset-0 w-full h-full"
              style={{
                opacity: isActive ? 1 : 0,
                transition: 'opacity 1000ms cubic-bezier(0.4,0,0.2,1)',
                zIndex: isActive ? 10 : 0,
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              {/* Image without zoom */}
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover origin-center"
                draggable={false}
              />
              {/* Subtle vignette gradient — bottom for dots, edges for depth */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.45) 100%)'
              }} />
            </div>
          );
        }) : (
          <div className="absolute inset-0 bg-surface-secondary flex items-center justify-center" style={{
            backgroundColor: theme.backgroundColor || '#f8fafc'
          }}>
            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        )}
      </div>



      {/* Left Arrow */}
      {showArrows && images.length > 1 && (
        <button
          onClick={prevSlide}
          className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-md border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
          style={{
            backgroundColor: `${theme.primaryColor}E6`,
            color: theme.fontColor,
          }}
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Right Arrow */}
      {showArrows && images.length > 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-md border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
          style={{
            backgroundColor: `${theme.primaryColor}E6`,
            color: theme.fontColor,
          }}
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Dots */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2.5 bg-black/20 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{
                backgroundColor:
                  index === currentIndex ? theme.primaryColor : '#ffffff80',
                width: index === currentIndex ? '36px' : '10px',
                height: '10px',
              }}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}


    </div>
  );
};

export default Carousel;
