import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { assetUrl, api } from '../../lib/api';
import { THEME_ENDPOINTS } from '../../utils/endpoints';
import BannerLightboxModal from './BannerLightboxModal';
import { getStoredWebTheme } from '../../hooks/useWebTheme'

/**
 * Professional Web Carousel Component
 * - Merged from CarouselDemo & InfiniteCarouselAdvanced
 * - Uses same color scheme as WebHeader (localStorage web_* keys)
 * - Features: Autoplay, Touch/Swipe, Keyboard, Smooth animations, Fullscreen HD Lightbox Preview
 */
const getInitialWebTheme = getStoredWebTheme

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
  const [theme, setTheme] = useState(getInitialWebTheme);
  const [images, setImages] = useState(() => normalizeBannerImages(getInitialWebTheme().bannerImages));
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Touch tracking for mobile swipe vs tap detection
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchMovedRef = useRef(false);

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
        const res = await api.get(THEME_ENDPOINTS.GET_THEME);
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

  // Keyboard navigation (Carousel only responds when lightbox is closed)
  useEffect(() => {
    if (lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, lightboxOpen]);

  // Autoplay (automatically paused when lightbox is open)
  useEffect(() => {
    if (!autoplay || images.length <= 1 || lightboxOpen) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoplayInterval);
    return () => clearInterval(timer);
  }, [autoplay, autoplayInterval, images.length, lightboxOpen]);

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

  // Touch handlers (prevent false-positive taps while swiping)
  const handleTouchStart = (e) => {
    if (!e.targetTouches.length) return;
    const touch = e.targetTouches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchMovedRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (!e.targetTouches.length) return;
    const touch = e.targetTouches[0];
    const diffX = Math.abs(touch.clientX - touchStartXRef.current);
    const diffY = Math.abs(touch.clientY - touchStartYRef.current);
    if (diffX > 10 || diffY > 10) {
      touchMovedRef.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches.length) return;
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - endX;
    if (Math.abs(diff) > 45) {
      diff > 0 ? nextSlide() : prevSlide();
    }
  };

  const handleBannerClick = (index) => {
    if (touchMovedRef.current) return;
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div
        className="relative w-full h-[280px] xs:h-[320px] sm:h-[460px] md:h-[540px] lg:h-[620px] xl:h-[700px] max-h-[85vh] overflow-hidden group transition-all duration-500 bg-white sm:bg-[#080d28] border-b border-gray-100 sm:border-black/10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
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
                onClick={() => handleBannerClick(index)}
                className={`absolute inset-0 w-full h-full flex items-center justify-center bg-white sm:bg-[#080d28] ${isActive ? 'cursor-zoom-in group/slide' : ''
                  }`}
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'scale(1)' : 'scale(1.01)',
                  transition: 'opacity 900ms cubic-bezier(0.4,0,0.2,1), transform 1000ms cubic-bezier(0.4,0,0.2,1)',
                  zIndex: isActive ? 10 : 0,
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
                title="Click to enlarge banner"
              >
                {/* Image with crisp responsive presentation - 100% visible on mobile */}
                <img
                  src={image}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-contain sm:object-cover object-center transition-transform duration-700 group-hover/slide:scale-[1.012]"
                  draggable={false}
                />

                {/* Floating Modern Expand Indicator Badge */}
                {isActive && (
                  <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-8 z-10 opacity-0 group-hover/slide:opacity-100 transition-all duration-300 transform translate-y-1 group-hover/slide:translate-y-0 pointer-events-none">
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-white text-xs sm:text-sm font-medium shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl border border-white/30"
                      style={{
                        backgroundColor: theme.primaryColor ? `${theme.primaryColor}E6` : 'rgba(10, 35, 66, 0.85)'
                      }}
                    >
                      <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2] animate-pulse" />
                      <span>Click to enlarge</span>
                    </div>
                  </div>
                )}
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
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-md border border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.25)] flex items-center justify-center cursor-pointer"
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
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-md border border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.25)] flex items-center justify-center cursor-pointer"
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
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
                className="rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer"
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

      {/* ─── High-Definition Banner Lightbox Modal ─── */}
      <BannerLightboxModal
        isOpen={lightboxOpen}
        images={images}
        currentIndex={currentIndex}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(newIndex) => {
          setDirection(newIndex > currentIndex ? 1 : -1);
          setCurrentIndex(newIndex);
        }}
        theme={theme}
      />
    </>
  );
};

export default Carousel;
