// tests/setup.js
import { vi } from 'vitest'

// Створюємо мок для localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Додаємо localStorage до глобального об'єкту
global.localStorage = localStorageMock

// Додаємо process.client = true для Nuxt
global.process = {
  ...global.process,
  client: true
}

// Скидаємо моки перед кожним тестом
beforeEach(() => {
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
})
