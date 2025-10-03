import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: "Jewellery Price Calculator",
        short_name: "GoldCalc",
        icons: [
        { src: "icon-512.png", sizes: "512x512", type: "image/png" }
        ],
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff"
      }
    })
  ]
})
