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
import { madripoorTheme } from './definitions/madripoor';
import { caladanTheme } from './definitions/caladan';
import { auroraBorealisTheme } from './definitions/aurora-borealis';
import { lothlorienTheme } from './definitions/lothlorien';
import { svinafellsjokullTheme } from './definitions/svinafellsjokull';

// Import utilities
export { hexToRgb, hexToRgba } from './utils/colors';

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
  'madripoor': madripoorTheme,
  'caladan': caladanTheme,
  'ocean-deep': caladanTheme, // Using caladanTheme as placeholder
  'aurora-borealis': auroraBorealisTheme,
  'lothlorien': lothlorienTheme,
  'svinafellsjokull': svinafellsjokullTheme,
  'autumn': professionalTheme, // Using professionalTheme as placeholder
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
  caladanTheme,
  auroraBorealisTheme,
  lothlorienTheme,
  svinafellsjokullTheme,
};
