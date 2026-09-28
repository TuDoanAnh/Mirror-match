import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative asset paths for iFrame / CDN / subfolder hosting on Playgama & web game portals
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) {
            return 'phaser';
          }
        }
      }
    }
  }
});
