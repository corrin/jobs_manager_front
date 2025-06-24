<template>
  <div class="modal-overlay">
    <div class="modal">
      <h3>Add Time Cost Line</h3>
      <form @submit.prevent="submit">
        <label>
          Hours (decimal)
          <input v-model.number="form.hours" type="number" min="0" step="0.01" required />
        </label>
        <div class="summary">
          <div>Total cost: ${{ totalCost.toFixed(2) }}</div>
          <div>Total revenue: ${{ totalRevenue.toFixed(2) }}</div>
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
import { ref, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  wageRate: Number,
  chargeOutRate: Number
})
const emit = defineEmits(['close', 'submit'])

const form = ref({
  hours: 1
})

const totalCost = computed(() => (props.wageRate ?? 0) * form.value.hours)
const totalRevenue = computed(() => (props.chargeOutRate ?? 0) * form.value.hours)

function submit() {
  emit('submit', {
    quantity: form.value.hours,
    unit_cost: props.wageRate ?? 0,
    unit_rev: props.chargeOutRate ?? 0,
    total_cost: totalCost.value,
    total_rev: totalRevenue.value,
    kind: 'time'
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
