import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// Set default base URL and enable credentials for httpOnly cookies
// Determine API base URL based on current environment
const getApiBaseUrl = () => {
  // Use environment variable if available
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('Using API base URL from environment:', import.meta.env.VITE_API_BASE_URL)
    return import.meta.env.VITE_API_BASE_URL
  }

  // Default to localhost for development
  return 'http://localhost:8001'
}

axios.defaults.baseURL = getApiBaseUrl()
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

      // With httpOnly cookies, if we get 401, the session is invalid
      // Just logout and redirect to login
      await authStore.logout()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default axios
