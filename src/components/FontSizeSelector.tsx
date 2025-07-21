import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { useFontSize } from '../contexts/FontSizeContext';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeConfig } from '../types/theme';
import { BaseComponentProps } from '../types/components';

type FontSize = 'small' | 'medium' | 'large';

interface FontSizeOption {
  size: FontSize;
  label: string;
  displaySize: string;
}

const fontSizeOptions: FontSizeOption[] = [
  { size: 'small', label: 'Small Text', displaySize: '18px' },
  { size: 'medium', label: 'Medium Text', displaySize: '22px' },
  { size: 'large', label: 'Large Text', displaySize: '26px' },
];

// Helper function to get theme-specific styling for buttons
const getThemeButtonStyle = (theme: ThemeConfig, isSelected: boolean) => {
  const baseStyle = {
    background: 'white',
    borderWidth: isSelected ? '2px' : '1px',
    transition: 'all 0.2s ease'
  };

  // Theme-specific configurations (matching ThemeSelector)
  const themeConfigs = {
    'professional': {
      background: 'linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%, #e2e8f0 100%)',
      textColor: '#3b82f6',
      borderColor: isSelected ? '#3b82f6' : 'rgba(59, 130, 246, 0.5)'
    },
    'classic-light': {
      background: '#F2F5F9',
      textColor: '#1e3a8a',
      borderColor: isSelected ? '#1e3a8a' : 'rgba(30, 58, 138, 0.5)'
    },
    'classic-dark': {
      background: '#171717',
      textColor: '#ffffff',
      borderColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
    },
    'bamboo': {
      background: 'linear-gradient(45deg, #2d5016 0%, rgb(146, 183, 113) 25%, rgb(113, 155, 81) 63%, rgb(183, 203, 165) 85%, #7ba05f 100%)',
      textColor: '#2C1704',
      borderColor: isSelected ? '#2C1704' : 'rgba(44, 23, 4, 0.5)'
    },
    'kyoto': {
      background: 'linear-gradient(160deg, #7A3D1A 0%, #9B4A1F 5%, #C55A11 10%, #D97706 15%, rgb(220, 8, 8) 18%, rgb(173, 76, 16) 27%, #6B4423 35%, #4A5D23 45%, #3A4D1F 55%, #2A3D1A 60%, #1E3A1E 65%, rgb(87, 69, 12) 70%, rgb(7, 59, 27) 80%, #C55A11 95%, rgb(186, 101, 3) 100%)',
      textColor: '#E4B5AE',
      borderColor: isSelected ? '#E4B5AE' : 'rgba(228, 181, 174, 0.5)'
    },
    'new-york': {
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 30%, #451a03 100%)',
      textColor: '#E9B64B',
      borderColor: isSelected ? '#E9B64B' : 'rgba(233, 182, 75, 0.5)'
    },
    'apple-light': {
      background: '#f8fafc',
      textColor: '#1e3a8a',
      borderColor: isSelected ? '#1e3a8a' : 'rgba(30, 58, 138, 0.5)'
    },
    'apple-dark': {
      background: '#0a0a0a',
      textColor: '#ffffff',
      borderColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
    },
    'autumn': {
      background: 'linear-gradient(45deg, #7c2d12 0%, #ea580c 25%, #fb923c 50%, #fdba74 75%, #fed7aa 100%)',
      textColor: '#7c2d12',
      borderColor: isSelected ? '#7c2d12' : 'rgba(124, 45, 18, 0.5)'
    },
    'ocean-deep': {
      background: 'linear-gradient(330deg, rgb(6, 28, 49) 0%, rgb(17, 44, 75) 25%, rgb(26, 53, 96) 63%, rgb(39, 69, 133) 85%, rgb(54, 84, 166) 100%)',
      textColor: '#ffffff',
      borderColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
    },
    'neon-night': {
      background: 'linear-gradient(45deg, #1e1e1e 0%, #2d2d2d 25%, #3a3a3a 63%, #4a4a4a 85%, #5a5a5a 100%)',
      textColor: '#ffffff',
      borderColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
    },
    'deep-dive': {
      background: 'linear-gradient(330deg, rgb(6, 28, 49) 0%, rgb(17, 44, 75) 25%, rgb(26, 53, 96) 63%, rgb(39, 69, 133) 85%, rgb(54, 84, 166) 100%)',
      textColor: '#ffffff',
      borderColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
    },
    'aurora-borealis': {
      background: 'linear-gradient(135deg, #0f0524 0%, #1a0933 20%, #1e3799 40%, #38ada9 60%, #78e08f 80%, #b8e994 100%)',
      textColor: '#ffffff',
      borderColor: isSelected ? '#b8e994' : 'rgba(184, 233, 148, 0.5)'
    },
  };

  const config = themeConfigs[theme.name as keyof typeof themeConfigs] || themeConfigs['professional'];

  return {
    ...baseStyle,
    background: config.background,
    borderColor: config.borderColor,
    boxShadow: isSelected 
      ? `0 4px 16px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)`
      : `0 2px 8px rgba(0, 0, 0, 0.1)`,
    '--theme-text-color': config.textColor,
  };
};

