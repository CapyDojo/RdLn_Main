import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface FullScreenOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * FullScreenOverlay - Full screen modal for displaying results
 * 
 * Features:
 * - Full-screen modal with backdrop blur
 * - Smooth animation
 * - Responsive design
 * - Keyboard navigation (ESC to close)
 * - Accessibility support with ARIA labels
 * - Click outside to close
 * - Focus management
 */
export const FullScreenOverlay: React.FC<FullScreenOverlayProps> = ({
  isVisible,
  onClose,
  children,
  className = ''
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(isVisible);

  // Handle visibility changes and exit transitions
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsExiting(false);
    } else if (shouldRender) {
      // Small delay to prevent flicker from competing animations
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
        // Remove from DOM after animation completes
        const removeTimer = setTimeout(() => {
          setShouldRender(false);
          setIsExiting(false);
        }, 250); // Match the exit animation duration
        
        return () => clearTimeout(removeTimer);
      }, 16); // One frame delay to let any conflicting animations settle
      
      return () => clearTimeout(exitTimer);
    }
  }, [isVisible, shouldRender]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [shouldRender, onClose]);

  // Focus management and body scroll prevention
  useEffect(() => {
    if (isVisible) {
      // Focus the overlay container for keyboard navigation
      overlayRef.current?.focus();
      
      // Prevent body scroll when overlay is open
      document.body.style.overflow = 'hidden';
    } else if (!shouldRender) {
      // Only restore body scroll after exit animation completes
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible, shouldRender]);

  // Handle click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!shouldRender) return null;

  const overlayContent = (
    <div
      ref={overlayRef}
      className={`results-overlay ${className} ${isExiting ? 'exiting' : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="results-overlay-title"
      aria-describedby="results-overlay-description"
      tabIndex={-1}
    >
      {/* Hidden title for screen readers */}
      <h2 id="results-overlay-title" className="sr-only">
        Document Comparison Results
      </h2>
      
      {/* Hidden description for screen readers */}
      <p id="results-overlay-description" className="sr-only">
        Full-screen view of the document comparison results. Press Escape or click outside to close.
      </p>

      {/* Content wrapper */}
      <div className="results-overlay-content">
        {children}
      </div>
    </div>
  );

  // Render the overlay at the root level using a portal
  return createPortal(overlayContent, document.body);
};