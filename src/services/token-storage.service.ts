import Cookies from 'js-cookie'

const REFRESH_TOKEN_KEY = 'refresh_token'
const TOKEN_EXPIRY_DAYS = 7

export class TokenStorageService {
  storeRefreshToken(token: string): void {
    Cookies.set(REFRESH_TOKEN_KEY, token, {
      httpOnly: false, // Note: js-cookie can't set true httpOnly, handle on backend
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      expires: TOKEN_EXPIRY_DAYS
    })
  }

  getRefreshToken(): string | undefined {
    return Cookies.get(REFRESH_TOKEN_KEY)
  }

  clearRefreshToken(): void {
    Cookies.remove(REFRESH_TOKEN_KEY)
  }
}

export const tokenStorageService = new TokenStorageService()
