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
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        /**
         * Vendor chunking — DELIBERATELY CONSERVATIVE.
         *
         * An earlier 6-way split (react / sui / mysten / query / walrus /
         * misc) produced a blank production page: the chunks had circular
         * imports across chunk boundaries (vendor-react ↔ vendor-misc,
         * vendor-misc ↔ vendor-sui). ESM tolerates cycles WITHIN a chunk
         * but cross-chunk cycles can deadlock top-level init order →
         * `Cannot access 'X' before initialization` → React never mounts.
         *
         * Rule of thumb: only peel off packages that are LEAVES of the
         * dependency graph (nothing in the core imports them back).
         * `@mysten/walrus` qualifies — it's only imported by app code,
         * never by React/Sui/dapp-kit core. Everything else stays in one
         * `vendor` chunk where Rollup can order the cycle safely.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@mysten/walrus')) return 'vendor-walrus';
          return 'vendor';
        },
      },
    },
  },
});
