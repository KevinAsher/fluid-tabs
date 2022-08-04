/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import VitePluginStyleInject from 'vite-plugin-style-inject';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),

    // TODO: watch for official solution for styles injection for libraries in vite:
    // https://github.com/vitejs/vite/issues/1579#issuecomment-1185532227
    // For now, we use this plugin.
    VitePluginStyleInject(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.ts',
  },
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/lib/index.ts'),
      name: 'ReactFluidTabs',
      fileName: 'react-fluid-tabs',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'animated-scroll-to'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          'animated-scroll-to': 'animateScrollTo'
        },
      },
    },
  },
});