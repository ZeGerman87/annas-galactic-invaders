import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  test: { globals: true, environment: 'jsdom' },
  plugins: [
    VitePWA({
      selfDestroying: true, // ship a service worker that unregisters the old one + clears caches (kills stale-cache problem)
      registerType: 'autoUpdate',
      includeAssets: ['assets/sprites/*.png'],
      manifest: {
        name: "Anna's Galactic Invaders",
        short_name: 'Galactic Invaders',
        background_color: '#0f0f32',
        theme_color: '#0f0f32',
        display: 'fullscreen',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
