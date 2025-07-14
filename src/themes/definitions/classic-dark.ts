
import { ThemeConfig } from '../../types/theme';

/**
 * Classic Dark Theme
 * A sophisticated dark mode theme inspired by modern desktop applications,
 * featuring dark grey backgrounds with light blue and orange accents.
 * Uses flat colors without gradients for a clean, professional appearance.
 */
export const classicDarkTheme: ThemeConfig = {
  name: 'classic-dark',
  displayName: 'Classic Dark',
  description: 'A dark theme with pure grey backgrounds, light blue and orange accents - inspired by modern productivity apps',
  background: `
    background: rgba(9, 9, 9, 0.96) !important;
  `,
  colors: {
    // Light blue primary palette - for highlights and interactive elements
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    // Cleaned up pure Grey palette
    secondary: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    // Cleaned up Orange accent palette
    accent: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    // Pure neutral greys - for text and subtle backgrounds
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },
  // Semantic color mappings for classic dark theme
  semanticColors: {
    // Text hierarchy - dark theme with excellent contrast
    textBody: '#fafafa',           // Pure white for body text
    textHeader: '#ffffff',         // Pure white for headers
    textSecondary: '#a3a3a3',      // Pure medium gray for secondary
    textInteractive: '#fb923c',    // Orange accent for interactive (accent.400)
    textSuccess: '#38bdf8',        // Light blue for success/active (primary.400)
    
    // Glass panels - dark theme with orange accents
    glassPanelBg: '#262626',        // Dark gray background (neutral.800)
    glassPanelBorder: '#f97316',    // Orange accent borders (accent.500)
    glassPanelShadow: '#f97316',    // Orange accent shadows (accent.500)
    glassPanelHover: '#262626',     // Same dark background for hover
    glassPanelHoverShadow: '#f97316', // Orange hover shadow (accent.500)
    
    // Input fields - consistent with dark theme
    inputBg: '#404040',            // Dark gray background (neutral.700)
    inputBorder: '#f97316',        // Orange border (accent.500)
    inputFocus: '#f97316',         // Orange focus (accent.500)
    inputPlaceholder: '#a3a3a3',   // Medium gray placeholder (neutral.400)
    
    // Button colors - ACCESSIBILITY FIXED
    buttonPrimary: '#f97316',      // Orange primary (accent.500)
    buttonSecondary: '#737373',    // Gray secondary (neutral.500)
    buttonText: '#171717',         // Dark text for accessibility on orange buttons (neutral.900)
    buttonHover: '#fb923c',        // Lighter orange hover (accent.400)
    
    // Resize handles - keeping coherence with dark theme
    resizeHandleBg: '#262626',     // Dark gray for handle (neutral.800)
    resizeHandleBorder: '#f97316', // Orange border for handle (accent.500)
    resizeHandleShadow: '#f97316', // Orange shadow for handle (accent.500)
    resizeHandleHoverBg: '#404040', // Lighter gray hover for handle (neutral.700)
    resizeHandleHoverBorder: '#f97316', // Orange hover border (accent.500)
    resizeHandleHoverShadow: '#f97316', // Orange hover shadow (accent.500)

    // Redline/diff specific colors - isolated for clarity
    diff: {
      additionBg: '#29405D',
      additionBorder: '#1E2F42',
      additionText: '#f5f5f5',
      additionDecoration: '#7BA8D6',
      deletionBg: '#C13F17',
      deletionBorder: '#9A3012',
      deletionText: '#fbbf24',
      deletionDecoration: '#F4804A',
    }
  },
  // No glassmorphism effects - flat design as requested
  effects: {
    glassmorphism: false,
    backdropBlur: '0px',
    backgroundOpacity: '1',
    shadowIntensity: 'medium',
    gradientOverlay: false,
    animationLevel: 'subtle',
    textureOverlay: false,
  },
};

