<template>  <div 
    v-if="shouldShow"
    class="fixed bottom-24 left-4 z-50"
  >
    <button
      @click="toggleMovementMode"
      class="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border-2 border-white"
      :class="{
        'bg-purple-700 scale-110': isMovementModeActive,
        'animate-pulse': isMovementModeActive
      }"
      style="min-width: 56px; min-height: 56px;"
    >
      <Move class="h-6 w-6" v-if="!isMovementModeActive" />
      <X class="h-6 w-6" v-else />
    </button>
    
    <!-- Active mode indicator -->
    <div 
      v-if="isMovementModeActive" 
      class="absolute -top-12 -left-8 bg-purple-600 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap"
    >
      Tap a job to move
      <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-600"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Move, X } from 'lucide-vue-next'

interface MobileMovementButtonProps {
  shouldShow: boolean
  isMovementModeActive: boolean
}

interface MobileMovementButtonEmits {
  (e: 'toggle-movement-mode'): void
}

defineProps<MobileMovementButtonProps>()
const emit = defineEmits<MobileMovementButtonEmits>()

const toggleMovementMode = () => {
  console.log('Movement button clicked')
  emit('toggle-movement-mode')
}
</script>
