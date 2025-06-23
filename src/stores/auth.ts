import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/plugins/axios'
import type { User, LoginCredentials } from '@/types/auth.types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.first_name} ${user.value.last_name}`.trim()
  })

  const clearError = (): void => {
    error.value = null
  }

  const setLoading = (loading: boolean): void => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string): void => {
    error.value = errorMessage
  }

  const userIsLogged = async (): Promise<boolean> => {
    try {
      const response = await api.get<User>('/accounts/me/')
      user.value = response.data
      return true
    } catch {
      user.value = null
      return false
    }
  }

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setLoading(true)
    clearError()

    try {
      await api.post('/accounts/api/token/', credentials)

      const userResponse = await api.get<User>('/accounts/me/')
      user.value = userResponse.data

      return true
    } catch (err: unknown) {
      user.value = null
      let errorMessage = 'Login error. Check if the server is running.'
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { detail?: string; message?: string } } })
          .response
        errorMessage = response?.data?.detail || response?.data?.message || errorMessage
      }
      setError(errorMessage)
      console.error('Login error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await api.post('/accounts/logout/')
    } catch (err) {
      console.warn('Backend logout failed:', err)
    } finally {
      user.value = null
      clearError()
    }
  }

  const initializeAuth = async (): Promise<boolean> => {
    return await userIsLogged()
  }

  return {
    user,
    isLoading,
    error,

    isAuthenticated,
    fullName,

    login,
    logout,
    userIsLogged,
    initializeAuth,
  }
})
