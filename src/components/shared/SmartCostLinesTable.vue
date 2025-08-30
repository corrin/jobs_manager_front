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
import { HelpCircle, MoreVertical, Copy, Trash2, Plus } from 'lucide-vue-next'
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
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'

import { useCompanyDefaultsStore } from '../../stores/companyDefaults'
import { useCostLineCalculations } from '../../composables/useCostLineCalculations'
import { useCostLineAutosave } from '../../composables/useCostLineAutosave'
import { useGridKeyboardNav } from '../../composables/useGridKeyboardNav'
import { costlineService } from '../../services/costline.service'

import { schemas } from '../../api/generated/api'
import type { z } from 'zod'

// Types from generated schemas
type CostLine = z.infer<typeof schemas.CostLine>
type PatchedCostLineCreateUpdate = z.infer<typeof schemas.PatchedCostLineCreateUpdate>

type TabKind = 'estimate' | 'quote' | 'actual'
type KindOption = 'material' | 'time' | 'adjust'

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
  }>(),
  {
    readOnly: false,
    showItemColumn: true,
    showSourceColumn: false,
    allowTypeEdit: true,
  },
)

const emit = defineEmits<{
  'delete-line': [idOrIndex: string | number]
  'add-line': []
  'duplicate-line': [line: CostLine]
  'move-line': [index: number, direction: 'up' | 'down']
  'create-line': [line: CostLine]
}>()

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
  emit('add-line')
}

// Local UI-only mapping: selected Item id per line (not persisted)
const selectedItemMap = new WeakMap<CostLine, string | null>()

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

/**
 * Kind options and guards
 */
const kindOptions: KindOption[] = ['material', 'time', 'adjust']

function canEditKindForLine(line: CostLine): boolean {
  if (props.readOnly) return false
  if (!props.allowTypeEdit) return false
  if (props.tabKind === 'actual') {
    // In "actual", lines usually originate from PO/timesheet; allow kind change only for "adjust"
    return String(line.kind) === 'adjust'
  }
  return true
}

