<template>
  <div>    <!-- Botão Flutuante Movimentável -->
    <div
      ref="draggableButton"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
      class="fixed z-[100]"
      @mousedown="startDrag"
      @touchstart.passive="handleTouchStart"
    >      <button
        @click="handleButtonClick"
        @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        class="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2.5 sm:p-3 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center relative cursor-pointer border-2 border-white"
        :class="{ 
          'bg-blue-700': showArchived,
          'bg-green-500 scale-110 shadow-xl border-2 border-white': isDragOver,
          'animate-pulse': isDragOver
        }"
        style="min-width: 56px; min-height: 56px;"
      >
        <Archive class="h-5 w-5" v-if="archivedCount === 0" />
        <div v-else class="flex items-center justify-center">
          <Archive class="h-5 w-5 mr-2" />
          <span 
            class="px-2 py-1 bg-white text-blue-600 text-xs font-bold rounded-full min-w-[20px] text-center"
          >
            {{ archivedCount }}
          </span>
        </div>
        
        <!-- Drop indicator -->
        <div 
          v-if="isDragOver" 
          class="absolute inset-0 rounded-full border-2 border-white border-dashed animate-ping"
        ></div>
      </button>
    </div>    <!-- Overlay com Grid de Jobs Arquivados -->
    <div
      v-if="showArchived"
      class="fixed inset-0 z-40 bg-gray-900 bg-opacity-10"
      :class="{ 'pointer-events-none': isArchivedJobDragging }"
      @click="closeArchive"
    >
      <div
        class="absolute inset-x-4 top-32 bottom-16 bg-white bg-opacity-85 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200"
        :class="{ 'pointer-events-auto': !isArchivedJobDragging }"
        @click.stop
      >
        <!-- Header do Overlay -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <div class="flex items-center">
            <Archive class="mr-2 h-5 w-5 text-gray-600" />
            <h2 class="text-lg font-semibold text-gray-900">Archived Jobs</h2>
            <span class="ml-2 px-2 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-full">
              {{ archivedCount }}
            </span>
          </div>
          <button
            @click="closeArchive"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X class="h-6 w-6" />
          </button>
        </div>        <!-- Grid de Jobs Arquivados com Scroll -->
        <div class="p-4 h-full overflow-y-auto">
          <div
            ref="archivedJobsGrid"
            data-status="archived"
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 h-fit"
          >            <div
              v-for="job in archivedJobs"
              :key="job.id"
              :data-id="job.id"
              @mousedown="handleJobMouseDown($event, job)"
              class="bg-gray-100 p-3 rounded-lg border border-gray-300 shadow-sm cursor-move hover:bg-gray-50 hover:shadow-md transition-all duration-200 hover:scale-105 select-none"
              @click="$emit('job-click', job)"
              @job-ready="$emit('job-ready', $event)"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-sm font-bold text-gray-600">#{{ job.job_number }}</span>
                <span class="px-2 py-1 rounded-full text-xs font-semibold bg-orange-200 text-orange-800">
                  Archived
                </span>
              </div>
              <h4 class="font-semibold text-gray-800 text-sm mb-2 line-clamp-2 leading-tight">
                {{ job.name }}
              </h4>
              <p class="text-sm text-gray-600 mb-2 line-clamp-2 leading-tight">
                {{ job.description }}
              </p>
              <div class="text-sm text-gray-500 space-y-1">
                <p class="truncate font-medium">{{ job.client_name }}</p>
                <p v-if="job.contact_person" class="truncate">{{ job.contact_person }}</p>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="archivedJobs.length === 0" class="col-span-full text-center py-8">
              <Archive class="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p class="text-gray-500">No archived jobs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Archive, X } from 'lucide-vue-next'
import type { Job } from '@/types'

interface FloatingArchivedButtonProps {
  archivedJobs: Job[]
  archivedCount: number
}

interface FloatingArchivedButtonEmits {
  (e: 'job-click', job: Job): void
  (e: 'job-ready', payload: { jobId: string, element: HTMLElement }): void
  (e: 'sortable-ready', element: HTMLElement, status: string): void
  (e: 'archive-job', jobId: string): void
}

const props = defineProps<FloatingArchivedButtonProps>()
const emit = defineEmits<FloatingArchivedButtonEmits>()

// Estado do overlay
const showArchived = ref(false)

