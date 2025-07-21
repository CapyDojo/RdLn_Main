/**
 * CSS Variable generation utilities for theme application
 */

import { ThemeConfig } from '../../types/theme';
import { hexToRgb, hexToRgba } from './colors';

/**
 * Generate CSS color variables from theme configuration
 */
export const generateColorVariables = (themeConfig: ThemeConfig): Array<[string, string]> => {
  const cssVariables: Array<[string, string]> = [];
  
  Object.entries(themeConfig.colors).forEach(([colorGroup, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      const rgbValue = hexToRgb(value);
      
      // Batch the CSS variable assignments
      cssVariables.push([`--color-${colorGroup}-${shade}`, rgbValue]);
      cssVariables.push([`--color-${colorGroup}-${shade}-rgb`, rgbValue]);
    });
  });

  // Add optimized button variables for fast theme switching
  const buttonVariables = generateButtonVariables(themeConfig);
  cssVariables.push(...buttonVariables);
  
  return cssVariables;
};

// Generate optimized button CSS variables for each theme
const generateButtonVariables = (themeConfig: ThemeConfig): Array<[string, string]> => {
  const themeName = themeConfig.name;
  const variables: Array<[string, string]> = [];
  
  // Define button color mappings per theme for optimal contrast
  const buttonMappings = {
    'professional': {
      primary: { bg: '#1e40af', border: '#1d4ed8', text: '#ffffff', hover: '#1e3a8a' },
      accent: { bg: '#dc2626', border: '#b91c1c', text: '#ffffff', hover: '#b91c1c' },
      neutral: { bg: '#374151', border: '#4b5563', text: '#ffffff', hover: '#1f2937' },
      light: { bg: '#e2e8f0', border: '#cbd5e1', text: '#1e293b', hover: '#cbd5e1', hoverText: '#0f172a' },
      light2: { bg: '#cbd5e1', border: '#94a3b8', text: '#1e293b' }
    },
    'bamboo': {
      primary: { bg: '#1f2937', border: '#374151', text: '#fafafa', hover: '#111827' },
      accent: { bg: '#1f2937', border: '#374151', text: '#fafafa', hover: '#111827' },
      neutral: { bg: '#1f2937', border: '#374151', text: '#fafafa', hover: '#111827' },
      light: { bg: '#f4f4f5', border: '#e4e4e7', text: '#1f2937', hover: '#e4e4e7', hoverText: '#111827' },
      light2: { bg: '#e4e4e7', border: '#d4d4d8', text: '#1f2937' }
    },
    'apple-dark': {
      primary: { bg: '#3b82f6', border: '#60a5fa', text: '#ffffff', hover: '#3b82f6' },
      accent: { bg: '#dc2626', border: '#ef4444', text: '#ffffff', hover: '#dc2626' },
      neutral: { bg: '#4b5563', border: '#6b7280', text: '#ffffff', hover: '#374151' },
      light: { bg: '#374151', border: '#4b5563', text: '#f9fafb', hover: '#4b5563', hoverText: '#ffffff' },
      light2: { bg: '#4b5563', border: '#6b7280', text: '#f9fafb' }
    },
    'kyoto': {
      primary: { bg: '#0f172a', border: '#1e293b', text: '#ffffff', hover: '#000000' },
      accent: { bg: '#7f1d1d', border: '#991b1b', text: '#ffffff', hover: '#7f1d1d' },
      neutral: { bg: '#0f172a', border: '#1e293b', text: '#ffffff', hover: '#000000' },
      light: { bg: '#44403c', border: '#57534e', text: '#fef7e6', hover: '#57534e', hoverText: '#ffffff' },
      light2: { bg: '#57534e', border: '#78716c', text: '#fef7e6' }
    },
    'new-york': {
      primary: { bg: '#1e40af', border: '#1d4ed8', text: '#ffffff', hover: '#1e3a8a' },
      accent: { bg: '#dc2626', border: '#b91c1c', text: '#ffffff', hover: '#b91c1c' },
      neutral: { bg: '#374151', border: '#4b5563', text: '#ffffff', hover: '#1f2937' },
      light: { bg: '#374151', border: '#4b5563', text: '#f9fafb', hover: '#4b5563', hoverText: '#ffffff' },
      light2: { bg: '#4b5563', border: '#6b7280', text: '#f9fafb' }
    },
    'autumn': {
      primary: { bg: '#0f172a', border: '#1e293b', text: '#ffffff', hover: '#000000' },
      accent: { bg: '#7f1d1d', border: '#991b1b', text: '#ffffff', hover: '#7f1d1d' },
      neutral: { bg: '#0f172a', border: '#1e293b', text: '#ffffff', hover: '#000000' },
      light: { bg: '#e7e5e4', border: '#d6d3d1', text: '#1c1917', hover: '#d6d3d1', hoverText: '#0c0a09' },
      light2: { bg: '#d6d3d1', border: '#a8a29e', text: '#1c1917' }
    }
  };
  
  const mapping = buttonMappings[themeName as keyof typeof buttonMappings];
  if (mapping) {
    // Primary button variables
    variables.push(
      ['--button-primary-bg', mapping.primary.bg],
      ['--button-primary-border', mapping.primary.border],
      ['--button-primary-text', mapping.primary.text],
      ['--button-primary-hover', mapping.primary.hover]
    );
    
    // Accent button variables
    variables.push(
      ['--button-accent-bg', mapping.accent.bg],
      ['--button-accent-border', mapping.accent.border],
      ['--button-accent-text', mapping.accent.text],
      ['--button-accent-hover', mapping.accent.hover]
    );
    
    // Neutral button variables
    variables.push(
      ['--button-neutral-bg', mapping.neutral.bg],
      ['--button-neutral-border', mapping.neutral.border],
      ['--button-neutral-text', mapping.neutral.text],
      ['--button-neutral-hover', mapping.neutral.hover]
    );
    
    // Light button variables
    variables.push(
      ['--button-light-bg', mapping.light.bg],
      ['--button-light-border', mapping.light.border],
      ['--button-light-text', mapping.light.text],
      ['--button-light-hover', mapping.light.hover],
      ['--button-light-hover-text', mapping.light.hoverText || mapping.light.text]
    );
    
    // Light2 button variables
    variables.push(
      ['--button-light2-bg', mapping.light2.bg],
      ['--button-light2-border', mapping.light2.border],
      ['--button-light2-text', mapping.light2.text]
    );
  }
  
  return variables;
};

