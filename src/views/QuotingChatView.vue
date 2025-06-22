<template>
  <AppLayout>
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="navigateBack"
              class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft class="w-5 h-5" />
            </button>
            <div>
              <h1 class="text-xl font-bold text-gray-900">
                Interactive Quote Chat
              </h1>
              <p v-if="jobContext" class="text-sm text-gray-500">
                {{ jobContext.jobName }} • Job #{{ jobContext.jobNumber }} • {{ jobContext.clientName }}
              </p>
            </div>
          </div>
          
          <!-- Header Actions -->
          <div class="flex items-center space-x-2">
            <button
              @click="clearChatHistory"
              class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Reset chat"
            >
              <RotateCcw class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Chat Interface -->
      <div class="flex-1 flex flex-col min-h-0 p-6">
        <!-- Chat Messages -->
        <div class="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4">
          <div class="space-y-4">
            <!-- Chat Messages -->
            <div
              v-for="message in messages"
              :key="message._id"
              :class="[
                'flex',
                message.senderId === currentUserId ? 'justify-end' : 'justify-start'
              ]"
            >
              <div
                :class="[
                  'rounded-lg p-4 max-w-md shadow-sm',
                  message.senderId === currentUserId
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800'
                ]"
              >
                <div class="whitespace-pre-wrap">{{ message.content }}</div>
                <div class="text-xs mt-1 opacity-70">
                  {{ formatTime(message.timestamp) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="flex space-x-2">
          <div class="flex-1 relative">
            <textarea
              v-model="currentInput"
              @keydown.enter.exact.prevent="handleSendMessage"
              @keydown.enter.shift.exact="addNewLine"
              placeholder="Describe what you need fabricated..."
              class="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              :disabled="isLoading"
            />
            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf"
              @change="handleFileUpload"
              class="hidden"
              multiple
            />
            <button
              @click="triggerFileUpload"
              class="absolute bottom-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Upload files"
            >
              <Paperclip class="w-4 h-4" />
            </button>
          </div>
          <button
            @click="handleSendMessage"
            :disabled="!currentInput.trim() || isLoading"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send class="w-4 h-4" />
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Send, Paperclip, RotateCcw } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import { QuoteChatService, type VueChatMessage } from '@/services/quote-chat.service'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const fileInput = ref<HTMLInputElement>()

// Job context from route params
const jobContext = computed(() => {
  const { jobId, jobName, jobNumber, clientName } = route.query
  if (!jobId) return null
  
  return {
    jobId: String(jobId),
    jobName: String(jobName || ''),
    jobNumber: String(jobNumber || ''),
    clientName: String(clientName || '')
  }
})

// Chat state
const currentUserId = 'user-1'
const currentInput = ref('')
const isLoading = ref(false)

const messages = ref<VueChatMessage[]>([])

const handleSendMessage = async () => {
  if (!currentInput.value.trim() || isLoading.value) return
  
  const messageContent = currentInput.value.trim()
  currentInput.value = ''
  isLoading.value = true
  
  try {
    // Add user message
    const userMessage: VueChatMessage = {
      _id: `user-${Date.now()}`,
      content: messageContent,
      senderId: currentUserId,
      username: 'You',
      timestamp: new Date().toISOString(),
      system: false
    }
    messages.value.push(userMessage)

    // Save user message to database
    await saveMessage(userMessage, 'user')

    // Start assistant response with typing indicator
    const assistantMessage: VueChatMessage = {
      _id: `assistant-${Date.now()}`,
      content: 'Processing your request...',
      senderId: 'assistant-1',
      username: 'Quoting Assistant',
      timestamp: new Date().toISOString(),
      system: false
    }
    messages.value.push(assistantMessage)

    // Simulate LLM processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update assistant message with response
    assistantMessage.content = `I understand you need: "${messageContent}". Let me analyze this and calculate pricing...\n\n**Next steps:**\n1. Parse material specifications\n2. Calculate quantities using 3 methods\n3. Get supplier pricing via MCP\n4. Generate quote table`
    
    // Save assistant message to database
    await saveMessage(assistantMessage, 'assistant')
    
    // TODO: Replace with actual LLM integration
  } catch (error) {
    console.error('Chat processing failed:', error)
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage && lastMessage.senderId === 'assistant-1') {
      lastMessage.content = 'Sorry, I had trouble processing that. Please try again.'
      await saveMessage(lastMessage, 'assistant')
    }
  } finally {
    isLoading.value = false
  }
}

