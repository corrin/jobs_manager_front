<template>
  <div
    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
    :class="badgeClass"
  >
    <TrendingUp class="h-3 w-3 mr-1" />
    {{ displayValue }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp } from 'lucide-vue-next'

const props = defineProps<{
  percentage?: number
}>()

const numericPercentage = computed(() => {
  if (props.percentage === undefined || props.percentage === null) return null
  return isNaN(props.percentage) ? null : props.percentage
})

const displayValue = computed(() => {
  if (numericPercentage.value === null) return '--'
  return `${numericPercentage.value.toFixed(1)}%`
})

const badgeClass = computed(() => {
  if (numericPercentage.value === null) return 'bg-gray-100 text-gray-500'
  if (numericPercentage.value >= 80) return 'bg-green-100 text-green-700'
  if (numericPercentage.value >= 50) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
})
</script>
