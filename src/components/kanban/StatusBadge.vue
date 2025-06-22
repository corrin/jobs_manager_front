<template>
  <span class="inline-flex items-center font-bold text-xs" :class="textColorClass">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label: string
  status: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
})

const statusColorMap: Record<string, string> = {
  quoting: 'text-yellow-700',
  quote_sent: 'text-blue-700',
  awaiting_materials: 'text-orange-700',
  job_won: 'text-green-700',
  in_progress: 'text-indigo-700',
  ready_for_qc: 'text-purple-700',
  ready_for_pickup: 'text-teal-700',
  complete: 'text-emerald-700',
  cancelled: 'text-red-700',
  on_hold: 'text-amber-700',
  archived: 'text-gray-700',
}

const textColorClass = computed(() => {
  return statusColorMap[props.status] || 'text-gray-700'
})
</script>

<style scoped>
.badge-shadow {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
