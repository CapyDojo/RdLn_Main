/**
 * Centralized Application Configuration
 * SSMR: Safe, Step-by-step, Modular, Reversible configuration management
 * 
 * Single source of truth for all application constants, timeouts, limits, and settings.
 * Environment-aware configuration with development vs production optimizations.
 */

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * UI Component Configuration
 */
export const UI_CONFIG = {
  // Layout and Sizing
  PANEL_HEIGHTS: {
    MIN_INPUT_HEIGHT: 200,
    MAX_INPUT_HEIGHT: 800,
    DEFAULT_INPUT_HEIGHT: 400,
    MIN_OUTPUT_HEIGHT: 300,
    MAX_OUTPUT_HEIGHT: 18000,
    DEFAULT_OUTPUT_HEIGHT: 500,
    HEADER_FOOTER_HEIGHT: 120,
  },

  // Rendering and Performance
  RENDERING: {
    CHUNK_SIZE: 500, // Changes per render chunk - reduced for better performance granularity
    ESTIMATED_CHUNK_HEIGHT: 2500, // Pixels - reduced for smaller chunks
    INTERSECTION_MARGIN: '100px', // Reduced preload distance for better performance
    SCROLL_SYNC_THROTTLE: 16, // 60fps
    
    // Semantic Chunking Configuration
    SEMANTIC_CHUNKING: {
      ENABLED: true, // ENABLED for testing
      MAX_CONSECUTIVE_SAME_TYPE: 50, // Increase limit for longer contiguous blocks
      PRESERVE_WORD_BOUNDARIES: true,
      PRESERVE_NUMBER_PARENTHESES: true,
    },
  },

  // Animation and Transitions
  ANIMATION: {
    FOCUS_RESTORE_DELAY: 0,
    COPY_SUCCESS_DURATION: 2000,
    CANCELLATION_FEEDBACK_DELAY: 1000,
    THEME_TRANSITION_DURATION: 300,
  },

  // Input Handling
  INPUT: {
    PASTE_DETECTION_TIMEOUT: 100,
    AUTO_COMPARE_DEBOUNCE: IS_DEVELOPMENT ? 800 : 600, // Faster in prod
    OCR_PASTE_SPACING: '\n\n',
  }
} as const;

/**
 * System Resource Configuration
 */
export const SYSTEM_CONFIG = {
  // Memory and Performance Limits
  LIMITS: {
    MAX_DOCUMENT_LENGTH: 5_000_000, // 5M characters
    COMPLEX_DOCUMENT_THRESHOLD: 2_000_000, // 2M characters
    COMPLEX_CHANGES_THRESHOLD: 500_000, // 500K changes
    MIN_AVAILABLE_MEMORY: 100 * 1024 * 1024, // 100MB
    LARGE_OPERATION_THRESHOLD: 1_000_000, // 1M characters
    LARGE_OPERATION_COOLDOWN: 5000, // 5 seconds
  },

  // Processing Configuration
  PROCESSING: {
    COMPARISON_DELAY: IS_DEVELOPMENT ? 100 : 50, // Show processing state
    AUTO_COMPARE_DELAY: IS_DEVELOPMENT ? 50 : 25, // Faster auto-compare
    PROGRESS_UPDATE_THRESHOLD: 1000, // Updates per second max
  }
} as const;

/**
 * Caching Configuration  
 */
export const CACHE_CONFIG = {
  // Theme Variables Cache
  THEME: {
    ENABLED: true,
    MAX_ENTRIES: 10, // Number of themes
  },

  // OCR Service Cache
  OCR: {
    WORKER_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
    MAX_CACHED_WORKERS: 5,
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
    LANGUAGE_CACHE_EXPIRY_MS: 30 * 60 * 1000, // 30 minutes
    MAX_LANGUAGE_CACHE_ENTRIES: 50,
  },

  // General Cache Settings
  GENERAL: {
    ENABLE_AGGRESSIVE_CLEANUP: IS_PRODUCTION,
    CACHE_DEBUG_LOGGING: IS_DEVELOPMENT,
  }
} as const;

/**
 * Storage Configuration
 */
