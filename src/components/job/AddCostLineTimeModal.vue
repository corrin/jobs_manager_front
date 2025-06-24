<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>
          <Clock class="w-5 h-5 mr-2 inline-block text-green-600" /> Add Time Cost Line
        </DialogTitle>
      </DialogHeader>
      <form @submit.prevent="submit" class="grid gap-5">
        <div class="grid grid-cols-1 gap-3">
          <label class="block">
            <span class="block text-sm font-medium text-gray-700 mb-1">Hours (decimal)</span>
            <input v-model.number="form.hours" type="number" min="0" step="0.01" required class="input" />
          </label>
        </div>
        <div class="bg-gray-50 rounded p-3 text-sm flex flex-col gap-1">
          <div><span class="font-medium">Total cost:</span> ${{ totalCost.toFixed(2) }}</div>
          <div><span class="font-medium">Total revenue:</span> ${{ totalRevenue.toFixed(2) }}</div>
        </div>
        <DialogFooter class="flex gap-2 justify-end mt-2">
          <Button type="button" variant="outline" @click="$emit('close')">
            Cancel
          </Button>
          <Button type="submit" variant="default">
            <Plus class="w-4 h-4 mr-1" /> Add
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Clock } from 'lucide-vue-next'

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
.input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
  background: #fff;
}
.input:focus {
  border-color: #2563eb;
  background: #f0f6ff;
}
</style>
