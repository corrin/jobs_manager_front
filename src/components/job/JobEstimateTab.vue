<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">
        Job Estimate
        <span v-if="isLoading" class="ml-2 text-sm text-gray-500">Loading...</span>
      </h2>
      <div class="flex space-x-2">
        <button title="Add new item (Shift+N)"></button>
        <button class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"></button>
      </div>
    </div>

    <div class="flex gap-4 h-full">
      <div class="flex-[3] bg-white rounded-lg border border-gray-200 flex flex-col min-h-0">
        <!-- grid removed -->
      </div>

      <div
        class="flex-[2] bg-gray-50 rounded-lg p-3 border border-gray-200 overflow-y-auto max-h-96"
      >
        <CostSetSummaryCard
          title="Estimate Summary"
          :summary="estimateSummary"
          :costLines="costLines"
          :isLoading="isLoading"
        />
      </div>
    </div>

    <AddCostLineDropdown
      :disabled="isLoading"
      :wageRate="wageRate"
      :chargeOutRate="chargeOutRate"
      :materialsMarkup="props.companyDefaults?.materials_markup || 0"
      @add-material="handleAddMaterial"
      @add-time="handleAddTime"
    />
    <CostLinesGrid :costLines="costLines" :showActions="true" @edit="() => {}" @delete="() => {}" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AddCostLineDropdown from './AddCostLineDropdown.vue'
import CostLinesGrid from '@/components/shared/CostLinesGrid.vue'
import CostSetSummaryCard from '@/components/shared/CostSetSummaryCard.vue'
import { costlineService, type CostLineCreatePayload } from '@/services/costline.service'
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

const costLines = ref<CostLine[]>([])
const isLoading = ref(false)

const chargeOutRate = computed(() => props.companyDefaults?.charge_out_rate || 150)
const wageRate = computed(() => props.companyDefaults?.wage_rate || 60)

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
    created: undefined
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
      unit_cost: payload.unit_cost,
      unit_rev: payload.unit_rev,
      ext_refs: payload.ext_refs,
      meta: payload.meta,
    }
    const created = await costlineService.createCostLine(props.jobId, 'estimate', createPayload)
    costLines.value = [...costLines.value, created]
  } catch (error) {
    // TODO: exibir mensagem de erro para o usuário (ex: toast)
    console.error('Erro ao adicionar material:', error)
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
      unit_cost: payload.unit_cost,
      unit_rev: payload.unit_rev,
      ext_refs: payload.ext_refs,
      meta: payload.meta,
    }
    const created = await costlineService.createCostLine(props.jobId, 'estimate', createPayload)
    costLines.value = [...costLines.value, created]
  } catch (error) {
    // TODO: exibir mensagem de erro para o usuário (ex: toast)
    console.error('Erro ao adicionar tempo:', error)
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
