import axios from 'axios'

// Determine API base URL based on current environment
const getApiBaseUrl = () => {

  // Use environment variable if available
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  // Default to localhost for development
  return 'http://localhost:8001'
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor for response debugging
api.interceptors.response.use(
  response => {
    return response
  },
  error => {
    console.error('API Error Response:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    })
    return Promise.reject(error)
  }
)

export default api
