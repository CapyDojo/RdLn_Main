import React, { createContext, useContext, useState, useEffect } from 'react';

// Import layout styles directly
import '../styles/layouts/current-layout.css';

export type LayoutMode = 'current' | 'mobile';

interface LayoutContextType {
  currentLayout: LayoutMode;
  setLayout: (layout: LayoutMode) => void;
  supportsContainerQueries: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLayout, setCurrentLayout] = useState<LayoutMode>('current');
  const [supportsContainerQueries, setSupportsContainerQueries] = useState(false);

  // Check for container query support
  useEffect(() => {
    const checkContainerQuerySupport = () => {
      try {
        return CSS.supports('container-type: inline-size');
      } catch {
        return false;
      }
    };

    setSupportsContainerQueries(checkContainerQuerySupport());
  }, []);

  // CSS files are imported in index.css, so we just need to manage body classes

  // Apply layout class to body
  useEffect(() => {
    const bodyClassList = document.body.classList;
    
    // Remove all layout classes
    bodyClassList.remove('layout-current');
    
    // Add current layout class
    bodyClassList.add('layout-current');
    
    return () => {
      // Cleanup on unmount
      bodyClassList.remove('layout-current');
    };
  }, [currentLayout]);

  const setLayout = (layout: LayoutMode) => {
    setCurrentLayout(layout);
  };

  return (
    <LayoutContext.Provider value={{
      currentLayout,
      setLayout,
      supportsContainerQueries
    }}>
      {children}
    </LayoutContext.Provider>
  );
};
