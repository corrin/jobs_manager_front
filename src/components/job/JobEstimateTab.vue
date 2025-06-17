<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">
        Job Estimate
        <span v-if="isLoading" class="ml-2 text-sm text-gray-500">Loading...</span>
      </h2>
      <div class="flex space-x-2">
        <button
          @click="addNewItem"
          :disabled="isLoading"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus class="w-4 h-4 mr-2" />
          Add Item
        </button>
        <button
          @click="saveChanges"
          :disabled="!hasUnsavedChanges || isSaving || isLoading"
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
import type { 
  GridOptions, 
  ColDef, 
  CellValueChangedEvent, 
  GridApi
} from 'ag-grid-community'

// Interfaces para eventos do AG Grid
interface GridReadyParams {
  api: GridApi
}

interface FirstDataRenderedParams {
  api: GridApi
}
import { customTheme } from '@/plugins/ag-grid'
import { createCostLine, updateCostLine } from '@/services/costline.service'
import { fetchCostSet } from '@/services/costing.service'
import type { CostLine } from '@/types/costing.types'

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

// State - agora trabalhando diretamente com CostLine
const costLines = ref<CostLine[]>([])
const nextItemNumber = ref(1)
const hasUnsavedChanges = ref(false)
const isSaving = ref(false)
const isLoading = ref(false)

