export function extractErrorMessage(error: unknown, fallbackMessage = 'An error occurred'): string {
  if (!error) {
    return fallbackMessage
  }

  if (typeof error === 'object' && 'response' in error) {
    const apiError = error as { response?: { data?: unknown } }
    const responseData = apiError.response?.data

    if (responseData) {
      return responseData.error || responseData.message || responseData.details || fallbackMessage
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && 'message' in error) {
    const messageError = error as { message: unknown }
    if (typeof messageError.message === 'string') {
      return messageError.message
    }
  }

  if (typeof error === 'string') {
    return error
  }

  return fallbackMessage
}

export function createErrorToast() {
  return {
    duration: 0,
    action: {
      label: 'Dismiss',
      onClick: () => {},
    },
  }
}

export function isAuthenticationError(error: unknown): boolean {
  const possibleErrorObject = typeof error === 'object' && error !== null ? error : null
  const responseStatus =
    possibleErrorObject && 'response' in possibleErrorObject
      ? (possibleErrorObject as { response?: { status?: number } }).response?.status
      : undefined
  const messageValue =
    typeof error === 'string'
      ? error
      : possibleErrorObject && 'message' in possibleErrorObject
        ? (possibleErrorObject as { message?: unknown }).message
        : undefined
  const messageText = typeof messageValue === 'string' ? messageValue : undefined

  return responseStatus === 401 || messageText?.includes('auth') || false
}
