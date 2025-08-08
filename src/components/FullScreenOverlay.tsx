import React, { useEffect, useRef } from 'react';
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

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isVisible, onClose]);

  // Focus management and body scroll prevention
  useEffect(() => {
    if (isVisible) {
      // Focus the overlay container for keyboard navigation
      overlayRef.current?.focus();
      
      // Prevent body scroll when overlay is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when overlay closes
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  // Handle click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const overlayContent = (
    <div
      ref={overlayRef}
      className={`results-overlay ${className}`}
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