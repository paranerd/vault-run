import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/vault-run/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vault-mark.png', 'sprites/*.png', 'fonts/*.woff2'],
      manifest: {
        name: 'Vault Run',
        short_name: 'Vault Run',
        description: 'Schürfe Gold und errichte ein sagenhaftes Schatzreich.',
        theme_color: '#4a291b',
        background_color: '#17120f',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/vault-run/',
        icons: [
          { src: 'vault-mark.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
})
