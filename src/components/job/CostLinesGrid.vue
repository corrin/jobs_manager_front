<template>
  <div>
    <table class="cost-lines-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Description</th>
          <th>Kind</th>
          <th>Quantity</th>
          <th>Unit cost</th>
          <th>Unit revenue</th>
          <th>Total cost</th>
          <th>Total revenue</th>
          <th v-if="showActions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="line in costLines" :key="line.id">
          <td>{{ line.meta?.item_number }}</td>
          <td>{{ line.desc }}</td>
          <td>{{ line.kind }}</td>
          <td>{{ line.quantity }}</td>
          <td>£{{ Number(line.unit_cost).toFixed(2) }}</td>
          <td>£{{ Number(line.unit_rev).toFixed(2) }}</td>
          <td>£{{ Number(line.total_cost).toFixed(2) }}</td>
          <td>£{{ Number(line.total_rev).toFixed(2) }}</td>
          <td v-if="showActions">
            <button @click="$emit('edit', line)">Edit</button>
            <button @click="$emit('delete', line)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue'
import type { CostLine } from '@/types/costing.types'

defineProps({
  costLines: {
    type: Array as () => CostLine[],
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

defineEmits(['edit', 'delete'])
</script>

<style scoped>
.cost-lines-table {
  width: 100%;
  border-collapse: collapse;
}
.cost-lines-table th,
.cost-lines-table td {
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  text-align: left;
}
.cost-lines-table th {
  background: #f3f4f6;
  font-weight: 600;
}
</style>

<!-- Este arquivo foi centralizado em shared/CostLinesGrid.vue. Use apenas o componente de shared/. -->
