import { ThemeConfig } from '../../types/theme';
import { getThemeConfigs } from './themeConfigs';
import { PHYSICS_CONFIG, LAYOUT_CONFIG } from './constants';
import { BumpState, CascadePosition, ThemeCardStyle } from './types';

// Helper function to get theme-specific styling for buttons
export const getThemeButtonStyle = (theme: ThemeConfig, isSelected: boolean): ThemeCardStyle => {
  const themeConfigs = getThemeConfigs(isSelected);
  const config = themeConfigs[theme.name as keyof typeof themeConfigs] || themeConfigs['professional'];

  return {
    background: config.background,
    borderColor: config.borderColor,
    borderWidth: isSelected ? '3px' : '1px',
    boxShadow: isSelected
      ? `0 8px 24px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
      : `0 2px 8px rgba(0, 0, 0, 0.1)`,
    filter: isSelected ? 'brightness(1.05) saturate(1.1)' : 'none',
    transform: isSelected ? 'translateY(-6px) scale(1.1)' : 'translateY(0px) scale(1)',
    '--theme-text-color': config.textColor,
    '--theme-dots-color': config.textColor
    // Removed transition to prevent ghost border effects
  };
};

// Simple gap creation - cards just move to make space for the gap
export const calculateBumpOffset = (
  cardIndex: number,
  dragOverIndex: number | null,
  insertionIndex: number | null,
  progress: number = 1
): number => {
  if (insertionIndex === null) return 0;

  // Simple: cards at or after insertion point move down by gap size
  if (cardIndex >= insertionIndex) {
    return PHYSICS_CONFIG.gapSize;
  }
  
  return 0;
};

// Helper function to calculate ripple scaling effects
export const calculateRippleScale = (
  cardIndex: number, 
  rippleCenter: number | null, 
  progress: number = 1
): number => {
  if (rippleCenter === null) return 1;
  
  const distance = Math.abs(cardIndex - rippleCenter);
  const maxDistance = PHYSICS_CONFIG.rippleRadius / 50;
  
  if (distance > maxDistance) return 1;
  
  const rippleIntensity = (1 - distance / maxDistance) * 0.05;
  const wave = Math.sin(progress * Math.PI * 2 - distance * 0.5) * rippleIntensity;
  
  return 1 + wave;
};

// Helper function to calculate enhanced crescent positions with bump physics
export const calculateCrescentPosition = (
  index: number, 
  totalItems: number,
  bumpState?: BumpState
): CascadePosition => {
  const { baseLeftOffset, downwardStep, maxLeftwardStep } = LAYOUT_CONFIG;
  
  let y = index * downwardStep;

  const center = (totalItems - 1) / 2;
  const distanceFromCenter = Math.abs(index - center);
  const maxDistance = center;

  const parabolicValue = 1 - Math.pow(distanceFromCenter / maxDistance, 2);
  const maxLeftwardDrift = center * maxLeftwardStep;

  let x = baseLeftOffset + (parabolicValue * maxLeftwardDrift);

  const distanceFromMid = Math.abs(index - (totalItems - 1) / 2);
  const scaleVariation = 1 - (distanceFromMid * 0.008);

  // Apply bump physics if active
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

// Helper to apply hover effects to theme card
export const applyHoverEffects = (element: HTMLElement, theme: ThemeConfig) => {
  const themeConfigs = getThemeConfigs(false);
  const config = themeConfigs[theme.name as keyof typeof themeConfigs] || themeConfigs['professional'];
  
  // Apply all styles at once to prevent transition conflicts
  Object.assign(element.style, {
    background: config.hoverBackground,
    boxShadow: `0 16px 40px rgba(0, 0, 0, 0.25), 0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
    transform: 'translateY(-6px) scale(1.08)',
    borderColor: config.borderColor.replace('0.4)', '0.9)').replace('0.5)', '1)'),
    filter: 'brightness(1.15) saturate(1.3)',
    transition: 'all 0.2s ease-out' // Controlled transition
  });
};

// Helper to restore default theme card styles
export const restoreDefaultStyles = (element: HTMLElement, theme: ThemeConfig, cascadeDepth: number, isHovered: boolean) => {
  const originalStyle = getThemeButtonStyle(theme, false);
  
  // Apply all styles at once to prevent ghost effects
  Object.assign(element.style, {
    background: originalStyle.background,
    boxShadow: isHovered
      ? `0 ${6 + cascadeDepth * 2}px ${12 + cascadeDepth * 3}px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(0px) scale(1)',
    borderColor: originalStyle.borderColor,
    filter: 'none',
    transition: 'all 0.2s ease-in-out' // Controlled transition
  });
};

