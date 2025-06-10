import { ref, computed, nextTick } from 'vue'
import { useDeviceDetection } from './useDeviceDetection'

export interface FloatingButtonPosition {
  x: number
  y: number
}

export function useFloatingMoveButton() {
  const { isMobile, isTablet } = useDeviceDetection()
  
  // Estado do botão flutuante
  const isSelectionModeActive = ref(false)
  const buttonPosition = ref<FloatingButtonPosition>({ x: 20, y: 100 })
  const isDraggingButton = ref(false)
  const dragOffset = ref({ x: 0, y: 0 })
  
  // Job selecionado e modal de status
  const selectedJobId = ref<string | null>(null)
  const showStatusModal = ref(false)
  
  // Computadas
  const shouldShowButton = computed(() => isMobile.value || isTablet.value)
  const dragDisabled = computed(() => !isSelectionModeActive.value && shouldShowButton.value)
  
  // Carregar posição do localStorage
  const loadButtonPosition = () => {
    const saved = localStorage.getItem('floating-move-button-position')
    if (saved) {
      try {
        const position = JSON.parse(saved)
        buttonPosition.value = position
      } catch (e) {
        console.warn('Error loading button position from localStorage:', e)
      }
    }
  }
  
  // Salvar posição no localStorage
  const saveButtonPosition = () => {
    localStorage.setItem('floating-move-button-position', JSON.stringify(buttonPosition.value))
  }
  
  // Ativar/desativar modo de seleção
  const toggleSelectionMode = () => {
    isSelectionModeActive.value = !isSelectionModeActive.value
    
    // Aplicar classe CSS ao body para controlar o drag
    if (isSelectionModeActive.value) {
      document.body.classList.add('mobile-selection-mode')
    } else {
      document.body.classList.remove('mobile-selection-mode')
      // Fechar modal se estiver aberto
      closeStatusModal()
    }
  }
  
  // Funções do modal de status
  const openStatusModal = (jobId: string) => {
    selectedJobId.value = jobId
    showStatusModal.value = true
  }
  
  const closeStatusModal = () => {
    showStatusModal.value = false
    selectedJobId.value = null
  }
  
  // Funções para arrastar o botão
  const startDragButton = (event: MouseEvent | TouchEvent) => {
    isDraggingButton.value = true
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
    
    dragOffset.value = {
      x: clientX - buttonPosition.value.x,
      y: clientY - buttonPosition.value.y
    }
    
    document.addEventListener('mousemove', handleDragButton)
    document.addEventListener('touchmove', handleDragButton, { passive: false })
    document.addEventListener('mouseup', stopDragButton)
    document.addEventListener('touchend', stopDragButton)
    
    event.preventDefault()
  }
  
  const handleDragButton = (event: MouseEvent | TouchEvent) => {
    if (!isDraggingButton.value) return
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
    
    const newX = clientX - dragOffset.value.x
    const newY = clientY - dragOffset.value.y
    
    // Limitar posição dentro da viewport
    const maxX = window.innerWidth - 60 // Largura do botão
    const maxY = window.innerHeight - 60 // Altura do botão
    
    buttonPosition.value = {
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY))
    }
    
    event.preventDefault()
  }
  
  const stopDragButton = () => {
    if (!isDraggingButton.value) return
    
    isDraggingButton.value = false
    
    document.removeEventListener('mousemove', handleDragButton)
    document.removeEventListener('touchmove', handleDragButton)
    document.removeEventListener('mouseup', stopDragButton)
    document.removeEventListener('touchend', stopDragButton)
    
    // Salvar nova posição
    saveButtonPosition()
  }
  
  // Função para lidar com clique no job card
  const handleJobCardClick = (jobId: string) => {
    if (isSelectionModeActive.value) {
      openStatusModal(jobId)
      return true // Indica que o clique foi capturado
    }
    return false // Permitir comportamento padrão
  }
  
  // Inicializar
  const initialize = () => {
    loadButtonPosition()
  }
  
  // Cleanup
  const cleanup = () => {
    document.body.classList.remove('mobile-selection-mode')
    document.removeEventListener('mousemove', handleDragButton)
    document.removeEventListener('touchmove', handleDragButton)
    document.removeEventListener('mouseup', stopDragButton)
    document.removeEventListener('touchend', stopDragButton)
  }
  
  return {
    // Estado
    isSelectionModeActive,
    buttonPosition,
    isDraggingButton,
    selectedJobId,
    showStatusModal,
    
    // Computadas
    shouldShowButton,
    dragDisabled,
    
    // Métodos
    toggleSelectionMode,
    openStatusModal,
    closeStatusModal,
    startDragButton,
    handleJobCardClick,
    initialize,
    cleanup
  }
}
