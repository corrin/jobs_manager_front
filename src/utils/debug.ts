// Debug logging - enable via: VITE_DEBUG=true npm run test:e2e
const isDevelopment = import.meta.env.MODE === 'development'
const envDebug = import.meta.env.VITE_DEBUG === 'true'

function isEnabled(): boolean {
  return isDevelopment || envDebug
}

export function debugLog(...args: unknown[]): void {
  if (isEnabled()) {
    console.log('[DEBUG]', ...args)
  }
}

export const isDebugEnabled = isEnabled
