import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          // Could split code if needed, but single chunk is fine for MVP
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
});
