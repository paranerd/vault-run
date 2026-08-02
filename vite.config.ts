import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/vault-run/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vault-mark.svg'],
      manifest: {
        name: 'Vault Run',
        short_name: 'Vault Run',
        description: 'Baue dein Goldgeschäft zur sicheren Logistikmaschine aus.',
        theme_color: '#fffdf8',
        background_color: '#f4f0e6',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/vault-run/',
        icons: [
          { src: 'vault-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
})
