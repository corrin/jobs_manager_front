import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import type { User, LoginCredentials } from '@/types/auth.types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)

  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.first_name} ${user.value.last_name}`.trim()
  })

  // Helper methods
  const clearError = (): void => {
    error.value = null
  }

  const setLoading = (loading: boolean): void => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string): void => {
    error.value = errorMessage
  }

  // Check if user is logged in by attempting to get current user
  const userIsLogged = async (): Promise<boolean> => {
    try {
      const response = await api.get<User>('/accounts/me/')
      user.value = response.data
      return true
    } catch (error) {
      user.value = null
      return false
    }
  }

  // Public actions
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setLoading(true)
    clearError()

    try {
      // Authenticate with backend - this sets httpOnly cookies
      await api.post('/accounts/api/token/', credentials)
      
      // Get user data to populate store
      const userResponse = await api.get<User>('/accounts/me/')
      user.value = userResponse.data
      
      return true
    } catch (err: any) {
      user.value = null
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message ||
                          'Erro no login. Verifique se o servidor está executando.'
      setError(errorMessage)
      console.error('Login error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      // Call backend logout to clear httpOnly cookies
      await api.post('/accounts/logout/')
    } catch (err) {
      console.warn('Backend logout failed:', err)
    } finally {
      // Clear user state
      user.value = null
      clearError()
    }
  }

  const initializeAuth = async (): Promise<void> => {
    // Simply check if user is logged in
    // httpOnly cookies will be sent automatically if they exist
    await userIsLogged()
  }

  return {
    // State
    user,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    fullName,

    // Actions
    login,
    logout,
    userIsLogged,
    initializeAuth
  }
})
