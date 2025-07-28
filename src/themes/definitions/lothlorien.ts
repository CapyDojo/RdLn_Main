import { ThemeConfig } from '../../types/theme';

/**
 * Lothlórien Theme
 * A soothing deep green theme inspired by the elven realm, designed for tired eyes 
 * with warm undertones and gentle lighting effects for comfortable extended use
 */
export const lothlorienTheme: ThemeConfig = {
    name: 'lothlorien',
    displayName: 'Lothlórien',
    description: 'Soothing elven forest theme for tired eyes',
    background: 'linear-gradient(330deg, rgb(15, 32, 39) 0%, rgb(21, 46, 54) 25%, rgb(28, 64, 72) 63%, rgb(34, 85, 96) 85%, rgb(44, 106, 120) 100%) no-repeat fixed, radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.05) 0%, transparent 50%)',
    effects: {
        glassmorphism: true,
        backdropBlur: '24px',
        backgroundOpacity: '0.85',
        shadowIntensity: 'ultra',
        gradientOverlay: true,
        animationLevel: 'premium',
        textureOverlay: true,
    },
    colors: {
        primary: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#0d7c47',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d'
        },
        secondary: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b'
        },
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
            900: '#78350f'
        },
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
            900: '#0f172a'
        }
    },
    semanticColors: {
        // Enhanced text colors for A+ readability
        textBody: '#d1fae5',           // Bright mint for comfortable reading
        textHeader: '#004915',         // Deep forest green for headers
        textSecondary: '#a7f3d0',      // Balanced secondary text
        textInteractive: '#0ea5e9',    // Blue accent for links/buttons
        textSuccess: '#4ade80',        // Bright green for success states

        // Glass panel colors with enhanced contrast
        glassPanelBg: 'rgba(15, 32, 39, 0.18)',
        glassPanelBorder: 'rgba(34, 85, 48, 0.30)',
        glassPanelShadow: 'rgba(21, 128, 61, 0.45)',
        glassPanelHover: 'rgba(15, 32, 39, 0.30)',
        glassPanelHoverBorder: 'rgba(34, 197, 94, 0.8)',
        glassPanelHoverShadow: 'rgba(21, 128, 61, 0.6)',

        // Input field colors
        inputBg: 'rgba(15, 32, 39, 0.3)',
        inputBorder: 'rgba(34, 85, 48, 0.4)',
        inputFocus: 'rgba(34, 197, 94, 0.6)',
        inputPlaceholder: '#a7f3d0',

        // Button colors with amber accents
        buttonPrimary: 'rgba(245, 158, 11, 0.2)',
        buttonSecondary: 'rgba(34, 197, 94, 0.15)',
        buttonText: '#d1fae5',
        buttonHover: 'rgba(34, 197, 94, 0.25)',

        // Resize handle colors
        resizeHandleBg: 'rgba(34, 197, 94, 0.15)',
        resizeHandleBorder: 'rgba(34, 197, 94, 0.3)',
        resizeHandleShadow: 'rgba(21, 128, 61, 0.2)',
        resizeHandleHoverBg: 'rgba(34, 197, 94, 0.25)',
        resizeHandleHoverBorder: 'rgba(34, 197, 94, 0.5)',
        resizeHandleHoverShadow: 'rgba(21, 128, 61, 0.3)',

        // Enhanced diff colors for document comparison
        diff: {
            additionBg: 'rgba(74, 222, 128, 0.15)',
            additionBorder: '#4ade80',
            additionText: '#86efac',
            additionDecoration: '#4ade80',
            deletionBg: 'rgba(239, 68, 68, 0.15)',
            deletionBorder: '#ef4444',
            deletionText: '#fca5a5',
            deletionDecoration: '#ef4444'
        }
    }
};