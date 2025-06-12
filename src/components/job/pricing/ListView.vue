<template>
  <div class="max-h-[calc(100vh-200px)] overflow-y-auto space-y-1">
    <div
      v-for="entry in entries"
      :key="entry.id"
      class="flex justify-between items-center p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
    >
      <div class="flex-1 min-w-0">
        <div class="font-medium truncate" :title="entry.description">
          {{ entry.description || 'No description' }}
        </div>
        <div class="text-xs text-muted-foreground">
          <span v-if="type === 'time'">
            {{ formatHours(entry) }}h × {{ formatCurrency(entry.charge_out_rate || 0) }}/hr
          </span>
          <span v-else-if="entry.type === 'material'">
            {{ entry.quantity || 0 }} × {{ formatCurrency(entry.unit_revenue || 0) }}
          </span>
          <span v-else>
            Adjustment
          </span>
        </div>
      </div>
      <div class="font-medium ml-2 text-right">
        {{ formatCurrency(getEntryTotal(entry)) }}
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

const getEntryTotal = (entry: any): number => {
  if (entry.type === 'time' || entry.total_minutes !== undefined || entry.minutes_per_item !== undefined) {
    // Time entry - usar revenue se disponível, senão calcular
    if (entry.revenue !== undefined && entry.revenue !== null) {
      return entry.revenue
    }
    const hours = parseFloat(formatHours(entry))
    const rate = entry.charge_out_rate || 0
    return hours * rate
  } else {
    // Expense entry - usar revenue se disponível
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
}
</script>
