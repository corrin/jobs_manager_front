<template>
  <div class="relative group">
    <!-- Button -->
    <button
      @click="$emit('click')"
      class="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md"
      :class="iconClass"
    >
      <slot />
    </button>

    <!-- Tooltip -->
    <div
      v-if="tooltip"
      class="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10"
    >
      {{ tooltip }}
      <!-- Arrow -->
      <div class="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-y-4 border-y-transparent"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
interface Props {
  tooltip?: string
  iconClass?: string
}

defineProps<Props>()

// Events
defineEmits<{
  click: []
}>()
</script>

<style scoped>
/* Ensure tooltip stays above other elements */
.z-10 {
  z-index: 10;
}
</style>
