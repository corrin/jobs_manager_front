<script setup lang="ts">
/**
 * SmartCostLinesTable.vue
 *
 * Spreadsheet-like inline editor for Cost Lines with:
 * - Optional Item column (UI-only) that pre-fills description and unit_cost and applies materials markup to unit_rev
 * - Optional Source column (read-only, clickable)
 * - Inline edits with autosave (debounced, optimistic, rollback on failure)
 * - Per-kind editing rules (material, time, adjust)
 * - Keyboard shortcuts via useGridKeyboardNav
 *
 * Non-negotiable rules:
 * - All backend data types must come from generated api.ts
 * - No local backend schemas; UI-only flags (like overridden) are tracked with WeakMaps in composables
 * - Persist changes using existing services/endpoints; do not change API contracts
 */

import { computed, h, onMounted, ref, nextTick, watch } from 'vue'
import DataTable from '../DataTable.vue'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import ItemSelect from '../../views/purchasing/ItemSelect.vue'
import type { DataTableRowContext } from '../../utils/data-table-types'
import { toast } from 'vue-sonner'
import { debugLog } from '../../utils/debug'
import { formatCurrency } from '../../utils/string-formatting'
import { HelpCircle, Trash2, Plus, AlertTriangle } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'

import { useCompanyDefaultsStore } from '../../stores/companyDefaults'
import { useStockStore } from '../../stores/stockStore'
import { useCostLineCalculations } from '../../composables/useCostLineCalculations'
import { useCostLineAutosave } from '../../composables/useCostLineAutosave'
import { useGridKeyboardNav } from '../../composables/useGridKeyboardNav'
import { costlineService } from '../../services/costline.service'
import { api } from '../../api/client'

import { schemas } from '../../api/generated/api'
import type { z } from 'zod'

// Types from generated schemas
// Extend CostLine type to include timestamp fields (to be added to backend schema)
type CostLine = z.infer<typeof schemas.CostLine> & {
  created_at?: string
  updated_at?: string
}
type PatchedCostLineCreateUpdate = z.infer<typeof schemas.PatchedCostLineCreateUpdate>

type TabKind = 'estimate' | 'quote' | 'actual'
export type KindOption = 'material' | 'time' | 'adjust'

// Row context helper (DataTable passes TanStack context with row)
type RowCtx = DataTableRowContext & { row: { index: number } }

const props = withDefaults(
  defineProps<{
    lines: CostLine[]
    tabKind: TabKind
    readOnly?: boolean
    showItemColumn?: boolean
    showSourceColumn?: boolean
    // Resolver for "Source" column (read-only). If not provided, Source column will be hidden or blank.
    sourceResolver?: (
      line: CostLine,
    ) => { visible: boolean; label: string; onClick?: () => void } | null
    // Limit available kinds for dropdown
    allowedKinds?: KindOption[]
    // Block specific fields by kind (e.g., for 'actual' tab material lines until stock selected)
    blockedFieldsByKind?: Record<KindOption, string[]>
    // For 'actual' tab: Function to call on stock selection for new lines
    consumeStockFn?: (payload: {
      line: CostLine
      stockId: string
      quantity: number
      unitCost: number
      unitRev: number
    }) => Promise<void>
    // Job ID for consumption context
    jobId?: string
    negativeStockIds?: string[]
  }>(),
  {
    readOnly: false,
    showItemColumn: true,
    showSourceColumn: false,
    allowedKinds: () => ['material', 'time', 'adjust'],
    blockedFieldsByKind: () => ({ material: [], time: [], adjust: [] }),
    negativeStockIds: () => [],
  },
)

const emit = defineEmits<{
  'delete-line': [idOrIndex: string | number]
  'add-line': []
  'duplicate-line': [line: CostLine]
  'move-line': [index: number, direction: 'up' | 'down']
  'create-line': [line: CostLine]
}>()

// Add logging to track emit calls
const loggedEmit = (event: string, ...args: unknown[]) => {
  debugLog(`📤 SmartCostLinesTable emitting event: ${event}`, args)
  return (emit as any)(event, ...args) // eslint-disable-line @typescript-eslint/no-explicit-any
}

// UI state
const selectedRowIndex = ref<number>(-1)
const containerRef = ref<HTMLElement | null>(null)
const showShortcuts = ref(false)
const pendingFocusNewRow = ref(false)
const openItemSelect = ref(false)

// Focus on ItemSelect trigger and open popover after a row has been added
watch(
  () => props.lines.length,
  async (len, prev) => {
    if (pendingFocusNewRow.value && len > prev) {
      pendingFocusNewRow.value = false
      selectedRowIndex.value = len - 1
      await nextTick()
      const itemTrigger = containerRef.value?.querySelector(
        '.item-select-trigger',
      ) as HTMLElement | null
      if (itemTrigger) {
        itemTrigger.focus()
        openItemSelect.value = true
      }
    }
  },
)

function handleAddLine() {
  pendingFocusNewRow.value = true
  loggedEmit('add-line')
}

// Local UI-only mapping: selected Item data per line (not persisted)
const selectedItemMap = new WeakMap<
  CostLine,
  { id: string; description: string; item_code?: string } | null
>()

const createdOnce = new WeakSet<CostLine>()

function resetEmptyLine(kind: KindOption = 'material') {
  emptyLine.value = {
    id: '',
    kind,
    desc: '',
    quantity: 1,
    unit_cost: null,
    unit_rev: null,
    ext_refs: {},
    meta: {},
  }
}

function maybeEmitCreate(line: CostLine) {
  if (createdOnce.has(line)) return
  createdOnce.add(line)

  const payload = line
  emit('create-line', payload)

  if (line === emptyLine.value) resetEmptyLine(line.kind as KindOption)
}

