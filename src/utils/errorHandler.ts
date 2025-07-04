/**
 * Utility functions for handling and extracting error messages from API responses
 */

export interface ApiError {
  response?: {
    data?: {
      error?: string
      message?: string
      details?: string
    }
  }
  message?: string
}

/**
 * Extracts a user-friendly error message from various error formats
 *
 * @param error - The error object (could be Axios error, Error, or unknown)
 * @param fallbackMessage - Default message if no specific error found
 * @returns User-friendly error message
 */
export function extractErrorMessage(error: unknown, fallbackMessage = 'An error occurred'): string {
  if (!error) {
    return fallbackMessage
  }

  // Handle Axios errors with response data
  if (typeof error === 'object' && 'response' in error) {
    const apiError = error as ApiError
    const responseData = apiError.response?.data

    if (responseData) {
      // Try different error message fields in order of preference
      return responseData.error || responseData.message || responseData.details || fallbackMessage
    }
  }

  // Handle regular Error objects
  if (error instanceof Error) {
    return error.message
  }

  // Handle objects with message property
  if (typeof error === 'object' && 'message' in error) {
    const messageError = error as { message: unknown }
    if (typeof messageError.message === 'string') {
      return messageError.message
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  return fallbackMessage
}

/**
 * Creates a standardized error toast configuration
 *
 * @returns Toast configuration object for persistent error toasts
 */
export function createErrorToast() {
  return {
    duration: 0, // Make error toast persistent
    action: {
      label: 'Dismiss',
      onClick: () => {},
    },
  }
}
