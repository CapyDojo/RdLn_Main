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
    isElectron: false,
    isWebDeployment: false,
    isLocalDevelopment: false
  };

  try {
    // Electron detection
    const windowElectron = typeof window !== 'undefined' && (window as any).isElectron === true;
    const processElectron = typeof process !== 'undefined' && (process as any).versions && (process as any).versions.electron;
    checks.isElectron = !!(windowElectron || processElectron);

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
    electron: '', // Electron uses file protocol
    web: '', // Web uses relative/absolute paths
    cdn: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist' // CDN fallback
  };

  // Resource paths by environment
  let resourcePaths: typeof cachedResourcePaths;

  const forceLocal = (typeof window !== 'undefined' && (window as any).TESSERACT_CONFIG && (window as any).TESSERACT_CONFIG.preferLocal === true)
                  || (typeof navigator !== 'undefined' && (navigator as any).onLine === false);

  if (env.isElectron || forceLocal) {
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
    // Local development - prefer local assets to avoid network dependency
    resourcePaths = {
      langPath: './tessdata',
      workerPath: './tesseract/worker.min.js',
      corePath: './tesseract/tesseract-core.wasm.js',
      baseUrl: baseUrls.electron
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
  if (env.isElectron) {
    return {
      ...baseConfig,
      workerBlobURL: false,
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