function updateLineKind(line: CostLine, newKind: KindOption) {
  if (String(line.kind) === newKind) return

  Object.assign(line, { kind: newKind })

  // Apply company defaults for time
  if (newKind === 'time') {
    Object.assign(line, {
      unit_cost: companyDefaultsStore.companyDefaults?.wage_rate ?? 0,
      unit_rev: companyDefaultsStore.companyDefaults?.charge_out_rate ?? 0,
    })
  } else {
    // Recalculate unit_rev with markup for material/adjust
    const derived = apply(line).derived
    Object.assign(line, { unit_rev: derived.unit_rev })
  }

  // Save if line has real ID and meets baseline
  if (line.id && isLineReadyForSave(line)) {
    debugLog('Saving kind change:', line.id, newKind)
    const patch: PatchedCostLineCreateUpdate = {
      kind: newKind,
      ...(newKind === 'time'
        ? {
            unit_cost: companyDefaultsStore.companyDefaults?.wage_rate ?? 0,
            unit_rev: companyDefaultsStore.companyDefaults?.charge_out_rate ?? 0,
          }
        : { unit_rev: Number(line.unit_rev) }),
    }
    const optimistic: Partial<CostLine> = { ...patch }
    autosave.scheduleSave(line, patch, optimistic)
  }
}

// Company Defaults and calculations
const companyDefaultsStore = useCompanyDefaultsStore()
const store = useStockStore()
onMounted(() => {
  if (!companyDefaultsStore.isLoaded && !companyDefaultsStore.isLoading) {
    companyDefaultsStore.loadCompanyDefaults()
  }
  // Ensure stock is loaded for item lookup
  if (store.items.length === 0 && !store.loading) {
    store.fetchStock()
  }
})

const {
  apply,
  validateLine,
  isUnitCostEditable,
  isUnitRevenueEditable,
  onUnitRevenueManuallyEdited,
  onItemSelected,
} = useCostLineCalculations({
  getCompanyDefaults: () => companyDefaultsStore.companyDefaults,
})

// Autosave
const autosave = useCostLineAutosave({
  debounceMs: 600, // within spec 400–800ms
  saveFn: async (id: string, patch: PatchedCostLineCreateUpdate) => {
    const updated = await costlineService.updateCostLine(id, patch)
    // Return the updated line so timestamps can be synced
    return updated
  },
  onOptimisticApply: (line, patch) => {
    // Mutate in-place to propagate to parent summaries (objects are shared by reference)
    Object.assign(line, patch as Partial<CostLine>)
  },
  onRollback: (line, snap) => {
    Object.assign(line, snap)
    toast.error('Failed to save changes. Restored previous values.')
  },
})

/**
 * Helpers
 */
function getKindBadge(line: CostLine) {
  const kind = String(line.kind)
  switch (kind) {
    case 'time':
      return { label: 'Labour', class: 'bg-blue-100 text-blue-800' }
    case 'material':
      return { label: 'Material', class: 'bg-green-100 text-green-800' }
    case 'adjust':
      return { label: 'Adjustment', class: 'bg-pink-100 text-pink-800' }
    default:
      return { label: kind, class: 'bg-gray-100 text-gray-800' }
  }
}

function formatModifiedDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = date.toLocaleDateString('en-NZ', { month: 'short' }).toUpperCase()
  const year = date.getFullYear().toString().slice(-2)
  return `${day}/${month}/${year}`
}

function isDeliveryReceipt(line: CostLine): boolean {
  return !!(line?.meta && (line.meta as Record<string, string>).source === 'delivery_receipt')
}

function isStockLine(line: CostLine): boolean {
  return !!(line?.ext_refs && (line.ext_refs as Record<string, unknown>).stock_id)
}

function isNegativeStock(line: CostLine): boolean {
  if (!line?.id || !isStockLine(line)) return false
  return props.negativeStockIds?.includes(line.ext_refs?.stock_id as string) ?? false
}

function canEditField(
  line: CostLine,
  field: 'desc' | 'quantity' | 'unit_cost' | 'unit_rev',
): boolean {
  if (props.readOnly) return false

  if (isDeliveryReceipt(line)) return false

  const kind = String(line.kind)
  if (field === 'unit_cost') {
    return isUnitCostEditable(line)
  }
  if (field === 'unit_rev') {
    return isUnitRevenueEditable(line)
  }
  if (field === 'quantity' && props.tabKind === 'actual') {
    // For actuals, quantity on non-adjust lines typically should not be edited (origin = system)
    const isMaterial = kind === 'material'
    const isConsumed =
      !!line.id || !!(line.ext_refs && (line.ext_refs as Record<string, unknown>).stock_id)
    return kind === 'adjust' || (isMaterial && isConsumed)
  }
  if (field === 'desc' && props.tabKind === 'actual') {
    // only allow description editing for adjustments and materials
    return kind === 'adjust' || 'material'
  }

  // desc & quantity in non-actual tabs
  return true
}

/**
 * Check if line meets baseline criteria for saving:
 * - Has description
 * - Has quantity > 0
 * - Has unit_cost and unit_rev (even if auto-calculated)
 */
function isLineReadyForSave(line: CostLine): boolean {
  if (!line.desc || line.desc.trim() === '') return false
  if (!line.quantity || line.quantity <= 0) return false
  if (line.unit_cost === undefined || line.unit_cost === null) return false
  if (line.unit_rev === undefined || line.unit_rev === null) return false
  return true
}

/**
 * Ensure there's always at least one empty line for editing
 */