// Grid height calculation - baseado em CostLines
const gridHeight = computed(() => {
  const headerHeight = 40 // AG Grid header height
  const rowHeight = 35 // AG Grid row height to match TimesheetEntryView
  const minRows = 1 // Always show at least 1 row
  const maxRows = Math.floor((window.innerHeight * 0.6) / rowHeight) // Max rows based on viewport

  const actualRows = Math.max(costLines.value.length, minRows)
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

// Summary calculations - baseado em CostLines
const totalLabourHours = computed(() => {
  return costLines.value
    .filter(line => line.kind === 'time')
    .reduce((total, line) => total + parseFloat(line.quantity), 0)
})

const labourHoursCost = computed(() => {
  return costLines.value
    .filter(line => line.kind === 'time')
    .reduce((total, line) => total + line.total_rev, 0)
})

const materialCostBeforeMarkup = computed(() => {
  return costLines.value
    .filter(line => line.kind === 'material')
    .reduce((total, line) => total + line.total_cost, 0)
})

const materialCostAfterMarkup = computed(() => {
  return costLines.value
    .filter(line => line.kind === 'material')
    .reduce((total, line) => total + line.total_rev, 0)
})

const finalCost = computed(() => {
  return costLines.value.reduce((total, line) => total + line.total_rev, 0)
})

// Initialize with one default empty row
const initializeDefaultRow = () => {
  if (costLines.value.length === 0) {
    const defaultCostLine: Partial<CostLine> = {
      id: 0, // Temporary ID for new items
      kind: 'material', // Default to material (generic item/expense)
      desc: '',
      quantity: '1',
      unit_cost: '0',
      unit_rev: '0',
      meta: {
        item_number: nextItemNumber.value++,
        category: 'mainWork', // Default category
        labour_minutes: 0, // Add labour_minutes field
        is_new: true,
        is_modified: false
      },
      total_cost: 0,
      total_rev: 0
    }
    costLines.value.push(defaultCostLine as CostLine)
  }
}

// Load existing estimate data from CostSet
const loadExistingEstimateData = async () => {
  // Early return se não há jobId
  if (!props.jobId) {
    console.warn('No jobId provided for loading estimate data')
    initializeDefaultRow()
    return
  }

  try {
    isLoading.value = true
    console.log(`🔄 Loading existing estimate data for job ${props.jobId}`)

    // Buscar CostSet do tipo 'estimate'
    const costSet = await fetchCostSet(props.jobId, 'estimate')
    
    // Early return se não há cost_lines
    if (!costSet.cost_lines || costSet.cost_lines.length === 0) {
      console.log('📝 No existing estimate data found, initializing with default row')
      initializeDefaultRow()
      return
    }

    // Corrigir categorias missing e adicionar metadados de controle
    const processedCostLines = costSet.cost_lines.map((line, index) => ({
      ...line,
      meta: {
        ...line.meta,
        item_number: index + 1,
        category: line.meta?.category || (line.kind === 'time' ? 'fabrication' : 'mainWork'),
        is_new: false,
        is_modified: false
      }
    }))
    
    // Atualizar nextItemNumber baseado nos items carregados
    nextItemNumber.value = Math.max(...processedCostLines.map(line => line.meta?.item_number || 0), 0) + 1
    
    // Atualizar estado
    costLines.value = processedCostLines
    hasUnsavedChanges.value = false
    
    console.log(`✅ Loaded ${processedCostLines.length} cost lines successfully`)
    
    // Se nenhum item foi carregado, inicializar com row padrão
    if (processedCostLines.length === 0) {
      initializeDefaultRow()
    }

  } catch (error) {
    console.warn('⚠️ Error loading existing estimate data:', error)
    // Fallback para row padrão em caso de erro
    initializeDefaultRow()
  } finally {
    isLoading.value = false
  }
}

// Função para inferir kind automaticamente baseado nos dados preenchidos
const inferKindFromData = (costLine: CostLine): 'time' | 'material' | 'adjust' => {
  // Se tem hours/time data nos metadados, é time
  if (costLine.meta?.labour_minutes || costLine.meta?.hours) {
    return 'time'
  }
  
  // Se tem item_code ou é claramente um produto/material, é material
  if (costLine.meta?.item_code || costLine.meta?.is_material) {
    return 'material'
  }
  
  // Para qualquer outro caso (expenses, adjustments, misc items), usar material
  // Isso simplifica o modelo - não há mais distinção prática entre material e adjust
  return 'material'
}

// Função para inferir categoria baseado no kind
const inferCategoryFromKind = (kind: 'time' | 'material' | 'adjust'): 'fabrication' | 'mainWork' => {
  switch (kind) {
    case 'time':
      return 'fabrication'
    case 'material':
    case 'adjust':
    default:
      return 'mainWork'
  }
}

// Helper functions - agora baseadas em CostLine
function calculateTotalCost(costLine: CostLine): number {
  // Para CostLine, o total já é calculado automaticamente
  return costLine.total_rev
}

function updateTotalCost(costLine: CostLine) {
  // Recalcular baseado no tipo usando switch-case
  switch (costLine.kind) {
    case 'time': {
      const hours = parseFloat(costLine.quantity) || 0
      costLine.unit_rev = chargeOutRate.value.toString()
      costLine.unit_cost = wageRate.value.toString() 
      break
    }
    case 'material': {
      const unitCost = parseFloat(costLine.unit_cost) || 0
      const markup = 1 + (materialMarkupPercent.value / 100)
      costLine.unit_rev = (unitCost * markup).toString()
      break
    }
    case 'adjust': {
      // Para adjustments, unit_rev é o valor total
      break
    }
  }
  
  // Recalcular totais
  const quantity = parseFloat(costLine.quantity) || 0
  costLine.total_cost = quantity * parseFloat(costLine.unit_cost)
  costLine.total_rev = quantity * parseFloat(costLine.unit_rev)
  
  // Marcar como modificado
  if (costLine.meta) {
    costLine.meta.is_modified = true
  }
  hasUnsavedChanges.value = true
}

function updateCategory(costLine: CostLine) {
  // Lógica melhorada baseada na especificação usando switch-case:
  switch (costLine.kind) {
    case 'time':
      if (costLine.meta) {
        costLine.meta.category = 'fabrication'
      }
      break
    case 'material':
      if (costLine.meta) {
        costLine.meta.category = 'mainWork'
      }
      break
    case 'adjust':
    default:
      // Manter categoria atual para adjustments
      break
  }
}

function handleCellValueChanged(event: CellValueChangedEvent) {
  const costLine = event.data as CostLine

  // Se labour_minutes mudou, recalcular unit_cost baseado em wage_rate
  if (event.colDef.field === 'meta.labour_minutes') {
    const minutes = parseFloat(event.newValue) || 0
    
    if (minutes > 0) {
      // Labour foi definido - calcular unit_cost baseado no wage_rate
      const wageRatePerMinute = wageRate.value / 60
      costLine.unit_cost = (minutes * wageRatePerMinute).toFixed(2)
      costLine.kind = 'time'
      if (costLine.meta) {
        costLine.meta.category = 'fabrication'
      }
    } else {
      // Labour removido - pode voltar a usar unit_cost manual
      costLine.kind = 'material'
      if (costLine.meta) {
        costLine.meta.category = 'mainWork'
      }
    }
    
    updateTotalCost(costLine)
  }
  
  // Se unit_cost mudou e não há labour, bloquear labour
  if (event.colDef.field === 'unit_cost') {
    const unitCost = parseFloat(event.newValue) || 0
    
    if (unitCost > 0 && costLine.meta) {
      // Unit cost foi definido - remover labour e definir como material
      costLine.meta.labour_minutes = 0
      costLine.kind = 'material'
      costLine.meta.category = 'mainWork'
    }
    
    updateTotalCost(costLine)
  }

  // Se quantity, unit_cost ou unit_rev mudaram, recalcular
  if (['quantity', 'unit_cost', 'unit_rev'].includes(event.colDef.field || '')) {
    updateTotalCost(costLine)
  }

  // Inferir kind automaticamente baseado nos dados
  costLine.kind = inferKindFromData(costLine)
  
  // Atualizar categoria baseada no kind inferido
  updateCategory(costLine)

  // Marcar como modificado para qualquer mudança
  if (costLine.meta) {
    costLine.meta.is_modified = true
  }
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

// Save changes function - melhorada para trabalhar com CostLines
async function saveChanges() {
  // Guard clause - early return se não há mudanças
  if (!hasUnsavedChanges.value) {
    console.log('📝 No changes to save')
    return
  }

  try {
    isSaving.value = true
    console.log('💾 Starting save process...')

    // Filtrar apenas cost lines modificadas para otimizar salvamento
    const modifiedCostLines = costLines.value.filter(line => 
      line.meta?.is_modified || line.meta?.is_new
    )

    console.log(`💾 Saving ${modifiedCostLines.length} modified cost lines`)

    let savedCount = 0
    let createdCount = 0
    let updatedCount = 0

    // Processar cada cost line modificada
    for (const costLine of modifiedCostLines) {
      const costLinePayload = prepareCostLinePayload(costLine)
      
      if (costLine.meta?.is_new) {
        // Criar nova cost line
        try {
          const newCostLine = await createCostLine(props.jobId, 'estimate', costLinePayload)
          costLine.id = newCostLine.id // Update with real ID
          if (costLine.meta) {
            costLine.meta.is_new = false
          }
          createdCount++
          console.log(`✅ Created cost line ${newCostLine.id}`)
        } catch (createError) {
          console.error(`❌ Failed to create cost line:`, createError)
          throw createError
        }
      } else {
        // Atualizar cost line existente
        try {
          await updateCostLine(costLine.id, costLinePayload)
          updatedCount++
          console.log(`✅ Updated cost line ${costLine.id}`)
        } catch (updateError) {
          console.error(`❌ Failed to update cost line ${costLine.id}:`, updateError)
          throw updateError
        }
      }
      
      savedCount++
    }

    // Marcar todas as cost lines como salvas apenas após sucesso total
    costLines.value.forEach(line => {
      if (line.meta) {
        line.meta.is_modified = false
      }
    })

    hasUnsavedChanges.value = false
    
    // Log de sucesso com estatísticas
    console.log(`✅ Estimate saved successfully! Created: ${createdCount}, Updated: ${updatedCount}, Total: ${savedCount}`)

  } catch (error) {
    console.error('❌ Error saving estimate:', error)
    throw error
  } finally {
    isSaving.value = false
  }
}

// Função para preparar payload da CostLine para API
function prepareCostLinePayload(costLine: CostLine) {
  return {
    kind: costLine.kind,
    desc: costLine.desc,
    quantity: costLine.quantity,
    unit_cost: costLine.unit_cost,
    unit_rev: costLine.unit_rev,
    meta: {
      ...costLine.meta,
      // Garantir que temos os campos necessários
      item_number: costLine.meta?.item_number || nextItemNumber.value,
      category: costLine.meta?.category || inferCategoryFromKind(costLine.kind)
    }
  }
}

// AG Grid Configuration - simplificado sem coluna Type
const columnDefs: ColDef[] = [
  {
    headerName: 'Item',
    field: 'meta.item_number',
    width: 80,
    editable: false,
    cellClass: 'text-center font-medium'
  },
  {
    headerName: 'Description',
    field: 'desc',
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
    headerName: 'Quantity',
    field: 'quantity',
    width: 100,
    editable: true,
    type: 'numericColumn',
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: {
      min: 0,
      precision: 2
    },
    valueFormatter: (params) => {
      const value = parseFloat(params.value)
      return isNaN(value) ? '1' : value.toString()
    }
  },
  {
    headerName: 'Labour',
    field: 'meta.labour_minutes',
    width: 100,
    editable: true,
    type: 'numericColumn',
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: {
      min: 0,
      precision: 0
    },
    valueFormatter: (params) => {
      const minutes = parseFloat(params.value) || 0
      if (minutes === 0) return ''
      const hours = (minutes / 60).toFixed(1)
      return `${minutes}min (${hours}h)`
    },
    valueSetter: (params) => {
      const minutes = parseFloat(params.newValue) || 0
      
      // Se tem labour, bloquear unit_cost e total_cost
      if (minutes > 0) {
        params.data.unit_cost = '0'
        params.data.meta.category = 'fabrication'
        params.data.kind = 'time'
        
        // Calcular automaticamente unit_cost baseado no wage_rate
        const wageRatePerMinute = (props.companyDefaults?.wage_rate || 60) / 60
        params.data.unit_cost = (minutes * wageRatePerMinute).toFixed(2)
      }
      
      params.data.meta.labour_minutes = minutes
      return true
    },
    cellStyle: (params) => {
      const hasItemCost = parseFloat(params.data.unit_cost) > 0 && !params.data.meta?.labour_minutes
      return hasItemCost ? { backgroundColor: '#F3F4F6', color: '#9CA3AF' } : null
    }
  },
  {
    headerName: 'Unit Cost',
    field: 'unit_cost',
    width: 120,
    editable: true,
    type: 'numericColumn',
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: {
      min: 0,
      precision: 2
    },
    valueFormatter: (params) => {
      const value = parseFloat(params.value)
      return isNaN(value) ? '$0.00' : `$${value.toFixed(2)}`
    },
    valueSetter: (params) => {
      const unitCost = parseFloat(params.newValue) || 0
      
      // Se tem unit_cost, bloquear labour e definir como material
      if (unitCost > 0) {
        params.data.meta.labour_minutes = 0
        params.data.meta.category = 'mainWork'
        params.data.kind = 'material'
      }
      
      params.data.unit_cost = unitCost.toFixed(2)
      return true
    },
    cellStyle: (params) => {
      const hasLabour = (params.data.meta?.labour_minutes || 0) > 0
      return hasLabour ? { backgroundColor: '#F3F4F6', color: '#9CA3AF' } : null
    }
  },
  {
    headerName: 'Unit Revenue',
    field: 'unit_rev',
    width: 120,
    editable: true,
    type: 'numericColumn',
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: {
      min: 0,
      precision: 2
    },
    valueFormatter: (params) => {
      const value = parseFloat(params.value)
      return isNaN(value) ? '$0.00' : `$${value.toFixed(2)}`
    }
  },
  {
    headerName: 'Total Revenue',
    field: 'total_rev',
    width: 120,
    editable: false,
    type: 'numericColumn',
    valueFormatter: (params) => {
      return `$${params.value.toFixed(2)}`
    },
    cellStyle: (params) => {
      return { backgroundColor: '#F3F4F6', fontWeight: 'bold' }
    }
  },
  {
    headerName: 'Category',
    field: 'meta.category',
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
      return `<button class="text-red-600 hover:text-red-800 text-sm" onclick="deleteCostLine('${params.data.id}')">Delete</button>`
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
  getRowId: (params: any) => params.data.id, // Fix AG Grid error #5 with Vue proxy objects
  onCellValueChanged: handleCellValueChanged,
  onGridReady: (params: GridReadyParams) => {
    gridApi = params.api

    // Carregar dados no grid quando estiver pronto
    if (costLines.value.length > 0 && gridApi) {
      gridApi.applyTransaction({ add: costLines.value })
    }

    // Auto-size columns with proper delay and visibility check
    setTimeout(() => {
      if (gridApi && gridContainer.value && gridContainer.value.offsetWidth > 0) {
        gridApi.sizeColumnsToFit()
      }
    }, 200) // Increased delay to ensure grid is visible
  },
  onFirstDataRendered: (params: FirstDataRenderedParams) => {
    // Auto-size columns when data is first rendered with visibility check
    setTimeout(() => {
      if (params.api && gridContainer.value && gridContainer.value.offsetWidth > 0) {
        params.api.sizeColumnsToFit()
      }
    }, 200)
  }
}

// Add new cost line
function addNewItem() {
  const newCostLine: Partial<CostLine> = {
    id: 0, // Temporary ID for new items
    kind: 'material', // Default to material (generic item/expense)
    desc: '',
    quantity: '1',
    unit_cost: '0',
    unit_rev: '0',
    meta: {
      item_number: nextItemNumber.value++,
      category: 'mainWork', // Default category
      is_new: true,
      is_modified: true
    },
    total_cost: 0,
    total_rev: 0
  }

  costLines.value.push(newCostLine as CostLine)
  hasUnsavedChanges.value = true

  // Use applyTransaction instead of setRowData (AG Grid v33 API)
  if (gridApi) {
    gridApi.applyTransaction({ add: [newCostLine] })
    // Focus on the new row
    nextTick(() => {
      const lastRowIndex = costLines.value.length - 1
      gridApi!.setFocusedCell(lastRowIndex, 'desc')
      gridApi!.startEditingCell({ rowIndex: lastRowIndex, colKey: 'desc' })
    })
  }
}

// Delete cost line - global function for button onclick
;(window as any).deleteCostLine = (costLineId: string) => {
  const index = costLines.value.findIndex(line => line.id.toString() === costLineId)
  if (index !== -1) {
    const lineToRemove = costLines.value[index]
    costLines.value.splice(index, 1)
    hasUnsavedChanges.value = true

    // Don't allow empty grid, always keep at least one row
    if (costLines.value.length === 0) {
      initializeDefaultRow()
    }

    // Use applyTransaction instead of setRowData
    if (gridApi) {
      gridApi.applyTransaction({ remove: [lineToRemove] })
    }
  }
}

// Computed totals for categories - baseado em CostLines
const fabricationItems = computed(() => 
  costLines.value.filter(line => line.meta?.category === 'fabrication').length
)

const mainWorkItems = computed(() => 
  costLines.value.filter(line => line.meta?.category === 'mainWork').length
)

const fabricationCost = computed(() => {
  return costLines.value
    .filter(line => line.meta?.category === 'fabrication')
    .reduce((total, line) => total + line.total_rev, 0)
})

const mainWorkCost = computed(() => {
  return costLines.value
    .filter(line => line.meta?.category === 'mainWork')
    .reduce((total, line) => total + line.total_rev, 0)
})

// Currency formatter
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Initialize AG Grid
onMounted(async () => {
  // Carregar dados existentes primeiro
  await loadExistingEstimateData()

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

// Watch para mudanças no jobId e recarregar dados
watch(() => props.jobId, async (newJobId) => {
  if (newJobId) {
    console.log(`🔄 JobId changed to ${newJobId}, reloading estimate data`)
    await loadExistingEstimateData()
    
    // Atualizar grid se já estiver inicializado
    if (gridApi && costLines.value.length > 0) {
      // Obter dados atuais para remover
      const currentRows: CostLine[] = []
      gridApi.forEachNode((node) => currentRows.push(node.data))
      
      // Remover dados atuais e adicionar novos
      if (currentRows.length > 0) {
        gridApi.applyTransaction({ remove: currentRows })
      }
      gridApi.applyTransaction({ add: costLines.value })
    }
  }
}, { immediate: false })

// Watch for data changes to update grid - Remove deep watch that causes setRowData issues
// Instead, let applyTransaction handle updates

// Watch for changes in costLines to force reactivity updates
watch(costLines, () => {
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
