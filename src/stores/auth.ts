import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/plugins/axios'
import type { User, LoginCredentials } from '@/types/auth.types'
import { debugLog } from '@/utils/debug'

/**
 * @deprecated Use generated types from src/api/generated instead
 * This interface will be removed after migration to openapi-zod-client generated types
 */
interface ErrorResponse {
  detail?: string
  message?: string
  error?: string
  non_field_errors?: string[]
}

/**
 * @deprecated Use generated types from src/api/generated instead
 * This interface will be removed after migration to openapi-zod-client generated types
 */
interface AxiosErrorResponse {
  status?: number
  data?: ErrorResponse
}

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

      // Handle AxiosError specifically
      if (typeof err === 'object' && err !== null) {
        // Check if it's an AxiosError with response
        if ('response' in err) {
          const axiosError = err as { response?: AxiosErrorResponse }
          const response = axiosError.response

          if (response?.status && response.status >= 400 && response.status < 500) {
            // Extract error message from various possible fields in response data
            const responseData = response.data || {}
            const originalError =
              responseData.detail ||
              responseData.message ||
              responseData.error ||
              responseData.non_field_errors?.[0] ||
              ''

            debugLog('Server error response:', originalError)

            // Replace authentication errors with user-friendly message
            if (
              originalError === 'Invalid credentials' ||
              originalError === 'Authentication credentials not provided' ||
              originalError.toLowerCase().includes('invalid') ||
              originalError.toLowerCase().includes('authentication') ||
              originalError.toLowerCase().includes('credentials') ||
              originalError.toLowerCase().includes('password') ||
              originalError.toLowerCase().includes('email')
            ) {
              errorMessage = 'Wrong e-mail or password, please try again'
            } else if (originalError) {
              errorMessage = originalError
            } else {
              errorMessage = 'Wrong e-mail or password, please try again'
            }
          } else {
            // Server error (5xx) or no status
            errorMessage = 'Login error. Check if the server is running.'
          }
        } else if ('code' in err && (err.code === 'NETWORK_ERROR' || err.code === 'ERR_NETWORK')) {
          errorMessage = 'Network error. Please check your internet connection.'
        }
      }

      setError(errorMessage)
      debugLog('Login error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await api.post('/accounts/logout/')
    } catch (err) {
      debugLog('Backend logout failed:', err)
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
