/**
 * Main theme export file
 * Consolidates all themes and utilities for easy importing
 */

import { ThemeName, ThemeConfig } from '../types/theme';

// Import all theme definitions
import { professionalTheme } from './definitions/professional';
import { bambooTheme } from './definitions/bamboo';
import { kyotoTheme } from './definitions/kyoto';
import { newYorkTheme } from './definitions/new-york';
import { classicLightTheme } from './definitions/classic-light';
import { classicDarkTheme } from './definitions/classic-dark';
import { neonNightTheme } from './definitions/neon-night';
import { deepDiveTheme } from './definitions/deep-dive';
import { auroraBorealisTheme } from './definitions/aurora-borealis';

// Import utilities
export { hexToRgb, hexToRgba } from './utils/colors';
export { GLASSMORPHISM_EFFECTS } from './utils/effects';

export { generateColorVariables, generateGlassmorphismVariables, applyCSSVariables } from './utils/cssVariables';
export { isValidTheme, getSafeTheme, getThemeFromStorage } from './utils/validation';

/**
 * Master theme registry
 * All available themes in the application
 */
export const themeDefinitions: Record<ThemeName, ThemeConfig> = {
  professional: professionalTheme,
  bamboo: bambooTheme,
  kyoto: kyotoTheme,
  'new-york': newYorkTheme,
  'classic-light': classicLightTheme,
  'classic-dark': classicDarkTheme,
  'neon-night': neonNightTheme,
  'deep-dive': deepDiveTheme,
  'ocean-deep': deepDiveTheme, // Using deepDiveTheme as placeholder
  'aurora-borealis': auroraBorealisTheme,
} as const;

// Export individual themes for direct access
export {
  professionalTheme,
  bambooTheme,
  kyotoTheme,
  newYorkTheme,
  classicLightTheme,
  classicDarkTheme,
  neonNightTheme,
  deepDiveTheme,
  auroraBorealisTheme,
};
