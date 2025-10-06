/**
 * HELPER FOR AXIOS SETUP - used for manual requests when the generated client is not suitable or is missing some endpoint. It should be slowly replaced by the generated client.
 */

import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import { useXeroAuth } from '../composables/useXeroAuth'
import { debugLog } from '@/utils/debug'
import {
  isJobEndpoint,
  isJobMutationEndpoint,
  extractJobId,
  ConcurrencyError,
} from '@/types/concurrency'
import { toast } from 'vue-sonner'

// Global registry for ETag management to avoid circular imports
let etagManager: {
  getETag: (jobId: string) => string | null
  setETag: (jobId: string, etag: string) => void
} | null = null

let jobReloadManager: {
  reloadJobOnConflict: (jobId: string) => Promise<void>
} | null = null

// Function to set up the ETag manager after Vue app initialization
export function setupETagManager(manager: {
  getETag: (jobId: string) => string | null
  setETag: (jobId: string, etag: string) => void
}) {
  etagManager = manager
}

// Function to set up the job reload manager after Vue app initialization
export function setupJobReloadManager(manager: {
  reloadJobOnConflict: (jobId: string) => Promise<void>
}) {
  jobReloadManager = manager
}

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  return 'http://localhost:8001'
}

axios.defaults.baseURL = getApiBaseUrl()
axios.defaults.timeout = 60000
axios.defaults.withCredentials = true

axios.interceptors.request.use(
  (config) => {
    // Add If-Match header for job mutation endpoints
    const url = config.url || ''
    if (isJobMutationEndpoint(url)) {
      const jobId = extractJobId(url)
      if (jobId && etagManager) {
        const etag = etagManager.getETag(jobId)
        if (etag) {
          config.headers['If-Match'] = etag
          debugLog(`[ETags] Added If-Match header for ${url}:`, etag)
        }
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

let isRedirecting = false

axios.interceptors.response.use(
  (response) => {
    // Capture ETag from job endpoint responses
    const url = response.config.url || ''
    const etag = response.headers['etag']

    if (etag && isJobEndpoint(url)) {
      const jobId = extractJobId(url)
      if (jobId && etagManager) {
        etagManager.setETag(jobId, etag)
        debugLog(`[ETags] Captured ETag for ${url}:`, etag)
      }
    }

    return response
  },
  async (error) => {
    const authStore = useAuthStore()
    const isAuthError = error.response?.status === 401
    const currentPath = router.currentRoute.value.path
    const isOnLoginPage = currentPath === '/login'
    if (error.response?.data?.redirect_to_auth) {
      const { loginXero } = useXeroAuth()
      loginXero()
      return Promise.reject(error)
    }
    // Handle concurrency conflicts (412 Precondition Failed)
    if (error.response?.status === 412) {
      const url = error.config?.url || ''
      const jobId = extractJobId(url)

      if (jobId && jobReloadManager) {
        debugLog(`[ETags] Concurrency conflict detected for job ${jobId}, reloading data`)

        // Reload job data to get fresh ETag
        try {
          await jobReloadManager.reloadJobOnConflict(jobId)
          debugLog(`[ETags] Successfully reloaded job ${jobId} after concurrency conflict`)
        } catch (reloadError) {
          debugLog(`[ETags] Failed to reload job ${jobId}:`, reloadError)
        }

        // Show user notification
        toast.error(
          'This job was updated by another user. Data reloaded. Please retry your changes.',
        )

        // Create and throw ConcurrencyError
        const concurrencyError = new ConcurrencyError(
          'This job was updated by another user. Data reloaded. Please retry your changes.',
          jobId,
        )

        return Promise.reject(concurrencyError)
      }
    }

    // Handle 428 Precondition Required (missing If-Match)
    if (error.response?.status === 428) {
      const url = error.config?.url || ''
      const jobId = extractJobId(url)

      if (jobId && jobReloadManager) {
        debugLog(`[ETags] Missing ETag for job ${jobId}, reloading data`)

        // Reload job data to get ETag
        try {
          await jobReloadManager.reloadJobOnConflict(jobId)
          debugLog(`[ETags] Successfully reloaded job ${jobId} to get ETag`)
        } catch (reloadError) {
          debugLog(`[ETags] Failed to reload job ${jobId}:`, reloadError)
        }

        // Show user notification
        toast.error('Missing version information. Job data reloaded. Please retry your changes.')

        // Create and throw ConcurrencyError
        const concurrencyError = new ConcurrencyError(
          'Missing version information. Job data reloaded. Please retry your changes.',
          jobId,
        )

        return Promise.reject(concurrencyError)
      }
    }

    if (isAuthError && !isOnLoginPage && !isRedirecting) {
      debugLog('Authentication failed - cookies may have expired')

      isRedirecting = true

      try {
        await authStore.logout()

        await router.push({ name: 'login', query: { redirect: currentPath } })
      } catch (redirectError) {
        debugLog('Error during auth redirect:', redirectError)

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
