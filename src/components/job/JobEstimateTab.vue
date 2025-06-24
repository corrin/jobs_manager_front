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
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Summary</h3>

        <div class="space-y-2 mb-3">
          <div class="bg-blue-50 p-2 rounded border border-blue-200">
            <div class="flex justify-between items-center">
              <div class="text-xs font-medium text-blue-800">Labour Cost</div>
              <div class="text-sm font-bold text-blue-900">
                {{ formatCurrency(totalLabourCost) }}
              </div>
            </div>
            <div class="text-xs text-blue-600">
              {{ totalLabourHours.toFixed(1) }}h × ${{ wageRate }}/h (internal)
            </div>
          </div>

          <div class="bg-green-50 p-2 rounded border border-green-200">
            <div class="flex justify-between items-center">
              <div class="text-xs font-medium text-green-800">Material Cost</div>
              <div class="text-sm font-bold text-green-900">
                {{ formatCurrency(materialCostBeforeMarkup) }}
              </div>
            </div>
            <div class="text-xs text-green-600">Total material costs</div>
          </div>

          <div class="bg-orange-50 p-2 rounded border border-orange-200">
            <div class="flex justify-between items-center">
              <div class="text-xs font-medium text-orange-800">Labour Revenue</div>
              <div class="text-sm font-bold text-orange-900">
                {{ formatCurrency(labourHoursCost) }}
              </div>
            </div>
            <div class="text-xs text-orange-600">
              {{ totalLabourHours.toFixed(1) }}h × ${{ chargeOutRate }}/h
            </div>
          </div>

          <div class="bg-yellow-50 p-2 rounded border border-yellow-200">
            <div class="flex justify-between items-center">
              <div class="text-xs font-medium text-yellow-800">Material Revenue</div>
              <div class="text-sm font-bold text-yellow-900">
                {{ formatCurrency(materialCostAfterMarkup) }}
              </div>
            </div>
            <div class="text-xs text-yellow-600">{{ materialMarkupPercent }}% markup</div>
          </div>

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
import CostLinesGrid from './CostLinesGrid.vue'
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
const materialMarkupPercent = computed(() => {
  const markup = props.companyDefaults?.materials_markup || 0.2
  return markup * 100
})
const wageRate = computed(() => props.companyDefaults?.wage_rate || 60)

const totalLabourHours = computed(() => {
  console.log(
    '⏰ Labour calculation - Lines:',
    costLines.value.filter((line) => line.kind === 'time').length,
  )

  const totalHours = costLines.value
    .filter((line) => line.kind === 'time')
    .reduce((total, line) => {
      const totalCost = parseFloat(String(line.total_cost)) || 0
      const wageRateValue = wageRate.value || 32

      const hoursForLine = wageRateValue > 0 ? totalCost / wageRateValue : 0

      console.log(
        `Line ${line.id}: total_cost=${totalCost} ÷ wage_rate=${wageRateValue} = ${hoursForLine}h`,
      )
      return total + hoursForLine
    }, 0)

  console.log('⏰ Labour calculation - Total hours from DB fields:', totalHours)
  return totalHours
})

const labourHoursCost = computed(() => {
  const cost = totalLabourHours.value * chargeOutRate.value
  console.log(
    '💰 Labour Hours Cost calculation - Hours:',
    totalLabourHours.value,
    'Rate:',
    chargeOutRate.value,
    'Cost:',
    cost,
  )
  return cost
})

const totalLabourCost = computed(() => {
  const cost = totalLabourHours.value * wageRate.value
  console.log(
    '💼 Total Labour Cost calculation - Hours:',
    totalLabourHours.value,
    'Wage:',
    wageRate.value,
    'Cost:',
    cost,
  )
  return cost
})

const materialCostBeforeMarkup = computed(() => {
  return costLines.value
    .filter((line) => line.meta?.total_cost && !line.meta?.labour_minutes)
    .reduce((total, line) => total + parseFloat(String(line.meta?.total_cost || 0)), 0)
})

const materialCostAfterMarkup = computed(() => {
  const markup = materialMarkupPercent.value / 100
  return materialCostBeforeMarkup.value * (1 + markup)
})

const finalCost = computed(() => {
  return labourHoursCost.value + materialCostAfterMarkup.value
})

function handleAddMaterial(payload: CostLine) {
  console.log('Material payload received in parent:', payload)
}

function handleAddTime(payload: CostLine) {
  console.log('Time payload received in parent:', payload)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
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
