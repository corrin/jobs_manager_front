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
      <!-- Costing Mode Layout -->
      <div v-if="isCostingMode" class="space-y-6">
        <!-- Time Entries Section -->
        <div v-if="timeEntries.length > 0">
          <h4 class="font-medium mb-3 text-blue-600">Time</h4>
          <component
            :is="currentViewComponent"
            :entries="timeEntries"
            type="time"
          />
        </div>

        <!-- Material Entries Section -->
        <div v-if="materialEntries.length > 0">
          <h4 class="font-medium mb-3 text-green-600">Materials</h4>
          <component
            :is="currentViewComponent"
            :entries="materialEntries"
            type="expense"
          />
        </div>

        <!-- Adjustment Entries Section -->
        <div v-if="adjustmentEntries.length > 0">
          <h4 class="font-medium mb-3 text-amber-600">Adjustments</h4>
          <component
            :is="currentViewComponent"
            :entries="adjustmentEntries"
            type="expense"
          />
        </div>

        <!-- No data state for costing mode -->
        <div v-if="timeEntries.length === 0 && materialEntries.length === 0 && adjustmentEntries.length === 0" class="text-center py-8 text-gray-500">
          <p>No entries in this category</p>
        </div>
      </div>

      <!-- Legacy Pricing Mode Layout -->
      <div v-else>
        <!-- Two column layout for Reality section when we have extra space -->
        <div v-if="showTwoColumnLayout" class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          <!-- Tasks Column -->
          <div class="flex flex-col">
            <h4 class="font-medium mb-3 text-blue-600">Tasks</h4>
            <div class="flex-1 overflow-y-auto">
              <component
                v-if="timeEntries.length > 0"
                :is="currentViewComponent"
                :entries="timeEntries"
                type="time"
              />
              <div v-else class="text-center py-8 text-gray-500">
                <p>No time entries yet</p>
              </div>
            </div>
          </div>

          <!-- Expenses Column -->
          <div class="flex flex-col">
            <h4 class="font-medium mb-3 text-green-600">Expenses</h4>
            <div class="flex-1 overflow-y-auto">
              <component
                v-if="expenseEntries.length > 0"
                :is="currentViewComponent"
                :entries="expenseEntries"
                type="expense"
              />
              <div v-else class="text-center py-8 text-gray-500">
                <p>No expenses yet</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Single column layout (default) -->
        <div v-else>
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
import type { JobPricing } from '@/schemas/job.schemas'
import type { CostLine } from '@/types/costing.types'
import ViewToggle from './ViewToggle.vue'
import GridView from './GridView.vue'
import TableView from './TableView.vue'
import ListView from './ListView.vue'

type ViewType = 'grid' | 'table' | 'list'

interface Props {
  title: string
  pricingData?: JobPricing | null
  lines?: CostLine[]
  visible: boolean
  isQuote?: boolean
  showTwoColumns?: boolean
  isCostingMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isQuote: false,
  showTwoColumns: false,
  isCostingMode: false
})

const emit = defineEmits<{
  refresh: []
}>()

const currentView = ref<ViewType>('grid')

// Show two column layout only for Reality section when we have extra space
const showTwoColumnLayout = computed(() => {
  return props.showTwoColumns && props.title === 'Reality Pricing'
})

const currentViewComponent = computed(() => {
  switch (currentView.value) {
    case 'grid': return GridView
    case 'table': return TableView
    case 'list': return ListView
    default: return GridView
  }
})

// Costing mode data processing - following SRP
const costingEntries = computed(() => {
  if (!props.isCostingMode || !props.lines) {
    return {
      time: [],
      material: [],
      adjustment: []
    }
  }

  return groupCostLinesByKind(props.lines)
})

