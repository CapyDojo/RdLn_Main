import React, { useRef, useEffect } from 'react';
import { CustomTooltip } from './CustomTooltip';
import { useFontSize } from '../contexts/FontSizeContext';
import { BaseComponentProps } from '../types/components';

type FontSize = 'small' | 'medium' | 'large';

interface FontSizeOption {
  size: FontSize;
  label: string;
  displaySize: string;
  shortLabel: string;
}

const fontSizeOptions: FontSizeOption[] = [
  { size: 'small', label: 'Small Text', displaySize: '16px', shortLabel: 'S' },
  { size: 'medium', label: 'Medium Text', displaySize: '23px', shortLabel: 'M' },
  { size: 'large', label: 'Large Text', displaySize: '30px', shortLabel: 'L' },
];


export const FontSizeSelector: React.FC<BaseComponentProps> = ({ style, className }) => {
  const { fontSize, setFontSize } = useFontSize();
  const segmentedControlRef = useRef<HTMLDivElement>(null);

  const handleSelectFontSize = (size: FontSize) => {
    setFontSize(size);
  };

  // Get current size index for sliding indicator
  const getCurrentSizeIndex = () => {
    return fontSizeOptions.findIndex(option => option.size === fontSize);
  };

  // Handle keyboard navigation  
  const handleKeyDown = (e: React.KeyboardEvent, size: FontSize) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectFontSize(size);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIndex = getCurrentSizeIndex();
      let newIndex;
      
      if (e.key === 'ArrowLeft') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : fontSizeOptions.length - 1;
      } else {
        newIndex = currentIndex < fontSizeOptions.length - 1 ? currentIndex + 1 : 0;
      }
      
      handleSelectFontSize(fontSizeOptions[newIndex].size);
    }
  };

  return (
    <div className={`${className || ''}`} style={style}>
      <div 
        className="segmented-control font-size-control" 
        ref={segmentedControlRef} 
        role="group" 
        aria-label="Text Size Selection"
      >
        {fontSizeOptions.map((option, index) => {
          const isActive = fontSize === option.size;
          
          return (
            <CustomTooltip key={option.size} content={`Set text size to ${option.label} (${option.displaySize})`}>
              <button
                onClick={() => handleSelectFontSize(option.size)}
                onKeyDown={(e) => handleKeyDown(e, option.size)}
                className={`segment ${isActive ? 'active' : ''}`}
                aria-pressed={isActive}
                aria-label={`${option.label} - ${option.displaySize}`}
              >
              <span 
                className="font-bold leading-none font-serif libertinus-math-text"
                style={{ fontSize: option.displaySize }}
              >
                Aa
              </span>
              </button>
            </CustomTooltip>
          );
        })}
        
        {/* Sliding indicator */}
        <div 
          className={`sliding-indicator size-${fontSize}`} 
          aria-hidden="true"
        />
      </div>
    </div>
  );
};