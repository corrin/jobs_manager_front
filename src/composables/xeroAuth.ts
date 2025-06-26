import axios from 'axios'
import { useRouter } from 'vue-router'

export function useXeroAuth() {
  const router = useRouter()

  function startLogin() {
    const next = encodeURIComponent(router.currentRoute.value.fullPath)
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    const url = `${apiBase}/api/xero/authenticate?next=${next}`

    console.log('[XeroAuth] Redirecting to:', url)
    window.location.href = url
  }

  async function ensureAuth(): Promise<boolean> {
    try {
      await axios.get('/api/xero/ping', { withCredentials: true })
      return true
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { data?: { redirect_to_auth?: boolean } } }).response?.data
          ?.redirect_to_auth
      ) {
        startLogin()
      }
      return false
    }
  }

  async function guard(): Promise<boolean> {
    return await ensureAuth()
  }

  return { startLogin, guard }
}
