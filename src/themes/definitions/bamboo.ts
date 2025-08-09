import { ThemeConfig } from '../../types/theme';

/**
 * Chengdu Bamboo Dawn Theme
 * Serene nature-inspired theme with various shades of green and gold accents.
 * Enhanced contrast ratios for better accessibility.
 */
export const bambooTheme: ThemeConfig = {
  name: 'bamboo',
  displayName: 'Chengdu 晨',
  description: 'Serene bamboo forest theme with organic criss-cross gradients and glassmorphic effects',
  background: `
    radial-gradient(ellipse 900px 450px at 15% 25%, rgba(183,203,165,0.2) 0%, transparent 35%),
    radial-gradient(ellipse 700px 650px at 85% 75%, rgba(113,155,81,0.18) 0%, transparent 45%),
    repeating-linear-gradient(83deg, transparent 0%, rgba(45,80,22,0.25) 10%, rgba(113,155,81,0.3) 15%, rgba(45,80,22,0.25) 20%, transparent 25%, transparent 75%),
    repeating-linear-gradient(67deg, transparent 0%, rgba(123,160,95,0.15) 8%, rgba(183,203,165,0.2) 12%, rgba(123,160,95,0.15) 16%, transparent 20%, transparent 60%),
    linear-gradient(72deg, rgba(45,80,22,0.15) 0%, transparent 25%, rgba(146,183,113,0.12) 45%, transparent 65%, rgba(123,160,95,0.2) 85%, transparent 100%),
    repeating-linear-gradient(-23deg, transparent 0%, rgba(146,183,113,0.18) 12%, rgba(113,155,81,0.25) 18%, rgba(146,183,113,0.18) 24%, transparent 30%, transparent 70%),
    linear-gradient(-38deg, transparent 0%, rgba(183,203,165,0.15) 18%, transparent 38%, rgba(113,155,81,0.18) 58%, transparent 78%, rgba(146,183,113,0.12) 92%, transparent 100%),
    repeating-linear-gradient(107deg, transparent 0%, rgba(183,203,165,0.12) 6%, rgba(146,183,113,0.15) 10%, rgba(183,203,165,0.12) 14%, transparent 18%, transparent 65%),
    linear-gradient(-118deg, transparent 0%, rgba(183,203,165,0.18) 28%, transparent 48%, rgba(146,183,113,0.15) 68%, transparent 88%),
    linear-gradient(45deg, #2d5016 0%, rgb(146,183,113) 25%, rgb(113,155,81) 63%, rgb(183,203,165) 85%, #7ba05f 100%)
  `.replace(/\s+/g, ' ').trim(),
  colors: {
    // Green primary palette - main nature colors
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    // Blue secondary palette - added for completeness
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    // Gold accent palette - highlight colors
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    // High-contrast neutral palette - optimized for readability
    neutral: {
      50: '#fafaf9',
      100: '#f5f5f4',
      200: '#e7e5e4',
      300: '#d6d3d1',
      400: '#a8a29e',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c',
      800: '#292524',
      900: '#1c1917',
    },
  },
  effects: {
    glassmorphism: true,
    backdropBlur: '16px',
    backgroundOpacity: '0.75',
    shadowIntensity: 'medium',
    gradientOverlay: true,
    animationLevel: 'subtle',
    textureOverlay: false,
  },
  // Semantic color mappings - REBUILT FOR ACCESSIBILITY AND CONSISTENCY
  semanticColors: {
    // Text colors - high contrast and clear hierarchy
    textBody: '#1c1917',        // Deep charcoal for body text (neutral.900)
    textHeader: '#14532d',      // Deep forest green for headers (primary.900)
    textSecondary: '#57534e',   // Medium-dark stone for secondary text (neutral.600)
    textInteractive: '#b45309', // Accessible dark gold for interactive elements (accent.700)
    textSuccess: '#15803d',     // Dark forest green for success states (primary.700)

    // Glass panel colors - light and natural
    glassPanelBg: '#fafaf9',           // Light stone background (neutral.50)
    glassPanelBorder: '#fbbf24',       // Vibrant gold border (accent.400)
    glassPanelShadow: '#f59e0b',       // Warm gold shadow (accent.500)
    glassPanelHover: '#f5f5f4',        // Slightly darker stone on hover (neutral.100)
    glassPanelHoverShadow: '#d97706',  // Darker gold hover shadow (accent.600)

    // Input field colors - consistent and clear
    inputBg: '#ffffff',         // Pure white background
    inputBorder: '#16a34a',     // Accessible green border (primary.600)
    inputFocus: '#b45309',      // Accessible dark gold focus (accent.700)
    inputPlaceholder: '#78716c', // Medium stone for placeholder (neutral.500)

    // Button colors - ACCESSIBILITY FIXED
    buttonPrimary: '#15803d',   // Dark, accessible forest green (primary.700)
    buttonSecondary: '#e7e5e4', // Light stone secondary (neutral.200)
    buttonText: '#fafaf9',      // Light stone text for high contrast (neutral.50)
    buttonHover: '#166534',     // Darker forest green hover (primary.800)

    // Resize handle colors - consistent with theme
    resizeHandleBg: '#bbf7d0',   // Light green (primary.200)
    resizeHandleBorder: '#15803d', // Dark green border (primary.700)
    resizeHandleShadow: '#15803d', // Dark green shadow (primary.700)
    resizeHandleHoverBg: '#86efac', // Brighter green hover (primary.300)
    resizeHandleHoverBorder: '#14532d', // Darkest green hover border (primary.900)
    resizeHandleHoverShadow: '#14532d' // Darkest green hover shadow (primary.900)
  }
};
