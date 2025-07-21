import { ThemeConfig } from '../../types/theme';
import { GLASSMORPHISM_EFFECTS } from '../utils/effects';

/**
 * Kyoto Zen Theme
 * Inspired by Japanese autumn gardens with vibrant maple reds and deep forest greens.
 * Features warm tatami backgrounds, autumn maple accents, and natural stone neutrals.
 */
export const kyotoTheme: ThemeConfig = {
  name: 'kyoto',
  displayName: 'Kyoto Afternoon',
  description: 'A dark, elegant theme inspired by a tranquil Kyoto night.',
  background: 'radial-gradient(ellipse 1800px 900px at 15% 20%, rgba(13, 142, 48, 0.39) 0%, transparent 35%), radial-gradient(ellipse 900px 600px at 85% 80%, rgba(197, 90, 17, 0.15) 0%, transparent 60%), radial-gradient(ellipse 1200px 900px at 15% 25%, rgba(122, 61, 26, 0.6) 0%, rgba(155, 74, 31, 0.4) 25%, transparent 60%), radial-gradient(ellipse 12300px 1800px at 78% 69%, rgba(20, 54, 20, 0.76) 0%, rgba(80, 63, 30, 0.2) 27%, transparent 90%), radial-gradient(ellipse 1200px 600px at 48% 63%, rgba(197, 90, 17, 0.2) 30%, rgba(217, 119, 6, 0.15) 20%, transparent 70%), radial-gradient(ellipse 900px 600px at 60% 10%, rgba(197, 90, 17, 0.4) 0%, rgba(217, 119, 6, 0.25) 40%, transparent 80%), radial-gradient(ellipse 900px 1200px at 5% 85%, rgba(122, 61, 26, 0.3) 0%, rgba(155, 74, 31, 0.15) 50%, transparent 85%), radial-gradient(ellipse 500px 700px at 95% 45%, rgba(19, 78, 74, 0.4) 0%, rgba(58, 118, 15, 0.2) 45%, transparent 90%), linear-gradient(160deg, #7A3D1A 0%, #9B4A1F 5%, #C55A11 10%, #D97706 15%, rgb(220, 8, 8) 18%, rgb(173, 76, 16) 27%, #6B4423 35%, #4A5D23 45%, #3A4D1F 55%, #2A3D1A 60%, #1E3A1E 65%, rgb(87, 69, 12) 70%, rgb(7, 59, 27) 80%, #C55A11 95%, rgb(186, 101, 3) 100%), radial-gradient(circle at 40% 60%, rgba(30, 85, 80, 0.15) 0%, transparent 40%), radial-gradient(circle at 60% 40%, rgba(140, 70, 50, 0.1) 0%, transparent 50%)',
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
    // Warm Earth Tones accent palette - bamboo and gold
    accent: {
      50: '#fefdf8',
      100: '#fefbf3',
      200: '#fef7e6',
      300: '#fdefd3',
      400: '#fce4a6',
      500: '#f5d563',
      600: '#eab308',
      700: '#ca8a04',
      800: '#a16207',
      900: '#713f12',
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
  // Semantic color mappings - REBUILT FOR ACCESSIBILITY AND CONSISTENCY
  semanticColors: {
    // Text hierarchy - high contrast and clear hierarchy
    textBody: '#fef7e6',           // Light, warm beige for body text (accent.200)
    textHeader: '#86efac',         // Vibrant green for headers (primary.300)
    textSecondary: '#d6d3d1',      // Light stone for secondary text (neutral.300)
    textInteractive: '#f8b4b4',    // Accessible light maple red for interactive elements (secondary.300)
    textSuccess: '#bbf7d0',        // Light forest green for success states (primary.200)
    
    // Glass panels - dark stone and earth tones
    glassPanelBg: '#1c1917',        // Dark tatami stone background (neutral.900)
    glassPanelBorder: '#78716c',    // Stone neutral border (neutral.500)
    glassPanelShadow: '#b91c1c',    // Deep maple red shadow (secondary.700)
    
    // Glass panel hover states - extracted from working CSS implementation
    glassPanelHover: '#1c1917',     // Same as glassPanelBg - CSS applies opacity via var(--glass-focus)
    glassPanelHoverBorder: '#dc0808', // Exact match for rgba(220, 8, 8, 0.6) from working CSS
    glassPanelHoverShadow: '#dc0808', // Exact match for rgba(220, 8, 8, 0.7/0.5) from working CSS
    
    // Input fields - harmonized with theme
    inputBg: '#1c1917',            // Dark stone background (neutral.900)
    inputBorder: '#78716c',        // Stone neutral border (neutral.500)
    inputFocus: '#b91c1c',         // Deep maple red focus (secondary.700)
    inputPlaceholder: '#a8a29e',   // Neutral stone placeholder (neutral.400)
    
    // Button colors - ACCESSIBILITY FIXED
    buttonPrimary: '#b91c1c',      // Accessible deep maple red primary (secondary.700)
    buttonSecondary: '#78716c',    // Stone neutral secondary (neutral.500)
    buttonText: '#fef7e6',         // Light, warm beige text for high contrast (accent.200)
    buttonHover: '#991b1b',        // Darker maple hover (secondary.800)
    
    // Resize handles - consistent with theme
    resizeHandleBg: '#1c1917',           // Dark stone background (neutral.900)
    resizeHandleBorder: '#78716c',       // Stone neutral border (neutral.500)
    resizeHandleShadow: '#b91c1c',       // Deep maple red shadow (secondary.700)
    resizeHandleHoverBg: '#292524',      // Slightly lighter stone hover (neutral.800)
    resizeHandleHoverBorder: '#dc2626',  // Brighter maple red hover border (secondary.600)
    resizeHandleHoverShadow: '#991b1b',  // Darker maple hover shadow (secondary.800)
  },
  effects: GLASSMORPHISM_EFFECTS.premium,
};
