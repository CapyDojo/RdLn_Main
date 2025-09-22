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

  // Optional explicit overrides provided by the host page (e.g., Electron template)
  // If present, these take precedence to avoid variant auto-selection issues.
  const userCfg = (typeof window !== 'undefined' && (window as any).TESSERACT_CONFIG)
    ? (window as any).TESSERACT_CONFIG as Partial<{ langPath: string; workerPath: string; corePath: string }>
    : null;

  // Base URLs for different environments - Updated for v6.0.1 with SIMD support
  const baseUrls = {
    electron: '', // Electron uses file protocol
    web: '', // Web uses relative/absolute paths
    // Updated for v6: Use directory paths to enable automatic SIMD detection
    cdn_worker: 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',
    cdn_core: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0', // Directory path for SIMD auto-detection
    cdn_base: 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist'
  };

  // Resource paths by environment
  let resourcePaths: typeof cachedResourcePaths;

  const forceLocal = (typeof window !== 'undefined' && (window as any).TESSERACT_CONFIG && (window as any).TESSERACT_CONFIG.preferLocal === true)
                  || (typeof navigator !== 'undefined' && (navigator as any).onLine === false);

  if (env.isElectron || forceLocal) {
    // Prefer explicit overrides if provided via window.TESSERACT_CONFIG
    // This helps packaged Electron builds avoid missing variant files
    // by pointing directly at the known-present shim (e.g., tesseract-core.wasm.js).
    resourcePaths = {
      langPath: userCfg?.langPath ?? './tessdata',
      workerPath: userCfg?.workerPath ?? './tesseract/worker.min.js',
      corePath: userCfg?.corePath ?? './tesseract', // Default to directory (auto-select) if no override
      baseUrl: baseUrls.electron
    };
  } else if (env.isWebDeployment) {
    // Production web deployment - use CDN v6.0.1 with SIMD auto-detection
    resourcePaths = {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      workerPath: baseUrls.cdn_worker,
      corePath: baseUrls.cdn_core, // Directory path enables SIMD auto-detection
      baseUrl: baseUrls.cdn_base
    };
  } else {
    // Local development - use CDN v6.0.1 with SIMD for parity and speed
    resourcePaths = {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      workerPath: baseUrls.cdn_worker,
      corePath: baseUrls.cdn_core, // Directory path enables SIMD auto-detection
      baseUrl: baseUrls.cdn_base
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
