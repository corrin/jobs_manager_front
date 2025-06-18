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
          title="Add new item (Shift+N)"
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

        <!-- Main Calculations - Simplificado conforme nova especificação -->
        <div class="space-y-2 mb-3">
          <!-- Labour Cost (primeira linha) -->
          <div class="bg-blue-50 p-2 rounded border border-blue-200">
            <div class="flex justify-between items-center">
              <div class="text-xs font-medium text-blue-800">Labour Cost</div>
              <div class="text-sm font-bold text-blue-900">{{ formatCurrency(totalLabourCost) }}</div>
            </div>
            <div class="text-xs text-blue-600">{{ totalLabourHours.toFixed(1) }}h × ${{ wageRate }}/h (internal)</div>
          </div>

          <!-- Material Cost (segunda linha) -->
          <div class="bg-green-50 p-2 rounded border border-green-200">
            <div class="flex justify-between items-center">
              <div class="text-xs font-medium text-green-800">Material Cost</div>
              <div class="text-sm font-bold text-green-900">{{ formatCurrency(materialCostBeforeMarkup) }}</div>
            </div>
            <div class="text-xs text-green-600">Total material costs</div>
          </div>

          <!-- Labour Revenue -->
          <div class="bg-orange-50 p-2 rounded border border-orange-200">
            <div class="flex justify-between items-center">
              <div class="text-xs font-medium text-orange-800">Labour Revenue</div>
              <div class="text-sm font-bold text-orange-900">{{ formatCurrency(labourHoursCost) }}</div>
            </div>
            <div class="text-xs text-orange-600">{{ totalLabourHours.toFixed(1) }}h × ${{ chargeOutRate }}/h</div>
          </div>

          <!-- Material Revenue -->
          <div class="bg-yellow-50 p-2 rounded border border-yellow-200">
            <div class="flex justify-between items-center">
              <div class="text-xs font-medium text-yellow-800">Material Revenue</div>
              <div class="text-sm font-bold text-yellow-900">{{ formatCurrency(materialCostAfterMarkup) }}</div>
            </div>
            <div class="text-xs text-yellow-600">{{ materialMarkupPercent }}% markup</div>
          </div>

          <!-- Total Revenue -->
          <div class="bg-purple-50 p-2 rounded border border-purple-200">
            <div class="flex justify-between items-center">
              <div class="text-xs font-medium text-purple-800">Total Revenue</div>
              <div class="text-base font-bold text-purple-900">{{ formatCurrency(finalCost) }}</div>
            </div>
            <div class="text-xs text-purple-600">Labour + Material Revenue</div>
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
import { createCostLine, updateCostLine, deleteCostLine } from '@/services/costline.service'
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

// Summary calculations - conforme especificação
const totalLabourHours = computed(() => {
  console.log('⏰ Labour calculation - Lines:', costLines.value.filter(line => line.kind === 'time').length)
  
  // CORREÇÃO: Usar campos principais do banco, não meta!
  // Para itens de tempo: total_cost / wage_rate = horas totais
  const totalHours = costLines.value
    .filter(line => line.kind === 'time') // Filtrar por kind, não meta
    .reduce((total, line) => {
      // Usar total_cost e wage_rate para calcular horas
      const totalCost = parseFloat(String(line.total_cost)) || 0
      const wageRateValue = wageRate.value || 32
      
      // Se temos custo e wage_rate, calcular horas: total_cost / wage_rate
      const hoursForLine = wageRateValue > 0 ? totalCost / wageRateValue : 0
      
      console.log(`Line ${line.id}: total_cost=${totalCost} ÷ wage_rate=${wageRateValue} = ${hoursForLine}h`)
      return total + hoursForLine
    }, 0)
  
  console.log('⏰ Labour calculation - Total hours from DB fields:', totalHours)
  return totalHours
})

const labourHoursCost = computed(() => {
  // Labour Hours Cost = (total minutos / 60) * charge_out_rate
  const cost = totalLabourHours.value * chargeOutRate.value
  console.log('💰 Labour Hours Cost calculation - Hours:', totalLabourHours.value, 'Rate:', chargeOutRate.value, 'Cost:', cost)
  return cost
})

