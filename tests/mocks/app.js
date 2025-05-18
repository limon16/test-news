// tests/mocks/app.js
import { vi } from 'vitest'
import { ref, reactive, computed } from 'vue'

// Експортуємо Vue функції
export { ref, reactive, computed }

// Мокуємо Nuxt функції
export const useNuxtApp = vi.fn(() => ({
  $websocket: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    state: {
      isConnected: false
    }
  },
  hooks: {
    hookOnce: vi.fn(() => vi.fn())
  },
  $logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    logUserAction: vi.fn()
  }
}))

export const useFetch = vi.fn(() => ({
  data: { value: {} },
  error: { value: null },
  status: { value: 200 }
}))

export const defineNuxtPlugin = vi.fn((fn) => fn)
export const useRuntimeConfig = vi.fn(() => ({}))
