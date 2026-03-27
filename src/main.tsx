/*
 * RdLn™ - Professional Document Comparison Tool
 * Copyright (c) 2025 RdLn Team. All rights reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is proprietary to RdLn Team and may not be copied,
 * distributed, modified, or used without express written permission.
 * 
 * For licensing information, see LICENSE file.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/themes/themes.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { RdLnMemoryProvider } from './contexts/RdLnMemoryContext';
import { isElectron } from './utils/runtime';

import { DEV_CONFIG } from './config/appConfig';

// Update document title to include Beta
document.title = 'RdLn™ Open Beta - Professional Text Comparison Redlining with OCR';

// Development console control - derive from central debug flags
const ENABLE_DEV_LOGS = Object.values(DEV_CONFIG.DEBUGGING).some(Boolean);

if (process.env.NODE_ENV === 'development' && !ENABLE_DEV_LOGS) {
  // Suppress all development noise for a clean console
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalDebug = console.debug;
  const isSuppressed = (msg?: any) => {
    const s = typeof msg === 'string' ? msg : '';
    return (
      s.includes('Download the React DevTools') ||
      s.includes('orchestration:')
    );
  };

  console.log = (...args) => {
    // Only show critical app logs
    if (args[0]?.includes?.('🚀') || args[0]?.includes?.('❌')) {
      return originalLog.apply(console, args);
    }
    if (isSuppressed(args[0])) return;
  };

  console.warn = (...args) => {
    // Suppress Tesseract warnings and other noise
    if (args[0]?.includes?.('Parameter not found:') ||
      args[0]?.includes?.('Download the React DevTools') ||
      args[0]?.includes?.('🎯 CSS OUTPUT RESIZE') ||
      args[0]?.includes?.('orchestration:')) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.info = (...args) => {
    if (isSuppressed(args[0])) return;
    // Keep info quiet by default unless critical markers
    if (args[0]?.includes?.('🚀') || args[0]?.includes?.('❌')) {
      return originalInfo.apply(console, args);
    }
  };

  console.debug = (...args) => {
    if (isSuppressed(args[0])) return;
    // Fully suppress debug unless specifically critical
    if (args[0]?.includes?.('🚀') || args[0]?.includes?.('❌')) {
      return originalDebug.apply(console, args);
    }
  };
}

// Conditional StrictMode - only in development, never in Electron builds
const AppWithProvider = (
  <ThemeProvider>
    <FontSizeProvider>
      <RdLnMemoryProvider>
        <App />
      </RdLnMemoryProvider>
    </FontSizeProvider>
  </ThemeProvider>
);

const shouldUseStrictMode = process.env.NODE_ENV === 'development' && !isElectron();

createRoot(document.getElementById('root')!).render(
  shouldUseStrictMode
    ? <StrictMode>{AppWithProvider}</StrictMode>
    : AppWithProvider
);




