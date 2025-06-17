<template>
  <span 
    :class="badgeClasses"
    class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label: string
  colorClass?: string
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  colorClass: 'bg-gray-400',
  size: 'sm'
})

// Computed property following SRP for badge styling
const badgeClasses = computed(() => {
  const baseClasses = 'text-white'
  const sizeClasses = props.size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'
  
  return `${baseClasses} ${sizeClasses} ${props.colorClass}`
})
</script>

<style scoped>
/* Badge-specific styles if needed */
.badge-shadow {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