export const FontSizeSelector: React.FC<BaseComponentProps> = ({ style, className }) => {
  const { fontSize, setFontSize } = useFontSize();
  const { currentTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const fontSizeButtonRef = React.useRef<HTMLDivElement>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  // Initialize and update button position
  React.useEffect(() => {
    if (fontSizeButtonRef.current) {
      const rect = fontSizeButtonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
  }, [isHovered]);

  // Set initial position on mount
  React.useEffect(() => {
    if (fontSizeButtonRef.current) {
      const rect = fontSizeButtonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
  }, []);

  const handleSelectFontSize = (size: FontSize) => {
    setFontSize(size);
  };

  // Get current font size display for main button
  const getCurrentSizeDisplay = () => {
    const sizeMap = { 
      small: { size: '18px', label: 'S' }, 
      medium: { size: '22px', label: 'M' }, 
      large: { size: '26px', label: 'L' } 
    };
    return sizeMap[fontSize];
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsHovered(!isHovered);
    } else if (e.key === 'Escape') {
      setIsHovered(false);
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, size: FontSize) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectFontSize(size);
      setIsHovered(false);
    }
  };

  return (
    <div 
      ref={fontSizeButtonRef}
      className={`relative ${className || ''}`}
      style={style}
    >
      {/* Main Font Size Button */}
      <button
        className="flex items-center justify-center bg-theme-primary-100/50 hover:bg-theme-primary-200/50 rounded-lg transition-all duration-200 text-theme-primary-800 shadow-theme border border-theme-primary-300/50 shrink-0 relative group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        title={`Current text size: ${fontSize} - Click or hover to adjust`}
        aria-label={`Font size selector - current size: ${fontSize}. Press Enter to open size options`}
        aria-expanded={isHovered}
        aria-haspopup="listbox"
        onMouseEnter={() => setIsHovered(true)}
        onFocus={() => setIsHovered(true)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{ 
          width: '48px', 
          height: '48px', 
          aspectRatio: '1/1'
        }}
      >
        <div className="flex flex-col items-center justify-center">
          {/* Clean Aa icon */}
          <div className="flex items-center justify-center">
            <span 
              className="font-bold leading-none"
              style={{ fontSize: getCurrentSizeDisplay().size }}
            >
              Aa
            </span>
          </div>
          {/* Size indicator */}
          <div className="text-[10px] leading-none mt-1 opacity-60 font-medium">
            {getCurrentSizeDisplay().label}
          </div>
        </div>
      </button>

      {/* Font Size Options - Rendered via Portal */}
      {buttonRect && createPortal(
        <div 
          className="fixed z-[10000]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          role="listbox"
          aria-label="Font size options"
          style={{
            left: buttonRect.left, // Left-align with button
            top: buttonRect.top, // Start from button top
            width: 208, // Match ThemeSelector card width
            height: buttonRect.height + 8 + (fontSizeOptions.length * 45) + 20,
            paddingTop: buttonRect.height + 8, // Space for button + gap
            pointerEvents: isHovered ? 'auto' : 'none',
          }}
        >
          {fontSizeOptions.map((option, index) => {
            const isSelected = fontSize === option.size;
            const delay = index * 50; // Staggered animation delay
            
            return (
              <div
                key={option.size}
                className={`
                  absolute transition-all duration-500 ease-out
                  ${isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                `}
                style={{
                  transform: isHovered 
                    ? `translateY(${index * 45}px) scale(1) rotateX(0deg)` 
                    : `translateY(-30px) scale(0.8) rotateX(-15deg)`,
                  transformOrigin: 'top center',
                  transitionDelay: isHovered ? `${delay}ms` : `${(fontSizeOptions.length - index - 1) * 50}ms`,
                  transitionDuration: '400ms',
                  transitionTimingFunction: isHovered 
                    ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Bounce down
                    : 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth up
                  zIndex: fontSizeOptions.length - index,
                }}
              >
                <button
                  onClick={() => handleSelectFontSize(option.size)}
                  onKeyDown={(e) => handleOptionKeyDown(e, option.size)}
                  className="w-52 px-4 py-3 text-left rounded-lg flex items-center gap-3 group transition-all duration-200 border shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  style={getThemeButtonStyle(currentTheme, isSelected)}
                  role="option"
                  aria-selected={isSelected}
                  aria-label={`${option.label} - ${option.displaySize}`}
                  tabIndex={isHovered ? 0 : -1}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                    }
                  }}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-white/20">
                    <span 
                      className="font-bold leading-none"
                      style={{ 
                        fontSize: option.displaySize,
                        color: 'var(--theme-text-color)'
                      }}
                    >
                      A
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-semibold truncate"
                      style={{ 
                        color: `var(--theme-text-color) !important`,
                        fontFamily: 'inherit !important'
                      }}
                    >
                      {option.label}
                    </div>
                    <div 
                      className="text-xs opacity-75"
                      style={{ 
                        color: `var(--theme-text-color)`,
                      }}
                    >
                      {option.displaySize}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <Check 
                      className="w-5 h-5 shrink-0" 
                      style={{ color: 'var(--theme-text-color)' }}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};