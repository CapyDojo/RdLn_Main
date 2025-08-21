/**
 * Centralized Path Configuration Service
 * 
 * Single source of truth for all environment-specific path resolution.
 * Loads environment configurations once and caches them for reuse.
 * Eliminates duplicate environment detection logic across services.
 */

import { DEV_CONFIG } from './appConfig';

// Cached environment detection results
let cachedEnvironment: {
  isTauri: boolean;
  isElectron: boolean;
  isWebDeployment: boolean;
  isLocalDevelopment: boolean;
} | null = null;

// Cached resource paths
let cachedResourcePaths: {
  langPath: string;
  workerPath: string;
  corePath: string;
  baseUrl: string;
} | null = null;

/**
 * Detect the current runtime environment once and cache the result
 */
async function detectEnvironment(): Promise<typeof cachedEnvironment> {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  const checks = {
    isTauri: false,
    isElectron: false,
    isWebDeployment: false,
    isLocalDevelopment: false
  };

  try {
    // Tauri detection
    checks.isTauri = typeof window !== 'undefined' && (
      (window as any).__TAURI__ ||
      (window as any).__TAURI_INTERNALS__ ||
      window.location.protocol === 'tauri:' ||
      (typeof navigator !== 'undefined' && navigator.userAgent.includes('Tauri'))
    );

    // Electron detection
    checks.isElectron = typeof window !== 'undefined' && (window as any).isElectron === true;

    // Web deployment detection (production web)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      checks.isWebDeployment = window.location.protocol.startsWith('http') &&
                            !hostname.includes('localhost') &&
                            !hostname.includes('127.0.0.1') &&
                            !hostname.includes('192.168.');
    }

    // Local development detection
    checks.isLocalDevelopment = DEV_CONFIG.LOGGING.ENABLED || process.env.NODE_ENV === 'development';

    cachedEnvironment = checks;
    
    if (DEV_CONFIG.LOGGING.ENABLED) {
      console.log('🔍 Environment detection:', checks);
    }

    return cachedEnvironment;
  } catch (error) {
    console.warn('Environment detection failed, using web defaults:', error);
    cachedEnvironment = {
      isTauri: false,
      isElectron: false,
      isWebDeployment: true,
      isLocalDevelopment: false
    };
    return cachedEnvironment;
  }
}

/**
 * Get environment-specific resource paths with caching
 */
export async function getResourcePaths() {
  if (cachedResourcePaths) {
    return cachedResourcePaths;
  }

  const env = await detectEnvironment();

  // Base URLs for different environments
  const baseUrls = {
    tauri: '', // Tauri uses asset protocol
    electron: '', // Electron uses file protocol
    web: '', // Web uses relative/absolute paths
    cdn: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist' // CDN fallback
  };

  // Resource paths by environment
  let resourcePaths: typeof cachedResourcePaths;

  if (env.isTauri) {
    resourcePaths = {
      langPath: '/tessdata',
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/tesseract-core.wasm.js',
      baseUrl: baseUrls.tauri
    };
  } else if (env.isElectron) {
    resourcePaths = {
      langPath: './tessdata',
      workerPath: './tesseract/worker.min.js',
      corePath: './tesseract/tesseract-core.wasm.js',
      baseUrl: baseUrls.electron
    };
  } else if (env.isWebDeployment) {
    // Production web deployment - use CDN for optimal performance
    resourcePaths = {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      workerPath: `${baseUrls.cdn}/worker.min.js`,
      corePath: `${baseUrls.cdn}/tesseract-core.wasm.js`,
      baseUrl: baseUrls.cdn
    };
  } else {
    // Local development - use local assets
    resourcePaths = {
      langPath: '/tessdata',
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/tesseract-core.wasm.js',
      baseUrl: baseUrls.web
    };
  }

  cachedResourcePaths = resourcePaths;

  if (DEV_CONFIG.LOGGING.ENABLED) {
    console.log('🔧 Resource paths configured:', resourcePaths);
  }

  return resourcePaths;
}

/**
 * Get Tesseract.js worker configuration for the current environment
 */
export async function getTesseractConfig(onProgress?: (progress: number) => void) {
  const paths = await getResourcePaths();
  const env = await detectEnvironment();

  const baseConfig = {
    logger: (m: any) => {
      if (m.status === 'loading tesseract core' && onProgress) {
        onProgress(m.progress || 0);
      }
      if (DEV_CONFIG.LOGGING.ENABLED) {
        console.log('[Tesseract]', m);
      }
    },
    workerPath: paths.workerPath,
    corePath: paths.corePath,
    langPath: paths.langPath.endsWith('/') ? paths.langPath : paths.langPath + '/',
  };

  // Environment-specific optimizations
  if (env.isTauri) {
    return {
      ...baseConfig,
      // Tauri-specific optimizations
      workerBlobURL: false,
      gzip: false,
      cacheMethod: 'none',
      // Use locateFile for complete path control
      locateFile: (path: string, prefix: string) => {
        if (path.includes('tesseract-core') || path.includes('simd') || path.includes('lstm')) {
          return paths.corePath;
        }
        if (path.includes('worker')) {
          return paths.workerPath;
        }
        return prefix + path;
      }
    };
  }

  if (env.isElectron) {
    return {
      ...baseConfig,
      workerBlobURL: false,
      gzip: false
    };
  }

  if (env.isLocalDevelopment) {
    return {
      ...baseConfig,
      gzip: false
    };
  }

  return baseConfig;
}

/**
 * Clear cached configurations (useful for testing)
 */
export function clearPathCache() {
  cachedEnvironment = null;
  cachedResourcePaths = null;
  if (DEV_CONFIG.LOGGING.ENABLED) {
    console.log('🧹 Path configuration cache cleared');
  }
}

/**
 * Get current environment info for debugging
 */
export async function getEnvironmentInfo() {
  const env = await detectEnvironment();
  const paths = await getResourcePaths();
  return {
    environment: env,
    resourcePaths: paths,
    timestamp: new Date().toISOString()
  };
}