const totalLabourCost = computed(() => {
  // Total Labour Cost (interno) = (total minutos / 60) * wage_rate
  const cost = totalLabourHours.value * wageRate.value
  console.log('💼 Total Labour Cost calculation - Hours:', totalLabourHours.value, 'Wage:', wageRate.value, 'Cost:', cost)
  return cost
})

const materialCostBeforeMarkup = computed(() => {
  // Soma do total_cost de todos os materiais
  return costLines.value
    .filter(line => line.meta?.total_cost && !line.meta?.labour_minutes)
    .reduce((total, line) => total + parseFloat(String(line.meta?.total_cost || 0)), 0)
})

const materialCostAfterMarkup = computed(() => {
  // Total cost + MU = materiais + markup
  const markup = materialMarkupPercent.value / 100
  return materialCostBeforeMarkup.value * (1 + markup)
})

const finalCost = computed(() => {
  // Final Cost = Labour Hours Cost + Total Cost + MU
  return labourHoursCost.value + materialCostAfterMarkup.value
})

// Initialize with one default empty row
const initializeDefaultRow = () => {
  if (costLines.value.length === 0) {
    const defaultCostLine: Partial<CostLine> = {
      id: Date.now(), // Use timestamp for unique ID
      kind: 'material', // Default to material
      desc: '',
      quantity: '1',
      unit_cost: '0',
      unit_rev: '0',
      meta: {
        item_number: nextItemNumber.value++,
        category: 'mainWork', // Default category
        labour_minutes: 0,
        item_cost: 0,
        total_cost: 0,
        is_new: true,
        is_modified: false,
        empty_line: true // Flag para identificar linha inicial vazia
      },
      total_cost: 0,
      total_rev: 0
    }
    costLines.value.push(defaultCostLine as CostLine)
  }
}

