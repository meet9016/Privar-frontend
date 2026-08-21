import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({ children, content }) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  useEffect(() => {
    const updatePosition = () => {
      if (isVisible && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top - 8,
          left: rect.left + rect.width / 2,
        });
      }
    };

    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      className="inline-block cursor-pointer max-w-full"
    >
      {children}
      {isVisible && content && typeof window !== 'undefined'
        ? createPortal(
            <div
              className="fixed z-[99999] bg-[#1a1a1a] text-white text-xs font-medium rounded-lg px-3 py-2.5 shadow-2xl max-w-xs break-words pointer-events-none transform -translate-x-1/2 -translate-y-full animate-fade-in border border-white/10"
              style={{ top: coords.top, left: coords.left }}
            >
              {content}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[6px] border-transparent border-t-[#1a1a1a]"></div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