// Posição do botão (salva no localStorage) - Posicionamento melhor para tablets
const getInitialPosition = () => {
  const savedPosition = localStorage.getItem('floating-archived-button-position')
  if (savedPosition) {
    const parsed = JSON.parse(savedPosition)
    // Verificar se a posição salva é válida (dentro da tela)
    const maxX = window.innerWidth - 80 // Largura do botão
    const maxY = window.innerHeight - 80 // Altura do botão
    
    if (parsed.x >= 0 && parsed.x <= maxX && parsed.y >= 100 && parsed.y <= maxY) {
      return parsed
    }
  }
    // Posição padrão baseada no tamanho da tela
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
    if (windowWidth < 768) {
    // Mobile: posição no canto inferior direito, mais visível e acessível
    return { 
      x: Math.max(15, windowWidth - 80), // 15px da direita, botão menor para mobile
      y: Math.max(100, windowHeight - 120) // 120px do fundo para melhor visibilidade
    }
  } else if (windowWidth < 1024) {
    // Tablet: posição lateral direita, meio da tela
    return { 
      x: Math.max(20, windowWidth - 100),
      y: Math.max(120, Math.min(250, windowHeight / 2))
    }
  } else {
    // Desktop: posição padrão
    return { 
      x: 20, 
      y: Math.max(120, Math.min(250, windowHeight / 2))
    }
  }
}

const position = ref(getInitialPosition())

// Refs
const draggableButton = ref<HTMLElement>()
const archivedJobsGrid = ref<HTMLElement>()

// Variáveis de drag
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// Variáveis de drop para arquivar jobs
const isDragOver = ref(false)

// Variáveis para distinguir entre drag e click
const touchStartTime = ref(0)
const hasMoved = ref(false)

// Variável para controlar quando um job arquivado está sendo arrastado
const isArchivedJobDragging = ref(false)
const currentDraggedJob = ref<Job | null>(null)
const ghostElement = ref<HTMLElement | null>(null)

// Criar elemento ghost que segue o cursor
const createGhostElement = (job: Job) => {
  const ghost = document.createElement('div')
  ghost.className = 'fixed z-[9999] pointer-events-none bg-white rounded-lg shadow-xl border-2 border-blue-300 p-3 max-w-xs transform -translate-x-1/2 -translate-y-1/2 opacity-90'
  ghost.innerHTML = `
    <div class="flex justify-between items-start mb-2">
      <span class="text-sm font-bold text-gray-600">#${job.job_number}</span>
      <span class="px-2 py-1 rounded-full text-xs font-semibold bg-blue-200 text-blue-800">
        Moving...
      </span>
    </div>
    <h4 class="font-semibold text-gray-800 text-sm mb-1">${job.name}</h4>
    <p class="text-sm text-gray-500 truncate">${job.client_name}</p>
  `
  document.body.appendChild(ghost)
  return ghost
}

// Atualizar posição do ghost element
const updateGhostPosition = (clientX: number, clientY: number) => {
  if (ghostElement.value) {
    ghostElement.value.style.left = clientX + 'px'
    ghostElement.value.style.top = clientY + 'px'
  }
}

// Remover ghost element
const removeGhostElement = () => {
  if (ghostElement.value) {
    document.body.removeChild(ghostElement.value)
    ghostElement.value = null
  }
}

// Event listeners para movimento do mouse
const handleGlobalMouseMove = (event: MouseEvent) => {
  if (isArchivedJobDragging.value && ghostElement.value) {
    updateGhostPosition(event.clientX, event.clientY)
  }
}

const handleGlobalMouseUp = (event: MouseEvent) => {
  if (isArchivedJobDragging.value) {
    // Verificar se o drop foi em uma coluna do kanban
    const elementUnderMouse = document.elementFromPoint(event.clientX, event.clientY)
    const kanbanColumn = elementUnderMouse?.closest('[data-status]') as HTMLElement
    
    if (kanbanColumn && kanbanColumn.dataset.status !== 'archived' && currentDraggedJob.value) {
      console.log(`Dropping job ${currentDraggedJob.value.id} on column ${kanbanColumn.dataset.status}`)
      
      // Simular um evento de drop para o kanban
      const dropEvent = new CustomEvent('archived-job-drop', {
        detail: {
          jobId: currentDraggedJob.value.id,
          targetStatus: kanbanColumn.dataset.status,
          jobData: currentDraggedJob.value
        }
      })
      
      // Disparar evento no elemento da coluna
      kanbanColumn.dispatchEvent(dropEvent)
      
      // Fechar overlay
      setTimeout(() => {
        closeArchive()
      }, 100)
    }
    
    // Limpar estado
    cleanupDragState()
  }
}