const emptyLine = ref<CostLine>({
  id: '',
  kind: 'material',
  desc: '',
  quantity: 1,
  unit_cost: undefined,
  unit_rev: undefined,
  ext_refs: {},
  meta: {},
})

const displayLines = computed(() => [...props.lines, emptyLine.value])

const negativeIdsSig = computed(() => props.negativeStockIds?.slice().sort().join('|') || '')

/**
 * Build the column defs for DataTable
 */
const columns = computed(() => {
  void negativeIdsSig.value
  return [
    // Type / Kind - Now readonly badge only
    {
      id: 'kind',
      header: 'Type',
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const badge = getKindBadge(line)
        return h(Badge, { class: `text-xs font-medium ${badge.class}` }, () => badge.label)
      },
      meta: { editable: false }, // Always readonly
    },

    // Item
    props.showItemColumn
      ? {
          id: 'item',
          header: () => h('div', { class: 'col-item text-left' }, 'Item'),
          cell: ({ row }: RowCtx) => {
            const line = displayLines.value[row.index]
            const selectedItem = selectedItemMap.get(line)
            const model =
              selectedItem?.id || (line.ext_refs as Record<string, unknown>)?.stock_id || null
            const kind = String(line.kind)
            const isMaterial = kind === 'material'
            const isNewLine = !line.id
            const isActualTab = props.tabKind === 'actual'

            const lockedByDeliveryReceipt = isDeliveryReceipt(line)
            const lockedStockExisting = !!line.id && isStockLine(line)
            const enabled =
              kind !== 'time' && !props.readOnly && !lockedByDeliveryReceipt && !lockedStockExisting

            const isActive = selectedRowIndex.value === row.index

            // Lazy mount: render lightweight control until row is active (selected)
            if (!isActive) {
              return h('div', { class: 'col-item flex items-center' }, [
                h(
                  Button,
                  {
                    variant: 'outline',
                    size: 'sm',
                    disabled: !enabled,
                    onClick: (e: Event) => {
                      e.stopPropagation()
                      selectedRowIndex.value = row.index
                    },
                    class: 'font-mono uppercase tracking-wide',
                  },
                  () => {
                    if (!model) {
                      // Check if this is a time line without stock_id (labour)
                      const stockId = (line.ext_refs as Record<string, unknown>)?.stock_id as string
                      if (!stockId && String(line.kind) === 'time') {
                        return 'LABOUR'
                      }

                      // Check if this is an existing line with stock selected
                      if (stockId) {
                        // Try to find the item in the stock store by ID
                        const stockItem = store.items.find((item) => item.id === stockId)
                        if (stockItem?.item_code) {
                          return stockItem.item_code
                        }
                      }

                      // If no stock_id or item not found by ID, try to find by description
                      if (line.desc) {
                        const stockItemByDesc = store.items.find(
                          (item) => item.description?.toLowerCase() === line.desc?.toLowerCase(),
                        )
                        if (stockItemByDesc?.item_code) {
                          return stockItemByDesc.item_code
                        }
                      }

                      // If no valid item found, prompt user to select a valid item
                      return 'Select Item'
                    }

                    // Handle labour items specially
                    if (model === '__labour__') {
                      return 'LABOUR'
                    }

                    // If we have selectedItem, use its code
                    if (selectedItem?.item_code) {
                      return selectedItem.item_code
                    }

                    // If no selectedItem but we have a model (stock_id), find the item in store
                    if (model && model !== '__labour__') {
                      const stockItem = store.items.find((item) => item.id === model)
                      if (stockItem?.item_code) {
                        return stockItem.item_code
                      }
                    }

                    return 'Change item'
                  },
                ),
              ])
            }

            return h('div', { class: 'col-item' }, [
              h(ItemSelect, {
                modelValue: model,
                open: openItemSelect.value,
                'onUpdate:open': (val: boolean) => (openItemSelect.value = val),
                disabled: !enabled,
                lineKind: String(line.kind),
                tabKind: props.tabKind,
                onClick: (e: Event) => e.stopPropagation(),
                'onUpdate:modelValue': async (val: string | null) => {
                  if (!enabled) return
                  if (val) {
                    debugLog('💾 Storing item selection:', { val, lineId: line.id })
                    // Store full item data for display
                    if (val === '__labour__') {
                      selectedItemMap.set(line, {
                        id: val,
                        description: 'Labour',
                        item_code: 'LABOUR',
                      })
                      debugLog('👷 Stored labour item in selectedItemMap')
                    } else {
                      // For regular items, we'll fetch the data below and update
                      selectedItemMap.set(line, { id: val, description: '', item_code: '' })
                      debugLog('📦 Stored placeholder for stock item in selectedItemMap')
                    }
                  } else {
                    selectedItemMap.set(line, null)
                    debugLog('🗑️ Cleared selectedItemMap for line')
                  }

                  // Infer kind based on selection
                  let newKind: KindOption = 'adjust' // Default fallback
                  if (val === '__labour__') {
                    newKind = 'time'
                  } else if (val) {
                    newKind = 'material'
                  }

                  // Update kind if it changed
                  if (String(line.kind) !== newKind) {
                    updateLineKind(line, newKind)
                  }

                  onItemSelected(line)

                  if (
                    isActualTab &&
                    isNewLine &&
                    isMaterial &&
                    val &&
                    props.consumeStockFn &&
                    props.jobId
                  ) {
                    try {
                      const stock = await api.purchasing_rest_stock_retrieve({
                        params: { id: val },
                      })
                      const qty = Number(line.quantity || 1)
                      const unitCost = Number(stock.unit_cost || 0)
                      const markup = companyDefaultsStore.companyDefaults?.materials_markup || 0
                      const unitRev = unitCost * (1 + markup)
                      await props.consumeStockFn({
                        line,
                        stockId: val,
                        quantity: qty,
                        unitCost,
                        unitRev,
                      })

                      // to leave the active mode and show the chip/label instead of "Select Item"
                      selectedRowIndex.value = -1
                    } catch {
                      toast.error('Failed to consume stock. Line not created.')
                      selectedItemMap.set(line, null)
                      return
                    }
                  } else {
                    // For other tabs (quote, estimate), also leave active mode to show item code
                    selectedRowIndex.value = -1
                  }

                  let found = null
                  try {
                    found = await api.purchasing_rest_stock_retrieve({ params: { id: val } })
                  } catch (error) {
                    debugLog('Failed to fetch stock item details:', error)
                  }
                  if (found) {
                    debugLog('✅ API returned stock item:', {
                      id: found.id,
                      item_code: found.item_code,
                      description: found.description,
                    })
                    Object.assign(line, { desc: found.description || '' })
                    Object.assign(line, { unit_cost: Number(found.unit_cost ?? 0) })
                    // Update selectedItemMap with full data
                    selectedItemMap.set(line, {
                      id: val,
                      description: found.description || '',
                      item_code: found.item_code || '',
                    })
                    debugLog('💾 Updated selectedItemMap with full item data:', {
                      id: val,
                      description: found.description || '',
                      item_code: found.item_code || '',
                    })
                    // Ensure quantity is set for new lines
                    if (line.quantity == null) Object.assign(line, { quantity: 1 })
                    if (kind !== 'time')
                      Object.assign(line, { unit_rev: apply(line).derived.unit_rev })

                    // For phantom rows (no ID), emit create-line if ready after fetch
                    if (!line.id && isLineReadyForSave(line)) {
                      loggedEmit('create-line', line)
                    }
                  } else {
                    debugLog('❌ API did not return stock item for id:', val)
                    Object.assign(line, { desc: '' })
                    Object.assign(line, { unit_cost: 0 })
                    selectedItemMap.set(line, null)
                  }

                  // Save immediately for existing lines
                  if (line.id && isLineReadyForSave(line)) {
                    const patch: PatchedCostLineCreateUpdate = {
                      desc: line.desc || '',
                      unit_cost: Number(line.unit_cost ?? 0),
                      unit_rev: Number(line.unit_rev ?? 0),
                    }
                    const optimistic: Partial<CostLine> = { ...patch }
                    autosave.scheduleSave(line, patch, optimistic)
                  }
                },
                'onUpdate:description': (desc: string) => enabled && Object.assign(line, { desc }),
                'onUpdate:unit_cost': (cost: number | null) => {
                  if (!enabled) return
                  Object.assign(line, { unit_cost: Number(cost ?? 0) })
                  if (kind !== 'time')
                    Object.assign(line, { unit_rev: apply(line).derived.unit_rev })
                  nextTick(() => {
                    if (!line.id && isLineReadyForSave(line)) maybeEmitCreate(line)
                  })
                },
                'onUpdate:kind': (newKind: string | null) => {
                  if (!enabled || !newKind) return
                  updateLineKind(line, newKind as KindOption)
                },
              }),
            ])
          },
          meta: { editable: !props.readOnly },
        }
      : null,

    // Description
    {
      id: 'desc',
      header: () => h('div', { class: 'desc-col text-left' }, 'Description'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const kind = String(line.kind)
        const isNewLine = !line.id
        const isActualTab = props.tabKind === 'actual'
        const blockedFields = props.blockedFieldsByKind?.[kind as KindOption] || []
        const isFieldBlocked = blockedFields.includes('desc')
        const hasStockSelected = !!selectedItemMap.get(line)
        const isBlocked =
          isActualTab && isNewLine && kind === 'material' && isFieldBlocked && !hasStockSelected
        const canEdit = canEditField(line, 'desc') && !isBlocked

        return h('div', { class: 'desc-cell w-full flex items-start gap-2' }, [
          h(Textarea, {
            modelValue: line.desc || '',
            disabled: !canEdit,
            class: 'w-full min-h-[2.25rem] text-sm',
            rows: 1,
            onClick: (e: Event) => {
              // Stop propagation to grid; fully inline editing
              e.stopPropagation()
            },
            onKeydown: (e: KeyboardEvent) => {
              const ctrlOrCmd = e.metaKey || e.ctrlKey
              if (e.key === 'Enter' && ctrlOrCmd) {
                e.preventDefault()
                e.stopPropagation()
                loggedEmit('add-line')
                return
              }
              // Allow line breaks in textarea and prevent bubbling to the grid
              e.stopPropagation()
            },
            'onUpdate:modelValue': (v: string | number) => {
              const val = typeof v === 'string' ? v : String(v)
              Object.assign(line, { desc: val })
              // Infer "adjust" when user starts typing without a selected item
              const hasSelectedItemLocal = !!selectedItemMap.get(line)
              const isLabour = line.kind === 'time'
              const isAdjust = line.kind === 'adjust'
              if (!hasSelectedItemLocal && val.trim() && !isAdjust && !isLabour) {
                updateLineKind(line, 'adjust')
              }
            },
            onBlur: () => {
              if (!canEdit) return
              // Create from phantom row if baseline is satisfied
              if (!line.id && isLineReadyForSave(line)) {
                maybeEmitCreate(line)
                return
              }
              // Save inline for existing lines
              if (!line.id || !isLineReadyForSave(line)) return
              const patch: PatchedCostLineCreateUpdate = { desc: line.desc || '' }
              const optimistic: Partial<CostLine> = { desc: line.desc || '' }
              autosave.onBlurSave(line, patch, optimistic)
            },
          }),
          ...(isBlocked
            ? [
                h(
                  Badge,
                  { variant: 'secondary', class: 'mt-1 text-xs' },
                  () => 'Select stock first',
                ),
              ]
            : []),
        ])
      },
    },

    // Quantity
    {
      id: 'quantity',
      header: () => h('div', { class: 'col-8ch text-center' }, 'Quantity'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const kind = String(line.kind)
        const isNewLine = !line.id
        const isActualTab = props.tabKind === 'actual'
        const blockedFields = props.blockedFieldsByKind?.[kind as KindOption] || []
        const isFieldBlocked = blockedFields.includes('quantity')
        const hasStockSelected = !!selectedItemMap.get(line)
        const isBlocked =
          isActualTab && isNewLine && kind === 'material' && isFieldBlocked && !hasStockSelected

        return [
          h('div', { class: 'col-10ch' }, [
            h(Input, {
              type: 'number',
              step: String(kind === 'time' ? 0.25 : 1),
              ...(kind === 'adjust' ? {} : { min: '0.0000001' }),
              modelValue: line.quantity,
              disabled: !canEditField(line, 'quantity') || isBlocked,
              class: 'w-full text-right numeric-input',
              inputmode: 'decimal',
              onClick: (e: Event) => e.stopPropagation(),
              'onUpdate:modelValue': (val: string | number) => {
                const num = Number(val)
                if (!Number.isNaN(num)) Object.assign(line, { quantity: num })
              },
              onBlur: () => {
                const validation = validateLine(line)
                if (!validation.isValid) {
                  toast.error(validation.issues[0]?.message || 'Invalid quantity')
                  return
                }
                if (!line.id && isLineReadyForSave(line)) {
                  maybeEmitCreate(line)
                  return
                }
                if (!line.id || !isLineReadyForSave(line)) return
                const qtyNum = Number(line.quantity || 0)
                const patch: PatchedCostLineCreateUpdate = { quantity: qtyNum }
                const optimistic: Partial<CostLine> = { quantity: qtyNum }
                autosave.onBlurSave(line, patch, optimistic)
              },
            }),
          ]),
          ...(isBlocked
            ? [
                h(
                  Badge,
                  { variant: 'secondary', class: 'mt-1 text-xs' },
                  () => 'Select stock first',
                ),
              ]
            : []),
        ]
      },
    },

    // Unit Cost
    {
      id: 'unit_cost',
      header: () => h('div', { class: 'col-10ch text-center' }, 'Unit Cost'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const kind = String(line.kind)
        const isNewLine = !line.id
        const isActualTab = props.tabKind === 'actual'
        const blockedFields = props.blockedFieldsByKind?.[kind as KindOption] || []
        const isFieldBlocked = blockedFields.includes('unit_cost')
        const hasStockSelected = !!selectedItemMap.get(line)
        const isBlocked =
          isActualTab && isNewLine && kind === 'material' && isFieldBlocked && !hasStockSelected
        const editable = canEditField(line, 'unit_cost') && !isBlocked
        const isTime = kind === 'time'
        const resolved = apply(line).derived
        return [
          h('div', { class: 'col-10ch' }, [
            h(Input, {
              type: 'number',
              step: '0.01',
              min: '0',
              modelValue: isTime
                ? (line.unit_cost ?? resolved.unit_cost ?? '')
                : (line.unit_cost ?? ''),
              disabled: !editable,
              class: 'w-full text-right numeric-input',
              inputmode: 'decimal',
              onClick: (e: Event) => e.stopPropagation(),
              'onUpdate:modelValue': (val: string | number) => {
                if (!editable) return
                if (val === '') {
                  Object.assign(line, { unit_cost: 0 })
                } else {
                  const num = Number(val)
                  if (!Number.isNaN(num)) {
                    Object.assign(line, { unit_cost: num })

                    // Auto-recalculate unit_rev for material/adjust unless overridden
                    if (kind !== 'time') {
                      const derived = apply(line).derived
                      Object.assign(line, { unit_rev: derived.unit_rev })
                    }
                  }
                }
              },
              onBlur: () => {
                if (!editable) return

                // Create new line if it doesn't have an ID yet and meets baseline criteria
                if (!line.id && isLineReadyForSave(line)) {
                  debugLog('Creating new line from unit_cost edit:', line)
                  maybeEmitCreate(line)
                  return
                }

                if (!line.id || !isLineReadyForSave(line)) {
                  debugLog('Skipping unit_cost save:', {
                    editable,
                    id: line.id,
                    ready: isLineReadyForSave(line),
                  })
                  return
                }

                debugLog('Saving unit_cost change:', line.id, line.unit_cost)
                // For material/adjust, unit_rev may be auto recalculated unless overridden
                const derived = apply(line).derived
                const patch: PatchedCostLineCreateUpdate = {
                  unit_cost: Number(line.unit_cost ?? 0),
                  ...(kind !== 'time' ? { unit_rev: Number(derived.unit_rev) } : {}),
                }
                const optimistic: Partial<CostLine> = { ...patch }
                autosave.onBlurSave(line, patch, optimistic)
              },
            }),
          ]),
          ...(isBlocked
            ? [
                h(
                  Badge,
                  { variant: 'secondary', class: 'mt-1 text-xs' },
                  () => 'Select stock first',
                ),
              ]
            : []),
        ]
      },
    },

    // Unit Revenue
    {
      id: 'unit_rev',
      header: () => h('div', { class: 'col-10ch text-center' }, 'Unit Rev'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const kind = String(line.kind)
        const isNewLine = !line.id
        const isActualTab = props.tabKind === 'actual'
        const blockedFields = props.blockedFieldsByKind?.[kind as KindOption] || []
        const isFieldBlocked = blockedFields.includes('unit_rev')
        const hasStockSelected = !!selectedItemMap.get(line)
        const isBlocked =
          isActualTab && isNewLine && kind === 'material' && isFieldBlocked && !hasStockSelected
        const editable = canEditField(line, 'unit_rev') && !isBlocked
        const isTime = kind === 'time'
        const resolved = apply(line).derived
        return [
          h('div', { class: 'col-10ch' }, [
            h(Input, {
              type: 'number',
              step: '0.01',
              min: '0',
              modelValue: isTime
                ? (line.unit_rev ?? resolved.unit_rev ?? '')
                : (line.unit_rev ?? ''),
              disabled: !editable,
              class: 'w-full text-right numeric-input',
              inputmode: 'decimal',
              onClick: (e: Event) => e.stopPropagation(),
              'onUpdate:modelValue': (val: string | number) => {
                if (!editable) return
                if (val === '') {
                  Object.assign(line, { unit_rev: 0 })
                } else {
                  const num = Number(val)
                  if (!Number.isNaN(num)) {
                    Object.assign(line, { unit_rev: num })
                  }
                }
                // Mark override when user types in unit_rev
                onUnitRevenueManuallyEdited(line)
              },
              onKeydown: (e: KeyboardEvent) => {
                if (
                  (e.key === 'Tab' || e.key === 'Enter') &&
                  row.index === displayLines.value.length - 1
                ) {
                  e.preventDefault()
                  if (isLineReadyForSave(line)) {
                    maybeEmitCreate(line)
                  }
                }
              },
              onBlur: () => {
                if (!editable) return

                // Create new line if it doesn't have an ID yet and meets baseline criteria
                if (!line.id && isLineReadyForSave(line)) {
                  debugLog('Creating new line from unit_rev edit:', line)
                  maybeEmitCreate(line)
                  return
                }

                if (!line.id || !isLineReadyForSave(line)) {
                  debugLog('Skipping unit_rev save:', {
                    editable,
                    id: line.id,
                    ready: isLineReadyForSave(line),
                  })
                  return
                }

                debugLog('Saving unit_rev change:', line.id, line.unit_rev)
                const patch: PatchedCostLineCreateUpdate = {
                  unit_rev: Number(line.unit_rev ?? 0),
                }
                const optimistic: Partial<CostLine> = { unit_rev: Number(line.unit_rev ?? 0) }
                autosave.onBlurSave(line, patch, optimistic)
              },
            }),
          ]),
          ...(isBlocked
            ? [
                h(
                  Badge,
                  { variant: 'secondary', class: 'mt-1 text-xs' },
                  () => 'Select stock first',
                ),
              ]
            : []),
        ]
      },
    },

    // Total Cost
    {
      id: 'total_cost',
      header: () => h('div', { class: 'col-12ch text-center' }, 'Total Cost'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const qty = Number(line.quantity || 0)
        const umc = Number(line.unit_cost ?? apply(line).derived.unit_cost ?? 0)
        const totalCost = String(line.kind) === 'time' ? qty * umc : qty * umc
        return h(
          'div',
          { class: 'col-12ch text-right font-medium numeric-text' },
          formatCurrency(totalCost),
        )
      },
      meta: { editable: false },
    },

    // Total Revenue
    {
      id: 'total_rev',
      header: () => h('div', { class: 'col-12ch text-center' }, 'Total Revenue'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const qty = Number(line.quantity ?? 0)
        const umr = Number(line.unit_rev ?? apply(line).derived.unit_rev ?? 0)
        const totalRev = qty * umr
        return h(
          'div',
          { class: 'col-12ch text-right font-medium numeric-text' },
          formatCurrency(totalRev),
        )
      },
      meta: { editable: false },
    },

    // Source (optional)
    props.showSourceColumn
      ? {
          id: 'source',
          header: () => h('div', { class: 'source-col' }, 'Source'),
          cell: ({ row }: RowCtx) => {
            const line = displayLines.value[row.index]
            if (!props.sourceResolver)
              return h(
                'div',
                { class: 'source-cell text-gray-400 text-sm flex justify-center items-center' },
                '-',
              )
            const resolved = props.sourceResolver(line)
            if (!resolved || !resolved.visible)
              return h(
                'div',
                { class: 'source-cell flex justify-center items-center text-gray-400 text-sm' },
                '-',
              )

            const neg = isNegativeStock(line)
            return h('div', { class: 'source-cell flex flex-col gap-1 items-center' }, [
              h(
                'span',
                {
                  class:
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer select-none truncate',
                  role: resolved.onClick ? 'button' : undefined,
                  tabindex: resolved.onClick ? 0 : -1,
                  onClick: resolved.onClick
                    ? () => resolved.onClick && resolved.onClick()
                    : undefined,
                  onKeydown: (e: KeyboardEvent) => {
                    if ((e.key === 'Enter' || e.key === ' ') && resolved.onClick) {
                      e.preventDefault()
                      resolved.onClick()
                    }
                  },
                  title: resolved.label,
                },
                resolved.label,
              ),
              ...(neg
                ? [
                    h(
                      'span',
                      {
                        class:
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 truncate',
                        title: 'Stock level for this item is negative',
                      },
                      [h(AlertTriangle, { class: 'w-3.5 h-3.5 mr-1' }), 'Negative'],
                    ),
                  ]
                : []),
            ])
          },
          meta: { editable: false },
        }
      : null,

    // Last Modified (most recent of created_at or updated_at) - compact
    {
      id: 'last_modified',
      header: () => h('div', { class: 'col-10ch text-center' }, 'Modified'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const mostRecentDate = line.updated_at || line.created_at

        if (!mostRecentDate) {
          return h('div', { class: 'col-8ch text-left text-gray-400 text-xs' }, '-')
        }

        const formattedDate = formatModifiedDate(mostRecentDate)
        const fullDateTime = new Date(mostRecentDate).toLocaleString('en-NZ', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })

        return h(
          'div',
          {
            class: 'col-10ch text-center text-gray-500 text-xs hover:text-gray-700',
            style: 'cursor: default;',
            title: `Full date/time: ${fullDateTime}`,
            onMouseenter: (e: MouseEvent) => {
              ;(e.target as HTMLElement).style.cursor = 'pointer'
            },
            onMouseleave: (e: MouseEvent) => {
              ;(e.target as HTMLElement).style.cursor = 'default'
            },
          },
          formattedDate,
        )
      },
      meta: { editable: false },
    },

    // Actions (delete only)
    {
      id: 'actions',
      header: () => h('div', { class: 'w-full text-center' }, 'Actions'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const disabled = !!props.readOnly
        return h('div', { class: 'flex items-center justify-center w-full' }, [
          h(
            Button,
            {
              variant: 'outline',
              size: 'icon',
              class:
                'h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center',
              disabled,
              'aria-label': 'Delete line',
              onClick: (e: Event) => {
                e.stopPropagation()
                if (disabled) return

                debugLog('🗑️ Delete button clicked for line:', {
                  lineId: line.id,
                  rowIndex: row.index,
                  lineDesc: line.desc,
                  isLocalLine: !line.id,
                  totalDisplayLines: displayLines.value.length,
                  totalPropsLines: props.lines.length,
                })

                // For local lines (no ID), delete immediately without confirmation
                if (!line.id) {
                  // Find the actual index in the original props.lines array
                  const actualIndex = props.lines.findIndex((l) => l === line)
                  debugLog('🔍 Looking for local line in props.lines:', {
                    actualIndex,
                    foundLine: actualIndex >= 0 ? props.lines[actualIndex] : null,
                    searchedLine: line,
                  })

                  if (actualIndex >= 0) {
                    debugLog('✅ Emitting delete-line with actualIndex:', actualIndex)
                    loggedEmit('delete-line', actualIndex)
                  } else {
                    // This is the auto-generated empty line - don't delete it, just clear it
                    debugLog('⚠️ Auto-generated empty line - cannot delete, ignoring')
                    return
                  }
                  return
                }

                // For saved lines, ask for confirmation
                const confirmed = window.confirm('Delete this line? This action cannot be undone.')
                if (!confirmed) return
                debugLog('✅ Emitting delete-line with line.id:', line.id)
                loggedEmit('delete-line', line.id as string)
              },
            },
            () => h(Trash2, { class: 'w-4 h-4' }),
          ),
        ])
      },
      meta: { editable: !props.readOnly },
    },
  ].filter(Boolean)
})

