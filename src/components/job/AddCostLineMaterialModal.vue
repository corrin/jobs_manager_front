<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>
          <Package class="w-5 h-5 mr-2 inline-block text-blue-600" /> Add Material Cost Line
        </DialogTitle>
      </DialogHeader>
      <form @submit.prevent="submit" class="space-y-4">
        <div class="grid gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Unit cost</label>
            <input v-model.number="form.unitCost" type="number" min="0" step="0.01" required class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input v-model.number="form.quantity" type="number" min="0" step="0.01" required class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Unit revenue</label>
            <input v-model.number="form.unitRevenue" type="number" min="0" step="0.01" required class="input" />
          </div>
        </div>
        <div class="bg-gray-50 rounded p-3 text-sm flex flex-col gap-1">
          <div><span class="font-medium">Unit revenue:</span> ${{ form.unitRevenue.toFixed(2) }}</div>
          <div><span class="font-medium">Total revenue:</span> ${{ totalRevenue.toFixed(2) }}</div>
          <div><span class="font-medium">Total cost:</span> ${{ totalCost.toFixed(2) }}</div>
        </div>
        <DialogFooter class="flex gap-2 justify-end">
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
import { ref, computed, defineProps, defineEmits, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-vue-next'

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
.input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
}
.input:focus {
  border-color: #2563eb;
}
</style>
