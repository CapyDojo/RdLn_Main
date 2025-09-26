import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), ['REACT_APP_', 'VITE_']);
  
  // Use absolute paths for web deployment (Netlify), relative for Electron
  const isElectronBuild = env.ELECTRON_BUILD === 'true' || process.env.ELECTRON_BUILD === 'true';
  const base = isElectronBuild ? './' : '/';

  // Ensure build tooling sees production mode for packaged Electron bundles
  if (isElectronBuild) {
    process.env.NODE_ENV = 'production';
  } else if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = mode === 'production' ? 'production' : 'development';
  }

  // Get environment variables from process.env (for Netlify) or loaded env
  // Try VITE_ prefixed variables first, then REACT_APP_ for compatibility
  const postHogApiKey = process.env.VITE_POSTHOG_API_KEY || env.VITE_POSTHOG_API_KEY || 
                       process.env.REACT_APP_POSTHOG_API_KEY || env.REACT_APP_POSTHOG_API_KEY || 
                       process.env.POSTHOG_KEY || env.POSTHOG_KEY || '';
  const postHogHost = process.env.VITE_POSTHOG_HOST || env.VITE_POSTHOG_HOST || 
                      process.env.REACT_APP_POSTHOG_HOST || env.REACT_APP_POSTHOG_HOST || 
                      process.env.POSTHOG_HOST || env.POSTHOG_HOST || '';

  const alias = isElectronBuild
    ? { 'posthog-js': path.resolve(__dirname, 'src/mocks/posthogStub.ts') }
    : {};

  return {
    resolve: {
      alias,
    },
    plugins: [react({
      // Ensure automatic JSX runtime for all builds
      jsxRuntime: 'automatic'
    })],
    define: {
      'process.env.NODE_ENV': JSON.stringify(isElectronBuild ? 'production' : (process.env.NODE_ENV || env.NODE_ENV || mode || 'development')),
      'process.env.REACT_APP_POSTHOG_API_KEY': JSON.stringify(postHogApiKey),
      'process.env.REACT_APP_POSTHOG_HOST': JSON.stringify(postHogHost),
      // Ensure React is in production mode for Electron builds
      '__DEV__': JSON.stringify(!isElectronBuild && mode !== 'production'),
    },
    esbuild: {
      jsx: 'automatic',
      jsxDev: !isElectronBuild && mode !== 'production',
    },
    optimizeDeps: {
      exclude: isElectronBuild ? ['lucide-react', 'posthog-js'] : ['lucide-react'],
    },
    server: {
      host: 'localhost',
      port: 5173,
      hmr: {
        port: 5173,
        overlay: false, // Disable error overlay to prevent WebSocket issues
      },
      strictPort: false, // Allow port fallback
    },
    base,
    build: {
      assetsDir: 'assets',
      // Ensure proper minification for production
      minify: isElectronBuild ? 'terser' : 'esbuild',
      // Valid esbuild targets: use 'esnext' for Electron, stable 'es2018' for web
      target: isElectronBuild ? 'esnext' : 'es2018',
      // Sourcemap for debugging if needed
      sourcemap: false,
      rollupOptions: {
        external: (id) => {
          // Handle optional rollup native dependencies
          if (id.includes('@rollup/rollup-')) return false;
          return false;
        },
        output: {
          assetFileNames: (assetInfo) => {
            // Special handling for Electron assets
            if (isElectronBuild) {
              if (assetInfo.name?.endsWith('.woff2') || assetInfo.name?.endsWith('.woff')) {
                return 'fonts/[name][extname]';
              }
              if (assetInfo.name?.endsWith('.traineddata')) {
                return 'tessdata/[name][extname]';
              }
              if (assetInfo.name?.includes('tesseract')) {
                return 'tesseract/[name][extname]';
              }
            }
            return 'assets/[name]-[hash][extname]';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
      // Enhanced asset inclusion for Electron
      assetsInclude: isElectronBuild ? [
        '**/*.woff2',
        '**/*.woff', 
        '**/*.ttf',
        '**/*.traineddata',
        '**/*.wasm.js',
        '**/*.worker.js'
      ] : undefined,
      copyPublicDir: true,
    },
  };
});