/**
 * Generate glassmorphism effect variables from theme configuration
 */
export const generateGlassmorphismVariables = (themeConfig: ThemeConfig): Array<[string, string]> => {
  const effects = themeConfig.effects || {};
  const glassVariables: Array<[string, string]> = [];
  
  // Always generate essential CSS variables for overlay compatibility
  // Even if glassmorphism is disabled, the overlay CSS still uses these variables
  glassVariables.push(['--effect-backdropBlur', effects.backdropBlur || '16px']);
  
  if (!effects.glassmorphism) {
    // For non-glassmorphism themes, provide minimal variables
    glassVariables.push(['--glass-blur', effects.backdropBlur || '0px']);
    glassVariables.push(['--glass-opacity', effects.backgroundOpacity || '1']);
    return glassVariables;
  }
  
  // Basic glassmorphism variables - match the actual CSS usage
  glassVariables.push(['--glass-blur', effects.backdropBlur || '24px']);
  glassVariables.push(['--glass-opacity', effects.backgroundOpacity || '0.8']);
  
  // Shadow intensity mapping
  const shadowMap = {
    light: '0 4px 16px rgba(31, 38, 135, 0.2)',
    medium: '0 8px 32px rgba(31, 38, 135, 0.37)',
    strong: '0 12px 48px rgba(31, 38, 135, 0.5)',
    ultra: '0 16px 64px rgba(31, 38, 135, 0.7), 0 4px 16px rgba(31, 38, 135, 0.4)'
  };
  glassVariables.push(['--glass-shadow', shadowMap[effects.shadowIntensity || 'strong']]);
  
  // Generate gradient overlays efficiently
  if (effects.gradientOverlay) {
    // Use theme colors for vivid gradients
    const primaryColor = themeConfig.colors?.primary ? Object.values(themeConfig.colors.primary)[5] : '#4f46e5';
    const secondaryColor = themeConfig.colors?.secondary ? Object.values(themeConfig.colors.secondary)[4] : '#7c3aed';
    const accentColor = themeConfig.colors?.accent ? Object.values(themeConfig.colors.accent)[4] : '#8b5cf6';
    
    glassVariables.push(['--gradient-start', hexToRgba(primaryColor, 0.35)]);
    glassVariables.push(['--gradient-middle', hexToRgba(secondaryColor, 0.25)]);
    glassVariables.push(['--gradient-end', hexToRgba(accentColor, 0.15)]);
    glassVariables.push(['--gradient-accent', hexToRgba(accentColor, 0.4)]);
  } else {
    // Fallback subtle gradients
    glassVariables.push(['--gradient-start', 'rgba(255, 255, 255, 0.3)']);
    glassVariables.push(['--gradient-middle', 'rgba(255, 255, 255, 0.2)']);
    glassVariables.push(['--gradient-end', 'rgba(255, 255, 255, 0.1)']);
    glassVariables.push(['--gradient-accent', 'rgba(255, 255, 255, 0.25)']);
  }
  
  // Animation level mapping
  const animationMap = {
    none: '0ms',
    subtle: '200ms',
    enhanced: '300ms',
    premium: '500ms'
  };
  glassVariables.push(['--glass-transition', animationMap[effects.animationLevel || 'enhanced']]);
  
  // Border intensity based on shadow level
  const borderMap = {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.18)',
    strong: 'rgba(255, 255, 255, 0.25)',
    ultra: 'rgba(255, 255, 255, 0.35)'
  };
  glassVariables.push(['--glass-border', borderMap[effects.shadowIntensity || 'strong']]);
  
  return glassVariables;
};

