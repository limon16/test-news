import { useAuthStore } from '../stores/auth.js'

export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()
  authStore.initAuth()
  nuxtApp.provide('auth', authStore)
})
