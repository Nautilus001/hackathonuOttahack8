// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(), // Now this won't be corrupted
    nodePolyfills({
      globals: {
        global: true, // Only injects where 'global' is actually accessed
      },
    }),
  ],
  resolve: {
    alias: {
      solace: 'solclientjs/lib-browser/solclient-full.js'
    }
  }
})