const cleanupDragState = () => {
  isArchivedJobDragging.value = false
  currentDraggedJob.value = null
  removeGhostElement()
  
  // Remover classe de drag de todos os elementos que possam ter
  document.querySelectorAll('.dragging-archived-job').forEach(el => {
    el.classList.remove('dragging-archived-job')
  })
  
  // Restaurar overlay
  const overlay = document.querySelector('.fixed.inset-0.z-40') as HTMLElement
  if (overlay) {
    overlay.style.opacity = '1'
    overlay.style.pointerEvents = ''
  }
  
  // Remover listeners globais
  document.removeEventListener('mousemove', handleGlobalMouseMove)
  document.removeEventListener('mouseup', handleGlobalMouseUp)
}

// Carrega posição salva do localStorage
onMounted(() => {
  // Recarregar posição usando a função getInitialPosition
  position.value = getInitialPosition()
  console.log('FloatingArchivedButton mounted at position:', position.value)
  console.log('Window dimensions:', { width: window.innerWidth, height: window.innerHeight })
  
  // Adicionar listeners globais para drag de jobs arquivados
  document.addEventListener('mousemove', handleGlobalMouseMove)
  document.addEventListener('mouseup', handleGlobalMouseUp)
})

// Salva posição no localStorage
const savePosition = () => {
  localStorage.setItem('floating-archived-button-position', JSON.stringify(position.value))
}

// Inicia o drag
const startDrag = (event: MouseEvent | TouchEvent) => {
  if (showArchived.value) return // Não permitir drag quando overlay estiver aberto
  
  isDragging.value = true
  hasMoved.value = false
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  dragOffset.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  }
  
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onDragMove, { passive: false })
  document.addEventListener('touchend', onDragEnd)
  
  event.preventDefault()
}

// Manipula touch start para mobile
const handleTouchStart = (event: TouchEvent) => {
  touchStartTime.value = Date.now()
  hasMoved.value = false
  
  // Se for um toque longo, inicia o drag
  setTimeout(() => {
    if (!hasMoved.value && isDragging.value === false) {
      startDrag(event)
    }
  }, 500) // 500ms para toque longo
}

// Manipula clique do botão
const handleButtonClick = (event: MouseEvent) => {
  // Só abre se não estiver sendo arrastado
  if (!isDragging.value && !hasMoved.value) {
    toggleArchive()
  }
}

// Move o botão durante o drag
const onDragMove = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  
  hasMoved.value = true
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  position.value = {
    x: Math.max(0, Math.min(window.innerWidth - 100, clientX - dragOffset.value.x)),
    y: Math.max(0, Math.min(window.innerHeight - 60, clientY - dragOffset.value.y))
  }
  
  // Previne scroll no mobile
  if ('touches' in event) {
    event.preventDefault()
  }
}

// Finaliza o drag
const onDragEnd = () => {
  if (isDragging.value) {
    isDragging.value = false
    savePosition()
  }
  
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
}

// Toggle do overlay
const toggleArchive = () => {
  if (isDragging.value) return // Não abrir se estiver sendo arrastado
  
  showArchived.value = !showArchived.value
  
  if (showArchived.value) {
    nextTick(() => {
      if (archivedJobsGrid.value) {
        emit('sortable-ready', archivedJobsGrid.value, 'archived')
      }
    })
  }
}

// Fecha o overlay
const closeArchive = () => {
  showArchived.value = false
}

// Funções de drag'n'drop para arquivar jobs
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  // Só remove o estado se realmente saiu do botão
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isDragOver.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  try {
    let jobId: string | null = null
    let fromStatus: string | null = null
    
    // Primeiro tenta acessar dados globais de drag (mais confiável)
    const globalDragData = (window as any).__dragData
    if (globalDragData) {
      jobId = globalDragData.jobId
      fromStatus = globalDragData.fromStatus
      console.log('Using global drag data:', globalDragData)
    } else {
      // Fallback: tenta dados do dataTransfer
      const sortableData = event.dataTransfer?.getData('text/plain')
      const jsonData = event.dataTransfer?.getData('application/json')
      
      if (sortableData) {
        // Se SortableJS forneceu dados
        const draggedElement = document.querySelector(`[data-id="${sortableData}"]`) as HTMLElement
        if (draggedElement) {
          jobId = sortableData
          const parentContainer = draggedElement.closest('[data-status]') as HTMLElement
          fromStatus = parentContainer?.dataset.status || null
        }
      } else if (jsonData) {
        // Tenta JSON
        const dragData = JSON.parse(jsonData)
        jobId = dragData.jobId
        fromStatus = dragData.fromStatus
      }
    }
    
    console.log('Drop data:', { jobId, fromStatus })
    
    if (jobId && fromStatus && fromStatus !== 'archived') {
      // Emite evento para arquivar o job
      emit('archive-job', jobId)
      
      // Feedback visual
      setTimeout(() => {
        if (!showArchived.value) {
          showArchived.value = true
          setTimeout(() => {
            showArchived.value = false
          }, 2000)
        }
      }, 100)
    } else {
      console.warn('Invalid drop data or job already archived')
    }
  } catch (error) {
    console.error('Error parsing drop data:', error)  }
}

