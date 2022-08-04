import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-fluid-tabs': 'react-fluid-tabs/index.ts',
    },

  },
  build: {
    sourcemap: true,
  },
})