function canEditField(
  line: CostLine,
  field: 'desc' | 'quantity' | 'unit_cost' | 'unit_rev',
): boolean {
  if (props.readOnly) return false
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
      return kind === 'adjust'
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
 * Build the column defs for DataTable
 */
const columns = computed(() =>
  [
    // Type / Kind
    {
      id: 'kind',
      header: 'Type',
      cell: ({ row }: RowCtx) => {
        const line = props.lines[row.index]
        const badge = getKindBadge(line)

        if (!canEditKindForLine(line)) {
          return h(Badge, { class: `text-xs font-medium ${badge.class}` }, () => badge.label)
        }

        // Attractive dropdown with badges
        return h(DropdownMenu, null, {
          default: () => [
            h(DropdownMenuTrigger, { asChild: true }, () =>
              h(
                Button,
                {
                  variant: 'outline',
                  size: 'sm',
                  class: `h-7 px-2 py-1 text-xs ${badge.class} bg-opacity-60 hover:bg-opacity-80`,
                  onClick: (e: Event) => e.stopPropagation(),
                },
                () => badge.label,
              ),
            ),
            h(DropdownMenuContent, { align: 'start', class: 'w-40 z-50' }, () =>
              kindOptions.map((opt) =>
                h(
                  DropdownMenuItem,
                  {
                    onClick: () => {
                      const newKind = opt as KindOption
                      if (newKind === String(line.kind)) return

                      // Update kind and re-derive units
                      onKindChanged(line)
                      Object.assign(line, { kind: newKind })

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
        })
      },
      meta: { editable: props.allowTypeEdit && !props.readOnly },
    },

    // Description
    {
      id: 'desc',
      header: 'Description',
      cell: ({ row }: RowCtx) => {
        const line = props.lines[row.index]
        const canEdit = canEditField(line, 'desc')

        return h(
          'div',
          {
            class:
              'w-full max-w-full px-3 py-2 text-sm text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer',
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
                class: 'line-clamp-2 overflow-hidden text-ellipsis break-words max-w-[225px]',
                style: 'word-wrap: break-word; overflow-wrap: break-word;',
              },
              line.desc || '',
            ),
          ],
        )
      },
    },

    // Quantity
    {
      id: 'quantity',
      header: 'Quantity',
      cell: ({ row }: RowCtx) => {
        const line = props.lines[row.index]
        return h('div', { class: 'flex items-center justify-end gap-2' }, [
          h(Input, {
            type: 'number',
            step: String(String(line.kind) === 'time' ? 0.25 : 1),
            // Allow negative for adjustments: omit min attribute when 'adjust'
            ...(String(line.kind) === 'adjust' ? {} : { min: '0.0000001' }),
            modelValue: line.quantity,
            disabled: !canEditField(line, 'quantity'),
            class: 'w-24 text-right',
            onClick: (e: Event) => e.stopPropagation(),
            'onUpdate:modelValue': (val: string | number) => {
              const num = Number(val)
              if (!Number.isNaN(num)) {
                Object.assign(line, { quantity: num })
              }
            },
            onBlur: () => {
              const validation = validateLine(line)
              if (!validation.isValid) {
                toast.error(validation.issues[0]?.message || 'Invalid quantity')
                return
              }
              // Create new line if it doesn't have an ID yet and meets baseline criteria
              if (!line.id && isLineReadyForSave(line)) {
                console.log('Creating new line from empty:', line)
                // Trigger creation via parent component
                emit('create-line', line)
                return
              }

              // Only save existing lines that meet baseline criteria
              if (!line.id || !isLineReadyForSave(line)) {
                console.log('Skipping quantity save - no ID or not ready:', {
                  id: line.id,
                  ready: isLineReadyForSave(line),
                })
                return
              }

              console.log('Saving quantity change:', line.id, line.quantity)
              const qtyNum = Number(line.quantity || 0)
              const patch: PatchedCostLineCreateUpdate = { quantity: qtyNum }
              const optimistic: Partial<CostLine> = { quantity: qtyNum }
              autosave.onBlurSave(line, patch, optimistic)
            },
          }),
          // unit suffix is handled by dedicated Unit column for alignment
          null,
        ])
      },
    },
    {
      id: 'unit',
      header: 'Unit',
      cell: ({ row }: RowCtx) => {
        const line = props.lines[row.index]
        return h(
          'div',
          { class: 'text-right text-xs text-gray-500' },
          String(line.kind) === 'time' ? 'hrs' : '',
        )
      },
      meta: { editable: false },
    },

    // Unit Cost
    {
      id: 'unit_cost',
      header: 'Unit Cost',
      cell: ({ row }: RowCtx) => {
        const line = props.lines[row.index]
        const editable = canEditField(line, 'unit_cost')
        const isTime = String(line.kind) === 'time'
        const resolved = apply(line).derived
        return h(Input, {
          type: 'number',
          step: '0.01',
          min: '0',
          modelValue: isTime ? resolved.unit_cost : (line.unit_cost ?? ''),
          disabled: !editable,
          class: 'w-28 text-right',
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
                if (String(line.kind) !== 'time') {
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
              emit('create-line', line)
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
              ...(String(line.kind) !== 'time' ? { unit_rev: Number(derived.unit_rev) } : {}),
            }
            const optimistic: Partial<CostLine> = { ...patch }
            autosave.onBlurSave(line, patch, optimistic)
          },
        })
      },
    },

    // Unit Revenue
    {
      id: 'unit_rev',
      header: 'Unit Revenue',
      cell: ({ row }: RowCtx) => {
        const line = props.lines[row.index]
        const editable = canEditField(line, 'unit_rev')
        const isTime = String(line.kind) === 'time'
        const resolved = apply(line).derived
        return h(Input, {
          type: 'number',
          step: '0.01',
          min: '0',
          modelValue: isTime ? resolved.unit_rev : (line.unit_rev ?? ''),
          disabled: !editable,
          class: 'w-28 text-right',
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
              emit('create-line', line)
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
        })
      },
    },

    // Total Cost
    {
      id: 'total_cost',
      header: 'Total Cost',
      cell: ({ row }: RowCtx) => {
        const line = props.lines[row.index]
        const d = apply(line).derived
        return h('div', { class: 'text-right font-medium' }, `$${formatMoney(d.total_cost)}`)
      },
      meta: { editable: false },
    },

    // Total Revenue
    {
      id: 'total_rev',
      header: 'Total Revenue',
      cell: ({ row }: RowCtx) => {
        const line = props.lines[row.index]
        const d = apply(line).derived
        return h('div', { class: 'text-right font-medium' }, `$${formatMoney(d.total_rev)}`)
      },
      meta: { editable: false },
    },

    // Item (optional, UI-only)
    props.showItemColumn
      ? {
          id: 'item',
          header: 'Item',
          cell: ({ row }: RowCtx) => {
            const line = props.lines[row.index]
            const model = selectedItemMap.get(line) || null
            const enabled =
              String(line.kind) !== 'time' &&
              !props.readOnly &&
              (props.tabKind !== 'actual' || String(line.kind) === 'adjust')
            return h(ItemSelect, {
              modelValue: model,
              disabled: !enabled,
              onClick: (e: Event) => e.stopPropagation(),
              'onUpdate:modelValue': (val: string | null) => {
                if (!enabled) return
                selectedItemMap.set(line, val)
                onItemSelected(line) // reset unit_rev override on item change
              },
              // bridge ItemSelect's prefill outputs
              'onUpdate:description': (desc: string) => {
                if (!enabled) return
                Object.assign(line, { desc })
              },
              'onUpdate:unit_cost': (cost: number | null) => {
                if (!enabled) return
                Object.assign(line, { unit_cost: Number(cost ?? 0) })
              },
            })
          },
          meta: { editable: !props.readOnly },
        }
      : null,

    // Source (optional, read-only)
    props.showSourceColumn
      ? {
          id: 'source',
          header: 'Source',
          cell: ({ row }: RowCtx) => {
            const line = props.lines[row.index]
            if (!props.sourceResolver) return h('span', { class: 'text-gray-400 text-sm' }, '-')
            const resolved = props.sourceResolver(line)
            if (!resolved || !resolved.visible)
              return h('span', { class: 'text-gray-400 text-sm' }, '-')

            return h(
              'span',
              {
                class:
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer select-none',
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
            )
          },
          meta: { editable: false },
        }
      : null,

    // Actions (delete)
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: RowCtx) => {
        const line = props.lines[row.index]
        const disabled = !!props.readOnly
        return h(DropdownMenu, null, {
          default: () => [
            h(DropdownMenuTrigger, { asChild: true }, () =>
              h(
                Button,
                {
                  variant: 'outline',
                  size: 'icon',
                  class: 'h-8 w-8',
                  disabled,
                  'aria-label': 'Actions',
                },
                () => h(MoreVertical, { class: 'w-4 h-4' }),
              ),
            ),
            h(DropdownMenuContent, { align: 'end', class: 'w-44' }, () => [
              h(
                DropdownMenuItem,
                {
                  onClick: () => emit('duplicate-line', line),
                  disabled,
                },
                () => [h(Copy, { class: 'w-4 h-4 mr-2' }), 'Duplicate'],
              ),
              h(DropdownMenuSeparator),
              h(
                DropdownMenuItem,
                {
                  class: 'text-red-600 focus:text-red-700',
                  onClick: () => {
                    if (disabled) return
                    const confirmed = window.confirm(
                      'Delete this line? This action cannot be undone.',
                    )
                    if (!confirmed) return
                    if (line.id) emit('delete-line', line.id as string)
                    else emit('delete-line', row.index)
                  },
                },
                () => [h(Trash2, { class: 'w-4 h-4 mr-2' }), 'Delete'],
              ),
            ]),
          ],
        })
      },
      meta: { editable: !props.readOnly },
    },
  ].filter(Boolean),
)

/**
 * Keyboard navigation
 */
const { onKeydown } = useGridKeyboardNav({
  getRowCount: () => props.lines.length,
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
    if (i >= 0 && i < props.lines.length) {
      emit('duplicate-line', props.lines[i])
    }
  },
  deleteSelected: () => {
    const i = selectedRowIndex.value
    if (i >= 0 && i < props.lines.length) {
      const line = props.lines[i]
      if (line.id) emit('delete-line', line.id as string)
      else emit('delete-line', i)
    }
  },
  moveSelectedUp: () => {
    const i = selectedRowIndex.value
    if (i > 0) emit('move-line', i, 'up')
  },
  moveSelectedDown: () => {
    const i = selectedRowIndex.value
    if (i >= 0 && i < props.lines.length - 1) emit('move-line', i, 'down')
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

      <Button
        v-if="!props.readOnly"
        variant="default"
        size="sm"
        class="ml-auto"
        @click="handleAddLine"
        aria-label="Add Line"
      >
        <Plus class="w-4 h-4 mr-1" /> Add Line
      </Button>
    </div>

    <div class="flex-1 overflow-y-auto" tabindex="0" @keydown="onKeydown" ref="containerRef">
      <DataTable
        class="smart-costlines-table"
        :columns="columns as any"
        :data="props.lines"
        :hide-footer="true"
        @rowClick="(row: any) => handleRowClick(row as CostLine, (props.lines as any).indexOf(row))"
      />
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
/* Layout and spacing (8px scale) */
.smart-costlines-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
}

/* First column sticky for usability (if DataTable structure supports) */
/* .smart-costlines-table :deep(tbody td:first-child),
.smart-costlines-table :deep(thead th:first-child) {
  position: sticky;
  left: 0;
  background: white;
  z-index: 5;
} */

.smart-costlines-table :deep(th),
.smart-costlines-table :deep(td) {
  padding: 8px 12px;
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

/* Focus ring for keyboard navigation */
.smart-costlines-table :deep(input:focus),
.smart-costlines-table :deep(button:focus),
.smart-costlines-table :deep(select:focus) {
  outline: none;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.6);
}
</style>
