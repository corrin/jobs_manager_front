import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import { useXeroAuth } from '../composables/useXeroAuth'

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  return 'http://localhost:8001'
}

axios.defaults.baseURL = getApiBaseUrl()
axios.defaults.timeout = 20000
axios.defaults.withCredentials = true

axios.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

let isRedirecting = false

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()
    const isAuthError = error.response?.status === 401
    const currentPath = router.currentRoute.value.path
    const isOnLoginPage = currentPath === '/login'
    if (error.response?.data?.redirect_to_auth) {
      const { startLogin } = useXeroAuth()
      startLogin()
      return Promise.reject(error)
    }
    if (isAuthError && !isOnLoginPage && !isRedirecting) {
      console.warn('Authentication failed - cookies may have expired')

      isRedirecting = true

      try {
        await authStore.logout()

        await router.push({ name: 'login', query: { redirect: currentPath } })
      } catch (redirectError) {
        console.error('Error during auth redirect:', redirectError)

        window.location.href = '/login'
      } finally {
        setTimeout(() => {
          isRedirecting = false
        }, 1000)
      }
    }

    return Promise.reject(error)
  },
)

export default axios