// SSMR: Simple cache for theme variable generation to improve performance
// Cache cleared after adding resize handle semantic variables
const themeVariableCache = new Map<string, Array<[string, string]>>();

/**
 * Generate semantic color variables from theme configuration
 * SSMR: Safe addition of semantic color system without affecting existing variables
 */
export const generateSemanticColorVariables = (themeConfig: ThemeConfig): Array<[string, string]> => {
  const semanticVariables: Array<[string, string]> = [];
  
  if (!themeConfig.semanticColors) {
    return semanticVariables;
  }
  
  const semantic = themeConfig.semanticColors;
  
  // Text color variables
  if (semantic.textBody) {
    const rgb = hexToRgb(semantic.textBody);
    semanticVariables.push(['--theme-text-body-rgb', rgb]);
  }
  if (semantic.textHeader) {
    const rgb = hexToRgb(semantic.textHeader);
    semanticVariables.push(['--theme-text-header-rgb', rgb]);
  }
  if (semantic.textSecondary) {
    const rgb = hexToRgb(semantic.textSecondary);
    semanticVariables.push(['--theme-text-secondary-rgb', rgb]);
  }
  if (semantic.textInteractive) {
    const rgb = hexToRgb(semantic.textInteractive);
    semanticVariables.push(['--theme-text-interactive-rgb', rgb]);
  }
  if (semantic.textSuccess) {
    const rgb = hexToRgb(semantic.textSuccess);
    semanticVariables.push(['--theme-text-success-rgb', rgb]);
  }
  
  // Glass panel color variables
  if (semantic.glassPanelBg) {
    const rgb = hexToRgb(semantic.glassPanelBg);
    semanticVariables.push(['--theme-glass-panel-bg-rgb', rgb]);
  }
  if (semantic.glassPanelBorder) {
    const rgb = hexToRgb(semantic.glassPanelBorder);
    semanticVariables.push(['--theme-glass-panel-border-rgb', rgb]);
  }
  if (semantic.glassPanelShadow) {
    const rgb = hexToRgb(semantic.glassPanelShadow);
    semanticVariables.push(['--theme-glass-panel-shadow-rgb', rgb]);
  }
  if (semantic.glassPanelHover) {
    const rgb = hexToRgb(semantic.glassPanelHover);
    semanticVariables.push(['--theme-glass-panel-hover-rgb', rgb]);
  }
  if (semantic.glassPanelHoverBorder) {
    const rgb = hexToRgb(semantic.glassPanelHoverBorder);
    semanticVariables.push(['--theme-glass-panel-hover-border-rgb', rgb]);
  }
  if (semantic.glassPanelHoverShadow) {
    const rgb = hexToRgb(semantic.glassPanelHoverShadow);
    semanticVariables.push(['--theme-glass-panel-hover-shadow-rgb', rgb]);
  }
  
  // Input field color variables
  if (semantic.inputBg) {
    const rgb = hexToRgb(semantic.inputBg);
    semanticVariables.push(['--theme-input-bg-rgb', rgb]);
  }
  if (semantic.inputBorder) {
    const rgb = hexToRgb(semantic.inputBorder);
    semanticVariables.push(['--theme-input-border-rgb', rgb]);
  }
  if (semantic.inputFocus) {
    const rgb = hexToRgb(semantic.inputFocus);
    semanticVariables.push(['--theme-input-focus-rgb', rgb]);
  }
  if (semantic.inputPlaceholder) {
    const rgb = hexToRgb(semantic.inputPlaceholder);
    semanticVariables.push(['--theme-input-placeholder-rgb', rgb]);
  }
  
  // Button color variables
  if (semantic.buttonPrimary) {
    const rgb = hexToRgb(semantic.buttonPrimary);
    semanticVariables.push(['--theme-button-primary-rgb', rgb]);
  }
  if (semantic.buttonSecondary) {
    const rgb = hexToRgb(semantic.buttonSecondary);
    semanticVariables.push(['--theme-button-secondary-rgb', rgb]);
  }
  if (semantic.buttonText) {
    const rgb = hexToRgb(semantic.buttonText);
    semanticVariables.push(['--theme-button-text-rgb', rgb]);
  }
  if (semantic.buttonHover) {
    const rgb = hexToRgb(semantic.buttonHover);
    semanticVariables.push(['--theme-button-hover-rgb', rgb]);
  }
  
  // Resize handle color variables
  if (semantic.resizeHandleBg) {
    const rgb = hexToRgb(semantic.resizeHandleBg);
    semanticVariables.push(['--theme-resize-handle-bg-rgb', rgb]);
  }
  if (semantic.resizeHandleBorder) {
    const rgb = hexToRgb(semantic.resizeHandleBorder);
    semanticVariables.push(['--theme-resize-handle-border-rgb', rgb]);
  }
  if (semantic.resizeHandleShadow) {
    const rgb = hexToRgb(semantic.resizeHandleShadow);
    semanticVariables.push(['--theme-resize-handle-shadow-rgb', rgb]);
  }
  if (semantic.resizeHandleHoverBg) {
    const rgb = hexToRgb(semantic.resizeHandleHoverBg);
    semanticVariables.push(['--theme-resize-handle-hover-bg-rgb', rgb]);
  }
  if (semantic.resizeHandleHoverBorder) {
    const rgb = hexToRgb(semantic.resizeHandleHoverBorder);
    semanticVariables.push(['--theme-resize-handle-hover-border-rgb', rgb]);
  }
  if (semantic.resizeHandleHoverShadow) {
    const rgb = hexToRgb(semantic.resizeHandleHoverShadow);
    semanticVariables.push(['--theme-resize-handle-hover-shadow-rgb', rgb]);
  }
  
  return semanticVariables;
};