// Funções para drag'n'drop de jobs arquivados de volta para o kanban
const handleJobDragStart = (event: DragEvent, job: Job) => {
  console.log('Starting drag of archived job:', job.id)
  
  // Prevenir o drag nativo do navegador
  event.preventDefault()
  
  // Configurar estado de drag
  isArchivedJobDragging.value = true
  currentDraggedJob.value = job
  
  // Criar ghost element
  ghostElement.value = createGhostElement(job)
  
  // Posicionar ghost element na posição inicial do mouse
  updateGhostPosition(event.clientX, event.clientY)
  
  // Tornar overlay transparente
  const overlay = document.querySelector('.fixed.inset-0.z-40') as HTMLElement
  if (overlay) {
    overlay.style.opacity = '0.1'
    overlay.style.pointerEvents = 'none'
  }
    // Adicionar classe visual ao item sendo arrastado
  const target = event.target as HTMLElement | null
  if (target && target.classList) {
    target.classList.add('dragging-archived-job')
  }
  
  // Configurar dados para componentes externos
  ;(window as any).__dragData = {
    jobId: job.id,
    fromStatus: 'archived',
    jobData: job
  }
  
  // Adicionar listeners globais
  document.addEventListener('mousemove', handleGlobalMouseMove)
  document.addEventListener('mouseup', handleGlobalMouseUp)
}

// Função simplificada para mousedown nos jobs arquivados
const handleJobMouseDown = (event: MouseEvent, job: Job) => {
  // Criar um DragEvent fake para manter compatibilidade
  const fakeEvent = {
    ...event,
    target: event.currentTarget || event.target, // Use currentTarget como fallback
    preventDefault: () => event.preventDefault(),
    clientX: event.clientX,
    clientY: event.clientY
  } as DragEvent
  
  handleJobDragStart(fakeEvent, job)
}

const handleJobDragEnd = () => {
  console.log('Drag end of archived job')
  cleanupDragState()
}

// Cleanup
onUnmounted(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
  
  // Cleanup para drag de jobs arquivados
  document.removeEventListener('mousemove', handleGlobalMouseMove)
  document.removeEventListener('mouseup', handleGlobalMouseUp)
  
  // Remover ghost element se existir
  removeGhostElement()
  
  // Limpar dados globais
  delete (window as any).__dragData
})

// Expor métodos para o componente pai
defineExpose({
  closeArchive
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Transição suave para o overlay */
.fixed.inset-0.z-40 {
  transition: opacity 0.2s ease;
}

/* Quando um job arquivado está sendo arrastado, tornar o overlay menos intrusivo */
.pointer-events-none {
  pointer-events: none !important;
}

.pointer-events-auto {
  pointer-events: auto !important;
}

/* Estilo para jobs sendo arrastados */
:global(.dragging-archived-job) {
  opacity: 0.7;
  transform: rotate(2deg) scale(0.95);
  cursor: grabbing !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  border-color: #3b82f6 !important;
  z-index: 1001;
  position: relative;
}

/* Estado global quando um job arquivado está sendo arrastado */
:global(.dragging-archived-job-global) {
  cursor: grabbing !important;
}

/* Visual feedback para área de drop válida quando arrastando job arquivado */
:global(.dragging-archived-job-global) :global([data-status]:not([data-status="archived"])) {
  transition: all 0.2s ease;
  background-color: rgba(59, 130, 246, 0.08);
  border: 2px dashed rgba(59, 130, 246, 0.3);
  transform: scale(1.02);
}

:global(.dragging-archived-job-global) :global([data-status]:not([data-status="archived"])):hover {
  background-color: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.5);
  transform: scale(1.05);
}

/* Melhoria visual para colunas do kanban durante drag de job arquivado */
:global(.dragging-archived-job-global) :global([data-status="pending"]),
:global(.dragging-archived-job-global) :global([data-status="in-progress"]),
:global(.dragging-archived-job-global) :global([data-status="completed"]) {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}
</style>
