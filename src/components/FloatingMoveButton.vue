<template>
  <Teleport to="body">
    <!-- Botão Flutuante -->
    <div
      v-if="shouldShowButton"
      ref="floatingButton"
      class="fixed w-14 h-14 md:w-16 md:h-16 rounded-full bg-white border-2 border-gray-300 shadow-lg cursor-grab z-[1000] transition-all duration-300 ease-in-out select-none touch-none"
      :class="{
        'bg-blue-500 border-blue-600 scale-105 shadow-blue-400/40': isSelectionModeActive,
        'cursor-grabbing scale-110 shadow-xl': isDraggingButton
      }"
      :style="{
        left: `${buttonPosition.x}px`,
        top: `${buttonPosition.y}px`
      }"
      @mousedown="startDragButton"
      @touchstart="startDragButton"
      @click="handleButtonClick"
    >
      <div class="flex items-center justify-center w-full h-full relative">
        <Move
          :class="[
            'w-6 h-6 md:w-7 md:h-7 transition-colors duration-300',
            { 'text-white': isSelectionModeActive, 'text-blue-600': !isSelectionModeActive }
          ]"
        />
      </div>

      <!-- Indicador de modo ativo -->
      <div v-if="isSelectionModeActive" class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
        <div class="w-full h-full rounded-full bg-green-500 animate-pulse"></div>
      </div>
    </div>

    <!-- Modal de Seleção de Status -->
    <MoveJobModal
      :is-open="showStatusModal"
      :job-id="selectedJobId"
      :job-number="selectedJobNumber"
      :current-status="selectedJobCurrentStatus"
      @close="closeStatusModal"
      @move="handleMoveJob"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Move, X } from 'lucide-vue-next'
import { useFloatingMoveButton } from '@/composables/useFloatingMoveButton'
import MoveJobModal from '@/components/MoveJobModal.vue'
import type { StatusChoice } from '@/types'

interface Props {
  statusChoices: StatusChoice[]
}

interface Emits {
  (event: 'move-job', data: { jobId: string; newStatus: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const floatingButton = ref<HTMLElement>()

// Dados adicionais do job selecionado
const selectedJobNumber = ref<string>('')
const selectedJobCurrentStatus = ref<string>('')

const {
  isSelectionModeActive,
  buttonPosition,
  isDraggingButton,
  selectedJobId,
  showStatusModal,
  shouldShowButton,
  toggleSelectionMode,
  closeStatusModal,
  startDragButton,
  initialize,
  cleanup
} = useFloatingMoveButton()

const handleButtonClick = (event: Event) => {
  // Só ativar/desativar se não estiver arrastando
  if (!isDraggingButton.value) {
    toggleSelectionMode()
    event.stopPropagation()
  }
}

const handleMoveJob = (data: { jobId: string; newStatus: string }) => {
  emit('move-job', data)
  closeStatusModal()
}

const moveJobToStatus = (newStatus: string) => {
  if (selectedJobId.value) {
    handleMoveJob({
      jobId: selectedJobId.value,
      newStatus
    })
  }
}

const getStatusButtonClass = (statusKey: string) => {
  const statusClasses: { [key: string]: string } = {
    'quoting': 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-800',
    'accepted-quote': 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800',
    'in-progress': 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800',
    'completed': 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-800',
    'on-hold': 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-800',
    'cancelled': 'bg-red-50 border-red-200 hover:bg-red-100 text-red-800',
    'archived': 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800'
  }

  return statusClasses[statusKey] || 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800'
}

// Expor função para uso externo
const handleJobCardClick = (jobId: string) => {
  return useFloatingMoveButton().handleJobCardClick(jobId)
}

onMounted(() => {
  initialize()
})

onUnmounted(() => {
  cleanup()
})

// Expor para uso no componente pai
defineExpose({
  handleJobCardClick,
  isSelectionModeActive
})
</script>