// Helper function for grouping cost lines by kind - following switch-case guideline
const groupCostLinesByKind = (lines: CostLine[]) => {
  const groups: {
    time: any[]
    material: any[]
    adjustment: any[]
  } = { time: [], material: [], adjustment: [] }

  return lines.reduce((acc, line) => {
    switch (line.kind) {
      case 'time':
        acc.time.push(transformCostLineToEntry(line, 'time'))
        break
      case 'material':
        acc.material.push(transformCostLineToEntry(line, 'material'))
        break
      case 'adjust':
        acc.adjustment.push(transformCostLineToEntry(line, 'adjustment'))
        break
      default:
        // Handle unknown kinds gracefully
        console.warn(`Unknown cost line kind: ${line.kind}`)
    }
    return acc
  }, groups)
}

// Transform cost line to entry format for compatibility
const transformCostLineToEntry = (line: CostLine, type: string) => {
  const baseEntry = {
    id: line.id,
    description: line.desc,
    type,
    // Base cost/revenue data
    total_cost: line.total_cost,
    total_revenue: line.total_rev,
    amount: line.total_rev,
    revenue: line.total_rev
  }

  // Transform based on kind for compatibility with existing view components
  switch (line.kind) {
    case 'time':
      return {
        ...baseEntry,
        // Map quantity to hours for time entries
        hours: parseFloat(line.quantity),
        total_minutes: parseFloat(line.quantity) * 60,
        // Map unit_rev to charge_out_rate for time entries
        charge_out_rate: parseFloat(line.unit_rev),
        hourly_rate: parseFloat(line.unit_rev)
      }

    case 'material':
      return {
        ...baseEntry,
        quantity: parseFloat(line.quantity),
        unit_cost: parseFloat(line.unit_cost),
        unit_revenue: parseFloat(line.unit_rev)
      }

    case 'adjust':
      return {
        ...baseEntry,
        price_adjustment: line.total_rev,
        adjustment_amount: line.total_rev
      }

    default:
      return {
        ...baseEntry,
        quantity: parseFloat(line.quantity),
        unit_cost: parseFloat(line.unit_cost),
        unit_revenue: parseFloat(line.unit_rev)
      }
  }
}

// Legacy pricing data (when not in costing mode) - early return pattern
const timeEntries = computed(() => {
  return props.isCostingMode
    ? costingEntries.value.time
    : props.pricingData?.time_entries || []
})

const materialEntries = computed(() => {
  if (props.isCostingMode) {
    return costingEntries.value.material
  }
  return props.pricingData?.material_entries || []
})

const adjustmentEntries = computed(() => {
  if (props.isCostingMode) {
    return costingEntries.value.adjustment
  }
  return props.pricingData?.adjustment_entries || []
})

const expenseEntries = computed(() => {
  return [
    ...materialEntries.value.map((entry: any) => ({
      ...entry,
      type: 'material' as const,
      amount: entry.revenue || (entry.unit_revenue * entry.quantity)
    })),
    ...adjustmentEntries.value.map((entry: any) => ({
      ...entry,
      type: 'adjustment' as const,
      amount: entry.revenue || entry.price_adjustment
    }))
  ]
})

const timeTotal = computed(() => {
  return timeEntries.value.reduce((total: number, entry: any) => {
    let entryRevenue = 0

    if (entry.revenue !== undefined && entry.revenue !== null && !isNaN(entry.revenue)) {
      entryRevenue = Number(entry.revenue)
    } else if (entry.total_minutes && entry.charge_out_rate) {
      entryRevenue = (entry.total_minutes / 60) * entry.charge_out_rate
    } else if (entry.amount) {
      entryRevenue = Number(entry.amount)
    }

    return total + entryRevenue
  }, 0)
})

const materialTotal = computed(() => {
  const materialsTotal = materialEntries.value.reduce((total: number, entry: any) => {
    const entryRevenue = entry.revenue || (entry.unit_revenue * entry.quantity) || entry.amount || 0
    return total + Number(entryRevenue)
  }, 0)

  const adjustmentsTotal = adjustmentEntries.value.reduce((total: number, entry: any) => {
    const entryRevenue = entry.revenue || entry.price_adjustment || entry.amount || 0
    return total + Number(entryRevenue)
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
