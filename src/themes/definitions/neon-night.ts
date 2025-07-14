import { ThemeConfig } from '../../types/theme';
import { GLASSMORPHISM_EFFECTS } from '../utils/effects';

/**
 * Neon Night Theme
 * Sophisticated dark theme with vibrant neon aesthetics.
 * Features inverted cool grays and vibrant purple accents for dark mode.
 */
export const neonNightTheme: ThemeConfig = {
  name: 'neon-night',
  displayName: 'Neon Night',
  description: 'Sophisticated dark theme with vibrant neon aesthetics',
  background: `
    background-image: linear-gradient(45deg, #1e1e1e 0%, #2d2d2d 25%, #3a3a3a 63%, #4a4a4a 85%, #5a5a5a 100%);
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-size: 100% 100%;
    min-height: 100vh;
    margin: 0;
    padding: 0 !important;
  `,
  colors: {
    // Inverted cool gray primary palette - dark mode adaptation
    primary: {
      50: '#0c1929',
      100: '#1a2e4a',
      200: '#2a436b',
      300: '#3a588c',
      400: '#4a6dad',
      500: '#5a82ce',
      600: '#6a97ef',
      700: '#7aacff',
      800: '#8ac1ff',
      900: '#9ad6ff'
    },
    secondary: {
      50: '#1a1a2e',
      100: '#2a2a3e',
      200: '#3a3a4e',
      300: '#4a4a5e',
      400: '#5a5a6e',
      500: '#6a6a7e',
      600: '#7a7a8e',
      700: '#8a8a9e',
      800: '#9a9aae',
      900: '#aaaabe'
    },
    // Inverted purple accent palette - bright accents for dark theme
    accent: {
      50: '#4c1d95',   // Dark purple as base for dark theme
      100: '#5b21b6',  // Slightly lighter purple
      200: '#6d28d9',  // Medium-dark purple
      300: '#7c3aed',  // Medium purple
      400: '#8b5cf6',  // Medium-light purple
      500: '#a78bfa',  // Base purple - accent color for dark
      600: '#c4b5fd',  // Light purple
      700: '#ddd6fe',  // Very light purple
      800: '#ede9fe',  // Lightest purple
      900: '#f5f3ff',  // Palest purple tint
    },
    // True dark neutral palette - optimized for dark mode
    neutral: {
      50: '#000000',   // Pure black
      100: '#0a0a0a',  // Near black
      200: '#171717',  // Very dark neutral
      300: '#262626',  // Dark neutral
      400: '#404040',  // Medium-dark neutral
      500: '#525252',  // Medium neutral - body text on dark
      600: '#737373',  // Medium-light neutral
      700: '#a3a3a3',  // Light neutral - headings on dark
      800: '#d4d4d4',  // Very light neutral
      900: '#f5f5f5',  // Almost white
    },
  },
  // Semantic color mappings for dark theme  
  semanticColors: {
    // Text hierarchy
    textBody: '#f5f5f5',           // Off-white for body text (neutral.900)
    textHeader: '#ffffff',         // Pure white for headers
    textSecondary: '#d4d4d4',      // Light gray for secondary text (neutral.800)
    textInteractive: '#a78bfa',    // Bright purple for interactive elements (accent.500)
    textSuccess: '#80deea',        // Electric blue for success states
    
    // Glass panels
    glassPanelBg: '#171717',        // Very dark neutral for glass background (neutral.200)
    glassPanelBorder: 'rgba(255, 255, 255, 0.2)', // Softer, semi-transparent white border
    glassPanelShadow: '#8b5cf6',    // Bright purple for glass shadow (accent.400)
    glassPanelHover: '#171717',     // Same as bg - hover managed by opacity
    glassPanelHoverShadow: '#8b5cf6', // Bright purple for hover shadow (accent.400)
    
    // Input fields
    inputBg: '#171717',            // Dark background for inputs (neutral.200)
    inputBorder: 'rgba(255, 255, 255, 0.2)', // Softer, semi-transparent white border
    inputFocus: '#8b5cf6',         // Purple focus outline (accent.400)
    inputPlaceholder: '#9ca3af',   // Light placeholder text
    
    // Button colors - IMPROVED CONTRAST
    buttonPrimary: '#7c3aed',      // Darker purple for better contrast (accent.300)
    buttonSecondary: '#475569',    // Dark secondary button (primary.300)
    buttonText: '#ffffff',         // White button text
    buttonHover: '#8b5cf6',        // Lighter purple hover (accent.400)
    
    // Resize handles
    resizeHandleBg: '#171717',           // Dark background for resize handles (neutral.200)
    resizeHandleBorder: 'rgba(255, 255, 255, 0.2)', // Softer, semi-transparent white border
    resizeHandleShadow: '#8b5cf6',       // Purple shadow for resize handles (accent.400)
    resizeHandleHoverBg: '#262626',      // Slightly lighter hover background (neutral.300)
    resizeHandleHoverBorder: '#8b5cf6',  // Purple hover border (accent.400)
    resizeHandleHoverShadow: '#a78bfa'  // Lighter purple hover shadow (accent.500)
  },
  effects: GLASSMORPHISM_EFFECTS.premium
}
