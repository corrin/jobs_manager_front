<template>
  <div class="job-estimate-tab h-full flex flex-col">
    <div class="flex-shrink-0 mb-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          Job Estimate
          <span v-if="isLoading" class="ml-2 text-sm text-gray-500">Loading...</span>
        </h2>
      </div>
    </div>
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 min-h-0">
      <main class="bg-white rounded-xl border border-slate-200 flex flex-col min-h-0">
        <div class="px-4 py-3 border-b border-slate-200">
          <h3 class="text-lg font-semibold text-gray-900">Estimate Details</h3>
        </div>
        <div class="flex-1 overflow-hidden">
          <SmartCostLinesTable
            :lines="costLines"
            tabKind="estimate"
            :readOnly="isLoading"
            :showItemColumn="true"
            :showSourceColumn="false"
            @delete-line="handleSmartDelete"
            @add-line="handleAddEmptyLine"
            @duplicate-line="(line) => handleAddMaterial(line)"
            @move-line="(index, direction) => {}"
            @create-line="handleCreateFromEmpty"
          />
        </div>
      </main>
      <aside class="space-y-4 lg:sticky lg:top-16 self-start">
        <div class="bg-white rounded-xl border border-slate-200">
          <div class="p-3 w-full">
            <CompactSummaryCard
              title="Estimate Summary"
              class="w-full"
              :summary="props.estimateSummaryFromBackend || estimateSummary"
              :costLines="costLines"
              :isLoading="isLoading"
              :revision="revision"
              @expand="showDetailedSummary = true"
            />
          </div>
        </div>
      </aside>
    </div>

    <!-- Detailed Summary Dialog -->
    <Dialog :open="showDetailedSummary" @update:open="showDetailedSummary = $event">
      <DialogContent class="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Detailed Estimate Summary</DialogTitle>
          <DialogDescription>Complete breakdown of estimate costs and revenue</DialogDescription>
        </DialogHeader>
        <div class="max-h-[60vh] overflow-y-auto">
          <CostSetSummaryCard
            title="Estimate Summary"
            :summary="props.estimateSummaryFromBackend || estimateSummary"
            :costLines="costLines"
            :isLoading="isLoading"
            :revision="revision"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDetailedSummary = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '../../utils/debug'

import { onMounted, ref, computed } from 'vue'
import { useCompanyDefaultsStore } from '../../stores/companyDefaults'
import SmartCostLinesTable from '../shared/SmartCostLinesTable.vue'
import CostSetSummaryCard from '../../components/shared/CostSetSummaryCard.vue'
import CompactSummaryCard from '../shared/CompactSummaryCard.vue'
import { costlineService } from '../../services/costline.service'
import { fetchCostSet } from '../../services/costing.service'
import { useSmartCostLineDelete } from '../../composables/useSmartCostLineDelete'
import { schemas } from '../../api/generated/api'
import type { z } from 'zod'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'

// Use generated API types
type CostLine = z.infer<typeof schemas.CostLine>
type CostSet = z.infer<typeof schemas.CostSet>
type CostLineCreateUpdate = z.infer<typeof schemas.CostLineCreateUpdate>

type Props = {
  jobId: string
  estimateSummaryFromBackend?: { cost: number; rev: number; hours: number; created?: string }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'cost-line-changed': []
}>()

const companyDefaultsStore = useCompanyDefaultsStore()
const companyDefaults = computed(() => companyDefaultsStore.companyDefaults)

const costLines = ref<CostLine[]>([])
const isLoading = ref(false)
const revision = ref(0)
const showDetailedSummary = ref(false)

