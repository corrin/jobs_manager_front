import api from './api'

export interface VueChatMessage {
  _id: string
  content: string
  senderId: string
  username: string
  timestamp: string
  system: boolean
  metadata?: Record<string, unknown>
}

export interface ChatMessage {
  message_id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface ChatHistoryResponse {
  success: boolean
  data: {
    job_id: string
    messages: ChatMessage[]
  }
}

export interface SaveMessageRequest {
  message_id: string
  role: 'user' | 'assistant'
  content: string
  metadata?: Record<string, unknown>
}

export interface SaveMessageResponse {
  success: boolean
  data: {
    message_id: string
    timestamp: string
  }
}

export interface ClearChatResponse {
  success: boolean
  data: {
    deleted_count: number
  }
}

export class QuoteChatService {
  private static instance: QuoteChatService

  static getInstance(): QuoteChatService {
    if (!this.instance) {
      this.instance = new QuoteChatService()
    }
    return this.instance
  }

  async getChatHistory(jobId: string): Promise<ChatHistoryResponse> {
    try {
      const response = await api.get<ChatHistoryResponse>(`/job/api/jobs/${jobId}/quote-chat/`)
      return response.data
    } catch (error) {
      console.error('Failed to load chat history:', error)
      throw error
    }
  }

  async saveMessage(jobId: string, message: SaveMessageRequest): Promise<SaveMessageResponse> {
    try {
      const response = await api.post<SaveMessageResponse>(
        `/job/api/jobs/${jobId}/quote-chat/`,
        message,
      )
      return response.data
    } catch (error) {
      console.error('Failed to save chat message:', error)
      throw error
    }
  }

  async updateMessage(
    jobId: string,
    messageId: string,
    updates: { content?: string; metadata?: Record<string, unknown> },
  ): Promise<SaveMessageResponse> {
    try {
      const response = await api.patch<SaveMessageResponse>(
        `/job/api/jobs/${jobId}/quote-chat/${messageId}/`,
        updates,
      )
      return response.data
    } catch (error) {
      console.error('Failed to update chat message:', error)
      throw error
    }
  }

  async clearChatHistory(jobId: string): Promise<ClearChatResponse> {
    try {
      const response = await api.delete<ClearChatResponse>(`/job/api/jobs/${jobId}/quote-chat/`)
      return response.data
    } catch (error) {
      console.error('Failed to clear chat history:', error)
      throw error
    }
  }

  convertToVueMessage(message: ChatMessage): VueChatMessage {
    return {
      _id: message.message_id,
      content: message.content,
      senderId: message.role === 'user' ? 'user-1' : 'assistant-1',
      username: message.role === 'user' ? 'You' : 'Quoting Assistant',
      timestamp: message.timestamp,
      system: false,
      metadata: message.metadata,
    }
  }

  convertFromVueMessage(
    vueMessage: VueChatMessage,
    role: 'user' | 'assistant',
  ): SaveMessageRequest {
    return {
      message_id: vueMessage._id || `${role}-${Date.now()}`,
      role,
      content: vueMessage.content,
      metadata: vueMessage.metadata || {},
    }
  }

  // ---------------------------------------------------------------------------
  // AI assistant interaction
  // ---------------------------------------------------------------------------

  /**
   * Send a user's message to the backend interaction endpoint.
   * The backend will call the configured LLM (via MCPChatService)
   * and persist the assistant's reply before returning it.
   */
  async getAssistantResponse(jobId: string, message: string): Promise<ChatMessage> {
    interface AssistantInteractionRequest {
      message: string
    }
    interface AssistantInteractionResponse {
      success: boolean
      data: ChatMessage
    }

    try {
      const response = await api.post<AssistantInteractionResponse>(
        `/job/api/jobs/${jobId}/quote-chat/interaction/`,
        { message } as AssistantInteractionRequest,
      )
      return response.data.data
    } catch (error) {
      console.error('Failed to get assistant response:', error)
      throw error
    }
  }
}
