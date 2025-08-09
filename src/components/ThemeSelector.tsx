import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Check, ChevronDown, GripVertical } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BaseComponentProps } from '../types/components';
import { useZoomLevel } from '../hooks/useZoom';
import { useHoverState, useDragState, useBumpPhysics, useKeyboardNavigation } from './ThemeSelector/hooks';
import { getThemeButtonStyle, calculateCrescentPosition, applyHoverEffects, restoreDefaultStyles } from './ThemeSelector/utils';
import { LAYOUT_CONFIG, ANIMATION_CONFIG, PHYSICS_CONFIG } from './ThemeSelector/constants';

// Component now uses modular architecture with separated concerns

export const ThemeSelector: React.FC<BaseComponentProps> = ({ style, className }) => {
  const { currentTheme, setTheme, availableThemes, reorderThemes } = useTheme();
  const themesButtonRef = useRef<HTMLDivElement>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const zoomLevel = useZoomLevel();

  // Custom hooks for separated concerns
  const { isHovered, handleMouseEnter, handleMouseLeave, onDragComplete } = useHoverState();
  const { dragState, handleDragStart, handleDragOver, handleDragEnd } = useDragState();
  const { bumpState, updateBumpPhysics, setBumpState } = useBumpPhysics(availableThemes);
  const { selectedIndex, setSelectedIndex } = useKeyboardNavigation(isHovered, availableThemes, setTheme, (hovered) => {
    if (!hovered) {
      handleMouseLeave();
    }
  });

  // Update button position for portal positioning
  useEffect(() => {
    if (!themesButtonRef.current) return;

    const updatePosition = () => {
      if (themesButtonRef.current) {
        const rect = themesButtonRef.current.getBoundingClientRect();
        setButtonRect(rect);
      }
    };

    const initializePosition = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updatePosition();
        });
      });
    };

    initializePosition();

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update position when zoom level changes
  useEffect(() => {
    if (!themesButtonRef.current) return;
    requestAnimationFrame(() => {
      if (themesButtonRef.current) {
        const rect = themesButtonRef.current.getBoundingClientRect();
        setButtonRect(rect);
      }
    });
  }, [zoomLevel]);

  // Reset card styles when theme changes to prevent stuck hover states
  useEffect(() => {
    const themeCardButtons = document.querySelectorAll('button[data-theme-card]');
    themeCardButtons.forEach((button) => {
      const htmlButton = button as HTMLButtonElement;
      const themeName = htmlButton.getAttribute('data-theme-card');
      if (themeName) {
        const theme = availableThemes.find(t => t.name === themeName);
        if (theme) {
          const defaultStyle = getThemeButtonStyle(theme, currentTheme === theme.name);
          Object.assign(htmlButton.style, defaultStyle);
        }
      }
    });
  }, [currentTheme, availableThemes]);

  // Update bump physics when drag state changes
  useEffect(() => {
    updateBumpPhysics(dragState.dragOverIndex, dragState.dragIndex);
  }, [dragState.dragOverIndex, dragState.dragIndex, updateBumpPhysics]);

  // Event handlers
  const handleSelectTheme = (themeName: string, isDragEvent = false) => {
    if (!isDragEvent) {
      setTheme(themeName);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.filter = '';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragState.dragIndex !== null && dragState.dragIndex !== dropIndex) {
      reorderThemes(dragState.dragIndex, dropIndex);
    }
    setBumpState({
      displacements: new Map(),
      insertionIndex: null,
      rippleCenter: null
    });
    handleDragEnd();
    onDragComplete(); // Use longer delay after drag operations
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
          width: `${LAYOUT_CONFIG.buttonSize}px`,
          height: `${LAYOUT_CONFIG.buttonSize}px`,
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
          {/* Simple gap indicators */}
          {dragState.isDragging && bumpState.insertionIndex !== null && (
            <div
              key="insertion-gap"
              className="absolute pointer-events-auto"
              style={{
                left: `${calculateCrescentPosition(bumpState.insertionIndex, availableThemes.length).x - LAYOUT_CONFIG.cardWidth}px`,
                top: `${calculateCrescentPosition(bumpState.insertionIndex, availableThemes.length).y - 6}px`, // Shift down into the gap
                width: `${LAYOUT_CONFIG.cardWidth - 6}px`,
                height: `${PHYSICS_CONFIG.gapSize + 6}px`, // Slightly taller
                zIndex: 500,
                background: `rgba(59, 130, 246, ${PHYSICS_CONFIG.previewOpacity})`,
                borderRadius: '8px',
                border: '2px dashed rgba(59, 130, 246, 0.6)',
              }}
              onDragOver={(e) => handleDragOver(e, bumpState.insertionIndex!)}
              onDrop={(e) => handleDrop(e, bumpState.insertionIndex!)}
            />
          )}

          {availableThemes.map((theme, index) => {
            const isDragOver = dragState.dragOverIndex === index;
            const isDragging = dragState.dragIndex === index;
            const delay = index * ANIMATION_CONFIG.cascadeStagger;
            const cascadePosition = calculateCrescentPosition(index, availableThemes.length, bumpState);

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
                    absolute will-change-transform transition-all duration-150
                    ${isDragging ? 'opacity-80 z-50' : ''}
                    ${isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                  `}
                style={{
                  left: isHovered
                    ? `${cascadePosition.x - LAYOUT_CONFIG.cardWidth}px`
                    : `${0 - LAYOUT_CONFIG.cardWidth}px`,
                  top: isHovered ? `${cascadePosition.y}px` : '0px',
                  transform: isHovered
                    ? `translateY(0px) scale(${cascadePosition.scale})`
                    : 'translateY(0px) scale(0.7) rotateX(-20deg)',
                  transformOrigin: 'center center',
                  transitionDelay: isHovered
                    ? `${delay}ms`
                    : `${(availableThemes.length - index - 1) * ANIMATION_CONFIG.collapseStagger}ms`,
                  transitionDuration: dragState.isDragging
                    ? `${ANIMATION_CONFIG.dragTransition}ms`
                    : `${ANIMATION_CONFIG.normalTransition}ms`,
                  transitionTimingFunction: dragState.isDragging
                    ? 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // Smoother easing for drag
                    : isHovered
                      ? 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                      : 'ease-in-out',
                  transitionProperty: 'transform, opacity, left, top',
                  zIndex: dragState.isDragging && dragState.dragIndex === index
                    ? 1000
                    : availableThemes.length - index + (cascadePosition.bumpOffset !== 0 ? 10 : 0),
                }}
              >
                <button
                  onClick={() => handleSelectTheme(theme.name, dragState.isDragging)}
                  tabIndex={-1}
                  className="w-52 px-4 py-3 text-left rounded-lg flex items-center gap-3 group border shadow-lg"
                  style={{
                    ...getThemeButtonStyle(theme, currentTheme === theme.name),
                    // Add depth shadow that increases with cascade depth
                    boxShadow: isHovered
                      ? `0 ${6 + cascadePosition.depth * 2}px ${12 + cascadePosition.depth * 3}px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    // Ensure no conflicting transitions
                    transition: 'none' // Let our hover effects handle transitions
                  }}
                  data-theme-card={theme.name}
                  onMouseEnter={(e) => {
                    setSelectedIndex(index);
                    if (currentTheme !== theme.name) {
                      applyHoverEffects(e.currentTarget, theme);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentTheme !== theme.name) {
                      restoreDefaultStyles(e.currentTarget, theme, cascadePosition.depth, isHovered);
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
