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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUpdate = () => {
      const loaded = getInitialWebTheme();
      setTheme(loaded);
      const parsed = normalizeBannerImages(loaded.bannerImages);
      setImages(parsed);
      setLoading(false);
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('web-theme-updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('web-theme-updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchBannerImages = async () => {
      try {
        const res = await memberApi.get('/get_app_theme');
        const data = res.data?.data || res.data || {};
        const bannerImages = normalizeBannerImages(data.bannerImages);
        if (isMounted) {
          setImages(bannerImages);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load banner images:', error);
        if (isMounted) setLoading(false);
      }
    };
    fetchBannerImages();
    return () => { isMounted = false; };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length]);

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
      className="relative w-full h-[280px] xs:h-[320px] sm:h-[460px] md:h-[540px] lg:h-[620px] xl:h-[700px] max-h-[85vh] overflow-hidden group transition-all duration-500 bg-white sm:bg-[#080d28] border-b border-gray-100 sm:border-black/10"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-width crossfade & scale slides */}
      <div className="relative w-full h-full overflow-hidden">
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
              className="absolute inset-0 w-full h-full flex items-center justify-center bg-white sm:bg-[#080d28]"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'scale(1)' : 'scale(1.01)',
                transition: 'opacity 900ms cubic-bezier(0.4,0,0.2,1), transform 1000ms cubic-bezier(0.4,0,0.2,1)',
                zIndex: isActive ? 10 : 0,
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              {/* Image with crisp responsive presentation - 100% visible on mobile */}
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-contain sm:object-cover object-center transition-transform duration-700"
                draggable={false}
              />
            </div>
          );
        }) : loading ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backgroundColor: theme.backgroundColor || '#0a2342'
            }}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-3 border-white/30 border-t-white animate-spin" />
          </div>
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 text-center"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor || '#0a2342'} 0%, ${theme.gradientEnd || '#1e3a8a'} 100%)`
            }}
          >
            <h2 className="text-xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">
              {theme.name || 'Parivar'}
            </h2>
            <p className="mt-1 sm:mt-2 text-xs sm:text-base text-white/80 max-w-md">
              Welcome to our official community portal.
            </p>
          </div>
        )}
      </div>

      {/* Left Arrow */}
      {showArrows && images.length > 1 && (
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-md border border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.25)] flex items-center justify-center"
          style={{
            backgroundColor: theme.primaryColor ? `${theme.primaryColor}E6` : '#0a2342E6',
            color: theme.fontColor || '#FFFFFF',
          }}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>
      )}

      {/* Right Arrow */}
      {showArrows && images.length > 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-md border border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.25)] flex items-center justify-center"
          style={{
            backgroundColor: theme.primaryColor ? `${theme.primaryColor}E6` : '#0a2342E6',
            color: theme.fontColor || '#FFFFFF',
          }}
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>
      )}

      {/* Dots */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-1.5 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2 bg-black/25 px-2 py-1 sm:px-3 sm:py-2 rounded-full backdrop-blur-sm border border-white/20 shadow-md">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{
                backgroundColor:
                  index === currentIndex ? (theme.primaryColor || '#FFFFFF') : 'rgba(255, 255, 255, 0.5)',
                width: index === currentIndex ? '18px' : '5px',
                height: '5px',
                boxShadow: index === currentIndex ? `0 0 8px ${theme.primaryColor || '#ffffff'}` : 'none'
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