const addNewLine = () => {
  currentInput.value += '\n'
}

const formatTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    console.error('Error formatting time:', error)
    return 'Invalid time'
  }
}

const quoteChatService = QuoteChatService.getInstance()

const loadChatHistory = async () => {
  if (!jobContext.value?.jobId) return

  try {
    const response = await quoteChatService.getChatHistory(jobContext.value.jobId)
    
    if (response.success) {
      if (response.data.messages.length > 0) {
        // Convert backend messages to Vue chat format
        const vueMessages = response.data.messages.map(msg => 
          quoteChatService.convertToVueMessage(msg)
        )
        messages.value = vueMessages
      } else {
        // No existing messages, show welcome message
        messages.value = [
          {
            _id: 'welcome-1',
            content: `Hi! I'll help you create a quote for ${jobContext.value.jobName}.\n\nPlease describe what you need fabricated.\n\nExample: "3 stainless steel boxes, 700×700×400mm, welded seams"`,
            senderId: 'assistant-1',
            username: 'Quoting Assistant',
            timestamp: new Date().toISOString(),
            system: false
          }
        ]
      }
    }
  } catch (error) {
    console.error('Failed to load chat history:', error)
    toast.error('Failed to load chat history', {
      description: 'Could not retrieve previous conversation. Starting fresh.'
    })
  }
}

const saveMessage = async (message: VueChatMessage, role: 'user' | 'assistant') => {
  if (!jobContext.value?.jobId) return

  try {
    const backendMessage = quoteChatService.convertFromVueMessage(message, role)
    await quoteChatService.saveMessage(jobContext.value.jobId, backendMessage)
  } catch (error) {
    console.error('Failed to save chat message:', error)
    toast.error('Failed to save message', {
      description: 'Message was not saved to database'
    })
  }
}

const clearChatHistory = async () => {
  if (!jobContext.value?.jobId) return
  
  if (confirm('Are you sure you want to clear the entire chat history? This cannot be undone.')) {
    try {
      await quoteChatService.clearChatHistory(jobContext.value.jobId)
      
      // Reset to welcome message only
      messages.value = [
        {
          _id: 'welcome-1',
          content: `Hi! I'll help you create a quote for ${jobContext.value.jobName}.\n\nPlease describe what you need fabricated.\n\nExample: "3 stainless steel boxes, 700×700×400mm, welded seams"`,
          senderId: 'assistant-1',
          username: 'Quoting Assistant',
          timestamp: new Date().toISOString(),
          system: false
        }
      ]
      
      toast.success('Chat history cleared', {
        description: 'All messages have been deleted'
      })
    } catch (error) {
      console.error('Failed to clear chat history:', error)
      toast.error('Failed to clear chat history', {
        description: 'Could not delete messages from database'
      })
    }
  }
}


const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (!files || files.length === 0) return
  
  // TODO: Implement file upload to job files
  console.log('Files selected:', Array.from(files).map(f => f.name))
  
  // For now, just show toast notification
  toast.info('File upload', {
    description: `Selected ${files.length} file(s). File upload will be implemented next.`
  })
  
  // Clear the input
  target.value = ''
}

const navigateBack = () => {
  if (jobContext.value) {
    router.push({ name: 'job-edit', params: { id: jobContext.value.jobId } })
  } else {
    router.push({ name: 'kanban' })
  }
}

onMounted(async () => {
  console.log('QuotingChatView mounted')
  console.log('Route query:', route.query)
  console.log('Job context:', jobContext.value)
  
  if (!jobContext.value) {
    console.warn('No job context provided')
    return
  }
  
  console.log('Loading chat history...')
  // Load existing chat history from database
  await loadChatHistory()
  console.log('Chat history loaded')
})
</script>