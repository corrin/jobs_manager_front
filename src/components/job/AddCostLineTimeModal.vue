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
            <span class="block text-sm font-medium text-gray-700 mb-1"
              >Description <span class="text-red-500">*</span></span
            >
            <input
              v-model.trim="form.desc"
              type="text"
              required
              maxlength="120"
              class="input"
              :class="{ 'border-red-500': descError }"
              @blur="validateDesc"
            />
            <span v-if="descError" class="text-xs text-red-500 mt-1">This field is required.</span>
          </label>
          <label class="block">
            <span class="block text-sm font-medium text-gray-700 mb-1">Hours (decimal)</span>
            <input
              v-model.number="form.hours"
              @input="handleHoursInput"
              type="number"
              min="0"
              step="0.01"
              required
              class="input"
            />
          </label>
        </div>
        <div
          class="summary-card bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm"
        >
          <div class="flex items-center gap-2">
            <DollarSign class="w-5 h-5 text-blue-500" />
            <span class="font-semibold text-gray-700">Total cost:</span>
            <span class="text-blue-700 font-bold">${{ totalCost.toFixed(2) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <TrendingUp class="w-5 h-5 text-green-500" />
            <span class="font-semibold text-gray-700">Total revenue:</span>
            <span class="text-green-700 font-bold">${{ totalRevenue.toFixed(2) }}</span>
          </div>
        </div>
        <DialogFooter class="flex gap-2 justify-end mt-2">
          <Button type="button" variant="outline" @click="$emit('close')"> Cancel </Button>
          <Button type="submit" variant="default" :disabled="descError">
            <Plus class="w-4 h-4 mr-1" /> Add
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Clock, DollarSign, TrendingUp } from 'lucide-vue-next'
import { useCompanyDefaultsStore } from '@/stores/companyDefaults'

const props = defineProps({
  wageRate: Number,
  chargeOutRate: Number,
})
const emit = defineEmits(['close', 'submit'])

const form = ref({
  desc: '',
  hours: 1,
})
const descError = ref(false)

function validateDesc() {
  descError.value = !form.value.desc.trim()
}

const companyDefaultsStore = useCompanyDefaultsStore()
 
console.log('[TimeModal] Store companyDefaults:', companyDefaultsStore.companyDefaults)
const unitCost = computed(() => {
  const wage = typeof props.wageRate === 'number' ? props.wageRate : 0
   
  console.log('[TimeModal] Calculating unitCost', { wageRate: wage })
  return wage
})
const unitRevenue = computed(() => {
  const charge = typeof props.chargeOutRate === 'number' ? props.chargeOutRate : 0
   
  console.log('[TimeModal] Calculating unitRevenue', { chargeOutRate: charge })
  return charge
})
const totalCost = computed(() => unitCost.value * form.value.hours)
const totalRevenue = computed(() => unitRevenue.value * form.value.hours)

function handleHoursInput(e: Event) {
  const input = (e.target as HTMLInputElement).value.replace(',', '.')
  form.value.hours = Number(input)
}

function submit() {
  validateDesc()
  if (descError.value) return
  emit('submit', {
    desc: form.value.desc,
    quantity: form.value.hours,
    unit_cost: unitCost.value,
    unit_rev: unitRevenue.value,
    total_cost: totalCost.value,
    total_rev: totalRevenue.value,
    kind: 'time',
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
.summary-card {
  margin-top: 0.5rem;
}
</style>