/**
 * Keyboard navigation
 */
const { onKeydown } = useGridKeyboardNav({
  getRowCount: () => displayLines.value.length,
  getSelectedIndex: () => selectedRowIndex.value,
  setSelectedIndex: (i) => (selectedRowIndex.value = i),

  startEdit: () => {
    // No-op here; inputs are directly focusable. Could focus first editable input in selected row if needed.
  },
  commitEdit: () => {
    // Inputs save on blur; pressing Enter can just move focus outward (handled by browser).
  },
  cancelEdit: () => {
    // No stateful edit buffers here; UI uses immediate binding. Intentionally no-op.
  },

  addLine: () => emit('add-line'),
  duplicateSelected: () => {
    const i = selectedRowIndex.value
    if (i >= 0 && i < displayLines.value.length) {
      const line = displayLines.value[i]
      // Only duplicate actual lines, not auto-generated empty ones
      if (line.id || props.lines.includes(line)) {
        loggedEmit('duplicate-line', line)
      }
    }
  },
  deleteSelected: () => {
    const i = selectedRowIndex.value
    debugLog('⌨️ Keyboard delete triggered for selectedRowIndex:', i)

    if (i >= 0 && i < displayLines.value.length) {
      const line = displayLines.value[i]
      debugLog('🗑️ Keyboard delete for line:', {
        lineId: line.id,
        selectedIndex: i,
        lineDesc: line.desc,
        isLocalLine: !line.id,
      })

      if (line.id) {
        debugLog('✅ Keyboard emitting delete-line with line.id:', line.id)
        loggedEmit('delete-line', line.id as string)
      } else {
        // Find the actual index in the original props.lines array
        const actualIndex = props.lines.findIndex((l) => l === line)
        debugLog('🔍 Keyboard looking for local line in props.lines:', {
          actualIndex,
          foundLine: actualIndex >= 0 ? props.lines[actualIndex] : null,
        })

        if (actualIndex >= 0) {
          debugLog('✅ Keyboard emitting delete-line with actualIndex:', actualIndex)
          loggedEmit('delete-line', actualIndex)
        } else {
          debugLog('⚠️ Keyboard: Auto-generated empty line - cannot delete, ignoring')
        }
      }
    }
  },
  moveSelectedUp: () => {
    const i = selectedRowIndex.value
    if (i > 0) emit('move-line', i, 'up')
  },
  moveSelectedDown: () => {
    const i = selectedRowIndex.value
    if (i >= 0 && i < displayLines.value.length - 1) emit('move-line', i, 'down')
  },
})

