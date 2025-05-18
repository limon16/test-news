// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'


export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxt/icon',
    '@nuxt/image'
  ],
  css: ['~/assets/css/main.css'],

  pinia: {
    autoImports: ['defineStore', 'storeToRefs'],
    storesDirs: ['./stores/**']
  },

  vite: {
    plugins: [
      tailwindcss()
    ]
  }
})
