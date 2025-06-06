import axios from 'axios'
import type { LoginCredentials, LoginResponse, User } from '@/types/auth.types'

const API_BASE_URL = 'http://localhost:8000'

class AuthService {
  private getApiUrl(endpoint: string): string {
    return `${API_BASE_URL}${endpoint}`
  }

  async authenticate(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(
      this.getApiUrl('/accounts/api/token/'),
      credentials
    )
    return response.data
  }

  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    const response = await axios.post<{ access: string }>(
      this.getApiUrl('/accounts/api/token/refresh/'),
      { refresh: refreshToken }
    )
    return response.data
  }

  async getCurrentUser(): Promise<User> {
    const response = await axios.get<User>(
      this.getApiUrl('/accounts/me/')
    )
    return response.data
  }

  async logout(): Promise<void> {
    try {
      await axios.post(this.getApiUrl('/accounts/logout/'))
    } catch (error) {
      // Backend logout failure is not critical
      console.warn('Backend logout failed:', error)
    }
  }

  setAuthorizationHeader(token: string): void {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  clearAuthorizationHeader(): void {
    delete axios.defaults.headers.common['Authorization']
  }
}

export const authService = new AuthService()
