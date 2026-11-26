import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),

    VitePWA({
      // Registrasi dan pembaruan Service Worker
      registerType: "autoUpdate",

      // Identitas aplikasi KriyaLoka
      manifest: {
        name: "KriyaLoka",
        short_name: "KriyaLoka",
        description:
          "Marketplace produk kreatif dan kerajinan lokal Indonesia.",
        theme_color: "#4F5B2A",
        background_color: "#F5EFE3",
        display: "standalone",
        start_url: "/",
        scope: "/",
      },

      // Pengaturan cache aset aplikasi
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        navigateFallback: "/index.html",

        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
      },

      // Service Worker tidak diaktifkan saat development
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
