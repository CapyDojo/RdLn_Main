import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), ['REACT_APP_', 'VITE_']);
  
  // Use absolute paths for web deployment (Netlify), relative for Electron
  const isElectronBuild = env.ELECTRON_BUILD === 'true';
  const base = isElectronBuild ? './' : '/';

  // Get environment variables from process.env (for Netlify) or loaded env
  // Try VITE_ prefixed variables first, then REACT_APP_ for compatibility
  const postHogApiKey = process.env.VITE_POSTHOG_API_KEY || env.VITE_POSTHOG_API_KEY || 
                       process.env.REACT_APP_POSTHOG_API_KEY || env.REACT_APP_POSTHOG_API_KEY || 
                       process.env.POSTHOG_KEY || env.POSTHOG_KEY || '';
  const postHogHost = process.env.VITE_POSTHOG_HOST || env.VITE_POSTHOG_HOST || 
                      process.env.REACT_APP_POSTHOG_HOST || env.REACT_APP_POSTHOG_HOST || 
                      process.env.POSTHOG_HOST || env.POSTHOG_HOST || '';

  return {
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || env.NODE_ENV || mode || 'development'),
      'process.env.REACT_APP_POSTHOG_API_KEY': JSON.stringify(postHogApiKey),
      'process.env.REACT_APP_POSTHOG_HOST': JSON.stringify(postHogHost),
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
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
      rollupOptions: {
        external: (id) => {
          // Handle optional rollup native dependencies
          if (id.includes('@rollup/rollup-')) return false;
          return false;
        },
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
    },
  };
});
