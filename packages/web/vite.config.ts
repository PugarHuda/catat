import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Stop yelling about index.js > 500 KB once we've split vendor chunks.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Group heavy deps into long-lived vendor chunks. App changes
        // (most commits) don't invalidate these so users see warm-cache
        // load times after first visit. Order matters — more-specific
        // matches go first so the broader rules don't capture them.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@mysten/walrus-wasm') || id.includes('@mysten/walrus')) return 'vendor-walrus';
          if (id.includes('@mysten/sui')) return 'vendor-sui';
          if (id.includes('@mysten/dapp-kit') || id.includes('@mysten/seal')) return 'vendor-mysten';
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (id.includes('react-dom') || /[\\\/]react[\\\/]/.test(id)) return 'vendor-react';
          // Everything else (lucide, clsx, tailwind-merge, etc.) lands
          // in a default vendor chunk — small + cacheable.
          return 'vendor-misc';
        },
      },
    },
  },
});
