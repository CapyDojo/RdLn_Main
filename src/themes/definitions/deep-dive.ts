import { ThemeConfig } from '../../types/theme';
import { GLASSMORPHISM_EFFECTS } from '../utils/effects';

/**
 * Deep Dive Theme
 * A sophisticated deep ocean theme with calming blue gradients
 * and subtle lighting effects for a prestigious, professional look
 */
export const deepDiveTheme: ThemeConfig = {
  name: 'deep-dive',
  displayName: 'Deep Dive',
  description: 'Sophisticated deep blue gradient theme',
  background: 'linear-gradient(330deg,rgb(6, 28, 49) 0%, rgb(17, 44, 75) 25%,rgb(26, 53, 96) 63%,rgb(39, 69, 133) 85%,rgb(54, 84, 166) 100%) no-repeat fixed, radial-gradient(circle at 20% 30%, rgba(74, 106, 191, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(74, 106, 191, 0.15) 0%, transparent 50%)',
  effects: GLASSMORPHISM_EFFECTS.premium,
  colors: {
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
      900: '#0c4a6e'
    },
    secondary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    },
    accent: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95'
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
  }
};
