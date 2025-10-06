import { Zodios } from '@zodios/core'
import axios from 'axios'
import { endpoints } from './generated/api'
import { debugLog } from '../utils/debug'
import {
  isJobEndpoint,
  isJobMutationEndpoint,
  extractJobId,
  ConcurrencyError,
} from '../types/concurrency'
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

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  return 'http://localhost:8000'
}

// Configure axios instance for the client
axios.defaults.baseURL = getApiBaseUrl()
axios.defaults.timeout = 60000
axios.defaults.withCredentials = true

// Add ETag interceptors to the client axios instance
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

        // Show persistent user notification with retry option
        toast.error('This job was updated by another user. Data reloaded.', {
          duration: Infinity, // Don't auto-dismiss
          action: {
            label: 'Retry',
            onClick: () => {
              // The user can manually retry their action
              // This will be handled by the component that initiated the request
            },
          },
        })

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

        // Show persistent user notification with retry option
        toast.error('Missing version information. Job data reloaded.', {
          duration: Infinity, // Don't auto-dismiss
          action: {
            label: 'Retry',
            onClick: () => {
              // The user can manually retry their action
              // This will be handled by the component that initiated the request
            },
          },
        })

        // Create and throw ConcurrencyError
        const concurrencyError = new ConcurrencyError(
          'Missing version information. Job data reloaded. Please retry your changes.',
          jobId,
        )

        return Promise.reject(concurrencyError)
      }
    }

    return Promise.reject(error)
  },
)

let _api: InstanceType<typeof Zodios<typeof endpoints>> | null = null

export function getApi(): InstanceType<typeof Zodios<typeof endpoints>> {
  if (!_api) {
    _api = new Zodios(getApiBaseUrl(), endpoints, { axiosInstance: axios })
  }
  return _api
}

export const api = getApi()
