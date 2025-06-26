import axios from 'axios'
import { useRouter } from 'vue-router'

export function useXeroAuth() {
  const router = useRouter()

  function startLogin() {
    const next = encodeURIComponent(router.currentRoute.value.fullPath)
    window.location.href = `/api/xero/authenticate?next=${next}`
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
