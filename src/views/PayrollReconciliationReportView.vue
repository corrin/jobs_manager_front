<template>
  <AppLayout>
    <div class="w-full h-full flex flex-col overflow-hidden">
      <div class="flex-1 overflow-y-auto p-0">
        <div class="max-w-7xl mx-auto py-8 px-2 md:px-8 flex flex-col gap-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-3xl font-extrabold text-indigo-700 flex items-center gap-3">
              <Scale class="w-8 h-8 text-indigo-400" />
              Payroll Reconciliation
            </h1>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                @click="exportToCsv"
                :disabled="loading || !data"
                class="text-sm px-4 py-2"
              >
                <Download class="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="default"
                @click="refreshData"
                :disabled="loading"
                class="text-sm px-4 py-2"
              >
                <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
                Refresh
              </Button>
            </div>
          </div>

          <!-- Date Range Filters -->
          <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div class="flex flex-wrap items-center gap-4">
              <div class="flex items-center gap-2">
                <label for="start-date" class="text-sm font-medium text-gray-700">
                  Start Date:
                </label>
                <input
                  id="start-date"
                  v-model="dateRange.startDate"
                  type="date"
                  class="rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  @change="loadData"
                />
              </div>
              <div class="flex items-center gap-2">
                <label for="end-date" class="text-sm font-medium text-gray-700"> End Date: </label>
                <input
                  id="end-date"
                  v-model="dateRange.endDate"
                  type="date"
                  class="rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  @change="loadData"
                />
              </div>
              <div class="flex gap-2">
                <Button variant="outline" size="sm" @click="setDateRange('thisFinancialYear')">
                  This FY
                </Button>
                <Button variant="outline" size="sm" @click="setDateRange('lastFinancialYear')">
                  Last FY
                </Button>
                <Button variant="outline" size="sm" @click="setDateRange('last30Weeks')">
                  Last 30 Weeks
                </Button>
              </div>
            </div>
          </div>

          <!-- Summary Cards -->
          <div v-if="data" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Xero Total</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ formatCurrency(data.grand_totals.xero_gross) }}
                  </p>
                </div>
                <DollarSign class="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">JM Total</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ formatCurrency(data.grand_totals.jm_cost) }}
                  </p>
                </div>
                <DollarSign class="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Difference</p>
                  <p
                    class="text-2xl font-bold"
                    :class="data.grand_totals.diff < 0 ? 'text-red-600' : 'text-green-600'"
                  >
                    {{ formatCurrency(data.grand_totals.diff) }}
                    <span class="text-sm font-normal">
                      ({{ data.grand_totals.diff_pct.toFixed(1) }}%)
                    </span>
                  </p>
                </div>
                <DollarSign
                  class="h-8 w-8"
                  :class="data.grand_totals.diff < 0 ? 'text-red-500' : 'text-green-500'"
                />
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-12">
            <RefreshCw class="h-8 w-8 animate-spin text-indigo-500" />
            <span class="ml-2 text-lg text-gray-600">Loading payroll reconciliation data...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center">
              <AlertCircle class="h-5 w-5 text-red-400 mr-2" />
              <span class="text-red-800">{{ error }}</span>
            </div>
          </div>

          <!-- Heatmap will go here in next task -->
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { Scale, Download, RefreshCw, AlertCircle, DollarSign } from 'lucide-vue-next'
import { useFinancialYear } from '@/composables/useFinancialYear'
import {
  fetchPayrollReconciliation,
  exportPayrollReconciliationCsv,
  type PayrollReconciliationResponse,
} from '@/services/payroll-reconciliation-report.service'
import { formatCurrency } from '@/utils/string-formatting'
import { toLocalDateString } from '@/utils/dateUtils'
import { toast } from 'vue-sonner'

const { getDateRange } = useFinancialYear()

const loading = ref(false)
const error = ref<string | null>(null)
const data = ref<PayrollReconciliationResponse | null>(null)

const dateRange = ref({
  startDate: '',
  endDate: '',
})

function setDateRange(preset: 'thisFinancialYear' | 'lastFinancialYear' | 'last30Weeks') {
  if (preset === 'last30Weeks') {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30 * 7)
    dateRange.value = {
      startDate: toLocalDateString(start),
      endDate: toLocalDateString(end),
    }
  } else {
    const range = getDateRange(preset)
    dateRange.value = { startDate: range.startDate, endDate: range.endDate }
  }
  loadData()
}

async function loadData() {
  if (!dateRange.value.startDate || !dateRange.value.endDate) return
  loading.value = true
  error.value = null
  try {
    data.value = await fetchPayrollReconciliation(
      dateRange.value.startDate,
      dateRange.value.endDate,
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load report'
    error.value = msg
    toast.error(msg)
  } finally {
    loading.value = false
  }
}

function refreshData() {
  loadData()
}

function exportToCsv() {
  if (data.value) exportPayrollReconciliationCsv(data.value)
}

onMounted(() => {
  setDateRange('thisFinancialYear')
})
</script>
