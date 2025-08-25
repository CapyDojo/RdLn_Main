import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Use absolute paths for web deployment (Netlify), relative for Electron
  const isElectronBuild = env.ELECTRON_BUILD === 'true';
  const base = isElectronBuild ? './' : '/';

  return {
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || mode || 'development'),
      'process.env.REACT_APP_POSTHOG_API_KEY': JSON.stringify(env.REACT_APP_POSTHOG_API_KEY || env.POSTHOG_KEY || ''),
      'process.env.REACT_APP_POSTHOG_HOST': JSON.stringify(env.REACT_APP_POSTHOG_HOST || env.POSTHOG_HOST || ''),
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
