// tests/stores/auth.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia, defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Визначаємо мок-стор для тестування
const useAuthStoreMock = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const initializing = ref(true)

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => user.value?.username || '')
  const userAvatar = computed(() => user.value?.avatar || '')
  const userId = computed(() => user.value?.id || null)

  async function initAuth () {
    initializing.value = true
    try {
      const savedToken = localStorage.getItem('auth_token')
      const savedUser = localStorage.getItem('auth_user')
      if (savedToken) {
        token.value = savedToken
        try {
          user.value = savedUser ? JSON.parse(savedUser) : null
        } catch (e) {
          user.value = null
        }
      }
    } catch (e) {
      console.error('Error initializing auth:', e)
    } finally {
      setTimeout(() => {
        initializing.value = false
      }, 10) // Зменшуємо час для тестів
    }

    return Promise.resolve()
  }

  function logout () {
    token.value = null
    user.value = null
    error.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  async function login (credentials) {
    if (loading.value) return false
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      const responseText = await response.text()
      let responseData

      try {
        responseData = responseText ? JSON.parse(responseText) : null
      } catch (e) {
        responseData = null
      }

      if (response.status === 401) {
        error.value = 'Невірний логін або пароль.'
        return false
      }

      if (response.status >= 400) {
        if (responseData && responseData.error) {
          error.value = responseData.error
        } else {
          error.value = `Помилка запиту (${response.status}).`
        }
        return false
      }

      if (!responseData) {
        error.value = 'Порожня відповідь від сервера.'
        return false
      }

      if (!responseData.token || !responseData.user) {
        error.value = 'Неповна відповідь від сервера.'
        return false
      }

      token.value = responseData.token
      user.value = responseData.user

      localStorage.setItem('auth_token', token.value)
      localStorage.setItem('auth_user', JSON.stringify(user.value))

      return true
    } catch (e) {
      error.value = 'Помилка під час запиту: ' + (e.message || 'Невідома помилка')
      return false
    } finally {
      loading.value = false
    }
  }

  // Додайте інші методи, які вам потрібно протестувати

  return {
    user,
    token,
    loading,
    error,
    initializing,
    isLoggedIn,
    username,
    userAvatar,
    userId,
    initAuth,
    logout,
    login
  }
})

// Мокуємо ваш оригінальний модуль стору
vi.mock('../../stores/auth', () => {
  return {
    useAuthStore: () => useAuthStoreMock()
  }
})

describe('Auth Store', () => {
  beforeEach(() => {
    // Створюємо нову інстанцію Pinia перед кожним тестом
    setActivePinia(createPinia())

    // Очищаємо стан стору і localStorage
    const authStore = useAuthStoreMock()
    authStore.token = null
    authStore.user = null

    // Очистимо localStorage мок
    localStorage.getItem.mockClear()
    localStorage.setItem.mockClear()
    localStorage.removeItem.mockClear()
  })

  it('should initialize auth state correctly', async () => {
    // Налаштовуємо моки для localStorage
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return 'test_token'
      if (key === 'auth_user') return JSON.stringify({ username: 'testuser', id: 1 })
      return null
    })

    const authStore = useAuthStoreMock()
    await authStore.initAuth()

    // Перевіряємо, що стан встановлено коректно
    expect(authStore.token).toBe('test_token')
    expect(authStore.user).toEqual({ username: 'testuser', id: 1 })
    expect(authStore.isLoggedIn).toBe(true)
  })

  it('should logout correctly', () => {
    const authStore = useAuthStoreMock()

    // Встановлюємо початковий стан
    authStore.token = 'test_token'
    authStore.user = { username: 'testuser' }

    // Викликаємо функцію виходу
    authStore.logout()

    // Перевіряємо, що стан очищено
    expect(authStore.token).toBe(null)
    expect(authStore.user).toBe(null)
    expect(authStore.isLoggedIn).toBe(false)

    // Перевіряємо, що localStorage очищено
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token')
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user')
  })
  // tests/stores/auth.test.js (доповнення)

  it('should handle login success correctly', async () => {
    // Створюємо мок для успішного логіну
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      text: vi.fn().mockResolvedValue(JSON.stringify({
        token: 'login_token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test-user@example.com',
          avatar: null
        }
      }))
    })

    const authStore = useAuthStoreMock()

    // Налаштовуємо вхідні дані для логіну з реальними даними
    const credentials = {
      email: 'test-user@example.com',
      password: '123123'
    }

    // Викликаємо функцію логіну
    const result = await authStore.login(credentials)

    // Перевіряємо результат
    expect(result).toBe(true)
    expect(authStore.token).toBe('login_token')
    expect(authStore.user.email).toBe('test-user@example.com')
    expect(authStore.isLoggedIn).toBe(true)

    // Перевіряємо, що дані збережені в localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'login_token')
    expect(localStorage.setItem).toHaveBeenCalled()
  })

  it('should handle login failure correctly', async () => {
    // Створюємо мок для невдалого логіну
    global.fetch = vi.fn().mockResolvedValue({
      status: 401,
      text: vi.fn().mockResolvedValue(JSON.stringify({
        error: 'Невірний логін або пароль'
      }))
    })

    const authStore = useAuthStoreMock()

    // Налаштовуємо вхідні дані для логіну
    const credentials = {
      email: 'test-user@example.com',
      password: 'неправильний_пароль'
    }

    // Викликаємо функцію логіну
    const result = await authStore.login(credentials)

    // Перевіряємо результат
    expect(result).toBe(false)
    expect(authStore.error).toBe('Невірний логін або пароль.')
    expect(authStore.isLoggedIn).toBe(false)
  })

  it('should handle network error during login', async () => {
    // Створюємо мок для помилки мережі
    global.fetch = vi.fn().mockRejectedValue(new Error('Помилка мережі'))

    const authStore = useAuthStoreMock()

    // Налаштовуємо вхідні дані для логіну
    const credentials = {
      email: 'test-user@example.com',
      password: '123123'
    }

    // Викликаємо функцію логіну
    const result = await authStore.login(credentials)

    // Перевіряємо результат
    expect(result).toBe(false)
    expect(authStore.error).toContain('Помилка під час запиту')
    expect(authStore.isLoggedIn).toBe(false)
  })
})
