<template>
  <div v-if="visible" class="pricing-section flex flex-col h-full border rounded-lg bg-white dark:bg-gray-800">
    <!-- Header with fixed height -->
    <div class="flex items-center justify-between p-4 border-b flex-shrink-0">
      <h3 class="text-lg font-semibold">{{ title }}</h3>
      <div class="flex items-center gap-2">
        <!-- View Toggle -->
        <ViewToggle v-model="currentView" />
        <!-- Quote Button (only for Quote section) -->
        <Button
          v-if="isQuote"
          variant="outline"
          size="sm"
          @click="openQuoteSpreadsheet"
        >
          <ExternalLink class="mr-2 h-4 w-4" />
          Open Sheet
        </Button>
      </div>
    </div>

    <!-- Content area with scroll -->
    <div class="pricing-content flex-1 overflow-y-auto p-4">
      <!-- Tasks Summary -->
      <div v-if="timeEntries.length > 0" class="mb-6">
        <h4 class="font-medium mb-3">Tasks</h4>
        <component
          :is="currentViewComponent"
          :entries="timeEntries"
          type="time"
        />
      </div>

      <!-- Expenses Summary -->
      <div v-if="expenseEntries.length > 0" class="mb-6">
        <h4 class="font-medium mb-3">Expenses</h4>
        <component
          :is="currentViewComponent"
          :entries="expenseEntries"
          type="expense"
        />
      </div>
    </div>

    <!-- Totals with fixed height -->
    <div class="p-4 border-t flex-shrink-0 bg-gray-50 dark:bg-gray-700">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-muted-foreground">Total Time:</span>
          <span class="ml-2 font-medium">{{ formatCurrency(timeTotal) }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">Total Materials:</span>
          <span class="ml-2 font-medium">{{ formatCurrency(materialTotal) }}</span>
        </div>
        <div class="col-span-2 pt-2 border-t">
          <span class="text-muted-foreground">Grand Total:</span>
          <span class="ml-2 text-lg font-semibold">{{ formatCurrency(grandTotal) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-vue-next'
import type { JobPricing } from '@/schemas/jobSchemas'
import ViewToggle from './ViewToggle.vue'
import GridView from './GridView.vue'
import TableView from './TableView.vue'
import ListView from './ListView.vue'

type ViewType = 'grid' | 'table' | 'list'

interface Props {
  title: string
  pricingData?: JobPricing | null
  visible: boolean
  isQuote?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isQuote: false
})

const emit = defineEmits<{
  refresh: []
}>()

const currentView = ref<ViewType>('grid')

const currentViewComponent = computed(() => {
  switch (currentView.value) {
    case 'grid': return GridView
    case 'table': return TableView
    case 'list': return ListView
    default: return GridView
  }
})

const timeEntries = computed(() => {
  return props.pricingData?.time_entries || []
})

const materialEntries = computed(() => {
  return props.pricingData?.material_entries || []
})

const adjustmentEntries = computed(() => {
  return props.pricingData?.adjustment_entries || []
})

const expenseEntries = computed(() => {
  return [
    ...materialEntries.value.map(entry => ({
      ...entry,
      type: 'material' as const,
      amount: entry.revenue || (entry.unit_revenue * entry.quantity)
    })),
    ...adjustmentEntries.value.map(entry => ({
      ...entry,
      type: 'adjustment' as const,
      amount: entry.revenue || entry.price_adjustment
    }))
  ]
})

const timeTotal = computed(() => {
  return timeEntries.value.reduce((total, entry) => {
    let entryRevenue = 0

    if (entry.revenue !== undefined && entry.revenue !== null && !isNaN(entry.revenue)) {
      entryRevenue = Number(entry.revenue)
    } else if (entry.total_minutes && entry.charge_out_rate) {
      entryRevenue = (Number(entry.total_minutes) * Number(entry.charge_out_rate)) / 60
    } else if (entry.minutes_per_item && entry.items && entry.charge_out_rate) {
      entryRevenue = (Number(entry.minutes_per_item) * Number(entry.items) * Number(entry.charge_out_rate)) / 60
    }

    return total + (isNaN(entryRevenue) ? 0 : entryRevenue)
  }, 0)
})

const materialTotal = computed(() => {
  const materialsTotal = materialEntries.value.reduce((total, entry) => {
    let entryRevenue = 0

    if (entry.revenue !== undefined && entry.revenue !== null && !isNaN(entry.revenue)) {
      entryRevenue = Number(entry.revenue)
    } else if (entry.unit_revenue && entry.quantity) {
      entryRevenue = Number(entry.unit_revenue) * Number(entry.quantity)
    }

    return total + (isNaN(entryRevenue) ? 0 : entryRevenue)
  }, 0)

  const adjustmentsTotal = adjustmentEntries.value.reduce((total, entry) => {
    let entryRevenue = 0

    if (entry.revenue !== undefined && entry.revenue !== null && !isNaN(entry.revenue)) {
      entryRevenue = Number(entry.revenue)
    } else if (entry.price_adjustment !== undefined && entry.price_adjustment !== null && !isNaN(entry.price_adjustment)) {
      entryRevenue = Number(entry.price_adjustment)
    }

    return total + (isNaN(entryRevenue) ? 0 : entryRevenue)
  }, 0)

  return materialsTotal + adjustmentsTotal
})

const grandTotal = computed(() => {
  return timeTotal.value + materialTotal.value
})

const formatCurrency = (amount: number | undefined | null): string => {
  const numericAmount = Number(amount)
  if (isNaN(numericAmount) || amount === null || amount === undefined) {
    return '$0.00'
  }
  return `$${numericAmount.toFixed(2)}`
}

const openQuoteSpreadsheet = () => {
  // TODO: Implement Google Sheets integration
  console.log('Opening quote spreadsheet...')
}
</script>
