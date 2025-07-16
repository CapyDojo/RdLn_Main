import { ThemeConfig } from '../../types/theme';
import { GLASSMORPHISM_EFFECTS } from '../utils/effects';

/**
 * NYC Dusk Theme
 * A sophisticated dark theme inspired by a NYC skyline at night.
 * Features charcoal grays, warm amber accents, and electric blue highlights.
 */
export const newYorkTheme: ThemeConfig = {
  name: 'new-york',
  displayName: 'NYC Dusk',
  description: 'Urban night skyline with warm amber accents',
  background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 30%, #451a03 100%), radial-gradient(circle at 50% 100%, rgba(100, 149, 237, 0.15) 0%, transparent 60%), radial-gradient(circle at 25% 80%, rgba(70, 130, 180, 0.12) 0%, transparent 40%), radial-gradient(circle at 75% 90%, rgba(65, 105, 225, 0.10) 0%, transparent 35%), repeating-linear-gradient(90deg, transparent 0%, rgba(16, 16, 16, 0.6) 2%, transparent 4%)',
  colors: {
    primary: {
      50: '#ebebeb',
      100: '#d7d7d7',
      200: '#b0b0b0',
      300: '#888888',
      400: '#606060',
      500: '#404040',
      600: '#303030',
      700: '#202020',
      800: '#101010',
      900: '#000000',
    },
    secondary: {
      50: '#fff3e0',
      100: '#ffe0b2',
      200: '#ffcc80',
      300: '#ffb74d',
      400: '#ffa726',
      500: '#ff9800',
      600: '#fb8c00',
      700: '#f57c00',
      800: '#ef6c00',
      900: '#e65100',
    },
    accent: {
      50: '#e0f7fa',
      100: '#b2ebf2',
      200: '#80deea',
      300: '#4dd0e1',
      400: '#26c6da',
      500: '#00bcd4',
      600: '#00acc1',
      700: '#0097a7',
      800: '#00838f',
      900: '#006064',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  // Semantic color mappings for NYC-inspired dark theme
  semanticColors: {
    // Text hierarchy - urban skyline inspired colors
    textBody: '#fafafa',           // Bright white for body text (neutral.50)
    textHeader: '#ffffff',         // Pure white for headers
    textSecondary: '#e0e0e0',      // Light cool gray for secondary text (neutral.300)
    textInteractive: '#ffb74d',    // Warm amber for interactive elements (secondary.300)
    textSuccess: '#4dd0e1',        // Electric cyan for success states (accent.300)
    
    // Glass panels - dark urban colors with warm accents
    glassPanelBg: '#212121',        // Dark gray urban background (neutral.900)
    glassPanelBorder: '#ff9800',    // Warm orange border accents (secondary.500)
    glassPanelShadow: '#fb8c00',    // Rich orange shadow (secondary.600)
    glassPanelHover: '#424242',     // Lighter gray on hover (neutral.800)
    glassPanelHoverShadow: '#ff9800', // Warm orange hover shadow (secondary.500)
    
    // Input fields - consistent with urban theme
    inputBg: '#212121',            // Dark urban background (neutral.900)
    inputBorder: '#ff9800',        // Warm orange border (secondary.500)
    inputFocus: '#ffb74d',         // Amber focus outline (secondary.300)
    inputPlaceholder: '#bdbdbd',   // Neutral gray placeholder (neutral.400)
    
    // Button colors - ACCESSIBILITY FIXED
    buttonPrimary: '#ff9800',      // Warm orange primary (secondary.500)
    buttonSecondary: '#757575',    // Neutral gray secondary (neutral.600)
    buttonText: '#212121',         // Dark text for accessibility on orange buttons (neutral.900)
    buttonHover: '#ffb74d',        // Amber hover state (secondary.300)
    
    // Resize handles - consistent with urban aesthetic
    resizeHandleBg: '#212121',           // Dark urban background (neutral.900)
    resizeHandleBorder: '#ff9800',       // Warm orange border (secondary.500)
    resizeHandleShadow: '#fb8c00',       // Rich orange shadow (secondary.600)
    resizeHandleHoverBg: '#424242',      // Slightly lighter urban hover (neutral.800)
    resizeHandleHoverBorder: '#ffb74d',  // Amber hover border (secondary.300)
    resizeHandleHoverShadow: '#ff9800',  // Warm orange hover shadow (secondary.500)
  },
  effects: GLASSMORPHISM_EFFECTS.premium
};
