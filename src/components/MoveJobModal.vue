<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center"
    @click.self="$emit('close')"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black bg-opacity-50"></div>
    
    <!-- Modal -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          Mover Job #{{ jobNumber }}
        </h3>
        <button
          @click="$emit('close')"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <!-- Content -->
      <div class="px-6 py-4">
        <p class="text-sm text-gray-600 mb-4">
          Selecione o novo status para este job:
        </p>
        
        <div class="space-y-2">
          <button
            v-for="status in availableStatuses"
            :key="status.value"
            @click="selectStatus(status.value)"
            class="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex items-center justify-between group"
            :class="{
              'border-blue-400 bg-blue-50': selectedStatus === status.value
            }"
          >
            <div class="flex items-center space-x-3">
              <div 
                class="w-3 h-3 rounded-full"
                :class="status.colorClass"
              ></div>
              <div>
                <div class="font-medium text-gray-900">{{ status.label }}</div>
                <div class="text-xs text-gray-500">{{ status.description }}</div>
              </div>
            </div>
            
            <svg 
              v-if="selectedStatus === status.value"
              class="w-5 h-5 text-blue-600" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Cancelar
        </button>
        <button
          @click="confirmMove"
          :disabled="!selectedStatus"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Mover Job
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface MoveJobModalProps {
  isOpen: boolean
  jobId: string | null
  jobNumber?: string
  currentStatus?: string
}

interface MoveJobModalEmits {
  (e: 'close'): void
  (e: 'move', payload: { jobId: string, newStatus: string }): void
}

const props = withDefaults(defineProps<MoveJobModalProps>(), {
  jobNumber: '',
  currentStatus: ''
})

const emit = defineEmits<MoveJobModalEmits>()

const selectedStatus = ref<string>('')

const statusOptions = [
  {
    value: 'pending',
    label: 'Pendente',
    description: 'Aguardando início',
    colorClass: 'bg-yellow-400'
  },
  {
    value: 'in_progress', 
    label: 'Em Progresso',
    description: 'Trabalho em andamento',
    colorClass: 'bg-blue-400'
  },
  {
    value: 'review',
    label: 'Revisão',
    description: 'Aguardando aprovação',
    colorClass: 'bg-purple-400'
  },
  {
    value: 'completed',
    label: 'Concluído',
    description: 'Trabalho finalizado',
    colorClass: 'bg-green-400'
  },
  {
    value: 'archived',
    label: 'Arquivado',
    description: 'Job arquivado',
    colorClass: 'bg-gray-400'
  }
]

const availableStatuses = computed(() => {
  return statusOptions.filter(status => status.value !== props.currentStatus)
})

const selectStatus = (status: string) => {
  selectedStatus.value = status
}

const confirmMove = () => {
  if (selectedStatus.value && props.jobId) {
    emit('move', {
      jobId: props.jobId,
      newStatus: selectedStatus.value
    })
    
    // Reset selection
    selectedStatus.value = ''
  }
}

// Reset selection when modal closes
const closeModal = () => {
  selectedStatus.value = ''
  emit('close')
}

// Watch for modal open/close to reset state
</script>
