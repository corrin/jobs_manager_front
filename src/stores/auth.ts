import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import { tokenStorageService } from '@/services/token-storage.service'
import type { User, LoginCredentials, AuthState } from '@/types/auth.types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.first_name} ${user.value.last_name}`.trim()
  })

  // Private helper methods
  const clearAuthState = (): void => {
    token.value = null
    refreshToken.value = null
    user.value = null
    tokenStorageService.clearRefreshToken()
    authService.clearAuthorizationHeader()
  }

  const setAuthState = (accessToken: string, refreshTokenValue: string, userData: User): void => {
    token.value = accessToken
    refreshToken.value = refreshTokenValue
    user.value = userData

    tokenStorageService.storeRefreshToken(refreshTokenValue)
    authService.setAuthorizationHeader(accessToken)
  }

  const clearError = (): void => {
    error.value = null
  }

  const setLoading = (loading: boolean): void => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string): void => {
    error.value = errorMessage
  }

  // Public actions
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setLoading(true)
    clearError()

    try {
      const response = await authService.authenticate(credentials)
      const { access, refresh, user: userData } = response

      setAuthState(access, refresh, userData)
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Login error. Please check if the server is running.'
      setError(errorMessage)
      console.error('Login error:', err.code || err.message || 'Network error')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await authService.logout()
    } catch (err) {
      console.warn('Logout backend call failed:', err)
    } finally {
      clearAuthState()
    }
  }

  const fetchCurrentUser = async (): Promise<boolean> => {
    setLoading(true)

    try {
      const userData = await authService.getCurrentUser()
      user.value = userData
      return true
    } catch (err) {
      console.error('Fetch user error:', err)
      await logout() // Clear invalid session
      return false
    } finally {
      setLoading(false)
    }
  }

  const refreshAccessToken = async (): Promise<boolean> => {
    const storedRefreshToken = refreshToken.value || tokenStorageService.getRefreshToken()

    if (!storedRefreshToken) {
      await logout()
      return false
    }

    try {
      const response = await authService.refreshToken(storedRefreshToken)
      token.value = response.access
      authService.setAuthorizationHeader(response.access)
      return true
    } catch (err) {
      console.error('Token refresh error:', err)
      await logout()
      return false
    }
  }

  const initializeAuth = async (): Promise<void> => {
    const storedRefreshToken = tokenStorageService.getRefreshToken()

    if (!storedRefreshToken) {
      return
    }

    refreshToken.value = storedRefreshToken
    const refreshSuccess = await refreshAccessToken()

    if (refreshSuccess) {
      await fetchCurrentUser()
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    fullName,

    // Actions
    login,
    logout,
    fetchCurrentUser,
    refreshAccessToken,
    initializeAuth
  }
})
