import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// Set default base URL
axios.defaults.baseURL = 'http://localhost:8000'
axios.defaults.timeout = 10000

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()

    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const authStore = useAuthStore()
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshSuccess = await authStore.refreshAccessToken()

      if (refreshSuccess) {
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${authStore.token}`
        return axios(originalRequest)
      } else {
        // Refresh failed, redirect to login
        await authStore.logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default axios
