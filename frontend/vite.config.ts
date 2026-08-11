import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

const debugSourcemap = process.env.OPENSPEC_WEBUI_SOURCEMAP === '1';

export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte(),
    paraglideVitePlugin({
      project: path.resolve(import.meta.dirname, './project.inlang'),
      outdir: path.resolve(import.meta.dirname, './src/lib/paraglide'),
      strategy: ['custom-openspec-locale', 'preferredLanguage', 'baseLocale'],
      emitTsDeclarations: true,
      emitGitIgnore: false,
      emitPrettierIgnore: false,
      emitReadme: false,
      isServer: 'import.meta.env.SSR',
    }),
  ],
  root: path.resolve(import.meta.dirname, '.'),
  resolve: {
    alias: {
      $lib: path.resolve(import.meta.dirname, './src/lib'),
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
