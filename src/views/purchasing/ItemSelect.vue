o
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
import { useCompanyDefaultsStore } from '../../stores/companyDefaults'
import { onMounted, computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string | null
    disabled?: boolean
    showQuantity?: boolean
    lineKind?: string
    tabKind?: string
  }>(),
  {
    disabled: false,
    showQuantity: true,
    lineKind: undefined,
    tabKind: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [string | null]
  'update:description': [string]
  'update:unit_cost': [number | null]
  'update:kind': [string | null]
}>()

const store = useStockStore()
const companyDefaultsStore = useCompanyDefaultsStore()
const searchTerm = ref('')

// Mocked Labour item for time entries
const mockedLabourItem = computed(() => ({
  id: '__labour__',
  description: 'Labour',
  item_code: 'LABOUR',
  unit_cost: companyDefaultsStore.companyDefaults?.wage_rate ?? 0,
  unit_rev: companyDefaultsStore.companyDefaults?.charge_out_rate ?? 0,
  quantity: null,
}))

onMounted(async () => {
  // Avoid triggering redundant fetches when many ItemSelects mount at once
  if (store.items.length === 0 && !store.loading) {
    await store.fetchStock()
  }
})

const filteredItems = computed(() => {
  const stockItems = store.items
  const labourItem = props.tabKind === 'actual' ? [] : [mockedLabourItem.value]

  // Include LABOUR unless in actual tab, put it first
  const allItems = [...labourItem, ...stockItems]

  if (!searchTerm.value) return allItems
  const term = searchTerm.value.toLowerCase()
  return allItems.filter((item) => {
    const searchableFields = [item.description, item.item_code].filter(Boolean) // Remove null/undefined values

    return searchableFields.some((field) => field?.toLowerCase().includes(term))
  })
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

        if (val === '__labour__') {
          emit('update:description', 'Labour')
          emit('update:unit_cost', companyDefaultsStore.companyDefaults?.wage_rate ?? 0)
          emit('update:kind', 'time')
        } else {
          const found = store.items.find((i: StockItem) => i.id == val)

          if (found) {
            emit('update:description', found.description || '')
            emit('update:unit_cost', found.unit_cost || null)
            emit('update:kind', 'material')
          } else {
            emit('update:description', '')
            emit('update:unit_cost', null)
            emit('update:kind', null)
          }
        }
      }
    "
  >
    <SelectTrigger class="h-10">
      <SelectValue :placeholder="'Select Item'" />
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
          class="cursor-pointer p-3 hover:bg-accent/50 focus:bg-accent/50 bg-background"
        >
          <div class="flex flex-col">
            <div class="font-medium text-sm leading-tight font-mono uppercase tracking-wide">
              {{ i.item_code || i.description || 'Unnamed Item' }}
            </div>
          </div>
        </SelectItem>
      </div>
    </SelectContent>
  </Select>
</template>
