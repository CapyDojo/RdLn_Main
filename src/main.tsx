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
// STEP 1: Import Background Language Loader (Safe, Modular)
import { BackgroundLanguageLoader } from './services/BackgroundLanguageLoader';
import { DEV_CONFIG } from './config/appConfig';

// Update document title to include Beta
document.title = 'RdLn™ Beta - Professional Text Comparison Redlining with OCR';

// BETA EXPIRY CHECK: Hard block expiry for beta version
const BETA_EXPIRY_DATE = new Date('2025-08-31T23:59:59.999Z');
const currentDate = new Date();

// Check for developer bypass
const isDeveloperMode = (typeof process !== 'undefined' && process.env?.RDLN_DEV_MODE === 'true') || 
                       (typeof window !== 'undefined' && window.location?.search?.includes('dev=true'));

if (currentDate > BETA_EXPIRY_DATE && !isDeveloperMode) {
  // Create expiry message element
  const expiryMessage = document.createElement('div');
  expiryMessage.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #1c1917 0%, #292524 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      z-index: 10000;
      padding: 20px;
      box-sizing: border-box;
    ">
      <div style="
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        padding: 40px;
        max-width: 500px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      ">
        <h1 style="margin: 0 0 20px 0; font-size: 2.5em; font-weight: 300;">RdLn™ Beta Expired</h1>
        <p style="margin: 0 0 20px 0; font-size: 1.2em; line-height: 1.6; opacity: 0.9;">
          This beta version of RdLn™ expired on August 31, 2025.
        </p>
        <p style="margin: 0 0 30px 0; font-size: 1em; line-height: 1.6; opacity: 0.7;">
          Thank you for testing RdLn™! Please contact the development team for the latest version.
        </p>
        <div style="
          display: inline-block;
          padding: 12px 24px;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          color: #60a5fa;
          font-size: 0.9em;
          font-weight: 500;
        ">
          Beta expired: ${BETA_EXPIRY_DATE.toLocaleDateString()}
        </div>
      </div>
    </div>
  `;
  
  // Replace entire page content
  document.body.innerHTML = '';
  document.body.appendChild(expiryMessage);
  
  // Prevent any further script execution
  throw new Error('Beta version expired');
}

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

// Conditional StrictMode - only in development
const AppWithProvider = (
  <ThemeProvider>
    <FontSizeProvider>
      <RdLnMemoryProvider>
        <App />
      </RdLnMemoryProvider>
    </FontSizeProvider>
  </ThemeProvider>
);

createRoot(document.getElementById('root')!).render(
  process.env.NODE_ENV === 'development' 
    ? <StrictMode>{AppWithProvider}</StrictMode>
    : AppWithProvider
);

// ELECTRON PERFORMANCE FIX: Disable OCR preloading to improve startup time
// Only load OCR services when actually needed by user
if (typeof window !== 'undefined' && !isElectron()) {
  // STEP 1b: Safe Background Language Loading (SSMR Implementation) - Web/Tauri only
  // Only schedule if the loader feature is enabled
  if (BackgroundLanguageLoader.isEnabled()) {
    // Initialize after a short delay to ensure app is fully loaded
    setTimeout(async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          // console.log('🚀 Initializing background language loading...');
        }
        await BackgroundLanguageLoader.startBackgroundLoading();
        if (process.env.NODE_ENV === 'development') {
          // console.log('✅ Background language loading started successfully');
        }
      } catch (error) {
        console.warn('⚠️ Background language loading failed (non-critical):', error);
        // Graceful degradation - app continues to work normally
      }
    }, 2000); // 2 second delay ensures app is ready
  }
} else {
  console.log('🔧 Electron detected: Skipping OCR preloading for faster startup');
}

// STEP 1c: Safe Cleanup (Reversible) - only for non-Electron
// Cleanup background loader on page unload
if (typeof window !== 'undefined' && !isElectron()) {
  if (BackgroundLanguageLoader.isEnabled()) {
    window.addEventListener('beforeunload', async () => {
      try {
        await BackgroundLanguageLoader.cleanup();
      } catch (error) {
        console.warn('Background loader cleanup error (non-critical):', error);
      }
    });
  }
}
