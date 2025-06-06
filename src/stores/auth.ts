import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import Cookies from 'js-cookie'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_staff: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

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

  // Actions
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await axios.post<LoginResponse>(
        'http://localhost:8000/accounts/api/token/',
        credentials
      )

      const { access, refresh, user: userData } = response.data

      // Store tokens
      token.value = access
      refreshToken.value = refresh
      user.value = userData

      // Set httpOnly cookie for refresh token
      Cookies.set('refresh_token', refresh, {
        httpOnly: false, // Note: js-cookie can't set true httpOnly, but we'll handle this on backend
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax',
        expires: 7 // 7 days
      })

      // Set Authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`

      return true
    } catch (err: any) {
      console.error('Login error:', err.code || err.message || 'Network error')
      error.value = err.response?.data?.detail || 'Login error. Please check if the server is running.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      // Call backend logout endpoint if needed
      await axios.post('http://localhost:8000/accounts/logout/')
    } catch (err) {
      console.warn('Logout backend call failed:', err)
    } finally {
      // Clear local state
      token.value = null
      refreshToken.value = null
      user.value = null

      // Remove cookies
      Cookies.remove('refresh_token')

      // Remove Authorization header
      delete axios.defaults.headers.common['Authorization']
    }
  }

  const fetchCurrentUser = async (): Promise<boolean> => {
    try {
      isLoading.value = true
      const response = await axios.get<User>('http://localhost:8000/accounts/me/')
      user.value = response.data
      return true
    } catch (err) {
      console.error('Fetch user error:', err)
      await logout() // Clear invalid session
      return false
    } finally {
      isLoading.value = false
    }
  }

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const storedRefreshToken = refreshToken.value || Cookies.get('refresh_token')

      if (!storedRefreshToken) {
        await logout()
        return false
      }

      const response = await axios.post('http://localhost:8000/accounts/api/token/refresh/', {
        refresh: storedRefreshToken
      })

      token.value = response.data.access
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`

      return true
    } catch (err) {
      console.error('Token refresh error:', err)
      await logout()
      return false
    }
  }

  const initializeAuth = async (): Promise<void> => {
    const storedRefreshToken = Cookies.get('refresh_token')

    if (storedRefreshToken) {
      refreshToken.value = storedRefreshToken
      const refreshSuccess = await refreshAccessToken()

      if (refreshSuccess) {
        await fetchCurrentUser()
      }
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
