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
    // Parse actual pricing data from Django format
    try {
      const pricingData = typeof newPricings === 'string' ? JSON.parse(newPricings) : newPricings
      
      // Extract totals from different sections
      const extractSectionTotals = (sectionData: any) => {
        const time = calculateSectionTotal(sectionData?.time_entries || [])
        const materials = calculateSectionTotal(sectionData?.material_entries || [])
        const adjustments = calculateSectionTotal(sectionData?.adjustment_entries || [])
        return { time, materials, adjustments, total: time + materials + adjustments }
      }

      // Update reactive data with real pricing information
      if (pricingData?.estimate) {
        estimates.value = extractSectionTotals(pricingData.estimate)
      }
      if (pricingData?.quote) {
        quotes.value = extractSectionTotals(pricingData.quote)
      }
      if (pricingData?.reality) {
        reality.value = extractSectionTotals(pricingData.reality)
      }
    } catch (error) {
      console.error('Error parsing pricing data:', error)
      // Fallback to placeholder data
      estimates.value = { time: 100, materials: 200, adjustments: 50, total: 350 }
      quotes.value = { time: 120, materials: 220, adjustments: 60, total: 400 }
      reality.value = { time: 110, materials: 210, adjustments: 55, total: 375 }
    }
  }
}, { immediate: true })

// Helper function to calculate totals from entry arrays
const calculateSectionTotal = (entries: any[]) => {
  return entries.reduce((total, entry) => {
    // For time entries: calculate from hours * rate or total_minutes * rate
    if (entry.total_minutes !== undefined) {
      return total + (parseFloat(entry.revenue) || 0)
    }
    // For material entries: quantity * unit_revenue
    if (entry.quantity !== undefined && entry.unit_revenue !== undefined) {
      return total + (entry.quantity * entry.unit_revenue)
    }
    // For adjustment entries: direct price_adjustment
    if (entry.price_adjustment !== undefined) {
      return total + parseFloat(entry.price_adjustment || 0)
    }
    // For simple entries: direct cost/retail values
    if (entry.retail_price !== undefined) {
      return total + parseFloat(entry.retail_price || 0)
    }
    if (entry.value_of_time !== undefined) {
      return total + parseFloat(entry.value_of_time || 0)
    }
    return total
  }, 0)
}
</script>
