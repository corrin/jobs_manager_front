import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8001',
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
