<script setup lang="ts">
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { useStockStore, type StockItem } from '../../stores/stockStore'
import { onMounted, computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string | null
    disabled?: boolean
    showQuantity?: boolean
  }>(),
  {
    disabled: false,
    showQuantity: true,
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
  if (store.items.length === 0 && !store.loading) {
    await store.fetchStock()
  }
})

const filteredItems = computed(() => {
  if (!searchTerm.value) return store.items
  const term = searchTerm.value.toLowerCase()
  return store.items.filter((item: StockItem) => {
    const searchableFields = [item.description, item.item_code].filter(Boolean) // Remove null/undefined values

    return searchableFields.some((field) => field?.toLowerCase().includes(term))
  })
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
    class="!w-full min-w-64"
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
    <SelectTrigger class="h-10">
      <SelectValue :placeholder="'Select Item'">
        <div class="flex items-center gap-2">
          <span class="truncate">{{ displayLabel }}</span>
        </div>
      </SelectValue>
    </SelectTrigger>

    <SelectContent class="max-h-80 w-[550px]">
      <!-- Search input -->
      <div class="p-3 border-b bg-muted/50">
        <Input
          v-model="searchTerm"
          placeholder="Search items by description, code, or type..."
          class="h-9 text-sm"
          @click.stop
          @keydown.stop
        />
      </div>

      <!-- Items list -->
      <div v-if="filteredItems.length === 0" class="p-4 text-sm text-muted-foreground text-center">
        {{ searchTerm ? 'No items found matching your search' : 'No stock items available' }}
      </div>

      <div v-else class="max-h-64 w-full overflow-y-auto">
        <SelectItem
          v-for="i in filteredItems"
          :key="i.id || 'unknown'"
          :value="i.id || ''"
          class="cursor-pointer p-4 border-b border-border last:border-b-0 hover:bg-accent/50 focus:bg-accent/50 bg-background w-full"
        >
          <div class="flex w-full items-start justify-between gap-6 !min-w-[500px]">
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm leading-tight truncate">
                {{ i.description || 'Unnamed Stock Item' }}
              </div>
              <div v-if="i.item_code" class="text-xs text-muted-foreground mt-1 truncate">
                Code: {{ i.item_code }}
              </div>
            </div>

            <div class="flex flex-col items-end gap-1 shrink-0">
              <Badge
                v-if="i.unit_cost"
                variant="default"
                class="text-xs font-semibold bg-green-600 hover:bg-green-700"
              >
                ${{ Number(i.unit_cost).toFixed(2) }}
              </Badge>
              <Badge
                v-else
                variant="secondary"
                class="text-xs bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                No price
              </Badge>

              <Badge
                v-if="showQuantity && i.quantity !== null && i.quantity !== undefined"
                :variant="i.quantity <= 0 ? 'secondary' : 'outline'"
                :class="
                  i.quantity < 0
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : i.quantity === 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                "
                class="text-xs"
              >
                Qty: {{ i.quantity }}
              </Badge>
            </div>
          </div>
        </SelectItem>
      </div>
    </SelectContent>
  </Select>
</template>
