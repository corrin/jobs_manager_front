<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">Job Estimate</h2>
      <div class="flex space-x-2">
        <button
          @click="addNewItem"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus class="w-4 h-4 mr-2" />
          Add Item
        </button>
        <button
          @click="saveChanges"
          :disabled="!hasUnsavedChanges || isSaving"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save class="w-4 h-4 mr-2" />
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <!-- Main Content Layout: Grid + Summary Side by Side -->
    <div class="flex gap-4 h-full">
      <!-- AG Grid Container (60%) -->
      <div class="flex-[3] bg-white rounded-lg border border-gray-200 flex flex-col min-h-0">
        <div
          ref="gridContainer"
          class="ag-theme-custom timesheet-grid"
          :style="{ height: gridHeight + 'px', width: '100%' }"
        ></div>
      </div>

      <!-- Summary Panel (40%) -->
      <div class="flex-[2] bg-gray-50 rounded-lg p-3 border border-gray-200 overflow-y-auto max-h-96">
        <!-- Header -->
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Summary</h3>

        <!-- Main Calculations - Compact -->
        <div class="space-y-2 mb-3">
          <!-- Labour Hours Cost -->
          <div class="bg-blue-50 p-2 rounded border border-blue-200">
            <div class="flex justify-between items-center">
              <div class="text-xs font-medium text-blue-800">Labour</div>
              <div class="text-sm font-bold text-blue-900">{{ formatCurrency(labourHoursCost) }}</div>
            </div>
            <div class="text-xs text-blue-600">{{ totalLabourHours.toFixed(1) }}h</div>
          </div>

          <!-- Material Cost (Before Markup) -->
          <div class="bg-green-50 p-2 rounded border border-green-200">
            <div class="flex justify-between items-center">
              <div class="text-xs font-medium text-green-800">Material</div>
              <div class="text-sm font-bold text-green-900">{{ formatCurrency(materialCostBeforeMarkup) }}</div>
            </div>
            <div class="text-xs text-green-600">Before markup</div>
          </div>

          <!-- Material Cost (After Markup) -->
          <div class="bg-orange-50 p-2 rounded border border-orange-200">
            <div class="flex justify-between items-center">
              <div class="text-xs font-medium text-orange-800">+ Markup</div>
              <div class="text-sm font-bold text-orange-900">{{ formatCurrency(materialCostAfterMarkup) }}</div>
            </div>
            <div class="text-xs text-orange-600">{{ materialMarkupPercent }}%</div>
          </div>

          <!-- Final Cost -->
          <div class="bg-purple-50 p-2 rounded border border-purple-200">
            <div class="flex justify-between items-center">
              <div class="text-xs font-medium text-purple-800">Total</div>
              <div class="text-base font-bold text-purple-900">{{ formatCurrency(finalCost) }}</div>
            </div>
          </div>
        </div>

        <!-- Categories Summary - Compact -->
        <div class="border-t pt-2">
          <h4 class="text-xs font-medium text-gray-900 mb-2">Categories</h4>
          <div class="space-y-1">
            <div class="bg-white p-2 rounded border text-xs">
              <div class="flex justify-between">
                <span class="font-medium">Fabrication ({{ fabricationItems }})</span>
                <span class="font-semibold">{{ formatCurrency(fabricationCost) }}</span>
              </div>
            </div>
            <div class="bg-white p-2 rounded border text-xs">
              <div class="flex justify-between">
                <span class="font-medium">Main Work ({{ mainWorkItems }})</span>
                <span class="font-semibold">{{ formatCurrency(mainWorkCost) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { Plus, Save } from 'lucide-vue-next'
import { createGrid } from 'ag-grid-community'
import type { GridOptions, ColDef, CellValueChangedEvent, GridApi } from 'ag-grid-community'
import { customTheme } from '@/plugins/ag-grid'
import { createCostLine, updateCostLine } from '@/services/costline.service'

interface EstimateItem {
  id: string
  item: number
  quantity: number
  description: string
  labour: number | null  // minutes
  itemCost: number | null
  totalCost: number
  category: 'fabrication' | 'mainWork'
  isModified?: boolean
}

interface Props {
  jobId: string
  companyDefaults?: {
    charge_out_rate: number
    materials_markup: number
    wage_rate: number
  }
}

const props = defineProps<Props>()

// Refs
const gridContainer = ref<HTMLElement>()
let gridApi: GridApi | null = null

// State
const estimateItems = ref<EstimateItem[]>([])
const nextItemNumber = ref(1)
const hasUnsavedChanges = ref(false)
const isSaving = ref(false)

// Grid height calculation - responsive based on rows
const gridHeight = computed(() => {
  const headerHeight = 40 // AG Grid header height
  const rowHeight = 35 // AG Grid row height to match TimesheetEntryView
  const minRows = 1 // Always show at least 1 row
  const maxRows = Math.floor((window.innerHeight * 0.6) / rowHeight) // Max rows based on viewport

  const actualRows = Math.max(estimateItems.value.length, minRows)
  const visibleRows = Math.min(actualRows, maxRows)

  return headerHeight + (visibleRows * rowHeight) + 4 // +4 for borders
})

// Company defaults with fallbacks
const chargeOutRate = computed(() => props.companyDefaults?.charge_out_rate || 150)
const materialMarkupPercent = computed(() => {
  // Company defaults stores markup as decimal (0.2 = 20%), so multiply by 100
  const markup = props.companyDefaults?.materials_markup || 0.2
  return markup * 100
})
const wageRate = computed(() => props.companyDefaults?.wage_rate || 60)

// Summary calculations
const totalLabourHours = computed(() => {
  return estimateItems.value
    .filter(item => item.labour && item.labour > 0)
    .reduce((total, item) => total + (item.quantity * (item.labour! / 60)), 0)
})

const labourHoursCost = computed(() => {
  // Labour revenue calculation: total hours * charge_out_rate
  return totalLabourHours.value * chargeOutRate.value
})

const materialCostBeforeMarkup = computed(() => {
  return estimateItems.value
    .filter(item => item.itemCost && item.itemCost > 0)
    .reduce((total, item) => total + (item.quantity * item.itemCost!), 0)
})

const materialCostAfterMarkup = computed(() => {
  return materialCostBeforeMarkup.value * (1 + materialMarkupPercent.value / 100)
})

const finalCost = computed(() => {
  return labourHoursCost.value + materialCostAfterMarkup.value
})

// Initialize with one default empty row
const initializeDefaultRow = () => {
  if (estimateItems.value.length === 0) {
    const defaultItem: EstimateItem = {
      id: `item_${Date.now()}`,
      item: nextItemNumber.value++,
      quantity: 1,
      description: '',
      labour: null,
      itemCost: null,
      totalCost: 0,
      category: 'mainWork',
      isModified: false
    }
    estimateItems.value.push(defaultItem)
  }
}

// Helper functions
function calculateTotalCost(item: EstimateItem): number {
  if (item.labour && item.labour > 0) {
    // Labour revenue calculation: quantity * (minutes / 60) * charge_out_rate
    return item.quantity * (item.labour * (chargeOutRate.value / 60))
  } else if (item.itemCost && item.itemCost > 0) {
    // Item cost calculation: quantity * item cost
    return item.quantity * item.itemCost
  }
  return 0
}

function updateTotalCost(item: EstimateItem) {
  const autoCalculated = calculateTotalCost(item)
  // Auto-update the total cost
  item.totalCost = autoCalculated
  item.isModified = true
  hasUnsavedChanges.value = true
}

function updateCategory(item: EstimateItem) {
  if (item.labour && item.labour > 0) {
    item.category = 'fabrication'
  } else if (item.itemCost && item.itemCost > 0) {
    item.category = 'mainWork'
  }
}

function handleCellValueChanged(event: CellValueChangedEvent) {
  const item = event.data as EstimateItem

  // If quantity changed, recalculate total cost
  if (event.colDef.field === 'quantity') {
    updateTotalCost(item)
  }

  // If labour or itemCost changed, handle mutual exclusion and recalculate
  if (event.colDef.field === 'labour') {
    if (item.labour && item.labour > 0) {
      item.itemCost = null // Mutual exclusion
    }
    updateTotalCost(item)
    updateCategory(item)
  }

  if (event.colDef.field === 'itemCost') {
    if (item.itemCost && item.itemCost > 0) {
      item.labour = null // Mutual exclusion
    }
    updateTotalCost(item)
    updateCategory(item)
  }

  // Mark as modified for any field change
  item.isModified = true
  hasUnsavedChanges.value = true

  if (gridApi) {
    gridApi.refreshCells({ rowNodes: [event.node], force: true })
  }
}

// Keyboard handler for Shift+Enter
function handleKeyDown(event: KeyboardEvent) {
  if (event.shiftKey && event.key === 'Enter') {
    event.preventDefault()
    addNewItem()
  }
}

// Save changes function
async function saveChanges() {
  try {
    isSaving.value = true

    // Convert each estimate item to CostLine
    for (const item of estimateItems.value) {
      if (!item.isModified && item.id.startsWith('item_')) continue // Skip unmodified new items
      
      const costLinePayload = convertEstimateItemToCostLine(item)
      
      if (item.id.startsWith('item_')) {
        // Create new cost line
        const newCostLine = await createCostLine(props.jobId, 'estimate', costLinePayload)
        item.id = newCostLine.id.toString() // Update with real ID
        console.log('✅ Created new cost line:', newCostLine.id)
      } else {
        // Update existing cost line
        await updateCostLine(parseInt(item.id), costLinePayload)
        console.log('✅ Updated cost line:', item.id)
      }
    }

    // Mark all items as saved
    estimateItems.value.forEach(item => {
      item.isModified = false
    })

    hasUnsavedChanges.value = false
    console.log('✅ Estimate saved successfully!')

  } catch (error) {
    console.error('❌ Error saving estimate:', error)
    // TODO: Add error notification
  } finally {
    isSaving.value = false
  }
}

// Convert EstimateItem to CostLine payload
function convertEstimateItemToCostLine(item: EstimateItem) {
  if (item.labour && item.labour > 0) {
    // Labour entry: time type
    const hours = item.labour / 60
    return {
      kind: 'time' as const,
      desc: item.description,
      quantity: (item.quantity * hours).toString(), // Total hours
      unit_cost: wageRate.value.toString(), // Wage rate for cost
      unit_rev: chargeOutRate.value.toString(), // Charge out rate for revenue
      meta: {
        item_number: item.item,
        category: item.category,
        labour_minutes: item.labour,
        quantity: item.quantity,
        total_cost: item.totalCost,
        created_from_estimate: true
      }
    }
  } else if (item.itemCost && item.itemCost > 0) {
    // Material entry: material type
    const unitRevenue = item.itemCost * (1 + materialMarkupPercent.value / 100)
    return {
      kind: 'material' as const,
      desc: item.description,
      quantity: item.quantity.toString(),
      unit_cost: item.itemCost.toString(),
      unit_rev: unitRevenue.toString(),
      meta: {
        item_number: item.item,
        category: item.category,
        material_markup_percent: materialMarkupPercent.value,
        total_cost: item.totalCost,
        created_from_estimate: true
      }
    }
  } else {
    // Empty or adjustment entry
    return {
      kind: 'adjust' as const,
      desc: item.description || 'Adjustment',
      quantity: item.quantity.toString(),
      unit_cost: '0',
      unit_rev: item.totalCost.toString(),
      meta: {
        item_number: item.item,
        category: item.category,
        created_from_estimate: true
      }
    }
  }
}

// AG Grid Configuration
const columnDefs: ColDef[] = [
  {
    headerName: 'Item',
    field: 'item',
    width: 80,
    editable: false,
    cellClass: 'text-center font-medium'
  },
  {
    headerName: 'Quantity',
    field: 'quantity',
    width: 100,
    editable: true,
    type: 'numericColumn',
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: {
      min: 0,
      precision: 2
    }
  },
  {
    headerName: 'Description',
    field: 'description',
    flex: 1,
    editable: true,
    cellEditor: 'agLargeTextCellEditor',
    cellEditorParams: {
      maxLength: 500,
      rows: 3,
      cols: 50
    }
  },
  {
    headerName: 'Labour (min)',
    field: 'labour',
    width: 120,
    editable: true,
    type: 'numericColumn',
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: {
      min: 0,
      precision: 0
    },
    valueFormatter: (params) => {
      if (params.value === null || params.value === undefined) return ''
      const hours = Math.floor(params.value / 60)
      const minutes = params.value % 60
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    },
    tooltipValueGetter: (params) => {
      if (params.value === null || params.value === undefined) return ''
      const hours = (params.value / 60).toFixed(1)
      return `${hours} hours`
    }
  },
  {
    headerName: 'Item Cost',
    field: 'itemCost',
    width: 120,
    editable: true,
    type: 'numericColumn',
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: {
      min: 0,
      precision: 2
    },
    valueFormatter: (params) => {
      return params.value !== null && params.value !== undefined ? `$${params.value.toFixed(2)}` : ''
    }
  },
  {
    headerName: 'Total Cost',
    field: 'totalCost',
    width: 120,
    editable: true, // Allow manual override
    type: 'numericColumn',
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: {
      min: 0,
      precision: 2
    },
    valueFormatter: (params) => {
      return `$${params.value.toFixed(2)}`
    },
    cellStyle: (params) => {
      // Highlight if manually overridden
      const autoCalculated = calculateTotalCost(params.data)
      if (Math.abs(params.value - autoCalculated) > 0.01) {
        return { backgroundColor: '#FEF3C7', fontWeight: 'bold' }
      }
      return null
    }
  },
  {
    headerName: 'Category',
    field: 'category',
    width: 120,
    editable: true,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: ['fabrication', 'mainWork']
    },
    valueFormatter: (params) => {
      return params.value === 'fabrication' ? 'Fabrication' : 'Main Work'
    },
    cellStyle: (params) => {
      return params.value === 'fabrication'
        ? { backgroundColor: '#DBEAFE', color: '#1E40AF' }
        : { backgroundColor: '#D1FAE5', color: '#065F46' }
    }
  },
  {
    headerName: 'Actions',
    width: 80,
    editable: false,
    cellRenderer: (params: any) => {
      return `<button class="text-red-600 hover:text-red-800 text-sm" onclick="deleteItem('${params.data.id}')">Delete</button>`
    }
  }
]

const gridOptions: GridOptions = {
  theme: customTheme,
  columnDefs,
  defaultColDef: {
    editable: true,
    sortable: true,
    filter: false, // Disable filters to avoid extra UI elements
    resizable: true
  },
  animateRows: true,
  rowSelection: {
    mode: 'singleRow',
    checkboxes: false, // Disable checkboxes to prevent black squares
    enableClickSelection: false // Disable row selection clicking - replaces suppressRowClickSelection
  },
  suppressMenuHide: false,
  suppressColumnMoveAnimation: false,
  domLayout: 'normal',
  headerHeight: 40,
  rowHeight: 35,
  getRowId: (params) => params.data.id, // Fix AG Grid error #5 with Vue proxy objects
  onCellValueChanged: handleCellValueChanged,
  onGridReady: (params) => {
    gridApi = params.api

    // Initialize with default empty row if no data
    if (estimateItems.value.length === 0) {
      initializeDefaultRow()
    }

    // Update row data using new applyTransaction API instead of setRowData
    if (estimateItems.value.length > 0) {
      gridApi.applyTransaction({ add: estimateItems.value })
    }

    // Auto-size columns with proper delay and visibility check
    setTimeout(() => {
      if (gridApi && gridContainer.value && gridContainer.value.offsetWidth > 0) {
        gridApi.sizeColumnsToFit()
      }
    }, 200) // Increased delay to ensure grid is visible
  },
  onFirstDataRendered: (params) => {
    // Auto-size columns when data is first rendered with visibility check
    setTimeout(() => {
      if (params.api && gridContainer.value && gridContainer.value.offsetWidth > 0) {
        params.api.sizeColumnsToFit()
      }
    }, 200)
  }
}

// Add new item
function addNewItem() {
  const newItem: EstimateItem = {
    id: `item_${Date.now()}`,
    item: nextItemNumber.value++,
    quantity: 1,
    description: '',
    labour: null,
    itemCost: null,
    totalCost: 0,
    category: 'mainWork',
    isModified: true
  }

  estimateItems.value.push(newItem)
  hasUnsavedChanges.value = true

  // Use applyTransaction instead of setRowData (AG Grid v33 API)
  if (gridApi) {
    gridApi.applyTransaction({ add: [newItem] })
    // Focus on the new row
    nextTick(() => {
      const lastRowIndex = estimateItems.value.length - 1
      gridApi!.setFocusedCell(lastRowIndex, 'description')
      gridApi!.startEditingCell({ rowIndex: lastRowIndex, colKey: 'description' })
    })
  }
}

// Delete item - global function for button onclick
;(window as any).deleteItem = (itemId: string) => {
  const index = estimateItems.value.findIndex(item => item.id === itemId)
  if (index !== -1) {
    const itemToRemove = estimateItems.value[index]
    estimateItems.value.splice(index, 1)
    hasUnsavedChanges.value = true

    // Don't allow empty grid, always keep at least one row
    if (estimateItems.value.length === 0) {
      initializeDefaultRow()
    }

    // Use applyTransaction instead of setRowData
    if (gridApi) {
      gridApi.applyTransaction({ remove: [itemToRemove] })
    }
  }
}

// Computed totals for categories
const fabricationItems = computed(() => 
  estimateItems.value.filter(item => item.category === 'fabrication').length
)

const mainWorkItems = computed(() => 
  estimateItems.value.filter(item => item.category === 'mainWork').length
)

const fabricationCost = computed(() => {
  return estimateItems.value
    .filter(item => item.category === 'fabrication')
    .reduce((total, item) => total + item.totalCost, 0)
})

const mainWorkCost = computed(() => {
  return estimateItems.value
    .filter(item => item.category === 'mainWork')
    .reduce((total, item) => total + item.totalCost, 0)
})

// Currency formatter
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Initialize AG Grid
onMounted(() => {
  // Initialize with default row
  initializeDefaultRow()

  if (gridContainer.value) {
    createGrid(gridContainer.value, gridOptions)
  }

  // Add keyboard event listener
  window.addEventListener('keydown', handleKeyDown)

  // Add window resize listener
  const handleResize = () => {
    if (gridApi) {
      setTimeout(() => {
        gridApi!.sizeColumnsToFit()
      }, 100)
    }
  }

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', () => {})
})

// Watch for data changes to update grid - Remove deep watch that causes setRowData issues
// Instead, let applyTransaction handle updates

// Watch for changes in estimateItems to force reactivity updates
watch(estimateItems, () => {
  // Force reactivity update for computed values
  nextTick(() => {
    // This ensures the summary panel updates immediately
  })
}, { deep: true })

// Watch grid height changes and update AG Grid
watch(gridHeight, () => {
  if (gridApi && gridContainer.value) {
    nextTick(() => {
      gridContainer.value!.style.height = gridHeight.value + 'px'
      if (gridContainer.value!.offsetWidth > 0) {
        gridApi!.sizeColumnsToFit()
      }
    })
  }
})
</script>

<style scoped>
/* AG Grid custom styling - using new v33 Theme API with custom overrides */
:deep(.ag-theme-custom) {
  font-size: 13px;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* Override header styling to match TimesheetEntryView.vue */
:deep(.ag-theme-custom .ag-header-cell) {
  font-weight: 700;
  background: #181f2a !important;
  color: #f3f4f6 !important;
  border-bottom: 1.5px solid #334155 !important;
  padding: 0 8px;
}

/* Row and cell styling */
:deep(.ag-theme-custom .ag-cell) {
  border-right: 1px solid rgb(226, 232, 240);
  display: flex;
  align-items: center;
  padding: 0 8px;
}

:deep(.ag-theme-custom .ag-row:nth-child(odd)) {
  background-color: rgb(248, 250, 252);
}

:deep(.ag-theme-custom .ag-row:hover) {
  background-color: rgb(241, 245, 249);
}

:deep(.ag-theme-custom .ag-row-selected) {
  background-color: rgb(219, 234, 254) !important;
  border: 1px solid rgb(59, 130, 246);
}

/* Responsive grid scrolling */
:deep(.ag-theme-custom .ag-body-horizontal-scroll) {
  height: 14px !important;
}

:deep(.ag-theme-custom .ag-body-vertical-scroll) {
  width: 14px !important;
}

/* Center text alignment for specific columns */
:deep(.text-center) {
  justify-content: center;
}

/* CRITICAL: Hide all potential black square elements */
:deep(.ag-theme-custom .ag-selection-checkbox),
:deep(.ag-theme-custom .ag-checkbox),
:deep(.ag-theme-custom .ag-checkbox-input-wrapper),
:deep(.ag-theme-custom .ag-header-cell-menu-button),
:deep(.ag-theme-custom .ag-icon-menu),
:deep(.ag-theme-custom .ag-sort-indicator-container),
:deep(.ag-theme-custom .ag-icon),
:deep(.ag-theme-custom .ag-header-cell-filter-button),
:deep(.ag-theme-custom .ag-side-button),
:deep(.ag-theme-custom .ag-panel-title-bar-button),
:deep(.ag-theme-custom .ag-column-select-checkbox),
:deep(.ag-theme-custom .ag-group-checkbox) {
  display: none !important;
  visibility: hidden !important;
}

/* Ensure proper spacing without icons */
:deep(.ag-theme-custom .ag-header-cell-label) {
  justify-content: flex-start;
  padding-left: 0;
  width: 100%;
}

/* Mobile responsiveness */
@media (max-width: 1024px) {
  :deep(.ag-theme-custom) {
    font-size: 12px;
  }

  :deep(.ag-theme-custom .ag-header-cell),
  :deep(.ag-theme-custom .ag-cell) {
    padding: 0 4px;
  }

  /* Hide less important columns on mobile */
  :deep(.ag-theme-custom .ag-header-cell[col-id="labour"]),
  :deep(.ag-theme-custom .ag-cell[col-id="labour"]) {
    display: none;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id="itemCost"]),
  :deep(.ag-theme-custom .ag-cell[col-id="itemCost"]) {
    display: none;
  }
}

/* Even smaller screens - hide more columns */
@media (max-width: 640px) {
  :deep(.ag-theme-custom) {
    font-size: 11px;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id="category"]),
  :deep(.ag-theme-custom .ag-cell[col-id="category"]) {
    display: none;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id="actions"]),
  :deep(.ag-theme-custom .ag-cell[col-id="actions"]) {
    display: none;
  }
}
</style>
