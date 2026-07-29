import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { assetUrl, memberApi } from '../../lib/api';

/**
 * Professional Web Carousel Component
 * - Merged from CarouselDemo & InfiniteCarouselAdvanced
 * - Uses same color scheme as WebHeader (localStorage web_* keys)
 * - Features: Autoplay, Touch/Swipe, Keyboard, Smooth animations
 */
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
  const [theme, setTheme] = useState({});
  const [images, setImages] = useState([])

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

  // Load theme from localStorage (same as WebHeader)
  useEffect(() => {
    const loadTheme = () => {
      const colorKeys = [
        'backgroundColor', 'borderColor', 'buttonColor', 'fontColor',
        'gradientEnd', 'gradientStart', 'primaryColor', 'secondaryColor', 'textColor',
        'name','webLogo','favicon','phone','email','facebook','instagram','twitter','youtube','whatsapp',"bannerImages"
      ];


      const loadedTheme = {};
      colorKeys.forEach((key) => {
        const value = localStorage.getItem(`web_${key}`);
        if (value) {
          loadedTheme[key] = value;
        }
      });


      setTheme(loadedTheme);
      setImages(normalizeBannerImages(loadedTheme.bannerImages));

    };

    loadTheme();
    window.addEventListener('storage', loadTheme);
    return () => window.removeEventListener('storage', loadTheme);
  }, []);

  useEffect(() => {
    const fetchBannerImages = async () => {
      try {
        const res = await memberApi.get('/get_app_theme')
        const data = res.data?.data || res.data || {}
        const bannerImages = normalizeBannerImages(data.bannerImages)
        if (bannerImages.length) setImages(bannerImages)
      } catch (error) {
        console.error('Failed to load banner images:', error)
      }
    }

    fetchBannerImages()
  }, [])

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
      className="relative w-full h-80 sm:h-96 md:h-[500px] lg:h-[600px] overflow-hidden rounded-2xl shadow-2xl group transition-all"
      style={{ backgroundColor: theme.backgroundColor }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Images Container */}
      <div className="relative w-full h-full">
        {images.length ? images.map((image, index) => {
          const isActive = index === currentIndex;
          const isNext = (index === (currentIndex + 1) % images.length && direction > 0) ||
                        (index === (currentIndex - 1 + images.length) % images.length && direction < 0);

          return (
            <div
              key={index}
              className="absolute inset-0 transition-all duration-700 ease-in-out"
              style={{
                opacity: isActive ? 1 : isNext ? 0 : 0,
                transform: `scale(${isActive ? 1 : 0.95})`,
                zIndex: isActive ? 10 : isNext ? 5 : 0,
              }}
            >
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          );
        }) : (
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(135deg, ${theme.gradientStart || '#E65100'}, ${theme.gradientEnd || '#7B0D1C'})`
          }} />
        )}
      </div>

        

      {/* Left Arrow */}
      {showArrows && images.length > 1 && (
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm"
          style={{
            backgroundColor: `${theme.primaryColor}cc`,
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
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm"
          style={{
            backgroundColor: `${theme.primaryColor}cc`,
            color: theme.fontColor,
          }}
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Dots */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="rounded-full transition-all duration-300 hover:scale-125"
              style={{
                backgroundColor:
                  index === currentIndex ? theme.primaryColor : `${theme.secondaryColor}99`,
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
