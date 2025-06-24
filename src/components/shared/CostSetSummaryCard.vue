<template>
  <div
    class="costset-summary-card bg-white rounded-lg border border-gray-200 p-6 h-full flex flex-col"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      <div v-if="summary && summary.rev !== undefined" class="text-right text-sm text-gray-600">
        <div class="font-medium">Rev #{{ summary.rev }}</div>
        <div>{{ formatDate(summary.created) }}</div>
      </div>
    </div>
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <svg class="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
    <div v-else-if="summary" class="flex-1 flex flex-col">
      <div class="flex-1 grid grid-cols-3 gap-4">
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Costs</h4>
          <div class="space-y-2">
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Material Cost</span>
              <span class="text-lg font-semibold text-red-600"
                >${{ formatCurrency(breakdown.material.cost) }}</span
              >
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Time Cost</span>
              <span class="text-lg font-semibold text-red-600"
                >${{ formatCurrency(breakdown.labour.cost) }}</span
              >
            </div>
            <div class="flex flex-col pt-2 border-t border-gray-200">
              <span class="text-xs text-gray-500">Total Cost</span>
              <span class="text-xl font-bold text-red-600"
                >${{ formatCurrency(summary.cost) }}</span
              >
            </div>
          </div>
        </div>
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Revenue</h4>
          <div class="space-y-2">
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Material Revenue</span>
              <span class="text-lg font-semibold text-green-600"
                >${{ formatCurrency(breakdown.material.revenue) }}</span
              >
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Time Revenue</span>
              <span class="text-lg font-semibold text-green-600"
                >${{ formatCurrency(breakdown.labour.revenue) }}</span
              >
            </div>
            <div class="flex flex-col pt-2 border-t border-gray-200">
              <span class="text-xs text-gray-500">Total Revenue</span>
              <span class="text-xl font-bold text-green-600"
                >${{ formatCurrency(summary.rev) }}</span
              >
            </div>
          </div>
        </div>
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Metrics</h4>
          <div class="space-y-3">
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Profit Margin</span>
              <span
                :class="[
                  'text-lg font-semibold',
                  profitMargin >= 0 ? 'text-green-600' : 'text-red-600',
                ]"
                >{{ formatPercentage(profitMargin) }}%</span
              >
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Total Hours</span>
              <span class="text-lg font-semibold text-blue-600"
                >{{ formatNumber(summary.hours) }} hrs</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center justify-center w-full">
        <FileX class="w-12 h-12 text-gray-300 mb-4" />
        <p class="text-gray-500 text-base font-medium">No cost lines available</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FileX } from 'lucide-vue-next'

interface CostLineSummary {
  cost: number
  rev: number
  hours: number
  created?: string
  [key: string]: unknown
}

interface CostLine {
  kind: 'time' | 'material' | string
  quantity: number
  unit_cost: number
  unit_rev: number
}

const props = defineProps<{
  title?: string
  summary?: CostLineSummary | null
  costLines?: CostLine[]
  isLoading?: boolean
}>()

const profitMargin = computed(() => {
  if (!props.summary?.rev || props.summary.rev === 0) return 0
  return ((props.summary.rev - props.summary.cost) / props.summary.rev) * 100
})

const breakdown = computed(() => {
  if (!props.costLines) {
    return {
      labour: { count: 0, cost: 0, revenue: 0 },
      material: { count: 0, cost: 0, revenue: 0 },
    }
  }
  const labour = props.costLines
    .filter((line) => line.kind === 'time')
    .reduce(
      (acc, line) => ({
        count: acc.count + 1,
        cost: acc.cost + line.quantity * line.unit_cost,
        revenue: acc.revenue + line.quantity * line.unit_rev,
      }),
      { count: 0, cost: 0, revenue: 0 },
    )
  const material = props.costLines
    .filter((line) => line.kind === 'material')
    .reduce(
      (acc, line) => ({
        count: acc.count + 1,
        cost: acc.cost + line.quantity * line.unit_cost,
        revenue: acc.revenue + line.quantity * line.unit_rev,
      }),
      { count: 0, cost: 0, revenue: 0 },
    )
  return { labour, material }
})

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

function formatDate(dateString?: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style scoped></style>
