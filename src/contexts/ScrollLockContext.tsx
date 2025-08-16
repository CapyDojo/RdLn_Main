import React, { createContext, useContext, useState, useEffect } from 'react';

interface ScrollLockContextType {
  isScrollLocked: boolean;
  toggleScrollLock: () => void;
  setScrollLock: (enabled: boolean) => void;
}

const ScrollLockContext = createContext<ScrollLockContextType | undefined>(undefined);

export const useScrollLock = () => {
  const context = useContext(ScrollLockContext);
  if (!context) {
    throw new Error('useScrollLock must be used within a ScrollLockProvider');
  }
  return context;
};

export const ScrollLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to enabled for production-ready feature
  const [isScrollLocked, setIsScrollLocked] = useState(() => {
    // Try to load from localStorage for user preference persistence
    try {
      const saved = localStorage.getItem('scroll-lock-enabled');
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load scroll lock preference from localStorage:', error);
    }
    return true; // Default enabled for production
  });

  // Save preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('scroll-lock-enabled', JSON.stringify(isScrollLocked));
    } catch (error) {
      console.warn('Failed to save scroll lock preference to localStorage:', error);
    }
  }, [isScrollLocked]);

  const toggleScrollLock = () => {
    setIsScrollLocked(prev => !prev);
  };

  const setScrollLock = (enabled: boolean) => {
    setIsScrollLocked(enabled);
  };

  return (
    <ScrollLockContext.Provider value={{
      isScrollLocked,
      toggleScrollLock,
      setScrollLock
    }}>
      {children}
    </ScrollLockContext.Provider>
  );
};