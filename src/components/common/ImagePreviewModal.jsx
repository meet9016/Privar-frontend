import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RefreshCw, 
  Download, 
  Move,
  Maximize2
} from 'lucide-react';

export default function ImagePreviewModal({
  isOpen,
  imageUrl,
  title = 'Image Preview',
  onClose
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });
  const containerRef = useRef(null);

  // Reset state when a new image is opened or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      setIsDragging(false);

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, imageUrl]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(5, +(prev + 0.25).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.25, +(prev - 0.25).toFixed(2)));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Mouse wheel zoom inside modal container
  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomDelta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoom((prev) => {
      const next = +(prev + zoomDelta).toFixed(2);
      return Math.min(5, Math.max(0.25, next));
    });
  };

  // Pan handlers (Mouse)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only
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
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.startPanX + deltaX,
      y: dragStartRef.current.startPanY + deltaY
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  // Pan handlers (Touch)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        startPanX: pan.x,
        startPanY: pan.y
      };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.startPanX + deltaX,
      y: dragStartRef.current.startPanY + deltaY
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Double click toggle zoom
  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (zoom !== 1) {
      handleReset();
    } else {
      setZoom(2);
    }
  };

  // Download image
  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = imageUrl.split('/').pop() || 'image-preview.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(imageUrl, '_blank');
    }
  };

  if (!isOpen || !imageUrl) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex flex-col items-center justify-between p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none animate-fade-in"
      style={{ zIndex: 999999 }}
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* ─── TOP BAR: Title & Close Button ──────────────────────────────── */}
      <div 
        className="w-full max-w-6xl flex items-center justify-between z-20 px-2 py-1 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-bold text-white/90 drop-shadow-md truncate max-w-[200px] sm:max-w-md">
            {title}
          </span>
          {zoom !== 1 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary text-white shadow-xs">
              {Math.round(zoom * 100)}%
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all backdrop-blur-md cursor-pointer shadow-lg"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ─── CENTER VIEWPORT: Pan & Zoom Workspace ──────────────────────── */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 flex items-center justify-center overflow-hidden my-2 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <div
          className="flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 150ms cubic-bezier(0.2, 0, 0, 1)',
            transformOrigin: 'center center'
          }}
        >
          <img
            src={imageUrl}
            alt={title}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="max-w-[85vw] max-h-[70vh] sm:max-h-[75vh] object-contain rounded-lg shadow-2xl select-none pointer-events-auto"
          />
        </div>

        {/* Floating Pan Hint (Subtle) */}
        {zoom > 1 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 text-white/80 backdrop-blur-xs text-[10px] font-semibold px-3 py-1 rounded-full pointer-events-none flex items-center gap-1.5 shadow-md">
            <Move className="w-3 h-3" /> Drag to pan • Scroll to zoom
          </div>
        )}
      </div>

      {/* ─── BOTTOM FLOATING TOOLBAR: Zoom, Rotate, Reset, Download ─────── */}
      <div 
        className="z-20 bg-slate-900/80 dark:bg-slate-900/90 text-white border border-white/10 rounded-2xl px-3 py-2 shadow-2xl backdrop-blur-xl flex items-center gap-1 sm:gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Zoom Out */}
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= 0.25}
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Zoom Percentage / Quick Reset */}
        <button
          type="button"
          onClick={handleReset}
          className="px-2.5 py-1 text-xs font-bold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer min-w-[54px] text-center"
          title="Reset Zoom (0 / R)"
        >
          {Math.round(zoom * 100)}%
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= 5}
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="w-[1px] h-5 bg-white/20 mx-1" />

        {/* Rotate */}
        <button
          type="button"
          onClick={handleRotate}
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          title="Rotate Clockwise"
        >
          <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Reset View */}
        <button
          type="button"
          onClick={handleReset}
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          title="Reset View"
        >
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="w-[1px] h-5 bg-white/20 mx-1" />

        {/* Download Image */}
        <button
          type="button"
          onClick={handleDownload}
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          title="Download Image"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>,
    document.body
  );
}
