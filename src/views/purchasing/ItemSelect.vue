<script setup lang="ts">
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select'
import { Input } from '../../components/ui/input'
import { useStockStore, type StockItem } from '../../stores/stockStore'
import { onMounted, computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string | null
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [string | null]
  'update:description': [string]
  'update:unit_cost': [number | null]
}>()

const store = useStockStore()
const searchTerm = ref('')

onMounted(async () => {
  await store.ensureLoaded({ ttlMs: 60_000 })
})

const filteredItems = computed(() => {
  if (!searchTerm.value) return store.items
  return store.items.filter((item: StockItem) =>
    (item.description || '').toLowerCase().includes(searchTerm.value.toLowerCase()),
  )
})

const displayLabel = computed(() => {
  if (!props.modelValue) return 'Select Item'
  const found = store.items.find((i: StockItem) => i.id == props.modelValue)
  return found ? found.description || 'Stock Item' : 'Select Item'
})
</script>

<template>
  <Select
    :model-value="props.modelValue"
    :disabled="props.disabled"
    class="w-40"
    @update:model-value="
      (val) => {
        emit('update:modelValue', val as string | null)
        const found = store.items.find((i: StockItem) => i.id == val)

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
      <SelectValue :placeholder="'Select Item'">
        {{ displayLabel }}
      </SelectValue>
    </SelectTrigger>

    <SelectContent class="max-h-60">
      <!-- Search input -->
      <div class="p-2 border-b">
        <Input v-model="searchTerm" placeholder="Search items..." class="h-8 text-sm" @click.stop @keydown.stop />
      </div>

      <!-- Items list -->
      <div v-if="filteredItems.length === 0" class="p-2 text-sm text-gray-500">
        {{ searchTerm ? 'No items found' : 'No items available' }}
      </div>

      <SelectItem
        v-for="i in filteredItems"
        :key="i.id || 'unknown'"
        :value="i.id || ''"
        class="cursor-pointer"
      >
        <div class="flex flex-col">
          <span class="font-medium">{{ i.description || 'Stock Item' }}</span>
          <span v-if="i.unit_cost" class="text-xs text-gray-500">
            ${{ Number(i.unit_cost).toFixed(2) }}
          </span>
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
</template>