/**
 * Unified CSS variable generator - consolidates all theme variables
 * SSMR: Safe consolidation of existing generateColorVariables and generateGlassmorphismVariables
 * Enhanced with caching for better performance on repeated theme switches
 */
export const generateAllThemeVariables = (themeConfig: ThemeConfig): Array<[string, string]> => {
  const cssVariables: Array<[string, string]> = [];
  
  // Add background property if it exists
  if (themeConfig.background) {
    cssVariables.push(['--theme-background', themeConfig.background]);
  }
  
  // Add animation properties if they exist
  if (themeConfig.animation) {
    cssVariables.push(['--theme-animation', themeConfig.animation]);
  }
  if (themeConfig.animationStyles) {
    cssVariables.push(['--theme-animation-styles', themeConfig.animationStyles]);
  }
  
  // Generate color variables
  const colorVariables = generateColorVariables(themeConfig);
  cssVariables.push(...colorVariables);
  
  // Generate glassmorphism variables
  const glassVariables = generateGlassmorphismVariables(themeConfig);
  cssVariables.push(...glassVariables);
  
  // SSMR: Add semantic color variables (safe - only if semanticColors exist)
  const semanticVariables = generateSemanticColorVariables(themeConfig);
  cssVariables.push(...semanticVariables);
  
  // PERFORMANCE: Check cache first
  const cacheKey = themeConfig.name;
  if (themeVariableCache.has(cacheKey)) {
    return themeVariableCache.get(cacheKey)!;
  }
  
  // PERFORMANCE: Cache result for future use
  themeVariableCache.set(cacheKey, cssVariables);
  
  return cssVariables;
};

/**
 * Clear theme variable cache - useful for development or dynamic theme updates
 * REVERSIBLE: Provides way to clear cache if needed
 */
export const clearThemeVariableCache = (): void => {
  themeVariableCache.clear();
};

/**
 * Apply CSS variables to document root efficiently
 */
export const applyCSSVariables = (variables: Array<[string, string]>): void => {
  const root = document.documentElement;
  let styleElement = document.getElementById('theme-animation-styles') as HTMLStyleElement;
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'theme-animation-styles';
    document.head.appendChild(styleElement);
  }
  
  variables.forEach(([property, value]) => {
    if (property === '--theme-animation-styles') {
      styleElement.textContent = value;
    } else {
      root.style.setProperty(property, value);
    }
  });
};
