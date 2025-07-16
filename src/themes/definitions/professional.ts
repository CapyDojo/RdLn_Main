import { ThemeConfig } from '../../types/theme';
import { GLASSMORPHISM_EFFECTS } from '../utils/effects';

/**
 * Professional Blue Theme
 * Classic business theme with blue primary colors, neutral grays, and orange accents.
 * Perfect for corporate and professional environments.
 */
export const professionalTheme: ThemeConfig = {
  name: 'professional',
  displayName: 'Professional Blue',
  description: 'Classic professional theme with blue, white, and orange accents',
  background: 'linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%, #e2e8f0 100%), linear-gradient(138deg, rgba(59, 130, 246, 0.35) 0%, rgba(147, 197, 253, 0.28) 22%, transparent 48%, rgba(219, 234, 254, 0.22) 73%, rgba(239, 246, 255, 0.15) 100%), radial-gradient(ellipse at 28% 18%, rgba(226, 232, 240, 0.25) 0%, transparent 52%), radial-gradient(ellipse at 78% 82%, rgba(203, 213, 225, 0.20) 0%, transparent 47%)',
  colors: {
    // Blue primary palette - main brand colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3c72',
    },
    // Slate gray secondary palette
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
    // Unified neutral gray palette
    neutral: {
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
    // Orange accent palette - highlight colors
    accent: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#ff6b35',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
  },
  effects: GLASSMORPHISM_EFFECTS.enhanced,
  // Semantic color mappings - REBUILT FOR ACCESSIBILITY AND CONSISTENCY
  semanticColors: {
    // Text colors - high contrast and clear hierarchy
    textBody: '#1e293b',        // Deep charcoal for body text (neutral.800)
    textHeader: '#0f172a',      // Navy blue for headers (neutral.900)
    textSecondary: '#475569',   // Medium gray for secondary text (neutral.600)
    textInteractive: '#c2410c', // Accessible dark orange for interactive elements (accent.700)
    textSuccess: '#1d4ed8',     // Dark blue for success states (primary.700)
    
    // Glass panel colors - clean and professional
    glassPanelBg: '#ffffff',           // White background
    glassPanelBorder: '#bfdbfe',       // Light blue border (primary.200)
    glassPanelShadow: '#1e40af',       // Dark blue shadow (primary.800)
    glassPanelHover: '#f8fafc',        // Almost white on hover (neutral.50)
    
    // Input field colors - consistent and clear
    inputBg: '#ffffff',         // White background
    inputBorder: '#93c5fd',     // Medium-light blue border (primary.300)
    inputFocus: '#3b82f6',      // Bright blue focus (primary.500)
    inputPlaceholder: '#64748b', // Medium gray placeholder (neutral.500)
    
    // Button colors - ACCESSIBILITY FIXED
    buttonPrimary: '#1d4ed8',   // Dark, accessible blue (primary.700)
    buttonSecondary: '#e2e8f0', // Light gray secondary (neutral.200)
    buttonText: '#ffffff',      // White text for high contrast on dark buttons
    buttonHover: '#1e40af',     // Darker blue hover (primary.800)
    
    // Resize handle colors - consistent with theme
    resizeHandleBg: '#bfdbfe',   // Light blue (primary.200)
    resizeHandleBorder: '#1e40af', // Dark blue border (primary.800)
    resizeHandleShadow: '#1e40af', // Dark blue shadow (primary.800)
    resizeHandleHoverBg: '#93c5fd', // Medium-light blue hover (primary.300)
    resizeHandleHoverBorder: '#1e3c72', // Darkest blue hover border (primary.900)
    resizeHandleHoverShadow: '#1e3c72', // Darkest blue hover shadow (primary.900)
  },
};
