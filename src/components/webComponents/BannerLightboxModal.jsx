import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Move
} from 'lucide-react';

export default function BannerLightboxModal({
  isOpen,
  images = [],
  currentIndex = 0,
  onClose,
  onNavigate,
  theme = {}
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });
  const containerRef = useRef(null);
  const modalRootRef = useRef(null);

  // Touch swipe detection inside modal
  const modalTouchStartX = useRef(0);
  const modalTouchStartY = useRef(0);
  const modalTouchMoved = useRef(false);

  // Reset zoom & pan when image changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsDragging(false);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, currentIndex]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, zoom]);

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    }
    onClose?.();
  };

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    onNavigate?.(prevIndex);
  }, [currentIndex, images.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    const nextIndex = (currentIndex + 1) % images.length;
    onNavigate?.(nextIndex);
  }, [currentIndex, images.length, onNavigate]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(4, +(prev + 0.35).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = +(prev - 0.35).toFixed(2);
      if (next <= 1) {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (modalRootRef.current?.requestFullscreen) {
        modalRootRef.current.requestFullscreen().catch(() => { });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomDelta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoom((prev) => {
      const next = +(prev + zoomDelta).toFixed(2);
      if (next <= 1) {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      return Math.min(4, next);
    });
  };

  // Pan handlers (Mouse)
  const handleMouseDown = (e) => {
    if (e.button !== 0 || zoom <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y
    };
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || zoom <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.startPanX + deltaX,
      y: dragStartRef.current.startPanY + deltaY
    });
  }, [isDragging, zoom]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  // Touch handlers in modal
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      modalTouchStartX.current = e.touches[0].clientX;
      modalTouchStartY.current = e.touches[0].clientY;
      modalTouchMoved.current = false;

      if (zoom > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          startPanX: pan.x,
          startPanY: pan.y
        };
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - modalTouchStartX.current;
      const deltaY = e.touches[0].clientY - modalTouchStartY.current;
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        modalTouchMoved.current = true;
      }

      if (zoom > 1 && isDragging) {
        setPan({
          x: dragStartRef.current.startPanX + deltaX,
          y: dragStartRef.current.startPanY + deltaY
        });
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (isDragging) setIsDragging(false);

    // If not zoomed and swiped horizontally, navigate
    if (zoom === 1 && modalTouchMoved.current && e.changedTouches.length) {
      const diffX = modalTouchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diffX) > 45) {
        diffX > 0 ? handleNext() : handlePrev();
      }
    }
  };

  // Double click toggle zoom
  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (zoom > 1) {
      handleReset();
    } else {
      setZoom(2.2);
    }
  };

  if (!isOpen || !images.length || !images[currentIndex]) return null;

  const currentImage = images[currentIndex];
  const primaryColor = theme.primaryColor || '#0a2342';

  return ReactDOM.createPortal(
    <div
      ref={modalRootRef}
      className="fixed inset-0 flex flex-col justify-between p-3 sm:p-6 bg-black/92 backdrop-blur-2xl select-none animate-fade-in text-white"
      style={{ zIndex: 999999 }}
      onClick={handleClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* ─── TOP BAR: Close Button ─── */}
      <div
        className="w-full max-w-7xl mx-auto flex items-center justify-end z-30 px-2 py-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="p-2.5 sm:p-3 rounded-full text-white/90 hover:text-white bg-white/10 hover:bg-white/25 backdrop-blur-xl border border-white/20 transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          title="Close (Esc)"
          aria-label="Close"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* ─── CENTER VIEWPORT: Banner Canvas with Smooth Pan & Zoom ─── */}
      <div
        ref={containerRef}
        className={`relative w-full flex-1 flex items-center justify-center overflow-hidden my-2 ${zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
          }`}
        onClick={(e) => {
          // If clicked directly on canvas background (not dragging), close
          if (e.target === containerRef.current && zoom === 1) {
            handleClose();
          }
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        {/* Navigation Arrow: Left */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 sm:left-6 z-40 p-2.5 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/20 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer group"
            aria-label="Previous Banner"
          >
            <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* The Enlarged Image Container */}
        <div
          className="flex items-center justify-center pointer-events-none transition-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
            transformOrigin: 'center center'
          }}
        >
          <img
            src={currentImage}
            alt={`Banner ${currentIndex + 1}`}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="max-w-[94vw] max-h-[76vh] object-contain rounded-xl sm:rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/10 select-none pointer-events-auto transition-opacity duration-300"
          />
        </div>

        {/* Navigation Arrow: Right */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-6 z-40 p-2.5 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/20 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer group"
            aria-label="Next Banner"
          >
            <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Pan Hint when Zoomed */}
        {zoom > 1 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/70 text-white/90 backdrop-blur-md text-[11px] font-medium px-4 py-1.5 rounded-full pointer-events-none flex items-center gap-2 border border-white/20 shadow-lg animate-fade-in">
            <Move className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>Drag to pan • Scroll to zoom</span>
          </div>
        )}
      </div>

      {/* ─── BOTTOM BAR: Thumbnails & Keyboard Hint ─── */}
      <div
        className="w-full max-w-4xl mx-auto flex flex-col items-center gap-2 z-30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thumbnails Gallery Strip */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-black/50 backdrop-blur-2xl rounded-2xl border border-white/15 max-w-[95vw] overflow-x-auto shadow-2xl">
            {images.map((img, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onNavigate?.(idx)}
                  className={`relative flex-shrink-0 w-14 h-9 sm:w-20 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${isActive
                      ? 'ring-2 ring-white scale-105 opacity-100 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                      : 'opacity-50 hover:opacity-90 hover:scale-100'
                    }`}
                  style={{
                    borderColor: isActive ? (theme.primaryColor || '#FFFFFF') : 'transparent'
                  }}
                  aria-label={`Jump to banner ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isActive && (
                    <div
                      className="absolute inset-0 border-2 rounded-lg sm:rounded-xl pointer-events-none"
                      style={{ borderColor: primaryColor || '#ffffff' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Keyboard / Navigation hint */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-white/60 tracking-wider">
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">ESC</kbd> Close</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">→</kbd> Navigate</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Scroll</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Double-click</kbd> Zoom</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
