<!-- Mobile Job Movement Floating Button -->
<template>
  <Teleport to="body">
    <!-- Button Container - Only visible on mobile/tablet -->
    <div 
      v-if="shouldShow"
      class="fixed bottom-6 right-6 z-50 lg:hidden"
      :class="{ 'animate-pulse': isMovementModeActive }"
    >
      <!-- Main Floating Button -->
      <button
        @click="handleToggleMovementMode"
        :class="[
          'w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110',
          'flex items-center justify-center',
          'focus:outline-none focus:ring-4 focus:ring-opacity-50',
          isMovementModeActive 
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300' 
            : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300'
        ]"
        :title="isMovementModeActive ? 'Exit Movement Mode' : 'Enter Movement Mode'"
      >
        <!-- Icon -->
        <component 
          :is="buttonIcon" 
          class="h-6 w-6 text-white" 
        />
      </button>

      <!-- Tooltip -->
      <div 
        v-if="showTooltip"
        class="absolute bottom-16 right-0 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg"
      >
        {{ tooltipText }}
        <div class="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Move, X } from 'lucide-vue-next'
import { useDeviceDetection } from '@/composables/useDeviceDetection'

// Props
const props = defineProps<{
  shouldShow: boolean
  isMovementModeActive: boolean
}>()

// Emits
const emit = defineEmits<{
  'toggle-movement-mode': []
}>()

// Device detection
const { isMobile, isTablet } = useDeviceDetection()

// Tooltip state
const showTooltip = ref(false)
let tooltipTimer: number | null = null

// Computed properties
const buttonIcon = computed(() => {
  return props.isMovementModeActive ? X : Move
})

const tooltipText = computed(() => {
  return props.isMovementModeActive 
    ? 'Exit Movement Mode' 
    : 'Move Jobs Between Columns'
})

// Methods
const handleToggleMovementMode = () => {
  // Show tooltip briefly on click
  showTooltip.value = true
  if (tooltipTimer) clearTimeout(tooltipTimer)
  tooltipTimer = setTimeout(() => {
    showTooltip.value = false
  }, 1500)
  
  emit('toggle-movement-mode')
}

// Show tooltip on mount if mobile/tablet
onMounted(() => {
  if (props.shouldShow && (isMobile.value || isTablet.value)) {
    setTimeout(() => {
      showTooltip.value = true
      tooltipTimer = setTimeout(() => {
        showTooltip.value = false
      }, 3000)
    }, 1000)
  }
})

// Cleanup
onUnmounted(() => {
  if (tooltipTimer) clearTimeout(tooltipTimer)
})
</script>

<style scoped>
/* Ensure the button is always on top */
.z-50 {
  z-index: 50;
}

/* Animation for pulsing effect */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
