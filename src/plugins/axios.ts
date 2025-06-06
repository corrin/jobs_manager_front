import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// Set default base URL and enable credentials for httpOnly cookies
axios.defaults.baseURL = 'http://localhost:8000'
axios.defaults.timeout = 10000
axios.defaults.withCredentials = true // Important: include httpOnly cookies

// Request interceptor - no need to manually add auth headers with httpOnly cookies
axios.interceptors.request.use(
  (config) => {
    // With httpOnly cookies, auth tokens are automatically included
    // No manual header setting needed
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const authStore = useAuthStore()

    if (error.response?.status === 401) {
      console.warn('Authentication failed - cookies may have expired')
      
      // Try to refresh token (the refresh endpoint should handle httpOnly cookies automatically)
      try {
        const refreshSuccess = await authStore.refreshAccessToken()
        
        if (refreshSuccess && !error.config._retry) {
          // Retry the original request
          error.config._retry = true
          return axios(error.config)
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
      }
      
      // If refresh failed or this is a retry, logout and redirect
      await authStore.logout()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default axios
