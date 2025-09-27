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
import { HelpCircle, Trash2, Plus, AlertTriangle } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu'

import { useCompanyDefaultsStore } from '../../stores/companyDefaults'
import { useCostLineCalculations } from '../../composables/useCostLineCalculations'
import { useCostLineAutosave } from '../../composables/useCostLineAutosave'
import { useGridKeyboardNav } from '../../composables/useGridKeyboardNav'
import { costlineService } from '../../services/costline.service'
import { api } from '../../api/client'

import { schemas } from '../../api/generated/api'
import type { z } from 'zod'

// Types from generated schemas
type CostLine = z.infer<typeof schemas.CostLine>
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
    // Allow editing of the kind field (Type)
    allowTypeEdit?: boolean
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
    allowTypeEdit: true,
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
  console.log(`📤 SmartCostLinesTable emitting event: ${event}`, args)
  return (emit as any)(event, ...args) // eslint-disable-line @typescript-eslint/no-explicit-any
}

// UI state
const selectedRowIndex = ref<number>(-1)
const containerRef = ref<HTMLElement | null>(null)
const showShortcuts = ref(false)
const showDescModal = ref(false)
const descModalLine = ref<CostLine | null>(null)
const pendingFocusNewRow = ref(false)

// Focus first editable input after a row has been added
watch(
  () => props.lines.length,
  async (len, prev) => {
    if (pendingFocusNewRow.value && len > prev) {
      pendingFocusNewRow.value = false
      selectedRowIndex.value = len - 1
      await nextTick()
      const el = containerRef.value?.querySelector(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled])',
      ) as HTMLElement | null
      el?.focus()
    }
  },
)

function handleAddLine() {
  pendingFocusNewRow.value = true
  loggedEmit('add-line')
}

// Local UI-only mapping: selected Item id per line (not persisted)
const selectedItemMap = new WeakMap<CostLine, string | null>()

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

// Company Defaults and calculations
const companyDefaultsStore = useCompanyDefaultsStore()
onMounted(() => {
  if (!companyDefaultsStore.isLoaded && !companyDefaultsStore.isLoading) {
    companyDefaultsStore.loadCompanyDefaults()
  }
})

const {
  apply,
  validateLine,
  isUnitCostEditable,
  isUnitRevenueEditable,
  onUnitRevenueManuallyEdited,
  onItemSelected,
  onKindChanged,
} = useCostLineCalculations({
  getCompanyDefaults: () => companyDefaultsStore.companyDefaults,
})

