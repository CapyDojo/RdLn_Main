
import { ThemeConfig } from '../../types/theme';
import { GLASSMORPHISM_EFFECTS } from '../utils/effects';

/**
 * Autumn Theme
 * A theme inspired by the colors of autumn with warm earth tones,
 * deep forest greens, and rich maple reds.
 */
export const autumnTheme: ThemeConfig = {
  name: 'autumn',
  displayName: 'Autumn',
  description: 'A theme inspired by the colors of autumn.',
  background: `
    background-image: url('/images/autumn-background.jpg') !important;
    background-repeat: no-repeat !important;
    background-attachment: fixed !important;
    background-size: cover !important;
    background-position: center !important;
    min-height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
  `,
  colors: {
    // Deep Forest Green primary palette
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
    // Autumn Maple Red secondary palette
    secondary: {
      50: '#fef2f2',
      100: '#fde8e8',
      200: '#fbd5d5',
      300: '#f8b4b4',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    // Warm Earth Tones accent palette
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
    // Tatami & Stone neutral palette
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
  // Semantic color mappings for autumn garden theme - ACCESSIBILITY AND VIBRANCY FIXED
  semanticColors: {
    // Text hierarchy - autumn garden inspired colors
    textBody: '#1c1917',           // Deepest charcoal for body text (neutral.900)
    textHeader: '#78350f',         // Rich, dark brown for headers (accent.900)
    textSecondary: '#44403c',      // Dark stone for secondary text (neutral.700)
    textInteractive: '#dc2626',    // Accessible maple red for interactive elements (secondary.600)
    textSuccess: '#15803d',        // Dark forest green for success states (primary.700)
    
    // Glass panels - light autumn colors with natural accents
    glassPanelBg: '#fafaf9',        // Light stone background (neutral.50)
    glassPanelBorder: '#22c55e',    // Forest green border accents (primary.500)
    glassPanelShadow: '#f59e0b',    // Warm amber shadow (accent.500)
    glassPanelHover: '#fafaf9',     // Same as bg - hover managed by opacity
    glassPanelHoverShadow: '#16a34a', // Darker Forest green hover shadow (primary.600)
    
    // Input fields - consistent with autumn theme
    inputBg: '#fafaf9',            // Light stone background (neutral.50)
    inputBorder: '#22c55e',        // Forest green border (primary.500)
    inputFocus: '#dc2626',         // Accessible maple red focus outline (secondary.600)
    inputPlaceholder: '#78716c',   // Stone neutral placeholder (neutral.500)
    
    // Button colors - autumn accent inspired
    buttonPrimary: '#15803d',      // Dark, accessible forest green primary (primary.700)
    buttonSecondary: '#78716c',    // Stone neutral secondary (neutral.500)
    buttonText: '#fafaf9',         // Light stone text for high contrast on dark buttons (neutral.50)
    buttonHover: '#166534',        // Darker forest green hover (primary.800)
    
    // Resize handles - consistent with autumn aesthetic
    resizeHandleBg: '#fafaf9',           // Light stone background (neutral.50)
    resizeHandleBorder: '#22c55e',       // Forest green border (primary.500)
    resizeHandleShadow: '#f59e0b',       // Warm amber shadow (accent.500)
    resizeHandleHoverBg: '#f5f5f4',      // Slightly darker stone hover (neutral.100)
    resizeHandleHoverBorder: '#16a34a',  // Darker forest green hover border (primary.600)
    resizeHandleHoverShadow: '#22c55e',  // Forest green hover shadow (primary.500)
  },
  effects: GLASSMORPHISM_EFFECTS.premium,
};