function handleRowClick(line: CostLine, index: number) {
  selectedRowIndex.value = index
}

const shortcutsTitle = computed(
  () =>
    'Shortcuts: Enter/F2 edit • Enter confirm • Esc cancel • Tab/Shift+Tab move • ↑/↓ row • Ctrl/Cmd+Enter add • Ctrl/Cmd+D duplicate • Ctrl/Cmd+Backspace delete • Alt+↑/↓ move row',
)
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-4 py-2">
      <button
        class="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        type="button"
        aria-haspopup="dialog"
        :aria-expanded="showShortcuts ? 'true' : 'false'"
        @click="showShortcuts = true"
        :title="shortcutsTitle"
      >
        <HelpCircle class="w-4 h-4" />
        <span>Shortcuts</span>
      </button>
    </div>

    <div
      class="flex-1 overflow-y-auto overflow-x-hidden"
      tabindex="0"
      @keydown="onKeydown"
      ref="containerRef"
    >
      <DataTable
        class="smart-costlines-table"
        :columns="columns as any"
        :data="displayLines"
        :hide-footer="true"
        @rowClick="
          (row: any) => handleRowClick(row as CostLine, (displayLines as any).indexOf(row))
        "
      />
    </div>

    <div v-if="!props.readOnly" class="px-4 py-2">
      <Button
        variant="default"
        size="sm"
        @click="handleAddLine"
        aria-label="Add Row"
        data-automation-id="cost-lines-add-row"
      >
        <Plus class="w-4 h-4 mr-1" /> Add row
      </Button>
    </div>
    <!-- Shortcuts Help Dialog -->
    <Dialog :open="showShortcuts" @update:open="showShortcuts = $event">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Quick reference for grid navigation and editing</DialogDescription>
        </DialogHeader>
        <div class="text-sm space-y-2">
          <div>Enter / F2 — Start editing</div>
          <div>Enter — Commit edit</div>
          <div>Esc — Cancel edit</div>
          <div>Tab / Shift+Tab — Move between cells</div>
          <div>Arrow Up / Arrow Down — Move between rows</div>
          <div>Ctrl/Cmd+Enter — Add new line</div>
          <div>Ctrl/Cmd+D — Duplicate line</div>
          <div>Ctrl/Cmd+Backspace — Delete line</div>
          <div>Alt+Arrow Up / Alt+Arrow Down — Move line up/down</div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" @click="showShortcuts = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Description Edit Dialog removed – all edits inline -->
  </div>
