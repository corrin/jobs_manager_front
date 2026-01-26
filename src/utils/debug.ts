// Debug logging - enable via:
//   VITE_DEBUG=true npm run test:e2e
//   or in browser: localStorage.setItem('debug', 'true')
const isDevelopment = import.meta.env.MODE === 'development'
const envDebug = import.meta.env.VITE_DEBUG === 'true'

function isEnabled(): boolean {
  if (isDevelopment || envDebug) return true
  try {
    return localStorage.getItem('debug') === 'true'
  } catch {
    return false
  }
}

export function debugLog(...args: unknown[]): void {
  if (isEnabled()) {
    console.log('[DEBUG]', ...args)
  }
}

export const isDebugEnabled = isEnabled
