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
        return 'Requisição inválida - verifique os dados enviados'
      case 401:
        return 'Não autorizado - faça login novamente'
      case 403:
        return 'Acesso negado - você não tem permissão para esta operação'
      case 404:
        return 'Recurso não encontrado'
      case 422:
        return 'Dados inválidos fornecidos'
      case 500:
        return 'Erro interno do servidor - tente novamente mais tarde'
      case 502:
        return 'Servidor indisponível temporariamente'
      case 503:
        return 'Serviço temporariamente indisponível'
      default:
        return `Erro HTTP ${axiosError.response?.status || 'desconhecido'}`
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
  return 'Erro desconhecido na operação'
}

/**
 * Extrai mensagens de erro específicas para operações de quote
 */
export function extractQuoteErrorMessage(error: unknown): string {
  const baseMessage = extractErrorMessage(error)

  // Mensagens específicas para erros comuns de quote
  if (baseMessage.includes('No master quote template URL')) {
    return 'Template de orçamento não configurado - configure o template master nas configurações da empresa'
  }

  if (baseMessage.includes('Sheet not found')) {
    return 'Planilha não encontrada - verifique se a planilha ainda existe no Google Drive'
  }

  if (baseMessage.includes('Permission denied')) {
    return 'Permissão negada - verifique se o aplicativo tem acesso à planilha'
  }

  if (baseMessage.includes('Invalid sheet format')) {
    return 'Formato de planilha inválido - use o template oficial para orçamentos'
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