// Função para garantir que sempre há uma linha vazia no final
const ensureEmptyRowAtEnd = () => {
  // Verificar se a última linha está vazia
  const lastLine = costLines.value[costLines.value.length - 1]
  const isLastLineEmpty = lastLine && 
    !lastLine.desc && 
    !lastLine.meta?.labour_minutes && 
    !lastLine.meta?.item_cost && 
    !lastLine.meta?.total_cost

  if (!isLastLineEmpty) {
    console.log('📝 Adding empty row at end for better UX')
    const emptyLine: Partial<CostLine> = {
      id: Date.now() + Math.random(), // Ensure unique ID
      kind: 'material',
      desc: '',
      quantity: '1',
      unit_cost: '0',
      unit_rev: '0',
      meta: {
        item_number: nextItemNumber.value++,
        category: 'mainWork',
        labour_minutes: 0,
        item_cost: 0,
        total_cost: 0,
        is_new: true,
        is_modified: false,
        empty_line: true // Flag para identificar linha vazia
      },
      total_cost: 0,
      total_rev: 0
    }
    
    costLines.value.push(emptyLine as CostLine)
    
    // Adicionar no grid também
    if (gridApi) {
      gridApi.applyTransaction({ add: [emptyLine] })
    }
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

    // Processar cost lines com nova estrutura e normalizar tipos
    const processedCostLines = costSet.cost_lines.map((line, index) => ({
      ...line,
      // Garantir que quantity é sempre string
      quantity: String(line.quantity || '1'),
      // Garantir que unit_cost e unit_rev são strings
      unit_cost: String(line.unit_cost || '0'),
      unit_rev: String(line.unit_rev || '0'),
      meta: {
        ...line.meta,
        item_number: index + 1,
        category: line.meta?.category || (line.meta?.labour_minutes ? 'fabrication' : 'mainWork'),
        // Garantir que valores numéricos são numbers
        labour_minutes: Number(line.meta?.labour_minutes || 0),
        item_cost: Number(line.meta?.item_cost || 0),
        total_cost: Number(line.meta?.total_cost || 0),
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
    
    // Sempre garantir linha vazia no final
    ensureEmptyRowAtEnd()

  } catch (error) {
    console.warn('⚠️ Error loading existing estimate data:', error)
    // Fallback para row padrão em caso de erro
    initializeDefaultRow()
    // Garantir linha vazia
    ensureEmptyRowAtEnd()
  } finally {
    isLoading.value = false
  }
}

function handleCellValueChanged(event: CellValueChangedEvent) {
  const costLine = event.data as CostLine
  console.log('🔄 Cell value changed:', event.colDef.field, 'New value:', event.newValue, 'Row ID:', costLine.id)
  console.log('📊 Full row data before change:', {
    id: costLine.id,
    desc: costLine.desc,
    quantity: costLine.quantity,
    item_cost: costLine.meta?.item_cost,
    total_cost: costLine.meta?.total_cost,
    labour_minutes: costLine.meta?.labour_minutes
  })

  // Quando quantity muda, recalcular total_cost baseado em item_cost
  if (event.colDef.field === 'quantity') {
    const qty = parseFloat(event.newValue) || 1
    const itemCost = parseFloat(String(costLine.meta?.item_cost || 0))
    
    if (itemCost > 0 && !costLine.meta?.labour_minutes) {
      costLine.meta.total_cost = (qty * itemCost).toFixed(2)
      console.log('📊 Recalculated total_cost:', costLine.meta.total_cost)
    }
  }

  // Marcar como modificado para qualquer mudança
  if (costLine.meta) {
    costLine.meta.is_modified = true
  }
  
  hasUnsavedChanges.value = true

  // Forçar refresh das células e trigger de reatividade
  if (gridApi) {
    gridApi.refreshCells({ rowNodes: [event.node], force: true })
  }
  
  // Forçar atualização do summary via nextTick
  nextTick(() => {
    // Trigger de atualização manual dos computed values
    console.log('📈 Summary update triggered - Labour hours:', totalLabourHours.value, 'Material cost:', materialCostBeforeMarkup.value)
    
    // Forçar summary update
    triggerSummaryUpdate()
  })
}

// Keyboard handler for Shift+N (mais robusto e confiável)
function handleKeyDown(event: KeyboardEvent) {
  // Só processar se não estamos dentro de um input/textarea
  const target = event.target as HTMLElement
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
    return
  }
  
  if (event.shiftKey && event.key === 'N') {
    event.preventDefault()
    event.stopPropagation()
    console.log('🎯 Shift+N pressed - adding new item')
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

    // Filtrar apenas cost lines modificadas e que não são linhas vazias
    const modifiedCostLines = costLines.value.filter(line => {
      // Critério mais rigoroso para detectar linhas vazias
      const isEmpty = (
        (!line.desc || line.desc.trim() === '') && // Sem descrição
        (!line.meta?.labour_minutes || line.meta.labour_minutes <= 0) && // Sem labour
        (!line.meta?.item_cost || parseFloat(line.meta.item_cost.toString()) <= 0) && // Sem item cost
        (!line.meta?.total_cost || parseFloat(line.meta.total_cost.toString()) <= 0) // Sem total cost
      )
      
      // Filtrar linhas modificadas e não vazias
      const isModified = line.meta?.is_modified || line.meta?.is_new
      
      if (isEmpty) {
        console.log('🚫 Skipping empty line:', line.id, {
          desc: line.desc,
          labour_minutes: line.meta?.labour_minutes,
          item_cost: line.meta?.item_cost,
          total_cost: line.meta?.total_cost
        })
        return false
      }
      
      return isModified
    })

    console.log(`💾 Saving ${modifiedCostLines.length} modified cost lines (filtered out empty lines)`)

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
    
    // Forçar autocalculation do summary após salvar
    triggerSummaryUpdate()
    
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
  // Calcular campos principais baseados nos meta
  let calculatedUnitCost = 0.00
  let calculatedUnitRev = 0.00
  
  if (costLine.meta?.labour_minutes && costLine.meta.labour_minutes > 0) {
    // Para items de tempo: unit_cost = (labour_minutes/60) * wage_rate, unit_rev = (labour_minutes/60) * charge_out_rate
    const hours = costLine.meta.labour_minutes / 60
    calculatedUnitCost = Number((hours * wageRate.value).toFixed(2))
    calculatedUnitRev = Number((hours * chargeOutRate.value).toFixed(2))
  } else if (costLine.meta?.item_cost && parseFloat(String(costLine.meta.item_cost)) > 0) {
    // Para items de material: unit_cost = item_cost, unit_rev = item_cost (assumindo markup = 0 por enquanto)
    calculatedUnitCost = Number(costLine.meta.item_cost)
    calculatedUnitRev = Number(costLine.meta.item_cost) // Pode ser ajustado com markup depois
  }

  // Garantir que quantity é um número válido
  const numericQuantity = parseFloat(String(costLine.quantity)) || 1.0

  const payload = {
    kind: costLine.kind,
    desc: costLine.desc || '',
    quantity: numericQuantity.toFixed(3), // Enviar como string formatada para DecimalField
    unit_cost: calculatedUnitCost.toFixed(2), // Enviar como string formatada para DecimalField
    unit_rev: calculatedUnitRev.toFixed(2), // Enviar como string formatada para DecimalField
    meta: {
      ...costLine.meta,
      // Garantir que temos os campos necessários
      item_number: costLine.meta?.item_number || nextItemNumber.value,
      category: costLine.meta?.category || (costLine.meta?.labour_minutes ? 'fabrication' : 'mainWork')
    }
  }
  
  console.log('📦 Prepared payload for cost line:', costLine.id, payload)
  return payload
}

// AG Grid Configuration - conforme especificação
const columnDefs: ColDef[] = [
  {
    headerName: 'Item',
    field: 'meta.item_number',
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
      min: 0.01,
      precision: 3,
      step: 0.01
    },
    valueParser: (params) => {
      // Converter vírgula para ponto para compatibilidade com locale brasileiro
      if (typeof params.newValue === 'string') {
        const normalizedValue = params.newValue.replace(',', '.')
        const parsed = parseFloat(normalizedValue)
        return isNaN(parsed) ? '1.000' : parsed.toFixed(3) // Retornar como string formatada
      }
      const parsed = parseFloat(params.newValue) || 1
      return parsed.toFixed(3) // Retornar como string formatada
    },
    valueFormatter: (params) => {
      // Ensure we handle both string and number values properly
      const value = params.value
      if (value === null || value === undefined || value === '') {
        return '1'
      }
      const numValue = typeof value === 'string' ? parseFloat(value) : Number(value)
      return isNaN(numValue) ? '1' : numValue.toString()
    },
    valueSetter: (params) => {
      const qty = parseFloat(params.newValue) || 1
      const currentQty = parseFloat(params.data.quantity) || 1
      
      // Se o valor não mudou, não fazer nada
      if (qty === currentQty) {
        return false
      }
      
      // Keep quantity as string since it's stored as string in the data model
      params.data.quantity = qty.toString()
      
      // Recalcular baseado no tipo de item
      if (params.data.meta?.labour_minutes && params.data.meta.labour_minutes > 0) {
        // Para items de tempo: labour_minutes permanece FIXO (tempo por unidade)
        // Quantity apenas multiplica o resultado final
        const minutesPerUnit = params.data.meta.labour_minutes // tempo fixo por unidade
        const hoursPerUnit = minutesPerUnit / 60
        
        // Calcular custo e revenue por unidade (não mudam com quantity)
        const unitCost = (hoursPerUnit * wageRate.value).toFixed(2)
        const unitRev = (hoursPerUnit * chargeOutRate.value).toFixed(2)
        
        // Total = unit_cost/unit_rev * quantity
        params.data.unit_cost = unitCost
        params.data.unit_rev = unitRev
        params.data.total_cost = parseFloat(unitCost) * qty
        params.data.total_rev = parseFloat(unitRev) * qty
        
        console.log(`💼 Updated DB fields for labour quantity change: qty=${qty}, labour_minutes=${minutesPerUnit} (fixed per unit), total_cost=${params.data.total_cost}`)
      } else {
        // Para items de material: recalcular total_cost se tem item_cost
        const itemCost = parseFloat(String(params.data.meta?.item_cost || 0))
        if (itemCost > 0) {
          const totalCost = Number((qty * itemCost).toFixed(2))
          params.data.meta.total_cost = totalCost
          
          // Atualizar campos principais do banco
          const unitCost = itemCost.toFixed(2)
          const unitRev = itemCost.toFixed(2)
          
          params.data.unit_cost = unitCost
          params.data.unit_rev = unitRev
          params.data.total_cost = totalCost
          params.data.total_rev = totalCost
          
          console.log(`💼 Updated DB fields for material quantity change: qty=${qty}, total_cost=${totalCost}`)
          console.log('📊 Recalculated total_cost:', totalCost)
        }
      }
      
      // Marcar como modificado
      params.data.meta.is_modified = true
      hasUnsavedChanges.value = true
      
      // Forçar refresh da célula total_cost
      nextTick(() => {
        if (gridApi && params.node) {
          gridApi.refreshCells({ 
            rowNodes: [params.node], 
            columns: ['meta.total_cost'],
            force: true 
          })
        }
      })
      
      return true
    }
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
    headerName: 'Labour',
    field: 'meta.labour_minutes',
    width: 120,
    editable: (params) => {
      // Só editable se não tem item_cost ou total_cost
      const hasItemCost = parseFloat(params.data.meta?.item_cost || '0') > 0 || parseFloat(params.data.meta?.total_cost || '0') > 0
      return !hasItemCost
    },
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
      const currentMinutes = parseFloat(params.data.meta?.labour_minutes || 0)
      
      // Se o valor não mudou, não fazer nada para evitar loops
      if (minutes === currentMinutes) {
        console.log('🔄 Labour valueSetter: Value unchanged, skipping')
        return false
      }
      
      console.log('🔄 Labour valueSetter: Changing from', currentMinutes, 'to', minutes, 'for row', params.data.id)
      
      // Se tem labour, bloquear item_cost e total_cost
      if (minutes > 0) {
        params.data.meta.item_cost = 0
        params.data.meta.total_cost = 0
        params.data.meta.category = 'fabrication'
        params.data.kind = 'time'
        
        // CORREÇÃO: quantity permanece inalterado (representa número de itens)
        // labour_minutes representa tempo POR ITEM
        const currentQuantity = parseFloat(params.data.quantity) || 1
        const hoursPerItem = minutes / 60
        const totalHours = hoursPerItem * currentQuantity
        
        // Unit cost/rev baseado no tempo POR ITEM
        const unitCost = (hoursPerItem * wageRate.value).toFixed(2)
        const unitRev = (hoursPerItem * chargeOutRate.value).toFixed(2)
        
        // Total cost/rev considera a quantidade de itens
        params.data.unit_cost = unitCost
        params.data.unit_rev = unitRev
        params.data.total_cost = parseFloat(unitCost) * currentQuantity
        params.data.total_rev = parseFloat(unitRev) * currentQuantity
        
        console.log(`💼 Updated DB fields for labour: qty=${currentQuantity}, labour_minutes=${minutes}, unit_cost=${unitCost}, unit_rev=${unitRev}, total_hours=${totalHours}`)
      }
      
      // Ensure we're setting a number value for labour_minutes
      params.data.meta.labour_minutes = Number(minutes)
      
      // Marcar como modificado e forçar atualização do summary
      params.data.meta.is_modified = true
      hasUnsavedChanges.value = true
      
      // Forçar refresh das células relacionadas
      nextTick(() => {
        if (gridApi && params.node) {
          gridApi.refreshCells({ 
            rowNodes: [params.node], 
            columns: ['meta.item_cost', 'meta.total_cost'],
            force: true 
          })
        }
      })
      
      return true
    },
    cellStyle: (params) => {
      const hasItemCost = parseFloat(params.data.meta?.item_cost || '0') > 0 || parseFloat(params.data.meta?.total_cost || '0') > 0
      return hasItemCost ? { 
        backgroundColor: '#E5E7EB', 
        color: '#6B7280', 
        cursor: 'not-allowed',
        opacity: '0.7',
        fontStyle: 'italic'
      } : null
    }
  },
  {
    headerName: 'Item Cost',
    field: 'meta.item_cost',
    width: 120,
    editable: (params) => {
      // Só editable se não tem labour
      const hasLabour = (params.data.meta?.labour_minutes || 0) > 0
      return !hasLabour
    },
    type: 'numericColumn',
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: {
      min: 0,
      precision: 2
    },
    valueFormatter: (params) => {
      const value = parseFloat(params.value) || 0
      return `$${value.toFixed(2)}`
    },
    valueSetter: (params) => {
      const itemCost = parseFloat(params.newValue) || 0
      const currentItemCost = parseFloat(params.data.meta?.item_cost || 0)
      
      // Se o valor não mudou, não fazer nada para evitar loops
      if (itemCost === currentItemCost) {
        console.log('🔄 Item Cost valueSetter: Value unchanged, skipping')
        return false
      }
      
      console.log('💰 Item Cost valueSetter triggered:', {
        rowId: params.node?.id,
        oldValue: params.oldValue,
        newValue: params.newValue,
        currentItemCost,
        itemCost,
        desc: params.data.desc
      })
      
      // Se tem item_cost, bloquear labour e definir como material
      if (itemCost > 0) {
        console.log('🔒 Blocking labour for item cost > 0')
        params.data.meta.labour_minutes = 0
        params.data.meta.category = 'mainWork'
        params.data.kind = 'material'
        
        // Recalcular total_cost automaticamente
        const qty = parseFloat(params.data.quantity) || 1
        const totalCost = Number((itemCost * qty).toFixed(2))
        params.data.meta.total_cost = totalCost
        
        // Atualizar campos principais do banco baseados no item_cost
        const unitCost = itemCost.toFixed(2)
        const unitRev = itemCost.toFixed(2) // Assumindo markup = 0 por enquanto
        
        params.data.unit_cost = unitCost
        params.data.unit_rev = unitRev
        params.data.total_cost = totalCost
        params.data.total_rev = totalCost
        
        console.log(`💼 Updated DB fields for material: qty=${qty}, unit_cost=${unitCost}, unit_rev=${unitRev}, total_cost=${totalCost}`)
        console.log('📊 Recalculated total_cost:', totalCost)
      } else {
        console.log('💰 Item cost is 0, not applying mutual exclusion logic')
      }
      
      // Ensure we're setting a number value for item_cost
      params.data.meta.item_cost = Number(itemCost.toFixed(2))
      
      // Marcar como modificado e forçar atualização do summary
      params.data.meta.is_modified = true
      hasUnsavedChanges.value = true
      
      // Forçar refresh das células relacionadas
      nextTick(() => {
        if (gridApi && params.node) {
          gridApi.refreshCells({ 
            rowNodes: [params.node], 
            columns: ['meta.labour_minutes', 'meta.total_cost'],
            force: true 
          })
        }
      })
      
      return true
    },
    cellStyle: (params) => {
      const hasLabour = (params.data.meta?.labour_minutes || 0) > 0
      return hasLabour ? { 
        backgroundColor: '#E5E7EB', 
        color: '#6B7280', 
        cursor: 'not-allowed',
        opacity: '0.7',
        fontStyle: 'italic'
      } : null
    }
  },
  {
    headerName: 'Total Cost',
    field: 'meta.total_cost',
    width: 120,
    hide: true, // Ocultar coluna mas manter toda a lógica
    editable: (params) => {
      // Só editable se não tem labour
      const hasLabour = (params.data.meta?.labour_minutes || 0) > 0
      return !hasLabour
    },
    type: 'numericColumn',
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: {
      min: 0,
      precision: 2
    },
    valueFormatter: (params) => {
      const value = parseFloat(params.value) || 0
      return `$${value.toFixed(2)}`
    },
    valueSetter: (params) => {
      const totalCost = parseFloat(params.newValue) || 0
      const currentTotalCost = parseFloat(params.data.meta?.total_cost || 0)
      
      // Se o valor não mudou, não fazer nada para evitar loops
      if (totalCost === currentTotalCost) {
        console.log('🔄 Total Cost valueSetter: Value unchanged, skipping')
        return false
      }
      
      console.log('🔄 Total Cost valueSetter: Changing from', currentTotalCost, 'to', totalCost, 'for row', params.data.id)
      
      // Se tem total_cost, bloquear labour e definir como material
      if (totalCost > 0) {
        params.data.meta.labour_minutes = 0
        params.data.meta.category = 'mainWork'
        params.data.kind = 'material'
        
        // Recalcular item_cost baseado no total_cost e quantity
        const qty = parseFloat(params.data.quantity) || 1
        const itemCost = qty > 0 ? Number((totalCost / qty).toFixed(2)) : 0
        params.data.meta.item_cost = itemCost
        
        // Atualizar campos principais do banco baseados no total_cost
        const unitCost = itemCost.toFixed(2)
        const unitRev = itemCost.toFixed(2) // Assumindo markup = 0 por enquanto
        
        params.data.unit_cost = unitCost
        params.data.unit_rev = unitRev
        params.data.total_cost = totalCost
        params.data.total_rev = totalCost
        
        console.log(`💼 Updated DB fields for total_cost: qty=${qty}, unit_cost=${unitCost}, unit_rev=${unitRev}, total_cost=${totalCost}`)
      }
      
      // Ensure we're setting a number value for total_cost
      params.data.meta.total_cost = Number(totalCost.toFixed(2))
      
      // Marcar como modificado e forçar atualização do summary
      params.data.meta.is_modified = true
      hasUnsavedChanges.value = true
      
      // Forçar refresh das células relacionadas
      nextTick(() => {
        if (gridApi && params.node) {
          gridApi.refreshCells({ 
            rowNodes: [params.node], 
            columns: ['meta.labour_minutes', 'meta.item_cost'],
            force: true 
          })
        }
      })
      
      return true
    },
    cellStyle: (params) => {
      const hasLabour = (params.data.meta?.labour_minutes || 0) > 0
      return hasLabour ? { 
        backgroundColor: '#E5E7EB', 
        color: '#6B7280', 
        cursor: 'not-allowed',
        opacity: '0.7',
        fontStyle: 'italic'
      } : null
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
  getRowId: (params: any) => String(params.data.id), // Ensure string IDs to fix AG Grid error #25
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

// Forçar atualização do summary
function triggerSummaryUpdate() {
  console.log('📊 Triggering summary update...')
  nextTick(() => {
    // Força re-computação de todos os valores calculados
    const summaryData = {
      labourHours: totalLabourHours.value,
      labourCost: labourHoursCost.value,
      materialCost: materialCostBeforeMarkup.value,
      materialAfterMarkup: materialCostAfterMarkup.value,
      finalCost: finalCost.value,
      fabricationItems: fabricationItems.value,
      mainWorkItems: mainWorkItems.value
    }
    console.log('📈 Summary updated:', summaryData)
  })
}

// Add new cost line - sempre criar uma nova linha quando solicitado
function addNewItem() {
  console.log('🎯 Shift+N pressed - creating new empty line')
  
  // Sempre criar uma nova linha vazia
  const newEmptyLine: Partial<CostLine> = {
    id: Date.now() + Math.random(), // Ensure unique ID
    kind: 'material',
    desc: '',
    quantity: '1',
    unit_cost: '0',
    unit_rev: '0',
    meta: {
      item_number: nextItemNumber.value++,
      category: 'mainWork',
      labour_minutes: 0,
      item_cost: 0,
      total_cost: 0,
      is_new: true,
      is_modified: false
    },
    total_cost: 0,
    total_rev: 0
  }
  
  costLines.value.push(newEmptyLine as CostLine)
  hasUnsavedChanges.value = true
  
  // Adicionar no grid
  if (gridApi) {
    gridApi.applyTransaction({ add: [newEmptyLine] })
    
    // Focar na nova linha
    nextTick(() => {
      const lastRowIndex = costLines.value.length - 1
      gridApi!.setFocusedCell(lastRowIndex, 'desc')
      gridApi!.startEditingCell({ rowIndex: lastRowIndex, colKey: 'desc' })
    })
  }
  
  // Trigger summary update
  triggerSummaryUpdate()
}

// Delete cost line - global function for button onclick
;(window as any).deleteCostLine = async (costLineId: string) => {
  console.log('🗑️ COMPONENT: Starting delete operation for cost line ID:', costLineId)
  console.log('🗑️ COMPONENT: Current costLines array:', costLines.value.map(line => ({ 
    id: line.id, 
    desc: line.desc, 
    empty_line: line.meta?.empty_line,
    is_new: line.meta?.is_new 
  })))
  
  // Encontrar o índice correto usando conversão de tipos apropriada
  const index = costLines.value.findIndex(line => {
    // Converter ambos para string para comparação consistente
    const lineIdStr = String(line.id)
    const targetIdStr = String(costLineId)
    console.log('🔍 COMPONENT: Comparing line ID:', lineIdStr, 'with target:', targetIdStr)
    return lineIdStr === targetIdStr
  })
  
  console.log('🔍 COMPONENT: Found line at index:', index)
  
  if (index !== -1) {
    const lineToRemove = costLines.value[index]
    console.log('🗑️ COMPONENT: Line to remove:', {
      id: lineToRemove.id,
      desc: lineToRemove.desc,
      empty_line: lineToRemove.meta?.empty_line,
      is_new: lineToRemove.meta?.is_new
    })
    
    // Verificar se a linha está realmente vazia OU é nova (baseado no conteúdo real, não na flag)
    const isReallyEmpty = !lineToRemove.desc?.trim() && 
                         (!lineToRemove.meta?.labour_minutes || lineToRemove.meta.labour_minutes === 0) &&
                         (!lineToRemove.meta?.item_cost || lineToRemove.meta.item_cost === 0)
    
    const shouldDeleteFromBackend = lineToRemove.id && 
                                   typeof lineToRemove.id === 'number' && 
                                   !lineToRemove.meta?.is_new && 
                                   !isReallyEmpty

    if (shouldDeleteFromBackend) {
      try {
        console.log('🗑️ COMPONENT: Calling deleteCostLine service for backend deletion...')
        await deleteCostLine(Number(lineToRemove.id))
        console.log('✅ COMPONENT: Backend deletion completed successfully')
      } catch (error: any) {
        console.error('❌ COMPONENT: Backend deletion failed:', error)
        // Verificar se é um erro de rede
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
          console.error('🌐 COMPONENT: Network error detected - check backend connection')
        }
        // Mesmo assim, continuar com a remoção do frontend para UX
      }
    } else {
      console.log('⏭️ COMPONENT: Skipping backend deletion - ID:', lineToRemove.id, 'is_new:', lineToRemove.meta?.is_new, 'isEmpty:', isReallyEmpty)
    }
    
    // Remover da array reativa
    console.log('🗑️ COMPONENT: Removing from reactive array...')
    costLines.value.splice(index, 1)
    hasUnsavedChanges.value = true

    // Atualizar grid usando applyTransaction
    if (gridApi) {
      console.log('🗑️ COMPONENT: Updating AG Grid...')
      gridApi.applyTransaction({ remove: [lineToRemove] })
    }
    
    // SEMPRE garantir linha vazia após deleção
    console.log('🗑️ COMPONENT: Ensuring empty row at end...')
    ensureEmptyRowAtEnd()
    
    // Forçar autocalculation do summary
    console.log('🗑️ COMPONENT: Triggering summary update...')
    triggerSummaryUpdate()
    
    console.log('✅ COMPONENT: Cost line deletion operation completed')
  } else {
    console.warn('⚠️ COMPONENT: Could not find cost line with ID:', costLineId)
    console.warn('⚠️ COMPONENT: Available IDs:', costLines.value.map(line => line.id))
  }
}

// Computed totals for categories - baseado em nova estrutura
const fabricationItems = computed(() => 
  costLines.value.filter(line => line.meta?.category === 'fabrication').length
)

const mainWorkItems = computed(() => 
  costLines.value.filter(line => line.meta?.category === 'mainWork').length
)

const fabricationCost = computed(() => {
  // Custo das categorias de fabricação (labour)
  return labourHoursCost.value
})

const mainWorkCost = computed(() => {
  // Custo das categorias de main work (materials com markup)
  return materialCostAfterMarkup.value
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
    // Force trigger de todos os computed values para atualização imediata
    const _triggerUpdate = {
      labourHours: totalLabourHours.value,
      materialCost: materialCostBeforeMarkup.value,
      finalCost: finalCost.value
    }
    console.log('🔄 Forced reactivity update:', _triggerUpdate)
  })
}, { deep: true, immediate: true })

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
  :deep(.ag-theme-custom .ag-header-cell[col-id="meta.labour_minutes"]),
  :deep(.ag-theme-custom .ag-cell[col-id="meta.labour_minutes"]) {
    display: none;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id="meta.item_cost"]),
  :deep(.ag-theme-custom .ag-cell[col-id="meta.item_cost"]) {
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
