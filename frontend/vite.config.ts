import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const debugSourcemap = process.env.OPENSPEC_WEBUI_SOURCEMAP === '1';

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  root: path.resolve(__dirname, '.'),
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, './src/lib'),
    },
  },
  base: '/',
  build: {
    outDir: '../dist-frontend',
    emptyOutDir: true,
    sourcemap: debugSourcemap,
  },
  server: {
    host: '127.0.0.1',
    port: 3002,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
      '/ws': {
        target: 'ws://127.0.0.1:3001',
        ws: true,
      },
    },
  },
});
