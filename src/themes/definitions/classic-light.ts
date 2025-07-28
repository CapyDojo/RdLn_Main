import { ThemeConfig } from '../../types/theme';

/**
 * Classic Light Theme
 * A clean, professional light theme with blue and orange accents.
 * Uses flat colors without gradients for a clean, professional appearance.
 */
export const classicLightTheme: ThemeConfig = {
  name: 'classic-light',
  displayName: 'Classic Light',
  description: 'A clean, professional light theme with blue and orange accents.',
  background: 'rgba(222, 220, 213, 0.8)',
  colors: {
    // Light blue primary palette - for highlights and interactive elements
    primary: {
      50: '#f0f9ff',   // Very light blue tint
      100: '#e0f2fe',  // Light blue
      200: '#bae6fd',  // Medium-light blue
      300: '#7dd3fc',  // Medium blue
      400: '#38bdf8',  // Medium-bright blue
      500: '#0ea5e9',  // Base light blue - main accent
      600: '#0284c7',  // Medium-dark blue
      700: '#0369a1',  // Dark blue
      800: '#075985',  // Darker blue
      900: '#0c4a6e',  // Darkest blue
    },
    // Grey palette - main interface colors (dark mode greys)
    secondary: {
      50: '#f8fafc',   // Lightest (for text on dark)
      100: '#f1f5f9',  // Very light grey
      200: '#e2e8f0',  // Light grey
      300: '#cbd5e1',  // Medium-light grey
      400: '#94a3b8',  // Medium grey
      500: '#64748b',  // Base grey
      600: '#475569',  // Medium-dark grey
      700: '#334155',  // Dark grey - secondary backgrounds
      800: '#1e293b',  // Darker grey - primary backgrounds
      900: '#0f172a',  // Darkest grey - deepest backgrounds
    },
    // Orange accent palette - for warnings, highlights, and action items
    accent: {
      50: '#fff7ed',   // Very light orange tint
      100: '#ffedd5',  // Light orange
      200: '#fed7aa',  // Medium-light orange
      300: '#fdba74',  // Medium orange
      400: '#fb923c',  // Medium-bright orange
      500: '#f97316',  // Base orange - secondary accent
      600: '#ea580c',  // Medium-dark orange
      700: '#c2410c',  // Dark orange
      800: '#9a3412',  // Darker orange
      900: '#7c2d12',  // Darkest orange
    },
    // True neutral greys - for text and subtle backgrounds
    neutral: {
      50: '#fafafa',   // Almost white
      100: '#f4f4f5',  // Very light neutral
      200: '#e4e4e7',  // Light neutral
      300: '#d4d4d8',  // Medium-light neutral
      400: '#a1a1aa',  // Medium neutral
      500: '#71717a',  // Base neutral - regular text
      600: '#52525b',  // Medium-dark neutral
      700: '#3f3f46',  // Dark neutral - headings
      800: '#27272a',  // Darker neutral - cards/panels
      900: '#18181b',  // Darkest neutral - deep backgrounds
    },
  },
  // Semantic color mappings for classic light theme
  semanticColors: {
    // Text hierarchy - modern desktop inspired colors
    textBody: '#1e293b',           // Dark text for body
    textHeader: '#0f172a',         // Very dark for headers
    textSecondary: '#475569',      // Medium gray for secondary text
    textInteractive: '#c2410c',    // Dark orange for accessibility (from accent.700)
    textSuccess: '#0284c7',        // Dark blue for success/active
    
    // Glass panels - light theme with orange accents
    glassPanelBg: '#f8fafc',        // Light blue background
    glassPanelBorder: '#f97316',    // Orange accent borders
    glassPanelShadow: '#f97316',    // Orange accent shadows
    glassPanelHover: '#f8fafc',     // Hover with light blue
    glassPanelHoverShadow: '#f97316', // Darker orange hover shadow
    
    // Input fields - consistent with light theme
    inputBg: '#ffffff',            // White background
    inputBorder: '#f97316',        // Orange border
    inputFocus: '#f97316',         // Orange focus
    inputPlaceholder: '#475569',   // Medium gray placeholder
    
    // Button colors - keeping orange accents
    buttonPrimary: '#f97316',      // Orange primary
    buttonSecondary: '#64748b',    // Slate gray secondary (from secondary.500)
    buttonText: '#0f172a',         // Dark text for accessibility on orange buttons
    buttonHover: '#ea580c',        // Darker orange hover
    
    // Resize handles - keeping coherence with theme
    resizeHandleBg: '#f8fafc',     // Light blue for handle
    resizeHandleBorder: '#f97316', // Orange border for handle
    resizeHandleShadow: '#f97316', // Orange shadow for handle
    resizeHandleHoverBg: '#f1f5f9', // Darker blue hover for handle
    resizeHandleHoverBorder: '#f97316', // Orange hover border
    resizeHandleHoverShadow: '#f97316', // Orange hover shadow
  },
  // No glassmorphism effects - flat design as requested
  effects: {
    glassmorphism: false,
    backdropBlur: '15px',
    backgroundOpacity: '1',
    shadowIntensity: 'medium',
    gradientOverlay: false,
    animationLevel: 'subtle',
    textureOverlay: false,
  },
};