export const STORAGE_CONFIG = {
  KEYS: {
    THEME: 'rdln-theme',
    THEME_ORDER: 'rdln-theme-order',
    AUTO_COMPARE_ENABLED: 'rdln-auto-compare-enabled',
    SYSTEM_PROTECTION_ENABLED: 'rdln-system-protection-enabled',
    LAYOUT_PREFERENCE: 'rdln-layout-preference',
  },

  DEFAULTS: {
    AUTO_COMPARE_ENABLED: true,
    SYSTEM_PROTECTION_ENABLED: true,
    THEME: 'professional',
    LAYOUT: 'current',
  }
} as const;

/**
 * Development Configuration
 */
export const DEV_CONFIG = {
  LOGGING: {
    ENABLED: IS_DEVELOPMENT,
    PERFORMANCE_MONITORING: IS_DEVELOPMENT,
    CONSOLE_SUPPRESSION: !IS_DEVELOPMENT,
    ERROR_BOUNDARIES: true,
  },

  TESTING: {
    ENABLE_DEV_CONTROLS: IS_DEVELOPMENT,
    MOCK_DATA_ENABLED: IS_DEVELOPMENT,
    STRESS_TESTING_AVAILABLE: IS_DEVELOPMENT,
  },

  DEBUGGING: {
    SCROLL_SYNC_DEBUG: false, // Fixed view transition issues
    RESIZE_DEBUG: false, // Disabled to reduce console noise
    COMPARISON_DEBUG: false, // Disabled to reduce console noise
    OCR_DEBUG: true, // Enabled for OSD debugging
    SHOW_PERFORMANCE_DEBUG: false, // Disabled to reduce console noise
    SEMANTIC_CHUNKING_DEBUG: false, // Disabled to reduce console noise
  }
} as const;

/**
 * Feature Flags Configuration
 */
export const FEATURE_FLAGS = {
  // UI Features
  ENABLE_SCROLL_SYNC: true,
  ENABLE_CHUNKED_RENDERING: true,
  ENABLE_CSS_RESIZE: true,
  ENABLE_BACKGROUND_LANGUAGE_LOADING: true,

  // Performance Features
  ENABLE_WORKER_CACHING: true,
  ENABLE_THEME_CACHING: true,
  ENABLE_PROGRESSIVE_SECTIONS: true,

  // Experimental Features
  ENABLE_ADVANCED_OCR: true,
  ENABLE_PERFORMANCE_DEMO: IS_DEVELOPMENT,
  ENABLE_LAYOUT_EXPERIMENTS: IS_DEVELOPMENT,
  ENABLE_WORD_OPTIMIZED_COPY: true,
  
  // Production Features
  AUTO_SCROLL_ENABLED: IS_PRODUCTION, // Only enabled in production
  
  // Semantic Chunking Features
  ENABLE_SEMANTIC_CHUNKING: true, // ENABLED to fix contiguous chunk rendering
  
  // File export
  ENABLE_NATIVE_SAVE_PICKER: false, // when true, use showSaveFilePicker; when false, use browser downloads UI
} as const;

/**
 * Environment Information
 */
export const ENV_INFO = {
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  NODE_ENV: process.env.NODE_ENV || 'development',
  BUILD_TARGET: 'browser',
  FEATURE_LEVEL: IS_PRODUCTION ? 'stable' : 'experimental',
} as const;

/**
 * Utility function to get environment-specific config
 */
export const getConfigForEnvironment = () => ({
  ui: UI_CONFIG,
  system: SYSTEM_CONFIG,
  cache: CACHE_CONFIG,
  storage: STORAGE_CONFIG,
  dev: DEV_CONFIG,
  features: FEATURE_FLAGS,
  env: ENV_INFO,
});

/**
 * Main application configuration export
 */
export const appConfig = getConfigForEnvironment();

/**
 * Type definitions for configuration
 */
export type AppConfig = ReturnType<typeof getConfigForEnvironment>;
export type UIConfig = typeof UI_CONFIG;
export type SystemConfig = typeof SYSTEM_CONFIG;
export type CacheConfig = typeof CACHE_CONFIG;
export type StorageConfig = typeof STORAGE_CONFIG;
export type DevConfig = typeof DEV_CONFIG;
export type FeatureFlags = typeof FEATURE_FLAGS;
