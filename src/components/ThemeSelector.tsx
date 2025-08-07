import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Check, ChevronDown, GripVertical } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeConfig } from '../types/theme';
import { BaseComponentProps } from '../types/components';
import { useZoomLevel } from '../hooks/useZoom';

interface DragState {
  isDragging: boolean;
  dragIndex: number | null;
  dragOverIndex: number | null;
}

// Theme-specific configurations with stronger translucency
const getThemeConfigs = (isSelected: boolean) => ({
  'professional': {
    background: isSelected
      ? 'linear-gradient(135deg, rgba(226, 232, 240, 1) 0%, rgba(241, 245, 249, 1) 25%, rgba(248, 250, 252, 1) 50%, rgba(241, 245, 249, 1) 75%, rgba(226, 232, 240, 1) 100%)'
      : 'linear-gradient(135deg, rgba(226, 232, 240, 0.6) 0%, rgba(241, 245, 249, 0.6) 25%, rgba(248, 250, 252, 0.6) 50%, rgba(241, 245, 249, 0.6) 75%, rgba(226, 232, 240, 0.6) 100%)',
    hoverBackground: 'linear-gradient(135deg, rgba(226, 232, 240, 1) 0%, rgba(241, 245, 249, 1) 25%, rgba(248, 250, 252, 1) 50%, rgba(241, 245, 249, 1) 75%, rgba(226, 232, 240, 1) 100%)',
    textColor: '#3b82f6',
    borderColor: isSelected ? '#3b82f6' : 'rgba(59, 130, 246, 0.5)'
  },
  'classic-light': {
    background: isSelected ? 'rgba(248, 250, 252, 1)' : 'rgba(248, 250, 252, 0.6)',
    hoverBackground: 'rgba(248, 250, 252, 1)',
    textColor: '#0f172a',
    borderColor: isSelected ? '#f97316' : 'rgba(249, 115, 22, 0.4)'
  },
  'classic-dark': {
    background: isSelected ? 'rgba(38, 38, 38, 1)' : 'rgba(38, 38, 38, 0.7)',
    hoverBackground: 'rgba(38, 38, 38, 1)',
    textColor: '#ffffff',
    borderColor: isSelected ? '#fb923c' : 'rgba(251, 146, 60, 0.4)'
  },
  'bamboo': {
    background: isSelected
      ? 'linear-gradient(45deg, rgba(45, 80, 22, 1) 0%, rgba(146, 183, 113, 1) 25%, rgba(113, 155, 81, 1) 63%, rgba(183, 203, 165, 1) 85%, rgba(123, 160, 95, 1) 100%)'
      : 'linear-gradient(45deg, rgba(45, 80, 22, 0.6) 0%, rgba(146, 183, 113, 0.6) 25%, rgba(113, 155, 81, 0.6) 63%, rgba(183, 203, 165, 0.6) 85%, rgba(123, 160, 95, 0.6) 100%)',
    hoverBackground: 'linear-gradient(45deg, rgba(45, 80, 22, 1) 0%, rgba(146, 183, 113, 1) 25%, rgba(113, 155, 81, 1) 63%, rgba(183, 203, 165, 1) 85%, rgba(123, 160, 95, 1) 100%)',
    textColor: '#2C1704',
    borderColor: isSelected ? '#2C1704' : 'rgba(44, 23, 4, 0.5)'
  },
  'kyoto': {
    background: isSelected
      ? 'linear-gradient(160deg, rgba(122, 61, 26, 1) 0%, rgba(155, 74, 31, 1) 5%, rgba(197, 90, 17, 1) 10%, rgba(217, 119, 6, 1) 15%, rgba(220, 8, 8, 1) 18%, rgba(173, 76, 16, 1) 27%, rgba(107, 68, 35, 1) 35%, rgba(74, 93, 35, 1) 45%, rgba(58, 77, 31, 1) 55%, rgba(42, 61, 26, 1) 60%, rgba(30, 58, 30, 1) 65%, rgba(87, 69, 12, 1) 70%, rgba(7, 59, 27, 1) 80%, rgba(197, 90, 17, 1) 95%, rgba(186, 101, 3, 1) 100%)'
      : 'linear-gradient(160deg, rgba(122, 61, 26, 0.7) 0%, rgba(155, 74, 31, 0.7) 5%, rgba(197, 90, 17, 0.7) 10%, rgba(217, 119, 6, 0.7) 15%, rgba(220, 8, 8, 0.7) 18%, rgba(173, 76, 16, 0.7) 27%, rgba(107, 68, 35, 0.7) 35%, rgba(74, 93, 35, 0.7) 45%, rgba(58, 77, 31, 0.7) 55%, rgba(42, 61, 26, 0.7) 60%, rgba(30, 58, 30, 0.7) 65%, rgba(87, 69, 12, 0.7) 70%, rgba(7, 59, 27, 0.7) 80%, rgba(197, 90, 17, 0.7) 95%, rgba(186, 101, 3, 0.7) 100%)',
    hoverBackground: 'linear-gradient(160deg, rgba(122, 61, 26, 1) 0%, rgba(155, 74, 31, 1) 5%, rgba(197, 90, 17, 1) 10%, rgba(217, 119, 6, 1) 15%, rgba(220, 8, 8, 1) 18%, rgba(173, 76, 16, 1) 27%, rgba(107, 68, 35, 1) 35%, rgba(74, 93, 35, 1) 45%, rgba(58, 77, 31, 1) 55%, rgba(42, 61, 26, 1) 60%, rgba(30, 58, 30, 1) 65%, rgba(87, 69, 12, 1) 70%, rgba(7, 59, 27, 1) 80%, rgba(197, 90, 17, 1) 95%, rgba(186, 101, 3, 1) 100%)',
    textColor: '#E4B5AE',
    borderColor: isSelected ? '#E4B5AE' : 'rgba(228, 181, 174, 0.5)'
  },
  'new-york': {
    background: isSelected
      ? 'linear-gradient(180deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 30%, rgba(69, 26, 3, 1) 100%)'
      : 'linear-gradient(180deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.7) 30%, rgba(69, 26, 3, 0.7) 100%)',
    hoverBackground: 'linear-gradient(180deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 30%, rgba(69, 26, 3, 1) 100%)',
    textColor: '#E9B64B',
    borderColor: isSelected ? '#E9B64B' : 'rgba(233, 182, 75, 0.5)'
  },
  'madripoor': {
    background: isSelected
      ? 'linear-gradient(135deg, rgba(5, 5, 8, 1) 0%, rgba(8, 8, 16, 1) 20%, rgba(15, 15, 24, 1) 40%, rgba(139, 92, 246, 1) 60%, rgba(0, 255, 255, 1) 80%, rgba(15, 15, 24, 1) 100%)'
      : 'linear-gradient(135deg, rgba(5, 5, 8, 0.7) 0%, rgba(8, 8, 16, 0.7) 20%, rgba(15, 15, 24, 0.7) 40%, rgba(139, 92, 246, 0.3) 60%, rgba(0, 255, 255, 0.2) 80%, rgba(15, 15, 24, 0.7) 100%)',
    hoverBackground: 'linear-gradient(135deg, rgba(5, 5, 8, 1) 0%, rgba(8, 8, 16, 1) 20%, rgba(15, 15, 24, 1) 40%, rgba(139, 92, 246, 1) 60%, rgba(0, 255, 255, 1) 80%, rgba(15, 15, 24, 1) 100%)',
    textColor: '#00ffff',
    borderColor: isSelected ? '#ff00ff' : 'rgba(255, 0, 255, 0.6)'
  },
  'caladan': {
    background: isSelected
      ? 'linear-gradient(330deg, rgba(6, 28, 49, 1) 0%, rgba(17, 44, 75, 1) 25%, rgba(26, 53, 96, 1) 63%, rgba(39, 69, 133, 1) 85%, rgba(54, 84, 166, 1) 100%)'
      : 'linear-gradient(330deg, rgba(6, 28, 49, 0.7) 0%, rgba(17, 44, 75, 0.7) 25%, rgba(26, 53, 96, 0.7) 63%, rgba(39, 69, 133, 0.7) 85%, rgba(54, 84, 166, 0.7) 100%)',
    hoverBackground: 'linear-gradient(330deg, rgba(6, 28, 49, 1) 0%, rgba(17, 44, 75, 1) 25%, rgba(26, 53, 96, 1) 63%, rgba(39, 69, 133, 1) 85%, rgba(54, 84, 166, 1) 100%)',
    textColor: '#0ea5e9',
    borderColor: isSelected ? '#0284c7' : 'rgba(2, 132, 199, 0.6)'
  },
  // 'aurora-borealis': { // Temporarily disabled - not ready for production
  //   background: isSelected
  //     ? 'linear-gradient(135deg, rgba(15, 5, 36, 1) 0%, rgba(26, 9, 51, 1) 20%, rgba(30, 55, 153, 1) 40%, rgba(56, 173, 169, 1) 60%, rgba(120, 224, 143, 1) 80%, rgba(184, 233, 148, 1) 100%)'
  //     : 'linear-gradient(135deg, rgba(15, 5, 36, 0.7) 0%, rgba(26, 9, 51, 0.7) 20%, rgba(30, 55, 153, 0.7) 40%, rgba(56, 173, 169, 0.7) 60%, rgba(120, 224, 143, 0.7) 80%, rgba(184, 233, 148, 0.7) 100%)',
  //   hoverBackground: 'linear-gradient(135deg, rgba(15, 5, 36, 1) 0%, rgba(26, 9, 51, 1) 20%, rgba(30, 55, 153, 1) 40%, rgba(56, 173, 169, 1) 60%, rgba(120, 224, 143, 1) 80%, rgba(184, 233, 148, 1) 100%)',
  //   textColor: '#ffffff',
  //   borderColor: isSelected ? '#b8e994' : 'rgba(184, 233, 148, 0.5)'
  // },
  'lothlorien': {
    background: isSelected
      ? 'linear-gradient(330deg, rgba(15, 32, 39, 1) 0%, rgba(21, 46, 54, 1) 25%, rgba(28, 64, 72, 1) 63%, rgba(34, 85, 96, 1) 85%, rgba(44, 106, 120, 1) 100%), radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)'
      : 'linear-gradient(330deg, rgba(15, 32, 39, 0.65) 0%, rgba(21, 46, 54, 0.65) 25%, rgba(28, 64, 72, 0.65) 63%, rgba(34, 85, 96, 0.65) 85%, rgba(44, 106, 120, 0.65) 100%), radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.05) 0%, transparent 50%)',
    hoverBackground: 'linear-gradient(330deg, rgba(15, 32, 39, 1) 0%, rgba(21, 46, 54, 1) 25%, rgba(28, 64, 72, 1) 63%, rgba(34, 85, 96, 1) 85%, rgba(44, 106, 120, 1) 100%), radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
    textColor: '#d1fae5',
    borderColor: isSelected ? '#4ade80' : 'rgba(74, 222, 128, 0.5)'
  },
  'svinafellsjokull': {
    background: isSelected
      ? 'linear-gradient(330deg, rgba(8, 47, 73, 1) 0%, rgba(20, 64, 89, 1) 25%, rgba(34, 87, 122, 1) 63%, rgba(52, 125, 146, 1) 85%, rgba(67, 159, 181, 1) 100%), radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.08) 0%, transparent 50%)'
      : 'linear-gradient(330deg, rgba(8, 47, 73, 0.7) 0%, rgba(20, 64, 89, 0.7) 25%, rgba(34, 87, 122, 0.7) 63%, rgba(52, 125, 146, 0.7) 85%, rgba(67, 159, 181, 0.7) 100%), radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)',
    hoverBackground: 'linear-gradient(330deg, rgba(8, 47, 73, 1) 0%, rgba(20, 64, 89, 1) 25%, rgba(34, 87, 122, 1) 63%, rgba(52, 125, 146, 1) 85%, rgba(67, 159, 181, 1) 100%), radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.08) 0%, transparent 50%)',
    textColor: '#a5f3fc',
    borderColor: isSelected ? '#06b6d4' : 'rgba(6, 182, 212, 0.5)'
  },
});

