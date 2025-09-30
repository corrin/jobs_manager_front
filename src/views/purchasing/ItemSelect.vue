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
  const labourItem = [mockedLabourItem.value]

  const allItems = [...stockItems, ...labourItem]

  if (!searchTerm.value) return allItems
  const term = searchTerm.value.toLowerCase()
  return allItems.filter((item) => {
    const searchableFields = [item.description, item.item_code].filter(Boolean) // Remove null/undefined values

    return searchableFields.some((field) => field?.toLowerCase().includes(term))
  })
})

const displayCode = computed(() => {
  console.log('🔍 ItemSelect displayCode computed:', {
    modelValue: props.modelValue,
    storeItemsCount: store.items.length,
    isLabour: props.modelValue === '__labour__',
  })

  if (!props.modelValue) {
    console.log('📝 No modelValue, returning "Select Item"')
    return 'Select Item'
  }

  if (props.modelValue === '__labour__') {
    console.log('👷 Labour selected, returning "LABOUR"')
    return 'LABOUR'
  }

  const found = store.items.find((i: StockItem) => i.id == props.modelValue)
  console.log('🔎 Looking for item:', {
    searchedId: props.modelValue,
    found: !!found,
    foundItem: found
      ? { id: found.id, item_code: found.item_code, description: found.description }
      : null,
  })

  const result = found?.item_code || 'Select Item'
  console.log('📋 Final displayCode result:', result)
  return result
})
</script>

<template>
  <Select
    :model-value="props.modelValue"
    :disabled="props.disabled"
    class="!w-full min-w-64"
    @update:model-value="
      (val) => {
        console.log('🔄 ItemSelect update:modelValue called:', {
          val,
          currentModelValue: props.modelValue,
          storeItemsCount: store.items.length,
        })

        emit('update:modelValue', val as string | null)

        if (val === '__labour__') {
          console.log('👷 Labour selected, emitting labour data')
          emit('update:description', 'Labour')
          emit('update:unit_cost', companyDefaultsStore.companyDefaults?.wage_rate ?? 0)
          emit('update:kind', 'time')
        } else {
          const found = store.items.find((i: StockItem) => i.id == val)
          console.log('🔎 Looking for stock item:', {
            searchedId: val,
            found: !!found,
            foundItem: found
              ? {
                  id: found.id,
                  item_code: found.item_code,
                  description: found.description,
                  unit_cost: found.unit_cost,
                }
              : null,
          })

          if (found) {
            console.log('✅ Found stock item, emitting data')
            emit('update:description', found.description || '')
            emit('update:unit_cost', found.unit_cost || null)
            emit('update:kind', 'material')
          } else {
            console.log('❌ Stock item not found, emitting empty data')
            emit('update:description', '')
            emit('update:unit_cost', null)
            emit('update:kind', null)
          }
        }
      }
    "
  >
    <SelectTrigger class="h-10">
      <SelectValue :placeholder="'Select Item'" :display-value="displayCode" />
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
            <div class="font-medium text-sm leading-tight">
              {{ i.description || 'Unnamed Stock Item' }}
            </div>
            <div v-if="i.item_code" class="text-xs text-muted-foreground mt-1">
              {{ i.item_code }}
            </div>
          </div>
        </SelectItem>
      </div>
    </SelectContent>
  </Select>
</template>
