import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useFetch } from '#app'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => user.value?.username || '')
  const userAvatar = computed(() => user.value?.avatar || '')
  const userId = computed(() => user.value?.id || null)

  function initAuth () {
    try {
      if (import.meta.client) {
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
      }
    } catch (e) { /* empty */ }
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
        console.error('Failed to parse response JSON:', e)
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

      if (import.meta.client) {
        localStorage.setItem('auth_token', token.value)
        localStorage.setItem('auth_user', JSON.stringify(user.value))
      }

      return true
    } catch (e) {
      console.error('Login error:', e)
      error.value = 'Помилка під час запиту: ' + (e.message || 'Невідома помилка')
      return false
    } finally {
      loading.value = false
    }
  }

  async function register (userData) {
    if (loading.value) return false
    loading.value = true
    error.value = null

    try {
      const { data, status } = await useFetch('/api/auth/register', {
        method: 'POST',
        body: userData,
        lazy: true,
        immediate: false,
        ignoreResponseError: true
      })

      if (status.value >= 400) {
        error.value = data.value?.error || `Помилка реєстрації (${status.value}).`
        return false
      }

      if (!data.value) {
        error.value = 'Не отримано відповіді від сервера.'
        return false
      }

      if (data.value && data.value.error) {
        error.value = data.value.error
        return false
      }

      return true
    } catch (e) {
      console.error('Registration error:', e)
      error.value = 'Помилка під час запиту: ' + (e.message || 'Невідома помилка')
      return false
    } finally {
      loading.value = false
    }
  }

  function logout () {
    token.value = null
    user.value = null
    error.value = null
    if (import.meta.client) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  async function checkToken () {
    if (!token.value) {
      user.value = null
      return false
    }

    try {
      const { data, status } = await useFetch('/api/auth/check', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        },
        lazy: true,
        immediate: false,
        ignoreResponseError: true
      })

      if (status.value >= 400) {
        if (status.value === 401 || status.value === 403) {
          logout()
        }
        return false
      }

      if (!data.value?.valid) {
        logout()
        return false
      }

      return true
    } catch (e) {
      console.error('Token check error:', e)
      return false
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isLoggedIn,
    username,
    userAvatar,
    userId,
    initAuth,
    login,
    register,
    logout,
    checkToken
  }
})
