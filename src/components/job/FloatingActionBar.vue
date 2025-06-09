<template>
  <div
    class="fixed top-1/2 right-6 transform -translate-y-1/2 z-50"
    :class="{ 'right-6': !isDragging }"
    :style="floatingStyle"
  >
    <div
      ref="actionBar"
      class="flex flex-col space-y-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 cursor-move"
      @mousedown="startDrag"
      @touchstart="startDrag"
    >
      <!-- Settings -->
      <FloatingActionButton
        @click="$emit('settings-click')"
        tooltip="Job Settings"
        icon-class="text-blue-600"
      >
        <Settings class="w-5 h-5" />
      </FloatingActionButton>

      <!-- Workflow -->
      <FloatingActionButton
        @click="$emit('workflow-click')"
        tooltip="Workflow Settings"
        icon-class="text-green-600"
      >
        <Wrench class="w-5 h-5" />
      </FloatingActionButton>

      <!-- History -->
      <FloatingActionButton
        @click="$emit('history-click')"
        tooltip="Job History"
        icon-class="text-purple-600"
      >
        <BookOpen class="w-5 h-5" />
      </FloatingActionButton>

      <!-- Attachments -->
      <FloatingActionButton
        @click="$emit('attachments-click')"
        tooltip="Attachments"
        icon-class="text-orange-600"
      >
        <Paperclip class="w-5 h-5" />
      </FloatingActionButton>

      <!-- Camera (within attachments context) -->
      <FloatingActionButton
        @click="$emit('capture-photo')"
        tooltip="Capture Photo"
        icon-class="text-gray-600"
      >
        <Camera class="w-5 h-5" />
      </FloatingActionButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Settings,
  Wrench,
  BookOpen,
  Paperclip,
  Camera
} from 'lucide-vue-next'
import FloatingActionButton from './FloatingActionButton.vue'

// Props
interface Props {
  jobId: string
}

defineProps<Props>()

// Events
defineEmits<{
  'settings-click': []
  'workflow-click': []
  'history-click': []
  'attachments-click': []
  'capture-photo': []
}>()

// Dragging functionality
const actionBar = ref<HTMLElement>()
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const position = ref({ x: 0, y: 0 })

// Computed style para posicionamento
const floatingStyle = computed((): Record<string, string> => {
  if (position.value.x === 0 && position.value.y === 0) {
    return {}
  }

  return {
    position: 'fixed',
    right: 'auto',
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    transform: 'none'
  }
})

// Drag handlers seguindo princípios de clean code
const startDrag = (event: MouseEvent | TouchEvent) => {
  isDragging.value = true

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  dragStart.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  }

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', handleDrag)
  document.addEventListener('touchend', stopDrag)

  event.preventDefault()
}

const handleDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  // Boundary checking - manter dentro da viewport
  const newX = Math.max(0, Math.min(
    window.innerWidth - (actionBar.value?.offsetWidth || 0),
    clientX - dragStart.value.x
  ))

  const newY = Math.max(0, Math.min(
    window.innerHeight - (actionBar.value?.offsetHeight || 0),
    clientY - dragStart.value.y
  ))

  position.value = { x: newX, y: newY }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
}

// Cleanup on unmount
onUnmounted(() => {
  stopDrag()
})

// Initialize position
onMounted(() => {
  // Position inicial no lado direito, centro vertical
  const initialRight = 24 // 6 * 4px (right-6 in Tailwind)
  position.value = {
    x: window.innerWidth - (actionBar.value?.offsetWidth || 60) - initialRight,
    y: (window.innerHeight - (actionBar.value?.offsetHeight || 200)) / 2
  }
})
</script>

<style scoped>
/* Prevent text selection during drag */
.cursor-move {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Smooth transitions when not dragging */
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
