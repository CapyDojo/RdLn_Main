import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Check, ChevronDown, GripVertical } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeConfig } from '../types/theme';
import { BaseComponentProps } from '../types/components';

interface DragState {
  isDragging: boolean;
  dragIndex: number | null;
  dragOverIndex: number | null;
}

// Helper function to get theme-specific styling for buttons
const getThemeButtonStyle = (theme: ThemeConfig, isSelected: boolean) => {
  const baseStyle = {
    backdropFilter: 'blur(8px)',
    borderWidth: isSelected ? '2px' : '1px',
    transition: 'all 0.2s ease'
  };

  // Theme-specific configurations
  const themeConfigs = {
    'professional': {
      background: 'linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%, #e2e8f0 100%)',
      textColor: '#3b82f6',
      borderColor: isSelected ? '#3b82f6' : 'rgba(59, 130, 246, 0.5)'
    },
    'classic-light': {
      background: '#F2F5F9',
      textColor: '#1e3a8a', // Dark blue
      borderColor: isSelected ? '#1e3a8a' : 'rgba(30, 58, 138, 0.5)'
    },
    'classic-dark': {
      background: '#171717',
      textColor: '#ffffff', // White
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
    '--theme-dots-color': config.textColor
  };
};

// Helper function to convert hex to RGB values
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `${r}, ${g}, ${b}`;
};

export const ThemeSelector: React.FC<BaseComponentProps> = ({ style, className }) => {
  const { currentTheme, setTheme, availableThemes, reorderThemes } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragIndex: null,
    dragOverIndex: null
  });
  const themesButtonRef = React.useRef<HTMLDivElement>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  // Initialize and update button position
  React.useEffect(() => {
    if (themesButtonRef.current) {
      const rect = themesButtonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
  }, [isHovered]); // Update on hover state change

  // Set initial position on mount
  React.useEffect(() => {
    if (themesButtonRef.current) {
      const rect = themesButtonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
  }, []);

  const handleSelectTheme = (themeName: string, isDragEvent = false) => {
    // Only select theme if it's not a drag event
    if (!isDragEvent) {
      setTheme(themeName);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    setDragState({
      isDragging: true,
      dragIndex: index,
      dragOverIndex: null
    });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragState.dragIndex !== index) {
      setDragState(prev => ({
        ...prev,
        dragOverIndex: index
      }));
    }
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      dragIndex: null,
      dragOverIndex: null
    });
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (dragState.dragIndex !== null && dragState.dragIndex !== dropIndex) {
      reorderThemes(dragState.dragIndex, dropIndex);
    }
    
    handleDragEnd();
  };

  // Prevent theme selection during drag operations
  const handleMouseDown = (e: React.MouseEvent) => {
    if (dragState.isDragging) {
      e.preventDefault();
    }
  };

  return (
    <div 
      ref={themesButtonRef}
      className={`relative ${className || ''}`}
      style={style}
    >
      {/* Main Themes Button - Rounded Square */}
      <button
        className="flex items-center justify-center bg-theme-primary-100 hover:bg-theme-primary-200 rounded-lg transition-all duration-200 text-theme-primary-800 shadow-md shrink-0 relative group"
        title="Hover to see themes"
        aria-label="Theme selector - hover to view available themes"
        onMouseEnter={() => setIsHovered(true)}
        style={{ width: '48px', height: '48px', aspectRatio: '1/1' }}
      >
        <div className="flex flex-col items-center justify-center">
          <Palette className="w-6 h-6" aria-hidden="true" />
          <ChevronDown 
            className={`w-2.5 h-2.5 transition-transform duration-300 ${isHovered ? 'rotate-180' : ''} mt-0.5`} 
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Cascading Theme Cards - Rendered via Portal */}
      {buttonRect && createPortal(
        <div 
          className="fixed z-[10000]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            left: buttonRect.right - 208, // Right-align cards (w-52 = 208px)
            top: buttonRect.top, // Start from button top
            width: 208, // Match w-52 card width
            height: buttonRect.height + 8 + (availableThemes.length * 45) + 20, // Cover button + gap + all cards (45px gaps)
            paddingTop: buttonRect.height + 8, // Space for button + gap
            pointerEvents: isHovered ? 'auto' : 'none', // Only allow interaction when button is hovered
          }}
        >
          {availableThemes.map((theme, index) => {
            const isDragOver = dragState.dragOverIndex === index;
            const isDragging = dragState.dragIndex === index;
            const delay = index * 50; // Staggered animation delay
            
            return (
              <div
                key={theme.name}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  absolute transition-all duration-500 ease-out
                  ${isDragOver ? 'scale-105' : ''}
                  ${isDragging ? 'opacity-50 scale-95' : ''}
                  ${isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                `}
                style={{
                  transform: isHovered 
                    ? `translateY(${index * 45}px) scale(1) rotateX(0deg)` 
                    : `translateY(-30px) scale(0.8) rotateX(-15deg)`,
                  transformOrigin: 'top center',
                  transitionDelay: isHovered ? `${delay}ms` : `${(availableThemes.length - index - 1) * 50}ms`,
                  transitionDuration: '400ms',
                  transitionTimingFunction: isHovered 
                    ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Bounce down
                    : 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth up
                  zIndex: availableThemes.length - index, // Higher z-index for earlier themes
                }}
              >
                <button
                  onClick={() => handleSelectTheme(theme.name, dragState.isDragging)}
                  className="w-52 px-4 py-3 text-left rounded-lg flex items-center gap-3 group transition-all duration-200 border shadow-lg hover:shadow-xl"
                  style={getThemeButtonStyle(theme, currentTheme === theme.name)}
                  onMouseEnter={(e) => {
                    if (currentTheme !== theme.name) {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentTheme !== theme.name) {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                    }
                  }}
                >
                  <GripVertical 
                    className="w-4 h-4 shrink-0 opacity-60" 
                    style={{ color: 'var(--theme-dots-color)' }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-semibold truncate"
                      style={{ 
                        color: `var(--theme-text-color) !important`,
                        fontFamily: 'inherit !important'
                      }}
                    >
                      {theme.displayName}
                    </div>
                  </div>
                  
                  {currentTheme === theme.name && (
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
