<template>
  <div class="quote-summary-card bg-white rounded-lg border border-gray-200 p-6 h-full flex flex-col">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Quote Summary</h3>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <svg class="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Summary Content -->
    <div v-else-if="quoteData" class="flex-1 flex flex-col">
      <!-- Revision Info Header -->
      <div class="bg-blue-50 rounded-lg p-3 mb-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-blue-900">Current Revision</span>
          <span class="text-xl font-bold text-blue-900">{{ quoteData.rev }}</span>
        </div>
        <div class="text-xs text-blue-700 mt-1">
          Created {{ formatDate(quoteData.created) }}
        </div>
      </div>

      <!-- 3-Column Mini Grid -->
      <div class="flex-1 grid grid-cols-3 gap-4">
        <!-- Column 1: Costs -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Costs</h4>
          
          <div class="space-y-2">
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Material Cost</span>
              <span class="text-lg font-semibold text-red-600">
                ${{ formatCurrency(breakdown.material.cost) }}
              </span>
            </div>
            
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Time Cost</span>
              <span class="text-lg font-semibold text-red-600">
                ${{ formatCurrency(breakdown.labour.cost) }}
              </span>
            </div>
            
            <div class="flex flex-col pt-2 border-t border-gray-200">
              <span class="text-xs text-gray-500">Total Cost</span>
              <span class="text-xl font-bold text-red-600">
                ${{ formatCurrency(quoteData.summary.cost) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Column 2: Revenue -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Revenue</h4>
          
          <div class="space-y-2">
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Material Revenue</span>
              <span class="text-lg font-semibold text-green-600">
                ${{ formatCurrency(breakdown.material.revenue) }}
              </span>
            </div>
            
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Time Revenue</span>
              <span class="text-lg font-semibold text-green-600">
                ${{ formatCurrency(breakdown.labour.revenue) }}
              </span>
            </div>
            
            <div class="flex flex-col pt-2 border-t border-gray-200">
              <span class="text-xs text-gray-500">Total Revenue</span>
              <span class="text-xl font-bold text-green-600">
                ${{ formatCurrency(quoteData.summary.rev) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Column 3: Metrics & Actions -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Metrics</h4>
          
          <div class="space-y-3">
            <!-- Profit Margin -->
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Profit Margin</span>
              <span
                :class="[
                  'text-lg font-semibold',
                  profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                ]"
              >
                {{ formatPercentage(profitMargin) }}%
              </span>
            </div>

            <!-- Total Hours -->
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Total Hours</span>
              <span class="text-lg font-semibold text-blue-600">
                {{ formatNumber(quoteData.summary.hours) }} hrs
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="pt-2 space-y-2">
              <button 
                disabled
                class="w-full px-3 py-2 bg-gray-100 text-gray-400 rounded-md text-sm cursor-not-allowed"
              >
                Export Quote
              </button>
              <button 
                disabled
                class="w-full px-3 py-2 bg-gray-100 text-gray-400 rounded-md text-sm cursor-not-allowed"
              >
                View History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-500 text-sm">No quote data available</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface QuoteData {
  id: number
  kind: 'quote'
  rev: number
  created: string
  summary: {
    cost: number
    rev: number
    hours: number
  }
  cost_lines: Array<{
    id?: number
    kind: string
    desc: string
    quantity: number
    unit_cost: number
    unit_rev: number
  }>
}

interface Props {
  quoteData?: QuoteData | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

// Computed properties
const profitMargin = computed(() => {
  if (!props.quoteData?.summary.rev || props.quoteData.summary.rev === 0) return 0
  return ((props.quoteData.summary.rev - props.quoteData.summary.cost) / props.quoteData.summary.rev) * 100
})

const breakdown = computed(() => {
  if (!props.quoteData?.cost_lines) {
    return {
      labour: { count: 0, cost: 0, revenue: 0 },
      material: { count: 0, cost: 0, revenue: 0 }
    }
  }

  const labour = props.quoteData.cost_lines
    .filter(line => line.kind === 'time')
    .reduce((acc, line) => ({
      count: acc.count + 1,
      cost: acc.cost + (line.quantity * line.unit_cost),
      revenue: acc.revenue + (line.quantity * line.unit_rev)
    }), { count: 0, cost: 0, revenue: 0 })

  const material = props.quoteData.cost_lines
    .filter(line => line.kind === 'material')
    .reduce((acc, line) => ({
      count: acc.count + 1,
      cost: acc.cost + (line.quantity * line.unit_cost),
      revenue: acc.revenue + (line.quantity * line.unit_rev)
    }), { count: 0, cost: 0, revenue: 0 })

  return { labour, material }
})

// Utility functions
function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
