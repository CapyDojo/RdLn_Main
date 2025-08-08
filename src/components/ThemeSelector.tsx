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

interface BumpState {
  displacements: Map<number, number>; // card index -> displacement amount
  insertionIndex: number | null; // where the insertion preview should appear
  rippleCenter: number | null; // center point for ripple effects
}

// Theme-specific configurations with stronger translucency
const getThemeConfigs = (isSelected: boolean) => ({
  'professional': {
    background: 'linear-gradient(135deg, rgba(226, 232, 240, 1) 0%, rgba(241, 245, 249, 1) 25%, rgba(248, 250, 252, 1) 50%, rgba(241, 245, 249, 1) 75%, rgba(226, 232, 240, 1) 100%)',
    hoverBackground: 'linear-gradient(135deg, rgba(226, 232, 240, 1) 0%, rgba(241, 245, 249, 1) 25%, rgba(248, 250, 252, 1) 50%, rgba(241, 245, 249, 1) 75%, rgba(226, 232, 240, 1) 100%)',
    textColor: '#3b82f6',
    borderColor: isSelected ? '#3b82f6' : 'rgba(59, 130, 246, 0.5)'
  },
  'classic-light': {
    background: 'rgba(248, 250, 252, 1)',
    hoverBackground: 'rgba(248, 250, 252, 1)',
    textColor: '#0f172a',
    borderColor: isSelected ? '#f97316' : 'rgba(249, 115, 22, 0.4)'
  },
  'classic-dark': {
    background: 'rgba(38, 38, 38, 1)',
    hoverBackground: 'rgba(38, 38, 38, 1)',
    textColor: '#ffffff',
    borderColor: isSelected ? '#fb923c' : 'rgba(251, 146, 60, 0.4)'
  },
  'bamboo': {
    background: 'linear-gradient(45deg, rgba(45, 80, 22, 1) 0%, rgba(146, 183, 113, 1) 25%, rgba(113, 155, 81, 1) 63%, rgba(183, 203, 165, 1) 85%, rgba(123, 160, 95, 1) 100%)',
    hoverBackground: 'linear-gradient(45deg, rgba(45, 80, 22, 1) 0%, rgba(146, 183, 113, 1) 25%, rgba(113, 155, 81, 1) 63%, rgba(183, 203, 165, 1) 85%, rgba(123, 160, 95, 1) 100%)',
    textColor: '#2C1704',
    borderColor: isSelected ? '#2C1704' : 'rgba(44, 23, 4, 0.5)'
  },
  'kyoto': {
    background: 'linear-gradient(160deg, rgba(122, 61, 26, 1) 0%, rgba(155, 74, 31, 1) 5%, rgba(197, 90, 17, 1) 10%, rgba(217, 119, 6, 1) 15%, rgba(220, 8, 8, 1) 18%, rgba(173, 76, 16, 1) 27%, rgba(107, 68, 35, 1) 35%, rgba(74, 93, 35, 1) 45%, rgba(58, 77, 31, 1) 55%, rgba(42, 61, 26, 1) 60%, rgba(30, 58, 30, 1) 65%, rgba(87, 69, 12, 1) 70%, rgba(7, 59, 27, 1) 80%, rgba(197, 90, 17, 1) 95%, rgba(186, 101, 3, 1) 100%)',
    hoverBackground: 'linear-gradient(160deg, rgba(122, 61, 26, 1) 0%, rgba(155, 74, 31, 1) 5%, rgba(197, 90, 17, 1) 10%, rgba(217, 119, 6, 1) 15%, rgba(220, 8, 8, 1) 18%, rgba(173, 76, 16, 1) 27%, rgba(107, 68, 35, 1) 35%, rgba(74, 93, 35, 1) 45%, rgba(58, 77, 31, 1) 55%, rgba(42, 61, 26, 1) 60%, rgba(30, 58, 30, 1) 65%, rgba(87, 69, 12, 1) 70%, rgba(7, 59, 27, 1) 80%, rgba(197, 90, 17, 1) 95%, rgba(186, 101, 3, 1) 100%)',
    textColor: '#E4B5AE',
    borderColor: isSelected ? '#E4B5AE' : 'rgba(228, 181, 174, 0.5)'
  },
  'new-york': {
    background: 'linear-gradient(180deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 30%, rgba(69, 26, 3, 1) 100%)',
    hoverBackground: 'linear-gradient(180deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 30%, rgba(69, 26, 3, 1) 100%)',
    textColor: '#E9B64B',
    borderColor: isSelected ? '#E9B64B' : 'rgba(233, 182, 75, 0.5)'
  },
  'madripoor': {
    background: 'linear-gradient(135deg, rgba(5, 5, 8, 1) 0%, rgba(8, 8, 16, 1) 20%, rgba(15, 15, 24, 1) 40%, rgba(139, 92, 246, 1) 60%, rgba(0, 255, 255, 1) 80%, rgba(15, 15, 24, 1) 100%)',
    hoverBackground: 'linear-gradient(135deg, rgba(5, 5, 8, 1) 0%, rgba(8, 8, 16, 1) 20%, rgba(15, 15, 24, 1) 40%, rgba(139, 92, 246, 1) 60%, rgba(0, 255, 255, 1) 80%, rgba(15, 15, 24, 1) 100%)',
    textColor: '#00ffff',
    borderColor: isSelected ? '#ff00ff' : 'rgba(255, 0, 255, 0.6)'
  },
  'caladan': {
    background: 'linear-gradient(330deg, rgba(6, 28, 49, 1) 0%, rgba(17, 44, 75, 1) 25%, rgba(26, 53, 96, 1) 63%, rgba(39, 69, 133, 1) 85%, rgba(54, 84, 166, 1) 100%)',
    hoverBackground: 'linear-gradient(330deg, rgba(6, 28, 49, 1) 0%, rgba(17, 44, 75, 1) 25%, rgba(26, 53, 96, 1) 63%, rgba(39, 69, 133, 1) 85%, rgba(54, 84, 166, 1) 100%)',
    textColor: '#0ea5e9',
    borderColor: isSelected ? '#0284c7' : 'rgba(2, 132, 199, 0.6)'
  },
  // 'aurora-borealis': { // Temporarily disabled - not ready for production
  //   background: 'linear-gradient(135deg, rgba(15, 5, 36, 1) 0%, rgba(26, 9, 51, 1) 20%, rgba(30, 55, 153, 1) 40%, rgba(56, 173, 169, 1) 60%, rgba(120, 224, 143, 1) 80%, rgba(184, 233, 148, 1) 100%)',
  //   hoverBackground: 'linear-gradient(135deg, rgba(15, 5, 36, 1) 0%, rgba(26, 9, 51, 1) 20%, rgba(30, 55, 153, 1) 40%, rgba(56, 173, 169, 1) 60%, rgba(120, 224, 143, 1) 80%, rgba(184, 233, 148, 1) 100%)',
  //   textColor: '#ffffff',
  //   borderColor: isSelected ? '#b8e994' : 'rgba(184, 233, 148, 0.5)'
  // },
  'lothlorien': {
    background: 'linear-gradient(330deg, rgba(15, 32, 39, 1) 0%, rgba(21, 46, 54, 1) 25%, rgba(28, 64, 72, 1) 63%, rgba(34, 85, 96, 1) 85%, rgba(44, 106, 120, 1) 100%), radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
    hoverBackground: 'linear-gradient(330deg, rgba(15, 32, 39, 1) 0%, rgba(21, 46, 54, 1) 25%, rgba(28, 64, 72, 1) 63%, rgba(34, 85, 96, 1) 85%, rgba(44, 106, 120, 1) 100%), radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
    textColor: '#d1fae5',
    borderColor: isSelected ? '#4ade80' : 'rgba(74, 222, 128, 0.5)'
  },
  'svinafellsjokull': {
    background: 'linear-gradient(330deg, rgba(8, 47, 73, 1) 0%, rgba(20, 64, 89, 1) 25%, rgba(34, 87, 122, 1) 63%, rgba(52, 125, 146, 1) 85%, rgba(67, 159, 181, 1) 100%), radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.08) 0%, transparent 50%)',
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

// Spring physics configuration optimized for Electron
const PHYSICS_CONFIG = {
  springTension: 120,
  springFriction: 8,
  rippleRadius: 40,
  maxDisplacement: 25, // Reduced from 60 - more subtle
  insertionSpacing: 45,
  magneticThreshold: 15, // Reduced from 20
  performanceMode: true, // Enable performance optimizations for Electron
  maxFPS: 60 // Target frame rate
};

// Helper function to calculate spring-based displacement
const calculateBumpOffset = (
  cardIndex: number,
  dragOverIndex: number | null,
  insertionIndex: number | null,
  progress: number = 1
): number => {
  if (dragOverIndex === null && insertionIndex === null) return 0;

  const targetIndex = insertionIndex ?? dragOverIndex;
  if (targetIndex === null) return 0;

  // Calculate displacement direction and magnitude
  const distance = Math.abs(cardIndex - targetIndex);
  if (distance > 3) return 0; // Only affect nearby cards
  
  const direction = cardIndex < targetIndex ? -1 : 1; // Cards above move up, below move down
  
  // Simpler linear falloff instead of exponential
  const falloff = Math.max(0, 1 - distance * 0.4);
  const baseDisplacement = PHYSICS_CONFIG.maxDisplacement * falloff;
  
  // Simplified easing - no overshoot
  return direction * baseDisplacement * progress;
};

// Helper function to calculate ripple scaling effects
const calculateRippleScale = (
  cardIndex: number, 
  rippleCenter: number | null, 
  progress: number = 1
): number => {
  if (rippleCenter === null) return 1;
  
  const distance = Math.abs(cardIndex - rippleCenter);
  const maxDistance = PHYSICS_CONFIG.rippleRadius / 50; // Convert to card units
  
  if (distance > maxDistance) return 1;
  
  // Subtle scaling ripple (5% max change)
  const rippleIntensity = (1 - distance / maxDistance) * 0.05;
  const wave = Math.sin(progress * Math.PI * 2 - distance * 0.5) * rippleIntensity;
  
  return 1 + wave;
};

// Helper function to calculate enhanced crescent positions with bump physics
const calculateCrescentPosition = (
  index: number, 
  totalItems: number,
  bumpState?: BumpState,
  dragOverIndex?: number | null
) => {
  // Step 1: Base parabolic positioning (unchanged)
  const baseLeftOffset = -10;
  const downwardStep = 50;
  const maxLeftwardStep = -15;

  let y = index * downwardStep;

  const center = (totalItems - 1) / 2;
  const distanceFromCenter = Math.abs(index - center);
  const maxDistance = center;

  const parabolicValue = 1 - Math.pow(distanceFromCenter / maxDistance, 2);
  const maxLeftwardDrift = center * maxLeftwardStep;

  let x = baseLeftOffset + (parabolicValue * maxLeftwardDrift);

  const distanceFromMid = Math.abs(index - (totalItems - 1) / 2);
  const scaleVariation = 1 - (distanceFromMid * 0.008);

  // Step 2: Apply bump physics if active
  let bumpOffset = 0;
  let rippleScale = 1;

  if (bumpState) {
    bumpOffset = bumpState.displacements.get(index) || 0;
    rippleScale = calculateRippleScale(index, bumpState.rippleCenter);
  }

  return {
    x,
    y: y + bumpOffset,
    scale: Math.max(0.94, scaleVariation * rippleScale),
    depth: index,
    bumpOffset,
    rippleScale
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
  const [bumpState, setBumpState] = useState<BumpState>({
    displacements: new Map(),
    insertionIndex: null,
    rippleCenter: null
  });
  const [selectedIndex, setSelectedIndex] = useState<number>(-1); // -1 means no keyboard selection
  const themesButtonRef = React.useRef<HTMLDivElement>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const physicsUpdateRef = React.useRef<NodeJS.Timeout | null>(null);



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

    // Initial position with layout settling delay
    const initializePosition = () => {
      // Use requestAnimationFrame to ensure layout is complete
      requestAnimationFrame(() => {
        // Double RAF to ensure all layout calculations are done
        requestAnimationFrame(() => {
          updatePosition();
        });
      });
    };

    // Initialize position after layout settles
    initializePosition();

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

    // Update position when zoom changes with layout settling
    requestAnimationFrame(() => {
      if (themesButtonRef.current) {
        const rect = themesButtonRef.current.getBoundingClientRect();
        setButtonRect(rect);
      }
    });
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
    // Longer delay to prevent accidental collapse when moving between elements
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovered) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev < availableThemes.length - 1 ? prev + 1 : 0;
            return newIndex;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev > 0 ? prev - 1 : availableThemes.length - 1;
            return newIndex;
          });
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < availableThemes.length) {
            setTheme(availableThemes[selectedIndex].name);
            setIsHovered(false);
            setSelectedIndex(-1);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsHovered(false);
          setSelectedIndex(-1);
          break;
      }
    };

    if (isHovered) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHovered, selectedIndex, availableThemes, setTheme]);

  // Reset keyboard selection when cascade opens/closes
  React.useEffect(() => {
    if (!isHovered) {
      setSelectedIndex(-1);
    }
  }, [isHovered]);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (physicsUpdateRef.current) {
        clearTimeout(physicsUpdateRef.current);
      }
    };
  }, []);

  // Calculate bump physics displacements with performance throttling
  const updateBumpPhysics = React.useCallback((dragOverIndex: number | null, dragIndex: number | null) => {
    // Clear any pending physics update
    if (physicsUpdateRef.current) {
      clearTimeout(physicsUpdateRef.current);
    }

    // Throttle physics updates for 60fps performance
    physicsUpdateRef.current = setTimeout(() => {
      if (dragOverIndex === null || dragIndex === null) {
        setBumpState({
          displacements: new Map(),
          insertionIndex: null,
          rippleCenter: null
        });
        return;
      }

      const newDisplacements = new Map<number, number>();
      
      // Calculate proper insertion point: where the gap should appear
      // If dragging from below to above, insert at dragOverIndex
      // If dragging from above to below, insert at dragOverIndex + 1
      let insertionIndex = dragOverIndex;
      if (dragIndex !== null && dragIndex < dragOverIndex) {
        insertionIndex = dragOverIndex; // Inserting at this position pushes others down
      } else if (dragIndex !== null && dragIndex > dragOverIndex) {
        insertionIndex = dragOverIndex; // Inserting here, others move up
      }
      
      // Calculate displacements for all cards
      availableThemes.forEach((_, index) => {
        if (index === dragIndex) return; // Skip the dragged card
        
        const displacement = calculateBumpOffset(
          index, 
          dragOverIndex, 
          insertionIndex,
          1 // Full displacement for now - could animate this for smoother motion
        );
        
        if (Math.abs(displacement) > 0.1) { // Only store significant displacements
          newDisplacements.set(index, displacement);
        }
      });

      setBumpState({
        displacements: newDisplacements,
        insertionIndex,
        rippleCenter: dragOverIndex
      });
    }, PHYSICS_CONFIG.performanceMode ? 16 : 0); // ~60fps throttling when performance mode enabled
  }, [availableThemes]);

  // Update bump physics when drag state changes
  React.useEffect(() => {
    updateBumpPhysics(dragState.dragOverIndex, dragState.dragIndex);
  }, [dragState.dragOverIndex, dragState.dragIndex, updateBumpPhysics]);

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

  const handleDragLeave = (e: React.DragEvent) => {
    // Reset magnetic attraction effects
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.filter = '';
  };

  const handleDragEnd = () => {
    // Clear bump physics state
    setBumpState({
      displacements: new Map(),
      insertionIndex: null,
      rippleCenter: null
    });

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
        title="Hover to see themes (or press arrow keys when open)"
        aria-label="Theme selector - hover to view available themes, use arrow keys to navigate"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        tabIndex={0}
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
          style={{
            // Position at button center as origin point
            left: buttonRect.left + buttonRect.width / 2,
            top: buttonRect.top + buttonRect.height / 2,
            pointerEvents: 'none', // Let individual cards handle their own events
          }}
        >


          {/* Invisible drop zones for gaps created by bump physics */}
          {dragState.isDragging && availableThemes.map((_, index) => {
            const displacement = bumpState.displacements.get(index) || 0;
            if (Math.abs(displacement) < 5) return null; // Only create drop zones for significantly displaced cards
            
            const basePosition = calculateCrescentPosition(index, availableThemes.length);
            
            return (
              <div
                key={`drop-zone-${index}`}
                className="absolute pointer-events-auto"
                style={{
                  left: `${basePosition.x - 208}px`,
                  top: `${basePosition.y}px`,
                  width: '208px',
                  height: '60px',
                  zIndex: 500, // Below cards but above background
                  // Debug: uncomment to see drop zones
                  // background: 'rgba(255, 0, 0, 0.1)',
                  // border: '1px solid red'
                }}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
              />
            );
          })}

          {availableThemes.map((theme, index) => {
            const isDragOver = dragState.dragOverIndex === index;
            const isDragging = dragState.dragIndex === index;
            const delay = index * 60; // Slightly longer staggered delay for arc effect

            // Calculate enhanced crescent position with bump physics
            const cascadePosition = calculateCrescentPosition(index, availableThemes.length, bumpState, dragState.dragOverIndex);



            return (
              <div
                key={theme.name}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`
                    absolute will-change-transform
                    ${isDragOver ? 'scale-105' : ''}
                    ${isDragging ? 'opacity-50 scale-95' : ''}
                    ${selectedIndex === index ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
                    ${isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                  `}
                style={{
                  // Position cards so their RIGHT EDGE aligns with cascade position
                  left: isHovered
                    ? `${cascadePosition.x - 208}px` // Card position minus card width (208px) so right edge aligns with cascade position
                    : `${0 - 208}px`, // Right edge aligns with button center when collapsed
                  top: isHovered ? `${cascadePosition.y}px` : '0px', // Relative to button center
                  transform: isHovered
                    ? `translateY(0px) scale(${cascadePosition.scale})` // Clean transform
                    : 'translateY(0px) scale(0.7) rotateX(-20deg)', // Collapsed at button center
                  transformOrigin: 'center center',
                  transitionDelay: isHovered
                    ? `${delay}ms`
                    : `${(availableThemes.length - index - 1) * 30}ms`,
                  transitionDuration: dragState.isDragging
                    ? '150ms' // Faster transitions for bump physics
                    : '300ms', // Slightly faster overall
                  transitionTimingFunction: dragState.isDragging
                    ? 'ease-out' // Simple, smooth easing for bumps
                    : isHovered
                    ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Bounce out to arc
                    : 'ease-in-out', // Simple collapse
                  transitionProperty: 'transform, opacity, left, top',
                  zIndex: dragState.isDragging && dragState.dragIndex === index
                    ? 1000 // Dragged card always on top
                    : availableThemes.length - index + (cascadePosition.bumpOffset !== 0 ? 10 : 0), // Bumped cards slightly higher
                }}
              >
                <button
                  onClick={() => handleSelectTheme(theme.name, dragState.isDragging)}
                  tabIndex={-1}
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
                    // Set keyboard selection index
                    setSelectedIndex(index);
                    
                    // Apply hover effects for non-selected themes
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
        </div>,
        document.body
      )}
    </div>
  );
};