</template>

<style scoped>
/* Layout */
.smart-costlines-table :deep(table) {
  /* Let content determine widths (numeric ~8ch, totals ~12ch, desc soaks rest) */
  table-layout: auto;
  width: 100%;
}

.smart-costlines-table :deep(th),
.smart-costlines-table :deep(td) {
  word-break: break-word;
  white-space: normal;
  padding: 8px 12px;
}

.smart-costlines-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
}

/* Row hover */
.smart-costlines-table :deep(tbody tr:hover) {
  background-color: rgb(249, 250, 251);
}

/* Borders */
.smart-costlines-table :deep(tbody tr) {
  border: 1px solid #e5e7eb;
  border-bottom: none;
}

.smart-costlines-table :deep(tbody tr:last-child) {
  border-bottom: 1px solid #e5e7eb;
}

.smart-costlines-table :deep(td) {
  border-right: 1px solid #f3f4f6;
}

.smart-costlines-table :deep(td:last-child) {
  border-right: none;
}

/* Numeric alignment */
.smart-costlines-table :deep([data-align='right']),
.smart-costlines-table :deep(.text-right) {
  text-align: right;
}

/* Focus ring */
.smart-costlines-table :deep(input:focus),
.smart-costlines-table :deep(button:focus),
.smart-costlines-table :deep(select:focus) {
  outline: none;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.6);
}

