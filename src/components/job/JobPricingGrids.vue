<template>
  <div class="space-y-6">
    <!-- Pricing Tables Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Estimate -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Estimate</h3>
        <div class="space-y-3">
          <SimpleTotalTable
            title="Time"
            :value="estimates.time"
            @update="updateEstimate('time', $event)"
          />
          <SimpleTotalTable
            title="Materials"
            :value="estimates.materials"
            @update="updateEstimate('materials', $event)"
          />
          <SimpleTotalTable
            title="Adjustments"
            :value="estimates.adjustments"
            @update="updateEstimate('adjustments', $event)"
          />
          <div class="pt-2 border-t">
            <div class="flex justify-between font-semibold">
              <span>Total:</span>
              <span>${{ formatCurrency(estimates.total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quote -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Quote</h3>
        <div class="space-y-3">
          <SimpleTotalTable
            title="Time"
            :value="quotes.time"
            @update="updateQuote('time', $event)"
          />
          <SimpleTotalTable
            title="Materials"
            :value="quotes.materials"
            @update="updateQuote('materials', $event)"
          />
          <SimpleTotalTable
            title="Adjustments"
            :value="quotes.adjustments"
            @update="updateQuote('adjustments', $event)"
          />
          <div class="pt-2 border-t">
            <div class="flex justify-between font-semibold">
              <span>Total:</span>
              <span>${{ formatCurrency(quotes.total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Reality -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Reality</h3>
        <div class="space-y-3">
          <SimpleTotalTable
            title="Time"
            :value="reality.time"
            @update="updateReality('time', $event)"
          />
          <SimpleTotalTable
            title="Materials"
            :value="reality.materials"
            @update="updateReality('materials', $event)"
          />
          <SimpleTotalTable
            title="Adjustments"
            :value="reality.adjustments"
            @update="updateReality('adjustments', $event)"
          />
          <div class="pt-2 border-t">
            <div class="flex justify-between font-semibold">
              <span>Total:</span>
              <span>${{ formatCurrency(reality.total) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Section -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-3">Project Summary</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">${{ formatCurrency(estimates.total) }}</div>
          <div class="text-sm text-gray-600">Estimated</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">${{ formatCurrency(quotes.total) }}</div>
          <div class="text-sm text-gray-600">Quoted</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">${{ formatCurrency(reality.total) }}</div>
          <div class="text-sm text-gray-600">Actual</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import SimpleTotalTable from './SimpleTotalTable.vue'
import type { JobData, CompanyDefaults } from '@/services/jobRestService'

// Props
interface Props {
  jobData: JobData
  latestPricings: any
  companyDefaults: CompanyDefaults | null
}

const props = defineProps<Props>()

// Events
const emit = defineEmits<{
  'data-changed': [data: any]
}>()

// Reactive data structure seguindo princípios de clean code
const estimates = ref({
  time: 0,
  materials: 0,
  adjustments: 0,
  total: 0
})

const quotes = ref({
  time: 0,
  materials: 0,
  adjustments: 0,
  total: 0
})

const reality = ref({
  time: 0,
  materials: 0,
  adjustments: 0,
  total: 0
})

// Computed totals usando early return pattern
const calculateTotal = (section: any) => {
  if (!section) return 0
  return (section.time || 0) + (section.materials || 0) + (section.adjustments || 0)
}

// Watch para recalcular totais automaticamente
watch([estimates, quotes, reality], () => {
  estimates.value.total = calculateTotal(estimates.value)
  quotes.value.total = calculateTotal(quotes.value)
  reality.value.total = calculateTotal(reality.value)
}, { deep: true })

// Update handlers seguindo SRP
const updateEstimate = (field: string, value: number) => {
  estimates.value[field as keyof typeof estimates.value] = value
  emitDataChanged()
}

const updateQuote = (field: string, value: number) => {
  quotes.value[field as keyof typeof quotes.value] = value
  emitDataChanged()
}

const updateReality = (field: string, value: number) => {
  reality.value[field as keyof typeof reality.value] = value
  emitDataChanged()
}

// Emit data changes for autosave
const emitDataChanged = () => {
  emit('data-changed', {
    estimates: estimates.value,
    quotes: quotes.value,
    reality: reality.value
  })
}

// Utility functions
const formatCurrency = (amount: number) => {
  return amount.toFixed(2)
}

// Initialize data from props
watch(() => props.latestPricings, (newPricings) => {
  if (newPricings) {
    // TODO: Parse actual pricing data
    // For now, using placeholder data
    estimates.value = { time: 100, materials: 200, adjustments: 50, total: 350 }
    quotes.value = { time: 120, materials: 220, adjustments: 60, total: 400 }
    reality.value = { time: 110, materials: 210, adjustments: 55, total: 375 }
  }
}, { immediate: true })
</script>
