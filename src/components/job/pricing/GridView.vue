<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 h-full overflow-y-auto">
    <div
      v-for="entry in entries"
      :key="entry.id"
      class="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-xs flex-shrink-0"
    >
      <h5 class="font-medium mb-1 text-sm truncate" :title="entry.description">
        {{ entry.description || 'No description' }}
      </h5>

      <!-- Time Entry -->
      <div v-if="type === 'time'" class="text-xs text-muted-foreground space-y-1">
        <div>Hours: {{ formatHours(entry) }}</div>
        <div>Rate: {{ formatCurrency(entry.charge_out_rate || 0) }}/hr</div>
        <div class="font-medium text-foreground">
          Total: {{ formatCurrency(getTimeEntryTotal(entry)) }}
        </div>
      </div>

      <!-- Expense Entry -->
      <div v-else class="text-xs text-muted-foreground space-y-1">
        <div v-if="entry.type === 'material'">
          <div>Qty: {{ entry.quantity || 0 }}</div>
          <div>Unit: {{ formatCurrency(entry.unit_revenue || 0) }}</div>
        </div>
        <div v-else-if="entry.type === 'adjustment'">
          <div>Adjustment</div>
        </div>
        <div class="font-medium text-foreground">
          Total: {{ formatCurrency(getExpenseEntryTotal(entry)) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  entries: any[]
  type: 'time' | 'expense'
}

defineProps<Props>()

const formatCurrency = (amount: number | undefined | null): string => {
  const numericAmount = Number(amount)
  if (isNaN(numericAmount) || amount === null || amount === undefined) {
    return '$0.00'
  }
  return `$${numericAmount.toFixed(2)}`
}

const formatHours = (entry: any): string => {
  // Calcular horas a partir de minutos se disponível
  if (entry.total_minutes) {
    return (entry.total_minutes / 60).toFixed(2)
  }
  if (entry.minutes_per_item && entry.items) {
    return ((entry.minutes_per_item * entry.items) / 60).toFixed(2)
  }
  return entry.hours?.toFixed(2) || '0.00'
}

const getTimeEntryTotal = (entry: any): number => {
  // Usar revenue se disponível, senão calcular
  if (entry.revenue !== undefined && entry.revenue !== null && !isNaN(entry.revenue)) {
    return Number(entry.revenue)
  }

  let hours = 0
  // Calcular horas a partir de minutos se disponível
  if (entry.total_minutes) {
    hours = Number(entry.total_minutes) / 60
  } else if (entry.minutes_per_item && entry.items) {
    hours = (Number(entry.minutes_per_item) * Number(entry.items)) / 60
  } else if (entry.hours) {
    hours = Number(entry.hours)
  }

  const rate = Number(entry.charge_out_rate) || 0
  const total = hours * rate
  return isNaN(total) ? 0 : total
}

const getExpenseEntryTotal = (entry: any): number => {
  if (entry.revenue !== undefined && entry.revenue !== null) {
    return entry.revenue
  }

  if (entry.type === 'material') {
    return (entry.unit_revenue || 0) * (entry.quantity || 0)
  }

  if (entry.type === 'adjustment') {
    return entry.price_adjustment || entry.amount || 0
  }

  return entry.amount || 0
}
</script>
