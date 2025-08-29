<script setup lang="ts">
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useStockStore } from '@/stores/stockStore'
import { onMounted, computed } from 'vue'

const props = defineProps<{
  modelValue: string | null
}>()
const emit = defineEmits<{
  'update:modelValue': [string | null]
  'update:description': [string]
  'update:unit_cost': [number | null]
}>()

const store = useStockStore()

onMounted(async () => {
  if (store.items.length === 0 && !store.loading) {
    await store.fetchStock()
  }
})

const displayLabel = computed(() => {
  if (!props.modelValue) return 'Select'
  const found = store.items.find((i) => i.id === props.modelValue)
  return found ? found.description || 'Stock Item' : 'Select'
})
</script>

<template>
  <Select
    :model-value="props.modelValue"
    class="w-32"
    @update:model-value="
      (val) => {
        emit('update:modelValue', val)
        const found = store.items.find((i) => i.id === val)

        if (found) {
          emit('update:description', found.description || '')
          emit('update:unit_cost', found.unit_cost || null)
        } else {
          emit('update:description', '')
          emit('update:unit_cost', null)
        }
      }
    "
  >
    <SelectTrigger>
      <SelectValue :placeholder="'Select'">
        {{ displayLabel }}
      </SelectValue>
    </SelectTrigger>

    <SelectContent>
      <SelectItem v-for="i in store.items" :key="i.id || 'unknown'" :value="i.id || ''">
        {{ i.description || 'Stock Item' }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