// Autosave
const autosave = useCostLineAutosave({
  debounceMs: 600, // within spec 400–800ms
  saveFn: async (id: string, patch: PatchedCostLineCreateUpdate) => {
    await costlineService.updateCostLine(id, patch)
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

function formatMoney(n: number | undefined | null) {
  const val = Number(n ?? 0)
  return new Intl.NumberFormat('en-NZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
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

/**
 * Kind options and guards
 */
const kindOptions: KindOption[] = props.allowedKinds || ['material', 'time', 'adjust']

function canEditKindForLine(line: CostLine): boolean {
  if (props.readOnly) return false
  if (!props.allowTypeEdit) return false
  if (props.tabKind === 'actual') {
    // In "actual", lines usually originate from PO/timesheet; allow kind change only for "adjust"
    return ['material', 'adjust'].includes(String(line.kind))
  }
  return true
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
  if (field === 'quantity') {
    if (props.tabKind === 'actual') {
      // For actuals, quantity on non-adjust lines typically should not be edited (origin = system)
      const isMaterial = kind === 'material'
      const isConsumed =
        !!line.id || !!(line.ext_refs && (line.ext_refs as Record<string, unknown>).stock_id)
      return kind === 'adjust' || (isMaterial && isConsumed)
    }
    return true
  }
  // desc
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

const displayLines = computed(() =>
  props.lines.length === 0 ? [emptyLine.value] : [...props.lines],
)

const negativeIdsSig = computed(() => props.negativeStockIds?.slice().sort().join('|') || '')

/**
 * Build the column defs for DataTable
 */
const columns = computed(() => {
  void negativeIdsSig.value
  return [
    // Type / Kind
    {
      id: 'kind',
      header: 'Type',
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const badge = getKindBadge(line)

        if (!canEditKindForLine(line)) {
          return h(Badge, { class: `text-xs font-medium ${badge.class}` }, () => badge.label)
        }

        // Attractive dropdown with badges
        return h(
          DropdownMenu,
          { key: String(line.id) + line.kind },
          {
            default: () => [
              h('div', { onClick: (e: Event) => e.stopPropagation() }, [
                h(DropdownMenuTrigger, { asChild: true }, () =>
                  h(
                    Button,
                    {
                      variant: 'outline',
                      size: 'sm',
                      class: `h-7 px-2 py-1 text-xs ${badge.class} bg-opacity-60 hover:bg-opacity-80`,
                    },
                    () => badge.label,
                  ),
                ),
              ]),
              h(DropdownMenuContent, { align: 'start', class: 'w-40 z-50' }, () =>
                kindOptions.map((opt) =>
                  h(
                    DropdownMenuItem,
                    {
                      onClick: () => {
                        const newKind = opt as KindOption
                        if (newKind === String(line.kind)) return

                        if (line === emptyLine.value) {
                          // For the empty line, create a new object and update the ref
                          const newLine = { ...line, kind: newKind }
                          onKindChanged(newLine)

                          // Apply company defaults for time
                          if (newKind === 'time') {
                            Object.assign(newLine, {
                              unit_cost: companyDefaultsStore.companyDefaults?.wage_rate ?? 0,
                              unit_rev: companyDefaultsStore.companyDefaults?.charge_out_rate ?? 0,
                            })
                          } else {
                            // For material/adjust, recalculate unit_rev with markup
                            const derived = apply(newLine).derived
                            Object.assign(newLine, { unit_rev: derived.unit_rev })
                          }

                          emptyLine.value = newLine
                        } else {
                          // For existing lines, mutate as before
                          Object.assign(line, { kind: newKind })
                          onKindChanged(line)

                          // Apply company defaults for time
                          if (newKind === 'time') {
                            Object.assign(line, {
                              unit_cost: companyDefaultsStore.companyDefaults?.wage_rate ?? 0,
                              unit_rev: companyDefaultsStore.companyDefaults?.charge_out_rate ?? 0,
                            })
                          } else {
                            // For material/adjust, recalculate unit_rev with markup
                            const derived = apply(line).derived
                            Object.assign(line, { unit_rev: derived.unit_rev })
                          }

                          // Save if line has real ID and meets baseline
                          if (line.id && isLineReadyForSave(line)) {
                            console.log('Saving kind change:', line.id, newKind)
                            const patch: PatchedCostLineCreateUpdate = {
                              kind: newKind,
                              ...(newKind === 'time'
                                ? {
                                    unit_cost: companyDefaultsStore.companyDefaults?.wage_rate ?? 0,
                                    unit_rev:
                                      companyDefaultsStore.companyDefaults?.charge_out_rate ?? 0,
                                  }
                                : { unit_rev: Number(line.unit_rev) }),
                            }
                            const optimistic: Partial<CostLine> = { ...patch }
                            autosave.scheduleSave(line, patch, optimistic)
                          }
                        }
                      },
                    },
                    () => [
                      h(
                        'span',
                        {
                          class: `inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mr-2 ${
                            opt === 'time'
                              ? 'bg-blue-100 text-blue-800'
                              : opt === 'adjust'
                                ? 'bg-pink-100 text-pink-800'
                                : 'bg-green-100 text-green-800'
                          }`,
                        },
                        opt === 'time' ? 'Labour' : opt === 'adjust' ? 'Adjustment' : 'Material',
                      ),
                      h('span', { class: 'text-xs' }, opt),
                    ],
                  ),
                ),
              ),
            ],
          },
        )
      },
      meta: { editable: props.allowTypeEdit && !props.readOnly },
    },

    // Item (optional, UI-only) - moved to be first after Type
    props.showItemColumn
      ? {
          id: 'item',
          header: 'Item',
          cell: ({ row }: RowCtx) => {
            const line = displayLines.value[row.index]
            const model = selectedItemMap.get(line) || null
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
              return h('div', { class: 'min-w-[12rem] flex items-center gap-2' }, [
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
                  },
                  () => (model ? 'Change item' : 'Select item'),
                ),
                h('span', { class: 'text-xs text-slate-500 line-clamp-1' }, line.desc || ''),
              ])
            }

            return h('div', { class: 'min-w-[12rem]' }, [
              h(ItemSelect, {
                modelValue: model,
                disabled: !enabled,
                onClick: (e: Event) => e.stopPropagation(),
                'onUpdate:modelValue': async (val: string | null) => {
                  if (!enabled) return
                  selectedItemMap.set(line, val)
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
                      await props.consumeStockFn({ stockId: val, quantity: qty, unitCost, unitRev })
                    } catch {
                      toast.error('Failed to consume stock. Line not created.')
                      selectedItemMap.set(line, null)
                      return
                    }
                  }

                  let found = null
                  try {
                    found = await api.purchasing_rest_stock_retrieve({ params: { id: val } })
                  } catch (error) {
                    console.warn('Failed to fetch stock item details:', error)
                  }
                  if (found) {
                    Object.assign(line, { desc: found.description || '' })
                    Object.assign(line, { unit_cost: Number(found.unit_cost ?? 0) })
                    // Ensure quantity is set for new lines
                    if (line.quantity == null) Object.assign(line, { quantity: 1 })
                    if (kind !== 'time')
                      Object.assign(line, { unit_rev: apply(line).derived.unit_rev })
                    nextTick(() => {
                      if (!line.id && isLineReadyForSave(line)) maybeEmitCreate(line)
                    })
                  } else {
                    Object.assign(line, { desc: '' })
                    Object.assign(line, { unit_cost: 0 })
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
              }),
            ])
          },
          meta: { editable: !props.readOnly },
        }
      : null,

    // Description
    {
      id: 'desc',
      header: () => h('div', { class: 'desc-col' }, 'Description'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const kind = String(line.kind)
        const isNewLine = !line.id
        const isActualTab = props.tabKind === 'actual'
        const blockedFields = props.blockedFieldsByKind?.[kind as KindOption] || []
        const isFieldBlocked = blockedFields.includes('desc')
        const hasStockSelected = selectedItemMap.get(line) && selectedItemMap.get(line) !== ''
        const isBlocked =
          isActualTab && isNewLine && kind === 'material' && isFieldBlocked && !hasStockSelected
        const canEdit = canEditField(line, 'desc') && !isBlocked

        return h(
          'div',
          {
            class: 'desc-cell w-full',
            tabindex: 0,
            role: 'button',
            title: line.desc || '',
            onClick: (e: Event) => {
              e.stopPropagation()
              if (canEdit) {
                descModalLine.value = line
                showDescModal.value = true
              }
            },
            onKeydown: (e: KeyboardEvent) => {
              if ((e.key === 'Enter' || e.key === ' ') && canEdit) {
                e.preventDefault()
                descModalLine.value = line
                showDescModal.value = true
              }
            },
          },
          [
            h(
              'div',
              {
                class: [
                  'group',
                  'w-full',
                  'rounded-md border border-slate-200',
                  'px-2 py-2 text-sm text-gray-900',
                  'hover:border-slate-300',
                  'focus-within:ring-2 focus-within:ring-blue-500',
                  'cursor-text transition',
                  'max-w-[90ch]',
                ].join(' '),
              },
              [
                h(
                  'div',
                  {
                    class: 'line-clamp-2 overflow-hidden text-ellipsis break-words',
                  },
                  line.desc || '',
                ),
              ],
            ),
            ...(isBlocked
              ? [
                  h(
                    Badge,
                    { variant: 'secondary', class: 'mt-1 text-xs' },
                    () => 'Select stock first',
                  ),
                ]
              : []),
          ],
        )
      },
    },

    // Quantity
    {
      id: 'quantity',
      header: () => h('div', { class: 'col-8ch text-right' }, 'Quantity'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const kind = String(line.kind)
        const isNewLine = !line.id
        const isActualTab = props.tabKind === 'actual'
        const blockedFields = props.blockedFieldsByKind?.[kind as KindOption] || []
        const isFieldBlocked = blockedFields.includes('quantity')
        const hasStockSelected = selectedItemMap.get(line) && selectedItemMap.get(line) !== ''
        const isBlocked =
          isActualTab && isNewLine && kind === 'material' && isFieldBlocked && !hasStockSelected

        return [
          h('div', { class: 'col-8ch' }, [
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
      header: () => h('div', { class: 'col-8ch text-right' }, 'Unit Cost'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const kind = String(line.kind)
        const isNewLine = !line.id
        const isActualTab = props.tabKind === 'actual'
        const blockedFields = props.blockedFieldsByKind?.[kind as KindOption] || []
        const isFieldBlocked = blockedFields.includes('unit_cost')
        const hasStockSelected = selectedItemMap.get(line) && selectedItemMap.get(line) !== ''
        const isBlocked =
          isActualTab && isNewLine && kind === 'material' && isFieldBlocked && !hasStockSelected
        const editable = canEditField(line, 'unit_cost') && !isBlocked
        const isTime = kind === 'time'
        const resolved = apply(line).derived
        return [
          h('div', { class: 'col-8ch' }, [
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
                  console.log('Creating new line from unit_cost edit:', line)
                  maybeEmitCreate(line)
                  return
                }

                if (!line.id || !isLineReadyForSave(line)) {
                  console.log('Skipping unit_cost save:', {
                    editable,
                    id: line.id,
                    ready: isLineReadyForSave(line),
                  })
                  return
                }

                console.log('Saving unit_cost change:', line.id, line.unit_cost)
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
      header: () => h('div', { class: 'col-8ch text-right' }, 'Unit Revenue'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const kind = String(line.kind)
        const isNewLine = !line.id
        const isActualTab = props.tabKind === 'actual'
        const blockedFields = props.blockedFieldsByKind?.[kind as KindOption] || []
        const isFieldBlocked = blockedFields.includes('unit_rev')
        const hasStockSelected = selectedItemMap.get(line) && selectedItemMap.get(line) !== ''
        const isBlocked =
          isActualTab && isNewLine && kind === 'material' && isFieldBlocked && !hasStockSelected
        const editable = canEditField(line, 'unit_rev') && !isBlocked
        const isTime = kind === 'time'
        const resolved = apply(line).derived
        return [
          h('div', { class: 'col-8ch' }, [
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
              onBlur: () => {
                if (!editable) return

                // Create new line if it doesn't have an ID yet and meets baseline criteria
                if (!line.id && isLineReadyForSave(line)) {
                  console.log('Creating new line from unit_rev edit:', line)
                  maybeEmitCreate(line)
                  return
                }

                if (!line.id || !isLineReadyForSave(line)) {
                  console.log('Skipping unit_rev save:', {
                    editable,
                    id: line.id,
                    ready: isLineReadyForSave(line),
                  })
                  return
                }

                console.log('Saving unit_rev change:', line.id, line.unit_rev)
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
      header: () => h('div', { class: 'col-12ch text-right' }, 'Total Cost'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const qty = Number(line.quantity || 0)
        const umc = Number(line.unit_cost ?? apply(line).derived.unit_cost ?? 0)
        const totalCost = String(line.kind) === 'time' ? qty * umc : qty * umc
        return h(
          'div',
          { class: 'col-12ch text-right font-medium numeric-text' },
          `$${formatMoney(totalCost)}`,
        )
      },
      meta: { editable: false },
    },

    // Total Revenue
    {
      id: 'total_rev',
      header: () => h('div', { class: 'col-12ch text-right' }, 'Total Revenue'),
      cell: ({ row }: RowCtx) => {
        const line = displayLines.value[row.index]
        const qty = Number(line.quantity ?? 0)
        const umr = Number(line.unit_rev ?? apply(line).derived.unit_rev ?? 0)
        const totalRev = qty * umr
        return h(
          'div',
          { class: 'col-12ch text-right font-medium numeric-text' },
          `$${formatMoney(totalRev)}`,
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

                console.log('🗑️ Delete button clicked for line:', {
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
                  console.log('🔍 Looking for local line in props.lines:', {
                    actualIndex,
                    foundLine: actualIndex >= 0 ? props.lines[actualIndex] : null,
                    searchedLine: line,
                  })

                  if (actualIndex >= 0) {
                    console.log('✅ Emitting delete-line with actualIndex:', actualIndex)
                    loggedEmit('delete-line', actualIndex)
                  } else {
                    // This is the auto-generated empty line - don't delete it, just clear it
                    console.log('⚠️ Auto-generated empty line - cannot delete, ignoring')
                    return
                  }
                  return
                }

                // For saved lines, ask for confirmation
                const confirmed = window.confirm('Delete this line? This action cannot be undone.')
                if (!confirmed) return
                console.log('✅ Emitting delete-line with line.id:', line.id)
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
    console.log('⌨️ Keyboard delete triggered for selectedRowIndex:', i)

    if (i >= 0 && i < displayLines.value.length) {
      const line = displayLines.value[i]
      console.log('🗑️ Keyboard delete for line:', {
        lineId: line.id,
        selectedIndex: i,
        lineDesc: line.desc,
        isLocalLine: !line.id,
      })

      if (line.id) {
        console.log('✅ Keyboard emitting delete-line with line.id:', line.id)
        loggedEmit('delete-line', line.id as string)
      } else {
        // Find the actual index in the original props.lines array
        const actualIndex = props.lines.findIndex((l) => l === line)
        console.log('🔍 Keyboard looking for local line in props.lines:', {
          actualIndex,
          foundLine: actualIndex >= 0 ? props.lines[actualIndex] : null,
        })

        if (actualIndex >= 0) {
          console.log('✅ Keyboard emitting delete-line with actualIndex:', actualIndex)
          loggedEmit('delete-line', actualIndex)
        } else {
          console.log('⚠️ Keyboard: Auto-generated empty line - cannot delete, ignoring')
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
      <Button variant="default" size="sm" @click="handleAddLine" aria-label="Add Row">
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

    <!-- Description Edit Dialog -->
    <Dialog :open="showDescModal" @update:open="showDescModal = $event">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Description</DialogTitle>
          <DialogDescription>Update the line description</DialogDescription>
        </DialogHeader>
        <div class="space-y-3">
          <Textarea
            v-if="descModalLine"
            :model-value="descModalLine?.desc || ''"
            class="w-full"
            rows="4"
            @update:model-value="
              (payload: string | number) => {
                const v = typeof payload === 'string' ? payload : String(payload)
                if (descModalLine) descModalLine.desc = v
              }
            "
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" @click="showDescModal = false">Cancel</Button>
          <Button
            size="sm"
            @click="
              () => {
                if (!descModalLine?.id || !isLineReadyForSave(descModalLine)) {
                  showDescModal = false
                  return
                }

                const patch: PatchedCostLineCreateUpdate = { desc: descModalLine.desc || '' }
                const optimistic: Partial<CostLine> = { desc: descModalLine.desc || '' }
                autosave.onBlurSave(descModalLine, patch, optimistic)
                showDescModal = false
              }
            "
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