async function loadEstimate() {
  isLoading.value = true
  try {
    const costSet: CostSet = await fetchCostSet(props.jobId, 'estimate')
    costLines.value = costSet.cost_lines.map((line) => ({
      ...line,
      quantity: line.quantity,
      unit_cost: line.unit_cost,
      unit_rev: line.unit_rev,
    }))
    revision.value = costSet.rev || 0
  } catch (error) {
    debugLog('Failed to load estimate cost lines:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadEstimate()
})

const estimateSummary = computed(() => {
  if (props.estimateSummaryFromBackend) {
    return {
      ...props.estimateSummaryFromBackend,
      profitMargin: props.estimateSummaryFromBackend.rev - props.estimateSummaryFromBackend.cost,
    }
  }
  let cost = 0
  let rev = 0
  let hours = 0
  for (const line of costLines.value) {
    const quantity = line.quantity || 0
    const unitCost = line.unit_cost || 0
    const unitRev = line.unit_rev || 0

    if (line.kind === 'time') {
      cost += quantity * unitCost
      rev += quantity * unitRev
      hours += quantity
    } else if (line.kind === 'material') {
      cost += quantity * unitCost
      rev += quantity * unitRev
    } else if (line.kind === 'adjust') {
      cost += quantity * unitCost
      rev += quantity * unitRev
    }
  }
  return {
    cost,
    rev,
    hours,
    profitMargin: rev - cost,
    created: undefined,
  }
})

// Use the smart delete composable
const { handleSmartDelete } = useSmartCostLineDelete({
  costLines,
  onCostLineChanged: () => emit('cost-line-changed'),
  isLoading,
})

async function handleAddMaterial(payload: CostLine) {
  if (!isCompanyDefaultsReady.value) {
    toast.error('Company defaults not loaded yet.')
    return
  }
  if (!payload || payload.kind !== 'material') return
  isLoading.value = true
  toast.info('Adding material cost line...', { id: 'add-material' })
  try {
    const createPayload: CostLineCreateUpdate = {
      kind: 'material',
      desc: payload.desc,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost ?? 0,
      unit_rev: payload.unit_rev ?? 0,
      ext_refs: payload.ext_refs,
      meta: payload.meta,
    }
    const created = await costlineService.createCostLine(props.jobId, 'estimate', createPayload)
    costLines.value = [
      ...costLines.value,
      {
        ...created,
        quantity: created.quantity,
        unit_cost: created.unit_cost,
        unit_rev: created.unit_rev,
      },
    ]
    toast.success('Material cost line added!')
    emit('cost-line-changed')
  } catch (error) {
    toast.error('Failed to add material cost line.')
    debugLog('Failed to add material:', error)
  } finally {
    isLoading.value = false
    toast.dismiss('add-material')
  }
}

const isCompanyDefaultsReady = computed(
  () => !!companyDefaults.value && companyDefaultsStore.isLoaded,
)

// Add empty line to the grid (UI-only, not persisted until user fills baseline data)
function handleAddEmptyLine() {
  const newLine: CostLine = {
    __localId: crypto.randomUUID(), // Temporary local ID for tracking
    id: '', // empty ID indicates unsaved line
    kind: 'material',
    desc: '',
    quantity: 1,
    unit_cost: null,
    unit_rev: null,
    total_cost: 0,
    total_rev: 0,
    ext_refs: {},
    meta: {},
  }
  costLines.value = [...costLines.value, newLine]
}

// Handle creating a new line from an empty line that meets baseline criteria
async function handleCreateFromEmpty(line: CostLine) {
  if (!isCompanyDefaultsReady.value) {
    toast.error('Company defaults not loaded yet.')
    return
  }

  console.log('Creating cost line from empty line:', line)

  try {
    const createPayload: CostLineCreateUpdate = {
      kind: line.kind as 'material' | 'time' | 'adjust',
      desc: line.desc || '',
      quantity: line.quantity || 1,
      unit_cost: line.unit_cost ?? 0,
      unit_rev: line.unit_rev ?? 0,
      ext_refs: line.ext_refs || {},
      meta: line.meta || {},
    }

    const created = await costlineService.createCostLine(props.jobId, 'estimate', createPayload)

    // Replace the empty line with the created one
    const index = costLines.value.findIndex((l) => l === line)
    if (index !== -1) {
      costLines.value[index] = created
    }

    emit('cost-line-changed')
    toast.success('Cost line created!')
    console.log('✅ Successfully created cost line:', created)
  } catch (error) {
    toast.error('Failed to create cost line.')
    console.error('❌ Failed to create cost line:', error)
  }
}
</script>

<style scoped>
:deep(.ag-theme-custom) {
  font-size: 13px;
  font-family:
    'Segoe UI',
    system-ui,
    -apple-system,
    sans-serif;
}

:deep(.ag-theme-custom .ag-header-cell) {
  font-weight: 700;
  background: #181f2a !important;
  color: #f3f4f6 !important;
  border-bottom: 1.5px solid #334155 !important;
  padding: 0 8px;
}

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

:deep(.ag-theme-custom .ag-body-horizontal-scroll) {
  height: 14px !important;
}

:deep(.ag-theme-custom .ag-body-vertical-scroll) {
  width: 14px !important;
}

:deep(.text-center) {
  justify-content: center;
}

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

:deep(.ag-theme-custom .ag-header-cell-label) {
  justify-content: flex-start;
  padding-left: 0;
  width: 100%;
}

@media (max-width: 1024px) {
  :deep(.ag-theme-custom) {
    font-size: 12px;
  }

  :deep(.ag-theme-custom .ag-header-cell),
  :deep(.ag-theme-custom .ag-cell) {
    padding: 0 4px;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='meta.labour_minutes']),
  :deep(.ag-theme-custom .ag-cell[col-id='meta.labour_minutes']) {
    display: none;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='meta.item_cost']),
  :deep(.ag-theme-custom .ag-cell[col-id='meta.item_cost']) {
    display: none;
  }
}

@media (max-width: 640px) {
  :deep(.ag-theme-custom) {
    font-size: 11px;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='category']),
  :deep(.ag-theme-custom .ag-cell[col-id='category']) {
    display: none;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='actions']),
  :deep(.ag-theme-custom .ag-cell[col-id='actions']) {
    display: none;
  }
}
</style>
