import api from '@/plugins/axios'
import type { LoginCredentials, User } from '@/types/auth.types'

class AuthService {
  async authenticate(credentials: LoginCredentials): Promise<void> {
    await api.post('/accounts/api/token/', credentials)
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/accounts/me/')
    return response.data
  }

  async logout(): Promise<void> {
    await api.post('/accounts/logout/')
  }

  // Check if user is authenticated by attempting to get current user
  async userIsLogged(): Promise<boolean> {
    try {
      await this.getCurrentUser()
      return true
    } catch {
      return false
    }
  }
}

export const authService = new AuthService()
