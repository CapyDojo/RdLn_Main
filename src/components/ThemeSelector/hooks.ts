import { useState, useRef, useEffect, useCallback } from 'react';
import { DragState, BumpState } from './types';
import { PHYSICS_CONFIG, ANIMATION_CONFIG } from './constants';
import { calculateBumpOffset } from './utils';

// Custom hook for managing hover state with delays
export const useHoverState = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [recentlyDragged, setRecentlyDragged] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragCooldownRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Use longer delay if we recently finished a drag operation
    const delay = recentlyDragged ? ANIMATION_CONFIG.postDragDelay : ANIMATION_CONFIG.hoverDelay;
    
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, delay);
  }, [recentlyDragged]);

  // Function to call when drag operation completes
  const onDragComplete = useCallback(() => {
    setRecentlyDragged(true);
    
    // Clear the "recently dragged" state after the post-drag delay
    if (dragCooldownRef.current) {
      clearTimeout(dragCooldownRef.current);
    }
    dragCooldownRef.current = setTimeout(() => {
      setRecentlyDragged(false);
    }, ANIMATION_CONFIG.postDragDelay);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (dragCooldownRef.current) {
        clearTimeout(dragCooldownRef.current);
      }
    };
  }, []);

  return { isHovered, handleMouseEnter, handleMouseLeave, onDragComplete };
};

// Enhanced drag and drop state management with smoother interactions
export const useDragState = () => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragIndex: null,
    dragOverIndex: null
  });
  const dragStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    
    // Add drag image customization for better visual feedback
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg) scale(1.05)';
    dragImage.style.opacity = '0.9';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 100, 30);
    
    // Clean up drag image after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);

    // Small delay before activating physics for smoother start
    dragStartTimeoutRef.current = setTimeout(() => {
      setDragState({
        isDragging: true,
        dragIndex: index,
        dragOverIndex: null
      });
    }, ANIMATION_CONFIG.dragStartDelay);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Enhanced drop zone detection with magnetic snapping
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY;
    const cardCenter = rect.top + rect.height / 2;
    const threshold = PHYSICS_CONFIG.magneticThreshold;

    // Only update if we're within the magnetic threshold or crossing card boundaries
    const isInMagneticZone = Math.abs(mouseY - cardCenter) < threshold;
    
    setDragState(prev => {
      if (prev.dragIndex !== index && (isInMagneticZone || prev.dragOverIndex !== index)) {
        return { ...prev, dragOverIndex: index };
      }
      return prev;
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    // Clear any pending drag start
    if (dragStartTimeoutRef.current) {
      clearTimeout(dragStartTimeoutRef.current);
      dragStartTimeoutRef.current = null;
    }

    setDragState({
      isDragging: false,
      dragIndex: null,
      dragOverIndex: null
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragStartTimeoutRef.current) {
        clearTimeout(dragStartTimeoutRef.current);
      }
    };
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  };
};

// Custom hook for managing bump physics
export const useBumpPhysics = (availableThemes: any[]) => {
  const [bumpState, setBumpState] = useState<BumpState>({
    displacements: new Map(),
    insertionIndex: null,
    rippleCenter: null
  });
  const physicsUpdateRef = useRef<NodeJS.Timeout | null>(null);

  const updateBumpPhysics = useCallback((dragOverIndex: number | null, dragIndex: number | null) => {
    if (dragOverIndex === null || dragIndex === null) {
      setBumpState({
        displacements: new Map(),
        insertionIndex: null,
        rippleCenter: null
      });
      return;
    }

    // Simple insertion logic
    let insertionIndex = dragOverIndex;
    if (dragIndex !== null && dragIndex < dragOverIndex) {
      insertionIndex = dragOverIndex;
    }
    
    // Calculate simple displacements
    const newDisplacements = new Map<number, number>();
    availableThemes.forEach((_, index) => {
      if (index === dragIndex) return;
      
      const displacement = calculateBumpOffset(index, dragOverIndex, insertionIndex, 1);
      if (displacement > 0) {
        newDisplacements.set(index, displacement);
      }
    });

    setBumpState({
      displacements: newDisplacements,
      insertionIndex,
      rippleCenter: null
    });
  }, [availableThemes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (physicsUpdateRef.current) {
        clearTimeout(physicsUpdateRef.current);
      }
    };
  }, []);

  return { bumpState, updateBumpPhysics, setBumpState };
};

// Custom hook for keyboard navigation
export const useKeyboardNavigation = (
  isHovered: boolean,
  availableThemes: any[],
  setTheme: (theme: string) => void,
  setIsHovered: (hovered: boolean) => void
) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovered) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => prev < availableThemes.length - 1 ? prev + 1 : 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : availableThemes.length - 1);
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
  }, [isHovered, selectedIndex, availableThemes, setTheme, setIsHovered]);

  // Reset keyboard selection when cascade opens/closes
  useEffect(() => {
    if (!isHovered) {
      setSelectedIndex(-1);
    }
  }, [isHovered]);

  return { selectedIndex, setSelectedIndex };
};