// Helper function to get theme-specific styling for buttons
const getThemeButtonStyle = (theme: ThemeConfig, isSelected: boolean) => {
  const baseStyle = {
    background: 'white',
    borderWidth: isSelected ? '2px' : '1px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const themeConfigs = getThemeConfigs(isSelected);
  const config = themeConfigs[theme.name as keyof typeof themeConfigs] || themeConfigs['professional'];

  return {
    ...baseStyle,
    background: config.background,
    borderColor: config.borderColor,
    borderWidth: isSelected ? '3px' : '1px', // Thicker border for selected
    boxShadow: isSelected
      ? `0 8px 24px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)` // Enhanced shadow for selected
      : `0 2px 8px rgba(0, 0, 0, 0.1)`,
    filter: isSelected ? 'brightness(1.05) saturate(1.1)' : 'none', // Slight enhancement for selected
    transform: isSelected ? 'translateY(-6px) scale(1.1)' : 'translateY(0px) scale(1)', // Lift and slight scale for selected
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

// Helper function to calculate simple "(" crescent positions
const calculateCrescentPosition = (index: number, totalItems: number) => {
  // Step 1: Refined linear cascade - shifted further left to clear button
  const baseLeftOffset = -180; // Move first card much further left to clear button
  const downwardStep = 50;     // Reduced vertical spacing for tighter cascade
  const maxLeftwardStep = -15; // Maximum leftward drift at the beginning

  // Basic vertical position
  let y = index * downwardStep;

  // Step 2: Pure parabolic crescent - elegant mathematical symmetry (inverted)
  const center = (totalItems - 1) / 2; // True center of cascade (4.5 for 10 items)
  const distanceFromCenter = Math.abs(index - center); // Distance from center (0 to 4.5)
  const maxDistance = center; // Maximum distance from center to edge
  
  // Inverted parabola: edges closest to button, center deepest left
  const parabolicValue = 1 - Math.pow(distanceFromCenter / maxDistance, 2); // 1 at center, 0 at edges
  const maxLeftwardDrift = center * maxLeftwardStep; // Maximum drift at center
  
  let x = baseLeftOffset + (parabolicValue * maxLeftwardDrift);

  // Step 3: Subtle scale variation for depth
  const distanceFromMid = Math.abs(index - (totalItems - 1) / 2);
  const scaleVariation = 1 - (distanceFromMid * 0.008);

  return {
    x,
    y,
    scale: Math.max(0.94, scaleVariation),
    depth: index
  };
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
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Modern zoom detection - works with native zoom on all platforms
  const zoomLevel = useZoomLevel();

  // Update button position on scroll and resize - separated from hover logic
  React.useEffect(() => {
    if (!themesButtonRef.current) return;

    const updatePosition = () => {
      if (themesButtonRef.current) {
        const rect = themesButtonRef.current.getBoundingClientRect();
        setButtonRect(rect);
      }
    };

    // Initial position
    updatePosition();

    // Listen for scroll and resize events (stable listeners like LanguageSettingsDropdown)
    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener('scroll', handleScroll, true); // Use capture to catch all scroll events
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Stable dependencies - no hover state dependency

  // Update position when zoom level changes - now works on all platforms
  React.useEffect(() => {
    if (!themesButtonRef.current) return;

    // Update position when zoom changes - getBoundingClientRect() now returns correct values
    const rect = themesButtonRef.current.getBoundingClientRect();
    setButtonRect(rect);
  }, [zoomLevel]);

  // Reset all card styles when theme changes to prevent stuck hover states
  React.useEffect(() => {
    // Find all theme card buttons and reset their inline styles
    const themeCardButtons = document.querySelectorAll('button[data-theme-card]');
    themeCardButtons.forEach((button) => {
      const htmlButton = button as HTMLButtonElement;
      const themeName = htmlButton.getAttribute('data-theme-card');
      if (themeName) {
        // Find the theme config and restore proper default styles
        const theme = availableThemes.find(t => t.name === themeName);
        if (theme) {
          const defaultStyle = getThemeButtonStyle(theme, currentTheme === theme.name);
          // Restore default styles instead of clearing to empty
          htmlButton.style.background = defaultStyle.background as string;
          htmlButton.style.boxShadow = defaultStyle.boxShadow as string;
          htmlButton.style.transform = defaultStyle.transform as string; // Use the proper transform for selected/unselected
          htmlButton.style.borderColor = defaultStyle.borderColor as string;
          htmlButton.style.filter = defaultStyle.filter as string; // Use the proper filter for selected/unselected
        }
      }
    });
  }, [currentTheme, availableThemes]);

  // Hover management with delay for smooth UX
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Small delay to account for gaps between button and cards
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            // Position the arc origin at the button center
            left: buttonRect.left + buttonRect.width / 2, // Button center X
            top: buttonRect.top + buttonRect.height / 2, // Button center Y (no gap)
            pointerEvents: isHovered ? 'auto' : 'none',
          }}
        >
          <div
            className="relative"
            style={{
              // Container for leftward crescent - origin at button center
              width: '500px',
              height: '500px',
              // No transform needed - cards position relative to button center
            }}
          >
            {availableThemes.map((theme, index) => {
              const isDragOver = dragState.dragOverIndex === index;
              const isDragging = dragState.dragIndex === index;
              const delay = index * 60; // Slightly longer staggered delay for arc effect

              // Calculate gentle crescent position for this card
              const cascadePosition = calculateCrescentPosition(index, availableThemes.length);



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
                    // Position along the leftward crescent - collapse to first card position
                    left: isHovered ? `${cascadePosition.x}px` : '-180px', // Collapse to first card position
                    top: isHovered ? `${cascadePosition.y}px` : '0px', // Collapse to button level
                    transform: isHovered
                      ? `scale(${cascadePosition.scale}) rotateX(0deg)` // Scale for depth
                      : 'scale(0.7) rotateX(-20deg)', // Collapsed at button center
                    transformOrigin: 'center center',
                    transitionDelay: isHovered
                      ? `${delay}ms`
                      : `${(availableThemes.length - index - 1) * 30}ms`,
                    transitionDuration: '400ms',
                    transitionTimingFunction: isHovered
                      ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Bounce out to arc
                      : 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth collapse to center
                    zIndex: availableThemes.length - index,
                  }}
                >
                  <button
                    onClick={() => handleSelectTheme(theme.name, dragState.isDragging)}
                    className="w-52 px-4 py-3 text-left rounded-lg flex items-center gap-3 group transition-all duration-300 border shadow-lg hover:shadow-xl"
                    style={{
                      ...getThemeButtonStyle(theme, currentTheme === theme.name),
                      // Add depth shadow that increases with cascade depth
                      boxShadow: isHovered
                        ? `0 ${6 + cascadePosition.depth * 2}px ${12 + cascadePosition.depth * 3}px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                    data-theme-card={theme.name}
                    onMouseEnter={(e) => {
                      if (currentTheme !== theme.name) {
                        const themeConfigs = getThemeConfigs(false);
                        const config = themeConfigs[theme.name as keyof typeof themeConfigs] || themeConfigs['professional'];
                        // Make opaque on hover with enhanced effects
                        e.currentTarget.style.background = config.hoverBackground;
                        e.currentTarget.style.boxShadow = `0 16px 40px rgba(0, 0, 0, 0.25), 0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)`;
                        e.currentTarget.style.transform = 'translateY(-6px) scale(1.08)';
                        e.currentTarget.style.borderColor = config.borderColor.replace('0.4)', '0.9)').replace('0.5)', '1)');
                        // Add enhanced glow effect for arc positioning
                        e.currentTarget.style.filter = 'brightness(1.15) saturate(1.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentTheme !== theme.name) {
                        const originalStyle = getThemeButtonStyle(theme, false);
                        // Restore translucent state
                        e.currentTarget.style.background = originalStyle.background as string;
                        e.currentTarget.style.boxShadow = isHovered
                          ? `0 ${6 + cascadePosition.depth * 2}px ${12 + cascadePosition.depth * 3}px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                          : '0 2px 8px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                        e.currentTarget.style.borderColor = originalStyle.borderColor as string;
                        e.currentTarget.style.filter = 'none';
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
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
