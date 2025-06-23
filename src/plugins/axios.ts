import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

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
axios.defaults.timeout = 20000 // 20 seconds for all requests
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
  },
)

// Response interceptor - handle auth errors
let isRedirecting = false // Flag to prevent multiple redirects

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()
    const isAuthError = error.response?.status === 401
    const currentPath = router.currentRoute.value.path
    const isOnLoginPage = currentPath === '/login'

    // Only handle auth errors if we're not already on login page and not already redirecting
    if (isAuthError && !isOnLoginPage && !isRedirecting) {
      console.warn('Authentication failed - cookies may have expired')

      isRedirecting = true

      try {
        // Clear user state using the store's logout method
        await authStore.logout()

        // Use router navigation instead of window.location to prevent conflicts
        await router.push({ name: 'login', query: { redirect: currentPath } })
      } catch (redirectError) {
        console.error('Error during auth redirect:', redirectError)
        // Fallback to window redirect if router fails
        window.location.href = '/login'
      } finally {
        // Reset flag after a short delay to allow for page transition
        setTimeout(() => {
          isRedirecting = false
        }, 1000)
      }
    }

    return Promise.reject(error)
  },
)

export default axios
