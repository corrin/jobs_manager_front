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

import { schemas } from '../../api/generated/api'
import type { z } from 'zod'

// Types from generated schemas
// Extend CostLine type to include timestamp fields (to be added to backend schema)
type CostLine = z.infer<typeof schemas.CostLine> & {
  created_at?: string
  updated_at?: string
}
type PatchedCostLineCreateUpdate = z.infer<typeof schemas.PatchedCostLineCreateUpdateRequest>

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
  total_cost: 0,
  created_at: '',
  updated_at: '',
  accounting_date: '',
  total_rev: 0,
})

const displayLines = computed(() => [...props.lines, emptyLine.value])

const negativeIdsSig = computed(() => props.negativeStockIds?.slice().sort().join('|') || '')

function resetEmptyLine(kind: KindOption = 'material') {
  console.log('DEBUG: resetEmptyLine called with kind:', kind)
  emptyLine.value = {
    id: '',
    kind,
    desc: '',
    quantity: 1,
    unit_cost: undefined,
    unit_rev: undefined,
    ext_refs: {},
    meta: {},
    total_cost: 0,
    created_at: '',
    updated_at: '',
    accounting_date: '',
    total_rev: 0,
  }
}

function maybeEmitCreate(line: CostLine) {
  if (createdOnce.has(line)) return
  createdOnce.add(line)

  const payload = line
  loggedEmit('create-line', payload)

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
  const stockId = (line.ext_refs as Record<string, unknown>)?.stock_id
  console.log('DEBUG: isNegativeStock - stockId:', stockId, 'type:', typeof stockId, 'negativeStockIds:', props.negativeStockIds)
  return props.negativeStockIds?.includes(stockId as string) ?? false
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
    return kind === 'adjust' || kind === 'material'
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

// Placeholder for columns - will be defined later
const columns = computed(() => [])

</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-4 py-2">
      <button
        class="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        type="button" aria-haspopup="dialog" :aria-expanded="showShortcuts ? 'true' : 'false'"
        @click="showShortcuts = true" :title="shortcutsTitle">
        <HelpCircle class="w-4 h-4" />
        <span>Shortcuts</span>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto overflow-x-hidden" tabindex="0" @keydown="onKeydown" ref="containerRef">
      <DataTable class="smart-costlines-table" :columns="columns as any" :data="displayLines" :hide-footer="true"
        @rowClick="
          (row: any) => handleRowClick(row as CostLine, (displayLines as any).indexOf(row))
        " />
    </div>

    <div v-if="!props.readOnly" class="px-4 py-2">
      <Button variant="default" size="sm" @click="handleAddLine" aria-label="Add Row"
        data-automation-id="cost-lines-add-row">
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
