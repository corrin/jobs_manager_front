/**
 * Error Handler Utilities
 *
 * Centraliza o tratamento de erros para extrair mensagens úteis
 * dos responses da API e melhorar a experiência do usuário.
 */

import { AxiosError } from 'axios'

/**
 * Extrai uma mensagem de erro legível de um erro de API
 */
export function extractErrorMessage(error: unknown): string {
  console.error('🔍 Extracting error message from:', error)

  // Se é um AxiosError (erro HTTP)
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError

    // Tratamento específico para timeouts
    if (axiosError.code === 'ECONNABORTED' && axiosError.message?.includes('timeout')) {
      return 'Operation is taking longer than expected - please wait a moment and check if it completed successfully'
    }

    // Tentar extrair mensagem do response data
    if (axiosError.response?.data) {
      const data = axiosError.response.data as any

      // Padrões comuns de mensagens de erro
      if (typeof data === 'string') {
        return data
      }

      if (data.error) {
        return data.error
      }

      if (data.message) {
        return data.message
      }

      if (data.detail) {
        return data.detail
      }

      if (data.errors) {
        if (Array.isArray(data.errors)) {
          return data.errors.join(', ')
        }
        if (typeof data.errors === 'object') {
          const errorMessages = Object.values(data.errors).flat()
          return errorMessages.join(', ')
        }
      }

      // Se o data é um objeto, tentar extrair a primeira mensagem
      if (typeof data === 'object') {
        const values = Object.values(data)
        for (const value of values) {
          if (typeof value === 'string' && value.length > 0) {
            return value
          }
        }
      }
    }

    // Fallback para status text
    if (axiosError.response?.statusText) {
      return `${axiosError.response.status}: ${axiosError.response.statusText}`
    }

    // Mensagens específicas por status code
    switch (axiosError.response?.status) {
      case 400:
        return 'Invalid request - please check the data sent'
      case 401:
        return 'Unauthorised - please log in again'
      case 403:
        return 'Access denied - you do not have permission for this operation'
      case 404:
        return 'Resource not found'
      case 422:
        return 'Invalid data provided'
      case 500:
        return 'Internal server error - please try again later'
      case 502:
        return 'Server temporarily unavailable'
      case 503:
        return 'Service temporarily unavailable'
      default:
        return `HTTP error ${axiosError.response?.status || 'unknown'}`
    }
  }

  // Se é um Error normal
  if (error instanceof Error) {
    return error.message
  }

  // Se é uma string
  if (typeof error === 'string') {
    return error
  }

  // Fallback genérico
  return 'Unknown error in operation'
}

/**
 * Extrai mensagens de erro específicas para operações de quote
 */
export function extractQuoteErrorMessage(error: unknown): string {
  const baseMessage = extractErrorMessage(error)

  // Tratamento específico para timeout em operações de quote
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError
    if (axiosError.code === 'ECONNABORTED' && axiosError.message?.includes('timeout')) {
      return 'Quote creation is taking longer than expected. The spreadsheet may have been created successfully - please refresh the page to check.'
    }
  }

  // Mensagens específicas para erros comuns de quote
  if (baseMessage.includes('No master quote template URL')) {
    return 'Quote template not configured - please configure the master template in company settings'
  }

  if (baseMessage.includes('Sheet not found')) {
    return 'Spreadsheet not found - please check if the spreadsheet still exists in Google Drive'
  }

  if (baseMessage.includes('Permission denied')) {
    return 'Permission denied - please check if the application has access to the spreadsheet'
  }

  if (baseMessage.includes('Invalid sheet format')) {
    return 'Invalid spreadsheet format - please use the official template for quotes'
  }

  return baseMessage
}

/**
 * Log estruturado de erros para debugging
 */
export function logError(context: string, error: unknown, additionalData?: any) {
  console.group(`❌ Error in ${context}`)
  console.error('Original error:', error)
  console.error('Extracted message:', extractErrorMessage(error))
  if (additionalData) {
    console.error('Additional data:', additionalData)
  }
  console.groupEnd()
}
