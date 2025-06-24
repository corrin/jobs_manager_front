<template>
  <div class="modal-overlay">
    <div class="modal">
      <h3>Add Material Cost Line</h3>
      <form @submit.prevent="submit">
        <label>
          Unit cost
          <input v-model.number="form.unitCost" type="number" min="0" step="0.01" required />
        </label>
        <label>
          Quantity
          <input v-model.number="form.quantity" type="number" min="0" step="0.01" required />
        </label>
        <label>
          Unit revenue
          <input v-model.number="form.unitRevenue" type="number" min="0" step="0.01" required />
        </label>
        <div class="summary">
          <div>Unit revenue: ${{ form.unitRevenue.toFixed(2) }}</div>
          <div>Total revenue: ${{ totalRevenue.toFixed(2) }}</div>
          <div>Total cost: ${{ totalCost.toFixed(2) }}</div>
        </div>
        <div class="actions">
          <button type="button" @click="$emit('close')">Cancel</button>
          <button type="submit">Add</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineProps, defineEmits, watch } from 'vue'

const props = defineProps({
  materialsMarkup: Number
})
const emit = defineEmits(['close', 'submit'])

const form = ref({
  unitCost: 0,
  quantity: 1,
  unitRevenue: 0
})

watch(
  () => [form.value.unitCost, props.materialsMarkup],
  ([unitCost, markup]) => {
    if (typeof unitCost === 'number' && typeof markup === 'number') {
      form.value.unitRevenue = Number((unitCost * (1 + markup)).toFixed(2))
    }
  },
  { immediate: true }
)

const totalRevenue = computed(() => form.value.unitRevenue * form.value.quantity)
const totalCost = computed(() => form.value.unitCost * form.value.quantity)

function submit() {
  emit('submit', {
    unit_cost: form.value.unitCost,
    quantity: form.value.quantity,
    unit_rev: form.value.unitRevenue,
    total_rev: totalRevenue.value,
    total_cost: totalCost.value,
    kind: 'material'
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  min-width: 320px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.12);
}
.summary {
  margin: 12px 0;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
