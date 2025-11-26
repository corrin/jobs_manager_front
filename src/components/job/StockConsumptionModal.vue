<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>
          <Package class="w-5 h-5 mr-2 inline-block text-blue-600" /> Add Material from Stock
        </DialogTitle>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="grid gap-5">
        <!-- Stock Item Selection -->
        <div>
          <label class="block">
            <span class="block text-sm font-medium text-gray-700 mb-1">Stock Item</span>
            <div class="relative dropdown-container">
              <input
                v-model="searchTerm"
                @focus="handleInputFocus"
                @input="filterStock"
                @keydown.enter.prevent=""
                class="input"
                placeholder="Search for stock items..."
                autocomplete="off"
                ref="stockSearchInput"
              />
              <div
                v-if="showDropdown && filteredStock.length > 0"
                class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                <div
                  v-for="item in filteredStock"
                  :key="item.id"
                  @click.stop="selectStockItem(item)"
                  class="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                >
                  <div class="font-medium text-sm">{{ item.description }}</div>
                  <div class="text-xs text-gray-500">
                    Stock: {{ item.quantity }} | Unit Cost: {{ formatCurrency(item.unit_cost) }}
                  </div>
                </div>
              </div>
            </div>
          </label>
          <div v-if="selectedStock" class="mt-2 p-2 bg-blue-50 rounded-md">
            <div class="text-sm font-medium text-blue-900">{{ selectedStock.description }}</div>
            <div class="text-xs text-blue-700">Available: {{ selectedStock.quantity }} units</div>
          </div>
        </div>

        <!-- Quantity -->
        <label class="block">
          <span class="block text-sm font-medium text-gray-700 mb-1">Quantity to Consume</span>
          <input
            v-model.number="formData.quantity"
            type="number"
            step="0.001"
            min="0.001"
            class="input"
            :class="{ 'border-amber-300 bg-amber-50': hasStockWarning }"
            placeholder="0.000"
            required
          />
          <!-- Stock Warning (Non-blocking) -->
          <div
            v-if="hasStockWarning"
            class="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2"
          >
            <svg
              class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div class="flex-1">
              <div class="text-sm font-medium text-amber-800">Stock Warning</div>
              <div class="text-sm text-amber-700 mt-1">
                Requested quantity ({{ formData.quantity }}) exceeds available stock ({{
                  selectedStock?.quantity || 0
                }}). This will result in negative inventory. You can still proceed if needed.
              </div>
            </div>
          </div>
        </label>

        <!-- Unit Cost and Revenue -->
        <div class="flex gap-3">
          <label class="flex-1">
            <span class="block text-sm font-medium text-gray-700 mb-1">Unit cost</span>
            <input
              v-model.number="formData.unit_cost"
              type="number"
              step="0.01"
              min="0"
              class="input"
              placeholder="0.00"
              required
            />
          </label>
          <label class="flex-1">
            <span class="block text-sm font-medium text-gray-700 mb-1">Unit revenue</span>
            <input
              v-model.number="formData.unit_rev"
              type="number"
              step="0.01"
              min="0"
              class="input"
              placeholder="0.00"
              required
            />
          </label>
        </div>

        <!-- Summary -->
        <div
          class="summary-card bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm"
        >
          <div class="flex items-center justify-center gap-0 text-base font-semibold">
            <span class="flex items-center gap-2 text-blue-700">
              <Package class="w-7 h-7 text-blue-500" />
              <span>Total cost:</span>
              <span class="text-blue-700">{{ formatCurrency(totalCost) }}</span>
            </span>
            <span class="mx-6 h-10 border-l border-gray-300"></span>
            <span class="flex items-center gap-2 text-green-700">
              <DollarSign class="w-7 h-7 text-green-500" />
              <span>Total revenue:</span>
              <span class="text-green-700">{{ formatCurrency(totalRevenue) }}</span>
            </span>
          </div>
        </div>

        <DialogFooter class="flex gap-2 justify-end mt-2">
          <Button type="button" variant="outline" @click="$emit('close')"> Cancel </Button>
          <Button
            type="submit"
            :variant="hasStockWarning ? 'destructive' : 'default'"
            :disabled="!canSubmit"
            :class="{ 'bg-amber-600 hover:bg-amber-700 border-amber-600': hasStockWarning }"
          >
            <Plus class="w-4 h-4 mr-1" />
            {{ hasStockWarning ? 'Add Material (Warning)' : 'Add Material' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Plus, Package, DollarSign } from 'lucide-vue-next'
import { schemas } from '../../api/generated/api'
import { api } from '../../api/client'
import { useCompanyDefaultsStore } from '../../stores/companyDefaults'
import { debugLog } from '../../utils/debug'
import { formatCurrency } from '@/utils/string-formatting'
import { z } from 'zod'

type StockItem = z.infer<typeof schemas.StockList>

const emit = defineEmits<{
  close: []
  submit: [payload: { stockItem: StockItem; quantity: number; unit_cost: number; unit_rev: number }]
}>()

const companyDefaultsStore = useCompanyDefaultsStore()

const stockItems = ref<StockItem[]>([])
const filteredStock = ref<StockItem[]>([])
const selectedStock = ref<StockItem | null>(null)
const searchTerm = ref('')
const showDropdown = ref(false)
const isLoading = ref(false)
const isSelectingItem = ref(false) // Flag to prevent double calculation
const isSelectingFromDropdown = ref(false)

const formData = ref({
  quantity: 1,
  unit_cost: 0,
  unit_rev: 0,
})

// New computed for stock warning detection
const hasStockWarning = computed(() => {
  return selectedStock.value && formData.value.quantity > selectedStock.value.quantity
})

const canSubmit = computed(() => {
  if (!selectedStock.value) return false

  return (
    selectedStock.value &&
    formData.value.quantity > 0 &&
    formData.value.unit_cost >= 0 &&
    formData.value.unit_rev >= 0
  )
})

const totalRevenue = computed(() => formData.value.unit_rev * formData.value.quantity)
const totalCost = computed(() => formData.value.unit_cost * formData.value.quantity)

async function loadStockItems() {
  isLoading.value = true
  try {
    const response = await api.purchasing_rest_stock_retrieve()
    stockItems.value = response.items
    filteredStock.value = response.items
  } catch (error) {
    debugLog('Failed to load stock items:', error)
  } finally {
    isLoading.value = false
  }
}

function filterStock() {
  let items = stockItems.value

  // Filter by search term
  if (searchTerm.value.trim()) {
    items = items.filter((item) =>
      item.description?.toLowerCase().includes(searchTerm.value.toLowerCase()),
    )
  }

  // Filter out items with zero or negative quantity
  filteredStock.value = items.filter((item) => {
    const quantity = item.quantity
    return quantity > 0
  })

  showDropdown.value = true
}

function handleInputFocus() {
  debugLog('Input focus event. isSelectingFromDropdown:', isSelectingFromDropdown.value)
  if (!isSelectingFromDropdown.value) {
    showDropdown.value = true
  }
}

const stockSearchInput = ref<HTMLInputElement | null>(null)

function selectStockItem(item: StockItem) {
  debugLog('selectStockItem: Starting selection for item:', item.description)
  isSelectingItem.value = true // Prevent watch from running
  isSelectingFromDropdown.value = true // Prevent dropdown from reopening on focus
  debugLog('selectStockItem: isSelectingFromDropdown set to true')

  selectedStock.value = item
  searchTerm.value = item.description || ''

  // Force close dropdown immediately
  showDropdown.value = false
  debugLog('selectStockItem: showDropdown set to false')

  // Use nextTick to ensure the dropdown closes and then blur the input
  nextTick(() => {
    debugLog('selectStockItem: nextTick callback executed')
    showDropdown.value = false
    if (stockSearchInput.value) {
      stockSearchInput.value.blur()
      debugLog('selectStockItem: Input blurred')
    }
    // Reset flag after a short delay to allow focus to return normally later
    setTimeout(() => {
      isSelectingFromDropdown.value = false
      debugLog('selectStockItem: isSelectingFromDropdown reset to false')
    }, 100) // Small delay to ensure blur event propagates
  })

  // Auto-populate unit cost from stock - ensure it's a number
  const unitCostValue: number = (item.unit_cost as number) || 0
  formData.value.unit_cost = unitCostValue

  // Auto-calculate unit revenue with markup
  const markup = companyDefaultsStore.companyDefaults?.materials_markup || 0
  const calculatedRev = unitCostValue * (1 + markup)
  formData.value.unit_rev = calculatedRev

  debugLog(
    'selectStockItem - unit_cost:',
    unitCostValue,
    'markup:',
    markup,
    'calculated:',
    calculatedRev,
    'final:',
    formData.value.unit_rev,
  )

  // Reset flag after a short delay
  nextTick(() => {
    isSelectingItem.value = false
  })
}

// Watch for unit_cost changes to auto-update unit_rev
watch(
  () => formData.value.unit_cost,
  (newCost) => {
    // Skip if we're currently selecting an item to avoid double calculation
    if (isSelectingItem.value) return

    // Ensure newCost is a valid number
    const cost = newCost || 0
    const markup = companyDefaultsStore.companyDefaults?.materials_markup || 0
    const calculatedRev = cost * (1 + markup)
    formData.value.unit_rev = calculatedRev
    debugLog(
      'watch - newCost:',
      newCost,
      'parsed cost:',
      cost,
      'markup:',
      markup,
      'calculated:',
      calculatedRev,
      'final unit_rev:',
      formData.value.unit_rev,
    )
  },
)

function handleSubmit() {
  if (!canSubmit.value || !selectedStock.value) return

  // Log warning but don't block submission
  if (hasStockWarning.value) {
    debugLog('Warning: Consuming more than available quantity:', {
      requested: formData.value.quantity,
      available: selectedStock.value.quantity,
    })
  }

  emit('submit', {
    stockItem: selectedStock.value,
    quantity: formData.value.quantity,
    unit_cost: formData.value.unit_cost,
    unit_rev: formData.value.unit_rev,
  })
}

// Hide dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as Element
  if (!target.closest('.dropdown-container')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  loadStockItems()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
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
