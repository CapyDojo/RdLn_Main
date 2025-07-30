import { ThemeConfig } from '../../types/theme';

/**
 * Svínafellsjökull Theme
 * A noble oceanic theme inspired by House Atreides' ocean world from Dune,
 * featuring warm coastal blues, sea-foam greens, and refined aquatic elegance
 */
export const svinafellsjokullTheme: ThemeConfig = {
    name: 'svinafellsjokull',
    displayName: 'Svínafellsjökull',
    description: 'Noble oceanic theme with coastal elegance',
    background: 'linear-gradient(330deg, rgb(8, 47, 73) 0%, rgb(20, 64, 89) 25%, rgb(34, 87, 122) 63%, rgb(52, 125, 146) 85%, rgb(67, 159, 181) 100%) no-repeat fixed, radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.08) 0%, transparent 50%)',
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
            50: '#f0fdff',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a'
        },
        secondary: {
            50: '#ecfeff',
            100: '#cffafe',
            200: '#a5f3fc',
            300: '#67e8f9',
            400: '#22d3ee',
            500: '#06b6d4',
            600: '#0891b2',
            700: '#0e7490',
            800: '#155e75',
            900: '#164e63'
        },
        accent: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e'
        },
        neutral: {
            50: '#164e63',
            100: '#155e75',
            200: '#0e7490',
            300: '#0891b2',
            400: '#06b6d4',
            500: '#22d3ee',
            600: '#67e8f9',
            700: '#a5f3fc',
            800: '#ccfbf1',
            900: '#f0fdff'
        }
    },
    semanticColors: {
        // Text colors with improved contrast for legibility
        textBody: '#ffffff',           // Pure white for maximum readability
        textHeader: '#ffffff',         // White headers for strong contrast
        textSecondary: '#e0f2fe',      // Very light blue for secondary text
        textInteractive: '#bae6fd',    // Light cyan for links/buttons
        textSuccess: '#5eead4',        // Bright teal for success states

        // Glass panel colors with coastal warmth
        glassPanelBg: 'rgba(8, 47, 73, 0.18)',
        glassPanelBorder: 'rgba(52, 125, 146, 0.30)',
        glassPanelShadow: 'rgba(6, 182, 212, 0.45)',
        glassPanelHover: 'rgba(8, 47, 73, 0.30)',
        glassPanelHoverBorder: 'rgba(6, 182, 212, 0.8)',
        glassPanelHoverShadow: 'rgba(6, 182, 212, 0.6)',

        // Input field colors
        inputBg: 'rgba(8, 47, 73, 0.3)',
        inputBorder: 'rgba(52, 125, 146, 0.4)',
        inputFocus: 'rgba(6, 182, 212, 0.6)',
        inputPlaceholder: '#67e8f9',

        // Button colors with aqua accents
        buttonPrimary: 'rgba(6, 182, 212, 0.2)',
        buttonSecondary: 'rgba(20, 184, 166, 0.15)',
        buttonText: '#a5f3fc',
        buttonHover: 'rgba(6, 182, 212, 0.25)',

        // Resize handle colors
        resizeHandleBg: 'rgba(6, 182, 212, 0.15)',
        resizeHandleBorder: 'rgba(6, 182, 212, 0.3)',
        resizeHandleShadow: 'rgba(8, 145, 178, 0.2)',
        resizeHandleHoverBg: 'rgba(6, 182, 212, 0.25)',
        resizeHandleHoverBorder: 'rgba(6, 182, 212, 0.5)',
        resizeHandleHoverShadow: 'rgba(8, 145, 178, 0.3)',

        // Diff colors for document comparison
        diff: {
            additionBg: 'rgba(45, 212, 191, 0.15)',
            additionBorder: '#2dd4bf',
            additionText: '#5eead4',
            additionDecoration: '#2dd4bf',
            deletionBg: 'rgba(239, 68, 68, 0.15)',
            deletionBorder: '#ef4444',
            deletionText: '#fca5a5',
            deletionDecoration: '#ef4444'
        }
    }
};