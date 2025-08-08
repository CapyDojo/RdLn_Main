import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Languages } from 'lucide-react';
import { OCRLanguage } from '../types/ocr-types';
import { BaseComponentProps } from '../types/components';
import { useZoomLevel } from '../hooks/useZoom';

interface LanguageSettingsDropdownProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  controlRect: DOMRect | null;
  controlRef: React.RefObject<HTMLDivElement>; // Add ref to control element
  detectedLanguages: OCRLanguage[];
  selectedLanguages: OCRLanguage[];
  supportedLanguages: Array<{
    code: OCRLanguage;
    name: string;
    flag: string;
    downloadSize: string;
  }>;
  value: string; // Text content to determine if we should show detected languages
  onLanguageToggle: (languageCode: OCRLanguage) => void;
  onSetSelectedLanguages: (languages: OCRLanguage[]) => void;
  getLanguageDisplayName: (languageCode: OCRLanguage) => string;
}

export const LanguageSettingsDropdown: React.FC<LanguageSettingsDropdownProps> = ({
  isOpen,
  onClose,
  controlRect,
  controlRef,
  detectedLanguages,
  selectedLanguages,
  supportedLanguages,
  value,
  onLanguageToggle,
  onSetSelectedLanguages,
  getLanguageDisplayName,
  style,
  className
}) => {
  const [currentRect, setCurrentRect] = useState<DOMRect | null>(controlRect);
  
  // Modern zoom detection - works with native zoom on all platforms
  const zoomLevel = useZoomLevel();
  
  // Update position on scroll or resize
  useEffect(() => {
    if (!isOpen || !controlRef.current) return;
    
    const updatePosition = () => {
      if (controlRef.current) {
        const rect = controlRef.current.getBoundingClientRect();
        setCurrentRect(rect);
      }
    };
    
    // Initial position
    updatePosition();
    
    // Listen for scroll and resize events
    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();
    
    window.addEventListener('scroll', handleScroll, true); // Use capture to catch all scroll events
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, controlRef]);

  // Update position when zoom level changes - now works on all platforms
  useEffect(() => {
    if (!isOpen || !controlRef.current) return;
    
    // Update position when zoom changes - getBoundingClientRect() now returns correct values
    const rect = controlRef.current.getBoundingClientRect();
    setCurrentRect(rect);
  }, [zoomLevel, isOpen, controlRef]);
  
  if (!isOpen || !currentRect) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-[9999] ${className || ''}`} 
      style={{
        ...style,
        pointerEvents: 'none' // Make the overlay non-interactive by default
      }}
    >
      {/* Clickable background areas that close dropdown - split to avoid segmented control */}
      {currentRect && controlRef.current ? (
        <>
          {/* Top area - above segmented control */}
          <div 
            className="absolute pointer-events-auto"
            style={{
              left: 0,
              top: 0,
              right: 0,
              height: `${currentRect.top}px`
            }}
            onClick={onClose}
          />
          
          {/* Left area - left of segmented control */}
          <div 
            className="absolute pointer-events-auto"
            style={{
              left: 0,
              top: `${currentRect.top}px`,
              width: `${currentRect.left}px`,
              height: `${currentRect.height}px`
            }}
            onClick={onClose}
          />
          
          {/* Right area - right of segmented control */}
          <div 
            className="absolute pointer-events-auto"
            style={{
              left: `${currentRect.right}px`,
              top: `${currentRect.top}px`,
              right: 0,
              height: `${currentRect.height}px`
            }}
            onClick={onClose}
          />
          
          {/* Bottom area - below segmented control */}
          <div 
            className="absolute pointer-events-auto"
            style={{
              left: 0,
              top: `${currentRect.bottom}px`,
              right: 0,
              bottom: 0
            }}
            onClick={onClose}
          />
        </>
      ) : (
        // Fallback - full screen overlay if no control rect
        <div 
          className="absolute inset-0 pointer-events-auto"
          onClick={onClose}
        />
      )}
      
      {/* Dropdown content */}
      <div 
        className="absolute pointer-events-auto"
        style={{
          top: currentRect.bottom + 8,
          left: Math.max(16, currentRect.right - 500), // Prevent going off-screen on left
          right: Math.max(16, window.innerWidth - currentRect.right), // Responsive right boundary
          width: Math.min(500, window.innerWidth - 32), // Responsive width with 16px margins
          maxWidth: '500px'
        }}
      >
        <div 
          className="glass-panel shadow-2xl border border-white/20 backdrop-blur-xl transition-all duration-300 rounded-xl overflow-hidden" 
          style={{ width: '100%', maxHeight: '60vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-theme-primary-900">Manual Language Selection</h3>
              <button
                onClick={onClose}
                className="text-theme-neutral-600 hover:text-theme-neutral-800 transition-colors"
              >
                <ChevronDown className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 py-4 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(60vh - 80px)' }}>
            {/* Detected Languages - Enhanced Display - Only show when there's content */}
            {detectedLanguages.length > 0 && value.trim() && (
              <div>
                <label className="text-sm font-medium text-theme-neutral-700 mb-3 block">
                  Detected Languages ({detectedLanguages.length})
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {detectedLanguages.map((langCode, index) => (
                    <div
                      key={langCode}
                      className="flex items-center gap-3 px-4 py-3 bg-theme-secondary-50 border border-theme-secondary-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-medium text-theme-secondary-800">
                          {getLanguageDisplayName(langCode)}
                        </span>
                      </div>
                      {index === 0 && (
                        <span className="text-xs bg-theme-secondary-200 text-theme-secondary-800 px-2 py-1 rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-theme-neutral-600 mt-3">
                  Languages are listed in order of detection confidence. Primary language is used for specialized text processing.
                </p>
              </div>
            )}

            {/* Manual Language Selection */}
            <div>
              <label className="text-sm font-medium text-theme-neutral-700 mb-3 block">
                Select Languages ({selectedLanguages.length} selected)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-90 overflow-y-auto border border-theme-neutral-200 rounded-lg p-3">
                {supportedLanguages.map(language => (
                  <label
                    key={language.code}
                    className="flex items-center gap-2 p-2 hover:bg-theme-primary-500 rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(language.code)}
                      onChange={() => onLanguageToggle(language.code)}
                      className="rounded border-theme-neutral-300 text-theme-primary-600 focus:ring-theme-primary-500"
                    />
                    <span className="text-sm flex-1">
                      {language.flag} {language.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quick Language Presets */}
            <div>
              <label className="text-sm font-medium text-theme-neutral-700 mb-3 block">Quick Presets</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSetSelectedLanguages(['eng'])}
                  className="px-4 py-2 text-sm bg-theme-primary-100 text-theme-primary-800 rounded-lg hover:bg-theme-primary-200 transition-colors"
                >
                  English Only
                </button>
                <button
                  onClick={() => onSetSelectedLanguages(['eng', 'chi_sim', 'chi_tra'])}
                  className="px-4 py-2 text-sm bg-theme-primary-100 text-theme-primary-800 rounded-lg hover:bg-theme-primary-200 transition-colors"
                >
                  English + Chinese
                </button>
                <button
                  onClick={() => onSetSelectedLanguages(['eng', 'deu', 'spa', 'fra'])}
                  className="px-4 py-2 text-sm bg-theme-primary-100 text-theme-primary-800 rounded-lg hover:bg-theme-primary-200 transition-colors"
                >
                  English + European
                </button>
                <button
                  onClick={() => onSetSelectedLanguages(['eng', 'jpn', 'kor'])}
                  className="px-4 py-2 text-sm bg-theme-primary-100 text-theme-primary-800 rounded-lg hover:bg-theme-primary-200 transition-colors"
                >
                  English + Asian
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
