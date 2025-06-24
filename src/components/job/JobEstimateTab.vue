<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">
        Job Estimate
        <span v-if="isLoading" class="ml-2 text-sm text-gray-500">Loading...</span>
      </h2>
      <AddCostLineDropdown
        :disabled="isLoading"
        :wageRate="wageRate"
        :chargeOutRate="chargeOutRate"
        :materialsMarkup="materialsMarkup"
        @add-material="handleAddMaterial"
        @add-time="handleAddTime"
      />
    </div>
    <div class="flex gap-4 h-[600px] min-h-0">
      <div
        class="flex-[3] bg-white rounded-lg border border-gray-200 flex flex-col min-h-0 max-h-full"
      >
        <div class="flex-shrink-0 p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Estimate Details</h3>
        </div>
        <div class="flex-1 overflow-hidden">
          <CostLinesGrid
            :costLines="costLines"
            :showActions="true"
            @edit="handleEditCostLine"
            @delete="handleDeleteCostLine"
          />
        </div>
      </div>
      <div
        class="flex-[2] bg-gray-50 rounded-lg p-3 border border-gray-200 overflow-y-auto max-h-full min-h-0 flex flex-col"
      >
        <CostSetSummaryCard
          title="Estimate Summary"
          :summary="estimateSummary"
          :costLines="costLines"
          :isLoading="isLoading"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useCompanyDefaultsStore } from '@/stores/companyDefaults'
import AddCostLineDropdown from './AddCostLineDropdown.vue'
import CostLinesGrid from '@/components/shared/CostLinesGrid.vue'
import CostSetSummaryCard from '@/components/shared/CostSetSummaryCard.vue'
import { costlineService, type CostLineCreatePayload } from '@/services/costline.service'
import { fetchCostSet } from '@/services/costing.service'
import type { CostLine } from '@/types/costing.types'

interface Props {
  jobId: string
}

const props = defineProps<Props>()

const companyDefaultsStore = useCompanyDefaultsStore()
const companyDefaults = computed(() => companyDefaultsStore.companyDefaults)
const chargeOutRate = computed(() => companyDefaults.value?.charge_out_rate || 0)
const wageRate = computed(() => companyDefaults.value?.wage_rate || 0)
const materialsMarkup = computed(() => companyDefaults.value?.materials_markup || 0)

const costLines = ref<CostLine[]>([])
const isLoading = ref(false)

async function loadEstimate() {
  isLoading.value = true
  try {
    const costSet = await fetchCostSet(props.jobId, 'estimate')
    costLines.value = costSet.cost_lines.map((line) => ({
      ...line,
      quantity: typeof line.quantity === 'string' ? Number(line.quantity) : line.quantity,
      unit_cost: typeof line.unit_cost === 'string' ? Number(line.unit_cost) : line.unit_cost,
      unit_rev: typeof line.unit_rev === 'string' ? Number(line.unit_rev) : line.unit_rev,
    }))
  } catch (error) {
    // TODO: show error toast
    console.error('Failed to load estimate cost lines:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadEstimate()
})

const estimateSummary = computed(() => {
  let cost = 0
  let rev = 0
  let hours = 0
  for (const line of costLines.value) {
    const quantity = typeof line.quantity === 'string' ? Number(line.quantity) : line.quantity
    if (line.kind === 'time') {
      cost += quantity * Number(line.unit_cost)
      rev += quantity * Number(line.unit_rev)
      hours += quantity
    } else if (line.kind === 'material') {
      cost += quantity * Number(line.unit_cost)
      rev += quantity * Number(line.unit_rev)
    }
  }
  return {
    cost,
    rev,
    hours,
    created: undefined,
  }
})

async function handleAddMaterial(payload: CostLine) {
  if (!payload || payload.kind !== 'material') return
  isLoading.value = true
  try {
    const createPayload: CostLineCreatePayload = {
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
        quantity:
          typeof created.quantity === 'string' ? Number(created.quantity) : created.quantity,
        unit_cost:
          typeof created.unit_cost === 'string' ? Number(created.unit_cost) : created.unit_cost,
        unit_rev:
          typeof created.unit_rev === 'string' ? Number(created.unit_rev) : created.unit_rev,
      },
    ]
  } catch (error) {
    // TODO: show error toast
    console.error('Failed to add material:', error)
  } finally {
    isLoading.value = false
  }
}

async function handleAddTime(payload: CostLine) {
  if (!payload || payload.kind !== 'time') return
  isLoading.value = true
  try {
    const createPayload: CostLineCreatePayload = {
      kind: 'time',
      desc: payload.desc,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost ?? wageRate.value,
      unit_rev: payload.unit_rev ?? chargeOutRate.value,
      ext_refs: payload.ext_refs,
      meta: payload.meta,
    }
    const created = await costlineService.createCostLine(props.jobId, 'estimate', createPayload)
    costLines.value = [
      ...costLines.value,
      {
        ...created,
        quantity:
          typeof created.quantity === 'string' ? Number(created.quantity) : created.quantity,
        unit_cost:
          typeof created.unit_cost === 'string' ? Number(created.unit_cost) : created.unit_cost,
        unit_rev:
          typeof created.unit_rev === 'string' ? Number(created.unit_rev) : created.unit_rev,
      },
    ]
  } catch (error) {
    // TODO: show error toast
    console.error('Failed to add time:', error)
  } finally {
    isLoading.value = false
  }
}

const editingCostLine = ref<CostLine | null>(null)

function handleEditCostLine(line: CostLine) {
  editingCostLine.value = line
  // Aqui você pode abrir um modal de edição, etc.
  // Exemplo: showEditModal.value = true
}

async function handleDeleteCostLine(line: CostLine) {
  if (!line.id) return
  isLoading.value = true
  try {
    await costlineService.deleteCostLine(line.id)
    costLines.value = costLines.value.filter((l) => l.id !== line.id)
  } catch (error) {
    // TODO: show error toast
    console.error('Failed to delete cost line:', error)
  } finally {
    isLoading.value = false
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
