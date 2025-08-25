import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeName, ThemeConfig } from '../types/theme';
import { themeDefinitions } from '../themes';
import { generateAllThemeVariables, applyCSSVariables } from '../themes/utils/cssVariables';
import { getThemeFromStorage } from '../themes/utils/validation';
import { trackEvent } from '../services/AnalyticsService';

interface ThemeContextType {
  currentTheme: ThemeName;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemeName) => void;
  availableThemes: ThemeConfig[];
  reorderThemes: (fromIndex: number, toIndex: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

const DEFAULT_THEME_ORDER: ThemeName[] = [
  'professional',
  'classic-light',
  'classic-dark',
  'bamboo',
  'kyoto',
  'new-york',
  'svinafellsjokull',
  'caladan',
  'lothlorien',
  'madripoor',
];

const THEME_ORDER_STORAGE_KEY = 'rdln-theme-order';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('svinafellsjokull');
  const [themeOrder, setThemeOrder] = useState<ThemeName[]>(DEFAULT_THEME_ORDER);

  // Load theme and theme order from localStorage on mount
  useEffect(() => {
    const savedTheme = getThemeFromStorage();
    setCurrentTheme(savedTheme);
    
    // Load custom theme order
    const savedOrder = localStorage.getItem(THEME_ORDER_STORAGE_KEY);
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder) as ThemeName[];
        // Validate that all themes are present and no extras
        const isValidOrder = parsedOrder.length === DEFAULT_THEME_ORDER.length &&
          parsedOrder.every(theme => DEFAULT_THEME_ORDER.includes(theme)) &&
          DEFAULT_THEME_ORDER.every(theme => parsedOrder.includes(theme));
        
        if (isValidOrder) {
          setThemeOrder(parsedOrder);
        }
      } catch (error) {
        console.warn('Invalid theme order in localStorage, using default order');
      }
    }
  }, []);

  // Apply theme variables and data-attribute
  useEffect(() => {
    const themeConfig = themeDefinitions[currentTheme];
    document.documentElement.setAttribute('data-theme', currentTheme);
    const allVariables = generateAllThemeVariables(themeConfig);
    applyCSSVariables(allVariables);
  }, [currentTheme]);

  // Apply theme background
  useEffect(() => {
    const themeConfig = themeDefinitions[currentTheme];
    document.body.style.background = themeConfig.background || '';
    // Force repaint to ensure gradients are rendered
    requestAnimationFrame(() => {
      document.body.clientWidth; // Trigger reflow
    });
  }, [currentTheme]);

  // Apply theme animations
  useEffect(() => {
    const themeConfig = themeDefinitions[currentTheme];
    document.body.style.animation = themeConfig.animation || '';

    const styleElementId = 'theme-animation-styles';
    let styleElement = document.getElementById(styleElementId) as HTMLStyleElement | null;

    if (themeConfig.animationStyles) {
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleElementId;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = themeConfig.animationStyles;
    } else if (styleElement) {
      styleElement.textContent = '';
    }
  }, [currentTheme]);

  const setTheme = (theme: ThemeName) => {
    // Track theme change
    trackEvent.themeChanged(theme);
    
    setCurrentTheme(theme);
    localStorage.setItem('rdln-theme', theme);
  };

  const reorderThemes = (fromIndex: number, toIndex: number) => {
    const newOrder = [...themeOrder];
    const [movedTheme] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedTheme);
    
    setThemeOrder(newOrder);
    localStorage.setItem(THEME_ORDER_STORAGE_KEY, JSON.stringify(newOrder));
  };

  // Create availableThemes in the custom order, filtering out any undefined themes
  const availableThemes = themeOrder
    .map(themeName => themeDefinitions[themeName])
    .filter((theme): theme is ThemeConfig => theme !== undefined);

  const value: ThemeContextType = {
    currentTheme,
    themeConfig: themeDefinitions[currentTheme],
    setTheme,
    availableThemes,
    reorderThemes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};