/* === Smart width helpers (character-based) === */
.smart-costlines-table :deep(.col-8ch) {
  width: 8ch;
  max-width: 8ch;
}

.smart-costlines-table :deep(.col-10ch) {
  width: 10ch;
  max-width: 10ch;
}

.smart-costlines-table :deep(.col-12ch) {
  width: 12ch;
  max-width: 12ch;
}

/* Description column: expand to fill remaining space */
.smart-costlines-table :deep(.desc-col) {
  /* Header marker so the column can flex */
  width: auto;
  min-width: 28ch;
}

/* Source column: individual cells fit content */
.smart-costlines-table :deep(.source-col) {
  width: auto;
}

.smart-costlines-table :deep(.source-cell) {
  min-width: 12ch;
  max-width: 24ch;
}

/* Remove the old hard clamp on Description column width */
.smart-costlines-table :deep(td:has(.desc-cell)),
.smart-costlines-table :deep(th:has(.desc-cell)) {
  width: auto;
}

/* Inner Description box can cap itself visually without forcing column width */
.smart-costlines-table :deep(.desc-cell .group) {
  max-width: min(90ch, 100%);
}

/* Numeric readability */
.smart-costlines-table :deep(.numeric-input),
.smart-costlines-table :deep(.numeric-text) {
  font-variant-numeric: tabular-nums;
  font-feature-settings:
    'tnum' 1,
    'lnum' 1;
}

/* Hide spinner buttons for number inputs */
.smart-costlines-table :deep(input[type='number']) {
  -moz-appearance: textfield;
}

.smart-costlines-table :deep(input[type='number']::-webkit-outer-spin-button),
.smart-costlines-table :deep(input[type='number']::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
</style>
