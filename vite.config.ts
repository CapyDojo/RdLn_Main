import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Use absolute paths for web deployment (Netlify), relative for Electron
  const isElectronBuild = process.env.ELECTRON_BUILD === 'true';
  const base = isElectronBuild ? './' : '/';

  return {
    plugins: [react()],
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
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
    },
  };
});
