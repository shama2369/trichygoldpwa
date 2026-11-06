import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(
      (process.env.RAILWAY_GIT_COMMIT_SHA || 'local').slice(0, 7)
    )
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  plugins: [
    react(),
    // selfDestroying clears stuck old service workers (Basic Auth was blocking SW updates)
    VitePWA({
      registerType: 'autoUpdate',
      selfDestroying: true,
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifestFilename: 'manifest.webmanifest',
      manifest: {
        id: '/',
        name: "Trichy Gold Calculator",
        short_name: "TrichyGold",
        description: "Professional jewelry price calculator for Trichy Gold",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
        ],
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#7c3aed",
        orientation: "portrait",
        categories: ["business", "productivity", "utilities"]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ]
})
