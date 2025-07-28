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
    background: 'white',
    borderWidth: isSelected ? '2px' : '1px',
    transition: 'all 0.2s ease'
  };

  // Theme-specific configurations
  const themeConfigs = {
    'professional': {
      background: 'linear-gradient(135deg, rgba(226, 232, 240, 0.8) 0%, rgba(241, 245, 249, 0.8) 25%, rgba(248, 250, 252, 0.8) 50%, rgba(241, 245, 249, 0.8) 75%, rgba(226, 232, 240, 0.8) 100%)',
      textColor: '#3b82f6',
      borderColor: isSelected ? '#3b82f6' : 'rgba(59, 130, 246, 0.5)'
    },
    'classic-light': {
      background: 'rgba(248, 250, 252, 0.8)', // Light blue-grey background matching theme
      textColor: '#0f172a', // Dark header text from theme
      borderColor: isSelected ? '#f97316' : 'rgba(249, 115, 22, 0.4)' // Orange accent from theme
    },
    'classic-dark': {
      background: 'rgba(38, 38, 38, 0.9)', // Dark grey background matching theme
      textColor: '#ffffff', // White header text from theme
      borderColor: isSelected ? '#fb923c' : 'rgba(251, 146, 60, 0.4)' // Orange interactive color from theme
    },
    'bamboo': {
      background: 'linear-gradient(45deg, rgba(45, 80, 22, 0.8) 0%, rgba(146, 183, 113, 0.8) 25%, rgba(113, 155, 81, 0.8) 63%, rgba(183, 203, 165, 0.8) 85%, rgba(123, 160, 95, 0.8) 100%)',
      textColor: '#2C1704',
      borderColor: isSelected ? '#2C1704' : 'rgba(44, 23, 4, 0.5)'
    },
    'kyoto': {
      background: 'linear-gradient(160deg, rgba(122, 61, 26, 0.9) 0%, rgba(155, 74, 31, 0.9) 5%, rgba(197, 90, 17, 0.9) 10%, rgba(217, 119, 6, 0.9) 15%, rgba(220, 8, 8, 0.9) 18%, rgba(173, 76, 16, 0.9) 27%, rgba(107, 68, 35, 0.9) 35%, rgba(74, 93, 35, 0.9) 45%, rgba(58, 77, 31, 0.9) 55%, rgba(42, 61, 26, 0.9) 60%, rgba(30, 58, 30, 0.9) 65%, rgba(87, 69, 12, 0.9) 70%, rgba(7, 59, 27, 0.9) 80%, rgba(197, 90, 17, 0.9) 95%, rgba(186, 101, 3, 0.9) 100%)',
      textColor: '#E4B5AE',
      borderColor: isSelected ? '#E4B5AE' : 'rgba(228, 181, 174, 0.5)'
    },
    'new-york': {
      background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 30%, rgba(69, 26, 3, 0.9) 100%)',
      textColor: '#E9B64B',
      borderColor: isSelected ? '#E9B64B' : 'rgba(233, 182, 75, 0.5)'
    },


    'neon-night': {
      background: 'linear-gradient(135deg, rgba(5, 5, 8, 0.9) 0%, rgba(8, 8, 16, 0.9) 20%, rgba(15, 15, 24, 0.9) 40%, rgba(139, 92, 246, 0.4) 60%, rgba(0, 255, 255, 0.3) 80%, rgba(15, 15, 24, 0.9) 100%)',
      textColor: '#00ffff',
      borderColor: isSelected ? '#ff00ff' : 'rgba(255, 0, 255, 0.6)'
    },
    'mariana': {
      background: 'linear-gradient(330deg, rgba(6, 28, 49, 0.9) 0%, rgba(17, 44, 75, 0.9) 25%, rgba(26, 53, 96, 0.9) 63%, rgba(39, 69, 133, 0.9) 85%, rgba(54, 84, 166, 0.9) 100%)',
      textColor: '#ffffff',
      borderColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
    },
    'aurora-borealis': {
      background: 'linear-gradient(135deg, rgba(15, 5, 36, 0.9) 0%, rgba(26, 9, 51, 0.9) 20%, rgba(30, 55, 153, 0.9) 40%, rgba(56, 173, 169, 0.9) 60%, rgba(120, 224, 143, 0.9) 80%, rgba(184, 233, 148, 0.9) 100%)',
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
      className={`relative segmented-control ${className || ''}`}
      style={style}
    >
      {/* Main Themes Button - Rounded Square */}
      <button
        className="flex items-center justify-center rounded-lg transition-all duration-200 shrink-0 relative group segment"
        title="Hover to see themes"
        aria-label="Theme selector - hover to view available themes"
        onMouseEnter={() => setIsHovered(true)}
        style={{
          width: '48px',
          height: '48px',
          aspectRatio: '1/1'
        }}
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
