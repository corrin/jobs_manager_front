/**
 * Error types for optimistic concurrency control using ETags
 */

/**
 * Error thrown when a 412 Precondition Failed response is received,
 * indicating a concurrent modification conflict.
 */
export class ConcurrencyError extends Error {
  constructor(
    message: string,
    public jobId: string,
    public retry?: () => Promise<void>,
  ) {
    super(message)
    this.name = 'ConcurrencyError'
  }
}

/**
 * Configuration for ETag-based concurrency control
 */
export interface ConcurrencyConfig {
  /** Whether to enable automatic retry on conflicts */
  autoRetry: boolean
  /** Maximum number of retry attempts */
  maxRetries: number
  /** Delay between retries in milliseconds */
  retryDelay: number
}

/**
 * Default configuration for concurrency control
 */
export const DEFAULT_CONCURRENCY_CONFIG: ConcurrencyConfig = {
  autoRetry: false, // Manual retry by default for user control
  maxRetries: 1,
  retryDelay: 1000,
}

/**
 * Utility function to check if an error is a concurrency error
 */
export function isConcurrencyError(error: unknown): error is ConcurrencyError {
  return error instanceof ConcurrencyError
}

/**
 * Utility function to extract job ID from a job endpoint URL
 */
export function extractJobId(url: string): string | null {
  const match = url.match(/\/job\/rest\/jobs\/([0-9a-f-]{36})/i)
  return match ? match[1] : null
}

/**
 * Utility function to check if a URL is a job endpoint that requires ETag handling
 */
export function isJobEndpoint(url: string): boolean {
  return (
    /\/job\/rest\/jobs\//.test(url) &&
    !url.includes('/jobs/status-choices') &&
    !url.includes('/jobs/weekly-metrics')
  )
}

/**
 * Utility function to check if a URL is a job mutation endpoint requiring If-Match
 */
export function isJobMutationEndpoint(url: string): boolean {
  const mutationPatterns = [
    /\/job\/rest\/jobs\/[^\/]+\/?$/, // PUT/PATCH/DELETE on job detail
    /\/job\/rest\/jobs\/[^\/]+\/events/, // POST events
    /\/job\/rest\/jobs\/[^\/]+\/quote\/accept/, // POST quote accept
  ]

  return mutationPatterns.some((pattern) => pattern.test(url))
}
