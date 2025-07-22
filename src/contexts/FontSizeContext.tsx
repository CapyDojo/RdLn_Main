import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type FontSize = 'small' | 'medium' | 'large';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

interface FontSizeProviderProps {
  children: ReactNode;
}

export const FontSizeProvider: React.FC<FontSizeProviderProps> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    try {
      const savedFontSize = localStorage.getItem('app-font-size');
      return savedFontSize === 'small' || savedFontSize === 'medium' || savedFontSize === 'large'
        ? savedFontSize
        : 'medium'; // Default to medium
    } catch (error) {
      console.error('Failed to load font size from localStorage:', error);
      return 'medium'; // Default to medium on error
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('app-font-size', fontSize);
      // Instead of setting global data attribute, we'll apply to specific elements
      const textInputAreas = document.querySelectorAll('.user-text-area');
      textInputAreas.forEach(element => {
        element.setAttribute('data-user-font-size', fontSize);
      });
    } catch (error) {
      console.error('Failed to save font size to localStorage:', error);
    }
  }, [fontSize]);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};
