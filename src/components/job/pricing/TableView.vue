<template>
  <div class="max-h-[calc(100vh-200px)] overflow-auto">
    <table class="w-full text-xs">
      <thead class="sticky top-0 bg-white dark:bg-gray-800 border-b">
        <tr>
          <th class="text-left p-1 font-medium">Description</th>
          <th v-if="type === 'time'" class="text-right p-1 font-medium">Hours</th>
          <th v-if="type === 'time'" class="text-right p-1 font-medium">Rate</th>
          <th v-if="type === 'expense'" class="text-right p-1 font-medium">Qty/Type</th>
          <th v-if="type === 'expense'" class="text-right p-1 font-medium">Unit</th>
          <th class="text-right p-1 font-medium">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="entry in entries"
          :key="entry.id"
          class="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <td class="p-1 max-w-[150px] truncate" :title="entry.description">
            {{ entry.description || 'No description' }}
          </td>

          <!-- Time Entry -->
          <template v-if="type === 'time'">
            <td class="text-right p-1">{{ formatHours(entry) }}</td>
            <td class="text-right p-1">{{ formatCurrency(entry.charge_out_rate || 0) }}</td>
          </template>

          <!-- Expense Entry -->
          <template v-else>
            <td class="text-right p-1">
              {{ entry.type === 'material' ? (entry.quantity || 0) : 'Adjustment' }}
            </td>
            <td class="text-right p-1">
              {{ entry.type === 'material' ? formatCurrency(entry.unit_revenue || 0) : '-' }}
            </td>
          </template>

          <td class="text-right p-1 font-medium">
            {{ formatCurrency(getEntryTotal(entry)) }}
          </td>
        </tr>
      </tbody>
    </table>
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
